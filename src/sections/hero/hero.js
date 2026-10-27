import { nivelDaConexao } from "../../core/conexao.js";
import { escolherFonte } from "../../core/retrato.js";
import { freio } from "../../core/rolagem-toque.js";
import { buscarQuadro, ligarPorZona } from "../../core/video-rolagem.js";

const MONTAGENS = [
    {
        consulta: "(max-aspect-ratio: 13/20)",
        pesado: "assets/videos/hero/hero-espiral-mobile.mp4",
        leve: "assets/videos/hero/hero-espiral-mobile-leve.mp4",
        cartaz: "assets/images/hero/hero-espiral-mobile.webp",
    },
    {
        consulta: "(max-aspect-ratio: 23/20)",
        pesado: "assets/videos/hero/hero-espiral-tablet.mp4",
        leve: "assets/videos/hero/hero-espiral-tablet-leve.mp4",
        cartaz: "assets/images/hero/hero-espiral-tablet.webp",
    },
    {
        consulta: null,
        pesado: "assets/videos/hero/hero-espiral.mp4",
        leve: "assets/videos/hero/hero-espiral-leve.mp4",
        cartaz: "assets/images/hero/hero-espiral.webp",
    },
];

// no celular em pe a hero e sempre a leve (540x1080): a pesada (720x1440, 12,6 Mbps) acelerada 3 vezes no comeco da
// rolagem travava o Android
const CELULAR = "(max-aspect-ratio: 13/20)";

