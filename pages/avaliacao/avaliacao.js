import { enviarAgendamento } from "../../src/services/agendamento.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const initAvaliacao = () => {
    const form = document.querySelector("#ficha-form");
    const erro = document.querySelector("#ficha-erro");
    const botao = form && form.querySelector(".ficha__enviar");

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

    const validar = (dados) => {
        const nome = (dados.get("nome") || "").trim();
        const telefone = (dados.get("telefone") || "").trim();
        const email = (dados.get("email") || "").trim();

        if (!nome || !telefone) {
            return "Preencha ao menos o nome e o telefone.";
        }

        if (!EMAIL.test(email)) {
            return "Confira o e-mail: ele recebe a confirmação do horário.";
        }

        if (!dados.get("veracidade") || !dados.get("dados")) {
            return "Marque as duas confirmações obrigatórias para enviar.";
        }

        return "";
    };

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const dados = new FormData(form);
        const problema = validar(dados);

        if (problema) {
            avisar(problema);
            return;
        }

        avisar("");

        if (botao) {
            botao.disabled = true;
        }

        try {
            await enviarAgendamento(dados);
        } catch (falha) {
            avisar(falha.message || "Não foi possível enviar agora. Tente novamente.");
        } finally {
            if (botao) {
                botao.disabled = false;
            }
        }
    });
};

initAvaliacao();
