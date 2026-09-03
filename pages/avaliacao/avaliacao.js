const WHATSAPP = "5579998764880";

const PERGUNTAS = [
    ["saude", "Problema de saúde"],
    ["medicamento", "Usa medicamento"],
    ["alergia", "Alergia a medicamento/substância"],
    ["fumante", "Fumante"],
    ["cicatrizacao", "Boa cicatrização"],
    ["tratamento", "Em tratamento médico"],
    ["anestesia", "Já tomou anestesia dentária"],
    ["malEstar", "Sentiu-se mal após anestesia"],
    ["hemorragia", "Problema com hemorragia"],
];

const IDENTIFICACAO = [
    ["nome", "Nome"],
    ["nascimento", "Nascimento"],
    ["idade", "Idade"],
    ["telefone", "Telefone"],
    ["sexo", "Sexo"],
    ["endereco", "Endereço"],
    ["cidade", "Cidade"],
];

const montarMensagem = (dados) => {
    const linhas = ["*Agendamento de avaliação — Harmonia Orofacial*", ""];

    IDENTIFICACAO.forEach(([campo, rotulo]) => {
        const valor = (dados.get(campo) || "").trim();

        if (valor) {
            linhas.push(rotulo + ": " + valor);
        }
    });

    const respondidas = PERGUNTAS.filter(([campo]) => dados.get(campo));

    if (respondidas.length) {
        linhas.push("", "*Saúde*");
        respondidas.forEach(([campo, rotulo]) => {
            linhas.push(rotulo + ": " + dados.get(campo));
        });
    }

    const observacoes = (dados.get("observacoes") || "").trim();

    if (observacoes) {
        linhas.push("", "*Observações*", observacoes);
    }

    linhas.push("", "Confirmo a veracidade das informações.");

    if (dados.get("imagem")) {
        linhas.push("Autorizo o registro fotográfico do antes e depois.");
    }

    return linhas.join("\n");
};

const initAvaliacao = () => {
    const form = document.querySelector("#ficha-form");
    const erro = document.querySelector("#ficha-erro");

    if (!form) {
        return;
    }

    const avisar = (recado) => {
        if (!erro) {
            return;
        }

        erro.textContent = recado;
        erro.hidden = !recado;
    };

    form.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const dados = new FormData(form);
        const nome = (dados.get("nome") || "").trim();
        const telefone = (dados.get("telefone") || "").trim();

        if (!nome || !telefone) {
            avisar("Preencha ao menos o nome e o telefone.");
            return;
        }

        if (!dados.get("veracidade") || !dados.get("dados")) {
            avisar("Marque as duas confirmações obrigatórias para enviar.");
            return;
        }

        avisar("");

        const texto = encodeURIComponent(montarMensagem(dados));

        window.open("https://wa.me/" + WHATSAPP + "?text=" + texto, "_blank", "noopener");
    });
};

initAvaliacao();