const arquivoDaVez = () => {
    const montagem = montagemDaVez();
    const nivel = montagem.consulta === CELULAR ? "leve" : nivelDaConexao();

    return {
        arquivo: montagem[nivel] || montagem.pesado,
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

            if (deveTocar && !video.closest(".hero").classList.contains("is-fora")) {
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

const CLASSE_LIVRE = "esta-livre";
const CLASSE_ROLOU = "ja-rolou";

const acendeu = (video) => {
    window.requestAnimationFrame(() => {
        video.classList.add(CLASSE_PRONTO);

        const hero = video.closest(".hero");

        if (hero) {
            hero.classList.add(CLASSE_LIVRE);
        }
    });
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
            if (deveTocar) {
                tocar(video);
            }
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

// a pagina pode abrir ja com a espiral parada (recarregada no meio da segunda dobra): mostra o quadro, sem tocar
const tocarOuMostrarParado = (video) => {
    if (deveTocar) {
        tocar(video);
        return;
    }

    video.classList.add(CLASSE_PRONTO);
};

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
                tocarOuMostrarParado(video);
            },
            { once: true }
        );

        video.load();

        document.addEventListener(
            EVENTO_PRELOADER,
            () => {
                hero.classList.add(CLASSE_LIVRE);
                tocarOuMostrarParado(video);
            },
            { once: true },
        );

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

/* ABERTURA: o video de transicao comeca no quadro 0 exato da hero. Ao comecar a rolar, a hero acelera ate completar
   a volta; no quadro 0 a troca e um corte seco (a mesma imagem dos dois lados) e dali a rolagem leva o video, com
   freio. Voltando ao topo, o caminho se desfaz e a hero volta a girar do quadro 0. O gatilho e a .abertura, e nao
   a .hero, porque a hero fica presa (sticky). */
const ACELERA = 3;
// freio: a cada quadro o video anda essa fracao do que falta ate a rolagem. Rolando rapido, ele chega devagar.
const FREIO = freio(0.06);
// so a hero do desktop (16:9) e a mesma imagem do comeco da transicao; nas outras a troca e imediata
const MESMA_IMAGEM = /hero-espiral(-leve)?\.mp4$/;

const animarNaRolagem = (hero, video) => {
    const abertura = hero.closest(".abertura");
    const trilho = abertura && abertura.querySelector(".abertura__trilho");
    const transicao = hero.querySelector(".hero__transicao");

    if (!abertura || !trilho || !transicao || !video) {
        return;
    }

    // o arquivo da transicao (o de 16:9 ou o recorte do celular em pe) so baixa depois de escolhido
    escolherFonte(transicao);
    transicao.preload = "auto";
    transicao.load();
    ligarPorZona(transicao, abertura);

    let fase = "hero";            // hero | acelerando | transicao
    let alvo = 0;                 // onde a rolagem quer o video (0 a 1)
    let atual = 0;                // onde o video esta, perseguindo o alvo
    let laco = 0;
    let avisouParada = false;
    let acordada = false;

    const levarTransicao = (p) => {
        if (!Number.isFinite(transicao.duration) || transicao.duration <= 0) {
            return;
        }

        const tempo = p * Math.max(0, transicao.duration - 0.05);

        buscarQuadro(transicao, tempo);
    };

    // o Safari do iPhone so desenha o quadro buscado depois de o video ter tocado uma vez
    const acordar = () => {
        if (acordada) {
            return;
        }

        acordada = true;
        const promessa = transicao.play();

        if (promessa && typeof promessa.then === "function") {
            promessa.then(() => {
                transicao.pause();
                levarTransicao(atual);
            }).catch(() => {});
        }
    };

    const entrarNaTransicao = () => {
        fase = "transicao";
        deveTocar = false;
        video.playbackRate = 1;
        video.pause();
        hero.classList.add("na-transicao");
        perseguir();
    };

    const voltarParaHero = () => {
        fase = "hero";
        deveTocar = true;
        hero.classList.remove("na-transicao");
        video.currentTime = 0;
        video.playbackRate = 1;
        tocar(video);
    };

    // a hero acelera e, quando a volta completa (o loop recomeca no quadro 0), faz o corte
    const esperarQuadroZero = () => {
        let anterior = video.currentTime;

        const olhar = (agora, meta) => {
            if (fase !== "acelerando") {
                return;
            }

            const tempo = meta ? meta.mediaTime : video.currentTime;

            if (tempo + 0.5 < anterior) {
                entrarNaTransicao();
                return;
            }

            anterior = tempo;
            agendar();
        };

        const agendar = () => {
            if (typeof video.requestVideoFrameCallback === "function") {
                video.requestVideoFrameCallback(olhar);
            } else {
                window.requestAnimationFrame(olhar);
            }
        };

        agendar();
    };

    const perseguir = () => {
        window.cancelAnimationFrame(laco);

        const passo = () => {
            const falta = alvo - atual;
            atual = Math.abs(falta) < 0.0005 ? alvo : atual + falta * FREIO;
            levarTransicao(atual);

            if (atual >= 1 && !avisouParada) {
                avisouParada = true;
                document.dispatchEvent(new CustomEvent("harmonia:hero-parado"));
            }

            if (atual === 0 && alvo === 0) {
                voltarParaHero();
                return;
            }

            laco = atual === alvo ? 0 : window.requestAnimationFrame(passo);
        };

        laco = window.requestAnimationFrame(passo);
    };

    const aoRolar = (p) => {
        alvo = p;

        if (p > 0) {
            hero.classList.add(CLASSE_ROLOU);
            acordar();
        }

        if (fase === "hero" && p > 0) {
            if (!MESMA_IMAGEM.test(video.currentSrc || "")) {
                entrarNaTransicao();
                return;
            }

            fase = "acelerando";
            video.playbackRate = ACELERA;
            tocar(video);
            esperarQuadroZero();
            return;
        }

        if (fase === "acelerando" && p === 0) {
            fase = "hero";
            video.playbackRate = 1;
            return;
        }

        if (fase === "transicao" && !laco) {
            perseguir();
        }
    };

    const caminho = ScrollTrigger.create({
        trigger: abertura,
        start: "top top",
        end: () => `+=${trilho.offsetHeight}`,
        onUpdate: (self) => aoRolar(self.progress),
    });

    // pagina aberta ja no meio da abertura: vai direto para o ponto, sem esperar a volta da hero
    if (caminho.progress > 0) {
        alvo = atual = caminho.progress;
        hero.classList.add(CLASSE_ROLOU);
        entrarNaTransicao();
    }

    transicao.addEventListener("loadedmetadata", () => levarTransicao(atual));

    // a abertura inteira (hero presa + segunda dobra) saiu da tela: os videos somem
    ScrollTrigger.create({
        trigger: abertura,
        start: "top top",
        end: "bottom top",
        onLeave: () => hero.classList.add("is-fora"),
        onEnterBack: () => hero.classList.remove("is-fora"),
    });
};
