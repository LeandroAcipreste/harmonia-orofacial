import { DEMONSTRACAO } from "../core/config.js";
import { comBusca, enviar, pedir } from "./http.js";
import {
    alertasDeDemonstracao,
    atualizarInsumoDeDemonstracao,
    cadastrarInsumoDeDemonstracao,
    consumirDeDemonstracao,
    extratoDeDemonstracao,
    insumosDeDemonstracao,
    moverInsumoDeDemonstracao,
} from "./demonstracao.js";

const ROTAS = {
    insumos: "/api/insumos",
    insumo: "/api/insumos/",
    alertas: "/api/insumos/alertas",
    ficha: "/api/agendamentos/",
};

const MENSAGENS = {
    lista: "Não foi possível carregar o inventário.",
    alertas: "Não foi possível saber o que está acabando.",
    cadastrar: "O insumo não foi cadastrado. Tente de novo.",
    atualizar: "O insumo não foi salvo. Tente de novo.",
    mover: "O movimento não foi lançado. Tente de novo.",
    extrato: "Não foi possível carregar o extrato deste insumo.",
    consumir: "O consumo não foi lançado. Tente de novo.",
};

export const TIPOS = {
    entrada: "Entrada",
    saida: "Consumo",
    perda: "Perda",
    ajuste: "Ajuste",
};

/* Quantidade aceita vírgula ou ponto, e guarda até três casas: existe
   insumo que se mede em ml e em grama, não só em unidade. */
export const emQuantidade = (texto) => {
    const limpo = String(texto ?? "").trim().replace(",", ".");

    if (!limpo) {
        return 0;
    }

    const numero = Number(limpo);

    return Number.isFinite(numero) ? Math.round(numero * 1000) / 1000 : 0;
};

const NUMERO = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

export const comoQuantidade = (valor, unidade) =>
    NUMERO.format(Number(valor) || 0) + (unidade ? " " + unidade : "");

export const insumos = ({ busca, situacao } = {}) => {
    if (DEMONSTRACAO) {
        return insumosDeDemonstracao({ busca, situacao });
    }

    return pedir(comBusca(ROTAS.insumos, { busca, situacao }), {}, MENSAGENS.lista);
};

/* O aviso da doutora. Sai no selo do menu de todas as telas do sistema, e
   por isso vive num serviço, e não na tela de inventário. */
export const alertas = () => {
    if (DEMONSTRACAO) {
        return alertasDeDemonstracao();
    }

    return pedir(ROTAS.alertas, {}, MENSAGENS.alertas);
};

export const cadastrarInsumo = (insumo) => {
    if (DEMONSTRACAO) {
        return cadastrarInsumoDeDemonstracao(insumo);
    }

    return enviar(ROTAS.insumos, insumo, MENSAGENS.cadastrar);
};

export const atualizarInsumo = (id, insumo) => {
    if (DEMONSTRACAO) {
        return atualizarInsumoDeDemonstracao(id, insumo);
    }

    return enviar(ROTAS.insumo + encodeURIComponent(id), insumo, MENSAGENS.atualizar, "PUT");
};

export const moverInsumo = (id, movimento) => {
    if (DEMONSTRACAO) {
        return moverInsumoDeDemonstracao(id, movimento);
    }

    return enviar(
        ROTAS.insumo + encodeURIComponent(id) + "/movimentos",
        movimento,
        MENSAGENS.mover,
    );
};

export const extrato = (id) => {
    if (DEMONSTRACAO) {
        return extratoDeDemonstracao(id);
    }

    return pedir(ROTAS.insumo + encodeURIComponent(id) + "/extrato", {}, MENSAGENS.extrato);
};

/* O consumo do atendimento vai em lote: "usei anestésico, agulha e
   sugador" é um gesto só, e ou entra inteiro ou não entra. */
export const consumirNoAtendimento = (avaliacaoId, itens) => {
    if (DEMONSTRACAO) {
        return consumirDeDemonstracao(avaliacaoId, itens);
    }

    return enviar(
        ROTAS.ficha + encodeURIComponent(avaliacaoId) + "/insumos",
        { itens },
        MENSAGENS.consumir,
    );
};
