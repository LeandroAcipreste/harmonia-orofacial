import { IDENTIFICACAO, ROTULOS, SAUDE } from "../../services/agendamento.js";
import {
    converterEmCliente,
    emitirReceita,
    emitirRequisicao,
    enviarTermoDeImagem,
    fichaDe,
    removerAnexo,
    salvarAnexo,
    salvarParecer,
} from "../../services/atendimento.js";
import { MAPA, emOrdem, nomeDoDente } from "../../services/odontograma.js";
import {
    BLOCOS,
    LABORATORIOS,
    laboratorioDe,
    pedidosDe,
    resumoDe,
} from "../../services/requisicao.js";
import {
    FORMAS,
    PARCELAS_MAXIMAS,
    emCentavos as emCentavosDoPagamento,
    emDinheiro,
    registrarPagamento,
    rotuloDaForma,
} from "../../services/financeiro.js";
import { catalogo } from "../../services/precificacao.js";
import {
    comoQuantidade,
    consumirNoAtendimento,
    emQuantidade,
    insumos as listarInsumos,
} from "../../services/inventario.js";
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

const EM_DATA = new Intl.DateTimeFormat("pt-BR");

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

  <section class="requisicao" aria-labelledby="painel-requisicao">
    <h3 class="requisicao__titulo" id="painel-requisicao">Requisição de exames</h3>
    <p class="requisicao__ajuda">Para o paciente levar à clínica de imagem. Sai em papel timbrado, para assinar na entrega.</p>

    <button class="requisicao__abrir" type="button">Solicitar exame</button>

    <div class="requisicao__historico" hidden>
      <h4 class="requisicao__historico-titulo">Emitidas</h4>
      <ul class="requisicao__emitidas"></ul>
    </div>
  </section>

  <datalist id="catalogo-de-procedimentos"></datalist>

  <section class="conta" aria-labelledby="painel-conta" hidden>
    <h3 class="conta__titulo" id="painel-conta">Pagamentos</h3>

    <div class="conta__resumo">
      <p class="conta__caixa">
        <span class="conta__rotulo">Combinado</span>
        <strong class="conta__valor" data-conta="total">R$ 0,00</strong>
      </p>
      <p class="conta__caixa">
        <span class="conta__rotulo">Recebido</span>
        <strong class="conta__valor" data-conta="recebido">R$ 0,00</strong>
      </p>
      <p class="conta__caixa conta__caixa--saldo">
        <span class="conta__rotulo">Em aberto</span>
        <strong class="conta__valor" data-conta="saldo">R$ 0,00</strong>
      </p>
    </div>

    <form class="conta__forma" hidden>
      <label class="conta__campo">
        <span class="conta__campo-rotulo">Valor</span>
        <input class="conta__entrada conta__valor-campo" type="text" inputmode="decimal" placeholder="0,00" />
      </label>

      <label class="conta__campo">
        <span class="conta__campo-rotulo">Forma</span>
        <select class="conta__entrada conta__meio"></select>
      </label>

      <label class="conta__campo conta__campo--parcelas" hidden>
        <span class="conta__campo-rotulo">Parcelas</span>
        <select class="conta__entrada conta__parcelas"></select>
      </label>

      <label class="conta__campo conta__campo--largo">
        <span class="conta__campo-rotulo">Observação</span>
        <input class="conta__entrada conta__observacao" type="text" placeholder="Opcional." />
      </label>

      <button class="conta__registrar" type="submit">Registrar pagamento</button>
    </form>

    <ul class="conta__pagamentos"></ul>
  </section>

  <section class="insumos-usados" aria-labelledby="painel-insumos" hidden>
    <h3 class="insumos-usados__titulo" id="painel-insumos">Insumos usados</h3>
    <p class="insumos-usados__ajuda">
      O que saiu da prateleira neste atendimento. Sai do estoque na hora, e é
      isso que faz a lista de compras parar de ser chute.
    </p>

    <ul class="insumos-usados__lancados"></ul>

    <div class="insumos-usados__form" hidden>
      <ul class="insumos-usados__linhas"></ul>

      <button class="insumos-usados__somar" type="button">+ Adicionar insumo</button>

      <div class="insumos-usados__acoes">
        <button class="insumos-usados__lancar" type="button">Lançar consumo</button>
      </div>
    </div>
  </section>

  <footer class="atendimento__acoes">
    <p class="atendimento__aviso" role="status"></p>

    <div class="atendimento__botoes">
      <button class="atendimento__converter" type="button">Orçamento aprovado · tornar paciente</button>
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
  <input class="orcamento__procedimento" type="text" placeholder="Procedimento" aria-label="Procedimento" list="catalogo-de-procedimentos" />
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
  <textarea class="remedio__posologia" rows="2" placeholder="Posologia · como tomar" aria-label="Posologia"></textarea>
