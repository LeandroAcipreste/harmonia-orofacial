import { prefereMovimentoReduzido } from "../../utils/movimento.js";

/* Pré-loader: o dente dourado enche de baixo para cima acompanhando o carregamento. */

/*
 * A rampa sobe sozinha até 90% e só fecha quando a página realmente
 * termina de carregar. É o mesmo princípio de uma barra de progresso de
 * navegador: nunca finge que acabou antes da hora, nem trava esperando
 * um número exato que o navegador não sabe informar.
 */
const DURACAO_RAMPA = 2.2;
const TETO_RAMPA = 0.9;
const DURACAO_FECHO = 0.6;

/*
 * Recurso que nunca chega não pode prender a página. O `load` só dispara
 * depois de imagens e metadados de vídeo, o que numa rede de celular
 * demora, então este limite é curto de propósito: passou disto, a página
 * abre mesmo que algo ainda esteja vindo.
 */
const LIMITE_SEGURANCA = 3500;

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

    const rampa = gsap.to(estado, {
        progresso: TETO_RAMPA,
        duration: DURACAO_RAMPA,
        ease: "power2.out",
        onUpdate: pintar,
    });

    let fechado = false;

    const concluir = () => {
        if (fechado) {
            return;
        }

        fechado = true;
        rampa.kill();

        gsap.to(estado, {
            progresso: 1,
            duration: DURACAO_FECHO,
            ease: "power2.inOut",
            onUpdate: pintar,
            onComplete: () => sair(preloader),
        });
    };

    if (document.readyState === "complete") {
        concluir();
    } else {
        window.addEventListener("load", concluir, { once: true });
    }

    window.setTimeout(concluir, LIMITE_SEGURANCA);
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
