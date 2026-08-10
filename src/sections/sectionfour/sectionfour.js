/* Conheça a Dra. Célia: entrada do texto, das áreas de atuação e do vídeo. */

import { revelarAoEntrar } from "../../utils/reveal.js";
import { tocarQuandoVisivel } from "../../utils/video.js";

const MARGEM_TEXTO = "0px 0px -15% 0px";

export const initSectionFour = () => {
    const secao = document.querySelector(".s4");

    if (!secao) {
        return;
    }

    const alvos = secao.querySelectorAll(".s4-anim, .s4__nome-mascara");

    if (!alvos.length) {
        return;
    }

    secao.classList.add("js-anim");
    void secao.offsetHeight;

    revelarAoEntrar(alvos, { margem: MARGEM_TEXTO });

    tocarQuandoVisivel(secao.querySelector(".s4__video-fonte"));
};
