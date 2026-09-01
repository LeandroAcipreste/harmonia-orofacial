/*
 * Espiral dourada com a marca no miolo.
 *
 * O vórtice inteiro é uma espiral logarítmica: r = R0 · e^(−k·θ). Essa
 * curva resolve a cena sozinha por causa de uma propriedade só dela:
 * girá-la por um ângulo dá exatamente o mesmo desenho que ampliá-la por
 * um fator. Então uma única animação, somar tempo a θ, produz ao mesmo
 * tempo o giro e o mergulho no túnel, e o desenho nunca sai de escala.
 *
 * Daí também vem o encadeamento sem emenda. Como cada volta é a anterior
 * ampliada por `razao`, basta distribuir os pontos uniformemente em θ
 * para que toda volta receba a mesma quantidade. Quando um ponto alcança
 * o miolo e volta para a borda de fora, a distribuição continua idêntica.
 * A emenda não aparece porque, estatisticamente, ela não existe.
 *
 * O jeito de desenhar veio da cena de nuvens do quadplex80: sprites
 * aditivos com `depthTest` desligado, ordem de desenho declarada na mão,
 * e uma textura de ruído que corrói o brilho para que nada fique regular
 * demais. Sem pós-processamento. O desfoque das voltas de fora é o
 * próprio sprite, que cresce e perde a borda conforme se aproxima, e
 * perde brilho na mesma conta em que ganha área.
 */

import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    Group,
    Mesh,
    MeshBasicMaterial,
    OrthographicCamera,
    PlaneGeometry,
    Points,
    RepeatWrapping,
    Scene,
    ShaderMaterial,
    SRGBColorSpace,
    TextureLoader,
    WebGLRenderer,
} from "../vendor/three.module.min.js";

const TAU = Math.PI * 2;

const RUIDO = new URL("../../assets/cnoise.png", import.meta.url).href;
const MARCA = new URL("../../assets/logo-hero.png", import.meta.url).href;

/*
 * A câmera é ortográfica e a menor dimensão da tela vale sempre 2
 * unidades. Assim o medalhão ocupa a mesma fatia da tela em qualquer
 * formato, e todo raio abaixo pode ser lido como fração de meia tela.
 */
const MARCA_DIAMETRO = 0.56;

const ESPIRAL = {
    /* Quanto o raio cresce a cada volta para fora. 1.165 é o que faz caber
       sete anéis entre a marca e a borda de cima, como na referência. */
    razao: 1.165,
    voltas: 17,
    /* Onde o primeiro anel encosta. Fica um dedo além da borda do
       medalhão, senão o dourado sobe por cima do ouro da moldura. */
    raioInterno: 0.33,
    fibras: 18,
    pontosPorFibra: 15000,
    pontosPorFibraMovel: 5000,
    /* Meia espessura do feixe e espessura de um fio, ambas em fração do
       raio. Sendo fração, a proporção se mantém volta após volta, que é o
       que faz o encadeamento passar despercebido. */
    faixa: 0.052,
    fio: 0.0034,
    trama: 0.010,
    desfoque: 165,
    /* Onde acaba o plano de foco, em meias-telas de raio. */
    raioNitido: 0.75,
    intensidade: 1.4,
    velocidade: 0.13,
    /* Fração de pontos que viram conta de luz sobre o feixe. */
    glints: 0.045,
    /*
     * Quantas vezes a cena pode pintar a tela em um quadro.
     *
     * Este é o número que decide se a espiral roda, e é o único ajuste
     * daqui que não é de gosto. O custo de um sprite cresce com o
     * quadrado do diâmetro, e nas voltas de fora o disco passa de cem
     * pixels de lado: sem teto, `pontosPorFibra` e `desfoque` se
     * multiplicam um pelo outro e a cena passa a pedir perto de oitenta
     * camadas de tela por quadro, que nenhuma placa entrega. O vértice
     * usa este número para derrubar pontos exatamente onde eles saem
     * caros — ver `cota` no VERTICE_FILAMENTO — e devolve aos que sobram
     * a luz dos que morreram, então a soma no quadro não muda: muda o
     * grão.
     *
     * Cinco camadas é onde o grão ainda não aparece. Subir engorda a
     * conta na mesma proporção; abaixo de três a névoa das bordas
     * começa a manchar.
     */
    cobertura: 5,
};

