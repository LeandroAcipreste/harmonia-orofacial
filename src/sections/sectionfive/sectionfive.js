/* A clínica: entrada do cabeçalho e da grade de fotos. */

import { revelarAoEntrar } from "../../utils/reveal.js";
import { ligarBrilhoDoCursor } from "../../components/shellcard/shellcard.js";

const MARGEM_CABECALHO = "0px 0px -15% 0px";
const MARGEM_GRADE = "0px 0px -20% 0px";

export const initSectionFive = () => {
    const secao = document.querySelector(".s5");

    if (!secao) {
        return;
    }

    secao.classList.add("js-anim");
    void secao.offsetHeight;

    revelarAoEntrar(secao.querySelectorAll(".s5-anim"), { margem: MARGEM_CABECALHO });

    ligarBrilhoDoCursor(secao.querySelectorAll(".shell-card"));

    revelarGrade(secao.querySelector(".s5__grade"));
};

/* Quem entra é a grade: os atrasos da cascata vêm do CSS. */
const revelarGrade = (grade) => {
    if (!grade) {
        return;
    }

    grade.classList.add("js-anim");
    void grade.offsetHeight;

    revelarAoEntrar([grade], { margem: MARGEM_GRADE });
};
