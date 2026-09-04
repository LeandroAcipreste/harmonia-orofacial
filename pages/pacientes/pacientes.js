import { exigirSessao } from "../../src/services/guarda.js";
import { sair } from "../../src/services/sessao.js";
import { pacientes } from "../../src/services/atendimento.js";
import { criarPainel } from "../../src/components/painel/painel.js";
import { ESTAGIOS } from "../../src/core/config.js";

const ESPERA_DA_BUSCA = 250;

const contar = (quantos, estagio) => {
    if (!quantos) {
        return "";
    }

    const nomes = {
        cliente: quantos === 1 ? " cliente" : " clientes",
        contato: quantos === 1 ? " contato" : " contatos",
    };

    return quantos + (nomes[estagio] || (quantos === 1 ? " pessoa" : " pessoas"));
};

const initPacientes = (sessao) => {
    const lista = document.querySelector("#pacientes-lista");
    const vazio = document.querySelector("#pacientes-vazio");
    const erro = document.querySelector("#pacientes-erro");
    const resumo = document.querySelector("#pacientes-resumo");
    const campo = document.querySelector("#pacientes-busca");
    const abas = [...document.querySelectorAll(".pacientes__aba")];
    const modelo = document.querySelector("#modelo-paciente");
    const quem = document.querySelector("#erp-quem");

    let estagio = "";
    let agendado = null;

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
    });

    const avisar = (recado) => {
        erro.textContent = recado;
        erro.hidden = !recado;
    };

    const desenharLista = (pessoas) => {
        lista.textContent = "";

        pessoas.forEach((registro) => {
            const item = modelo.content.firstElementChild.cloneNode(true);
            const botao = item.querySelector(".lista__botao");

            item.querySelector(".lista__nome").textContent = registro.paciente.nome;
            item.querySelector(".lista__detalhe").textContent = [
                registro.paciente.telefone,
                registro.paciente.cidade,
            ]
                .filter(Boolean)
                .join(" · ");

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
        avisar("");
        painel.fechar();
        resumo.textContent = "Carregando…";
        vazio.hidden = true;

        try {
            const resposta = await pacientes({ busca: campo.value.trim(), estagio });
            const pessoas = resposta.pacientes || [];

            desenharLista(pessoas);

            resumo.textContent = contar(pessoas.length, estagio);
            vazio.hidden = pessoas.length > 0;
        } catch (falha) {
            lista.textContent = "";
            resumo.textContent = "";
            avisar(falha.message);
        }
    };

    const adiar = () => {
        window.clearTimeout(agendado);
        agendado = window.setTimeout(carregar, ESPERA_DA_BUSCA);
    };

    campo.addEventListener("input", adiar);

    campo.addEventListener("search", () => {
        window.clearTimeout(agendado);
        carregar();
    });

    abas.forEach((aba) => {
        aba.addEventListener("click", () => {
            estagio = aba.dataset.estagio;

            abas.forEach((outra) => outra.classList.toggle("esta-aqui", outra === aba));

            carregar();
        });
    });

    document.querySelector("#erp-sair").addEventListener("click", async () => {
        await sair();

        location.replace("../login/login.html");
    });

    carregar();
};

exigirSessao().then((sessao) => {
    if (!sessao) {
        return;
    }

    initPacientes(sessao);
});
