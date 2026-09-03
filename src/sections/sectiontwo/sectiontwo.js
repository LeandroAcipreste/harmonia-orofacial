import { revelarAoEntrar } from "../../utils/reveal.js";
import { prefereMovimentoReduzido } from "../../utils/movimento.js";

const MARGEM_LISTA = "0px 0px -50% 0px";

const movimentoReduzido = prefereMovimentoReduzido();

export const initSectionTwo = () => {
    const secao = document.querySelector(".s2");

    if (!secao) {
        return;
    }

    const lista = secao.querySelector(".s2__lista");

    if (!lista) {
        return;
    }

    lista.classList.add("js-anim");

    void lista.offsetHeight;

    aoHeroParar(() => {
        revelarAoEntrar(lista.querySelectorAll(".s2__item"), { margem: MARGEM_LISTA });
        revelarAoEntrar(secao.querySelectorAll(".s2-reveal"), { margem: MARGEM_LISTA });
    });

    abrirCortina(secao);

    if (movimentoReduzido) {
        return;
    }

    animarLustre(secao);
};

const abrirCortina = (secao) => {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

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
        .fromTo(esquerda, { x: 0, xPercent: 0 }, { x: 0, xPercent: -100 }, 0)
        .fromTo(direita, { x: 0, xPercent: 0 }, { x: 0, xPercent: 100 }, 0);
};

const animarLustre = (secao) => {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    const radial = secao.querySelector(".s2__layer--radial");
    const trama = secao.querySelector(".s2__layer--trama");

    const trilho = { trigger: secao, start: "top 40%", end: "bottom top" };

    gsap.fromTo(radial, { yPercent: 12 }, { yPercent: -14, ease: "none", scrollTrigger: { ...trilho, scrub: 1 } });
    gsap.fromTo(trama, { yPercent: -8 }, { yPercent: 10, ease: "none", scrollTrigger: { ...trilho, scrub: 1.6 } });

    gsap.fromTo(
        radial,
        { opacity: 0.3 },
        {
            opacity: 0.62,
            ease: "none",
            scrollTrigger: { trigger: secao, start: "top 40%", end: "center center", scrub: true },
        }
    );
};

const aoHeroParar = (aoLiberar) => {
    const hero = document.querySelector(".hero");

    const semEspera =
        !hero ||
        hero.classList.contains("is-fora") ||
        typeof gsap === "undefined" ||
        typeof ScrollTrigger === "undefined";

    if (semEspera) {
        aoLiberar();
        return;
    }

    document.addEventListener("harmonia:hero-parado", aoLiberar, { once: true });
};
