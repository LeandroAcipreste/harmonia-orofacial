import { enviarAgendamento, horariosLivres } from "../../src/services/agendamento.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* O CPF sai do teclado como numero seco; a pontuacao entra aqui para a
   ficha chegar na clinica no formato que a recepcao esta acostumada a ler. */
const comoCpf = (valor) =>
    valor
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

const SEMANA = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const DIA_E_MES = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const EXTENSO = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
});

/* "2026-09-15" vira meio-dia UTC: nenhum fuso empurra o dia para trás. */
const comoData = (iso) => new Date(iso + "T12:00:00Z");

const rotuloDoDia = (iso) =>
    SEMANA.format(comoData(iso)).replace(".", "") + " " + DIA_E_MES.format(comoData(iso));

/* Cada opção reaproveita o botão redondo das perguntas de saúde. */
const opcao = (nome, valor, rotulo) => {
    const caixa = document.createElement("label");
    const marca = document.createElement("input");
    const texto = document.createElement("span");

    caixa.className = "ficha__opcao";
    marca.type = "radio";
    marca.name = nome;
    marca.value = valor;
    texto.textContent = rotulo;

    caixa.append(marca, texto);

    return caixa;
};

/* A agenda online só aparece quando a API responde com horários. Sem ela
   (canal WhatsApp, Google desligado, rede fora), a ficha fica como sempre:
   data preferida e turno. */
const ligarHorarios = (form) => {
    const bloco = form.querySelector("#horarios");
    const dias = form.querySelector("#horarios-dias");
    const horas = form.querySelector("#horarios-horas");
    const vazio = form.querySelector("#horarios-vazio");
    const preferencia = form.querySelector("#preferencia");
    const intro = document.querySelector(".ficha__intro");

    let agenda = [];

    const mostrarHoras = (data) => {
        const dia = agenda.find((item) => item.data === data);

        horas.textContent = "";

        (dia ? dia.horarios : []).forEach((hora) => {
            horas.appendChild(opcao("horario", data + "T" + hora, hora));
        });

        horas.hidden = !dia;
    };

    dias.addEventListener("change", (evento) => mostrarHoras(evento.target.value));

    const carregar = async () => {
        const resposta = await horariosLivres();

        if (!resposta) {
            return;
        }

        agenda = resposta.dias || [];

        dias.textContent = "";
        horas.textContent = "";
        horas.hidden = true;

        agenda.forEach((dia) => dias.appendChild(opcao("dia", dia.data, rotuloDoDia(dia.data))));

        const temHorario = agenda.length > 0;

        bloco.hidden = false;
        dias.hidden = !temHorario;
        vazio.hidden = temHorario;
        preferencia.hidden = temHorario;

        if (temHorario && intro) {
            intro.textContent =
                "Preencha a ficha e escolha um horário livre. Ele fica reservado para você assim que a ficha for enviada.";
        }
    };

    return {
        carregar,
        emUso: () => !bloco.hidden && !dias.hidden,
    };
};

const initAvaliacao = () => {
    const form = document.querySelector("#ficha-form");
    const erro = document.querySelector("#ficha-erro");
    const pronto = document.querySelector("#ficha-ok");
    const botao = form && form.querySelector(".ficha__enviar");

    if (!form) {
        return;
    }

    const horarios = ligarHorarios(form);

    const avisar = (recado) => {
        if (!erro) {
            return;
        }

        erro.textContent = recado;
        erro.hidden = !recado;
    };

    const confirmar = (recado) => {
        if (!pronto) {
            return;
        }

        pronto.textContent = recado;
        pronto.hidden = !recado;
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

        if (horarios.emUso() && !dados.get("horario")) {
            return "Escolha o dia e o horário da avaliação.";
        }

        if (!dados.get("veracidade") || !dados.get("dados")) {
            return "Marque as duas confirmações obrigatórias para enviar.";
        }

        return "";
    };

    const cpf = form.querySelector("#ficha-cpf");

    if (cpf) {
        cpf.addEventListener("input", () => {
            cpf.value = comoCpf(cpf.value);
        });
    }

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const dados = new FormData(form);
        const problema = validar(dados);

        confirmar("");

        if (problema) {
            avisar(problema);
            return;
        }

        avisar("");

        if (botao) {
            botao.disabled = true;
        }

        try {
            const saida = await enviarAgendamento(dados);

            if (saida.canal === "api") {
                const horario = dados.get("horario");

                confirmar(
                    horario
                        ? "Avaliação reservada para " +
                              EXTENSO.format(comoData(horario.slice(0, 10))) +
                              ", às " +
                              horario.slice(11) +
                              ". Se precisar mudar, fale com a clínica pelo WhatsApp."
                        : "Ficha recebida. A clínica entra em contato para marcar o horário.",
                );

                form.reset();
                horarios.carregar();
            }
        } catch (falha) {
            avisar(falha.message || "Não foi possível enviar agora. Tente novamente.");

            // Outra pessoa pegou o horário: a lista volta sem ele.
            if (falha.horarioOcupado) {
                horarios.carregar();
            }
        } finally {
            if (botao) {
                botao.disabled = false;
            }
        }
    });

    horarios.carregar();
};

/* Chamado pelo main.js, que descobre a página pelo data-pagina do body. */
export const init = initAvaliacao;
