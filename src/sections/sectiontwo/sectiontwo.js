/* Procedimentos: parallax do lustre e entrada da lista. */

import { revelarAoEntrar } from "../../utils/reveal.js";

const MARGEM_LISTA = "0px 0px -15% 0px";

const prefereMovimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const initSectionTwo = () => {
    const secao = document.querySelector(".s2");

    if (!secao) {
        return;
    }

    const lista = secao.querySelector(".s2__lista");

    if (!lista) {
        return;
    }

    /*
     * `.js-anim` é o que autoriza o CSS a esconder o texto. Sem este
     * módulo nada some, e a falha degrada para "sem animação" em vez de
     * "sem conteúdo".
     */
    lista.classList.add("js-anim");

    /* Assenta o estado inicial antes de qualquer revelação: com a seção
       já dentro da tela, as duas classes cairiam no mesmo quadro e não
       haveria transição para ver. */
    void lista.offsetHeight;

    revelarAoEntrar(lista.querySelectorAll(".s2__item"), { margem: MARGEM_LISTA });
    revelarAoEntrar(secao.querySelectorAll(".s2-reveal"), { margem: MARGEM_LISTA });

    if (prefereMovimentoReduzido) {
        return;
    }

    abrirCortina(secao);
    animarLustre(secao);
};

/*
 * A cortina fecha a seção e abre para os lados enquanto a página sobe.
 *
 * O `fromTo` é o que fecha: com scrub, o estado inicial é aplicado assim
 * que o gatilho nasce, então a seção já entra tapada. É por isso que o
 * CSS deixa as folhas abertas — fechar é decisão deste módulo, e quem
 * não chega aqui vê a seção inteira.
 *
 * Termina em `top top`: a abertura acompanha exatamente o trecho em que
 * a segunda dobra toma o lugar da primeira.
 */
const abrirCortina = (secao) => {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    const esquerda = secao.querySelector(".cortina__folha--esq");
    const direita = secao.querySelector(".cortina__folha--dir");

    if (!esquerda || !direita) {
        return;
    }

    const linha = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
            trigger: secao,
            start: "top bottom",
            end: "top top",
            scrub: true,
        },
    });

    linha
        .fromTo(esquerda, { xPercent: 0 }, { xPercent: -100 }, 0)
        .fromTo(direita, { xPercent: 0 }, { xPercent: 100 }, 0);
};

/* As duas fotos andam em velocidades diferentes, o que dá profundidade
   ao fundo. Aqui o scrub é essencial, então é caso de ScrollTrigger. */
const animarLustre = (secao) => {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    const radial = secao.querySelector(".s2__layer--radial");
    const trama = secao.querySelector(".s2__layer--trama");
    const trilho = { trigger: secao, start: "top bottom", end: "bottom top" };

    gsap.fromTo(radial, { yPercent: 12 }, { yPercent: -14, ease: "none", scrollTrigger: { ...trilho, scrub: 1 } });
    gsap.fromTo(trama, { yPercent: -8 }, { yPercent: 10, ease: "none", scrollTrigger: { ...trilho, scrub: 1.6 } });

    gsap.fromTo(
        radial,
        { opacity: 0.3 },
        {
            opacity: 0.62,
            ease: "none",
            scrollTrigger: { trigger: secao, start: "top bottom", end: "center center", scrub: true },
        }
    );
};
