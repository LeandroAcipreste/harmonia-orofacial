import { alertas } from "../../services/inventario.js";

/* O AVISO DE INSUMO ACABANDO

   Fica no menu de todas as telas do sistema, como um selo com a contagem, e
   vira faixa na agenda, que é onde a doutora começa o dia.

   Duas decisões:

   - É cortesia, não alarme. Se a chamada falhar, a tela continua inteira e
     ninguém vê erro nenhum: faltar o aviso é chato, mas quebrar a agenda
     por causa dele seria pior.
   - Quem não tem inventario.ver não pede nada. O servidor recusaria de
     qualquer jeito, e a tela não precisa bater na porta para descobrir. */

const PERMISSAO = "inventario.ver";

const DESTINO = "/pages/inventario/inventario.html";

const contar = (quantos) =>
    quantos === 1 ? "1 insumo no mínimo" : quantos + " insumos no mínimo";

const montarFaixa = (faixa, { quantos, insumos }) => {
    faixa.textContent = "";

    if (!quantos) {
        faixa.hidden = true;
        return;
    }

    const titulo = document.createElement("strong");

    titulo.className = "aviso-estoque__titulo";
    titulo.textContent = contar(quantos);

    /* Os três mais críticos por extenso: a doutora decide se vale a parada
       sem precisar abrir outra tela. */
    const nomes = document.createElement("span");

    nomes.className = "aviso-estoque__nomes";
    nomes.textContent = insumos
        .slice(0, 3)
        .map((insumo) => insumo.nome)
        .join(", ") + (quantos > 3 ? " e mais " + (quantos - 3) : "");

    const link = document.createElement("a");

    link.className = "aviso-estoque__link";
    link.href = DESTINO;
    link.textContent = "Ver inventário";

    faixa.appendChild(titulo);
    faixa.appendChild(nomes);
    faixa.appendChild(link);
    faixa.hidden = false;
};

export const montarAvisoDeEstoque = async (sessao) => {
    if (!(sessao && (sessao.permissoes || []).includes(PERMISSAO))) {
        return;
    }

    const selo = document.querySelector("#selo-insumos");
    const faixa = document.querySelector("#aviso-estoque");

    if (!selo && !faixa) {
        return;
    }

    try {
        const resumo = await alertas();

        if (selo) {
            selo.textContent = resumo.quantos ? String(resumo.quantos) : "";
            selo.hidden = !resumo.quantos;
        }

        if (faixa) {
            montarFaixa(faixa, resumo);
        }
    } catch (falha) {
        /* Sem aviso, e sem estrago: a tela segue. */
    }
};
