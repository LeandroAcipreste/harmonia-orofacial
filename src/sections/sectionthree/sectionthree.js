/* Destaques: cada card percorre procedimento → antes → depois com a rolagem. */

import { revelarAoEntrar } from "../../utils/reveal.js";

const MARGEM_CARTOES = "0px 0px -25% 0px";
const GLOW_ALCANCE = 220;

/* Alturas de viewport de rolagem por card. Define o ritmo da sequência. */
const ROLAGEM_POR_CARD = 0.9;

/* Unidades da timeline de um card: troca de etapa e respiro entre elas. */
const TRANSICAO = 1;
const PAUSA = 0.6;

const ESCALA_ENTRADA = 1.06;
const ESCALA_SAIDA = 0.94;

export const initSectionThree = () => {
    const secao = document.querySelector(".s3");

    if (!secao) {
        return;
    }

    const grade = secao.querySelector(".s3__grade");

    if (!grade) {
        return;
    }

    ligarBrilho(secao.querySelectorAll(".shell-card"));

    grade.classList.add("js-anim");
    void grade.offsetHeight;
    revelarAoEntrar([grade], { margem: MARGEM_CARTOES });

    ligarSequencia(secao);
};

/*
 * A seção fica presa na viewport e a rolagem percorre uma timeline mestre.
 * Cada card entra na mestre na posição ">", ou seja, no fim do card
 * anterior: um card completa procedimento → antes → depois antes de o
 * seguinte começar. É isso que faz a troca acontecer um de cada vez.
 *
 * `scrub` amarra o progresso à rolagem real, o que faz o caminho de volta
 * funcionar sozinho. Nenhum listener de wheel: quem segura a página é o
 * pin do ScrollTrigger.
 */
const ligarSequencia = (secao) => {
    const cards = Array.from(secao.querySelectorAll(".s3__card"));

    if (!cards.length) {
        return;
    }

    /* Sem GSAP a seção continua legível, só mostra o procedimento parado. */
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    secao.classList.add("js-sequencia");

    const mestre = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
            trigger: secao,
            start: "top top",
            end: () => `+=${window.innerHeight * ROLAGEM_POR_CARD * cards.length}`,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            scrub: true,
            invalidateOnRefresh: true,
        },
    });

    cards.forEach((card) => {
        mestre.add(criarSequenciaDoCard(card), ">");
    });
};

/*
 * As três etapas ocupam o mesmo espaço do card e só trocam opacidade e
 * escala, o que mantém a transição no compositor. Com movimento reduzido
 * a escala sai de cena e resta a fusão entre as imagens.
 */
const criarSequenciaDoCard = (card) => {
    const procedimento = card.querySelector(".s3__etapa--procedimento");
    const antes = card.querySelector(".s3__etapa--antes");
    const depois = card.querySelector(".s3__etapa--depois");
    const trilho = card.querySelector(".s3__trilho");

    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
        linha.fromTo(
            trilho,
            { scaleX: 0 },
            { scaleX: 1, duration: linha.duration(), ease: "none" },
            0
        );
    }

    return linha;
};

/* Ângulo e intensidade vêm do cursor, via custom property. */
const ligarBrilho = (cartoes) => {
    window.addEventListener("pointermove", (evento) => {
        cartoes.forEach((cartao) => {
            const caixa = cartao.getBoundingClientRect();
            const dx = evento.clientX - (caixa.left + caixa.width / 2);
            const dy = evento.clientY - (caixa.top + caixa.height / 2);
            const angulo = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
            const distancia = Math.hypot(dx, dy);
            const borda = Math.hypot(caixa.width / 2, caixa.height / 2);
            const proximidade = Math.max(0, 1 - Math.abs(distancia - borda) / GLOW_ALCANCE);

            cartao.style.setProperty("--cursor-angle", `${angulo}deg`);
            cartao.style.setProperty("--glow-opacity", proximidade.toFixed(3));
        });
    });
};
