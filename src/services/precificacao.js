import { DEMONSTRACAO } from "../core/config.js";
import { comBusca, enviar, pedir } from "./http.js";
import {
    catalogoDeDemonstracao,
    custosDeDemonstracao,
    precificacaoDeDemonstracao,
    removerCustoDeDemonstracao,
    rentabilidadeDeDemonstracao,
    salvarCustoDeDemonstracao,
    salvarParametrosDeDemonstracao,
    salvarProcedimentoDeDemonstracao,
} from "./demonstracao.js";

const ROTAS = {
    mesa: "/api/precificacao",
    catalogo: "/api/precificacao/catalogo",
    procedimentos: "/api/precificacao/procedimentos",
    custos: "/api/precificacao/custos",
    parametros: "/api/precificacao/parametros",
    rentabilidade: "/api/relatorios/rentabilidade",
};

const MENSAGENS = {
    mesa: "Não foi possível carregar a precificação.",
    catalogo: "Não foi possível carregar o catálogo de procedimentos.",
    procedimento: "O procedimento não foi salvo. Tente de novo.",
    custos: "Não foi possível carregar os custos fixos.",
    custo: "O custo não foi salvo. Tente de novo.",
    remover: "O custo não foi removido.",
    parametros: "Os parâmetros não foram salvos.",
    rentabilidade: "Não foi possível carregar a rentabilidade.",
};

/* A mesa inteira numa chamada: custo da hora, catálogo com custo, preço
   sugerido e margem de cada procedimento. */
export const precificacao = () => {
    if (DEMONSTRACAO) {
        return precificacaoDeDemonstracao();
    }

    return pedir(ROTAS.mesa, {}, MENSAGENS.mesa);
};

/* Só nome, duração e preço: é o que o painel precisa para autocompletar o
   orçamento sem carregar a precificação inteira. */
export const catalogo = () => {
    if (DEMONSTRACAO) {
        return catalogoDeDemonstracao();
    }

    return pedir(ROTAS.catalogo, {}, MENSAGENS.catalogo);
};

export const salvarProcedimento = (procedimento) => {
    if (DEMONSTRACAO) {
        return salvarProcedimentoDeDemonstracao(procedimento);
    }

    if (procedimento.id) {
        return enviar(
            ROTAS.procedimentos + "/" + encodeURIComponent(procedimento.id),
            procedimento,
            MENSAGENS.procedimento,
            "PUT",
        );
    }

    return enviar(ROTAS.procedimentos, procedimento, MENSAGENS.procedimento);
};

export const custosFixos = () => {
    if (DEMONSTRACAO) {
        return custosDeDemonstracao();
    }

    return pedir(ROTAS.custos, {}, MENSAGENS.custos);
};

export const salvarCusto = (custo) => {
    if (DEMONSTRACAO) {
        return salvarCustoDeDemonstracao(custo);
    }

    return enviar(ROTAS.custos, custo, MENSAGENS.custo);
};

export const removerCusto = (id) => {
    if (DEMONSTRACAO) {
        return removerCustoDeDemonstracao(id);
    }

    return pedir(
        ROTAS.custos + "/" + encodeURIComponent(id),
        { method: "DELETE" },
        MENSAGENS.remover,
    );
};

/* Parâmetro não se edita: cada mudança é uma linha nova, com data. */
export const salvarParametros = (parametros) => {
    if (DEMONSTRACAO) {
        return salvarParametrosDeDemonstracao(parametros);
    }

    return enviar(ROTAS.parametros, parametros, MENSAGENS.parametros);
};

/* O mesmo relatório que a automação do n8n lê pela chave do agente. */
export const rentabilidade = ({ de, ate } = {}) => {
    if (DEMONSTRACAO) {
        return rentabilidadeDeDemonstracao({ de, ate });
    }

    return pedir(comBusca(ROTAS.rentabilidade, { de, ate }), {}, MENSAGENS.rentabilidade);
};
