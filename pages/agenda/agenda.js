import { exigirSessao } from "../../src/services/guarda.js";
import { sair } from "../../src/services/sessao.js";
import { IDENTIFICACAO, ROTULOS, SAUDE } from "../../src/services/agendamento.js";
import {
    agendaDoDia,
    converterEmCliente,
    fichaDe,
    salvarParecer,
} from "../../src/services/atendimento.js";
import { MAPA, emOrdem, nomeDoDente } from "../../src/services/odontograma.js";
import { AGENDA, ESTAGIOS } from "../../src/core/config.js";

const MOEDA = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

const EXTENSO = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
});

const CONSENTIMENTOS = {
    veracidade: "Confirmou a veracidade das informações",
    dados: "Autorizou o uso dos dados para agendar",
    imagem: "Autorizou registro fotográfico",
    marketing: "Aceita receber campanhas",
};

const emIso = (data) =>
    [
        data.getFullYear(),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getDate()).padStart(2, "0"),
    ].join("-");

const deIso = (iso) => {
    const [ano, mes, dia] = iso.split("-").map(Number);

    return new Date(ano, mes - 1, dia);
};

const emReais = (centavos) => MOEDA.format(centavos / 100);

const emCentavos = (escrito) => {
    const limpo = String(escrito)
        .replace(/[^\d,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".");

    const numero = Number.parseFloat(limpo);

    return Number.isFinite(numero) ? Math.round(numero * 100) : 0;
};

const criar = (etiqueta, classe, texto) => {
    const no = document.createElement(etiqueta);

    if (classe) {
        no.className = classe;
    }

    if (texto !== undefined) {
        no.textContent = texto;
    }

    return no;
};

const bloco = (titulo, pares) => {
    if (!pares.length) {
        return null;
    }

    const secao = criar("section", "dados");

    secao.appendChild(criar("h3", "dados__titulo", titulo));

    const lista = criar("dl", "dados__lista");

    pares.forEach(([rotulo, valor]) => {
        lista.appendChild(criar("dt", "dados__rotulo", rotulo));
        lista.appendChild(criar("dd", "dados__valor", valor));
    });

    secao.appendChild(lista);

    return secao;
};

const paresDe = (fonte, campos) =>
    campos
        .filter((campo) => fonte && fonte[campo])
        .map((campo) => [ROTULOS[campo], fonte[campo]]);

const montarFicha = (destino, registro) => {
    destino.textContent = "";

    const identificacao = paresDe(registro.paciente, IDENTIFICACAO);
    const saude = paresDe(registro.saude, SAUDE);

    const preferencia = [];
    const escolhida = registro.preferencia || {};

    if (escolhida.data) {
        preferencia.push(["Data preferida", EXTENSO.format(deIso(escolhida.data))]);
    }

    if (escolhida.janela) {
        const janela = AGENDA.janela.find(({ valor }) => valor === escolhida.janela);

        preferencia.push(["Turno", janela ? janela.rotulo : escolhida.janela]);
    }

    const consentimento = Object.keys(CONSENTIMENTOS)
        .filter((chave) => registro.consentimento)
        .map((chave) => [
            CONSENTIMENTOS[chave],
            registro.consentimento[chave] ? "Sim" : "Não",
        ]);

    [
        bloco("Identificação", identificacao),
        bloco("Preferência de horário", preferencia),
        bloco("Saúde", saude),
        bloco(
            "Observações",
            registro.observacoes ? [["Relato do paciente", registro.observacoes]] : [],
        ),
        bloco("Consentimento", consentimento),
    ]
        .filter(Boolean)
        .forEach((secao) => destino.appendChild(secao));
};

const montarOdontograma = (destino, marcados, aoMudar) => {
    destino.querySelectorAll(".odonto__dente").forEach((antigo) => antigo.remove());

    const modelo = document.querySelector("#modelo-dente");

    MAPA.arcadas.forEach((arcada) => {
        arcada.dentes.forEach(({ numero, esquerda, largura }) => {
            const dente = modelo.content.firstElementChild.cloneNode(true);

            dente.dataset.dente = String(numero);
            dente.setAttribute("aria-label", nomeDoDente(numero));

            dente.style.left = esquerda + "%";
            dente.style.width = largura + "%";
            dente.style.top = arcada.topo + "%";
            dente.style.height = arcada.altura + "%";

            if (marcados.has(numero)) {
                dente.classList.add("esta-marcado");
                dente.setAttribute("aria-pressed", "true");
            }

            dente.addEventListener("click", () => {
                const ligado = !marcados.has(numero);

                if (ligado) {
                    marcados.add(numero);
                } else {
                    marcados.delete(numero);
                }

                dente.classList.toggle("esta-marcado", ligado);
                dente.setAttribute("aria-pressed", String(ligado));

                aoMudar();
            });

            destino.appendChild(dente);
        });
    });
};

const initAgenda = (sessao) => {
    const lista = document.querySelector("#agenda-lista");
    const vazio = document.querySelector("#agenda-vazio");
    const erro = document.querySelector("#agenda-erro");
    const resumo = document.querySelector("#agenda-resumo");
    const campoDia = document.querySelector("#agenda-dia");
    const extenso = document.querySelector("#agenda-extenso");

    const painel = document.querySelector("#atendimento");
    const fichaDestino = document.querySelector("#atendimento-ficha");
    const mapaDeDentes = document.querySelector("#odonto-mapa");
    const marcadosTexto = document.querySelector("#odonto-marcados");
    const areaParecer = document.querySelector("#parecer-texto");
    const itens = document.querySelector("#orcamento-itens");
    const total = document.querySelector("#orcamento-total");
    const aviso = document.querySelector("#atendimento-aviso");
    const botaoSalvar = document.querySelector("#atendimento-salvar");
    const botaoConverter = document.querySelector("#atendimento-converter");

    const modeloItem = document.querySelector("#modelo-item");
    const modeloAgendamento = document.querySelector("#modelo-agendamento");

    let dia = new Date();
    let aberto = null;
    let marcados = new Set();

    const quem = document.querySelector("#agenda-quem");

    if (quem && sessao && sessao.nome) {
        quem.textContent = sessao.nome;
    }

    const avisar = (recado) => {
        erro.textContent = recado;
        erro.hidden = !recado;
    };

    const recadoDoPainel = (recado, falhou) => {
        aviso.textContent = recado;
        aviso.classList.toggle("esta-errado", Boolean(falhou));
    };

    const somar = () => {
        const centavos = [...itens.querySelectorAll(".orcamento__valor")].reduce(
            (soma, campo) => soma + emCentavos(campo.value),
            0,
        );

        total.textContent = emReais(centavos);

        return centavos;
    };

    const linhaDeOrcamento = ({ procedimento, valor } = {}) => {
        const linha = modeloItem.content.firstElementChild.cloneNode(true);
        const nome = linha.querySelector(".orcamento__procedimento");
        const preco = linha.querySelector(".orcamento__valor");

        nome.value = procedimento || "";
        preco.value = valor ? emReais(valor).replace("R$", "").trim() : "";

        preco.addEventListener("input", somar);

        linha.querySelector(".orcamento__tirar").addEventListener("click", () => {
            linha.remove();

            if (!itens.children.length) {
                itens.appendChild(linhaDeOrcamento());
            }

            somar();
        });

        return linha;
    };

    const contarMarcados = () => {
        const numeros = emOrdem(marcados);

        marcadosTexto.textContent = numeros.length
            ? "Dentes marcados: " + numeros.join(", ")
            : "Nenhum dente marcado.";
    };

    const fechar = () => {
        painel.hidden = true;
        aberto = null;

        lista.querySelectorAll(".agenda__botao").forEach((botao) => {
            botao.classList.remove("esta-aberto");
        });
    };

    const abrir = async (registro, botao) => {
        recadoDoPainel("");

        let completo = registro;

        try {
            completo = await fichaDe(registro.id);
        } catch (falha) {
            recadoDoPainel(falha.message, true);
        }

        aberto = completo;

        lista.querySelectorAll(".agenda__botao").forEach((outro) => {
            outro.classList.toggle("esta-aberto", outro === botao);
        });

        document.querySelector("#atendimento-hora").textContent = completo.hora || "";
        document.querySelector("#atendimento-nome").textContent =
            completo.paciente.nome;

        document.querySelector("#atendimento-contato").textContent = [
            completo.paciente.telefone,
            completo.paciente.email,
        ]
            .filter(Boolean)
            .join(" · ");

        montarFicha(fichaDestino, completo);

        const parecer = completo.parecer || {};

        marcados = new Set(parecer.dentes || []);
        montarOdontograma(mapaDeDentes, marcados, contarMarcados);
        contarMarcados();

        areaParecer.value = parecer.texto || "";

        itens.textContent = "";

        const listaDeItens =
            (parecer.orcamento && parecer.orcamento.itens) || [];

        if (listaDeItens.length) {
            listaDeItens.forEach((item) => itens.appendChild(linhaDeOrcamento(item)));
        } else {
            itens.appendChild(linhaDeOrcamento());
        }

        somar();

        botaoConverter.hidden = completo.estagio === ESTAGIOS.cliente;

        painel.hidden = false;
        painel.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const desenharLista = (agendamentos) => {
        lista.textContent = "";

        agendamentos.forEach((registro) => {
            const item = modeloAgendamento.content.firstElementChild.cloneNode(true);
            const botao = item.querySelector(".agenda__botao");

            item.querySelector(".agenda__hora").textContent = registro.hora || "—";
            item.querySelector(".agenda__paciente").textContent =
                registro.paciente.nome;
            item.querySelector(".agenda__telefone").textContent =
                registro.paciente.telefone || "";

            const estagio = item.querySelector(".agenda__estagio");

            estagio.textContent =
                registro.estagio === ESTAGIOS.cliente ? "cliente" : "contato";
            estagio.dataset.estagio = registro.estagio || ESTAGIOS.contato;

            botao.addEventListener("click", () => abrir(registro, botao));

            lista.appendChild(item);
        });
    };

    const carregar = async () => {
        const iso = emIso(dia);

        campoDia.value = iso;
        extenso.textContent = EXTENSO.format(dia);

        avisar("");
        fechar();
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

    document.querySelector("#agenda-anterior").addEventListener("click", () =>
        andar(-1),
    );

    document.querySelector("#agenda-proximo").addEventListener("click", () =>
        andar(1),
    );

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

    document.querySelector("#atendimento-fechar").addEventListener("click", fechar);

    document.querySelector("#orcamento-somar").addEventListener("click", () => {
        itens.appendChild(linhaDeOrcamento());
    });

    botaoSalvar.addEventListener("click", async () => {
        if (!aberto) {
            return;
        }

        const orcamento = {
            itens: [...itens.children]
                .map((linha) => ({
                    procedimento: linha
                        .querySelector(".orcamento__procedimento")
                        .value.trim(),
                    valor: emCentavos(linha.querySelector(".orcamento__valor").value),
                }))
                .filter((item) => item.procedimento || item.valor),
            total: somar(),
        };

        botaoSalvar.disabled = true;
        recadoDoPainel("Salvando…");

        try {
            await salvarParecer(aberto.id, {
                dentes: emOrdem(marcados),
                texto: areaParecer.value.trim(),
                orcamento,
            });

            recadoDoPainel("Parecer salvo.");
        } catch (falha) {
            recadoDoPainel(falha.message, true);
        } finally {
            botaoSalvar.disabled = false;
        }
    });

    botaoConverter.addEventListener("click", async () => {
        if (!aberto) {
            return;
        }

        botaoConverter.disabled = true;
        recadoDoPainel("Convertendo…");

        try {
            await converterEmCliente(aberto.id);

            aberto.estagio = ESTAGIOS.cliente;
            botaoConverter.hidden = true;

            recadoDoPainel("Agora é cliente. O prontuário passa a valer.");

            carregar();
        } catch (falha) {
            recadoDoPainel(falha.message, true);
        } finally {
            botaoConverter.disabled = false;
        }
    });

    document.querySelector("#agenda-sair").addEventListener("click", async () => {
        await sair();

        location.replace("../login/login.html");
    });

    carregar();
};

exigirSessao().then((sessao) => {
    if (!sessao) {
        return;
    }

    initAgenda(sessao);
});
