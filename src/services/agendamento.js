import {
    AGENDA,
    API,
    CANAL,
    ESTAGIO_INICIAL,
    VERSAO_DA_FICHA,
    WHATSAPP,
} from "../core/config.js";

export const IDENTIFICACAO = [
    "nome",
    "email",
    "telefone",
    "nascimento",
    "idade",
    "sexo",
    "endereco",
    "cidade",
];

export const SAUDE = [
    "saude",
    "medicamento",
    "alergia",
    "fumante",
    "cicatrizacao",
    "tratamento",
    "anestesia",
    "malEstar",
    "hemorragia",
];

export const ROTULOS = {
    nome: "Nome",
    email: "E-mail",
    telefone: "Telefone",
    nascimento: "Nascimento",
    idade: "Idade",
    sexo: "Sexo",
    endereco: "Endereço",
    cidade: "Cidade",
    saude: "Problema de saúde",
    medicamento: "Usa medicamento",
    alergia: "Alergia a medicamento/substância",
    fumante: "Fumante",
    cicatrizacao: "Boa cicatrização",
    tratamento: "Em tratamento médico",
    anestesia: "Já tomou anestesia dentária",
    malEstar: "Sentiu-se mal após anestesia",
    hemorragia: "Problema com hemorragia",
};

const texto = (dados, campo) => (dados.get(campo) || "").toString().trim();

const somenteDigitos = (valor) => valor.replace(/\D/g, "");

const recolher = (dados, campos) =>
    campos.reduce((acumulado, campo) => {
        const valor = texto(dados, campo);

        if (valor) {
            acumulado[campo] = valor;
        }

        return acumulado;
    }, {});

export const montarPayload = (dados) => {
    const preferencia = {
        data: texto(dados, "dataPreferida"),
        janela: texto(dados, "janelaPreferida"),
    };

    return {
        versao: VERSAO_DA_FICHA,
        origem: "site",
        criadoEm: new Date().toISOString(),
        estagio: ESTAGIO_INICIAL,
        paciente: {
            ...recolher(dados, IDENTIFICACAO),
            telefoneE164: somenteDigitos(texto(dados, "telefone")),
        },
        preferencia,
        saude: recolher(dados, SAUDE),
        observacoes: texto(dados, "observacoes"),
        consentimento: {
            veracidade: Boolean(dados.get("veracidade")),
            dados: Boolean(dados.get("dados")),
            imagem: Boolean(dados.get("imagem")),
            marketing: Boolean(dados.get("marketing")),
        },
        agenda: {
            duracaoMinutos: AGENDA.duracaoMinutos,
            fuso: AGENDA.fuso,
        },
    };
};

export const montarMensagem = (payload) => {
    const linhas = ["*Agendamento de avaliação — Harmonia Orofacial*", ""];

    IDENTIFICACAO.forEach((campo) => {
        if (payload.paciente[campo]) {
            linhas.push(ROTULOS[campo] + ": " + payload.paciente[campo]);
        }
    });

    if (payload.preferencia.data || payload.preferencia.janela) {
        const janela = AGENDA.janela.find(
            ({ valor }) => valor === payload.preferencia.janela
        );

        linhas.push(
            "",
            "*Preferência*",
            [payload.preferencia.data, janela && janela.rotulo]
                .filter(Boolean)
                .join(" · ")
        );
    }

    const respondidas = SAUDE.filter((campo) => payload.saude[campo]);

    if (respondidas.length) {
        linhas.push("", "*Saúde*");
        respondidas.forEach((campo) => {
            linhas.push(ROTULOS[campo] + ": " + payload.saude[campo]);
        });
    }

    if (payload.observacoes) {
        linhas.push("", "*Observações*", payload.observacoes);
    }

    linhas.push("", "Confirmo a veracidade das informações.");

    if (payload.consentimento.imagem) {
        linhas.push("Autorizo o registro fotográfico do antes e depois.");
    }

    return linhas.join("\n");
};

const porWhatsapp = (payload) => {
    const texto = encodeURIComponent(montarMensagem(payload));

    window.open("https://wa.me/" + WHATSAPP + "?text=" + texto, "_blank", "noopener");

    return { ok: true, canal: "whatsapp" };
};

const porApi = async (payload) => {
    const resposta = await fetch(API.base + API.agendamentos, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!resposta.ok) {
        throw new Error("A clínica não recebeu o agendamento. Tente novamente.");
    }

    return { ok: true, canal: "api", corpo: await resposta.json() };
};

export const enviarAgendamento = (dados) => {
    const payload = montarPayload(dados);

    if (CANAL === "api") {
        return porApi(payload);
    }

    return Promise.resolve(porWhatsapp(payload));
};
