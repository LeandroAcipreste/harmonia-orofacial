import { exigirSessao } from "../../src/services/guarda.js";
import { sair } from "../../src/services/sessao.js";
import { montarAvisoDeEstoque } from "../../src/components/aviso-estoque/aviso-estoque.js";
import { emCentavos } from "../../src/services/financeiro.js";
import {
    TIPOS,
    cadastrarInsumo,
    comoQuantidade,
    emQuantidade,
    extrato,
    insumos,
    moverInsumo,
} from "../../src/services/inventario.js";

const VER = "inventario.ver";
const MOVER = "inventario.mover";
const GERENCIAR = "inventario.gerenciar";

const ESPERA_DA_BUSCA = 250;

const QUANDO = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

const comoData = (valor) => (valor ? QUANDO.format(new Date(valor)) : "");

/* Cada movimento pede uma pergunta diferente. "Quantas chegaram" e "quantas
   você contou na prateleira" parecem a mesma caixa de texto, mas são
   perguntas opostas, e trocar uma pela outra estraga o saldo. */
const PERGUNTAS = {
    entrada: {
        titulo: "Entrada de insumo",
        rotulo: "Quantas chegaram",
        ajuda: "Compra, doação ou devolução: o que entrou na prateleira agora.",
        motivo: "Compra de setembro",
    },
    perda: {
        titulo: "Perda de insumo",
        rotulo: "Quantas se perderam",
        ajuda: "Quebrou, venceu ou a embalagem violou. Sai do saldo e fica registrado.",
        motivo: "Frasco quebrado",
    },
    ajuste: {
        titulo: "Ajuste de contagem",
        rotulo: "Quantas você contou",
        ajuda: "Conte o que está na prateleira e escreva aqui. O sistema calcula sozinho a diferença para o saldo dele.",
        motivo: "Contagem do mês",
    },
};

const contar = (quantos, baixos) => {
    if (!quantos) {
        return "";
    }

    const total = quantos === 1 ? "1 insumo" : quantos + " insumos";

    return baixos ? total + ", " + baixos + " no mínimo" : total;
};

