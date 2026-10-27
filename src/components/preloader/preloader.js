/* PRELOADER: a tela fica preta por meio segundo, depois o filme do medalhao surge do preto e toca. 0,7 s antes
   do fim (o tempo da saida no preloader.css) ele aproxima e some por cima da hero. Se o filme nao tocar, o site
   abre mesmo assim. */
const SAIDA = 0.7;
// a tela fica preta esse tempo antes de o filme comecar
const ESPERA_NO_PRETO = 500;
const LIMITE_SEGURANCA = 14000;

const EVENTO_FIM = "harmonia:preloader-fim";

export const initPreloader = () => {
    const preloader = document.querySelector(".preloader");

    if (!preloader) {
        return;
    }

    const filme = preloader.querySelector(".preloader__filme");

    let encerrado = false;
    let saindo = false;

    const encerrar = () => {
        if (encerrado) {
            return;
        }

        encerrado = true;
        document.documentElement.classList.remove("esta-carregando");
        preloader.remove();

        if (typeof ScrollTrigger !== "undefined") {
            ScrollTrigger.refresh();
        }
    };

    if (document.documentElement.classList.contains("sem-preloader") || !filme) {
        encerrar();
        document.dispatchEvent(new CustomEvent(EVENTO_FIM));
        return;
    }

    document.documentElement.classList.add("esta-carregando");
    preloader.classList.add("js-ativo");

    const sair = () => {
        if (saindo) {
            return;
        }

        saindo = true;
        comHeroPronta(() => {
            document.dispatchEvent(new CustomEvent(EVENTO_FIM));
            preloader.addEventListener("transitionend", encerrar, { once: true });
            preloader.classList.add("esta-saindo");
            window.setTimeout(encerrar, SAIDA * 1000 + 300);
        });
    };

    filme.addEventListener("timeupdate", () => {
        if (Number.isFinite(filme.duration) && filme.currentTime >= filme.duration - SAIDA) {
            sair();
        }
    });

    filme.addEventListener("ended", sair, { once: true });
    filme.addEventListener("error", sair, { once: true });

    filme.addEventListener("playing", () => filme.classList.add("esta-tocando"), { once: true });

    window.setTimeout(() => {
        const promessa = filme.play();

        if (promessa && typeof promessa.catch === "function") {
            promessa.catch(sair);
        }
    }, ESPERA_NO_PRETO);

    window.setTimeout(sair, LIMITE_SEGURANCA);
};

const PRONTA_O_BASTANTE = 3;
const ESPERA_MAXIMA = 4000;

const comHeroPronta = (aoPronta) => {
    const video = document.querySelector(".hero__video");

    if (!video || video.readyState >= PRONTA_O_BASTANTE) {
        aoPronta();
        return;
    }

    let resolvido = false;

    const liberar = () => {
        if (resolvido) {
            return;
        }

        resolvido = true;
        window.clearTimeout(desistir);
        eventos.forEach((e) => video.removeEventListener(e, liberar));
        aoPronta();
    };

    const eventos = ["canplay", "canplaythrough", "playing", "error"];

    eventos.forEach((e) => video.addEventListener(e, liberar, { once: true }));

    const desistir = window.setTimeout(liberar, ESPERA_MAXIMA);
};
