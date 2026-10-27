const CONSULTA_MOVEL = "(max-width: 899px)";

const CLASSE_ABERTO = "is-aberto";

const CLASSE_RECOLHIDA = "esta-recolhida";

/* Só some onde existe cursor para trazê-la de volta. No celular e no
   tablet, sem cursor, uma barra escondida não voltaria nunca. */
const CONSULTA_CURSOR = "(hover: hover) and (pointer: fine)";

/* Distancia do topo da tela em que o cursor chegando traz a barra (a barra tem 4rem, 64 px; um pouco mais para
   ela surgir antes de o mouse encostar na borda). */
const REGIAO_DE_CHEGADA = 96;

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

    /* Sem entrada em GSAP: ele grava translate: none no estilo do elemento, e isso vence o translate da classe
       .esta-recolhida (a barra ficava presa a vista). Quem move a barra e so o CSS. */
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

/* A BARRA FICA ESCONDIDA E APARECE COM O CURSOR

   Onde existe cursor, a barra fica recolhida acima da tela desde o topo da pagina. O cursor chegando perto do
   alto da tela traz ela de volta, e sair dali recolhe de novo. No celular e no tablet, sem cursor, ela fica a
   vista: escondida, nao voltaria nunca.

   Nada aqui roda por quadro: o mousemove so compara um numero e so mexe na classe quando o estado muda.

   Com o menu aberto, a barra nunca recolhe: seria fechar a porta na cara de quem esta escolhendo para onde ir. */
const ligarRecolhimento = (nav) => {
    const comCursor = window.matchMedia(CONSULTA_CURSOR);

    let cursorNaRegiao = false;
    // notebook com tela de toque diz que o ponteiro principal e toque: o mouse se denuncia ao se mexer
    let temMouse = comCursor.matches;

    const aplicar = () => {
        const recolher =
            temMouse &&
            !cursorNaRegiao &&
            !nav.classList.contains(CLASSE_ABERTO);

        nav.classList.toggle(CLASSE_RECOLHIDA, recolher);
    };

    document.addEventListener(
        "pointermove",
        (evento) => {
            if (evento.pointerType !== "mouse") {
                return;
            }

            const naRegiao = evento.clientY <= REGIAO_DE_CHEGADA;

            if (!temMouse || naRegiao !== cursorNaRegiao) {
                temMouse = true;
                cursorNaRegiao = naRegiao;
                aplicar();
            }
        },
        { passive: true },
    );

    // clicou num link da barra: ela recolhe assim que o cursor sai do topo, sem o foco segurar
    nav.addEventListener("click", (evento) => {
        const link = evento.target.closest("a");

        if (link && evento.detail > 0) {
            link.blur();
        }
    });

    /* Saiu da janela (foi para as abas do navegador, por exemplo): conta
       como saiu da regiao. */
    document.documentElement.addEventListener("mouseleave", () => {
        if (cursorNaRegiao) {
            cursorNaRegiao = false;
            aplicar();
        }
    });

    comCursor.addEventListener("change", () => {
        temMouse = temMouse || comCursor.matches;
        aplicar();
    });
    aplicar();
};
