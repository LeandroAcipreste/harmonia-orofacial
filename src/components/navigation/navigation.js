const ENTRADA = { deslocamento: -60, duracao: 1 };

const CONSULTA_MOVEL = "(max-width: 899px)";

const CLASSE_ABERTO = "is-aberto";

const CLASSE_RECOLHIDA = "esta-recolhida";

/* Só some onde existe cursor para trazê-la de volta. No celular e no
   tablet, sem cursor, uma barra escondida não voltaria nunca. */
const CONSULTA_CURSOR = "(hover: hover) and (pointer: fine)";

/* A altura da barra (4rem). É a região que, com o cursor em cima, traz a
   barra de volta, e também a linha que a hero precisa cruzar para contar
   como deixada para trás. */
const ALTURA_DA_REGIAO = 64;

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
    ligarRecolhimento(nav);

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

/* A BARRA SE RECOLHE DEPOIS DA HERO

   Passou da hero, a barra sobe e sai da frente do conteúdo. O cursor
   chegando no topo da tela traz ela de volta, e sair dali recolhe de novo.

   Nada aqui roda por quadro:
   - quem sabe que a hero ficou para trás é um IntersectionObserver, e não
     um ouvinte de rolagem;
   - o mousemove só compara um número, e só mexe na classe quando o estado
     muda. Nenhuma leitura de layout.

   Com o menu aberto, a barra nunca recolhe: seria fechar a porta na cara
   de quem está escolhendo para onde ir. */
const ligarRecolhimento = (nav) => {
    const hero = document.querySelector("#hero");

    if (!hero || typeof IntersectionObserver === "undefined") {
        return;
    }

    const comCursor = window.matchMedia(CONSULTA_CURSOR);

    let passouDaHero = false;
    let cursorNaRegiao = false;

    const aplicar = () => {
        const recolher =
            comCursor.matches &&
            passouDaHero &&
            !cursorNaRegiao &&
            !nav.classList.contains(CLASSE_ABERTO);

        nav.classList.toggle(CLASSE_RECOLHIDA, recolher);
    };

    const observador = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((entrada) => {
                passouDaHero = !entrada.isIntersecting;
                aplicar();
            });
        },
        /* A hero conta como deixada para trás quando o pé dela passa por
           baixo da barra, e não quando some da tela inteira. */
        { rootMargin: "-" + ALTURA_DA_REGIAO + "px 0px 0px 0px" },
    );

    observador.observe(hero);

    document.addEventListener(
        "mousemove",
        (evento) => {
            const naRegiao = evento.clientY <= ALTURA_DA_REGIAO;

            if (naRegiao !== cursorNaRegiao) {
                cursorNaRegiao = naRegiao;
                aplicar();
            }
        },
        { passive: true },
    );

    /* Saiu da janela (foi para as abas do navegador, por exemplo): conta
       como saiu da região. */
    document.documentElement.addEventListener("mouseleave", () => {
        if (cursorNaRegiao) {
            cursorNaRegiao = false;
            aplicar();
        }
    });

    comCursor.addEventListener("change", aplicar);
};
