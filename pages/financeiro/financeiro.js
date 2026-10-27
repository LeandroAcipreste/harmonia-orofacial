import { exigirSessao } from "../../src/services/guarda.js";
import { sair } from "../../src/services/sessao.js";
import { montarAvisoDeEstoque } from "../../src/components/aviso-estoque/aviso-estoque.js";
import {
    custosFixos,
    precificacao,
    removerCusto,
    rentabilidade,
    salvarCusto,
    salvarParametros,
    salvarProcedimento,
} from "../../src/services/precificacao.js";
import {
    FORMAS,
    balanco,
    emAberto,
    emCentavos,
    emDinheiro,
    enderecoDaPlanilha,
    estornarPagamento,
    lancamentos,
    painel,
    rotuloDaForma,
    salvarTaxa,
    taxas,
} from "../../src/services/financeiro.js";

/* Quem tem financeiro.caixa entra: é a secretária, que confere o que
   entrou hoje. Os pedaços maiores (balanço, período, em aberto, taxas)
   aparecem conforme a permissão, e cada rota é recusada de novo no
   servidor, que é quem de fato protege. */
const CAIXA = "financeiro.caixa";
const VER = "financeiro.ver";
const REGISTRAR = "financeiro.registrar";
const TAXAS = "financeiro.taxas";
const PRECIFICAR = "financeiro.precificar";
const RENTABILIDADE = "relatorio.rentabilidade";

/* Percentual e horas aceitam vírgula, como todo campo numérico da casa. */
const emNumero = (texto) => {
    const limpo = String(texto ?? "").trim().replace(",", ".");
    const numero = Number(limpo);

    return Number.isFinite(numero) ? numero : 0;
};

const comoPercentual = (valor) =>
    valor === null || valor === undefined ? "" : String(valor).replace(".", ",") + "%";

const DIA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

const comoDia = (iso) => (iso ? DIA.format(new Date(String(iso).slice(0, 10) + "T12:00:00")) : "");

const contarRecebimentos = (quantos) => {
    if (!quantos) {
        return "nenhum recebimento";
    }

    return quantos === 1 ? "1 recebimento" : quantos + " recebimentos";
};

const hoje = () => {
    const agora = new Date();

    return [
        agora.getFullYear(),
        String(agora.getMonth() + 1).padStart(2, "0"),
        String(agora.getDate()).padStart(2, "0"),
    ].join("-");
};

