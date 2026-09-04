import { CLINICA, PROFISSIONAL } from "../core/config.js";

const primeiroNome = (nome) => String(nome || "").trim().split(/\s+/)[0] || "";

export const TERMO_DE_IMAGEM = {
    assunto: "Suas fotos clínicas na " + CLINICA.nome + " — como elas são protegidas",

    corpo: (paciente) =>
        [
            "Olá, " + primeiroNome(paciente.nome) + "!",
            "",
            "Na sua ficha você autorizou o registro fotográfico do seu tratamento.",
            "Este e-mail explica o que isso significa e o que a clínica se compromete",
            "a fazer com essas imagens. Guarde-o: ele vale como o nosso termo.",
            "",
            "O QUE FOTOGRAFAMOS",
            "Imagens da sua boca, dentes e face, feitas durante a avaliação e ao",
            "longo do tratamento. Elas fazem parte do seu prontuário e existem para",
            "acompanhar a evolução do seu caso.",
            "",
            "O QUE ESTÁ AUTORIZADO",
            "1. Uso clínico: registro no prontuário, planejamento e acompanhamento.",
            "   Isso é obrigatório por norma do conselho e independe de autorização.",
            "2. Divulgação: publicação em redes sociais, site e material da clínica,",
            "   no formato antes e depois. É isto que a sua autorização libera.",
            "",
            "COMO PROTEGEMOS",
            "- As imagens ficam em sistema com acesso restrito à equipe clínica.",
            "- Não vendemos, cedemos nem compartilhamos suas fotos com terceiros.",
            "- Em divulgação, nunca publicamos seu nome junto da imagem sem que",
            "  você peça, e recortamos a foto para o mínimo necessário.",
            "- Não usamos suas imagens em propaganda paga sem falar com você antes.",
            "",
            "VOCÊ PODE VOLTAR ATRÁS QUANDO QUISER",
            "A autorização de divulgação é revogável a qualquer momento, sem",
            "justificativa e sem custo. Basta responder este e-mail ou avisar pelo",
            "WhatsApp " + CLINICA.telefone + ". Retiramos as imagens do ar e paramos",
            "de usá-las em novas publicações.",
            "",
            "A revogação não apaga o registro clínico do prontuário: a guarda dele",
            "é exigida por norma profissional, e ele continua restrito à equipe.",
            "",
            "Pela LGPD (Lei 13.709/2018) você também pode pedir a qualquer momento",
            "para saber quais dados temos sobre você, corrigi-los ou solicitar a",
            "exclusão do que a lei permitir excluir.",
            "",
            "Qualquer dúvida, é só responder aqui.",
            "",
            PROFISSIONAL.nome,
            PROFISSIONAL.cro,
            CLINICA.nome + " — " + CLINICA.tipo,
            CLINICA.endereco,
            CLINICA.cidade,
            CLINICA.telefone,
        ].join("\n"),
};

export const comoMailto = (paciente) =>
    "mailto:" +
    encodeURIComponent(paciente.email || "") +
    "?subject=" +
    encodeURIComponent(TERMO_DE_IMAGEM.assunto) +
    "&body=" +
    encodeURIComponent(TERMO_DE_IMAGEM.corpo(paciente));
