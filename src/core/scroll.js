const DURACAO_SCROLL = 1.4;
const MULTIPLICADOR_RODA = 0.8;
const SUAVIZACAO = (avanco) => 1 - Math.pow(1 - avanco, 4);

const ALTURA_NAV = 64;
const LARGURA_MOVEL = 950;

let instancia = null;

const ehMovel = () =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= LARGURA_MOVEL;

export const initScroll = () => {
    if (instancia) {
        return instancia;
    }

    comecarNoTopo();
    ligarAncoras();

    if (ehMovel()) {
        document.documentElement.classList.add("movel");
        return null;
    }

    if (typeof Lenis === "undefined" || typeof gsap === "undefined") {
        return null;
    }

    instancia = new Lenis({
        duration: DURACAO_SCROLL,
        easing: SUAVIZACAO,
        wheelMultiplier: MULTIPLICADOR_RODA,
        smoothWheel: true,
    });

    if (typeof ScrollTrigger !== "undefined") {
        instancia.on("scroll", ScrollTrigger.update);
    }

    gsap.ticker.add((tempo) => instancia.raf(tempo * 1000));
    gsap.ticker.lagSmoothing(0);

    return instancia;
};

const comecarNoTopo = () => {
    window.scrollTo(0, 0);

    window.addEventListener(
        "load",
        () => {
            window.scrollTo(0, 0);

            if (instancia) {
                instancia.scrollTo(0, { immediate: true });
            }
        },
        { once: true }
    );
};

const ligarAncoras = () => {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (evento) => {
            const alvo = document.querySelector(link.getAttribute("href"));

            if (!alvo) {
                return;
            }

            evento.preventDefault();
            irPara(alvo);
        });
    });
};

const irPara = (alvo) => {
    if (instancia) {
        instancia.scrollTo(alvo, { offset: -ALTURA_NAV });
        return;
    }

    window.scrollTo({
        top: alvo.getBoundingClientRect().top + window.scrollY - ALTURA_NAV,
        behavior: "smooth",
    });
};

export const recalcularAoCarregar = () => {
    if (typeof ScrollTrigger === "undefined") {
        return;
    }

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
    }

    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
};
