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

const TEXTURA = new URL("../../assets/hero-glitter.webp", import.meta.url).href;

const CAMPO_DE_VISAO = 42;
const DISTANCIA = 5;

const MARGEM = 1.9;
const INCLINACAO = -0.24;

const SEGMENTOS = 72;
const SEGMENTOS_MOVEL = 40;

const PIXEL_RATIO_MAXIMO = 2;
const LARGURA_MOVEL = 768;

const PASSEIO_X = 0.42;
const PASSEIO_Y = 0.3;
const SUAVIDADE = 0.045;

const CONSULTA_SEM_CURSOR = "(hover: none), (pointer: coarse)";

const OITO_VELOCIDADE = 0.3;
const OITO_LACO_LONGO = 0.62;
const OITO_LACO_CURTO = 0.42;

const CORES = {
    fundo: "#0d0a47",
    aco: "#33507f",
    fria: "#67e8f9",
    luz: "#a8c8ff",
    quente: "#fdba74",
    poeira: "#8cb4ff",
};

const PARTICULAS = {
    quantidade: 1400,
    quantidadeMovel: 500,
    profundidade: 1.4,

    folga: 1.16,

    atracao: 0.6,
    giro: 0.35,
    amortecimento: 0.99,
    raioDeAbsorcao: 0.06,

    correnteEscala: 3.2,
    correnteTempo: 0.5,
    correnteForca: 0.3,

    inercia: 0.6,

    soproRaio: 0.25,
    soproForca: 0.3,

    agitacao: 1.5,

    passo: 0.016,
};

const REDEMOINHO = {

    x: 0,
    y: 0,

    forca: 0.7,

    raio: 0.9,

    perseguicao: 0.02,
};

const FISICA_MOVEL = "atrator";

const VERTICE_POEIRA =  `
attribute float tamanho;

uniform float uPixelRatio;

varying float vTamanho;

void main() {
    vTamanho = tamanho;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = tamanho * uPixelRatio;
}
`;

const FRAGMENTO_POEIRA =  `
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

const VERTICE =  `
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

