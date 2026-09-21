import { exigirSessao } from "../../src/services/guarda.js";
import { sair } from "../../src/services/sessao.js";
import { montarAvisoDeEstoque } from "../../src/components/aviso-estoque/aviso-estoque.js";
import { pacientes } from "../../src/services/atendimento.js";
import {
    alternarLaboratorio,
    buscarAgora,
    cadastrarLaboratorio,
    conferencia,
    descartar,
    enderecoDoAnexo,
    laboratorios,
    ligarAFicha,
    statusDaBusca,
} from "../../src/services/exames.js";

const PERMISSAO = "exames.conferir";

const ESPERA_DA_BUSCA = 250;

/* O servidor manda o motivo em código, para a máquina. Aqui ele vira
   frase curta, para a doutora saber o que fazer com o cartão. */
const MOTIVOS = {
    remetente_desconhecido: "Remetente não cadastrado",
    remetente_nao_autenticado: "Origem não confirmada",
    cpf_ausente: "Sem CPF no assunto",
    cpf_ambiguo: "Mais de um CPF no assunto",
    cpf_nao_encontrado: "CPF sem ficha",
    sem_arquivo_valido: "Sem arquivo aproveitável",
};

const QUANDO = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const comoData = (iso) => (iso ? QUANDO.format(new Date(iso)) : "");

const comoTamanho = (bytes) => {
    const kb = bytes / 1024;

    return kb < 1024
        ? Math.max(1, Math.round(kb)) + " KB"
        : (kb / 1024).toFixed(1).replace(".", ",") + " MB";
};

const contar = (quantos) => (quantos === 1 ? "1 exame esperando" : quantos + " exames esperando");

