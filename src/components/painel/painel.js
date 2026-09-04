import { IDENTIFICACAO, ROTULOS, SAUDE } from "../../services/agendamento.js";
import {
    converterEmCliente,
    emitirReceita,
    enviarTermoDeImagem,
    fichaDe,
    removerAnexo,
    salvarAnexo,
    salvarParecer,
} from "../../services/atendimento.js";
import { MAPA, emOrdem, nomeDoDente } from "../../services/odontograma.js";
import { ehImagem, emTamanhoLegivel, encolher } from "../../utils/imagem.js";
import {
    AGENDA,
    ANEXOS,
    CLINICA,
    ESTAGIOS,
    PROFISSIONAL,
    TAMANHO_MAXIMO,
} from "../../core/config.js";

const MOEDA = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

export const EXTENSO = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
});

/* O selo redondo assina o topo; o dente e a marca d'agua, o mesmo que as
   telas do sistema usam de papel timbrado. A do selo e a versao 512 e nao
   a 180: em 24mm de papel, 180px dariam 176 DPI e serrilhariam. */
const SELO = "/assets/favicon-512.png";

const AGUA = "/assets/logo-transparente-png.png";

const POR_EXTENSO_SEM_DIA = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
});

const CONSENTIMENTOS = {
    veracidade: "Confirmou a veracidade das informações",
    dados: "Autorizou o uso dos dados para agendar",
    imagem: "Autorizou registro fotográfico",
    marketing: "Aceita receber campanhas",
};

const GRUPOS = [
    {
        tipo: ANEXOS.foto,
        titulo: "Fotos da boca",
        aceita: "image/*",
        vazio: "Nenhuma foto anexada.",
    },
    {
        tipo: ANEXOS.exame,
        titulo: "Exames",
        aceita: "image/*,application/pdf,.pdf",
        vazio: "Nenhum exame anexado.",
    },
];

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

  <section class="anexos" aria-labelledby="painel-anexos">
    <h3 class="anexos__titulo" id="painel-anexos">Fotos e exames</h3>
    <p class="anexos__consentimento" hidden></p>
    <div class="anexos__termo" hidden>
      <p class="anexos__termo-texto">O paciente autorizou a divulgação das imagens. Mande o termo por e-mail explicando como elas são protegidas e como revogar.</p>
      <button class="anexos__termo-enviar" type="button">Enviar termo de imagem</button>
    </div>
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

  <section class="receita" aria-labelledby="painel-receita">
    <h3 class="receita__titulo" id="painel-receita">Receituário</h3>
    <p class="receita__ajuda">Um medicamento por linha. Ao emitir, abre a janela de impressão para assinar e entregar.</p>

    <ol class="receita__remedios"></ol>

    <button class="receita__somar" type="button">+ Adicionar medicamento</button>

    <div class="receita__acoes">
      <button class="receita__emitir" type="button">Emitir e imprimir</button>
    </div>

    <div class="receita__historico" hidden>
      <h4 class="receita__historico-titulo">Emitidos</h4>
      <ul class="receita__emitidas"></ul>
    </div>
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

const GRUPO = `
<div class="anexos__grupo">
  <div class="anexos__cabeca">
    <h4 class="anexos__subtitulo"></h4>
    <button class="anexos__somar" type="button">+ Adicionar</button>
    <input class="anexos__entrada" type="file" multiple hidden />
  </div>
  <ul class="anexos__grade"></ul>
  <p class="anexos__vazio"></p>
</div>
`;

const ANEXO = `
<li class="anexo">
  <a class="anexo__mira" target="_blank" rel="noopener noreferrer">
    <img class="anexo__miniatura" alt="" />
    <span class="anexo__icone" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
    </span>
  </a>
  <div class="anexo__dados">
    <span class="anexo__nome"></span>
    <span class="anexo__peso"></span>
  </div>
  <button class="anexo__tirar" type="button" aria-label="Remover anexo">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
  </button>
</li>
`;

const REMEDIO = `
<li class="remedio">
  <input class="remedio__nome" type="text" placeholder="Medicamento" aria-label="Medicamento" />
  <input class="remedio__forma" type="text" placeholder="Apresentação (ex.: 500 mg, comprimido)" aria-label="Apresentação" />
  <input class="remedio__quantidade" type="text" placeholder="Qtd." aria-label="Quantidade" />
  <button class="remedio__tirar" type="button" aria-label="Remover medicamento">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
  </button>
  <textarea class="remedio__posologia" rows="2" placeholder="Posologia — como tomar" aria-label="Posologia"></textarea>
</li>
`;

