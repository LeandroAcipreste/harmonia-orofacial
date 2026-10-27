const daPaleta = (nome, reserva) => {
    const valor = getComputedStyle(document.documentElement)
        .getPropertyValue(nome)
        .trim();

    return valor || reserva;
};

// texto ainda nao lido: invisivel (o dourado com transparencia total, para a palavra ir do nada ao ouro sem
// passar por um tom escuro). Com o consultorio no fundo, qualquer cor apareceria.
const APAGADO = "rgba(253, 186, 116, 0)";
const OURO = daPaleta("--gold-300", "#fdba74");
const CALMO = daPaleta("--slate-200", "#e2e8f0");
const DISCRETO = daPaleta("--slate-200", "#e2e8f0");

const NOME = 0;
const REGUA = 0.1;
const CRO = 0.7;
const BIO = 1;
const PRIMEIRA_AREA = 2.5;
const PASSO_DA_AREA = 0.95;
// o retrato comeca a descer no meio da bio e termina com a ultima area
const RETRATO = BIO + 0.5;
const RETRATO_DURA = PRIMEIRA_AREA + 3 * PASSO_DA_AREA - RETRATO;

const ARRASTO_DE = PRIMEIRA_AREA - 0.3;
const ARRASTO_ATE = PRIMEIRA_AREA + 3 * PASSO_DA_AREA + 0.8;
const FOLGA_DO_ARRASTO = 48;
// a saida: terminada a leitura, as letras sobem e somem, o retrato recolhe e o dente do centro some; logo depois
// a ponte (src/sections/ponte) comeca o video, sem rolagem morta no meio
const SAIDA = ARRASTO_ATE + 0.25;
const SAIDA_DAS_PALAVRAS = 0.8;

const dividirEmPalavras = (elemento) => {
    if (!elemento) {
        return [];
    }

    if (elemento.dataset.dividido === "sim") {
        return Array.from(elemento.querySelectorAll(".s4__palavra"));
    }

    const texto = elemento.textContent.replace(/\s+/g, " ").trim();
    const pedaco = document.createDocumentFragment();
    const palavras = [];

    texto.split(" ").forEach((palavra, indice) => {
        if (indice > 0) {
            pedaco.appendChild(document.createTextNode(" "));
        }

        const span = document.createElement("span");
        span.className = "s4__palavra";
        span.textContent = palavra;
        pedaco.appendChild(span);
        palavras.push(span);
    });

    elemento.textContent = "";
    elemento.appendChild(pedaco);
    elemento.dataset.dividido = "sim";

    return palavras;
};

const onda = (linha, palavras, quando, percurso, corFinal) => {
    if (!palavras.length) {
        return;
    }

    gsap.set(palavras, { color: APAGADO });

    linha.to(
        palavras,
        {
            keyframes: [
                { color: APAGADO, duration: 0 },
                { color: OURO, duration: 0.15, ease: "none" },
                { color: corFinal, duration: 0.35, ease: "none" },
            ],
            stagger: { each: percurso / palavras.length },
        },
        quando
    );
};

const escrever = (linha, palavras, quando, duracao, passo) => {
    if (!palavras.length) {
        return;
    }

    linha.fromTo(
        palavras,
        { clipPath: "inset(0 100% 0 0)" },
        {
            clipPath: "inset(0 0% 0 0)",
            ease: "power2.out",
            duration: duracao,
            stagger: { each: passo },
        },
        quando
    );
};

