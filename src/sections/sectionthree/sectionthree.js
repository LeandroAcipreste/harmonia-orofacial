/* Destaques: cada card percorre procedimento → antes → depois com a rolagem. */

import { revelarAoEntrar } from "../../utils/reveal.js";
import { ligarBrilhoDoCursor } from "../../components/shellcard/shellcard.js";

const MARGEM_CARTOES = "0px 0px -25% 0px";

/* Alturas de viewport de rolagem por card. Define o ritmo da sequência. */
const ROLAGEM_POR_CARD = 0.9;

/* Prender a seção custa quase quatro telas de rolagem, o que pesa demais
   num aparelho pequeno. A partir daqui a dobra fica presa; abaixo, a
   sequência corre enquanto a seção atravessa a tela. */
const CONSULTA_PRESA = "(min-width: 768px)";
const CONSULTA_SOLTA = "(max-width: 767px)";

/*
 * Respiro das pontas da sequência solta, nas mesmas unidades da timeline
 * do card. Na entrada, é o tempo em que o nome do procedimento fica
 * parado na tela antes de a primeira foto trocar — sem ele o card já
 * chega trocando, e ninguém sabe do que aquele antes e depois é. Na
 * saída, é o tempo em que o depois permanece antes de o card subir.
 */
const RESPIRO_ENTRADA = 0.9;
const RESPIRO_SAIDA = 0.7;

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

    ligarBrilhoDoCursor(secao.querySelectorAll(".shell-card"));

    grade.classList.add("js-anim");
    void grade.offsetHeight;
    revelarAoEntrar([grade], { margem: MARGEM_CARTOES });

    ligarSequencia(secao);
};

/*
 * A rolagem percorre uma timeline mestre. Cada card entra nela na posição
 * ">", ou seja, no fim do card anterior: um card completa procedimento →
 * antes → depois antes de o seguinte começar. É isso que faz a troca
 * acontecer um de cada vez.
 *
 * `scrub` amarra o progresso à rolagem real, o que faz o caminho de volta
 * funcionar sozinho. Nenhum listener de wheel.
 *
 * O que muda entre telas é só onde a sequência acontece: presa na dobra
 * no desktop, correndo com a página no celular. O `matchMedia` do GSAP
 * desfaz sozinho o que criou quando a consulta deixa de valer.
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

    const consulta = gsap.matchMedia();

    consulta.add(CONSULTA_PRESA, () => {
        secao.classList.add("js-sequencia");

        montarMestre(secao, cards, {
            start: "top top",
            end: () => `+=${window.innerHeight * ROLAGEM_POR_CARD * cards.length}`,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
        });

        return () => secao.classList.remove("js-sequencia");
    });

    /*
     * Solto, cada card tem o próprio gatilho, ancorado nele mesmo.
     *
     * Uma timeline só para a seção inteira, que era o que havia aqui,
     * encadeia as quatro sequências em fila e as espalha pela altura da
     * seção. Com os cards lado a lado isso funcionava, porque todos
     * estavam na tela ao mesmo tempo. Empilhados em coluna, não: a
     * timeline avança com a rolagem sem nenhuma relação com onde cada
     * card está, e a sequência de um card corre antes de ele chegar.
     */
    consulta.add(CONSULTA_SOLTA, () => {
        cards.forEach((card) => {
            const linha = gsap.timeline({
                scrollTrigger: {
                    trigger: card,
                    start: "top 78%",
                    end: "bottom 30%",
                    scrub: true,
                    invalidateOnRefresh: true,
                },
            });

            linha
                .add(criarSequenciaDoCard(card), RESPIRO_ENTRADA)
                .to({}, { duration: RESPIRO_SAIDA });
        });
    });
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

    cards.forEach((card) => {
        mestre.add(criarSequenciaDoCard(card), ">");
    });

    return mestre;
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

