/* Pré-loader: o nível de dourado dentro do dente acompanha o carregamento. */

/* Altura do líquido em unidades do viewBox: vazio abaixo da raiz, cheio
   acima da coroa. */
const NIVEL_VAZIO = 20;
const NIVEL_CHEIO = 2;

/*
 * A rampa sobe sozinha até 90% e só fecha quando a página realmente
 * termina de carregar. É o mesmo princípio de uma barra de progresso de
 * navegador: nunca finge que acabou antes da hora, nem trava esperando
 * um número exato que o navegador não sabe informar.
 */
const DURACAO_RAMPA = 2.2;
const TETO_RAMPA = 0.9;
const DURACAO_FECHO = 0.6;

/* Recurso que nunca chega não pode prender a página do cliente. */
const LIMITE_SEGURANCA = 8000;

const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const initPreloader = () => {
    const preloader = document.querySelector(".preloader");

    if (!preloader) {
        return;
    }

    document.documentElement.classList.add("esta-carregando");

    /* Assume o controle e desliga a rede de segurança em CSS. */
    preloader.classList.add("js-ativo");

    if (typeof gsap === "undefined") {
        encerrar(preloader);
        return;
    }

    const nivel = preloader.querySelector(".preloader__nivel");
    const contador = preloader.querySelector(".preloader__num");
    const estado = { progresso: 0 };

    const pintar = () => {
        gsap.set(nivel, { y: NIVEL_VAZIO + (NIVEL_CHEIO - NIVEL_VAZIO) * estado.progresso });

        if (contador) {
            contador.textContent = Math.round(estado.progresso * 100);
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
