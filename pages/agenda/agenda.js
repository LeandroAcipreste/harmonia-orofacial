import { exigirSessao } from "../../src/services/guarda.js";
import { sair } from "../../src/services/sessao.js";
import { montarAvisoDeEstoque } from "../../src/components/aviso-estoque/aviso-estoque.js";
import { agendaDoDia } from "../../src/services/atendimento.js";
import { criarPainel, EXTENSO, emIso, deIso } from "../../src/components/painel/painel.js";
import { ESTAGIOS } from "../../src/core/config.js";

const initAgenda = (sessao) => {
    const lista = document.querySelector("#agenda-lista");
    const vazio = document.querySelector("#agenda-vazio");
    const erro = document.querySelector("#agenda-erro");
    const resumo = document.querySelector("#agenda-resumo");
    const campoDia = document.querySelector("#agenda-dia");
    const extenso = document.querySelector("#agenda-extenso");
    const modelo = document.querySelector("#modelo-agendamento");
    const quem = document.querySelector("#erp-quem");

    let dia = new Date();

    if (quem && sessao && sessao.nome) {
        quem.textContent = sessao.nome;
    }

    const limparDestaque = () => {
        lista.querySelectorAll(".lista__botao").forEach((botao) => {
            botao.classList.remove("esta-aberto");
        });
    };

    const painel = criarPainel({
        hospedeiro: document.querySelector("#painel"),
        aoFechar: limparDestaque,
        aoConverter: () => carregar(),
        sessao,
    });

    const avisar = (recado) => {
        erro.textContent = recado;
        erro.hidden = !recado;
    };

    const desenharLista = (agendamentos) => {
        lista.textContent = "";

        agendamentos.forEach((registro) => {
            const item = modelo.content.firstElementChild.cloneNode(true);
            const botao = item.querySelector(".lista__botao");

            item.querySelector(".agenda__hora").textContent = registro.hora || "·";
            item.querySelector(".lista__nome").textContent = registro.paciente.nome;
            item.querySelector(".lista__detalhe").textContent =
                registro.paciente.telefone || "";

            const selo = item.querySelector(".selo");

            selo.textContent =
                registro.estagio === ESTAGIOS.cliente ? "cliente" : "contato";
            selo.dataset.estagio = registro.estagio || ESTAGIOS.contato;

            botao.addEventListener("click", () => {
                limparDestaque();
                botao.classList.add("esta-aberto");
                painel.abrir(registro);
            });

            lista.appendChild(item);
        });
    };

    const carregar = async () => {
        const iso = emIso(dia);

        campoDia.value = iso;
        extenso.textContent = EXTENSO.format(dia);

        avisar("");
        painel.fechar();
        resumo.textContent = "Carregando…";
        vazio.hidden = true;

        try {
            const resposta = await agendaDoDia(iso);
            const agendamentos = resposta.agendamentos || [];

            desenharLista(agendamentos);

            resumo.textContent = agendamentos.length
                ? agendamentos.length +
                  (agendamentos.length === 1 ? " avaliação" : " avaliações")
                : "";

            vazio.hidden = agendamentos.length > 0;
        } catch (falha) {
            lista.textContent = "";
            resumo.textContent = "";
            avisar(falha.message);
        }
    };

    const andar = (dias) => {
        dia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + dias);
        carregar();
    };

    document.querySelector("#agenda-anterior").addEventListener("click", () => andar(-1));
    document.querySelector("#agenda-proximo").addEventListener("click", () => andar(1));

    document.querySelector("#agenda-hoje").addEventListener("click", () => {
        dia = new Date();
        carregar();
    });

    campoDia.addEventListener("change", () => {
        if (campoDia.value) {
            dia = deIso(campoDia.value);
            carregar();
        }
    });

    document.querySelector("#erp-sair").addEventListener("click", async () => {
        await sair();

        location.replace("../login/login.html");
    });

    carregar();
};

/* Chamado pelo main.js, que descobre a página pelo data-pagina do body. */
export const init = () =>
    exigirSessao().then((sessao) => {
        if (sessao) {
            initAgenda(sessao);
            montarAvisoDeEstoque(sessao);
        }
    });
