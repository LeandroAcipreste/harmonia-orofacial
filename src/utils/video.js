/* Reprodução de vídeo atrelada à presença na tela. */

const FRACAO_PADRAO = 0.35;

/*
 * Vídeo pesa, então só roda enquanto está à vista, e o
 * IntersectionObserver resolve isso sem ScrollTrigger no meio. A política
 * de autoplay pode recusar a reprodução mesmo com o vídeo mudo, e nesse
 * caso o primeiro quadro ou o poster continua no lugar.
 */
export const tocarQuandoVisivel = (video, { fracaoVisivel = FRACAO_PADRAO } = {}) => {
    if (!video || typeof IntersectionObserver === "undefined") {
        return null;
    }

    const observador = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) {
                    video.pause();
                    return;
                }

                const reproducao = video.play();

                if (reproducao) {
                    reproducao.catch(() => {});
                }
            });
        },
        { threshold: fracaoVisivel }
    );

    observador.observe(video);

    return observador;
};
