/* Navegação: entrada da barra e risquinho do hover. */

const ENTRADA = { deslocamento: -60, duracao: 1 };

export const initNavigation = () => {
    const nav = document.querySelector(".nav");

    if (!nav) {
        return;
    }

    /* O risquinho é enfeite, não conteúdo, por isso nasce aqui e não no
       HTML. Quem o anima é o CSS. */
    nav.querySelectorAll(".nav-link").forEach((link) => {
        const risco = document.createElement("span");
        risco.className = "nav-link__risco";
        link.appendChild(risco);
    });

    if (typeof gsap === "undefined") {
        return;
    }

    gsap.fromTo(
        nav,
        { y: ENTRADA.deslocamento, opacity: 0 },
        { y: 0, opacity: 1, duration: ENTRADA.duracao, ease: "power3.out" }
    );
};
