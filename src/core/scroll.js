/* Smooth scrolling e sua sincronia com o ScrollTrigger. */

const DURACAO_SCROLL = 1.1;
const ALTURA_NAV = 64;

let instancia = null;

/*
 * Instância única do Lenis. Com o Lenis no comando, o ScrollTrigger
 * precisa ser avisado a cada quadro: sem isso ele continua lendo a
 * posição nativa e os gatilhos disparam fora de hora. O `lagSmoothing(0)`
 * é exigência da integração documentada pelo Lenis.
 */
export const initScroll = () => {
    if (instancia) {
        return instancia;
    }

    if (typeof Lenis === "undefined" || typeof gsap === "undefined") {
        return null;
    }

    instancia = new Lenis({ duration: DURACAO_SCROLL, smoothWheel: true });

    if (typeof ScrollTrigger !== "undefined") {
        instancia.on("scroll", ScrollTrigger.update);
    }

    gsap.ticker.add((tempo) => instancia.raf(tempo * 1000));
    gsap.ticker.lagSmoothing(0);

    ligarAncoras();

    return instancia;
};

const ligarAncoras = () => {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (evento) => {
            const alvo = document.querySelector(link.getAttribute("href"));

            if (!alvo) {
                return;
            }

            evento.preventDefault();
            instancia.scrollTo(alvo, { offset: -ALTURA_NAV });
        });
    });
};

/*
 * As fontes chegam depois do primeiro paint e mudam a altura do texto;
 * sem recalcular, os gatilhos de scroll ficam presos na medida antiga.
 */
export const recalcularAoCarregar = () => {
    if (typeof ScrollTrigger === "undefined") {
        return;
    }

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
    }

    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
};
