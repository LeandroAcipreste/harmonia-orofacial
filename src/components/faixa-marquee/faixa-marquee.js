const CLASSE_PARADA = "esta-parada";
const MARGEM = "200px 0px 200px 0px";

const COPIAS_POR_METADE = 6;

const preencherTrilho = (trilho) => {
    const modelo = trilho.querySelector(".faixa-marquee__item");

    if (!modelo) {
        return;
    }

    const fila = document.createDocumentFragment();

    for (let i = 1; i < COPIAS_POR_METADE * 2; i += 1) {
        fila.appendChild(modelo.cloneNode(true));
    }

    trilho.appendChild(fila);
};

export const initFaixaMarquee = () => {
    const faixa = document.querySelector(".faixa-marquee");

    if (!faixa) {
        return;
    }

    const trilho = faixa.querySelector(".faixa-marquee__trilho");

    if (trilho) {
        preencherTrilho(trilho);
    }

    if (typeof IntersectionObserver === "undefined") {
        return;
    }

    const observador = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((entrada) => {
                faixa.classList.toggle(CLASSE_PARADA, !entrada.isIntersecting);
            });
        },
        { rootMargin: MARGEM }
    );

    observador.observe(faixa);
};
