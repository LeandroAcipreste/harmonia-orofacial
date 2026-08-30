/* Hero: comportamento e animações. O fundo 3D vive em src/three. */

import { porQuadro } from "../../utils/porQuadro.js";

const ENTRADA = {
    duracao: 1.2,
    stagger: 0.14,
    atraso: 0.25,
    deslocamento: 40,
    desfoque: 12,
};

const FLASHLIGHT_ALCANCE = 220;

const prefereMovimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const initHero = () => {
    const hero = document.querySelector(".hero");

    if (!hero) {
        return;
    }

    carregarFundo(hero);

    if (typeof gsap === "undefined") {
        return;
    }

    const medalhao = hero.querySelector(".hero__medalhao");

    animarEntrada(hero);

    /* Só acende a borda cônica: não desloca a peça. */
    ligarFlashlight(medalhao);

    if (prefereMovimentoReduzido || typeof ScrollTrigger === "undefined") {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);
    animarFundo();
    animarNaRolagem(hero);
};

/*
 * O three.js pesa 655 kB e o hero não pode esperar por ele para aparecer.
 * Por isso o módulo entra por import dinâmico: a marca e o texto já estão
 * na tela, o fundo 3D assume quando chega. Falhando qualquer etapa — sem
 * WebGL, arquivo fora do ar — a seção fica com o fundo estático do CSS.
 */
const carregarFundo = (hero) => {
    const canvas = hero.querySelector("#hero-gl");

    if (!canvas) {
        return;
    }

    const semGl = () => hero.classList.add("is-sem-gl");

    import("../../three/heroGlitter.js")
        .then(({ iniciarHeroGlitter }) =>
            iniciarHeroGlitter(canvas, { reduzido: prefereMovimentoReduzido })
        )
        .then((assumiu) => {
            if (!assumiu) {
                semGl();
            }
        })
        .catch(semGl);
};

/* Animações */

const animarEntrada = (hero) => {
    gsap.fromTo(
        hero.querySelectorAll(".hero-el"),
        { opacity: 0, y: ENTRADA.deslocamento, filter: `blur(${ENTRADA.desfoque}px)` },
        {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: ENTRADA.duracao,
            stagger: ENTRADA.stagger,
            ease: "power3.out",
            delay: ENTRADA.atraso,
        }
    );
};

const animarFundo = () => {
    const trilho = { trigger: document.body, start: "top top", end: "bottom bottom" };

    gsap.to(".fundo__brilhos", { yPercent: -18, ease: "none", scrollTrigger: { ...trilho, scrub: 1.2 } });
    gsap.to(".fundo__estrelas", { yPercent: -35, ease: "none", scrollTrigger: { ...trilho, scrub: 0.8 } });
};

/*
 * O medalhão fica parado. Saíram as três coisas que o moviam: o giro de 25
 * graus com o encolhimento na rolagem, a flutuação em laço e a atração
 * pelo cursor. Qualquer uma delas disputa o olho justamente na passagem em
 * que a cortina da segunda dobra abre.
 *
 * Sobra o esmaecimento do hero inteiro, que não move nada — prepara a
 * troca em vez de competir com ela.
 */
const animarNaRolagem = (hero) => {
    gsap.to(hero, {
        opacity: 0.15,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "40% top", end: "bottom top", scrub: true },
    });
};

/*
 * Borda cônica que acende conforme o cursor se aproxima da peça.
 *
 * Uma vez por quadro: aqui há `getBoundingClientRect`, que força o
 * navegador a recalcular layout na hora. A cada evento de um mouse de
 * 1000 Hz, isso sozinho engasga a rolagem.
 */
const ligarFlashlight = (medalhao) => {
    const aoMover = (evento) => {
        const caixa = medalhao.getBoundingClientRect();
        const dx = evento.clientX - (caixa.left + caixa.width / 2);
        const dy = evento.clientY - (caixa.top + caixa.height / 2);
        const angulo = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        const meiaLargura = caixa.width / 2;
        const meiaAltura = caixa.height / 2;
        const borda = Math.sqrt(meiaLargura * meiaLargura + meiaAltura * meiaAltura);
        const proximidade = Math.max(0, 1 - Math.abs(distancia - borda) / FLASHLIGHT_ALCANCE);

        medalhao.style.setProperty("--cursor-angle", `${angulo}deg`);
        medalhao.style.setProperty("--proximity", proximidade.toFixed(3));
    };

    window.addEventListener("pointermove", porQuadro(aoMover));
};