/*
 * Cores em espaço de tela, sem conversão nenhuma.
 *
 * Os materiais desta cena são `ShaderMaterial` crus, que não passam pelo
 * `colorspace_fragment` do three e portanto escrevem no framebuffer o
 * valor que a gente mandar. Converter para linear aqui escureceria tudo
 * pela metade sem dar erro nenhum. O único que passa pela conversão é o
 * PNG da marca, e esse fecha o ciclo sozinho.
 */
const CORES = {
    fundo: "#050b24",
    halo: "#020b1e",
    haloLateral: "#0b2450",
    ouroClaro: "#ffe8a6",
    ouroMedio: "#f3c24d",
    ouroFundo: "#b07d22",
    frio: "#7fb2ec",
    miolo: "#2a7fd8",
};

/*
 * Onde fica o plano de foco, contado em raios de buraco. Guardado como
 * razão, e não como número solto, porque o buraco muda de tamanho com a
 * janela: se o foco não andasse junto, a trama de fios só apareceria
 * nítida em uma largura de tela.
 */
const FOCO = ESPIRAL.raioNitido / ESPIRAL.raioInterno;

/* Ar entre a peça do centro e o primeiro anel, em pixel de CSS. É o que
   cabe o halo dourado do medalhão, que sai 46px pela sombra e some antes
   disso. Menos que isto e o primeiro anel encosta no ouro da moldura. */
const FOLGA_BURACO = 26;

const LARGURA_MOVEL = 768;
const PIXEL_RATIO_MAXIMO = 2;

/*
 * Escala de desenho, de 0 a 1.
 *
 * Fica em 1 e é para ficar. Abaixar isto desfoca a marca junto: ela mora
 * dentro deste mesmo canvas, e tem texto e um aro de ouro, que é o tipo
 * de coisa que não sobrevive a ser desenhada menor e ampliada de volta.
 * A espiral aguentaria; a marca não.
 *
 * Para baixar isto sem estragar a marca, o caminho é outro: desenhar a
 * espiral num alvo reduzido e compor a marca por cima na resolução
 * cheia, em duas passadas.
 *
 * Em 1 a cena é desenhada na resolução da tela. Abaixo disso ela é
 * desenhada menor e sobe na escala pelo navegador, e o que se ganha é
 * área pintada, que é o custo que pesa aqui: as voltas de fora são
 * discos de mais de cem pixels somando uns sobre os outros, e o preço de
 * um sprite cresce com o quadrado do diâmetro. Meia escala custa um
 * quarto.
 *
 * A imagem aguenta isso melhor que a maioria, porque não tem uma borda
 * dura sequer: é brilho macio de ponta a ponta. Se a cena engasgar em
 * alguma máquina, este é o primeiro número a baixar, para 0.7 ou 0.6.
 */
const ESCALA_RENDER = 1;

/*
 * Aqui existia um vigia que media o tempo de quadro e baixava a resolução
 * sozinho quando a média piorava. Ele saiu, e não deve voltar.
 *
 * O que ele media não era a placa: era a página. Rolar produz quadros
 * lentos, e o vigia lia isso como fraqueza de hardware, descia um degrau
 * de resolução e borrava a marca, que tem texto e um aro fino. Como o
 * degrau só descia, cada rolagem piorava a cena um pouco mais e nada
 * devolvia a nitidez até recarregar. O sintoma era exatamente esse:
 * começa perfeita e piora a cada vez que se mexe no scroll.
 *
 * Qualidade que se ajusta sozinha a partir de uma medida que a própria
 * interação contamina não é adaptação, é deterioração. Se esta cena
 * precisar ceder resolução em alguma máquina, que ceda por decisão
 * escrita em ESCALA_RENDER, igual para todo mundo e visível no código.
 */

/* Rotação fixa do conjunto. Só orienta onde cai o degrau da espiral, o
   ponto em que a volta de fora encontra a de dentro. */
const INCLINACAO = -0.62;
const ACHATAMENTO = 0.96;

const cor = (hex) => [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
];

const misturar = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
];

/*
 * Raio do buraco em unidades de cena.
 *
 * Aceita um elemento, e aí mede a peça de verdade que está no centro, ou
 * um número já em unidades, ou nada, e aí vale o padrão. Medir custa um
 * cálculo de layout forçado, então isto só roda no redimensionamento,
 * nunca por quadro.
 */