const initFinanceiro = (sessao) => {
    const permitido = (permissao) => (sessao.permissoes || []).includes(permissao);

    const conteudo = document.querySelector("#fin-conteudo");
    const semAcesso = document.querySelector("#fin-sem-acesso");
    const quem = document.querySelector("#erp-quem");

    if (quem && sessao.nome) {
        quem.textContent = sessao.nome;
    }

    document.querySelector("#erp-sair").addEventListener("click", async () => {
        await sair();

        location.replace("../login/login.html");
    });

    montarAvisoDeEstoque(sessao);

    if (!permitido(CAIXA)) {
        semAcesso.hidden = false;
        return;
    }

    conteudo.hidden = false;

    const erro = document.querySelector("#fin-erro");
    const lista = document.querySelector("#fin-lista");
    const vazio = document.querySelector("#fin-vazio");
    const total = document.querySelector("#fin-total");
    const tituloDaLista = document.querySelector("#fin-titulo-lista");
    const modelo = document.querySelector("#modelo-lancamento");

    const avisar = (recado) => {
        erro.textContent = recado;
        erro.hidden = !recado;
    };

    /* O ESTORNO */

    const janela = document.querySelector("#fin-estorno");
    const resumoDoEstorno = document.querySelector("#estorno-resumo");
    const motivo = document.querySelector("#estorno-motivo");
    const erroDoEstorno = document.querySelector("#estorno-erro");
    const confirmar = document.querySelector("#estorno-confirmar");

    let emEstorno = null;

    const pedirEstorno = (pagamento) => {
        emEstorno = pagamento;

        resumoDoEstorno.textContent =
            emDinheiro(pagamento.valor) +
            " de " +
            (pagamento.paciente || "paciente") +
            ", em " +
            rotuloDaForma(pagamento.forma).toLowerCase() +
            ".";

        motivo.value = "";
        erroDoEstorno.textContent = "";
        janela.showModal();
        motivo.focus();
    };

    document.querySelector("#estorno-cancelar").addEventListener("click", () => janela.close());

    confirmar.addEventListener("click", async () => {
        const texto = motivo.value.trim();

        if (!texto) {
            erroDoEstorno.textContent = "Escreva o motivo do estorno.";
            erroDoEstorno.classList.add("esta-errado");
            return;
        }

        confirmar.disabled = true;

        try {
            await estornarPagamento(emEstorno.id, texto);

            janela.close();
            await carregarTudo();
        } catch (falha) {
            erroDoEstorno.textContent = falha.message;
            erroDoEstorno.classList.add("esta-errado");
        } finally {
            confirmar.disabled = false;
        }
    });

    /* OS LANÇAMENTOS */

    const linhaDeLancamento = (pagamento) => {
        const item = modelo.content.firstElementChild.cloneNode(true);
        const achar = (classe) => item.querySelector("." + classe);
        const estornar = achar("lancamento__estornar");

        achar("lancamento__paciente").textContent = pagamento.paciente || "Paciente";

        const meio = [
            comoDia(pagamento.recebidoEm),
            rotuloDaForma(pagamento.forma) +
                (pagamento.parcelas > 1 ? " em " + pagamento.parcelas + "x" : ""),
            pagamento.registradoPor,
        ].filter(Boolean);

        if (pagamento.estornadoEm) {
            meio.push("estornado: " + (pagamento.estornoMotivo || "sem motivo"));
        }

        achar("lancamento__meio").textContent = meio.join("  ·  ");
        achar("lancamento__valor").textContent = emDinheiro(pagamento.valor);

        achar("lancamento__taxa").textContent = pagamento.taxa
            ? "taxa " + emDinheiro(pagamento.taxa) + "  ·  líquido " + emDinheiro(pagamento.liquido)
            : "sem taxa";

        item.classList.toggle("esta-estornado", Boolean(pagamento.estornadoEm));

        if (pagamento.estornadoEm || !permitido(REGISTRAR)) {
            estornar.remove();
        } else {
            estornar.addEventListener("click", () => pedirEstorno(pagamento));
        }

        return item;
    };

    const montarLancamentos = (periodo) => {
        lista.textContent = "";

        periodo.lancamentos.forEach((pagamento) => lista.appendChild(linhaDeLancamento(pagamento)));

        vazio.hidden = periodo.lancamentos.length > 0;

        total.textContent = periodo.lancamentos.length
            ? "Líquido " +
              emDinheiro(periodo.total.liquido) +
              "  ·  bruto " +
              emDinheiro(periodo.total.bruto) +
              "  ·  " +
              contarRecebimentos(periodo.total.quantos)
            : "";
    };

    /* O BALANÇO, PARA QUEM VÊ O FINANCEIRO INTEIRO */

    const balancoNaTela = document.querySelector("#fin-balanco");
    const notaDoLiquido = document.querySelector("#fin-nota-liquido");
    const formas = document.querySelector("#fin-formas");
    const listaDeFormas = document.querySelector("#fin-formas-lista");

    const montarBalanco = (resposta) => {
        Object.entries(resposta.balanco).forEach(([periodo, soma]) => {
            const cartao = balancoNaTela.querySelector('[data-periodo="' + periodo + '"]');

            cartao.querySelector("[data-liquido]").textContent = emDinheiro(soma.liquido);
            cartao.querySelector("[data-bruto]").textContent = emDinheiro(soma.bruto);
            cartao.querySelector("[data-taxa]").textContent = emDinheiro(soma.taxa);
            cartao.querySelector("[data-quantos]").textContent = contarRecebimentos(soma.quantos);
        });

        listaDeFormas.textContent = "";

        resposta.porForma.forEach((linha) => {
            const item = document.createElement("li");
            const nome = document.createElement("span");
            const valores = document.createElement("span");

            item.className = "forma";
            nome.className = "forma__nome";
            nome.textContent = rotuloDaForma(linha.forma);

            const quantos = document.createElement("span");

            quantos.className = "forma__quantos";
            quantos.textContent = contarRecebimentos(linha.quantos);
            nome.appendChild(quantos);

            valores.className = "forma__valores";

            const liquido = document.createElement("strong");

            liquido.className = "forma__liquido";
            liquido.textContent = emDinheiro(linha.liquido);

            const taxa = document.createElement("span");

            taxa.className = "forma__taxa";
            taxa.textContent = linha.taxa ? "taxa " + emDinheiro(linha.taxa) : "sem taxa";

            valores.appendChild(liquido);
            valores.appendChild(taxa);
            item.appendChild(nome);
            item.appendChild(valores);
            listaDeFormas.appendChild(item);
        });

        formas.hidden = !resposta.porForma.length;
    };

    /* EM ABERTO */

    const abertos = document.querySelector("#fin-abertos");
    const listaDeAbertos = document.querySelector("#fin-abertos-lista");
    const totalAberto = document.querySelector("#fin-abertos-total");
    const semAberto = document.querySelector("#fin-abertos-vazio");
    const modeloAberto = document.querySelector("#modelo-aberto");

    const montarAbertos = (resposta) => {
        listaDeAbertos.textContent = "";

        resposta.emAberto.forEach((linha) => {
            const item = modeloAberto.content.firstElementChild.cloneNode(true);

            item.querySelector(".lista__nome").textContent = linha.nome;
            item.querySelector(".lista__detalhe").textContent =
                "Combinado " + emDinheiro(linha.total) + "  ·  recebido " + emDinheiro(linha.recebido);
            item.querySelector(".aberto__saldo").textContent = emDinheiro(linha.saldo);

            listaDeAbertos.appendChild(item);
        });

        totalAberto.textContent = resposta.emAberto.length
            ? "Total a receber: " + emDinheiro(resposta.total)
            : "";

        semAberto.hidden = resposta.emAberto.length > 0;
    };

    /* AS TAXAS */

    const blocoDeTaxas = document.querySelector("#fin-taxas");
    const listaDeTaxas = document.querySelector("#fin-taxas-lista");
    const modeloTaxa = document.querySelector("#modelo-taxa");
    const formaDaTaxa = document.querySelector("#taxa-forma");
    const faixaDe = document.querySelector("#taxa-faixa-de");
    const faixaAte = document.querySelector("#taxa-faixa-ate");
    const campoDe = document.querySelector("#taxa-de");
    const campoAte = document.querySelector("#taxa-ate");
    const percentual = document.querySelector("#taxa-percentual");
    const avisoDaTaxa = document.querySelector("#fin-taxa-aviso");

    const mostrarFaixa = () => {
        const ehCredito = formaDaTaxa.value === "credito";

        faixaDe.hidden = !ehCredito;
        faixaAte.hidden = !ehCredito;

        if (!ehCredito) {
            campoDe.value = "1";
            campoAte.value = "1";
        }
    };

    const montarTaxas = (resposta) => {
        listaDeTaxas.textContent = "";

        resposta.taxas.forEach((taxa) => {
            const item = modeloTaxa.content.firstElementChild.cloneNode(true);
            const faixa =
                taxa.parcelasDe === taxa.parcelasAte
                    ? taxa.parcelasDe === 1
                        ? ""
                        : " em " + taxa.parcelasDe + "x"
                    : " de " + taxa.parcelasDe + "x a " + taxa.parcelasAte + "x";

            item.querySelector(".taxa__forma").textContent = rotuloDaForma(taxa.forma) + faixa;
            item.querySelector(".taxa__percentual").textContent =
                String(taxa.percentual).replace(".", ",") + "%";

            listaDeTaxas.appendChild(item);
        });
    };

    formaDaTaxa.addEventListener("change", mostrarFaixa);

    document.querySelector("#fin-taxa-form").addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const numero = Number(percentual.value.replace(",", "."));

        if (!Number.isFinite(numero) || numero < 0 || numero > 100) {
            avisoDaTaxa.textContent = "A taxa é um número de 0 a 100.";
            avisoDaTaxa.classList.add("esta-errado");
            return;
        }

        avisoDaTaxa.classList.remove("esta-errado");
        avisoDaTaxa.textContent = "Salvando…";

        try {
            await salvarTaxa({
                forma: formaDaTaxa.value,
                parcelasDe: Number(campoDe.value) || 1,
                parcelasAte: Number(campoAte.value) || Number(campoDe.value) || 1,
                percentual: numero,
            });

            percentual.value = "";
            avisoDaTaxa.textContent = "Taxa salva. Vale para os próximos lançamentos.";

            montarTaxas(await taxas());
        } catch (falha) {
            avisoDaTaxa.textContent = falha.message;
            avisoDaTaxa.classList.add("esta-errado");
        }
    });

    /* O PERÍODO */

    const filtro = document.querySelector("#fin-filtro");
    const de = document.querySelector("#fin-de");
    const ate = document.querySelector("#fin-ate");
    const planilha = document.querySelector("#fin-planilha");

    const periodoEscolhido = () =>
        permitido(VER) && de.value && ate.value ? { de: de.value, ate: ate.value } : {};

    const atualizarPlanilha = () => {
        planilha.href = enderecoDaPlanilha(periodoEscolhido());
    };

    const carregarLista = async () => {
        const escolhido = periodoEscolhido();

        tituloDaLista.textContent = escolhido.de ? "Recebimentos do período" : "Caixa de hoje";

        montarLancamentos(await lancamentos(escolhido));
        atualizarPlanilha();
    };

    /* AS ABAS

       Três assuntos numa tela só, e cada um com a sua permissão. A aba que
       a pessoa não pode abrir simplesmente não existe para ela. */

    const abas = document.querySelector("#fin-abas");
    const paineis = {
        painel: document.querySelector("#fin-painel-painel"),
        caixa: document.querySelector("#fin-painel-caixa"),
        precificacao: document.querySelector("#fin-painel-precificacao"),
        rentabilidade: document.querySelector("#fin-painel-rentabilidade"),
    };

    const mostrarPainel = (qual) => {
        Object.entries(paineis).forEach(([nome, painel]) => {
            painel.hidden = nome !== qual;
        });

        abas.querySelectorAll(".fin__aba").forEach((aba) => {
            aba.classList.toggle("esta-aqui", aba.dataset.painel === qual);
        });
    };

    /* PRECIFICAÇÃO */

    const modeloProcedimento = document.querySelector("#modelo-procedimento");
    const modeloCusto = document.querySelector("#modelo-custo");
    const listaDeProcedimentos = document.querySelector("#fin-procedimentos");
    const listaDeCustos = document.querySelector("#fin-custos");
    const avisoParametros = document.querySelector("#fin-parametros-aviso");
    const avisoCusto = document.querySelector("#fin-custo-aviso");
    const avisoProcedimento = document.querySelector("#fin-procedimento-aviso");

    const montarMesa = (mesa) => {
        document.querySelector("#hora-fixos").textContent = emDinheiro(mesa.custosFixos);
        document.querySelector("#hora-prolabore").textContent = emDinheiro(mesa.prolabore);
        document.querySelector("#hora-hora").textContent = emDinheiro(mesa.custoDaHora);
        document.querySelector("#hora-detalhe").textContent =
            "em " +
            String(mesa.parametros.horasClinicas).replace(".", ",") +
            " horas por mês  ·  taxa média de cartão " +
            comoPercentual(mesa.taxaMedia);

        document.querySelector("#par-horas").value = String(mesa.parametros.horasClinicas).replace(".", ",");
        document.querySelector("#par-prolabore").value = (mesa.parametros.prolabore / 100)
            .toFixed(2)
            .replace(".", ",");
        document.querySelector("#par-margem").value = String(mesa.parametros.margem).replace(".", ",");
        document.querySelector("#par-impostos").value = String(mesa.parametros.impostos).replace(".", ",");

        listaDeProcedimentos.textContent = "";

        mesa.procedimentos.forEach((procedimento) => {
            const item = modeloProcedimento.content.firstElementChild.cloneNode(true);

            item.querySelector(".procedimento__nome").textContent = procedimento.nome;

            const detalhe = [procedimento.duracao + " min"];

            if (procedimento.insumosSemPreco.length) {
                detalhe.push("sem preço de compra: " + procedimento.insumosSemPreco.join(", "));
            }

            item.querySelector(".procedimento__detalhe").textContent = detalhe.join("  ·  ");

            item.querySelector("[data-custo]").textContent = emDinheiro(procedimento.custo);
            item.querySelector("[data-preco]").textContent = emDinheiro(procedimento.preco);
            item.querySelector("[data-sugerido]").textContent =
                procedimento.precoSugerido === null
                    ? "sem preço possível"
                    : emDinheiro(procedimento.precoSugerido);

            const margem = item.querySelector("[data-margem]");

            margem.textContent =
                procedimento.margem === null ? "sem preço" : comoPercentual(procedimento.margem);
            margem.classList.toggle("esta-no-vermelho", procedimento.sobra <= 0);

            item.querySelector("[data-hora]").textContent =
                emDinheiro(procedimento.porHora) + " por hora";

            /* O preço abaixo do sugerido não é erro, é escolha. A tela
               marca para a doutora ver, e não corrige nada sozinha. */
            item.classList.toggle(
                "esta-abaixo",
                procedimento.precoSugerido !== null && procedimento.preco < procedimento.precoSugerido,
            );

            listaDeProcedimentos.appendChild(item);
        });
    };

    const montarCustos = (dados) => {
        listaDeCustos.textContent = "";

        dados.custos
            .filter((custo) => custo.ativo)
            .forEach((custo) => {
                const item = modeloCusto.content.firstElementChild.cloneNode(true);

                item.querySelector(".taxa__forma").textContent = [custo.nome, custo.categoria]
                    .filter(Boolean)
                    .join("  ·  ");
                item.querySelector(".taxa__percentual").textContent = emDinheiro(custo.valor);

                item.querySelector(".custo__tirar").addEventListener("click", async () => {
                    try {
                        await removerCusto(custo.id);
                        await carregarPrecificacao();
                    } catch (falha) {
                        avisoCusto.textContent = falha.message;
                        avisoCusto.classList.add("esta-errado");
                    }
                });

                listaDeCustos.appendChild(item);
            });
    };

    const carregarPrecificacao = async () => {
        const [mesa, custos] = await Promise.all([precificacao(), custosFixos()]);

        montarMesa(mesa);
        montarCustos(custos);
    };

    document.querySelector("#fin-parametros").addEventListener("submit", async (evento) => {
        evento.preventDefault();

        avisoParametros.classList.remove("esta-errado");
        avisoParametros.textContent = "Salvando…";

        try {
            await salvarParametros({
                horasClinicas: emNumero(document.querySelector("#par-horas").value),
                prolabore: emCentavos(document.querySelector("#par-prolabore").value),
                margem: emNumero(document.querySelector("#par-margem").value),
                impostos: emNumero(document.querySelector("#par-impostos").value),
            });

            await carregarPrecificacao();
            avisoParametros.textContent = "Parâmetros salvos. O preço sugerido já mudou.";
        } catch (falha) {
            avisoParametros.textContent = falha.message;
            avisoParametros.classList.add("esta-errado");
        }
    });

    document.querySelector("#fin-custo-form").addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const nome = document.querySelector("#custo-nome").value.trim();
        const valor = emCentavos(document.querySelector("#custo-valor").value);

        if (!nome || valor <= 0) {
            avisoCusto.textContent = "Escreva o nome do custo e o valor mensal.";
            avisoCusto.classList.add("esta-errado");
            return;
        }

        avisoCusto.classList.remove("esta-errado");
        avisoCusto.textContent = "Salvando…";

        try {
            await salvarCusto({
                nome,
                categoria: document.querySelector("#custo-categoria").value.trim(),
                valor,
            });

            document.querySelector("#fin-custo-form").reset();
            await carregarPrecificacao();
            avisoCusto.textContent = "Custo acrescentado.";
        } catch (falha) {
            avisoCusto.textContent = falha.message;
            avisoCusto.classList.add("esta-errado");
        }
    });

    document.querySelector("#fin-procedimento-form").addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const nome = document.querySelector("#proc-nome").value.trim();
        const duracao = Math.round(emNumero(document.querySelector("#proc-duracao").value));

        if (!nome || duracao <= 0) {
            avisoProcedimento.textContent = "Escreva o nome e a duração em minutos.";
            avisoProcedimento.classList.add("esta-errado");
            return;
        }

        avisoProcedimento.classList.remove("esta-errado");
        avisoProcedimento.textContent = "Salvando…";

        try {
            await salvarProcedimento({
                nome,
                duracao,
                preco: emCentavos(document.querySelector("#proc-preco").value),
            });

            document.querySelector("#fin-procedimento-form").reset();
            await carregarPrecificacao();
            avisoProcedimento.textContent = "Procedimento no catálogo. Ele já vale no orçamento.";
        } catch (falha) {
            avisoProcedimento.textContent = falha.message;
            avisoProcedimento.classList.add("esta-errado");
        }
    });

    /* RENTABILIDADE */

    const modeloRentavel = document.querySelector("#modelo-rentavel");
    const listaRentavel = document.querySelector("#rent-lista");
    const vazioRentavel = document.querySelector("#rent-vazio");
    const totalRentavel = document.querySelector("#rent-total");

    const montarRentabilidade = (relatorio) => {
        listaRentavel.textContent = "";

        /* A ordem da tela é a do ranking que a automação usa: por margem
           por hora. O faturamento maior aparece no detalhe. */
        [...relatorio.procedimentos]
            .sort((um, outro) => outro.margemPorHora - um.margemPorHora)
            .forEach((procedimento) => {
                const item = modeloRentavel.content.firstElementChild.cloneNode(true);

                item.querySelector(".rentavel__nome").textContent = procedimento.nome;
                item.querySelector(".rentavel__detalhe").textContent = [
                    procedimento.vezes + (procedimento.vezes === 1 ? " vez" : " vezes"),
                    "recebido " + emDinheiro(procedimento.receita),
                    "custo " + emDinheiro(procedimento.custo),
                    procedimento.horasOcupadas + "h de cadeira",
                ].join("  ·  ");

                const hora = item.querySelector(".rentavel__hora");

                hora.textContent = emDinheiro(procedimento.margemPorHora) + " por hora";
                hora.classList.toggle("esta-no-vermelho", procedimento.margem <= 0);

                item.querySelector(".rentavel__margem").textContent =
                    "margem " + emDinheiro(procedimento.margem) +
                    (procedimento.margemPercentual === null
                        ? ""
                        : "  ·  " + comoPercentual(procedimento.margemPercentual));

                listaRentavel.appendChild(item);
            });

        vazioRentavel.hidden = relatorio.procedimentos.length > 0;

        totalRentavel.textContent = relatorio.procedimentos.length
            ? "Recebido " +
              emDinheiro(relatorio.total.receita) +
              "  ·  custo " +
              emDinheiro(relatorio.total.custo) +
              "  ·  margem " +
              emDinheiro(relatorio.total.margem)
            : "";
    };



    const carregarRentabilidade = async () => {
        const de = document.querySelector("#rent-de").value;
        const ate = document.querySelector("#rent-ate").value;

        montarRentabilidade(await rentabilidade({ de, ate }));
    };

    document.querySelector("#rent-ver").addEventListener("click", async () => {
        avisar("");

        try {
            await carregarRentabilidade();
        } catch (falha) {
            avisar(falha.message);
        }
    });

    /* O PAINEL

       A visão de cima: conversão, crescimento, procura, valor bruto e
       retorno. Os números vêm prontos do servidor (a mesma rota que o
       agente financeiro lê); aqui só se desenha.

       Barras de uma cor só, porque cada lista é uma série só. A cor fica
       na barra e nas setas; número é sempre cor de texto. As cores foram
       conferidas com o validador da skill de visualização contra o azul
       dos cards, e estão no financeiro.css. */

    const blocoDoPainel = document.querySelector("#fin-painel-painel");
    const painelDe = document.querySelector("#pai-de");
    const painelAte = document.querySelector("#pai-ate");
    const modeloRanking = document.querySelector("#modelo-ranking");
    const modeloEtapa = document.querySelector("#modelo-etapa");

    const NUMERO = new Intl.NumberFormat("pt-BR");

    const comoTaxa = (valor) =>
        valor === null || valor === undefined ? "" : String(valor).replace(".", ",") + "%";

    /* Cada linha tem nome, valor em texto e a barra. A dica aparece no
       hover e no foco do teclado, e só acrescenta: o valor principal já
       está escrito na linha. */
    const montarRanking = (seletor, linhas, { medida, legenda, dica }) => {
        const lista = document.querySelector(seletor);
        const vazio = lista.parentElement.querySelector(".painel__vazio");
        const maior = Math.max(1, ...linhas.map(medida));

        lista.textContent = "";

        linhas.forEach((linha) => {
            const item = modeloRanking.content.firstElementChild.cloneNode(true);

            item.querySelector(".ranking__nome").textContent = linha.nome;
            item.querySelector(".ranking__valor").textContent = legenda(linha);
            item.style.setProperty("--parte", ((medida(linha) / maior) * 100).toFixed(1) + "%");
            item.dataset.dica = dica(linha);
            item.setAttribute("aria-label", linha.nome + ": " + legenda(linha) + ". " + dica(linha));

            lista.appendChild(item);
        });

        vazio.hidden = linhas.length > 0;
    };

    /* O funil: as três etapas, da avaliação ao tratamento, cada uma na
       proporção da primeira. A cor escurece para clarear etapa a etapa: a
       última, a que importa, é a mais forte. */
    const montarFunil = (conversao) => {
        const destino = document.querySelector("#pai-funil");
        const etapas = [
            ["Avaliações", conversao.avaliacoes],
            ["Compareceram", conversao.compareceram],
            ["Viraram tratamento", conversao.viraramTratamento],
        ];
        const maior = Math.max(1, conversao.avaliacoes);

        destino.textContent = "";

        etapas.forEach(([nome, valor], ordem) => {
            const item = modeloEtapa.content.firstElementChild.cloneNode(true);

            item.dataset.etapa = String(ordem);
            item.querySelector(".funil__nome").textContent = nome;
            item.querySelector(".funil__valor").textContent = NUMERO.format(valor);
            item.style.setProperty("--parte", ((valor / maior) * 100).toFixed(1) + "%");

            destino.appendChild(item);
        });

        document.querySelector("#pai-conversao").textContent =
            conversao.taxaDeConversao === null ? "sem dados" : comoTaxa(conversao.taxaDeConversao);
    };

    /* Crescimento: seta, sinal e a palavra, nunca só a cor. Verde e
       vermelho se confundem para quem tem daltonismo; a seta não. */
    const montarCrescimento = (crescimento) => {
        document.querySelectorAll("[data-crescimento]").forEach((kpi) => {
            const periodo = crescimento[kpi.dataset.crescimento];
            const numero = periodo[kpi.dataset.medida];
            const dinheiro = kpi.dataset.medida === "receita";
            const formatar = dinheiro ? emDinheiro : (valor) => NUMERO.format(valor);
            const semanal = kpi.dataset.crescimento === "semanal";

            let direcao = "sem-base";

            if (numero.taxa !== null) {
                direcao = numero.taxa > 0 ? "alta" : numero.taxa < 0 ? "queda" : "estavel";
            }

            const SETAS = { alta: "▲", queda: "▼", estavel: "■", "sem-base": "" };
            const PALAVRAS = {
                alta: "+" + comoTaxa(numero.taxa) + " alta",
                queda: "−" + comoTaxa(Math.abs(numero.taxa ?? 0)) + " queda",
                estavel: "0% estável",
                "sem-base": "sem base de comparação",
            };

            kpi.dataset.direcao = direcao;
            kpi.querySelector(".kpi__valor").textContent = formatar(numero.atual);
            kpi.querySelector(".kpi__seta").textContent = SETAS[direcao];
            kpi.querySelector(".kpi__variacao").textContent = PALAVRAS[direcao];
            kpi.querySelector(".kpi__ajuda").textContent =
                "vs. " +
                formatar(numero.anterior) +
                (semanal ? " na semana anterior" : " no mês anterior") +
                ", até o mesmo dia";
        });
    };

    const carregarPainel = async () => {
        blocoDoPainel.classList.add("esta-carregando");

        try {
            const dados = await painel({ de: painelDe.value, ate: painelAte.value });

            montarFunil(dados.conversao);
            montarCrescimento(dados.crescimento);

            montarRanking(
                "#pai-procurados",
                dados.maisProcurados.map((linha) => ({ ...linha, nome: linha.procedimento })),
                {
                    medida: (linha) => linha.orcado,
                    legenda: (linha) => linha.orcado + (linha.orcado === 1 ? " orçamento" : " orçamentos"),
                    dica: (linha) =>
                        linha.aceito +
                        " aceito" +
                        (linha.aceito === 1 ? "" : "s") +
                        (linha.orcado ? " (" + comoTaxa(Math.round((linha.aceito / linha.orcado) * 1000) / 10) + ")" : ""),
                },
            );

            montarRanking(
                "#pai-bruto",
                dados.valorBrutoPorProcedimento.map((linha) => ({ ...linha, nome: linha.procedimento })),
                {
                    medida: (linha) => linha.valorBruto,
                    legenda: (linha) => emDinheiro(linha.valorBruto),
                    dica: (linha) => linha.aceito + (linha.aceito === 1 ? " orçamento aceito" : " orçamentos aceitos"),
                },
            );

            montarRanking("#pai-pacientes", dados.pacientesComMaiorRetorno, {
                medida: (linha) => linha.recebido,
                legenda: (linha) => emDinheiro(linha.recebido),
                dica: (linha) =>
                    linha.pagamentos +
                    (linha.pagamentos === 1 ? " pagamento" : " pagamentos") +
                    ", média de " +
                    emDinheiro(Math.round(linha.recebido / Math.max(1, linha.pagamentos))),
            });
        } finally {
            blocoDoPainel.classList.remove("esta-carregando");
        }
    };

    document.querySelector("#pai-ver").addEventListener("click", async () => {
        avisar("");

        try {
            await carregarPainel();
        } catch (falha) {
            avisar(falha.message);
        }
    });

    abas.querySelectorAll(".fin__aba").forEach((aba) => {
        aba.addEventListener("click", async () => {
            mostrarPainel(aba.dataset.painel);

            avisar("");

            try {
                if (aba.dataset.painel === "painel") {
                    await carregarPainel();
                }

                if (aba.dataset.painel === "precificacao") {
                    await carregarPrecificacao();
                }

                if (aba.dataset.painel === "rentabilidade") {
                    await carregarRentabilidade();
                }
            } catch (falha) {
                avisar(falha.message);
            }
        });
    });

    const carregarTudo = async () => {
        avisar("");

        try {
            await carregarLista();

            if (permitido(VER)) {
                montarBalanco(await balanco());
                montarAbertos(await emAberto());
            }

            if (permitido(TAXAS)) {
                montarTaxas(await taxas());
            }
        } catch (falha) {
            avisar(falha.message);
        }
    };

    if (permitido(VER)) {
        balancoNaTela.hidden = false;
        notaDoLiquido.hidden = false;
        filtro.hidden = false;
        abertos.hidden = false;

        de.value = hoje();
        ate.value = hoje();

        document.querySelector("#fin-filtrar").addEventListener("click", async () => {
            avisar("");

            try {
                await carregarLista();
            } catch (falha) {
                avisar(falha.message);
            }
        });
    }

    if (permitido(TAXAS)) {
        blocoDeTaxas.hidden = false;
        mostrarFaixa();
    }

    const comPrecificacao = permitido(PRECIFICAR);
    const comRentabilidade = permitido(RENTABILIDADE);

    const comPainel = permitido(VER);

    abas.querySelector('[data-painel="painel"]').hidden = !comPainel;
    abas.querySelector('[data-painel="precificacao"]').hidden = !comPrecificacao;
    abas.querySelector('[data-painel="rentabilidade"]').hidden = !comRentabilidade;
    abas.hidden = !comPainel && !comPrecificacao && !comRentabilidade;

    if (comRentabilidade) {
        document.querySelector("#rent-ate").value = hoje();
    }

    carregarTudo();

    /* Quem vê o financeiro inteiro abre direto no painel. A secretária,
       que só tem o caixa do dia, continua abrindo no caixa. */
    if (comPainel) {
        painelDe.value = hoje().slice(0, 8) + "01";
        painelAte.value = hoje();

        mostrarPainel("painel");

        carregarPainel().catch((falha) => avisar(falha.message));
    }
};

/* Chamado pelo main.js, que descobre a página pelo data-pagina do body. */
export const init = () =>
    exigirSessao().then((sessao) => {
        if (sessao) {
            initFinanceiro(sessao);
        }
    });
