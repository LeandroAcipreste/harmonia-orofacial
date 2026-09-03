const MONTAGENS = [
    { consulta: "(max-aspect-ratio: 13/20)", arquivo: "assets/hero-espiral-mobile.mp4" },
    { consulta: "(max-aspect-ratio: 23/20)", arquivo: "assets/hero-espiral-tablet.mp4" },
    { consulta: null, arquivo: "assets/hero-espiral.mp4" },
];

const montagemDaVez = () =>
    MONTAGENS.find(
        ({ consulta }) => consulta === null || window.matchMedia(consulta).matches,
    );

const trocarMontagem = (video, arquivo) => {
    const ponto = video.currentTime;

    video.style.visibility = "hidden";
    video.src = arquivo;

    video.addEventListener(
        "loadeddata",
        () => {

            if (Number.isFinite(video.duration) && video.duration > 0) {
                video.currentTime = ponto % video.duration;
            }

            video.style.visibility = "";

            if (!video.closest(".hero").classList.contains("is-fora")) {
                tocar(video);
            }
        },
        { once: true },
    );

    video.load();
};

const ESPERA = 250;

const seguirAProporcao = (video) => {
    let agendado = null;

    const reavaliar = () => {
        const { arquivo } = montagemDaVez();

        if (!video.currentSrc.endsWith(arquivo)) {
            trocarMontagem(video, arquivo);
        }
    };

    const adiar = () => {
        window.clearTimeout(agendado);
        agendado = window.setTimeout(reavaliar, ESPERA);
    };

    window.addEventListener("resize", adiar, { passive: true });
    window.addEventListener("orientationchange", adiar, { passive: true });
};

const tocar = (video) => {
    const promessa = video.play();

    if (promessa && typeof promessa.catch === "function") {
        promessa.catch(() => {

        });
    }
};

let deveTocar = true;

export const initHero = () => {
    const hero = document.querySelector(".hero");

    if (!hero) {
        return;
    }

    const video = hero.querySelector(".hero__video");

    if (video) {
        tocar(video);

        video.addEventListener("pause", () => {
            if (deveTocar && !hero.classList.contains("is-fora")) {
                tocar(video);
            }
        });

        seguirAProporcao(video);
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);
    animarNaRolagem(hero, video);
};

const animarNaRolagem = (hero, video) => {
    gsap.to(hero, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "60% top",
            scrub: true,
            onUpdate: (self) => {
                if (!video) {
                    return;
                }

                if (self.progress > 0 && deveTocar) {
                    deveTocar = false;
                    video.pause();
                    document.dispatchEvent(new CustomEvent("harmonia:hero-parado"));
                    return;
                }

                if (self.progress === 0 && !deveTocar) {
                    deveTocar = true;
                    tocar(video);
                }
            },
            onLeave: () => {
                hero.classList.add("is-fora");
            },
            onEnterBack: () => {
                hero.classList.remove("is-fora");
            },
        },
    });
};