const medirBuraco = (buraco, pxPorUnidade) => {
    if (typeof buraco === "number") {
        return buraco;
    }

    if (!buraco || typeof buraco.getBoundingClientRect !== "function") {
        return ESPIRAL.raioInterno;
    }

    const caixa = buraco.getBoundingClientRect();

    /* Elemento ainda sem layout: o padrão evita uma espiral de raio zero,
       que colapsaria tudo num ponto no primeiro quadro. */
    if (!caixa.width) {
        return ESPIRAL.raioInterno;
    }

    return (caixa.width / 2 + FOLGA_BURACO) / pxPorUnidade;
};

/*
 * Gerador com semente, copiado da cena de nuvens. Vale a pena não usar
 * Math.random: com semente fixa, a mesma espiral sai em toda máquina e em
 * todo recarregamento, e duas capturas de tela podem ser comparadas.
 */
const semeado = (semente) => () => {
    semente = (1664525 * semente + 1013904223) % 4294967296;
    return semente / 4294967296;
};

const VERTICE_FILAMENTO = `
    precision highp float;

    attribute float aTheta;
    attribute float aFaixa;
    attribute vec3  aTrama;
    attribute float aSemente;
    attribute float aGlint;
    attribute vec3  aCor;
    /*
     * Posição do ponto na fila do desbaste, de 0 a 1. Não é sorteio: é
     * uma sequência áurea sobre a ordem em θ (ver criarFilamentos), de
     * modo que, para qualquer corte, quem sobra fica espalhado por igual
     * ao longo da fibra em vez de se juntar em grumos.
     */
    attribute float aRanque;

    uniform float uTempo;
    uniform float uVelocidade;
    uniform float uVoltas;
    uniform float uK;
    uniform float uR0;
    uniform float uFaixa;
    uniform float uFio;
    uniform float uDesfoque;
    uniform float uRaioNitido;
    uniform float uPxPorUnidade;
    uniform float uIntensidade;
    uniform float uCobertura;
    uniform vec3  uFrio;
    uniform sampler2D uRuido;

    varying vec3  vCor;
    varying float vDureza;
    varying float vAlfa;

    const float TAU = 6.2831853072;

    void main() {
        float thetaMax = TAU * uVoltas;
        float th = mod(aTheta + uTempo * uVelocidade, thetaMax);

        /* 0 na borda de fora, 1 no miolo. */
        float u = th / thetaMax;

        float r = uR0 * exp(-uK * th);

        float fioPx = max(1.4, r * uFio * uPxPorUnidade);

        /*
         * O desfoque vem do raio, não do número da volta.
         *
         * Numa foto assim o plano de foco cai sobre um anel, e tudo que
         * está para fora dele abre. Amarrar ao raio deixa o miolo cravado e
         * só as voltas de fora derretidas, com a passagem entre as duas
         * coisas acontecendo depressa. Amarrado à volta, o desfoque crescia
         * devagar e parelho, e a trama de fios sumia da tela inteira de uma
         * vez só.
         */
        float fora = max(0.0, (r - uRaioNitido) / (uR0 - uRaioNitido));
        float desfoquePx = uDesfoque * pow(fora, 1.4);

        /* A conta de luz quase não abre com o desfoque: é ela que segura a
           leitura de fio dentro das voltas moles de fora. */
        float tamanho = fioPx + desfoquePx * mix(1.0, 0.18, aGlint);

        /*
         * Desbaste por cobertura. É o que faz a cena caber na placa.
         *
         * A conta sai de uma exigência só: que todo anel pinte o mesmo
         * número de camadas sobre a tela, uCobertura, não importa o
         * tamanho que o desfoque deu ao sprite ali. Como todo anel recebe
         * a mesma quantidade de pontos, mas a área do anel cresce com r² e
         * a do sprite com tamanho², a fração que precisa continuar viva é
         * (r / tamanho)², medidos os dois em pixel. A constante que fecha
         * a igualdade é uCobertura, montada em criarFilamentos.
         *
         * O efeito é o que se quer e nada além. No miolo, onde o sprite é
         * um fio de dois pixels, a cota passa de 1 e ninguém morre: a
         * trama continua inteira, com todos os pontos que foram pedidos.
         * Nas voltas de fora, onde um disco de cem pixels custa duas mil
         * vezes mais que esse fio, sobra um ponto em cada cinco, e o
         * preço da volta cai na mesma conta.
         */
        float rPx = r * uPxPorUnidade;
        float cota = max(uCobertura * (rPx * rPx) / (tamanho * tamanho), 0.02);

        /*
         * A morte é gradual porque todo ponto atravessa todos os raios: um
         * corte seco faria cada um piscar ao cruzar o raio da sua cota, e
         * a espiral inteira ferveria.
         */
        float vivo = 1.0 - smoothstep(cota * 0.75, cota, aRanque);

        if (vivo <= 0.0) {
            /*
             * Fora do volume de recorte, e não apenas transparente. Zerar
             * o alfa não pouparia nada: a área continuaria sendo pintada,
             * e área é justamente o que se está economizando aqui. Assim o
             * ponto morre antes de virar fragmento.
             */
            gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
            gl_PointSize = 0.0;
            vCor = vec3(0.0);
            vDureza = 0.0;
            vAlfa = 0.0;
            return;
        }

        gl_PointSize = tamanho;

        /*
         * A trama tem frequência inteira de propósito. Como thetaMax é um
         * múltiplo inteiro de TAU, só assim o desvio de cada fio repete
         * exatamente ao dar a volta no mod, e o fio não salta de lugar
         * quando o ponto é reciclado.
         */
        float desvio = r * (aFaixa * uFaixa + aTrama.x * sin(aTrama.y * th + aTrama.z));
        vec2 p = vec2(cos(th), sin(th)) * (r + desvio);

        /* Mesma textura das nuvens, mesmo papel: quebrar a regularidade.
           Sem ela o anel fica com brilho de tubo de neon. A busca de
           textura fica abaixo do desbaste de propósito: é a instrução mais
           cara do vértice, e a essa altura a maioria dos pontos já saiu. */
        float ruido = texture2D(uRuido, vec2(th * 0.055, aFaixa * 0.25 + uTempo * 0.012)).g;
        float ganho = 0.55 + 0.85 * smoothstep(0.1, 0.9, ruido);

        /*
         * Espalhar a mesma luz numa área maior tem que custar brilho, senão
         * as voltas de fora viram uma parede branca. A conta é a razão das
         * áreas, puxada para perto de 1 porque desfoque de verdade também
         * soma a luz dos vizinhos, e a razão pura apaga demais.
         */
        float energia = mix((fioPx * fioPx) / (tamanho * tamanho), 1.0, 0.38);

        /*
         * Correção de densidade.
         *
         * Toda volta recebe a mesma quantidade de pontos, mas a área da
         * faixa cresce com o quadrado do raio, porque crescem juntas a
         * circunferência e a espessura. Sem corrigir, os anéis de dentro
         * recebem luz demais, somam além de 1 nos canais vermelho e verde
         * e estouram para branco: o ouro vira prata sem que nada dê erro.
         */
        float densidade = clamp(pow(r / uRaioNitido, 1.7), 0.16, 1.0);

        float entrada = smoothstep(0.0, 0.06, u);
        float saida = 1.0 - smoothstep(0.972, 1.0, u);

        vCor = mix(aCor, uFrio, smoothstep(0.90, 1.0, u) * 0.1);
        vDureza = 1.0 - clamp(desfoquePx / 5.0, 0.0, 1.0);
        /* Perfil dentro do feixe. Sem ele o anel é um chuvisco de
           espessura parelha; com ele vira corda, miolo aceso e beirada
           esfumada, que é como a referência lê. */
        float corda = 0.3 + 0.7 * (1.0 - aFaixa * aFaixa);

        /*
         * Quem sobra herda a luz de quem morreu, senão o desbaste apagaria
         * as voltas de fora. cota é a fração esperada de sobreviventes,
         * e o 0,875 é a meia banda do esmaecimento acima. Dividir por ela
         * devolve a mesma soma que havia antes do desbaste: o corte não
         * mexe no brilho da cena, só no grão dela.
         */
        float sobreviventes = clamp(cota * 0.875, 0.0, 1.0);

        vAlfa = uIntensidade * ganho * energia * densidade * corda * entrada * saida
              * mix(0.5, 1.0, aSemente) * mix(1.0, 2.4, aGlint)
              * vivo / sobreviventes;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
    }
`;

