import { API, DEMONSTRACAO, ESTAGIOS } from "../core/config.js";
import {
    agendaDeDemonstracao,
    converterDeDemonstracao,
    fichaDeDemonstracao,
    pacientesDeDemonstracao,
    salvarDeDemonstracao,
} from "./demonstracao.js";

const ROTAS = {
    agenda: "/api/agenda",
    ficha: "/api/agendamentos/",
    pacientes: "/api/pacientes",
};

const MENSAGENS = {
    agenda: "Não foi possível carregar a agenda deste dia.",
    pacientes: "Não foi possível carregar a lista de pacientes.",
    ficha: "Não foi possível abrir esta ficha.",
    salvar: "O parecer não foi salvo. Tente de novo.",
    converter: "Não foi possível converter em cliente.",
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

    if (!resposta.ok) {
        throw new Error(recado);
    }

    return resposta.json();
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

export const agendaDoDia = (data) =>
    DEMONSTRACAO
        ? agendaDeDemonstracao(data)
        : pedir(
              ROTAS.agenda + "?data=" + encodeURIComponent(data),
              {},
              MENSAGENS.agenda,
          );

export const pacientes = ({ busca, estagio } = {}) => {
    if (DEMONSTRACAO) {
        return pacientesDeDemonstracao({ busca, estagio });
    }

    const consulta = new URLSearchParams();

    if (busca) {
        consulta.set("busca", busca);
    }

    if (estagio) {
        consulta.set("estagio", estagio);
    }

    const cauda = consulta.toString();

    return pedir(ROTAS.pacientes + (cauda ? "?" + cauda : ""), {}, MENSAGENS.pacientes);
};

export const fichaDe = (id) =>
    DEMONSTRACAO
        ? fichaDeDemonstracao(id)
        : pedir(ROTAS.ficha + encodeURIComponent(id), {}, MENSAGENS.ficha);

export const salvarParecer = (id, parecer) => {
    if (DEMONSTRACAO) {
        return salvarDeDemonstracao(id, parecer);
    }

    return enviar(
        ROTAS.ficha + encodeURIComponent(id) + "/parecer",
        parecer,
        MENSAGENS.salvar,
        "PUT",
    );
};

export const converterEmCliente = (id) => {
    if (DEMONSTRACAO) {
        return converterDeDemonstracao(id);
    }

    return enviar(
        ROTAS.ficha + encodeURIComponent(id) + "/estagio",
        { estagio: ESTAGIOS.cliente },
        MENSAGENS.converter,
        "PUT",
    );
};
