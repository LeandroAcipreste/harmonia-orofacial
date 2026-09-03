const DURACAO_TOTAL = 5000;
const ESPERA_ANTES_DE_SAIR = 420;
const LIMITE_SEGURANCA = DURACAO_TOTAL + 7000;

const suavizar = (t) => 1 - Math.pow(1 - t, 3);

export const initPreloader = () => {
    const preloader = document.querySelector(".preloader");

    if (!preloader) {
        return;
    }

    const denteFill = preloader.querySelector(".preloader__dente-fill");
    const barraFill = preloader.querySelector(".preloader__barra-fill");
    const contador = preloader.querySelector(".preloader__num");

    let quadro = 0;
    let inicio = null;
    let ultimoInteiro = -1;
    let encerrado = false;

    const encerrar = () => {
        if (encerrado) {
            return;
        }

        encerrado = true;
        window.cancelAnimationFrame(quadro);
        document.documentElement.classList.remove("esta-carregando");
        preloader.remove();

        if (typeof ScrollTrigger !== "undefined") {
            ScrollTrigger.refresh();
        }
    };

    if (document.documentElement.classList.contains("sem-preloader")) {
        encerrar();
        return;
    }

    document.documentElement.classList.add("esta-carregando");
    preloader.classList.add("js-ativo");

    const pintar = (p) => {
        if (denteFill) {
            denteFill.style.clipPath = `inset(${(1 - p) * 100}% 0 0 0)`;
        }

        if (barraFill) {
            barraFill.style.transform = `scaleX(${p})`;
        }

        const inteiro = Math.round(p * 100);

        if (contador && inteiro !== ultimoInteiro) {
            ultimoInteiro = inteiro;
            contador.textContent = inteiro;
        }
    };

    const sair = () => {
        preloader.addEventListener("transitionend", encerrar, { once: true });
        preloader.classList.add("esta-saindo");
    };

    const passo = (agora) => {
        if (inicio === null) {
            inicio = agora;
        }

        const bruto = Math.min(1, (agora - inicio) / DURACAO_TOTAL);

        pintar(suavizar(bruto));

        if (bruto < 1) {
            quadro = window.requestAnimationFrame(passo);
            return;
        }

        comHeroPronta(() => window.setTimeout(sair, ESPERA_ANTES_DE_SAIR));
    };

    pintar(0);
    quadro = window.requestAnimationFrame(passo);

    window.setTimeout(encerrar, LIMITE_SEGURANCA);
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