</li>
`;

/* O modal é um <dialog> de verdade: o navegador já sabe empilhar em cima de
   tudo, fechar no Esc e prender o foco dentro. Nada disso precisa de código
   nosso, e um <div> com position: fixed precisaria dos três. */
const PEDIDO = `
<dialog class="pedido" aria-labelledby="pedido-titulo">

  <header class="pedido__topo">
    <div>
      <h3 class="pedido__titulo" id="pedido-titulo">Solicitar exame</h3>
      <p class="pedido__paciente"></p>
    </div>
    <button class="pedido__fechar" type="button" aria-label="Fechar">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
    </button>
  </header>

  <div class="pedido__corpo">
    <label class="pedido__campo">
      <span class="pedido__rotulo">Clínica de imagem</span>
      <select class="pedido__laboratorio"></select>
    </label>

    <p class="pedido__dentes"></p>

    <div class="pedido__blocos"></div>

    <label class="pedido__campo">
      <span class="pedido__rotulo">Observação para a clínica de imagem</span>
      <textarea class="pedido__observacao" rows="2" placeholder="O que quem vai fazer o exame precisa saber."></textarea>
    </label>
  </div>

  <footer class="pedido__acoes">
    <p class="pedido__aviso" role="status"></p>
    <button class="pedido__cancelar" type="button">Cancelar</button>
    <button class="pedido__emitir" type="button">Emitir e imprimir</button>
  </footer>

</dialog>
`;

const BLOCO_PEDIDO = `
<details class="pedido__bloco">
  <summary class="pedido__bloco-topo">
    <span class="pedido__bloco-nome"></span>
    <span class="pedido__bloco-conta"></span>
  </summary>
  <div class="pedido__opcoes"></div>
</details>
`;

const CAIXA_PEDIDO = `
<label class="pedido__opcao">
  <input class="pedido__caixa" type="checkbox" />
  <span class="pedido__opcao-texto">
    <span class="pedido__opcao-rotulo"></span>
    <span class="pedido__opcao-nota"></span>
  </span>
</label>
`;

const LINHA_PEDIDO = `
<label class="pedido__opcao pedido__opcao--escrita">
  <span class="pedido__opcao-rotulo"></span>
  <input class="pedido__linha" type="text" />
</label>
`;

const PAGAMENTO = `
<li class="pagamento">
  <span class="pagamento__meio"></span>
  <span class="pagamento__valor"></span>
</li>
`;

const INSUMO_USADO = `
<li class="insumo-usado">
  <span class="insumo-usado__nome"></span>
  <span class="insumo-usado__quantidade"></span>
</li>
`;

const LINHA_DE_INSUMO = `
<li class="linha-insumo">
  <select class="linha-insumo__qual" aria-label="Insumo"></select>
  <input class="linha-insumo__quanto" type="text" inputmode="decimal" placeholder="Qtd." aria-label="Quantidade" />
  <button class="linha-insumo__tirar" type="button" aria-label="Remover insumo">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
  </button>
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
            linha.appendChild(document.createTextNode(" · " + remedio.forma));
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
            CLINICA.municipio +
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

/* A folha e da Harmonia, nao da clinica de imagem: papel timbrado daqui, o
   pedido escrito por extenso e a clinica indicada como destinataria. O bloco
   de papel da OralBook fica sendo o que sempre foi, papel deles. */
