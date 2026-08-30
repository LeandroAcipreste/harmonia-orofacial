/*
 * Fundo do hero: a foto de glitter vira uma superfície de verdade.
 *
 * A imagem entra três vezes, cada uma com um papel:
 *   - relevo, no vértice, deslocando a malha pela luminosidade;
 *   - luz macro, no fragmento, que é o claro-escuro original da foto;
 *   - grão fino, a mesma textura em outra escala, isolando as palhetas.
 *
 * Por cima disso passam dois focos de luz, um dourado e um ciano, que
 * acendem só as palhetas que alcançam. É daí que vem o brilho: nenhuma
 * imagem parada faz isso, porque o que cintila é a relação entre a
 * palheta e a luz que passa.
 */

import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    Color,
    Mesh,
    MirroredRepeatWrapping,
    PerspectiveCamera,
    PlaneGeometry,
    Points,
    Scene,
    ShaderMaterial,
    SRGBColorSpace,
    TextureLoader,
    Vector2,
    Vector3,
    WebGLRenderer,
} from "../vendor/three.module.min.js";

/* Caminho resolvido a partir deste módulo, não do documento: assim o
   hero funciona em qualquer página, não só na raiz. */
const TEXTURA = new URL("../../assets/hero-glitter.webp", import.meta.url).href;

const CAMPO_DE_VISAO = 42;
const DISTANCIA = 5;

/* A malha é maior que o enquadramento porque está inclinada: a borda de
   cima recua e deixaria o fundo aparecer sem esta folga. */
const MARGEM = 1.9;
const INCLINACAO = -0.24;

/* Densidade da malha. O que a malha precisa descrever são duas ondas
   longas, e para isso 200 por lado eram quarenta mil vértices gastos à
   toa: o desenho é o mesmo com muito menos. */
const SEGMENTOS = 72;
const SEGMENTOS_MOVEL = 40;

const PIXEL_RATIO_MAXIMO = 2;
const LARGURA_MOVEL = 768;

/* Quanto a câmera passeia com o ponteiro, em unidades de cena. */
const PASSEIO_X = 0.42;
const PASSEIO_Y = 0.3;
const SUAVIDADE = 0.045;

/*
 * Aparelho sem cursor. A pergunta não é o tamanho da tela e sim se existe
 * ponteiro fino: assim entra o tablet grande na horizontal, que passa de
 * 1024px, e fica de fora o notebook de tela pequena, que tem mouse.
 */
const CONSULTA_SEM_CURSOR = "(hover: none), (pointer: coarse)";

/*
 * O caminho do ponteiro virtual é um oito — uma lemniscata de Gerono,
 * `sen(θ)` num eixo e `sen(2θ)` no outro. A frequência dobrada de um lado
 * é o que fecha a curva em dois laços em vez de um círculo.
 *
 * O cruzamento do oito cai no centro da tela, que é onde está o medalhão,
 * mas é justamente ali que a curva corre mais depressa: a poeira
 * atravessa sem ter tempo de se juntar atrás do logo. Num círculo o
 * enxame andava sempre à mesma velocidade e a distância do centro nunca
 * mudava; aqui ele acelera, alonga e volta a se recolher.
 *
 * Mais lento que a volta anterior porque o oito passa duas vezes por
 * ciclo: na mesma velocidade, agitava em vez de dançar.
 */
const OITO_VELOCIDADE = 0.3;
const OITO_LACO_LONGO = 0.62;
const OITO_LACO_CURTO = 0.42;

/*
 * `aco` não está na paleta do site: é o corpo da superfície, o azul que a
 * chapa de glitter devolve na área iluminada. O navy sozinho, convertido
 * para linear, é escuro demais e engoliria o claro-escuro da foto.
 */
/*
 * A chapa é azul e só azul: os dois focos que passeiam sobre ela são o
 * ciano e um azul claro. O dourado da marca não entra no fundo — ele fica
 * no medalhão e na poeira, onde é acento, e não superfície.
 */
const CORES = {
    fundo: "#050a1c",
    aco: "#33507f",
    fria: "#67e8f9",
    luz: "#a8c8ff",
    quente: "#fdba74",
    poeira: "#8cb4ff",
};

