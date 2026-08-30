/* Destaques: cada card percorre procedimento → antes → depois com a rolagem. */

import { revelarAoEntrar } from "../../utils/reveal.js";
import { ligarBrilhoDoCursor } from "../../components/shellcard/shellcard.js";

const MARGEM_CARTOES = "0px 0px -25% 0px";

/* Alturas de viewport de rolagem por card. Define o ritmo da sequência. */
const ROLAGEM_POR_CARD = 0.9;

/* Uma tela a mais de rolagem, só para o desdobramento acontecer. */
const ROLAGEM_DA_TELA = 1;

/*
 * Estado deitado da tela. `rotateX(90deg)` é a peça exatamente de perfil,
 * invisível; o `scaleX` estreito é o que dá a impressão de que ela estava
 * dobrada e se abre ao subir. Vem do JS, e não do CSS, para os cards
 * ficarem visíveis quando o JavaScript não roda.
 */
const TELA_DEITADA = { rotateX: 90, scaleX: 0.44, yPercent: 14, opacity: 0 };
const TELA_DE_FRENTE = { rotateX: 0, scaleX: 1, yPercent: 0, opacity: 1 };

/* Unidades da timeline gastas no desdobramento. */
const TELA_ABERTURA = 2.2;
const TELA_ASSENTA = 0.5;

/*
 * No celular quem desdobra é cada card, não o painel — e aí a perspectiva
 * precisa ser do próprio elemento, porque a do `.s3` no CSS só alcança os
 * filhos diretos, e o card é neto. `transformPerspective` põe o
 * `perspective()` dentro da transformação da própria peça, o que ainda dá
 * a cada card o seu ponto de fuga, que é o certo quando eles abrem um de
 * cada vez.
 */
const CARTA_DEITADA = { rotateX: 82, scaleX: 0.52, opacity: 0, transformPerspective: 900 };
const CARTA_DE_FRENTE = { rotateX: 0, scaleX: 1, opacity: 1 };

const CARTA_ABERTURA = 1.4;

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
            end: () =>
                `+=${window.innerHeight * (ROLAGEM_POR_CARD * cards.length + ROLAGEM_DA_TELA)}`,
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
                    /*
                     * O gatilho é a seção, e não o card, porque o card
                     * agora se deita: sob `rotateX(82deg)` o retângulo dele
                     * fica achatado a quase nada, e é pelo retângulo que o
                     * ScrollTrigger calcula onde começar e terminar. O
                     * cálculo sairia todo errado, e a sincronia que
                     * acabamos de acertar iria junto.
                     *
                     * `offsetTop` e `offsetHeight` são geometria de layout,
                     * que transformação nenhuma altera. Medindo por eles, a
                     * posição do card continua exata com a peça deitada.
                     */
                    trigger: secao,
                    start: () => `top+=${card.offsetTop} 82%`,
                    end: () => `top+=${card.offsetTop + card.offsetHeight} 35%`,
                    scrub: true,
                    invalidateOnRefresh: true,
                },
            });

            linha
                .fromTo(
                    card,
                    { ...CARTA_DEITADA },
                    { ...CARTA_DE_FRENTE, duration: CARTA_ABERTURA, ease: "power3.out" },
                    0
                )
                .add(criarSequenciaDoCard(card), CARTA_ABERTURA + RESPIRO_ENTRADA)
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

    abrirTela(mestre, secao);

    cards.forEach((card) => {
        mestre.add(criarSequenciaDoCard(card), ">");
    });

    return mestre;
};

/*
 * A tela sobe deitada e desdobra até ficar de frente.
 *
 * `fromTo` e não `from`: com `scrub`, o estado inicial é aplicado assim
 * que o gatilho nasce, então a peça já entra deitada, e o estado final é
 * escrito por extenso em vez de depender do que o navegador calculou.
 *
 * O `border-radius` não entra na animação de propósito. Girar e esmaecer
 * são trabalho do compositor e não custam nada; mudar o raio a cada
 * quadro obriga a repintar o recorte de um painel de mil e cem pixels com
 * quatro cards e oito imagens dentro. Era o único passo do efeito que
 * travaria, e é o único que ficou de fora.
 */
const abrirTela = (linha, secao) => {
    const tela = secao.querySelector(".s3__palco");

    if (!tela) {
        return;
    }

    linha.fromTo(
        tela,
        { ...TELA_DEITADA },
        { ...TELA_DE_FRENTE, duration: TELA_ABERTURA, ease: "power3.out" },
        0
    );

    /* Um respiro antes do primeiro card trocar de etapa: a tela precisa
       chegar e ser vista de frente antes de algo se mexer dentro dela. */
    linha.to({}, { duration: TELA_ASSENTA });
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

