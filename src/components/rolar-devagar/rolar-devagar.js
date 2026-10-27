/* CONTINUE ROLANDO DEVAGAR (rolar-devagar.css)

   Quando a rolagem para por PARADA_MS, o aviso procura um lugar livre: tenta os LUGARES em ordem e fica no
   primeiro em que nenhum ponto da caixa dele cai sobre texto, foto ou card. Nenhum livre, nenhum aviso.
   Some assim que a rolagem volta. Nao aparece na hero antes da primeira rolagem (ela tem o aviso dela) nem no
   rodape (nao ha mais para onde rolar). So trabalha quando a rolagem para: nada por quadro. */
const PARADA_MS = 1200;
const LUGARES = ["centro", "direita", "esquerda", "meio", "alto"];
const FOLGA = 12;
// foto ou card que ocupa mais que isso da tela e fundo, nao informacao
const FUNDO = 0.5;
const INFORMACAO = "p, h1, h2, h3, h4, li, blockquote, figure, img, picture, a, button, .shell-card, .avaliacao";

export const initRolarDevagar = () => {
    const hero = document.querySelector(".hero");
    const rodape = document.querySelector(".rodape");

    const aviso = document.createElement("div");
    aviso.className = "rolar-devagar rolar-devagar--centro";
    aviso.setAttribute("aria-hidden", "true");
    aviso.innerHTML =
        '<span class="rolar-devagar__texto rolar-devagar__texto--mouse">continue rolando devagar</span>' +
        '<span class="rolar-devagar__texto rolar-devagar__texto--toque">continue deslizando devagar</span>' +
        '<span class="rolar-devagar__trilho"><span class="rolar-devagar__ponto"></span></span>';
    document.body.appendChild(aviso);

    let espera = 0;
    let lugar = "centro";

    const ehInformacao = (el) => {
        const alvo = el.closest(INFORMACAO);

        if (!alvo || alvo === aviso || aviso.contains(alvo)) {
            return false;
        }

        const caixa = alvo.getBoundingClientRect();
        return caixa.width * caixa.height < window.innerWidth * window.innerHeight * FUNDO;
    };

    const livre = () => {
        const caixa = aviso.getBoundingClientRect();
        const x0 = caixa.left - FOLGA;
        const y0 = caixa.top - FOLGA;
        const w = caixa.width + FOLGA * 2;
        const h = caixa.height + FOLGA * 2;

        for (let i = 0; i <= 4; i++) {
            for (let j = 0; j <= 3; j++) {
                const x = Math.min(window.innerWidth - 1, Math.max(0, x0 + (w * i) / 4));
                const y = Math.min(window.innerHeight - 1, Math.max(0, y0 + (h * j) / 3));

                if (document.elementsFromPoint(x, y).some(ehInformacao)) {
                    return false;
                }
            }
        }

        return true;
    };

    const posicionar = (nome) => {
        aviso.classList.remove("rolar-devagar--" + lugar);
        lugar = nome;
        aviso.classList.add("rolar-devagar--" + lugar);
    };

    const podeAparecer = () => {
        if (document.documentElement.classList.contains("esta-carregando")) {
            return false;
        }

        if (hero && !hero.classList.contains("ja-rolou") && window.scrollY < window.innerHeight * 0.5) {
            return false;
        }

        return !rodape || rodape.getBoundingClientRect().top > window.innerHeight * 0.6;
    };

    const mostrar = () => {
        if (!podeAparecer()) {
            return;
        }

        const achou = LUGARES.find((nome) => {
            posicionar(nome);
            return livre();
        });

        aviso.classList.toggle("esta-visivel", Boolean(achou));
    };

    window.addEventListener(
        "scroll",
        () => {
            aviso.classList.remove("esta-visivel");
            window.clearTimeout(espera);
            espera = window.setTimeout(mostrar, PARADA_MS);
        },
        { passive: true },
    );

    window.addEventListener("resize", () => aviso.classList.remove("esta-visivel"));
};
