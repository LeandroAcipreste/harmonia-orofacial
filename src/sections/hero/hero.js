/* Hero: comportamento e animações. */

import { initHeroCanvas } from "./hero-canvas.js";

const ENTRADA = {
    duracao: 1.2,
    stagger: 0.14,
    atraso: 0.25,
    deslocamento: 40,
    desfoque: 12,
};

const CURSOR = {
    raioDeIma: 0.33,
    inclinacaoPerto: 16,
    inclinacaoLonge: 8,
    deslocamentoX: 280,
    deslocamentoY: 200,
};

const FLASHLIGHT_ALCANCE = 220;

const prefereMovimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const initHero = () => {
    const hero = document.querySelector(".hero");

    if (!hero) {
        return;
    }

    initHeroCanvas();

    if (typeof gsap === "undefined") {
        return;
    }

    const medalhao = hero.querySelector(".hero__medalhao");

    animarEntrada(hero);
    ligarFlashlight(medalhao);
    ligarAtracaoDoCursor(medalhao);

    if (prefereMovimentoReduzido || typeof ScrollTrigger === "undefined") {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);
    animarFundo();
    animarNaRolagem(hero, medalhao);
};

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

const animarNaRolagem = (hero, medalhao) => {
    gsap.to(medalhao, {
        yPercent: 30,
        rotate: 25,
        scale: 0.85,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 },
    });

    gsap.to(hero, {
        opacity: 0.15,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "40% top", end: "bottom top", scrub: true },
    });

    gsap.to(medalhao, { y: "-=14", duration: 3.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
};

/* Borda cônica que acende conforme o cursor se aproxima da peça. */
const ligarFlashlight = (medalhao) => {
    window.addEventListener("pointermove", (evento) => {
        const caixa = medalhao.getBoundingClientRect();
        const dx = evento.clientX - (caixa.left + caixa.width / 2);
        const dy = evento.clientY - (caixa.top + caixa.height / 2);
        const angulo = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        const distancia = Math.hypot(dx, dy);
        const borda = Math.hypot(caixa.width / 2, caixa.height / 2);
        const proximidade = Math.max(0, 1 - Math.abs(distancia - borda) / FLASHLIGHT_ALCANCE);

        medalhao.style.setProperty("--cursor-angle", `${angulo}deg`);
        medalhao.style.setProperty("--proximity", proximidade.toFixed(3));
    });
};

/* Perto do centro a logomarca é atraída pelo cursor; longe, volta ao
   lugar com elástica. */
const ligarAtracaoDoCursor = (medalhao) => {
    if (prefereMovimentoReduzido) {
        return;
    }

    window.addEventListener("mousemove", (evento) => {
        const px = evento.clientX / window.innerWidth - 0.5;
        const py = evento.clientY / window.innerHeight - 0.5;
        const perto = Math.hypot(px, py) < CURSOR.raioDeIma;

        gsap.to(medalhao, {
            rotationY: px * (perto ? CURSOR.inclinacaoPerto : CURSOR.inclinacaoLonge),
            rotationX: -py * (perto ? CURSOR.inclinacaoPerto : CURSOR.inclinacaoLonge),
            x: perto ? px * CURSOR.deslocamentoX : 0,
            y: perto ? py * CURSOR.deslocamentoY : 0,
            duration: perto ? 0.8 : 1.4,
            ease: perto ? "power3.out" : "elastic.out(1, 0.35)",
            overwrite: "auto",
        });
    });
};
