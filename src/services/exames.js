import { API, DEMONSTRACAO } from "../core/config.js";
import {
    alternarLaboratorioDeDemonstracao,
    buscarExamesDeDemonstracao,
    cadastrarLaboratorioDeDemonstracao,
    conferenciaDeDemonstracao,
    descartarExameDeDemonstracao,
    laboratoriosDeDemonstracao,
    ligarExameDeDemonstracao,
    statusDaBuscaDeDemonstracao,
} from "./demonstracao.js";

const ROTAS = {
    conferencia: "/api/exames/conferencia",
    status: "/api/exames/status",
    buscar: "/api/exames/buscar",
    laboratorios: "/api/exames/laboratorios",
    exame: "/api/exames/",
};

const MENSAGENS = {
    fila: "Não foi possível carregar os exames em conferência.",
    status: "Não foi possível saber quando foi a última busca.",
    buscar: "Não foi possível buscar agora. Tente de novo em instantes.",
    ligar: "Não foi possível ligar o exame a esta ficha.",
    descartar: "Não foi possível descartar o exame.",
    laboratorios: "Não foi possível carregar os laboratórios.",
    cadastrar: "Não foi possível cadastrar o laboratório.",
    alternar: "Não foi possível mudar a situação do laboratório.",
    conexao: "A conexão falhou. Verifique a internet e tente de novo.",
};

const pedir = async (rota, opcoes, recado) => {
    let resposta = null;

    try {
        resposta = await fetch(API.base + rota, {
            credentials: "include",
            ...opcoes,
        });
    } catch (falha) {
        throw new Error(MENSAGENS.conexao);
    }

    if (resposta.status === 401) {
        location.reload();

        throw new Error(recado);
    }

    let corpo = null;

    try {
        corpo = await resposta.json();
    } catch (falha) {
        corpo = null;
    }

    if (!resposta.ok) {
        // A mensagem do servidor explica melhor: "Este exame já foi decidido".
        throw new Error((corpo && corpo.erro) || recado);
    }

    return corpo;
};

const enviar = (rota, corpo, recado, metodo = "POST") =>
    pedir(
        rota,
        {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo),
        },
        recado,
    );

/* O anexo mora na API, não no site: o endereço precisa do API.base, e o
   pedido leva o cookie de sessão. */
export const enderecoDoAnexo = (url) => (DEMONSTRACAO ? url : API.base + url);

export const conferencia = () =>
    DEMONSTRACAO ? conferenciaDeDemonstracao() : pedir(ROTAS.conferencia, {}, MENSAGENS.fila);

export const statusDaBusca = () =>
    DEMONSTRACAO ? statusDaBuscaDeDemonstracao() : pedir(ROTAS.status, {}, MENSAGENS.status);

export const buscarAgora = () =>
    DEMONSTRACAO ? buscarExamesDeDemonstracao() : enviar(ROTAS.buscar, {}, MENSAGENS.buscar);

export const ligarAFicha = (id, avaliacaoId) =>
    DEMONSTRACAO
        ? ligarExameDeDemonstracao(id, avaliacaoId)
        : enviar(ROTAS.exame + encodeURIComponent(id) + "/destino", { avaliacaoId }, MENSAGENS.ligar, "PUT");

export const descartar = (id) =>
    DEMONSTRACAO
        ? descartarExameDeDemonstracao(id)
        : enviar(ROTAS.exame + encodeURIComponent(id) + "/descarte", {}, MENSAGENS.descartar, "PUT");

export const laboratorios = () =>
    DEMONSTRACAO ? laboratoriosDeDemonstracao() : pedir(ROTAS.laboratorios, {}, MENSAGENS.laboratorios);

export const cadastrarLaboratorio = (dados) =>
    DEMONSTRACAO
        ? cadastrarLaboratorioDeDemonstracao(dados)
        : enviar(ROTAS.laboratorios, dados, MENSAGENS.cadastrar);

export const alternarLaboratorio = (id, ativo) =>
    DEMONSTRACAO
        ? alternarLaboratorioDeDemonstracao(id, ativo)
        : enviar(ROTAS.laboratorios + "/" + encodeURIComponent(id), { ativo }, MENSAGENS.alternar, "PUT");
