import { revelarAoEntrar } from "../../utils/reveal.js";

const MARGEM_RODAPE = "0px 0px -10% 0px";

export const initFooter = () => {
    const rodape = document.querySelector(".rodape");

    if (!rodape) {
        return;
    }

    const alvos = rodape.querySelectorAll(".rodape-anim");

    if (!alvos.length) {
        return;
    }

    rodape.classList.add("js-anim");
    void rodape.offsetHeight;

    revelarAoEntrar(alvos, { margem: MARGEM_RODAPE });
};