const initExames = (sessao) => {
    const conteudo = document.querySelector("#exames-conteudo");
    const semAcesso = document.querySelector("#exames-sem-acesso");
    const quem = document.querySelector("#erp-quem");

    if (quem && sessao.nome) {
        quem.textContent = sessao.nome;
    }

    document.querySelector("#erp-sair").addEventListener("click", async () => {
        await sair();

        location.replace("../login/login.html");
    });

    /* Sem a permissão, a tela nem monta. Quem garante é o servidor, que
       responde 403 em cada rota desta página. */
    if (!(sessao.permissoes || []).includes(PERMISSAO)) {
        semAcesso.hidden = false;
        return;
    }

    conteudo.hidden = false;

    const fila = document.querySelector("#exames-fila");
    const vazio = document.querySelector("#exames-vazio");
    const erro = document.querySelector("#exames-erro");
    const resumo = document.querySelector("#exames-resumo");
    const status = document.querySelector("#exames-status");
    const botaoBuscar = document.querySelector("#exames-buscar");
    const modelo = document.querySelector("#modelo-exame");
    const modeloAchado = document.querySelector("#modelo-achado");

    const avisar = (recado) => {
        erro.textContent = recado;
        erro.hidden = !recado;
    };

    /* UM CARTÃO DA FILA */

    const montarCartao = (exame) => {
        const item = modelo.content.firstElementChild.cloneNode(true);
        const achar = (classe) => item.querySelector("." + classe);
        const anexos = achar("cartao__anexos");
        const procura = achar("cartao__procura");
        const achados = achar("cartao__achados");
        const semAchado = item.querySelector("[data-procura-vazia]");
        const confirma = achar("cartao__confirma");
        const campo = achar("cartao__campo");
        const botaoSugestao = item.querySelector("[data-sugestao]");
        const botoes = [...item.querySelectorAll(".cartao__botao")];

        achar("cartao__assunto").textContent = exame.assunto || "(sem assunto)";
        achar("cartao__de").textContent = [exame.remetente, comoData(exame.recebidoEm)]
            .filter(Boolean)
            .join("  ·  ");
        achar("cartao__motivo").textContent = MOTIVOS[exame.motivo] || exame.motivo;

        (exame.anexos || []).forEach((anexo) => {
            const linha = document.createElement("li");
            const link = document.createElement("a");
            const tamanho = document.createElement("span");

            link.className = "cartao__anexo";
            link.href = enderecoDoAnexo(anexo.url);
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = anexo.nome;

            tamanho.className = "cartao__anexo-tamanho";
            tamanho.textContent = comoTamanho(anexo.tamanho);

            link.appendChild(tamanho);
            linha.appendChild(link);
            anexos.appendChild(linha);
        });

        const temAnexo = Boolean((exame.anexos || []).length);

        anexos.hidden = !temAnexo;
        achar("cartao__sem-anexo").hidden = temAnexo;

        const trancar = (ocupado) => botoes.forEach((botao) => (botao.disabled = ocupado));

        const ligar = async (avaliacaoId) => {
            avisar("");
            trancar(true);

            try {
                await ligarAFicha(exame.id, avaliacaoId);
                await carregar();
            } catch (falha) {
                avisar(falha.message);
                trancar(false);
            }
        };

        if (exame.sugestao) {
            botaoSugestao.hidden = false;
            botaoSugestao.textContent = "Ligar a " + exame.sugestao.nome;
            botaoSugestao.addEventListener("click", () => ligar(exame.sugestao.avaliacaoId));
        }

        /* Procurar outra ficha */

        let agendado = null;

        const procurar = async () => {
            const busca = campo.value.trim();

            achados.textContent = "";
            semAchado.hidden = true;

            if (busca.length < 2) {
                return;
            }

            try {
                const resposta = await pacientes({ busca });
                const pessoas = resposta.pacientes || [];

                pessoas.forEach((pessoa) => {
                    const linha = modeloAchado.content.firstElementChild.cloneNode(true);

                    linha.querySelector(".cartao__achado-nome").textContent = pessoa.paciente.nome;
                    linha.querySelector(".cartao__achado-detalhe").textContent = [
                        pessoa.paciente.telefone,
                        pessoa.paciente.cidade,
                    ]
                        .filter(Boolean)
                        .join("  ·  ");

                    linha.querySelector(".cartao__achado").addEventListener("click", () => ligar(pessoa.id));
                    achados.appendChild(linha);
                });

                semAchado.hidden = pessoas.length > 0;
            } catch (falha) {
                avisar(falha.message);
            }
        };

        campo.addEventListener("input", () => {
            window.clearTimeout(agendado);
            agendado = window.setTimeout(procurar, ESPERA_DA_BUSCA);
        });

        item.querySelector("[data-buscar]").addEventListener("click", () => {
            procura.hidden = !procura.hidden;
            confirma.hidden = true;

            if (!procura.hidden) {
                campo.focus();
            }
        });

        /* Descartar, sempre com confirmação: o arquivo some do servidor. */

        item.querySelector("[data-descartar]").addEventListener("click", () => {
            confirma.hidden = false;
            procura.hidden = true;
        });

        item.querySelector("[data-cancela]").addEventListener("click", () => {
            confirma.hidden = true;
        });

        item.querySelector("[data-confirma]").addEventListener("click", async () => {
            avisar("");
            trancar(true);

            try {
                await descartar(exame.id);
                await carregar();
            } catch (falha) {
                avisar(falha.message);
                trancar(false);
            }
        });

        return item;
    };

    /* FILA */

    const carregar = async () => {
        avisar("");
        resumo.textContent = "Carregando…";

        try {
            const resposta = await conferencia();
            const exames = resposta.exames || [];

            fila.textContent = "";
            exames.forEach((exame) => fila.appendChild(montarCartao(exame)));

            resumo.textContent = exames.length ? contar(exames.length) : "";
            vazio.hidden = exames.length > 0;
        } catch (falha) {
            fila.textContent = "";
            resumo.textContent = "";
            avisar(falha.message);
        }
    };

    /* BUSCA NO E-MAIL */

    const contarBusca = (ultima) => {
        if (!ultima || ultima.situacao === "nunca_rodou") {
            return "ainda não rodou nesta sessão do servidor";
        }

        if (ultima.situacao !== "ok") {
            return "última tentativa: " + ultima.situacao.replace(/_/g, " ");
        }

        return `${comoData(ultima.em)}: ${ultima.importado} para a ficha, ${ultima.conferencia} para conferência`;
    };

    const mostrarStatus = async () => {
        try {
            const resposta = await statusDaBusca();

            status.textContent = resposta.ligada
                ? `A cada ${resposta.intervaloMinutos} minutos. ${contarBusca(resposta.ultimaBusca)}`
                : "A busca automática está desligada no servidor.";
        } catch (falha) {
            status.textContent = falha.message;
        }
    };

    botaoBuscar.addEventListener("click", async () => {
        botaoBuscar.disabled = true;
        status.textContent = "Procurando no e-mail…";

        try {
            await buscarAgora();
            await mostrarStatus();
            await carregar();
        } catch (falha) {
            status.textContent = falha.message;
        } finally {
            botaoBuscar.disabled = false;
        }
    });

    /* LABORATÓRIOS */

    const listaDeLabs = document.querySelector("#exames-labs");
    const formulario = document.querySelector("#exames-lab-form");
    const erroLab = document.querySelector("#exames-lab-erro");
    const modeloLab = document.querySelector("#modelo-lab");

    const avisarLab = (recado) => {
        erroLab.textContent = recado;
        erroLab.hidden = !recado;
    };

    const carregarLabs = async () => {
        try {
            const resposta = await laboratorios();

            listaDeLabs.textContent = "";

            (resposta.laboratorios || []).forEach((laboratorio) => {
                const item = modeloLab.content.firstElementChild.cloneNode(true);
                const botao = item.querySelector("button");

                item.dataset.ativo = String(laboratorio.ativo);
                item.querySelector(".exames__lab-nome").textContent = laboratorio.nome;
                item.querySelector(".exames__lab-email").textContent = laboratorio.email;
                botao.textContent = laboratorio.ativo ? "Desativar" : "Ativar";

                botao.addEventListener("click", async () => {
                    avisarLab("");
                    botao.disabled = true;

                    try {
                        await alternarLaboratorio(laboratorio.id, !laboratorio.ativo);
                        await carregarLabs();
                    } catch (falha) {
                        avisarLab(falha.message);
                        botao.disabled = false;
                    }
                });

                listaDeLabs.appendChild(item);
            });
        } catch (falha) {
            avisarLab(falha.message);
        }
    };

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const dados = new FormData(formulario);
        const nome = (dados.get("nome") || "").toString().trim();
        const email = (dados.get("email") || "").toString().trim();

        if (!nome || !email) {
            avisarLab("Preencha o nome e o e-mail do laboratório.");
            return;
        }

        avisarLab("");

        try {
            await cadastrarLaboratorio({ nome, email });
            formulario.reset();
            await carregarLabs();
        } catch (falha) {
            avisarLab(falha.message);
        }
    });

    carregar();
    mostrarStatus();
    carregarLabs();
};

/* Chamado pelo main.js, que descobre a página pelo data-pagina do body. */
export const init = () =>
    exigirSessao().then((sessao) => {
        if (sessao) {
            initExames(sessao);
            montarAvisoDeEstoque(sessao);
        }
    });
