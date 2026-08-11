/* Navegação: entrada da barra, risquinho do hover e menu do celular. */

const ENTRADA = { deslocamento: -60, duracao: 1 };

/* Mesma largura em que o CSS troca a barra pelo menu recolhido. */
const CONSULTA_MOVEL = "(max-width: 899px)";

const CLASSE_ABERTO = "is-aberto";

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

/*
 * O estado do menu vive numa classe só, e o CSS cuida do resto. O botão
 * carrega `aria-expanded` porque é ele que anuncia o estado para leitor
 * de tela.
 */
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

    /* Escolheu uma dobra, o menu sai da frente antes da rolagem começar. */
    nav.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", fechar);
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            fechar();
        }
    });

    /* Ao passar para a barra larga o menu recolhido deixa de existir, e um
       estado aberto esquecido deixaria a barra alta sem motivo. */
    const larga = window.matchMedia(CONSULTA_MOVEL);

    larga.addEventListener("change", (evento) => {
        if (!evento.matches) {
            fechar();
        }
    });
};
