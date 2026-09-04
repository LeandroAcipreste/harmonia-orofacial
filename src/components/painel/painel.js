import {
    IDENTIFICACAO,
    ROTULOS,
    SAUDE,
} from "../../services/agendamento.js";
import {
    converterEmCliente,
    fichaDe,
    salvarParecer,
} from "../../services/atendimento.js";
import { MAPA, emOrdem, nomeDoDente } from "../../services/odontograma.js";
import { AGENDA, ESTAGIOS } from "../../core/config.js";

const MOEDA = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

export const EXTENSO = new Intl.DateTimeFormat("pt-BR", {
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

export const emReais = (centavos) => MOEDA.format(centavos / 100);

export const emCentavos = (escrito) => {
    const limpo = String(escrito)
        .replace(/[^\d,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".");

    const numero = Number.parseFloat(limpo);

    return Number.isFinite(numero) ? Math.round(numero * 100) : 0;
};

export const deIso = (iso) => {
    const [ano, mes, dia] = iso.split("-").map(Number);

    return new Date(ano, mes - 1, dia);
};

export const emIso = (data) =>
    [
        data.getFullYear(),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getDate()).padStart(2, "0"),
    ].join("-");

export const criar = (etiqueta, classe, texto) => {
    const no = document.createElement(etiqueta);

    if (classe) {
        no.className = classe;
    }

    if (texto !== undefined) {
        no.textContent = texto;
    }

    return no;
};

const MARCACAO = `
<section class="atendimento" hidden aria-labelledby="painel-nome">

  <header class="atendimento__topo">
    <div>
      <p class="atendimento__hora"></p>
      <h2 class="atendimento__nome serif" id="painel-nome"></h2>
      <p class="atendimento__contato"></p>
    </div>

    <button class="atendimento__fechar" type="button" aria-label="Fechar ficha">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
    </button>
  </header>

  <div class="atendimento__ficha"></div>

  <section class="odonto" aria-labelledby="painel-odonto">
    <h3 class="odonto__titulo" id="painel-odonto">Odontograma</h3>
    <p class="odonto__ajuda">Toque nos dentes envolvidos no caso para marcá-los.</p>

    <div class="odonto__rolagem">
      <div class="odonto__mapa">
        <img class="odonto__imagem" src="/assets/dentes.png" loading="lazy" decoding="async" alt="Odontograma com os 32 dentes permanentes, numerados pela notação FDI" width="2066" height="761" />
      </div>
    </div>

    <p class="odonto__marcados" role="status">Nenhum dente marcado.</p>
  </section>

  <section class="parecer" aria-labelledby="painel-parecer">
    <h3 class="parecer__titulo" id="painel-parecer">Sobre o caso</h3>
    <label class="parecer__rotulo" for="painel-texto">Avaliação da Dra. Célia</label>
    <textarea class="parecer__area" id="painel-texto" rows="7" placeholder="Diagnóstico, plano de tratamento, observações clínicas."></textarea>
  </section>

  <section class="orcamento" aria-labelledby="painel-orcamento">
    <h3 class="orcamento__titulo" id="painel-orcamento">Orçamento</h3>

    <ol class="orcamento__itens"></ol>

    <button class="orcamento__somar" type="button">+ Adicionar procedimento</button>

    <p class="orcamento__total">
      <span>Total</span>
      <strong class="orcamento__valor-total">R$ 0,00</strong>
    </p>
  </section>

  <footer class="atendimento__acoes">
    <p class="atendimento__aviso" role="status"></p>

    <div class="atendimento__botoes">
      <button class="atendimento__converter" type="button">Compareceu — virar cliente</button>
      <button class="atendimento__salvar" type="button">Salvar orçamento</button>
    </div>
  </footer>

</section>
`;

const DENTE = `
<button class="odonto__dente" type="button" aria-pressed="false">
  <span class="odonto__check" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7" /></svg>
  </span>
</button>
`;

const ITEM = `
<li class="orcamento__item">
  <input class="orcamento__procedimento" type="text" placeholder="Procedimento" aria-label="Procedimento" />
  <input class="orcamento__valor" type="text" inputmode="decimal" placeholder="0,00" aria-label="Valor em reais" />
  <button class="orcamento__tirar" type="button" aria-label="Remover procedimento">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
  </button>
</li>
`;

const doModelo = (marcacao) => {
    const molde = document.createElement("template");

    molde.innerHTML = marcacao.trim();

    return molde.content.firstElementChild;
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

    const preferencia = [];
    const escolhida = registro.preferencia || {};

    if (escolhida.data) {
        preferencia.push(["Data preferida", EXTENSO.format(deIso(escolhida.data))]);
    }

    if (escolhida.janela) {
        const janela = AGENDA.janela.find(({ valor }) => valor === escolhida.janela);

        preferencia.push(["Turno", janela ? janela.rotulo : escolhida.janela]);
    }

    const consentimento = registro.consentimento
        ? Object.keys(CONSENTIMENTOS).map((chave) => [
              CONSENTIMENTOS[chave],
              registro.consentimento[chave] ? "Sim" : "Não",
          ])
        : [];

    [
        bloco("Identificação", paresDe(registro.paciente, IDENTIFICACAO)),
        bloco("Preferência de horário", preferencia),
        bloco("Saúde", paresDe(registro.saude, SAUDE)),
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

    MAPA.arcadas.forEach((arcada) => {
        arcada.dentes.forEach(({ numero, esquerda, largura }) => {
            const dente = doModelo(DENTE);

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

export const criarPainel = ({ hospedeiro, aoFechar, aoConverter }) => {
    hospedeiro.appendChild(doModelo(MARCACAO));

    const raiz = hospedeiro.querySelector(".atendimento");
    const achar = (classe) => raiz.querySelector("." + classe);

    const hora = achar("atendimento__hora");
    const nome = achar("atendimento__nome");
    const contato = achar("atendimento__contato");
    const ficha = achar("atendimento__ficha");
    const mapa = achar("odonto__mapa");
    const marcadosTexto = achar("odonto__marcados");
    const area = achar("parecer__area");
    const itens = achar("orcamento__itens");
    const total = achar("orcamento__valor-total");
    const aviso = achar("atendimento__aviso");
    const botaoSalvar = achar("atendimento__salvar");
    const botaoConverter = achar("atendimento__converter");

    let aberto = null;
    let marcados = new Set();

    const recado = (texto, falhou) => {
        aviso.textContent = texto;
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

    const linha = ({ procedimento, valor } = {}) => {
        const item = doModelo(ITEM);
        const preco = item.querySelector(".orcamento__valor");

        item.querySelector(".orcamento__procedimento").value = procedimento || "";
        preco.value = valor ? emReais(valor).replace("R$", "").trim() : "";

        preco.addEventListener("input", somar);

        item.querySelector(".orcamento__tirar").addEventListener("click", () => {
            item.remove();

            if (!itens.children.length) {
                itens.appendChild(linha());
            }

            somar();
        });

        return item;
    };

    const contarMarcados = () => {
        const numeros = emOrdem(marcados);

        marcadosTexto.textContent = numeros.length
            ? "Dentes marcados: " + numeros.join(", ")
            : "Nenhum dente marcado.";
    };

    const fechar = () => {
        raiz.hidden = true;
        aberto = null;

        if (typeof aoFechar === "function") {
            aoFechar();
        }
    };

    const abrir = async (registro) => {
        recado("");

        let completo = registro;

        try {
            completo = await fichaDe(registro.id);
        } catch (falha) {
            recado(falha.message, true);
        }

        aberto = completo;

        hora.textContent = completo.hora || "";
        hora.hidden = !completo.hora;
        nome.textContent = completo.paciente.nome;

        contato.textContent = [completo.paciente.telefone, completo.paciente.email]
            .filter(Boolean)
            .join(" · ");

        montarFicha(ficha, completo);

        const parecer = completo.parecer || {};

        marcados = new Set(parecer.dentes || []);
        montarOdontograma(mapa, marcados, contarMarcados);
        contarMarcados();

        area.value = parecer.texto || "";

        itens.textContent = "";

        const guardados = (parecer.orcamento && parecer.orcamento.itens) || [];

        if (guardados.length) {
            guardados.forEach((item) => itens.appendChild(linha(item)));
        } else {
            itens.appendChild(linha());
        }

        somar();

        botaoConverter.hidden = completo.estagio === ESTAGIOS.cliente;

        raiz.hidden = false;
        raiz.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    achar("atendimento__fechar").addEventListener("click", fechar);

    achar("orcamento__somar").addEventListener("click", () => {
        itens.appendChild(linha());
    });

    botaoSalvar.addEventListener("click", async () => {
        if (!aberto) {
            return;
        }

        const orcamento = {
            itens: [...itens.children]
                .map((item) => ({
                    procedimento: item
                        .querySelector(".orcamento__procedimento")
                        .value.trim(),
                    valor: emCentavos(item.querySelector(".orcamento__valor").value),
                }))
                .filter((item) => item.procedimento || item.valor),
            total: somar(),
        };

        botaoSalvar.disabled = true;
        recado("Salvando…");

        try {
            await salvarParecer(aberto.id, {
                dentes: emOrdem(marcados),
                texto: area.value.trim(),
                orcamento,
            });

            recado("Orçamento salvo.");
        } catch (falha) {
            recado(falha.message, true);
        } finally {
            botaoSalvar.disabled = false;
        }
    });

    botaoConverter.addEventListener("click", async () => {
        if (!aberto) {
            return;
        }

        botaoConverter.disabled = true;
        recado("Convertendo…");

        try {
            await converterEmCliente(aberto.id);

            aberto.estagio = ESTAGIOS.cliente;
            botaoConverter.hidden = true;

            recado("Agora é cliente. O prontuário passa a valer.");

            if (typeof aoConverter === "function") {
                aoConverter(aberto);
            }
        } catch (falha) {
            recado(falha.message, true);
        } finally {
            botaoConverter.disabled = false;
        }
    });

    return { abrir, fechar, elemento: raiz };
};
