const ENTRADA = { deslocamento: -60, duracao: 1 };

const CONSULTA_MOVEL = "(max-width: 899px)";

const CLASSE_ABERTO = "is-aberto";

export const initNavigation = () => {
    const nav = document.querySelector(".nav");

    if (!nav) {
        return;
    }

    nav.querySelectorAll(".nav-link").forEach((link) => {
        const risco = document.createElement("span");
        risco.className = "nav-link__risco";
        link.appendChild(risco);
    });

    ligarMenu(nav);

    if (typeof gsap === "undefined") {
        return;
    }

    gsap.fromTo(
        nav,
        { y: ENTRADA.deslocamento, opacity: 0 },
        { y: 0, opacity: 1, duration: ENTRADA.duracao, ease: "power3.out" }
    );
};

const ligarMenu = (nav) => {
    const botao = nav.querySelector(".nav__botao");

    if (!botao) {
        return;
    }

    const fechar = () => {
        if (!nav.classList.contains(CLASSE_ABERTO)) {
            return;
        }

        nav.classList.remove(CLASSE_ABERTO);
        botao.setAttribute("aria-expanded", "false");
    };

    botao.addEventListener("click", () => {
        const aberto = nav.classList.toggle(CLASSE_ABERTO);
        botao.setAttribute("aria-expanded", String(aberto));
    });

    nav.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", fechar);
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            fechar();
        }
    });

    const larga = window.matchMedia(CONSULTA_MOVEL);

    larga.addEventListener("change", (evento) => {
        if (!evento.matches) {
            fechar();
        }
    });
};
