/* Brilho que segue o cursor, compartilhado por quem usa `.shell-card`. */

const ALCANCE_PADRAO = 220;

/*
 * Registro único com um único listener. Cada seção que chama entrega os
 * seus cartões e todos passam a ser atualizados no mesmo evento: dois
 * listeners de `pointermove` medindo caixas em paralelo seria trabalho
 * repetido a cada movimento do mouse.
 */
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
    window.addEventListener("pointermove", aoMover);
};

const aoMover = (evento) => {
    cartoes.forEach(({ elemento, alcance }) => {
        const caixa = elemento.getBoundingClientRect();
        const dx = evento.clientX - (caixa.left + caixa.width / 2);
        const dy = evento.clientY - (caixa.top + caixa.height / 2);
        const angulo = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        const distancia = Math.hypot(dx, dy);
        const borda = Math.hypot(caixa.width / 2, caixa.height / 2);
        const proximidade = Math.max(0, 1 - Math.abs(distancia - borda) / alcance);

        elemento.style.setProperty("--cursor-angle", `${angulo}deg`);
        elemento.style.setProperty("--glow-opacity", proximidade.toFixed(3));
    });
};