const FRAGMENTO =  `
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

    /* Só as palhetas realmente claras acendem; o resto da superfície
       permanece fosco. A sétima potência sai por multiplicação, e não por
       pow(): são quatro produtos no lugar de um log e uma exponencial,
       por fragmento, numa passada que cobre a tela inteira. */
    float grao2 = grao * grao;
    float grao3 = grao2 * grao;
    float palheta = grao3 * grao3 * grao * pisca;

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

const envolver = (valor) => {
    if (valor > 1) {
        return valor - 2;
    }

    if (valor < -1) {
        return valor + 2;
    }

    return valor;
};

const criarPoeira = (quantidade, pixelRatio, uniformesDaCena, semCursor) => {
    const posicoes = new Float32Array(quantidade * 3);
    const velocidades = new Float32Array(quantidade * 2);
    const tamanhos = new Float32Array(quantidade);

    const semear = (i) => {
        posicoes[i * 3] = Math.random() * 2 - 1;
        posicoes[i * 3 + 1] = Math.random() * 2 - 1;
        velocidades[i * 2] = 0;
        velocidades[i * 2 + 1] = 0;
        tamanhos[i] = 1.8 + Math.random() * 4.2;
    };

    for (let i = 0; i < quantidade; i += 1) {
        semear(i);
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

    pontos.frustumCulled = false;

    pontos.renderOrder = 1;

    const porCorrenteza = (cursor, t, comCorrente, proporcao, eixo) => {
        const escala = PARTICULAS.correnteEscala;
        const giro = t * PARTICULAS.correnteTempo;

        const proporcaoDaTela = proporcao || 1;
        const raioAoQuadrado = REDEMOINHO.raio * REDEMOINHO.raio;

        for (let i = 0; i < quantidade; i += 1) {
            const eixo = i * 3;
            const par = i * 2;

            const x = posicoes[eixo];
            const y = posicoes[eixo + 1];

            let alvoX = 0;
            let alvoY = 0;

            if (comCorrente) {

                alvoX =
                    (Math.sin(y * escala + giro) +
                        0.5 * Math.sin(y * escala * 2.3 - giro * 1.4)) *
                    PARTICULAS.correnteForca;

                alvoY =
                    (Math.cos(x * escala * 1.1 - giro) +
                        0.5 * Math.cos(x * escala * 2.7 + giro * 1.2)) *
                    PARTICULAS.correnteForca;

                const eixoX = (x - eixo.x) * proporcaoDaTela;
                const eixoY = y - eixo.y;
                const angular =
                    REDEMOINHO.forca /
                    (1 + (eixoX * eixoX + eixoY * eixoY) / raioAoQuadrado);

                alvoX += (-eixoY * angular) / proporcaoDaTela;
                alvoY += eixoX * angular;

                alvoX += (Math.random() - 0.5) * PARTICULAS.agitacao;
                alvoY += (Math.random() - 0.5) * PARTICULAS.agitacao;
            }

            const dx = x - cursor.x;
            const dy = y - cursor.y;
            const distancia = Math.sqrt(dx * dx + dy * dy) + 1e-4;

            if (distancia < PARTICULAS.soproRaio) {
                const sopro = (1 - distancia / PARTICULAS.soproRaio) * PARTICULAS.soproForca;

                alvoX += (dx / distancia) * sopro;
                alvoY += (dy / distancia) * sopro;
            }

            velocidades[par] += (alvoX - velocidades[par]) * PARTICULAS.inercia;
            velocidades[par + 1] += (alvoY - velocidades[par + 1]) * PARTICULAS.inercia;

            posicoes[eixo] = envolver(x + velocidades[par] * PARTICULAS.passo);
            posicoes[eixo + 1] = envolver(y + velocidades[par + 1] * PARTICULAS.passo);
        }

        geometria.attributes.position.needsUpdate = true;
    };

    const porAtrator = (atrator, proporcao) => {
        const proporcaoDaTela = proporcao || 1;

        for (let i = 0; i < quantidade; i += 1) {
            const eixo = i * 3;
            const par = i * 2;

            const dx = (atrator.x - posicoes[eixo]) * proporcaoDaTela;
            const dy = atrator.y - posicoes[eixo + 1];

            const distancia = Math.sqrt(dx * dx + dy * dy) + 1e-4;
            const forca = PARTICULAS.atracao / (distancia + 0.08);

            const radialX = (dx / distancia) * forca;
            const radialY = (dy / distancia) * forca;

            velocidades[par] +=
                ((radialX - radialY * PARTICULAS.giro) / proporcaoDaTela) *
                PARTICULAS.passo;
            velocidades[par + 1] +=
                (radialY + radialX * PARTICULAS.giro) * PARTICULAS.passo;

            velocidades[par] *= PARTICULAS.amortecimento;
            velocidades[par + 1] *= PARTICULAS.amortecimento;

            posicoes[eixo] += velocidades[par] * PARTICULAS.passo;
            posicoes[eixo + 1] += velocidades[par + 1] * PARTICULAS.passo;

            if (distancia < PARTICULAS.raioDeAbsorcao) {
                semear(i);
            }
        }

        geometria.attributes.position.needsUpdate = true;
    };

    const atualizar = (cursor, t, comCorrente, proporcao, eixo) => {
        if (!semCursor) {
            porAtrator(cursor);
            return;
        }

        if (FISICA_MOVEL === "atrator") {

            porAtrator(eixo, proporcao);
            return;
        }

        porCorrenteza(cursor, t, comCorrente, proporcao, eixo);
    };

    return { pontos, atualizar };
};

const carregarTextura = (anisotropia) =>
    new Promise((resolver, rejeitar) => {
        new TextureLoader().load(
            TEXTURA,
            (textura) => {
                textura.colorSpace = SRGBColorSpace;

                textura.wrapS = MirroredRepeatWrapping;
                textura.wrapT = MirroredRepeatWrapping;
                textura.anisotropy = anisotropia;
                resolver(textura);
            },
            undefined,
            rejeitar
        );
    });

export const iniciarHeroGlitter = async (canvas, { reduzido = false, superficie = true } = {}) => {
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

    const textura = superficie
        ? await carregarTextura(renderizador.capabilities.getMaxAnisotropy())
        : null;

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

        uCorQuente: { value: new Color(CORES.quente) },
    };

    const malha = superficie
        ? new Mesh(
              new PlaneGeometry(1, 1, segmentos, segmentos),
              new ShaderMaterial({
                  uniforms: uniformes,
                  vertexShader: VERTICE,
                  fragmentShader: FRAGMENTO,
                  transparent: true,
                  depthWrite: false,
              })
          )
        : null;

    if (malha) {
        malha.rotation.x = INCLINACAO;
        cena.add(malha);
    }

    const semCursor = window.matchMedia(CONSULTA_SEM_CURSOR).matches;

    const poeira = criarPoeira(
        movel ? PARTICULAS.quantidadeMovel : PARTICULAS.quantidade,
        renderizador.getPixelRatio(),
        uniformes,
        semCursor
    );

    cena.add(poeira.pontos);

    const alvo = new Vector2(0, 0);

    const eixoAlvo = new Vector2(REDEMOINHO.x, REDEMOINHO.y);
    const eixoAtual = new Vector2(REDEMOINHO.x, REDEMOINHO.y);

    const atrator = new Vector3();
    const direcao = new Vector3();

    const ajustar = () => {
        const largura = canvas.clientWidth || window.innerWidth;
        const altura = canvas.clientHeight || window.innerHeight;

        renderizador.setSize(largura, altura, false);
        camera.aspect = largura / altura;
        camera.updateProjectionMatrix();

        const abertura = 2 * Math.tan((CAMPO_DE_VISAO * Math.PI) / 360);
        const visivel = abertura * DISTANCIA;

        if (malha) {
            malha.scale.set(visivel * camera.aspect * MARGEM, visivel * MARGEM, 1);
        }

        const visivelPoeira =
            abertura * (DISTANCIA - PARTICULAS.profundidade) * PARTICULAS.folga;

        poeira.pontos.scale.set((visivelPoeira * camera.aspect) / 2, visivelPoeira / 2, 1);

        poeira.pontos.updateMatrixWorld();
    };

    ajustar();
    window.addEventListener("resize", ajustar);

    let cursorEmUso = false;

    if (!semCursor) {
        window.addEventListener("pointermove", (evento) => {
            cursorEmUso = true;

            alvo.set(
                (evento.clientX / window.innerWidth) * 2 - 1,
                -((evento.clientY / window.innerHeight) * 2 - 1)
            );
        });
    }

    const mirarCursor = (t) => {
        camera.updateMatrixWorld();

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

        if (semCursor) {
            const angulo = t * OITO_VELOCIDADE;

            const laco = Math.sin(angulo) * OITO_LACO_LONGO;
            const travessia = Math.sin(angulo * 2) * OITO_LACO_CURTO;

            const deitado = camera.aspect >= 1;

            alvo.set(deitado ? laco : travessia, deitado ? travessia : laco);
        }

        uniformes.uPonteiro.value.lerp(alvo, SUAVIDADE);

        camera.position.x = uniformes.uPonteiro.value.x * PASSEIO_X;
        camera.position.y = uniformes.uPonteiro.value.y * PASSEIO_Y;
        camera.position.z = DISTANCIA + Math.sin(t * 0.13) * 0.28;
        camera.lookAt(0, 0, 0);

        if (!reduzido) {
            uniformes.uTempo.value = t;

            if (malha) {
                malha.rotation.z = Math.sin(t * 0.06) * 0.035;
            }
        }

        if (semCursor || !reduzido || cursorEmUso) {
            eixoAtual.lerp(eixoAlvo, REDEMOINHO.perseguicao);

            poeira.atualizar(
                mirarCursor(t),
                t,
                !reduzido,
                camera.aspect,
                eixoAtual
            );
        }

        renderizador.render(cena, camera);
    };

    let naTela = true;

    if (typeof IntersectionObserver === "function") {
        naTela = false;

        new IntersectionObserver(([entrada]) => (naTela = entrada.isIntersecting), {
            threshold: 0,
        }).observe(canvas);
    }

    agendarQuadro((agora) => {
        if (naTela) {
            desenhar(agora);
        }
    });

    return {
        mirarEixo: (x, y) => {
            eixoAlvo.set(x, y);
        },
    };
};

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