const montarRequisicaoImpressa = (folha, { paciente, requisicao, quando }) => {
    folha.textContent = "";

    folha.appendChild(marca("impressao__agua", AGUA));

    const cabeca = criar("header", "impressao__topo");

    cabeca.appendChild(marca("impressao__logo", SELO));
    cabeca.appendChild(criar("p", "impressao__clinica", CLINICA.nome));
    cabeca.appendChild(criar("p", "impressao__tipo", CLINICA.tipo));

    folha.appendChild(cabeca);
    folha.appendChild(criar("h1", "impressao__titulo", "Requisição de exames"));

    const quem = criar("p", "impressao__paciente");

    quem.appendChild(criar("strong", null, "Paciente: "));
    quem.appendChild(document.createTextNode(paciente.nome));

    if (paciente.nascimento) {
        quem.appendChild(
            criar(
                "span",
                "impressao__quantidade",
                "Nascimento: " + EM_DATA.format(deIso(paciente.nascimento)),
            ),
        );
    }

    folha.appendChild(quem);

    const dentes = requisicao.dentes || [];

    if (dentes.length) {
        folha.appendChild(
            criar("p", "impressao__dentes", "Dentes assinalados: " + dentes.join(", ")),
        );
    }

    pedidosDe(requisicao).forEach(({ titulo, itens }) => {
        const secao = criar("section", "impressao__grupo");

        secao.appendChild(criar("h2", "impressao__grupo-titulo", titulo));

        const lista = criar("ul", "impressao__itens");

        itens.forEach((item) => {
            const linha = criar("li", "impressao__item");

            linha.appendChild(
                document.createTextNode(
                    item.rotulo + (item.valor ? ": " + item.valor : ""),
                ),
            );

            const nota = item.dentes && dentes.length ? "dentes " + dentes.join(", ") : item.nota;

            if (nota) {
                linha.appendChild(criar("span", "impressao__nota", nota));
            }

            lista.appendChild(linha);
        });

        secao.appendChild(lista);
        folha.appendChild(secao);
    });

    if (requisicao.observacao) {
        const observacao = criar("p", "impressao__observacao");

        observacao.appendChild(criar("strong", null, "Observação: "));
        observacao.appendChild(document.createTextNode(requisicao.observacao));

        folha.appendChild(observacao);
    }

    const lugar = requisicao.laboratorio || {};
    const destino = criar("section", "impressao__destino");

    destino.appendChild(
        criar("p", "impressao__destino-rotulo", "Clínica de imagem indicada"),
    );
    destino.appendChild(
        criar(
            "p",
            "impressao__destino-nome",
            [lugar.nome, lugar.unidade].filter(Boolean).join(" · "),
        ),
    );
    destino.appendChild(
        criar(
            "p",
            "impressao__destino-linha",
            [lugar.endereco, lugar.cidade].filter(Boolean).join(", "),
        ),
    );
    destino.appendChild(
        criar(
            "p",
            "impressao__destino-linha",
            [lugar.telefone, lugar.email].filter(Boolean).join(" · "),
        ),
    );

    folha.appendChild(destino);

    const pe = criar("footer", "impressao__pe");

    pe.appendChild(
        criar(
            "p",
            "impressao__data",
            CLINICA.municipio +
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

export const criarPainel = ({ hospedeiro, aoFechar, aoConverter, sessao = {} }) => {
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
    const botaoPedir = achar("requisicao__abrir");
    const conta = achar("conta");
    const formaDeConta = achar("conta__forma");
    const listaDePagamentos = achar("conta__pagamentos");
    const campoValor = achar("conta__valor-campo");
    const meioDePagamento = achar("conta__meio");
    const campoParcelas = achar("conta__parcelas");
    const caixaDeParcelas = achar("conta__campo--parcelas");
    const observacaoDoPagamento = achar("conta__observacao");
    const blocoDeInsumos = achar("insumos-usados");
    const insumosLancados = achar("insumos-usados__lancados");
    const formaDeInsumos = achar("insumos-usados__form");
    const linhasDeInsumo = achar("insumos-usados__linhas");
    const historicoDePedidos = achar("requisicao__historico");
    const pedidosEmitidos = achar("requisicao__emitidas");

    const pedido = doModelo(PEDIDO);

    raiz.appendChild(pedido);

    const noPedido = (classe) => pedido.querySelector("." + classe);

    const pacienteDoPedido = noPedido("pedido__paciente");
    const laboratorio = noPedido("pedido__laboratorio");
    const dentesDoPedido = noPedido("pedido__dentes");
    const blocos = noPedido("pedido__blocos");
    const observacaoDoPedido = noPedido("pedido__observacao");
    const avisoDoPedido = noPedido("pedido__aviso");
    const botaoRequisitar = noPedido("pedido__emitir");
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

        const nome = item.querySelector(".orcamento__procedimento");

        nome.value = procedimento || "";
        preco.value = valor ? emReais(valor).replace("R$", "").trim() : "";

        preco.addEventListener("input", somar);

        nome.addEventListener("change", () => {
            const doCatalogo = deTabela.get(nome.value.trim().toLowerCase());

            if (doCatalogo && doCatalogo.preco && !preco.value.trim()) {
                preco.value = emReais(doCatalogo.preco).replace("R$", "").trim();
                somar();
            }
        });

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

    /* Requisição de exames */

    const campos = new Map();

    const valorDe = (opcao) => {
        const campo = campos.get(opcao.id);

        if (!campo) {
            return "";
        }

        return opcao.tipo === "texto" ? campo.value.trim() : campo.checked;
    };

    const montarBlocosDoPedido = () => {
        BLOCOS.forEach((grupo) => {
            const caixa = doModelo(BLOCO_PEDIDO);
            const destino = caixa.querySelector(".pedido__opcoes");
            const conta = caixa.querySelector(".pedido__bloco-conta");

            caixa.querySelector(".pedido__bloco-nome").textContent = grupo.titulo;

            /* A conta no cabeçalho do bloco existe porque o formulário é longo:
               fechado, o bloco ainda diz quantos pedidos moram lá dentro. */
            const contar = () => {
                const quantos = grupo.opcoes.filter((opcao) => valorDe(opcao)).length;

                conta.textContent = quantos ? String(quantos) : "";
                caixa.classList.toggle("tem-marcado", quantos > 0);
            };

            grupo.opcoes.forEach((opcao) => {
                const escrita = opcao.tipo === "texto";
                const linha = doModelo(escrita ? LINHA_PEDIDO : CAIXA_PEDIDO);
                const campo = linha.querySelector(
                    escrita ? ".pedido__linha" : ".pedido__caixa",
                );

                linha.querySelector(".pedido__opcao-rotulo").textContent = opcao.rotulo;

                if (escrita) {
                    campo.placeholder = "Escreva para entrar na requisição";
                } else {
                    const nota = linha.querySelector(".pedido__opcao-nota");

                    nota.textContent = opcao.nota || "";
                    nota.hidden = !opcao.nota;
                }

                campo.addEventListener("input", contar);
                campos.set(opcao.id, campo);
                destino.appendChild(linha);
            });

            contar();
            blocos.appendChild(caixa);
        });
    };

    const lerPedido = () => {
        const pedidos = {};

        BLOCOS.forEach(({ opcoes }) => {
            opcoes.forEach((opcao) => {
                const valor = valorDe(opcao);

                if (valor) {
                    pedidos[opcao.id] = valor;
                }
            });
        });

        return pedidos;
    };

    const limparPedido = () => {
        campos.forEach((campo) => {
            if (campo.type === "checkbox") {
                campo.checked = false;
            } else {
                campo.value = "";
            }
        });

        observacaoDoPedido.value = "";
        avisoDoPedido.textContent = "";
        avisoDoPedido.classList.remove("esta-errado");

        blocos.querySelectorAll(".pedido__bloco").forEach((caixa, indice) => {
            caixa.open = indice === 0;
            caixa.classList.remove("tem-marcado");
            caixa.querySelector(".pedido__bloco-conta").textContent = "";
        });
    };

    const imprimirPedido = (requisicao) => {
        montarRequisicaoImpressa(folha, {
            paciente: aberto.paciente,
            requisicao,
            quando: requisicao.emitidoEm ? new Date(requisicao.emitidoEm) : new Date(),
        });

        window.print();
    };

    const cartaoDePedido = (requisicao) => {
        const cartao = doModelo(EMITIDA);

        cartao.querySelector(".emitida__data").textContent = POR_EXTENSO_SEM_DIA.format(
            new Date(requisicao.emitidoEm),
        );

        cartao.querySelector(".emitida__resumo").textContent = resumoDe(requisicao);

        cartao.querySelector(".emitida__reimprimir").addEventListener("click", () => {
            imprimirPedido(requisicao);
        });

        return cartao;
    };

    const montarHistoricoDePedidos = (lista) => {
        pedidosEmitidos.textContent = "";

        lista.forEach((requisicao) =>
            pedidosEmitidos.appendChild(cartaoDePedido(requisicao)),
        );

        historicoDePedidos.hidden = !lista.length;
    };

    const abrirPedido = () => {
        if (!aberto) {
            return;
        }

        const numeros = emOrdem(marcados);

        pacienteDoPedido.textContent = aberto.paciente.nome;

        /* Os dentes vêm do odontograma que já está aberto na tela, e não de
           uma segunda marcação aqui dentro: são os mesmos dentes, e duas
           marcações divergem no dia em que alguém corrige só uma. */
        dentesDoPedido.textContent = numeros.length
            ? "Dentes assinalados no odontograma: " + numeros.join(", ") + "."
            : "Nenhum dente assinalado no odontograma. Periapicais pedem os dentes marcados lá.";

        limparPedido();
        pedido.showModal();
    };

    LABORATORIOS.forEach((lugar) => {
        const opcao = document.createElement("option");

        opcao.value = lugar.id;
        opcao.textContent = lugar.nome + ", " + lugar.unidade;

        laboratorio.appendChild(opcao);
    });

    montarBlocosDoPedido();

    botaoPedir.addEventListener("click", abrirPedido);
    noPedido("pedido__fechar").addEventListener("click", () => pedido.close());
    noPedido("pedido__cancelar").addEventListener("click", () => pedido.close());

    botaoRequisitar.addEventListener("click", async () => {
        if (!aberto) {
            return;
        }

        const pedidos = lerPedido();

        if (!Object.keys(pedidos).length) {
            avisoDoPedido.textContent = "Marque ao menos um exame para emitir.";
            avisoDoPedido.classList.add("esta-errado");
            return;
        }

        botaoRequisitar.disabled = true;
        avisoDoPedido.classList.remove("esta-errado");
        avisoDoPedido.textContent = "Emitindo…";

        const requisicao = {
            emitidoEm: new Date().toISOString(),
            laboratorio: laboratorioDe(laboratorio.value),
            dentes: emOrdem(marcados),
            pedidos,
            observacao: observacaoDoPedido.value.trim(),
        };

        try {
            const salva = await emitirRequisicao(aberto.id, requisicao);
            const guardada = { ...requisicao, ...salva };

            aberto.requisicoes = [guardada, ...(aberto.requisicoes || [])];

            montarHistoricoDePedidos(aberto.requisicoes);

            /* Fecha antes de imprimir: o <dialog> vive na camada de cima, e a
               folha precisa ser a única coisa na página. */
            pedido.close();
            recado("Requisição de exames emitida.");

            imprimirPedido(guardada);
        } catch (falha) {
            avisoDoPedido.textContent = falha.message;
            avisoDoPedido.classList.add("esta-errado");
        } finally {
            botaoRequisitar.disabled = false;
        }
    });

    /* O catálogo no orçamento

       O campo continua sendo texto livre: quem quiser escrever "Ajuste de
       oclusão" escreve. O catálogo entra como sugestão, e é o que faz o
       item cair no relatório de rentabilidade, porque o servidor amarra os
       dois pelo nome. Escolher da lista ainda preenche o preço de tabela,
       quando o valor está vazio. */

    let deTabela = new Map();

    const carregarCatalogo = async () => {
        if (!(sessao.permissoes || []).includes("parecer.editar") || deTabela.size) {
            return;
        }

        try {
            const { procedimentos } = await catalogo();
            const lista = raiz.querySelector("#catalogo-de-procedimentos");

            lista.textContent = "";

            procedimentos.forEach((procedimento) => {
                const opcao = document.createElement("option");

                opcao.value = procedimento.nome;
                lista.appendChild(opcao);

                deTabela.set(procedimento.nome.toLowerCase(), procedimento);
            });
        } catch (falha) {
            /* Sem catálogo o orçamento continua inteiro: o autocompletar é
               conveniência, não requisito. */
        }
    };

    /* Pagamentos

       A conta só chega do servidor para quem pode vê-la, e o formulário só
       aparece para quem pode lançar. Quem garante os dois é o servidor; aqui
       é só para a tela não mostrar botão que vai dar 403. */

    const podeRegistrar = (sessao.permissoes || []).includes("financeiro.registrar");

    FORMAS.forEach((forma) => {
        const opcao = document.createElement("option");

        opcao.value = forma.valor;
        opcao.textContent = forma.rotulo;

        meioDePagamento.appendChild(opcao);
    });

    for (let quantas = 1; quantas <= PARCELAS_MAXIMAS; quantas += 1) {
        const opcao = document.createElement("option");

        opcao.value = String(quantas);
        opcao.textContent = quantas + "x";

        campoParcelas.appendChild(opcao);
    }

    /* Parcela é conversa de crédito: no pix e no dinheiro o campo nem
       aparece, e o servidor recusa se alguém insistir. */
    const ajustarParcelas = () => {
        const ehCredito = meioDePagamento.value === "credito";

        caixaDeParcelas.hidden = !ehCredito;

        if (!ehCredito) {
            campoParcelas.value = "1";
        }
    };

    meioDePagamento.addEventListener("change", ajustarParcelas);

    const montarConta = (dados) => {
        if (!dados) {
            conta.hidden = true;
            return;
        }

        conta.hidden = false;
        formaDeConta.hidden = !podeRegistrar;

        conta.querySelector('[data-conta="total"]').textContent = emDinheiro(dados.total);
        conta.querySelector('[data-conta="recebido"]').textContent = emDinheiro(dados.recebido);
        conta.querySelector('[data-conta="saldo"]').textContent = emDinheiro(dados.saldo);

        listaDePagamentos.textContent = "";

        (dados.pagamentos || []).forEach((pagamento) => {
            const item = doModelo(PAGAMENTO);
            const quando = pagamento.recebidoEm
                ? EM_DATA.format(deIso(String(pagamento.recebidoEm).slice(0, 10)))
                : "";

            item.querySelector(".pagamento__meio").textContent = [
                quando,
                rotuloDaForma(pagamento.forma) +
                    (pagamento.parcelas > 1 ? " em " + pagamento.parcelas + "x" : ""),
                pagamento.estornadoEm ? "estornado" : "",
            ]
                .filter(Boolean)
                .join("  ·  ");

            item.querySelector(".pagamento__valor").textContent = emDinheiro(pagamento.valor);
            item.classList.toggle("esta-estornado", Boolean(pagamento.estornadoEm));

            listaDePagamentos.appendChild(item);
        });
    };

    formaDeConta.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (!aberto) {
            return;
        }

        const valor = emCentavosDoPagamento(campoValor.value);

        if (valor <= 0) {
            recado("Informe o valor recebido.", true);
            return;
        }

        const botao = formaDeConta.querySelector(".conta__registrar");

        botao.disabled = true;
        recado("Registrando…");

        try {
            await registrarPagamento(aberto.id, {
                valor,
                forma: meioDePagamento.value,
                parcelas: Number(campoParcelas.value) || 1,
                observacao: observacaoDoPagamento.value.trim(),
            });

            campoValor.value = "";
            observacaoDoPagamento.value = "";

            /* Recarrega a ficha em vez de somar na mão: taxa e líquido são
               conta do servidor, e a tela não deve adivinhar o resultado. */
            const atualizada = await fichaDe(aberto.id);

            aberto.conta = atualizada.conta;
            montarConta(atualizada.conta);

            recado("Pagamento registrado.");
        } catch (falha) {
            recado(falha.message, true);
        } finally {
            botao.disabled = false;
        }
    });

    /* Insumos usados */

    const podeLancarInsumo = (sessao.permissoes || []).includes("inventario.mover");

    let prateleira = [];

    const linhaDeInsumo = () => {
        const item = doModelo(LINHA_DE_INSUMO);
        const qual = item.querySelector(".linha-insumo__qual");

        const vazia = document.createElement("option");

        vazia.value = "";
        vazia.textContent = "Escolha o insumo";
        qual.appendChild(vazia);

        prateleira.forEach((insumo) => {
            const opcao = document.createElement("option");

            opcao.value = insumo.id;
            opcao.textContent = insumo.nome + " (" + comoQuantidade(insumo.saldo, insumo.unidade) + ")";

            qual.appendChild(opcao);
        });

        item.querySelector(".linha-insumo__tirar").addEventListener("click", () => {
            item.remove();

            if (!linhasDeInsumo.children.length) {
                linhasDeInsumo.appendChild(linhaDeInsumo());
            }
        });

        return item;
    };

    const montarInsumos = (usados) => {
        insumosLancados.textContent = "";

        (usados || []).forEach((usado) => {
            const item = doModelo(INSUMO_USADO);

            item.querySelector(".insumo-usado__nome").textContent = usado.nome;
            item.querySelector(".insumo-usado__quantidade").textContent = comoQuantidade(
                usado.quantidade,
                usado.unidade,
            );

            insumosLancados.appendChild(item);
        });

        blocoDeInsumos.hidden = !usados && !podeLancarInsumo;
        formaDeInsumos.hidden = !podeLancarInsumo;
    };

    const carregarPrateleira = async () => {
        if (!podeLancarInsumo || prateleira.length) {
            return;
        }

        try {
            const { insumos: lidos } = await listarInsumos({ situacao: "ativos" });

            prateleira = lidos;
        } catch (falha) {
            prateleira = [];
        }
    };

    achar("insumos-usados__somar").addEventListener("click", () => {
        linhasDeInsumo.appendChild(linhaDeInsumo());
    });

    achar("insumos-usados__lancar").addEventListener("click", async () => {
        if (!aberto) {
            return;
        }

        const itens = [...linhasDeInsumo.children]
            .map((linha) => ({
                insumoId: linha.querySelector(".linha-insumo__qual").value,
                quantidade: emQuantidade(linha.querySelector(".linha-insumo__quanto").value),
            }))
            .filter((item) => item.insumoId && item.quantidade > 0);

        if (!itens.length) {
            recado("Escolha o insumo e a quantidade para lançar.", true);
            return;
        }

        const botao = achar("insumos-usados__lancar");

        botao.disabled = true;
        recado("Lançando…");

        try {
            await consumirNoAtendimento(aberto.id, itens);

            const atualizada = await fichaDe(aberto.id);

            aberto.insumos = atualizada.insumos;
            montarInsumos(atualizada.insumos);

            linhasDeInsumo.textContent = "";
            prateleira = [];

            await carregarPrateleira();

            linhasDeInsumo.appendChild(linhaDeInsumo());

            recado("Consumo lançado e baixado do estoque.");
        } catch (falha) {
            recado(falha.message, true);
        } finally {
            botao.disabled = false;
        }
    });

    /* O QUE CADA UM VÊ DENTRO DA FICHA

       A secretária e o financeiro abrem a ficha do paciente, mas não abrem
       o prontuário: sem isto, eles veriam um parecer em branco, digitariam
       nele e levariam 403 na cara ao salvar. Esconder a seção é mais
       honesto do que oferecer um campo que não vai gravar.

       Quem decide de verdade continua sendo o servidor, que nem manda
       esses campos para eles. Aqui é só a tela não mentir. */

    const podeProntuario = (sessao.permissoes || []).includes("prontuario.ver");
    const podeEditarParecer = (sessao.permissoes || []).includes("parecer.editar");

    const ajustarAoAcesso = () => {
        ["odonto", "anexos", "parecer", "orcamento", "receita", "requisicao"].forEach((secao) => {
            const alvo = achar(secao);

            if (alvo) {
                alvo.hidden = !podeProntuario;
            }
        });

        /* O rodapé guarda "Salvar orçamento" e "Orçamento aprovado": os dois
           são atos de quem atende. */
        achar("atendimento__acoes").hidden = !podeEditarParecer;
    };

    const ehCliente = () => aberto && aberto.estagio === ESTAGIOS.cliente;

    const ajustarBotoes = () => {
        const cliente = ehCliente();

        botaoConverter.hidden = cliente;
        botaoSalvar.textContent = cliente ? "Salvar" : "Salvar orçamento";
    };

    const fechar = () => {
        /* Se a ficha fechar com o modal aberto, ele fica aberto sem tela por
           baixo, e o showModal() seguinte estoura. */
        if (pedido.open) {
            pedido.close();
        }

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
        montarHistoricoDePedidos(completo.requisicoes || []);

        carregarCatalogo();
        ajustarAoAcesso();

        montarConta(completo.conta);

        if (completo.insumos || podeLancarInsumo) {
            montarInsumos(completo.insumos || []);

            carregarPrateleira().then(() => {
                linhasDeInsumo.textContent = "";
                linhasDeInsumo.appendChild(linhaDeInsumo());
            });
        } else {
            blocoDeInsumos.hidden = true;
        }

        ajustarParcelas();

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

            recado("Agora é paciente. O prontuário passa a valer.");

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
