/* Smooth scrolling e sua sincronia com o ScrollTrigger. */

const DURACAO_SCROLL = 1.1;
const ALTURA_NAV = 64;
const LARGURA_MOVEL = 950;

let instancia = null;

/*
 * No toque não existe scroll suave por JavaScript que ganhe do nativo. O
 * navegador rola fora da thread principal, no compositor; o Lenis traz
 * isso de volta para a thread principal e passa a disputar espaço com
 * cada quadro de animação. O resultado é a rolagem engasgada.
 *
 * Por isso o Lenis fica só no ponteiro. No toque, rolagem nativa, e o
 * ScrollTrigger trabalha direto com ela, que é o caminho para o qual ele
 * foi feito.
 */
const ehMovel = () =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= LARGURA_MOVEL;

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

    comecarNoTopo();
    ligarAncoras();

    if (ehMovel()) {
        document.documentElement.classList.add("movel");
        return null;
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

    return instancia;
};

/*
 * Recarregar a página devolve o visitante ao hero.
 *
 * Quem recusa a restauração do navegador é o script no <head>: este
 * módulo tem `defer` e chegaria tarde demais para isso. Aqui só se
 * completa o serviço, rolando para o topo — inclusive no `load`, porque
 * o preloader trava a rolagem durante o carregamento e o Lenis, quando
 * existe, mantém a própria posição, que precisa ser zerada junto.
 */
const comecarNoTopo = () => {
    window.scrollTo(0, 0);

    window.addEventListener(
        "load",
        () => {
            window.scrollTo(0, 0);

            if (instancia) {
                instancia.scrollTo(0, { immediate: true });
            }
        },
        { once: true }
    );
};

const ligarAncoras = () => {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (evento) => {
            const alvo = document.querySelector(link.getAttribute("href"));

            if (!alvo) {
                return;
            }

            evento.preventDefault();
            irPara(alvo);
        });
    });
};

/* Com Lenis, quem leva é ele. Sem Lenis, o próprio navegador, que também
   sabe rolar suave. Os dois descontam a altura da barra fixa. */
const irPara = (alvo) => {
    if (instancia) {
        instancia.scrollTo(alvo, { offset: -ALTURA_NAV });
        return;
    }

    window.scrollTo({
        top: alvo.getBoundingClientRect().top + window.scrollY - ALTURA_NAV,
        behavior: "smooth",
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
