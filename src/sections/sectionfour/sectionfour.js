/* Conheça a Dra. Célia: entrada do texto e das áreas de atuação. */

import { revelarAoEntrar } from "../../utils/reveal.js";

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
};
