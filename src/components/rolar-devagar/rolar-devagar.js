/* CONTINUE ROLANDO DEVAGAR (rolar-devagar.css)

   Fica na tela o tempo todo, desde o comeco de cada secao, para a pessoa saber logo que e para continuar rolando.
   A cada OLHAR_MS de rolagem ele confere se o lugar dele continua livre; se o texto, a foto ou o card chegou ali,
   tenta os LUGARES em ordem e vai para o primeiro livre. Nenhum livre, ele some ate abrir espaco.
   Nao aparece na hero antes da primeira rolagem (ela tem o aviso dela) nem no rodape (nao ha mais para onde rolar). */
const OLHAR_MS = 200;
// e tambem com a pagina parada: o conteudo continua chegando depois da rolagem (o texto da doutora terminando de
// entrar, a clinica no fim do video, as fotos correndo sozinhas)
const VIGIA_MS = 500;
// sempre no meio da largura da tela (nos cantos ele ficava sobre o vidro da porta, sem leitura): embaixo, no meio
// da altura ou no alto
const LUGARES = ["centro", "meio", "alto"];
const FOLGA = 12;
// foto ou card que ocupa mais que isso da tela e fundo, nao informacao
const FUNDO = 0.5;
// mascara maior que isso (em telas) ainda cobre tudo; menor, ja deixa ver o que esta atras
const MASCARA_QUE_COBRE = 6;
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

    // opacidade que o elemento tem de fato na tela (a dele vezes a de todos acima); memoria por conferencia
    const opacidadeReal = (el, memoria) => {
        if (!el || el === document.documentElement) {
            return 1;
        }

        if (memoria.has(el)) {
            return memoria.get(el);
        }

        const estilo = getComputedStyle(el);
        const valor = estilo.visibility === "hidden" ? 0 : parseFloat(estilo.opacity) * opacidadeReal(el.parentElement, memoria);
        memoria.set(el, valor);
        return valor;
    };

    // texto, foto ou card no ponto. Texto transparente conta (o da doutora fica transparente ate a leitura chegar
    // nele, e aparece ali); elemento com opacidade zero, nao
    const ehInformacao = (el, memoria) => {
        const alvo = el.closest(INFORMACAO);

        if (!alvo || alvo === aviso || aviso.contains(alvo)) {
            return false;
        }

        const caixa = alvo.getBoundingClientRect();

        if (caixa.width * caixa.height >= window.innerWidth * window.innerHeight * FUNDO) {
            return false;
        }

        return opacidadeReal(alvo, memoria) > 0.05;
    };

    // camada que esconde o que esta atras: foto ou video, ou fundo opaco (o dourado do letreiro sobre a doutora)
    const cobre = (el, memoria) => {
        if (opacidadeReal(el, memoria) < 0.9) {
            return false;
        }

        if (/^(IMG|VIDEO|CANVAS)$/.test(el.tagName)) {
            return true;
        }

        const estilo = getComputedStyle(el);

        // mascara ou recorte deixam ver o que esta atras, e o navegador ignora os dois ao achar o elemento no ponto
        // (o letreiro abre em forma de dente sobre a doutora e continua "por cima" dela)
        // Mascara gigante (o letreiro antes de abrir, 3400vmax) ainda cobre a tela inteira.
        const mascara = estilo.maskImage || estilo.webkitMaskImage || "none";

        if (estilo.clipPath !== "none") {
            return false;
        }

        if (mascara !== "none") {
            const tamanho = parseFloat(estilo.maskSize || estilo.webkitMaskSize) || 0;
            return tamanho > Math.max(window.innerWidth, window.innerHeight) * MASCARA_QUE_COBRE;
        }

        const cor = estilo.backgroundColor.match(/[\d.]+/g);
        const corOpaca = cor && (cor.length < 4 || parseFloat(cor[3]) >= 0.9) && estilo.backgroundColor !== "transparent";
        return Boolean(corOpaca) || estilo.backgroundImage !== "none";
    };

    const livre = () => {
        const memoria = new Map();
        const caixa = aviso.getBoundingClientRect();
        const x0 = caixa.left - FOLGA;
        const y0 = caixa.top - FOLGA;
        const w = caixa.width + FOLGA * 2;
        const h = caixa.height + FOLGA * 2;

        for (let i = 0; i <= 4; i++) {
            for (let j = 0; j <= 3; j++) {
                const x = Math.min(window.innerWidth - 1, Math.max(0, x0 + (w * i) / 4));
                const y = Math.min(window.innerHeight - 1, Math.max(0, y0 + (h * j) / 3));

                // de cima para baixo ate a primeira camada que cobre: texto atras dela (a doutora atras do
                // letreiro) nao ocupa o lugar; uma camada transparente por cima do texto nao o esconde
                for (const el of document.elementsFromPoint(x, y)) {
                    if (ehInformacao(el, memoria)) {
                        return false;
                    }

                    if (cobre(el, memoria)) {
                        break;
                    }
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
        espera = 0;

        if (!podeAparecer()) {
            aviso.classList.remove("esta-visivel");
            return;
        }

        // continua onde esta enquanto o lugar estiver livre: nao fica pulando de canto
        if (aviso.classList.contains("esta-visivel") && livre()) {
            return;
        }

        const achou = LUGARES.find((nome) => {
            posicionar(nome);
            return livre();
        });

        aviso.classList.toggle("esta-visivel", Boolean(achou));
    };

    const olhar = () => {
        if (!espera) {
            espera = window.setTimeout(mostrar, OLHAR_MS);
        }
    };

    window.addEventListener("scroll", olhar, { passive: true });
    window.addEventListener("resize", olhar);
    document.addEventListener("harmonia:preloader-fim", olhar);

    window.setInterval(() => {
        if (!document.hidden) {
            olhar();
        }
    }, VIGIA_MS);
};