/* Poeira em suspensão. Números herdados do canvas antigo: o redemoinho
   com estes valores já estava certo, só mudou onde ele vive. */
const PARTICULAS = {
    quantidade: 1400,
    quantidadeMovel: 500,
    profundidade: 1.4,
    atracao: 0.6,
    amortecimento: 0.99,
    giro: 0.35,
    raioDeAbsorcao: 0.06,
    passo: 0.016,
};

const VERTICE_POEIRA = /* glsl */ `
attribute float tamanho;

uniform float uPixelRatio;

varying float vTamanho;

void main() {
    vTamanho = tamanho;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = tamanho * uPixelRatio;
}
`;

const FRAGMENTO_POEIRA = /* glsl */ `
uniform vec3 uCorPoeira;
uniform vec3 uCorQuente;

varying float vTamanho;

void main() {
    /* Ponto quadrado vira disco esfumado pela distância ao centro. */
    float brilho = smoothstep(0.5, 0.08, length(gl_PointCoord - vec2(0.5)));

    /* A poeira é dourada; só as menores esfriam para o azul. A passagem é
       contínua, não um degrau: com o corte seco viravam duas populações de
       cores diferentes, em vez de uma só a distâncias diferentes da luz. */
    vec3 cor = mix(uCorPoeira, uCorQuente, smoothstep(1.7, 3.0, vTamanho));

    gl_FragColor = vec4(cor * brilho, brilho);

    #include <colorspace_fragment>
}
`;

const VERTICE = /* glsl */ `
uniform float uTempo;
uniform float uOnda;

varying vec2 vUv;

void main() {
    vUv = uv;

    /*
     * Duas ondas longas, de períodos que não fecham entre si, para a
     * superfície nunca repetir a mesma pose. É este balanço que faz a luz
     * correr pela chapa em vez de ficar pousada nela.
     *
     * O relevo tirado da textura saiu daqui: agora que a foto é só grão,
     * vértices vizinhos cairiam em palhetas diferentes e a malha ficaria
     * serrilhada em vez de ondulada.
     */
    float balanco =
        sin(uv.x * 5.2 + uTempo * 0.42) * 0.6 +
        sin(uv.y * 3.7 - uTempo * 0.31) * 0.4;

    vec3 relevo = position + vec3(0.0, 0.0, balanco * uOnda);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(relevo, 1.0);
}
`;

