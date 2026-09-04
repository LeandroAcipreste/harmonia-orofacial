import { nivelDaConexao } from "../../core/conexao.js";

const MONTAGENS = [
    {
        consulta: "(max-aspect-ratio: 13/20)",
        pesado: "assets/hero-espiral-mobile.mp4",
        leve: "assets/hero-espiral-mobile-leve.mp4",
        cartaz: "assets/hero-espiral-mobile.webp",
    },
    {
        consulta: "(max-aspect-ratio: 23/20)",
        pesado: "assets/hero-espiral-tablet.mp4",
        leve: "assets/hero-espiral-tablet-leve.mp4",
        cartaz: "assets/hero-espiral-tablet.webp",
    },
    {
        consulta: null,
        pesado: "assets/hero-espiral.mp4",
        leve: "assets/hero-espiral-leve.mp4",
        cartaz: "assets/hero-espiral.webp",
    },
];

const arquivoDaVez = () => {
    const montagem = montagemDaVez();

    return {
        arquivo: montagem[nivelDaConexao()] || montagem.pesado,
        cartaz: montagem.cartaz,
    };
};

let trocandoFonte = false;

const montagemDaVez = () =>
    MONTAGENS.find(
        ({ consulta }) => consulta === null || window.matchMedia(consulta).matches,
    );

const trocarMontagem = (video, arquivo) => {
    const ponto = video.currentTime;

    trocandoFonte = true;
    video.style.visibility = "hidden";
    video.src = arquivo;

    video.addEventListener(
        "loadeddata",
        () => {
            if (Number.isFinite(video.duration) && video.duration > 0) {
                video.currentTime = ponto % video.duration;
            }

            video.style.visibility = "";
            trocandoFonte = false;

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
        const { arquivo, cartaz } = arquivoDaVez();

        if (!video.currentSrc.endsWith(arquivo)) {
            video.poster = cartaz;
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

const CLASSE_PRONTO = "esta-pronto";
const EVENTO_PRELOADER = "harmonia:preloader-fim";

const acendeu = (video) => {
    window.requestAnimationFrame(() => video.classList.add(CLASSE_PRONTO));
};

let retentativaArmada = false;

const tentarDeNovoQuandoDerConta = (video) => {
    if (retentativaArmada) {
        return;
    }

    retentativaArmada = true;

    video.addEventListener(
        "canplay",
        () => {
            retentativaArmada = false;
            tocar(video);
        },
        { once: true }
    );
};

const tocar = (video) => {
    prepararParaTocar(video);

    const promessa = video.play();

    if (!promessa || typeof promessa.then !== "function") {
        acendeu(video);
        return;
    }

    promessa
        .then(() => acendeu(video))
        .catch(() => tentarDeNovoQuandoDerConta(video));
};

let deveTocar = true;

export const initHero = () => {
    const hero = document.querySelector(".hero");

    if (!hero) {
        return;
    }

    const video = hero.querySelector(".hero__video");

    if (video) {
        const montagem = arquivoDaVez();

        prepararParaTocar(video);

        trocandoFonte = true;
        video.poster = montagem.cartaz;
        video.src = montagem.arquivo;

        video.addEventListener(
            "loadeddata",
            () => {
                trocandoFonte = false;
                tocar(video);
            },
            { once: true }
        );

        video.load();

        document.addEventListener(EVENTO_PRELOADER, () => tocar(video), {
            once: true,
        });

        video.addEventListener("pause", () => {
            if (trocandoFonte) {
                return;
            }

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
