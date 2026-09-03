const FRACAO_PADRAO = 0.35;

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
