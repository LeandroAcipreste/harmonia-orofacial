import { prefereMovimentoReduzido } from "../../utils/movimento.js";

/* Pré-loader: o dente dourado enche de baixo para cima acompanhando o carregamento. */

/*
 * O dente preenche de forma puramente estética e fluida em 5 segundos cravados,
 * garantindo que a animação não dê saltos ("trancos") esperando eventos do
 * navegador enquanto o vídeo do hero carrega no fundo.
 */
const DURACAO_TOTAL = 5.0;

/* Limite de segurança para caso a animação de saída falhe */
const LIMITE_SEGURANCA = 6000;

const reduzido = prefereMovimentoReduzido();

export const initPreloader = () => {
    const preloader = document.querySelector(".preloader");

    if (!preloader) {
        return;
    }

    /* O <head> já decidiu que esta visita não abre com o preloader. A
       camada nunca chegou a pintar; aqui ela só sai do documento, sem
       travar a rolagem e sem animação de saída para desfazer. */
    if (document.documentElement.classList.contains("sem-preloader")) {
        preloader.remove();
        return;
    }

    document.documentElement.classList.add("esta-carregando");

    /* Assume o controle e desliga a rede de segurança em CSS. */
    preloader.classList.add("js-ativo");

    if (typeof gsap === "undefined") {
        encerrar(preloader);
        return;
    }

    const denteFill = preloader.querySelector(".preloader__dente-fill");
    const barraFill = preloader.querySelector(".preloader__barra-fill");
    const contador = preloader.querySelector(".preloader__num");
    const estado = { progresso: 0 };

    const pintar = () => {
        const p = estado.progresso;

        /* Revela a imagem de baixo para cima via clip-path inset:
           inset(top right bottom left) — variamos o top de 100% a 0%. */
        if (denteFill) {
            const topClip = (1 - p) * 100;
            gsap.set(denteFill, { clipPath: `inset(${topClip}% 0 0 0)` });
        }

        /* Barra de progresso fina */
        if (barraFill) {
            gsap.set(barraFill, { width: `${p * 100}%` });
        }

        /* Contador numérico */
        if (contador) {
            contador.textContent = Math.round(p * 100);
        }
    };

    pintar();

    /*
     * Uma única animação fluida de 0 a 100% que dura exatamente 5 segundos.
     * Assim o carregamento visual não sofre engasgos com a latência de rede
     * do vídeo do hero, e entrega a experiência premium pedida.
     */
    gsap.to(estado, {
        progresso: 1,
        duration: DURACAO_TOTAL,
        ease: "power1.inOut",
        onUpdate: pintar,
        onComplete: () => sair(preloader)
    });
};

/*
 * A saída segue a direção do enchimento: o fundo é recortado de baixo
 * para cima e um risco dourado corre na borda desse corte, como se o
 * líquido tivesse subido e levado a tela junto.
 */
const sair = (preloader) => {
    const fundo = preloader.querySelector(".preloader__fundo");
    const palco = preloader.querySelector(".preloader__palco");
    const risco = preloader.querySelector(".preloader__risco");

    const linha = gsap.timeline({ onComplete: () => encerrar(preloader) });

    if (reduzido) {
        linha.to(preloader, { opacity: 0, duration: 0.4, ease: "power2.out" });
        return;
    }

    linha
        .to(palco, { opacity: 0, y: -20, duration: 0.45, ease: "power2.in" })
        .set(risco, { opacity: 1 }, "-=0.1")
        .to(fundo, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "power3.inOut" }, "<")
        .to(risco, { y: () => -window.innerHeight, duration: 0.9, ease: "power3.inOut" }, "<")
        .to(risco, { opacity: 0, duration: 0.2 }, "-=0.2");
};

/*
 * Some com a camada de vez e recalcula os gatilhos: a página passou o
 * carregamento inteiro com a rolagem travada, então as medidas do
 * ScrollTrigger precisam ser refeitas com o layout já liberado.
 */
const encerrar = (preloader) => {
    document.documentElement.classList.remove("esta-carregando");
    preloader.remove();

    if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh();
    }
};

/*
 * Última rede: se qualquer coisa estourar no meio da animação de saída, a
 * página não pode ficar coberta e sem rolagem. Este temporizador roda
 * fora de toda a lógica acima e limpa a camada de qualquer jeito.
 */
window.setTimeout(() => {
    const preso = document.querySelector(".preloader");

    if (preso) {
        encerrar(preso);
    }

    document.documentElement.classList.remove("esta-carregando");
}, LIMITE_SEGURANCA + 2000);