const initInventario = (sessao) => {
    const permitido = (permissao) => (sessao.permissoes || []).includes(permissao);

    const conteudo = document.querySelector("#inv-conteudo");
    const semAcesso = document.querySelector("#inv-sem-acesso");
    const quem = document.querySelector("#erp-quem");

    if (quem && sessao.nome) {
        quem.textContent = sessao.nome;
    }

    document.querySelector("#erp-sair").addEventListener("click", async () => {
        await sair();

        location.replace("../login/login.html");
    });

    if (!permitido(VER)) {
        semAcesso.hidden = false;
        return;
    }

    conteudo.hidden = false;

    const lista = document.querySelector("#inv-lista");
    const vazio = document.querySelector("#inv-vazio");
    const erro = document.querySelector("#inv-erro");
    const resumo = document.querySelector("#inv-resumo");
    const busca = document.querySelector("#inv-busca");
    const modelo = document.querySelector("#modelo-insumo");

    let situacao = "";

    const avisar = (recado) => {
        erro.textContent = recado;
        erro.hidden = !recado;
    };

    /* A JANELA DE MOVIMENTO */

    const janela = document.querySelector("#inv-movimento");
    const tituloDoMovimento = document.querySelector("#mov-titulo");
    const insumoDoMovimento = document.querySelector("#mov-insumo");
    const ajudaDoMovimento = document.querySelector("#mov-ajuda");
    const rotuloDaQuantidade = document.querySelector("#mov-rotulo");
    const campoQuantidade = document.querySelector("#mov-quantidade");
    const campoMotivo = document.querySelector("#mov-motivo");
    const campoCusto = document.querySelector("#mov-custo");
    const caixaDoCusto = document.querySelector("#mov-campo-custo");
    const erroDoMovimento = document.querySelector("#mov-erro");
    const confirmar = document.querySelector("#mov-confirmar");

    let emMovimento = null;

    const pedirMovimento = (insumo, tipo) => {
        const pergunta = PERGUNTAS[tipo];

        emMovimento = { insumo, tipo };

        tituloDoMovimento.textContent = pergunta.titulo;
        insumoDoMovimento.textContent =
            insumo.nome + "  ·  saldo " + comoQuantidade(insumo.saldo, insumo.unidade);
        ajudaDoMovimento.textContent = pergunta.ajuda;
        rotuloDaQuantidade.textContent = pergunta.rotulo;
        campoMotivo.placeholder = pergunta.motivo;

        campoQuantidade.value = "";
        campoMotivo.value = "";
        campoCusto.value = "";

        /* Preço só faz sentido na compra. É ele que transforma o inventário
           em custo e alimenta a precificação, mas continua opcional: quem
           só quer controlar quantidade não precisa preencher. */
        caixaDoCusto.hidden = tipo !== "entrada";
        erroDoMovimento.textContent = "";
        erroDoMovimento.classList.remove("esta-errado");

        janela.showModal();
        campoQuantidade.focus();
    };

    document.querySelector("#mov-cancelar").addEventListener("click", () => janela.close());

    confirmar.addEventListener("click", async () => {
        const quantidade = emQuantidade(campoQuantidade.value);
        const motivo = campoMotivo.value.trim();
        const ehAjuste = emMovimento.tipo === "ajuste";

        if (!ehAjuste && quantidade <= 0) {
            erroDoMovimento.textContent = "Informe uma quantidade maior que zero.";
            erroDoMovimento.classList.add("esta-errado");
            return;
        }

        if (ehAjuste && !campoQuantidade.value.trim()) {
            erroDoMovimento.textContent = "Escreva quantas unidades você contou.";
            erroDoMovimento.classList.add("esta-errado");
            return;
        }

        if (!motivo) {
            erroDoMovimento.textContent = "Escreva o motivo: é ele que explica o saldo depois.";
            erroDoMovimento.classList.add("esta-errado");
            return;
        }

        confirmar.disabled = true;

        try {
            const custo = emCentavos(campoCusto.value);

            await moverInsumo(emMovimento.insumo.id, {
                tipo: emMovimento.tipo,
                motivo,
                ...(ehAjuste ? { contagem: quantidade } : { quantidade }),
                ...(emMovimento.tipo === "entrada" && custo > 0 ? { custoUnitario: custo } : {}),
            });

            janela.close();
            await carregar();
            montarAvisoDeEstoque(sessao);
        } catch (falha) {
            erroDoMovimento.textContent = falha.message;
            erroDoMovimento.classList.add("esta-errado");
        } finally {
            confirmar.disabled = false;
        }
    });

    /* O EXTRATO */

    const janelaDoExtrato = document.querySelector("#inv-extrato");
    const nomeNoExtrato = document.querySelector("#ext-nome");
    const saldoNoExtrato = document.querySelector("#ext-saldo");
    const listaDoExtrato = document.querySelector("#ext-lista");
    const modeloMovimento = document.querySelector("#modelo-movimento");

    document.querySelector("#ext-fechar").addEventListener("click", () => janelaDoExtrato.close());

    const abrirExtrato = async (insumo) => {
        nomeNoExtrato.textContent = insumo.nome;
        saldoNoExtrato.textContent = "Carregando…";
        listaDoExtrato.textContent = "";
        janelaDoExtrato.showModal();

        try {
            const dados = await extrato(insumo.id);

            saldoNoExtrato.textContent =
                "Saldo " +
                comoQuantidade(dados.insumo.saldo, dados.insumo.unidade) +
                "  ·  mínimo " +
                comoQuantidade(dados.insumo.minimo, dados.insumo.unidade);

            dados.movimentos.forEach((movimento) => {
                const linha = modeloMovimento.content.firstElementChild.cloneNode(true);
                const quantidade = linha.querySelector(".extrato__quantidade");
                const saindo = movimento.quantidade < 0;

                linha.querySelector(".extrato__tipo").textContent = TIPOS[movimento.tipo];

                linha.querySelector(".extrato__detalhe").textContent = [
                    comoData(movimento.criadoEm),
                    movimento.paciente || movimento.motivo,
                    movimento.autor,
                ]
                    .filter(Boolean)
                    .join("  ·  ");

                quantidade.textContent =
                    (saindo ? "" : "+") + comoQuantidade(movimento.quantidade);
                quantidade.classList.toggle("esta-saindo", saindo);

                listaDoExtrato.appendChild(linha);
            });
        } catch (falha) {
            saldoNoExtrato.textContent = falha.message;
        }
    };

    /* A LISTA */

    const linhaDeInsumo = (insumo) => {
        const item = modelo.content.firstElementChild.cloneNode(true);

        item.classList.toggle("esta-no-minimo", insumo.noMinimo && insumo.ativo);
        item.classList.toggle("esta-parado", !insumo.ativo);

        item.querySelector(".insumo__nome").textContent = insumo.nome;
        item.querySelector(".insumo__categoria").textContent =
            [insumo.categoria, insumo.ativo ? "" : "desativado"].filter(Boolean).join("  ·  ");

        item.querySelector(".insumo__quantidade").textContent = comoQuantidade(
            insumo.saldo,
            insumo.unidade,
        );
        item.querySelector(".insumo__minimo").textContent =
            "mínimo " + comoQuantidade(insumo.minimo);

        item.querySelectorAll("[data-tipo]").forEach((botao) => {
            if (!permitido(MOVER)) {
                botao.remove();
                return;
            }

            botao.addEventListener("click", () => pedirMovimento(insumo, botao.dataset.tipo));
        });

        item.querySelector("[data-extrato]").addEventListener("click", () => abrirExtrato(insumo));

        return item;
    };

    const carregar = async () => {
        avisar("");

        try {
            const { insumos: lidos } = await insumos({ busca: busca.value.trim(), situacao });

            lista.textContent = "";
            lidos.forEach((insumo) => lista.appendChild(linhaDeInsumo(insumo)));

            vazio.hidden = lidos.length > 0;
            resumo.textContent = contar(
                lidos.length,
                lidos.filter((insumo) => insumo.noMinimo && insumo.ativo).length,
            );
        } catch (falha) {
            avisar(falha.message);
        }
    };

    let espera = null;

    busca.addEventListener("input", () => {
        window.clearTimeout(espera);
        espera = window.setTimeout(carregar, ESPERA_DA_BUSCA);
    });

    document.querySelectorAll(".inv__aba").forEach((aba) => {
        aba.addEventListener("click", () => {
            document.querySelectorAll(".inv__aba").forEach((outra) => {
                outra.classList.toggle("esta-aqui", outra === aba);
            });

            situacao = aba.dataset.situacao;
            carregar();
        });
    });

    /* O CADASTRO */

    if (permitido(GERENCIAR)) {
        const cadastro = document.querySelector("#inv-cadastro");
        const aviso = document.querySelector("#inv-cadastro-aviso");

        cadastro.hidden = false;

        document.querySelector("#inv-form").addEventListener("submit", async (evento) => {
            evento.preventDefault();

            const nome = document.querySelector("#novo-nome").value.trim();

            if (!nome) {
                aviso.textContent = "O insumo precisa de nome.";
                aviso.classList.add("esta-errado");
                return;
            }

            aviso.classList.remove("esta-errado");
            aviso.textContent = "Cadastrando…";

            try {
                await cadastrarInsumo({
                    nome,
                    categoria: document.querySelector("#novo-categoria").value.trim(),
                    unidade: document.querySelector("#novo-unidade").value.trim(),
                    minimo: emQuantidade(document.querySelector("#novo-minimo").value),
                });

                document.querySelector("#inv-form").reset();
                aviso.textContent = "Insumo cadastrado. Lance a entrada para o saldo começar.";

                await carregar();
                montarAvisoDeEstoque(sessao);
            } catch (falha) {
                aviso.textContent = falha.message;
                aviso.classList.add("esta-errado");
            }
        });
    }

    carregar();
    montarAvisoDeEstoque(sessao);
};

/* Chamado pelo main.js, que descobre a página pelo data-pagina do body. */
export const init = () =>
    exigirSessao().then((sessao) => {
        if (sessao) {
            initInventario(sessao);
        }
    });