const FRAGMENTO = /* glsl */ `
uniform sampler2D uMapa;
uniform float uTempo;
uniform vec2 uPonteiro;
uniform vec3 uCorFundo;
uniform vec3 uCorAco;
uniform vec3 uCorFria;
uniform vec3 uCorLuz;
uniform float uEscalaMacro;
uniform float uEscalaMicro;
uniform float uCintilacao;

varying vec2 vUv;

/* Ruído barato só para dar a cada palheta uma fase própria. */
float aleatorio(vec2 semente) {
    return fract(sin(dot(semente, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    /* As duas escalas correm em direções e velocidades diferentes: é o que
       dá profundidade ao deslize, como duas camadas de matéria passando
       uma sobre a outra. Com uTempo parado, tudo isto para junto. */
    vec2 derivaChapa = vec2(uTempo * 0.011, uTempo * -0.007);
    vec2 derivaGrao = vec2(uTempo * -0.026, uTempo * 0.018);

    /* A chapa vem ladrilhada: em 1× as palhetas da foto ficam do tamanho
       de lascas na tela. A iluminação da foto foi removida no arquivo, e
       é isso que a torna ladrilhável — sobrou o grão, em torno do meio. */
    vec3 chapa = texture2D(uMapa, vUv * uEscalaMacro + derivaChapa).rgb;
    float luzDaFoto = dot(chapa, vec3(0.299, 0.587, 0.114));

    /* A mesma textura numa escala bem mais fina, aqui só como modulação:
       por não carregar cor, a emenda do ladrilho não aparece. */
    float grao = texture2D(uMapa, vUv * uEscalaMicro + derivaGrao + vec2(0.13, 0.41)).g;

    /* Os dois focos passeiam sozinhos e o ponteiro os desloca um pouco.
       O peso em x compensa a tela ser mais larga que alta. */
    vec2 focoCiano = vec2(0.32 + 0.17 * sin(uTempo * 0.21), 0.60 + 0.13 * cos(uTempo * 0.27));
    vec2 focoClaro = vec2(0.72 + 0.14 * cos(uTempo * 0.17), 0.36 + 0.15 * sin(uTempo * 0.23));

    focoCiano += uPonteiro * 0.14;
    focoClaro -= uPonteiro * 0.09;

    float alcanceCiano = exp(-3.6 * length((vUv - focoCiano) * vec2(1.6, 1.0)));
    float alcanceClaro = exp(-4.2 * length((vUv - focoClaro) * vec2(1.6, 1.0)));

    /* Cada palheta pisca na sua própria fase; sem isso o campo inteiro
       pulsaria junto, que é como brilho falso se entrega. */
    float fase = aleatorio(floor(vUv * 520.0)) * 6.2831;
    float pisca = 1.0 - uCintilacao + uCintilacao * (0.5 + 0.5 * sin(uTempo * 1.7 + fase));

    /* Expoente alto: só as palhetas realmente claras acendem, o resto da
       superfície permanece fosco. */
    float palheta = pow(grao, 7.0) * pisca;

    /* Corpo da chapa: um nível de azul fixo que o grão modula em volta.
       O nível não sai mais da foto — é justamente por não haver degradê
       gravado que os ladrilhos não têm o que desencontrar na emenda. */
    float corpo = clamp((luzDaFoto - 0.5) * 2.0 + 0.45, 0.0, 1.0);

    vec3 cor = uCorFundo + uCorAco * corpo * 1.15;

    /* A chapa também responde à luz que passa, senão o foco parece colado
       por cima em vez de estar iluminando alguma coisa. Discreto de
       propósito: forte demais, os focos partiam o fundo em claro e escuro
       em vez de iluminar uma superfície só. */
    cor *= 1.0 + alcanceCiano * 0.85 + alcanceClaro * 0.6;

    cor += uCorFria * palheta * alcanceCiano * 30.0;
    cor += uCorLuz * palheta * alcanceClaro * 26.0;

    /* Halo largo, discreto: só assenta o foco, não lava a superfície. */
    cor += uCorFria * alcanceCiano * 0.025;
    cor += uCorLuz * alcanceClaro * 0.02;

    /* A borda se dissolve no fundo do site em vez de terminar em quina.
       O véu apaga também a cor: só a transparência deixaria a quina
       aparecer por cima dos brilhos do fundo fixo. */
    float raio = length((vUv - 0.5) * vec2(1.12, 1.0));
    float veu = smoothstep(1.05, 0.25, raio);

    gl_FragColor = vec4(cor * veu, veu);

    #include <colorspace_fragment>
}
`;

/*
 * A poeira vive em coordenadas de -1 a 1 e é a escala do objeto que a
 * espalha pela tela. Assim a física continua em números independentes do
 * tamanho da janela, e o ponteiro — que já chega normalizado — serve de
 * atrator sem nenhuma conversão.
 */
