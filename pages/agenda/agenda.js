import { exigirSessao } from "../../src/services/guarda.js";
import { sair } from "../../src/services/sessao.js";
import { montarAvisoDeEstoque } from "../../src/components/aviso-estoque/aviso-estoque.js";
import { agendaDoDia, agendaDoMes, remarcar } from "../../src/services/atendimento.js";
import { criarPainel, EXTENSO, emIso, deIso } from "../../src/components/painel/painel.js";
import { ESTAGIOS } from "../../src/core/config.js";

const NOME_DO_MES = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

const initAgenda = (sessao) => {
    const titulo = document.querySelector("#agenda-titulo");
    const lista = document.querySelector("#agenda-lista");
    const listaDoMes = document.querySelector("#agenda-mes");
    const vazio = document.querySelector("#agenda-vazio");
    const erro = document.querySelector("#agenda-erro");
    const resumo = document.querySelector("#agenda-resumo");
    const campoDia = document.querySelector("#agenda-dia");
    const extenso = document.querySelector("#agenda-extenso");
    const extensoDoMes = document.querySelector("#mes-extenso");
    const navegacaoDoDia = document.querySelector("#agenda-navegacao-dia");
    const navegacaoDoMes = document.querySelector("#agenda-navegacao-mes");
    const botoesDeModo = [...document.querySelectorAll(".agenda__modo")];
    const modelo = document.querySelector("#modelo-agendamento");
    const modeloDia = document.querySelector("#modelo-dia-do-mes");
    const quem = document.querySelector("#erp-quem");

    const dialogo = document.querySelector("#remarcar");
    const formulario = document.querySelector("#remarcar-form");
    const remarcarPaciente = document.querySelector("#remarcar-paciente");
    const remarcarDia = document.querySelector("#remarcar-dia");
    const remarcarHora = document.querySelector("#remarcar-hora");
    const remarcarAviso = document.querySelector("#remarcar-aviso");
    const remarcarSalvar = document.querySelector("#remarcar-salvar");

    const permissoes = (sessao && sessao.permissoes) || [];

    /* Quem vê todos os pacientes abre qualquer ficha. Quem não vê (a
       secretária) abre só as de hoje: os outros dias ela vê para remarcar.
       O servidor recusa do mesmo jeito; aqui é só para não oferecer um
       clique que daria erro. */
    const veTodos = permissoes.includes("pacientes.ver");
    const podeRemarcar = permissoes.includes("agenda.marcar");

    let modo = "dia";
    let dia = new Date();
    let mes = new Date(dia.getFullYear(), dia.getMonth(), 1);
    let emRemarcacao = null;

    if (quem && sessao && sessao.nome) {
        quem.textContent = sessao.nome;
    }

    const limparDestaque = () => {
        document.querySelectorAll(".agenda .lista__botao").forEach((botao) => {
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

    const quantas = (numero) => numero + (numero === 1 ? " avaliação" : " avaliações");

    /* Uma linha da agenda, igual no dia e no mês. */
    const montarItem = (registro, data) => {
        const item = modelo.content.firstElementChild.cloneNode(true);
        const botao = item.querySelector(".lista__botao");
        const botaoRemarcar = item.querySelector(".agenda__remarcar");

        item.querySelector(".agenda__hora").textContent = registro.hora || "·";
        item.querySelector(".lista__nome").textContent = registro.paciente.nome;
        item.querySelector(".lista__detalhe").textContent = registro.paciente.telefone || "";

        const selo = item.querySelector(".selo");

        selo.textContent = registro.estagio === ESTAGIOS.cliente ? "cliente" : "contato";
        selo.dataset.estagio = registro.estagio || ESTAGIOS.contato;

        if (veTodos || data === emIso(new Date())) {
            botao.addEventListener("click", () => {
                limparDestaque();
                botao.classList.add("esta-aberto");
                painel.abrir(registro);
            });
        } else {
            botao.disabled = true;
            botao.title = "A ficha abre no dia do atendimento.";
        }

        if (podeRemarcar) {
            botaoRemarcar.hidden = false;
            botaoRemarcar.setAttribute("aria-label", "Remarcar " + registro.paciente.nome);
            botaoRemarcar.addEventListener("click", () => abrirRemarcar(registro, data));
        }

        return item;
    };

    const carregarDia = async () => {
        const iso = emIso(dia);

        campoDia.value = iso;
        extenso.textContent = EXTENSO.format(dia);

        const resposta = await agendaDoDia(iso);
        const agendamentos = resposta.agendamentos || [];

        lista.textContent = "";
        agendamentos.forEach((registro) => lista.appendChild(montarItem(registro, iso)));

        resumo.textContent = agendamentos.length ? quantas(agendamentos.length) : "";
        vazio.textContent = "Nenhuma avaliação marcada para este dia.";
        vazio.hidden = agendamentos.length > 0;
    };

    /* O mês vem numa lista só, já em ordem de dia e hora; aqui ela é
       repartida por dia. Dia sem ninguém não aparece. */
    const carregarMes = async () => {
        const chave = emIso(mes).slice(0, 7);

        extensoDoMes.textContent = NOME_DO_MES.format(mes);

        const resposta = await agendaDoMes(chave);
        const agendamentos = resposta.agendamentos || [];
        const porDia = new Map();

        agendamentos.forEach((registro) => {
            if (!porDia.has(registro.data)) {
                porDia.set(registro.data, []);
            }

            porDia.get(registro.data).push(registro);
        });

        listaDoMes.textContent = "";

        porDia.forEach((doDia, data) => {
            const bloco = modeloDia.content.firstElementChild.cloneNode(true);
            const linhas = bloco.querySelector(".lista");

            bloco.querySelector(".agenda__dia-titulo").textContent =
                EXTENSO.format(deIso(data)) + " · " + quantas(doDia.length);

            doDia.forEach((registro) => linhas.appendChild(montarItem(registro, data)));

            listaDoMes.appendChild(bloco);
        });

        resumo.textContent = agendamentos.length ? quantas(agendamentos.length) + " no mês" : "";
        vazio.textContent = "Nenhuma avaliação marcada para este mês.";
        vazio.hidden = agendamentos.length > 0;
    };

    const carregar = async () => {
        avisar("");
        painel.fechar();
        resumo.textContent = "Carregando…";
        vazio.hidden = true;

        try {
            await (modo === "mes" ? carregarMes() : carregarDia());
        } catch (falha) {
            lista.textContent = "";
            listaDoMes.textContent = "";
            resumo.textContent = "";
            avisar(falha.message);
        }
    };

    const trocarModo = (novo) => {
        modo = novo;

        botoesDeModo.forEach((botao) => {
            const ativo = botao.dataset.modo === novo;

            botao.classList.toggle("esta-aqui", ativo);
            botao.setAttribute("aria-pressed", String(ativo));
        });

        titulo.textContent = novo === "mes" ? "Agenda do mês" : "Agenda do dia";
        navegacaoDoDia.hidden = novo === "mes";
        navegacaoDoMes.hidden = novo !== "mes";
        lista.hidden = novo === "mes";
        listaDoMes.hidden = novo !== "mes";

        carregar();
    };

    botoesDeModo.forEach((botao) => {
        botao.addEventListener("click", () => {
            if (botao.dataset.modo !== modo) {
                trocarModo(botao.dataset.modo);
            }
        });
    });

    /* REMARCAR */

    const avisarNaRemarcacao = (recado, errado = false) => {
        remarcarAviso.textContent = recado;
        remarcarAviso.classList.toggle("esta-errado", errado);
    };

    const abrirRemarcar = (registro, data) => {
        emRemarcacao = registro;

        remarcarPaciente.textContent = registro.paciente.nome;
        remarcarDia.value = data || "";
        remarcarDia.min = emIso(new Date());
        remarcarHora.value = registro.hora || "";
        remarcarSalvar.disabled = false;
        avisarNaRemarcacao("");

        dialogo.showModal();
    };

    const fecharRemarcar = () => {
        emRemarcacao = null;

        if (dialogo.open) {
            dialogo.close();
        }
    };

    document.querySelector("#remarcar-fechar").addEventListener("click", fecharRemarcar);
    document.querySelector("#remarcar-cancelar").addEventListener("click", fecharRemarcar);

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (!emRemarcacao) {
            return;
        }

        if (!remarcarDia.value || !remarcarHora.value) {
            avisarNaRemarcacao("Escolha o dia e o horário.", true);

            return;
        }

        remarcarSalvar.disabled = true;
        avisarNaRemarcacao("Remarcando…");

        try {
            await remarcar(emRemarcacao.id, remarcarDia.value + "T" + remarcarHora.value);

            const nome = emRemarcacao.paciente.nome;
            const novoDia = deIso(remarcarDia.value);

            fecharRemarcar();

            await carregar();

            resumo.textContent =
                "Remarcado: " + nome + ", " + EXTENSO.format(novoDia) + ", " + remarcarHora.value + ".";
        } catch (falha) {
            remarcarSalvar.disabled = false;
            avisarNaRemarcacao(falha.message, true);
        }
    });

    /* NAVEGAÇÃO */

    const andar = (dias) => {
        dia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + dias);
        carregar();
    };

    const andarMes = (meses) => {
        mes = new Date(mes.getFullYear(), mes.getMonth() + meses, 1);
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

    document.querySelector("#mes-anterior").addEventListener("click", () => andarMes(-1));
    document.querySelector("#mes-proximo").addEventListener("click", () => andarMes(1));

    document.querySelector("#mes-atual").addEventListener("click", () => {
        const agora = new Date();

        mes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        carregar();
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
