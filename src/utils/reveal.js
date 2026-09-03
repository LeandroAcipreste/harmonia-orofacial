const MARGEM_PADRAO = "0px 0px -15% 0px";
const CLASSE_VISIVEL = "is-visivel";

export const revelarAoEntrar = (elementos, { margem = MARGEM_PADRAO, repetir = true } = {}) => {
    const alvos = Array.from(elementos);

    if (!alvos.length) {
        return null;
    }

    if (typeof IntersectionObserver === "undefined") {
        alvos.forEach((alvo) => alvo.classList.add(CLASSE_VISIVEL));
        return null;
    }

    const observador = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add(CLASSE_VISIVEL);

                    if (!repetir) {
                        observador.unobserve(entrada.target);
                    }

                    return;
                }

                if (repetir && entrada.boundingClientRect.top > 0) {
                    entrada.target.classList.remove(CLASSE_VISIVEL);
                }
            });
        },
        { rootMargin: margem }
    );

    alvos.forEach((alvo) => observador.observe(alvo));

    return observador;
};