const criarPoeira = (quantidade, pixelRatio, uniformesDaCena) => {
    const posicoes = new Float32Array(quantidade * 3);
    const velocidades = new Float32Array(quantidade * 2);
    const tamanhos = new Float32Array(quantidade);

    const renascer = (i) => {
        posicoes[i * 3] = Math.random() * 2 - 1;
        posicoes[i * 3 + 1] = Math.random() * 2 - 1;
        velocidades[i * 2] = 0;
        velocidades[i * 2 + 1] = 0;
        tamanhos[i] = 1.8 + Math.random() * 4.2;
    };

    for (let i = 0; i < quantidade; i += 1) {
        renascer(i);
    }

    const geometria = new BufferGeometry();
    geometria.setAttribute("position", new BufferAttribute(posicoes, 3));
    geometria.setAttribute("tamanho", new BufferAttribute(tamanhos, 1));

    const pontos = new Points(
        geometria,
        new ShaderMaterial({
            uniforms: {
                uPixelRatio: { value: pixelRatio },
                uCorPoeira: { value: new Color(CORES.poeira) },
                uCorQuente: uniformesDaCena.uCorQuente,
            },
            vertexShader: VERTICE_POEIRA,
            fragmentShader: FRAGMENTO_POEIRA,
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
        })
    );

    pontos.position.z = PARTICULAS.profundidade;

    /* A esfera envolvente é calculada uma vez, com as posições iniciais, e
       as partículas se movem depois: descartar o objeto por ela é aposta
       perdida. O campo cobre o quadro inteiro, nunca há o que descartar. */
    pontos.frustumCulled = false;

    /* Desenha depois da chapa, sem depender da ordenação por distância:
       as duas camadas são transparentes e não escrevem profundidade, então
       a ordem entre elas seria decidida pela posição de cada objeto. */
    pontos.renderOrder = 1;

    /*
     * Cada partícula é puxada pelo atrator com uma componente lateral: a
     * força tangencial é o que transforma a queda em redemoinho. Chegando
     * perto demais ela é absorvida e renasce longe, senão todas acabariam
     * empilhadas no mesmo ponto.
     */
    const atualizar = (atrator) => {
        for (let i = 0; i < quantidade; i += 1) {
            const eixo = i * 3;
            const par = i * 2;

            const dx = atrator.x - posicoes[eixo];
            const dy = atrator.y - posicoes[eixo + 1];
            const distancia = Math.hypot(dx, dy) + 1e-4;
            const forca = PARTICULAS.atracao / (distancia + 0.08);

            const radialX = (dx / distancia) * forca;
            const radialY = (dy / distancia) * forca;

            velocidades[par] += (radialX - radialY * PARTICULAS.giro) * PARTICULAS.passo;
            velocidades[par + 1] += (radialY + radialX * PARTICULAS.giro) * PARTICULAS.passo;

            velocidades[par] *= PARTICULAS.amortecimento;
            velocidades[par + 1] *= PARTICULAS.amortecimento;

            posicoes[eixo] += velocidades[par] * PARTICULAS.passo;
            posicoes[eixo + 1] += velocidades[par + 1] * PARTICULAS.passo;

            if (distancia < PARTICULAS.raioDeAbsorcao) {
                renascer(i);
            }
        }

        geometria.attributes.position.needsUpdate = true;
    };

    return { pontos, atualizar };
};

/* A textura é a cena inteira: sem ela não há o que desenhar, então o
   primeiro quadro espera o carregamento em vez de piscar vazio. */
const carregarTextura = (anisotropia) =>
    new Promise((resolver, rejeitar) => {
        new TextureLoader().load(
            TEXTURA,
            (textura) => {
                textura.colorSpace = SRGBColorSpace;
                /* Espelhado, e não repetido: no espelhamento o pixel de um
                   lado da emenda é o mesmo do outro, então a passagem de
                   um ladrilho para o vizinho é contínua por construção. */
                textura.wrapS = MirroredRepeatWrapping;
                textura.wrapT = MirroredRepeatWrapping;
                textura.anisotropy = anisotropia;
                resolver(textura);
            },
            undefined,
            rejeitar
        );
    });

/*
 * Devolve `true` quando assumiu o canvas. Devolvendo `false`, ou falhando,
 * quem chamou mostra o fundo estático: sem WebGL a página não pode ficar
 * sem hero.
 */
