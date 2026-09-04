import { ESTAGIOS } from "../core/config.js";

const FICHAS = [
    {
        id: "dem-1",
        hora: "08:30",
        estagio: ESTAGIOS.contato,
        paciente: {
            nome: "Maria Souza Andrade",
            email: "maria.andrade@exemplo.com",
            telefone: "(79) 99876-4880",
            nascimento: "1990-04-12",
            idade: "35",
            sexo: "Feminino",
            endereco: "Rua Laranjeiras, 120",
            cidade: "Aracaju",
        },
        preferencia: { data: "2026-09-15", janela: "manha" },
        saude: {
            saude: "Não",
            medicamento: "Sim",
            alergia: "Não",
            fumante: "Não",
            cicatrizacao: "Sim",
            tratamento: "Não",
            anestesia: "Sim",
            malEstar: "Não",
            hemorragia: "Não",
        },
        observacoes:
            "Uso losartana 50mg pela manhã. Incomoda o apinhamento dos dentes de baixo.",
        consentimento: {
            veracidade: true,
            dados: true,
            imagem: true,
            marketing: true,
        },
    },
    {
        id: "dem-2",
        hora: "09:20",
        estagio: ESTAGIOS.contato,
        paciente: {
            nome: "João Batista Lima",
            email: "joao.lima@exemplo.com",
            telefone: "(79) 99612-3344",
            nascimento: "1978-11-03",
            idade: "47",
            sexo: "Masculino",
            cidade: "Nossa Senhora do Socorro",
        },
        preferencia: { data: "2026-09-16", janela: "tarde" },
        saude: {
            saude: "Sim",
            medicamento: "Sim",
            alergia: "Sim",
            fumante: "Sim",
            cicatrizacao: "Não",
            tratamento: "Sim",
            anestesia: "Sim",
            malEstar: "Sim",
            hemorragia: "Não",
        },
        observacoes:
            "Diabético. Alergia a dipirona. Já passou mal com anestesia em extração.",
        consentimento: {
            veracidade: true,
            dados: true,
            imagem: false,
            marketing: false,
        },
    },
    {
        id: "dem-3",
        hora: "10:40",
        estagio: ESTAGIOS.cliente,
        paciente: {
            nome: "Ana Clara Menezes",
            email: "anaclara@exemplo.com",
            telefone: "(79) 98844-7711",
            idade: "29",
            sexo: "Feminino",
            cidade: "Aracaju",
        },
        preferencia: { data: "2026-09-15", janela: "manha" },
        saude: {
            saude: "Não",
            medicamento: "Não",
            alergia: "Não",
            fumante: "Não",
            cicatrizacao: "Sim",
            anestesia: "Sim",
            malEstar: "Não",
            hemorragia: "Não",
        },
        observacoes: "Quer avaliar harmonização e clareamento antes do casamento.",
        consentimento: {
            veracidade: true,
            dados: true,
            imagem: true,
            marketing: true,
        },
        parecer: {
            dentes: [11, 12, 21, 22],
            texto:
                "Desgaste incisal nos centrais e laterais superiores, com leve assimetria de bordo. Indicação de facetas em resina nos quatro elementos, precedida de clareamento supervisionado.",
            orcamento: {
                itens: [
                    { procedimento: "Clareamento supervisionado", valor: 120000 },
                    { procedimento: "Faceta em resina (4 elementos)", valor: 320000 },
                ],
                total: 440000,
            },
        },
    },
    {
        id: "dem-4",
        hora: "14:10",
        estagio: ESTAGIOS.contato,
        paciente: {
            nome: "Roberto Carvalho Pinto",
            email: "rc.pinto@exemplo.com",
            telefone: "(79) 99230-5566",
            idade: "62",
            sexo: "Masculino",
            cidade: "Aracaju",
        },
        preferencia: { data: "2026-09-17", janela: "tarde" },
        saude: {
            saude: "Sim",
            medicamento: "Sim",
            alergia: "Não",
            fumante: "Não",
            cicatrizacao: "Sim",
            tratamento: "Sim",
            anestesia: "Sim",
            malEstar: "Não",
            hemorragia: "Sim",
        },
        observacoes: "Hipertenso, usa anticoagulante. Perdeu dois molares inferiores.",
        consentimento: {
            veracidade: true,
            dados: true,
            imagem: false,
            marketing: true,
        },
    },
];

const salvos = new Map();

const guardado = (id) => {
    const base = FICHAS.find((ficha) => ficha.id === id);

    if (!base) {
        return null;
    }

    return { ...base, parecer: salvos.get(id) || base.parecer };
};

const espera = (valor) =>
    new Promise((resolver) => window.setTimeout(() => resolver(valor), 220));

export const agendaDeDemonstracao = (data) => {
    const semana = new Date(data + "T12:00:00").getDay();

    if (semana === 0 || semana === 6) {
        return espera({ agendamentos: [] });
    }

    const quantos = semana === 3 ? FICHAS.length : Math.min(3, FICHAS.length);

    return espera({
        agendamentos: FICHAS.slice(0, quantos).map((ficha) => guardado(ficha.id)),
    });
};

export const fichaDeDemonstracao = (id) => espera(guardado(id));

export const salvarDeDemonstracao = (id, parecer) => {
    salvos.set(id, parecer);

    return espera({ ok: true });
};

export const converterDeDemonstracao = (id) => {
    const ficha = FICHAS.find((atual) => atual.id === id);

    if (ficha) {
        ficha.estagio = ESTAGIOS.cliente;
    }

    return espera({ ok: true, estagio: ESTAGIOS.cliente });
};

const CREDENCIAL = {
    email: "adm@adm.com",
    senha: "12345",
};

const QUEM = {
    nome: "DRA. CÉLIA",
    email: CREDENCIAL.email,
    papel: "dentista",
};

const CHAVE = "harmonia:demonstracao";

let entrou = false;

const lembrar = (ligado) => {
    try {
        if (ligado) {
            sessionStorage.setItem(CHAVE, "1");
        } else {
            sessionStorage.removeItem(CHAVE);
        }
    } catch (falha) {
        entrou = ligado;
    }
};

export const entrarDeDemonstracao = ({ email, senha }) => {
    const confere =
        String(email).trim().toLowerCase() === CREDENCIAL.email &&
        String(senha) === CREDENCIAL.senha;

    if (!confere) {
        return espera({ ok: false, erro: "E-mail ou senha não conferem." });
    }

    entrou = true;
    lembrar(true);

    return espera({ ok: true, etapa: "pronto" });
};

export const sessaoDeDemonstracao = () => {
    try {
        return sessionStorage.getItem(CHAVE) ? QUEM : null;
    } catch (falha) {
        return entrou ? QUEM : null;
    }
};

export const sairDeDemonstracao = () => {
    entrou = false;
    lembrar(false);
};
