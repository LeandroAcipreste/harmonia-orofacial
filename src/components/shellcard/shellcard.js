import { porQuadro } from "../../utils/porQuadro.js";

const ALCANCE_PADRAO = 220;

const cartoes = [];
let ligado = false;

export const ligarBrilhoDoCursor = (elementos, { alcance = ALCANCE_PADRAO } = {}) => {
    const novos = Array.from(elementos);

    if (!novos.length) {
        return;
    }

    novos.forEach((elemento) => cartoes.push({ elemento, alcance }));

    if (ligado) {
        return;
    }

    ligado = true;

    window.addEventListener("pointermove", porQuadro(aoMover));
};

const aoMover = (evento) => {
    cartoes.forEach(({ elemento, alcance }) => {
        const caixa = elemento.getBoundingClientRect();
        const dx = evento.clientX - (caixa.left + caixa.width / 2);
        const dy = evento.clientY - (caixa.top + caixa.height / 2);
        const angulo = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        const meiaLargura = caixa.width / 2;
        const meiaAltura = caixa.height / 2;
        const borda = Math.sqrt(meiaLargura * meiaLargura + meiaAltura * meiaAltura);
        const proximidade = Math.max(0, 1 - Math.abs(distancia - borda) / alcance);

        elemento.style.setProperty("--cursor-angle", `${angulo}deg`);
        elemento.style.setProperty("--glow-opacity", proximidade.toFixed(3));
    });
};