const EMITIDA = `
<li class="emitida">
  <span class="emitida__data"></span>
  <span class="emitida__resumo"></span>
  <button class="emitida__reimprimir" type="button">Reimprimir</button>
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

/* A folha de impressao vive fora do painel: em @media print o resto da
   pagina some e so ela e enviada para o papel. */
const acharFolha = () => {
    const existente = document.querySelector(".impressao");

    if (existente) {
        return existente;
    }

    const folha = criar("div", "impressao");

    folha.setAttribute("aria-hidden", "true");
    document.body.appendChild(folha);

    return folha;
};

const marca = (classe, endereco) => {
    const logo = document.createElement("img");

    logo.className = classe;
    logo.src = endereco;
    logo.alt = "";
    logo.setAttribute("aria-hidden", "true");

    return logo;
};

const montarReceitaImpressa = (folha, { paciente, remedios, quando }) => {
    folha.textContent = "";

    /* A marca d'agua e uma <img>, nao um background: o navegador so imprime
       fundo se a pessoa marcar "graficos de fundo" na caixa de impressao,
       mas imagem sai sempre. Fixa, ela se repete em toda pagina. */
    folha.appendChild(marca("impressao__agua", AGUA));

    const cabeca = criar("header", "impressao__topo");

    cabeca.appendChild(marca("impressao__logo", SELO));
    cabeca.appendChild(criar("p", "impressao__clinica", CLINICA.nome));
    cabeca.appendChild(criar("p", "impressao__tipo", CLINICA.tipo));

    folha.appendChild(cabeca);
    folha.appendChild(criar("h1", "impressao__titulo", "Receituário"));

    const quem = criar("p", "impressao__paciente");

    quem.appendChild(criar("strong", null, "Paciente: "));
    quem.appendChild(document.createTextNode(paciente.nome));

    folha.appendChild(quem);

    const lista = criar("ol", "impressao__remedios");

    remedios.forEach((remedio) => {
        const item = criar("li", "impressao__remedio");
        const linha = criar("p", "impressao__remedio-nome");

        linha.appendChild(criar("strong", null, remedio.nome));

        if (remedio.forma) {
            linha.appendChild(document.createTextNode(" — " + remedio.forma));
        }

        if (remedio.quantidade) {
            linha.appendChild(
                criar("span", "impressao__quantidade", "  " + remedio.quantidade),
            );
        }

        item.appendChild(linha);

        if (remedio.posologia) {
            item.appendChild(criar("p", "impressao__posologia", remedio.posologia));
        }

        lista.appendChild(item);
    });

    folha.appendChild(lista);

    const pe = criar("footer", "impressao__pe");

    pe.appendChild(
        criar(
            "p",
            "impressao__data",
            CLINICA.cidade.split("—")[0].trim() +
                ", " +
                POR_EXTENSO_SEM_DIA.format(quando) +
                ".",
        ),
    );

    pe.appendChild(criar("p", "impressao__risco", ""));
    pe.appendChild(criar("p", "impressao__assina", PROFISSIONAL.nome));
    pe.appendChild(criar("p", "impressao__cro", PROFISSIONAL.cro));

    folha.appendChild(pe);

    const rodape = criar("footer", "impressao__rodape");

    rodape.appendChild(criar("p", "impressao__endereco", CLINICA.endereco));
    rodape.appendChild(
        criar("p", "impressao__endereco", CLINICA.cidade + " · " + CLINICA.telefone),
    );

    folha.appendChild(rodape);
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
    const anexos = achar("anexos");
    const consentimento = achar("anexos__consentimento");
    const termo = achar("anexos__termo");
    const botaoTermo = achar("anexos__termo-enviar");
    const area = achar("parecer__area");
    const itens = achar("orcamento__itens");
    const total = achar("orcamento__valor-total");
    const remedios = achar("receita__remedios");
    const historico = achar("receita__historico");
    const emitidas = achar("receita__emitidas");
    const botaoEmitir = achar("receita__emitir");
    const aviso = achar("atendimento__aviso");
    const botaoSalvar = achar("atendimento__salvar");
    const botaoConverter = achar("atendimento__converter");

    const folha = acharFolha();

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

    /* Anexos */

    const cartaoDeAnexo = (anexo, grade, vazio) => {
        const cartao = doModelo(ANEXO);
        const mira = cartao.querySelector(".anexo__mira");
        const miniatura = cartao.querySelector(".anexo__miniatura");
        const icone = cartao.querySelector(".anexo__icone");
        const endereco = anexo.url || anexo.conteudo;

        mira.href = endereco;

        if (anexo.tipo && anexo.tipo.startsWith("image/")) {
            miniatura.src = endereco;
            miniatura.alt = anexo.nome;
            icone.hidden = true;
        } else {
            miniatura.hidden = true;
        }

        cartao.querySelector(".anexo__nome").textContent = anexo.nome;
        cartao.querySelector(".anexo__peso").textContent = emTamanhoLegivel(
            anexo.tamanho,
        );

        cartao.querySelector(".anexo__tirar").addEventListener("click", async () => {
            const certeza = window.confirm(
                "Remover " + anexo.nome + "? Isso não volta atrás.",
            );

            if (!certeza) {
                return;
            }

            try {
                await removerAnexo(aberto.id, anexo.id);

                cartao.remove();
                vazio.hidden = grade.children.length > 0;
                recado("Anexo removido.");
            } catch (falha) {
                recado(falha.message, true);
            }
        });

        return cartao;
    };

    const montarAnexos = (registro) => {
        anexos.querySelectorAll(".anexos__grupo").forEach((velho) => velho.remove());

        const guardados = registro.anexos || [];

        const autorizou = Boolean(
            registro.consentimento && registro.consentimento.imagem,
        );

        consentimento.textContent = autorizou
            ? ""
            : "O paciente não autorizou a divulgação das imagens. Fotos aqui valem só como prontuário.";
        consentimento.hidden = autorizou;

        termo.hidden = !autorizou || !registro.paciente.email;

        GRUPOS.forEach(({ tipo, titulo, aceita, vazio: recadoVazio }) => {
            const grupo = doModelo(GRUPO);
            const entrada = grupo.querySelector(".anexos__entrada");
            const grade = grupo.querySelector(".anexos__grade");
            const vazio = grupo.querySelector(".anexos__vazio");

            grupo.dataset.tipo = tipo;
            grupo.querySelector(".anexos__subtitulo").textContent = titulo;
            entrada.accept = aceita;
            vazio.textContent = recadoVazio;

            guardados
                .filter((anexo) => anexo.tipo_anexo === tipo)
                .forEach((anexo) => grade.appendChild(cartaoDeAnexo(anexo, grade, vazio)));

            vazio.hidden = grade.children.length > 0;

            grupo
                .querySelector(".anexos__somar")
                .addEventListener("click", () => entrada.click());

            entrada.addEventListener("change", async () => {
                const escolhidos = [...entrada.files];

                entrada.value = "";

                for (const arquivo of escolhidos) {
                    if (arquivo.size > TAMANHO_MAXIMO) {
                        recado(
                            arquivo.name +
                                " tem " +
                                emTamanhoLegivel(arquivo.size) +
                                " e passa do limite.",
                            true,
                        );
                        continue;
                    }

                    if (tipo === ANEXOS.foto && !ehImagem(arquivo)) {
                        recado(arquivo.name + " não é uma imagem.", true);
                        continue;
                    }

                    recado("Preparando " + arquivo.name + "…");

                    try {
                        const pronto = await encolher(arquivo);
                        const salvo = await salvarAnexo(aberto.id, {
                            ...pronto,
                            tipo_anexo: tipo,
                        });

                        grade.appendChild(
                            cartaoDeAnexo({ ...pronto, ...salvo }, grade, vazio),
                        );

                        vazio.hidden = true;

                        const ganho =
                            pronto.tamanhoOriginal > pronto.tamanho
                                ? " (" +
                                  emTamanhoLegivel(pronto.tamanhoOriginal) +
                                  " → " +
                                  emTamanhoLegivel(pronto.tamanho) +
                                  ")"
                                : "";

                        recado(arquivo.name + " anexado" + ganho + ".");
                    } catch (falha) {
                        recado(falha.message, true);
                    }
                }
            });

            anexos.appendChild(grupo);
        });
    };

    /* Receituário */

    const linhaDeRemedio = (remedio = {}) => {
        const item = doModelo(REMEDIO);

        item.querySelector(".remedio__nome").value = remedio.nome || "";
        item.querySelector(".remedio__forma").value = remedio.forma || "";
        item.querySelector(".remedio__quantidade").value = remedio.quantidade || "";
        item.querySelector(".remedio__posologia").value = remedio.posologia || "";

        item.querySelector(".remedio__tirar").addEventListener("click", () => {
            item.remove();

            if (!remedios.children.length) {
                remedios.appendChild(linhaDeRemedio());
            }
        });

        return item;
    };

    const lerRemedios = () =>
        [...remedios.children]
            .map((item) => ({
                nome: item.querySelector(".remedio__nome").value.trim(),
                forma: item.querySelector(".remedio__forma").value.trim(),
                quantidade: item.querySelector(".remedio__quantidade").value.trim(),
                posologia: item.querySelector(".remedio__posologia").value.trim(),
            }))
            .filter((remedio) => remedio.nome);

    const imprimir = (receita) => {
        montarReceitaImpressa(folha, {
            paciente: aberto.paciente,
            remedios: receita.remedios,
            quando: receita.emitidoEm ? new Date(receita.emitidoEm) : new Date(),
        });

        window.print();
    };

    const cartaoEmitido = (receita) => {
        const cartao = doModelo(EMITIDA);
        const quando = new Date(receita.emitidoEm);

        cartao.querySelector(".emitida__data").textContent =
            POR_EXTENSO_SEM_DIA.format(quando);

        cartao.querySelector(".emitida__resumo").textContent = receita.remedios
            .map((remedio) => remedio.nome)
            .join(", ");

        cartao.querySelector(".emitida__reimprimir").addEventListener("click", () => {
            imprimir(receita);
        });

        return cartao;
    };

    const montarHistorico = (lista) => {
        emitidas.textContent = "";

        lista.forEach((receita) => emitidas.appendChild(cartaoEmitido(receita)));

        historico.hidden = !lista.length;
    };

    const ehCliente = () => aberto && aberto.estagio === ESTAGIOS.cliente;

    const ajustarBotoes = () => {
        const cliente = ehCliente();

        botaoConverter.hidden = cliente;
        botaoSalvar.textContent = cliente ? "Salvar" : "Salvar orçamento";
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

        montarAnexos(completo);

        area.value = parecer.texto || "";

        itens.textContent = "";

        const guardados = (parecer.orcamento && parecer.orcamento.itens) || [];

        if (guardados.length) {
            guardados.forEach((item) => itens.appendChild(linha(item)));
        } else {
            itens.appendChild(linha());
        }

        somar();

        remedios.textContent = "";
        remedios.appendChild(linhaDeRemedio());

        montarHistorico(completo.receituarios || []);

        ajustarBotoes();

        raiz.hidden = false;
        raiz.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    achar("atendimento__fechar").addEventListener("click", fechar);

    achar("orcamento__somar").addEventListener("click", () => {
        itens.appendChild(linha());
    });

    botaoTermo.addEventListener("click", async () => {
        if (!aberto) {
            return;
        }

        botaoTermo.disabled = true;

        try {
            const saida = await enviarTermoDeImagem(aberto);

            recado(
                saida.canal === "mailto"
                    ? "Termo aberto no seu e-mail. Confira e envie."
                    : "Termo de imagem enviado para " + aberto.paciente.email + ".",
            );
        } catch (falha) {
            recado(falha.message, true);
        } finally {
            botaoTermo.disabled = false;
        }
    });

    achar("receita__somar").addEventListener("click", () => {
        remedios.appendChild(linhaDeRemedio());
    });

    botaoEmitir.addEventListener("click", async () => {
        if (!aberto) {
            return;
        }

        const lista = lerRemedios();

        if (!lista.length) {
            recado("Escreva ao menos um medicamento para emitir.", true);
            return;
        }

        botaoEmitir.disabled = true;
        recado("Emitindo…");

        const receita = { remedios: lista, emitidoEm: new Date().toISOString() };

        try {
            const salva = await emitirReceita(aberto.id, receita);
            const guardada = { ...receita, ...salva };

            aberto.receituarios = [guardada, ...(aberto.receituarios || [])];

            montarHistorico(aberto.receituarios);

            remedios.textContent = "";
            remedios.appendChild(linhaDeRemedio());

            recado("Receituário emitido.");

            imprimir(guardada);
        } catch (falha) {
            recado(falha.message, true);
        } finally {
            botaoEmitir.disabled = false;
        }
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

            recado(ehCliente() ? "Salvo." : "Orçamento salvo.");
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
            ajustarBotoes();

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
