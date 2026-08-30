/* Hero: comportamento e animações. O fundo 3D vive em src/three. */

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

    carregarFundo(hero);

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

/*
 * Perto do centro a logomarca é atraída pelo cursor; longe, volta ao
 * lugar com elástica.
 *
 * Este é o único movimento do hero que não é barrado por
 * `prefers-reduced-motion`: ele não roda sozinho, só responde ao gesto de
 * quem está com a mão no mouse. O movimento automático segue barrado em
 * `animarNaRolagem`.
 */
const ligarAtracaoDoCursor = (medalhao) => {
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
