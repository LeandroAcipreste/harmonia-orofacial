import { ligarBrilhoDoCursor } from "../../components/shellcard/shellcard.js";
import { prefereMovimentoReduzido } from "../../utils/movimento.js";

const ROLAGEM_POR_CARD = 0.9;

const ROLAGEM_DA_TELA = 1;

const DEITADO = { rotateX: 90, scaleX: 0.44, yPercent: 44 };
const DE_FRENTE = { rotateX: 0, scaleX: 1, yPercent: 0 };

const ABERTURA = 2.2;
const ACENDER = 0.15;
const ASSENTA = 0.5;

const CONSULTA_PRESA = "(min-width: 768px)";
const CONSULTA_SOLTA = "(max-width: 767px)";

const RESPIRO_ENTRADA = 0.9;
const RESPIRO_SAIDA = 0.7;

const TRANSICAO = 1;
const PAUSA = 0.6;

const ESCALA_ENTRADA = 1.06;
const ESCALA_SAIDA = 0.94;

export const initSectionThree = () => {
    const secao = document.querySelector(".s3");

    if (!secao) {
        return;
    }

    carregarFundo(secao);

    ligarBrilhoDoCursor(secao.querySelectorAll(".shell-card"));

    ligarSequencia(secao);
};

let fundo = null;

const carregarFundo = (secao) => {
    const canvas = secao.querySelector("#s3-gl");

    if (!canvas) {
        return;
    }

    const semGl = () => secao.classList.add("is-sem-gl");

    import("../../three/heroGlitter.js")
        .then(({ iniciarHeroGlitter }) =>
            iniciarHeroGlitter(canvas, {
                reduzido: prefereMovimentoReduzido(),
                superficie: false,
            })
        )
        .then((assumiu) => {
            if (!assumiu) {
                semGl();
                return;
            }

            if (typeof assumiu === "object") {
                fundo = assumiu;
            }
        })
        .catch(semGl);
};

const mirarNoCard = (card) => {
    if (!fundo) {
        return;
    }

    const caixa = card.getBoundingClientRect();
    const meioX = caixa.left + caixa.width / 2;
    const meioY = caixa.top + caixa.height / 2;

    fundo.mirarEixo(
        (meioX / window.innerWidth) * 2 - 1,
        1 - (meioY / window.innerHeight) * 2
    );
};

const ligarSequencia = (secao) => {
    const cards = Array.from(secao.querySelectorAll(".s3__card"));

    if (!cards.length) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    const consulta = gsap.matchMedia();

    consulta.add(CONSULTA_PRESA, () => {
        secao.classList.add("js-sequencia");

        montarMestre(secao, cards, {
            start: "top top",
            end: () =>
                `+=${window.innerHeight * (ROLAGEM_POR_CARD * cards.length + ROLAGEM_DA_TELA)}`,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
        });

        return () => secao.classList.remove("js-sequencia");
    });

    consulta.add(CONSULTA_SOLTA, () => {
        cards.forEach(montarCardSolto);
    });
};

const desdobrar = (linha, peca, posicao) => {
    linha.fromTo(
        peca,
        { opacity: 0 },
        { opacity: 1, duration: ACENDER, ease: "none" },
        posicao
    );

    linha.fromTo(
        peca,
        { ...DEITADO },
        { ...DE_FRENTE, duration: ABERTURA, ease: "power3.out" },
        posicao
    );
};

const montarCardSolto = (card) => {
    const linha = gsap.timeline({
        scrollTrigger: {

            trigger: card.parentElement,
            start: "top 72%",
            end: "top 12%",
            scrub: true,
            invalidateOnRefresh: true,

            onUpdate: () => mirarNoCard(card),
            onEnter: () => mirarNoCard(card),
            onEnterBack: () => mirarNoCard(card),
        },
    });

    desdobrar(linha, card, 0);

    linha
        .add(criarSequenciaDoCard(card), ABERTURA + RESPIRO_ENTRADA)
        .to({}, { duration: RESPIRO_SAIDA });

    return linha;
};

const montarMestre = (secao, cards, gatilho) => {
    const mestre = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
            trigger: secao,
            scrub: true,
            invalidateOnRefresh: true,
            ...gatilho,
        },
    });

    abrirTela(mestre, secao);

    cards.forEach((card) => {
        mestre.add(criarSequenciaDoCard(card), ">");
    });

    return mestre;
};

const abrirTela = (linha, secao) => {
    const tela = secao.querySelector(".s3__palco");

    if (!tela) {
        return;
    }

    desdobrar(linha, tela, 0);

    linha.to({}, { duration: ASSENTA });
};

const criarSequenciaDoCard = (card) => {
    const procedimento = card.querySelector(".s3__etapa--procedimento");
    const antes = card.querySelector(".s3__etapa--antes");
    const depois = card.querySelector(".s3__etapa--depois");
    const trilho = card.querySelector(".s3__trilho");

    const reduzido = prefereMovimentoReduzido();
    const entrada = reduzido ? 1 : ESCALA_ENTRADA;
    const saida = reduzido ? 1 : ESCALA_SAIDA;

    const segundaTroca = TRANSICAO + PAUSA;
    const linha = gsap.timeline();

    linha
        .to(procedimento, { opacity: 0, scale: saida, duration: TRANSICAO }, 0)
        .fromTo(
            antes,
            { opacity: 0, scale: entrada },
            { opacity: 1, scale: 1, duration: TRANSICAO },
            0
        )
        .to(antes, { opacity: 0, scale: saida, duration: TRANSICAO }, segundaTroca)
        .fromTo(
            depois,
            { opacity: 0, scale: entrada },
            { opacity: 1, scale: 1, duration: TRANSICAO },
            segundaTroca
        );

    if (trilho) {

        const total = linha.duration();

        linha.fromTo(
            trilho,
            { scaleX: 0, opacity: 1 },
            { scaleX: 1, duration: total, ease: "none" },
            0
        );

        linha.to(
            trilho,
            { opacity: 0, duration: total * 0.12, ease: "none" },
            total * 0.88
        );
    }

    return linha;
};
