import { DEMONSTRACAO } from "../core/config.js";
import { enviar, pedir } from "./http.js";
import {
    agentesDeDemonstracao,
    atualizarUsuarioDeDemonstracao,
    chavesDeDemonstracao,
    criarAgenteDeDemonstracao,
    criarUsuarioDeDemonstracao,
    emitirChaveDeDemonstracao,
    googleDeDemonstracao,
    papeisDeDemonstracao,
    revogarChaveDeDemonstracao,
    usuariosDeDemonstracao,
} from "./demonstracao.js";

const ROTAS = {
    usuarios: "/api/usuarios",
    papeis: "/api/usuarios/papeis",
    agentes: "/api/usuarios/agentes",
    usuario: "/api/usuarios/",
    chaves: "/api/usuarios/chaves/",
    google: "/api/google/status",
    conectar: "/api/google/conectar",
};

const MENSAGENS = {
    usuarios: "Não foi possível carregar as pessoas.",
    papeis: "Não foi possível carregar os perfis de acesso.",
    criar: "A pessoa não foi cadastrada. Tente de novo.",
    atualizar: "Não foi possível salvar.",
    agente: "O agente não foi criado. Tente de novo.",
    chaves: "Não foi possível carregar as chaves.",
    emitir: "A chave não foi emitida. Tente de novo.",
    revogar: "A chave não foi revogada.",
    google: "Não foi possível saber a situação do Google.",
};

export const usuarios = () => {
    if (DEMONSTRACAO) {
        return usuariosDeDemonstracao();
    }

    return pedir(ROTAS.usuarios, {}, MENSAGENS.usuarios);
};

export const papeis = () => {
    if (DEMONSTRACAO) {
        return papeisDeDemonstracao();
    }

    return pedir(ROTAS.papeis, {}, MENSAGENS.papeis);
};

export const criarUsuario = (usuario) => {
    if (DEMONSTRACAO) {
        return criarUsuarioDeDemonstracao(usuario);
    }

    return enviar(ROTAS.usuarios, usuario, MENSAGENS.criar);
};

export const atualizarUsuario = (id, mudancas) => {
    if (DEMONSTRACAO) {
        return atualizarUsuarioDeDemonstracao(id, mudancas);
    }

    return enviar(ROTAS.usuario + encodeURIComponent(id), mudancas, MENSAGENS.atualizar, "PUT");
};

/* OS AGENTES

   Um agente é um usuário do tipo agente. Ele não tem senha: entra por uma
   chave, que a tela mostra uma única vez, no instante em que é criada. */

export const agentes = () => {
    if (DEMONSTRACAO) {
        return agentesDeDemonstracao();
    }

    return pedir(ROTAS.usuarios, {}, MENSAGENS.usuarios).then((resposta) => ({
        agentes: resposta.usuarios.filter((usuario) => usuario.tipo === "agente"),
    }));
};

export const criarAgente = (nome) => {
    if (DEMONSTRACAO) {
        return criarAgenteDeDemonstracao(nome);
    }

    return enviar(ROTAS.agentes, { nome }, MENSAGENS.agente);
};

export const chavesDoAgente = (id) => {
    if (DEMONSTRACAO) {
        return chavesDeDemonstracao(id);
    }

    return pedir(ROTAS.usuario + encodeURIComponent(id) + "/chaves", {}, MENSAGENS.chaves);
};

/* Emitir não derruba a chave antiga: as duas valem até alguém revogar. É o
   intervalo em que a automação é atualizada sem parar de funcionar. */
export const emitirChave = (id) => {
    if (DEMONSTRACAO) {
        return emitirChaveDeDemonstracao(id);
    }

    return enviar(ROTAS.usuario + encodeURIComponent(id) + "/chaves", {}, MENSAGENS.emitir);
};

export const revogarChave = (id) => {
    if (DEMONSTRACAO) {
        return revogarChaveDeDemonstracao(id);
    }

    return enviar(ROTAS.chaves + encodeURIComponent(id) + "/revogacao", {}, MENSAGENS.revogar, "PUT");
};

export const situacaoDoGoogle = () => {
    if (DEMONSTRACAO) {
        return googleDeDemonstracao();
    }

    return pedir(ROTAS.google, {}, MENSAGENS.google);
};

export const enderecoDeConexaoDoGoogle = () => ROTAS.conectar;
