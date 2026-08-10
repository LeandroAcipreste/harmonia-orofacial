/* A clínica: entrada das peças e o vídeo rodando só quando está à vista. */

import { revelarAoEntrar } from "../../utils/reveal.js";

const MARGEM_CAPITULO = "0px 0px -15% 0px";
const MARGEM_PECAS = "0px 0px -20% 0px";

/* Fração do vídeo visível para valer a pena decodificá-lo. */
const VISIVEL_PARA_TOCAR = 0.35;

export const initSectionFive = () => {
    const secao = document.querySelector(".s5");

    if (!secao) {
        return;
    }

    secao.classList.add("js-anim");
    void secao.offsetHeight;

    revelarAoEntrar(secao.querySelectorAll(".s5-anim"), { margem: MARGEM_CAPITULO });

    /* Cada peça abre sozinha ao chegar, e não em bloco: é o que dá o
       ritmo desalinhado da seção. */
    revelarAoEntrar(secao.querySelectorAll(".s5__peca"), { margem: MARGEM_PECAS });

    ligarVideo(secao.querySelector(".s5__fonte--video"));
};

/*
 * O vídeo pesa, então só roda enquanto está à vista, e o
 * IntersectionObserver resolve isso sem ScrollTrigger no meio. A política
 * de autoplay pode recusar a reprodução mesmo com o vídeo mudo, e nesse
 * caso o poster continua no lugar.
 */
const ligarVideo = (video) => {
    if (!video || typeof IntersectionObserver === "undefined") {
        return;
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
        { threshold: VISIVEL_PARA_TOCAR }
    );

    observador.observe(video);
};