const FRAGMENTO_FILAMENTO = `
    precision highp float;

    varying vec3  vCor;
    varying float vDureza;
    varying float vAlfa;

    void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;

        /* Dureza 0 é uma bola de luz sem borda, que é como se vê um fio
           fora de foco. Dureza 1 é o ponto cravado do miolo. */
        float a = 1.0 - smoothstep(mix(0.0, 0.74, vDureza), 1.0, d);
        a *= a;

        gl_FragColor = vec4(vCor, a * vAlfa);
    }
`;

const VERTICE_QUADRO = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

/* O fundo ignora a câmera de propósito: escreve direto em coordenada de
   tela e cobre o quadro inteiro em qualquer formato, sem depender de o
   frustum ter sido atualizado antes. */
const VERTICE_FUNDO = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy * 2.0, 0.999, 1.0);
    }
`;

const FRAGMENTO_FUNDO = `
    precision highp float;

    uniform float uAspecto;
    uniform vec3  uFundo;
    uniform vec3  uHalo;
    uniform vec3  uHaloLateral;

    varying vec2 vUv;

    void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        p.x *= uAspecto;

        float d = length(p);
        vec3 c = uFundo + uHalo * exp(-d * d * 7.0);

        /* O azul grande da direita, que na referência é a volta de fora
           inteiramente fora de foco pegando a luz do miolo. */
        vec2 q = p - vec2(1.15, 0.14);
        c += uHaloLateral * exp(-dot(q, q) * 1.6);

        c *= 1.0 - 0.55 * smoothstep(0.55, 1.7, d);

        gl_FragColor = vec4(c, 1.0);
    }
