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

const prepararParaTocar = (video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
};

const tocar = (video) => {
    prepararParaTocar(video);

    const promessa = video.play();

    if (promessa && typeof promessa.catch === "function") {
        promessa.catch(() => {
            trocarPorImagem(video);
        });
    }
};

const ESPERA_PARA_DESISTIR = 2500;

const ANIMADAS = {
    "assets/hero-espiral-mobile.mp4": "assets/hero-espiral-mobile.anim.webp",
    "assets/hero-espiral-tablet.mp4": "assets/hero-espiral-mobile.anim.webp",
    "assets/hero-espiral.mp4": "assets/hero-espiral.anim.webp",
};

let trocado = false;

const trocarPorImagem = (video) => {
    if (trocado) {
        return;
    }

    trocado = true;

    const arquivo = ANIMADAS[montagemDaVez().arquivo];
    const hero = video.closest(".hero");

    if (!arquivo || !hero) {
        return;
    }

    const imagem = new Image();

    imagem.className = video.className;
    imagem.src = arquivo;
    imagem.alt = "";
    imagem.setAttribute("aria-hidden", "true");
    imagem.decoding = "async";

    imagem.addEventListener(
        "load",
        () => {
            video.replaceWith(imagem);
            document.dispatchEvent(new CustomEvent("harmonia:hero-parado"));
        },
        { once: true }
    );
};

let deveTocar = true;

export const initHero = () => {
    const hero = document.querySelector(".hero");

    if (!hero) {
        return;
    }

    const video = hero.querySelector(".hero__video");

    if (video) {
        video.src = montagemDaVez().arquivo;
        video.load();
        tocar(video);

        window.setTimeout(() => {
            if (video.paused || video.currentTime === 0) {
                trocarPorImagem(video);
            }
        }, ESPERA_PARA_DESISTIR);

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