export const montarLeituraDaDobra = (linha, posicao) => {
    const secao = document.querySelector(".s4");

    if (!secao || !linha || !linha.scrollTrigger) {
        return;
    }

    secao.classList.add("js-leitura");

    const nome = dividirEmPalavras(secao.querySelector(".s4__nome"));
    const cro = dividirEmPalavras(secao.querySelector(".s4__cro"));
    const bio = dividirEmPalavras(secao.querySelector(".s4__bio"));
    const areas = Array.from(secao.querySelectorAll(".s4__area"));

    linha.fromTo(
        secao.querySelector(".s4__eyebrow"),
        { opacity: 0 },
        { opacity: 1, ease: "none", duration: 0.25 },
        posicao + NOME
    );

    escrever(linha, nome, posicao + NOME + 0.15, 0.45, 0.08);

    linha.fromTo(
        secao.querySelector(".s4__regua"),
        { scaleX: 0 },
        { scaleX: 1, ease: "power2.out", duration: 0.8 },
        posicao + REGUA
    );

    onda(linha, cro, posicao + CRO, 0.2, DISCRETO);

    onda(linha, bio, posicao + BIO, 1.4, CALMO);

    // o retrato desce de cima para baixo enquanto a bio e as areas sao lidas
    const retrato = secao.querySelector(".s4__retrato");

    if (retrato) {
        linha.fromTo(
            retrato,
            { "--revela": 0 },
            { "--revela": 1, ease: "none", duration: RETRATO_DURA },
            posicao + RETRATO
        );
    }

    areas.forEach((area, indice) => {
        const quando = posicao + PRIMEIRA_AREA + indice * PASSO_DA_AREA;

        linha.fromTo(
            area.querySelector(".s4__area-regua"),
            { scaleX: 0 },
            { scaleX: 1, ease: "power2.out", duration: 0.35 },
            quando
        );

        escrever(
            linha,
            dividirEmPalavras(area.querySelector(".s4__area-nome")),
            quando + 0.12,
            0.35,
            0.06
        );

        onda(
            linha,
            dividirEmPalavras(area.querySelector(".s4__area-texto")),
            quando + 0.3,
            0.5,
            DISCRETO
        );
    });

    const bloco = secao.closest(".transicao");
    const inner = secao.querySelector(".s4__inner");
    const sobra = () => {
        if (!inner) {
            return 0;
        }

        const fundoDoConteudo = inner.offsetTop + inner.offsetHeight;

        return Math.max(0, fundoDoConteudo - window.innerHeight + FOLGA_DO_ARRASTO);
    };

    const sobem = [inner, bloco && bloco.querySelector(".letreiro")].filter(Boolean);

    if (sobem.length && sobra() > 0) {
        linha.to(
            sobem,
            { y: () => -sobra(), ease: "none", duration: ARRASTO_ATE - ARRASTO_DE },
            posicao + ARRASTO_DE
        );

        encolherOVao(secao);
    }

    sairDaDobra(linha, secao, bloco, posicao + SAIDA);
};

const sairDaDobra = (linha, secao, bloco, quando) => {
    const palavras = Array.from(secao.querySelectorAll(".s4__palavra"));

    if (palavras.length) {
        linha.to(
            palavras,
            {
                y: "-0.6em",
                opacity: 0,
                ease: "power2.in",
                duration: 0.35,
                stagger: { each: SAIDA_DAS_PALAVRAS / palavras.length },
            },
            quando
        );
    }

    linha.to(secao.querySelector(".s4__eyebrow"), { opacity: 0, ease: "none", duration: 0.25 }, quando);

    linha.to(
        secao.querySelectorAll(".s4__regua, .s4__area-regua"),
        { scaleX: 0, ease: "power2.in", duration: 0.4, stagger: 0.06 },
        quando + 0.1
    );

    const retrato = secao.querySelector(".s4__retrato");

    if (retrato) {
        linha.to(retrato, { "--revela": 0, ease: "power2.in", duration: 0.6 }, quando + 0.2);
    }

    const dente = bloco && bloco.querySelector(".letreiro");

    if (dente) {
        linha.to(dente, { opacity: 0, scale: 0.92, ease: "power2.in", duration: 0.5 }, quando + 0.35);
    }
};

const CONSULTA_VAO = "(max-width: 899px)";

let ajusteArmado = false;

const encolherOVao = (secao) => {
    const ajustar = () => {
        gsap.set(secao, { height: "", overflow: "" });

        if (!window.matchMedia(CONSULTA_VAO).matches) {
            return;
        }

        const natural = secao.getBoundingClientRect().height;
        const teto = window.innerHeight;

        if (natural > teto) {
            gsap.set(secao, { height: teto, overflow: "clip" });
        }
    };

    ajustar();

    if (ajusteArmado) {
        return;
    }

    ajusteArmado = true;
    ScrollTrigger.addEventListener("refreshInit", ajustar);
};