`;

const FRAGMENTO_MIOLO = `
    precision highp float;

    uniform vec3  uCor;
    uniform float uForca;
    uniform float uConcentracao;

    varying vec2 vUv;

    void main() {
        float d = length(vUv - 0.5) * 2.0;
        gl_FragColor = vec4(uCor, exp(-d * d * uConcentracao) * uForca);
    }
`;

export const iniciarEspiralDourada = (canvas, opcoes = {}) => {
    if (!canvas) {
        return Promise.resolve(false);
    }

    let renderer;

    try {
        renderer = new WebGLRenderer({
            canvas,
            /*
             * Sem MSAA. Não há uma borda dura nesta cena inteira: é brilho
             * macio somando sobre brilho macio, que é exatamente o que a
             * amostragem múltipla não tem o que suavizar. O que ela faz
             * aqui é multiplicar a banda de memória do único passo que já
             * era o gargalo, porque esta é uma cena de pintar área.
             */
            antialias: false,
            preserveDrawingBuffer: true,
            alpha: false,
            powerPreference: "high-performance",
        });
    } catch (erro) {
        return Promise.resolve(false);
    }

    const movel = window.innerWidth < LARGURA_MOVEL;

    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_MAXIMO) * ESCALA_RENDER
    );
    renderer.setClearColor(0x000000, 1);

    const carregador = new TextureLoader();
    const texturar = (url) => new Promise((ok, falha) => carregador.load(url, ok, undefined, falha));

    /*
     * A marca é opcional porque o hero já tem a dela no HTML, com o texto
     * alternativo e a borda que acende no cursor. Desenhar a segunda aqui
     * só daria duas marcas empilhadas.
     */
    const comMarca = opcoes.marca !== false;

    return Promise.all([texturar(RUIDO), comMarca ? texturar(MARCA) : null])
        .then(([ruido, marca]) => {
            ruido.wrapS = ruido.wrapT = RepeatWrapping;

            if (marca) {
                marca.colorSpace = SRGBColorSpace;

                /* O PNG tem 640px e aparece com uns 300: sem filtragem
                   anisotrópica o texto da marca embaralha nos mipmaps. */
                marca.anisotropy = renderer.capabilities.getMaxAnisotropy();
            }

            montar({ renderer, canvas, ruido, marca, movel, opcoes });
            return true;
        })
        .catch(() => {
            renderer.dispose();
            return false;
        });
};

const montar = ({ renderer, canvas, ruido, marca, movel, opcoes }) => {
    const cena = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, -10, 10);

    const vortice = new Group();
    vortice.rotation.z = INCLINACAO;
    vortice.scale.y = ACHATAMENTO;
    cena.add(vortice);

    const fundo = criarFundo();
    const filamentos = criarFilamentos(ruido, movel);
    const miolo = criarMiolo();
    const brasao = marca ? criarMarca(marca) : null;

    cena.add(fundo, miolo);
    vortice.add(filamentos);

    /* Tudo com depthTest desligado, então a ordem é esta lista e mais nada. */
    fundo.renderOrder = 0;
    filamentos.renderOrder = 1;
    miolo.renderOrder = 2;

    if (brasao) {
        cena.add(brasao.aura, brasao.placa);
        brasao.aura.renderOrder = 3;
        brasao.placa.renderOrder = 4;
    }

    const relogio = { anterior: performance.now(), t: opcoes.tempoInicial ?? 0 };

    /*
     * Movimento reduzido não apaga a cena: ela desenha um quadro e para.
     * O quadro é sempre o mesmo, porque o gerador tem semente fixa.
     */
    const estatico = opcoes.reduzido === true;

    const desenhar = () => {
        filamentos.material.uniforms.uTempo.value = relogio.t;
        renderer.render(cena, camera);
    };

    const redimensionar = () => {
        const largura = Math.round(canvas.clientWidth || window.innerWidth);
        const altura = Math.round(canvas.clientHeight || window.innerHeight);

        /* Canvas ainda sem layout, ou aba em segundo plano: dimensionar
           agora gravaria o zero no buffer, e a cena voltaria vazia. */
        if (largura < 2 || altura < 2) {
            return;
        }

        renderer.setSize(largura, altura, false);

        const aspecto = largura / altura;
        const meiaL = aspecto >= 1 ? aspecto : 1;
        const meiaA = aspecto >= 1 ? 1 : 1 / aspecto;

        camera.left = -meiaL;
        camera.right = meiaL;
        camera.top = meiaA;
        camera.bottom = -meiaA;
        camera.updateProjectionMatrix();

        fundo.material.uniforms.uAspecto.value = aspecto;

        /*
         * O buraco do vórtice é medido no elemento que ocupa o centro, não
         * fixado aqui. O medalhão do hero tem tamanho em `min(vw, vh, rem)`,
         * então ele muda de proporção conforme a janela: um raio constante
         * ora deixava anel por baixo da peça, ora abria um vão escuro.
         */
        const raioInterno = medirBuraco(opcoes.buraco, Math.min(largura, altura) / 2);
        const escala = raioInterno / ESPIRAL.raioInterno;

        filamentos.material.uniforms.uR0.value = raioInterno * Math.pow(ESPIRAL.razao, ESPIRAL.voltas);
        filamentos.material.uniforms.uRaioNitido.value = raioInterno * FOCO;

        /* O brilho azul acompanha o buraco, senão fica atrás da peça. */
        miolo.scale.setScalar(escala);

        if (brasao) {
            brasao.aura.scale.setScalar(escala);
        }

        /* gl_PointSize é em pixel de buffer, não em pixel de CSS. */
        const pxPorUnidade = (Math.min(largura, altura) * renderer.getPixelRatio()) / 2;

        filamentos.material.uniforms.uPxPorUnidade.value = pxPorUnidade;
        filamentos.material.uniforms.uDesfoque.value = ESPIRAL.desfoque * (pxPorUnidade / 540);

        /*
         * Quadro novo na hora quando a cena é estática.
         *
         * `setSize` troca o buffer de desenho e entrega o novo limpo. Sem
         * este redesenho, quem pediu movimento reduzido via o hero apagar
         * de vez ao girar o celular ou arrastar a janela, porque o único
         * quadro que existia tinha ficado no buffer antigo.
         */
        if (estatico) {
            desenhar();
        }
    };

    redimensionar();
    window.addEventListener("resize", redimensionar);

    if (estatico) {
        return;
    }

    let pedido = 0;

    const quadro = (agora) => {
        relogio.t += Math.min((agora - relogio.anterior) / 1000, 0.1);
        relogio.anterior = agora;

        desenhar();
        pedido = requestAnimationFrame(quadro);
    };

    const ligar = () => {
        if (pedido) {
            return;
        }

        /* A janela pode ter mudado de tamanho enquanto a cena estava
           desligada, e o buffer ficou com a medida antiga. */
        redimensionar();

        /* Sem este acerto, o primeiro quadro depois de uma pausa longa
           entraria com o intervalo inteiro da pausa e a espiral daria um
           salto. O teto de 0,1s já segurava o pior, mas o salto existia. */
        relogio.anterior = performance.now();

        pedido = requestAnimationFrame(quadro);
    };

    const desligar = () => {
        if (!pedido) {
            return;
        }

        cancelAnimationFrame(pedido);
        pedido = 0;
    };

    /*
     * A cena só desenha enquanto está na tela.
     *
     * Esta página tem duas cenas WebGL, esta e a superfície de glitter da
     * terceira dobra. Rodando as duas ao mesmo tempo elas disputam a GPU e
     * o quadro, e a que está fora da janela não é vista por ninguém: o
     * custo é desperdício inteiro, e chega como rolagem travada e bateria
     * indo embora no celular.
     */
    if (typeof IntersectionObserver === "function") {
        const olho = new IntersectionObserver(
            ([entrada]) => (entrada.isIntersecting ? ligar() : desligar()),
            { threshold: 0 }
        );

        olho.observe(canvas);
        return;
    }

    ligar();
};

const criarFilamentos = (ruido, movel) => {
    const porFibra = movel ? ESPIRAL.pontosPorFibraMovel : ESPIRAL.pontosPorFibra;
    const total = ESPIRAL.fibras * porFibra;

    const thetaMax = TAU * ESPIRAL.voltas;
    const k = Math.log(ESPIRAL.razao) / TAU;
    const r0 = ESPIRAL.raioInterno * Math.pow(ESPIRAL.razao, ESPIRAL.voltas);

    const rnd = semeado(7059401);

    const theta = new Float32Array(total);
    const faixa = new Float32Array(total);
    const trama = new Float32Array(total * 3);
    const semente = new Float32Array(total);
    const glint = new Float32Array(total);
    const ranque = new Float32Array(total);
    const cores = new Float32Array(total * 3);

    const claro = cor(CORES.ouroClaro);
    const medio = cor(CORES.ouroMedio);
    const escuro = cor(CORES.ouroFundo);

    let i = 0;

    for (let f = 0; f < ESPIRAL.fibras; f++) {
        /* Onde a fibra corre dentro da espessura do feixe, de -1 a 1. */
        const posicao = (f / (ESPIRAL.fibras - 1)) * 2 - 1 + (rnd() - 0.5) * 0.05;
        const amplitude = ESPIRAL.trama * (0.3 + rnd() * 0.7);
        const frequencia = 1 + Math.floor(rnd() * 4);
        const fase = rnd() * TAU;

        for (let p = 0; p < porFibra; p++) {
            /*
             * Uniforme em θ. É isso que dá a mesma contagem de pontos por
             * volta e faz a reciclagem passar despercebida.
             *
             * Uniforme por estratos, e não por sorteio solto: uma fatia
             * igual de θ para cada ponto, e o ponto sorteado dentro da
             * fatia. A distribuição é a mesma; o que some são os grumos e
             * os vazios do sorteio puro. E a fibra já sai ordenada em θ,
             * que é do que o ranque abaixo precisa.
             */
            theta[i] = ((p + rnd()) / porFibra) * thetaMax;
            faixa[i] = posicao;

            /*
             * Ranque em sequência áurea sobre a ordem em θ.
             *
             * O desbaste do vértice guarda o ponto quando aRanque cai
             * abaixo da cota daquele raio. Com ranque sorteado, os
             * sobreviventes cairiam onde calhasse, e a névoa das voltas de
             * fora — que tem só cinco camadas de folga — sairia manchada.
             * Com o passo áureo, qualquer corte da sequência fica espaçado
             * por igual ao longo da fibra, e a cobertura que se pediu é a
             * cobertura que se recebe em cada pedaço dela.
             */
            ranque[i] = (p * 0.6180339887498949) % 1;

            trama[i * 3] = amplitude;
            trama[i * 3 + 1] = frequencia;
            trama[i * 3 + 2] = fase;

            semente[i] = rnd();
            glint[i] = rnd() < ESPIRAL.glints ? 1 : 0;

            const t = rnd();
            const c =
                glint[i] === 1
                    ? claro
                    : t < 0.12
                        ? misturar(medio, claro, (t / 0.12) * 0.9)
                        : misturar(escuro, medio, (t - 0.12) / 0.88);

            cores[i * 3] = c[0];
            cores[i * 3 + 1] = c[1];
            cores[i * 3 + 2] = c[2];

            i++;
        }
    }

    const geometria = new BufferGeometry();
    /* position fica zerado: quem calcula a posição é o vértice, a partir de
       θ. Mas o three precisa do atributo para saber a contagem. */
    geometria.setAttribute("position", new BufferAttribute(new Float32Array(total * 3), 3));
    geometria.setAttribute("aTheta", new BufferAttribute(theta, 1));
    geometria.setAttribute("aFaixa", new BufferAttribute(faixa, 1));
    geometria.setAttribute("aTrama", new BufferAttribute(trama, 3));
    geometria.setAttribute("aSemente", new BufferAttribute(semente, 1));
    geometria.setAttribute("aGlint", new BufferAttribute(glint, 1));
    geometria.setAttribute("aRanque", new BufferAttribute(ranque, 1));
    geometria.setAttribute("aCor", new BufferAttribute(cores, 3));

    const material = new ShaderMaterial({
        vertexShader: VERTICE_FILAMENTO,
        fragmentShader: FRAGMENTO_FILAMENTO,
        uniforms: {
            uTempo: { value: 0 },
            uVelocidade: { value: ESPIRAL.velocidade },
            uVoltas: { value: ESPIRAL.voltas },
            uK: { value: k },
            uR0: { value: r0 },
            uFaixa: { value: ESPIRAL.faixa },
            uFio: { value: ESPIRAL.fio },
            uDesfoque: { value: ESPIRAL.desfoque },
            uRaioNitido: { value: ESPIRAL.raioNitido },
            uPxPorUnidade: { value: 540 },
            uIntensidade: { value: ESPIRAL.intensidade },
            /*
             * Fecha a igualdade do desbaste, cota = uCobertura · (r/t)².
             *
             * Sai de igualar, num anel de espessura dθ, a área que os
             * pontos sobreviventes pintam — (total/θmax)·dθ·cota·(π/4)t² —
             * à área do próprio anel vezes a cobertura pedida, que é
             * C·2π·k·r²·dθ. O k·θmax do meio vale ln(razão)·voltas, e o 8
             * é o 2π dividido pelo π/4 do disco.
             *
             * Repare que `total` está embaixo: dobrar os pontos por fibra
             * dobra a densidade do miolo, onde ninguém morre, e não muda
             * um pixel do custo das voltas de fora.
             */
            uCobertura: {
                value: (8 * ESPIRAL.cobertura * Math.log(ESPIRAL.razao) * ESPIRAL.voltas) / total,
            },
            uFrio: { value: cor(CORES.frio) },
            uRuido: { value: ruido },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false,
    });

    const pontos = new Points(geometria, material);
    pontos.frustumCulled = false;
    return pontos;
};

const criarFundo = () => {
    const material = new ShaderMaterial({
        vertexShader: VERTICE_FUNDO,
        fragmentShader: FRAGMENTO_FUNDO,
        uniforms: {
            uAspecto: { value: 1 },
            uFundo: { value: cor(CORES.fundo) },
            uHalo: { value: cor(CORES.halo) },
            uHaloLateral: { value: cor(CORES.haloLateral) },
        },
        depthTest: false,
        depthWrite: false,
    });

    const malha = new Mesh(new PlaneGeometry(1, 1), material);
    malha.frustumCulled = false;
    return malha;
};

const criarMiolo = () => {
    const material = new ShaderMaterial({
        vertexShader: VERTICE_QUADRO,
        fragmentShader: FRAGMENTO_MIOLO,
        uniforms: {
            uCor: { value: cor(CORES.miolo) },
            uForca: { value: 0.28 },
            uConcentracao: { value: 11.0 },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false,
    });

    const malha = new Mesh(new PlaneGeometry(2.0, 2.0), material);
    malha.frustumCulled = false;
    return malha;
};

const criarMarca = (textura) => {
    const auraMaterial = new ShaderMaterial({
        vertexShader: VERTICE_QUADRO,
        fragmentShader: FRAGMENTO_MIOLO,
        uniforms: {
            uCor: { value: cor(CORES.ouroMedio) },
            uForca: { value: 0.5 },
            uConcentracao: { value: 11.0 },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false,
    });

    const aura = new Mesh(new PlaneGeometry(MARCA_DIAMETRO * 2.4, MARCA_DIAMETRO * 2.4), auraMaterial);
    aura.frustumCulled = false;

    const placa = new Mesh(
        new PlaneGeometry(MARCA_DIAMETRO, MARCA_DIAMETRO),
        new MeshBasicMaterial({ map: textura, transparent: true, depthTest: false, depthWrite: false })
    );
    placa.frustumCulled = false;

    return { aura, placa };
};
