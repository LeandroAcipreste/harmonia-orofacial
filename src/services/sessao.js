import { API, DEMONSTRACAO } from "../core/config.js";
import {
    entrarDeDemonstracao,
    sairDeDemonstracao,
    sessaoDeDemonstracao,
} from "./demonstracao.js";

const ROTAS = {
    entrar: "/api/sessao",
    verificar: "/api/sessao/verificar",
    reenviar: "/api/sessao/reenviar",
    sair: "/api/sessao/sair",
    atual: "/api/sessao/atual",
};

const MENSAGENS = {
    credenciais: "E-mail ou senha não conferem.",
    codigoInvalido: "Código incorreto. Confira e tente de novo.",
    codigoExpirado: "O código expirou. Peça um novo.",
    bloqueado: "Muitas tentativas. Aguarde um minuto e tente de novo.",
    servidor: "Não foi possível entrar agora. Tente de novo em instantes.",
    conexao: "A conexão falhou. Verifique a internet e tente de novo.",
};

const TENTATIVAS_MAXIMAS = 5;
const CASTIGO_MS = 60000;

let tentativas = 0;
let liberadoEm = 0;

export const estaBloqueado = () => Date.now() < liberadoEm;

export const segundosDeCastigo = () =>
    Math.max(0, Math.ceil((liberadoEm - Date.now()) / 1000));

const registrarFalha = () => {
    tentativas += 1;

    if (tentativas >= TENTATIVAS_MAXIMAS) {
        tentativas = 0;
        liberadoEm = Date.now() + CASTIGO_MS;
    }
};

const limparFalhas = () => {
    tentativas = 0;
    liberadoEm = 0;
};

const pedir = async (rota, corpo) => {
    const resposta = await fetch(API.base + rota, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(corpo || {}),
    });

    let dados = null;

    try {
        dados = await resposta.json();
    } catch (erro) {
        dados = null;
    }

    return { resposta, dados };
};

export const entrar = async ({ email, senha, lembrar }) => {
    if (estaBloqueado()) {
        return { ok: false, erro: MENSAGENS.bloqueado };
    }

    if (DEMONSTRACAO) {
        const saida = await entrarDeDemonstracao({ email, senha });

        if (saida.ok) {
            limparFalhas();
        } else {
            registrarFalha();
        }

        return saida;
    }

    try {
        const { resposta, dados } = await pedir(ROTAS.entrar, {
            email,
            senha,
            lembrar: Boolean(lembrar),
        });

        if (resposta.status === 401) {
            registrarFalha();
            return { ok: false, erro: MENSAGENS.credenciais };
        }

        if (resposta.status === 429) {
            liberadoEm = Date.now() + CASTIGO_MS;
            return { ok: false, erro: MENSAGENS.bloqueado };
        }

        if (!resposta.ok) {
            return { ok: false, erro: MENSAGENS.servidor };
        }

        limparFalhas();

        if (dados && dados.verificacao) {
            return { ok: true, etapa: "verificacao", canal: dados.canal || "email" };
        }

        return { ok: true, etapa: "pronto", destino: (dados && dados.destino) || "/" };
    } catch (falha) {
        return { ok: false, erro: MENSAGENS.conexao };
    }
};

export const verificar = async ({ codigo }) => {
    if (estaBloqueado()) {
        return { ok: false, erro: MENSAGENS.bloqueado };
    }

    try {
        const { resposta, dados } = await pedir(ROTAS.verificar, { codigo });

        if (resposta.status === 401) {
            registrarFalha();
            return { ok: false, erro: MENSAGENS.codigoInvalido };
        }

        if (resposta.status === 410) {
            return { ok: false, erro: MENSAGENS.codigoExpirado };
        }

        if (!resposta.ok) {
            return { ok: false, erro: MENSAGENS.servidor };
        }

        limparFalhas();

        return { ok: true, destino: (dados && dados.destino) || "/" };
    } catch (falha) {
        return { ok: false, erro: MENSAGENS.conexao };
    }
};

export const reenviarCodigo = async () => {
    try {
        const { resposta } = await pedir(ROTAS.reenviar);

        return { ok: resposta.ok };
    } catch (falha) {
        return { ok: false, erro: MENSAGENS.conexao };
    }
};

export const sair = async () => {
    if (DEMONSTRACAO) {
        sairDeDemonstracao();
        limparFalhas();

        return;
    }

    try {
        await pedir(ROTAS.sair);
    } catch (falha) {
        /* Sair é sempre local também: o cookie some no servidor ou não. */
    }

    limparFalhas();
};

export const sessaoAtual = async () => {
    if (DEMONSTRACAO) {
        return sessaoDeDemonstracao();
    }

    try {
        const resposta = await fetch(API.base + ROTAS.atual, {
            credentials: "include",
        });

        if (!resposta.ok) {
            return null;
        }

        return await resposta.json();
    } catch (falha) {
        return null;
    }
};