export const iniciarHeroGlitter = async (canvas, { reduzido = false } = {}) => {
    let renderizador;

    try {
        renderizador = new WebGLRenderer({ canvas, alpha: true, antialias: false });
    } catch (erro) {
        return false;
    }

    if (!renderizador.getContext()) {
        return false;
    }

    renderizador.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_MAXIMO));

    const cena = new Scene();
    const camera = new PerspectiveCamera(CAMPO_DE_VISAO, 1, 0.1, 100);
    camera.position.set(0, 0, DISTANCIA);

    const movel = window.innerWidth < LARGURA_MOVEL;
    const segmentos = movel ? SEGMENTOS_MOVEL : SEGMENTOS;

    const textura = await carregarTextura(renderizador.capabilities.getMaxAnisotropy());

    const uniformes = {
        uMapa: { value: textura },
        uTempo: { value: 0 },
        uPonteiro: { value: new Vector2(0, 0) },
        uOnda: { value: 0.14 },
        uEscalaMacro: { value: movel ? 1.5 : 2.4 },
        uEscalaMicro: { value: movel ? 4.5 : 7.0 },
        uCintilacao: { value: reduzido ? 0 : 0.45 },
        uCorFundo: { value: new Color(CORES.fundo) },
        uCorAco: { value: new Color(CORES.aco) },
        uCorFria: { value: new Color(CORES.fria) },
        uCorLuz: { value: new Color(CORES.luz) },

        /* Só a poeira usa este: a chapa não tem dourado nenhum. */
        uCorQuente: { value: new Color(CORES.quente) },
    };

    const malha = new Mesh(
        new PlaneGeometry(1, 1, segmentos, segmentos),
        new ShaderMaterial({
            uniforms: uniformes,
            vertexShader: VERTICE,
            fragmentShader: FRAGMENTO,
            transparent: true,
            depthWrite: false,
        })
    );

    malha.rotation.x = INCLINACAO;
    cena.add(malha);

    const poeira = criarPoeira(
        movel ? PARTICULAS.quantidadeMovel : PARTICULAS.quantidade,
        renderizador.getPixelRatio(),
        uniformes
    );

    cena.add(poeira.pontos);

    const alvo = new Vector2(0, 0);

    /* Reaproveitados a cada quadro: alocar vetores dentro do laço de
       render é lixo para o coletor sessenta vezes por segundo. */
    const atrator = new Vector3();
    const direcao = new Vector3();

    const ajustar = () => {
        const largura = canvas.clientWidth || window.innerWidth;
        const altura = canvas.clientHeight || window.innerHeight;

        renderizador.setSize(largura, altura, false);
        camera.aspect = largura / altura;
        camera.updateProjectionMatrix();

        /* Altura visível na distância do plano: é o que faz a malha cobrir
           o enquadramento em qualquer proporção de tela. */
        const abertura = 2 * Math.tan((CAMPO_DE_VISAO * Math.PI) / 360);
        const visivel = abertura * DISTANCIA;
        malha.scale.set(visivel * camera.aspect * MARGEM, visivel * MARGEM, 1);

        /* A poeira está mais perto da câmera, então o mesmo ângulo cobre
           menos mundo: a escala dela sai da distância até o plano dela. */
        const visivelPoeira = abertura * (DISTANCIA - PARTICULAS.profundidade);
        poeira.pontos.scale.set((visivelPoeira * camera.aspect) / 2, visivelPoeira / 2, 1);

        /* A conversão do cursor usa esta matriz e ela é lida antes do
           render, então não pode ficar um quadro atrasada. */
        poeira.pontos.updateMatrixWorld();
    };

    ajustar();
    window.addEventListener("resize", ajustar);

    const semCursor = window.matchMedia(CONSULTA_SEM_CURSOR).matches;

    /* Enquanto ninguém mexeu o mouse não existe cursor a perseguir, e o
       centro da tela é o pior lugar possível para o redemoinho: é onde
       está o medalhão. Até o primeiro movimento a poeira roda sozinha. */
    let cursorEmUso = false;

    /*
     * Sem cursor, o ponteiro nem é escutado. O dedo dispara os mesmos
     * eventos que o mouse, mas no celular ele passa a maior parte do tempo
     * rolando a página: seguir o dedo daria movimento errático e, ao
     * soltar, deixaria o efeito congelado no último ponto tocado.
     */
    if (!semCursor) {
        window.addEventListener("pointermove", (evento) => {
            cursorEmUso = true;

            alvo.set(
                (evento.clientX / window.innerWidth) * 2 - 1,
                -((evento.clientY / window.innerHeight) * 2 - 1)
            );
        });
    }

    /*
     * Onde o cursor cai no plano da poeira.
     *
     * A conta é feita, e não aproximada pelo ponteiro normalizado, porque
     * a câmera passeia e respira: a mesma posição de tela cai em pontos
     * diferentes do plano conforme ela se move. Sem projetar, o redemoinho
     * se forma ao lado do cursor em vez de embaixo dele.
     *
     * O alvo aqui é o cursor cru, não o suavizado que move a câmera e as
     * luzes: a poeira persegue o mouse, e quem persegue não chega atrasado.
     */
    const mirarCursor = (t) => {
        camera.updateMatrixWorld();

        /*
         * A poeira segue `alvo` sempre que ele significa alguma coisa: o
         * mouse no desktop, o ponteiro virtual no celular e no tablet.
         * Só resta o passeio próprio no desktop antes do primeiro
         * movimento do mouse — uma volta larga em dois períodos que não
         * fecham entre si, sem parar no meio, onde o logo esconderia tudo.
         */
        const seguindoAlvo = cursorEmUso || semCursor;

        const x = seguindoAlvo ? alvo.x : Math.cos(t * 0.34) * 0.54;
        const y = seguindoAlvo ? alvo.y : Math.sin(t * 0.27) * 0.44;

        atrator.set(x, y, 0.5).unproject(camera);
        direcao.copy(atrator).sub(camera.position).normalize();

        const passo = (PARTICULAS.profundidade - camera.position.z) / direcao.z;

        atrator.copy(camera.position).addScaledVector(direcao, passo);

        return poeira.pontos.worldToLocal(atrator);
    };

    const inicio = performance.now();

    const desenhar = (agora) => {
        const t = reduzido ? 0 : (agora - inicio) / 1000;

        /*
         * Sem cursor, um ponteiro virtual dá a volta em torno do centro e
         * daqui para baixo tudo funciona como se houvesse um mouse fazendo
         * esse giro: a câmera, os focos de luz e a poeira. É o gesto que o
         * dedo não tem como fazer, e sem ele o efeito nunca apareceria
         * para quem está no celular ou no tablet.
         *
         * O medalhão não entra nisso: ele não é movido pelo ponteiro aqui,
         * continua no centro enquanto o fundo se move em volta.
         */
        if (semCursor) {
            const angulo = t * OITO_VELOCIDADE;

            /* Um laço percorre o eixo comprido; o outro, o dobro da
               frequência, faz a travessia estreita que fecha o oito. */
            const laco = Math.sin(angulo) * OITO_LACO_LONGO;
            const travessia = Math.sin(angulo * 2) * OITO_LACO_CURTO;

            /* O oito acompanha o lado comprido da tela: fica em pé no
               celular e deitado no tablet na horizontal. Fixo num eixo só,
               ele ficaria espremido em metade dos aparelhos. */
            const deitado = camera.aspect >= 1;

            alvo.set(deitado ? laco : travessia, deitado ? travessia : laco);
        }

        /* Para a câmera e as luzes o ponteiro chega por perseguição, não
           direto: o movimento fica pesado como o de um corpo, e não
           elástico. A poeira é o oposto disso, e usa o alvo cru. */
        uniformes.uPonteiro.value.lerp(alvo, SUAVIDADE);

        /* A câmera é posicionada e mirada antes de qualquer outra coisa:
           é dela que sai a conversão do cursor, logo abaixo. */
        camera.position.x = uniformes.uPonteiro.value.x * PASSEIO_X;
        camera.position.y = uniformes.uPonteiro.value.y * PASSEIO_Y;
        camera.position.z = DISTANCIA + Math.sin(t * 0.13) * 0.28;
        camera.lookAt(0, 0, 0);

        if (!reduzido) {
            uniformes.uTempo.value = t;

            /* Rolagem lenta da chapa. Junto com a respiração da câmera
               acima, são os movimentos que se percebem sem olhar. */
            malha.rotation.z = Math.sin(t * 0.06) * 0.035;
        }

        /*
         * A poeira continua viva com movimento reduzido, desde que haja
         * cursor: ela não anda sozinha, responde ao gesto de quem está com
         * a mão no mouse. É a mesma exceção que o hero já abre em
         * `ligarAtracaoDoCursor`. O que fica de fora é só o passeio
         * automático, que é movimento sem ninguém pedir.
         */
        if (!reduzido || cursorEmUso) {
            poeira.atualizar(mirarCursor(t));
        }

        renderizador.render(cena, camera);
    };

    agendarQuadro(desenhar);

    return true;
};

/*
 * Não abre um requestAnimationFrame próprio: com GSAP presente entra no
 * ticker, que já é o relógio do Lenis. Dois laços independentes para a
 * mesma página disputariam o mesmo quadro sem necessidade.
 */
const agendarQuadro = (callback) => {
    if (typeof gsap !== "undefined") {
        gsap.ticker.add(() => callback(performance.now()));
        return;
    }

    const laco = (agora) => {
        callback(agora);
        requestAnimationFrame(laco);
    };

    requestAnimationFrame(laco);
};
