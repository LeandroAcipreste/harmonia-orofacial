import { API, DEMONSTRACAO } from "../core/config.js";
import { comBusca, enviar, pedir } from "./http.js";
import {
    balancoDeDemonstracao,
    emAbertoDeDemonstracao,
    estornarDeDemonstracao,
    lancamentosDeDemonstracao,
    pagarDeDemonstracao,
    salvarTaxaDeDemonstracao,
    taxasDeDemonstracao,
} from "./demonstracao.js";

const ROTAS = {
    ficha: "/api/agendamentos/",
    balanco: "/api/financeiro/balanco",
    lancamentos: "/api/financeiro/lancamentos",
    abertos: "/api/financeiro/abertos",
    taxas: "/api/financeiro/taxas",
    pagamento: "/api/financeiro/pagamentos/",
};

const MENSAGENS = {
    balanco: "Não foi possível carregar o balanço.",
    lancamentos: "Não foi possível carregar os lançamentos.",
    abertos: "Não foi possível carregar quem está em aberto.",
    taxas: "Não foi possível carregar as taxas.",
    salvarTaxa: "A taxa não foi salva. Tente de novo.",
    pagar: "O pagamento não foi registrado. Tente de novo.",
    estornar: "O estorno não foi registrado. Tente de novo.",
};

/* As formas, na ordem em que a secretária encosta nelas no balcão. */
export const FORMAS = [
    { valor: "pix", rotulo: "Pix" },
    { valor: "dinheiro", rotulo: "Dinheiro" },
    { valor: "debito", rotulo: "Débito" },
    { valor: "credito", rotulo: "Crédito" },
];

export const PARCELAS_MAXIMAS = 12;

export const rotuloDaForma = (valor) =>
    (FORMAS.find((forma) => forma.valor === valor) || {}).rotulo || valor;

const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const emDinheiro = (centavos) => MOEDA.format((Number(centavos) || 0) / 100);

/* "1.234,56", "1234.56" e "1234,56" viram 123456. O balcão digita dos três
   jeitos, e recusar a digitação de quem está com o paciente na frente é
   pior do que aceitar as três. */
export const emCentavos = (texto) => {
    const limpo = String(texto ?? "").trim().replace(/[^\d,.-]/g, "");

    if (!limpo) {
        return 0;
    }

    const normalizado = limpo.includes(",")
        ? limpo.replace(/\./g, "").replace(",", ".")
        : limpo;

    return Math.round(Number(normalizado) * 100) || 0;
};

export const balanco = (data) => {
    if (DEMONSTRACAO) {
        return balancoDeDemonstracao(data);
    }

    return pedir(comBusca(ROTAS.balanco, { data }), {}, MENSAGENS.balanco);
};

export const lancamentos = ({ de, ate } = {}) => {
    if (DEMONSTRACAO) {
        return lancamentosDeDemonstracao({ de, ate });
    }

    return pedir(comBusca(ROTAS.lancamentos, { de, ate }), {}, MENSAGENS.lancamentos);
};

/* A planilha é um download do navegador, e não um fetch: quem monta o
   arquivo é o servidor, com o cookie de sessão indo junto. */
export const enderecoDaPlanilha = ({ de, ate } = {}) =>
    API.base + comBusca(ROTAS.lancamentos, { de, ate, formato: "csv" });

export const emAberto = () => {
    if (DEMONSTRACAO) {
        return emAbertoDeDemonstracao();
    }

    return pedir(ROTAS.abertos, {}, MENSAGENS.abertos);
};

export const taxas = () => {
    if (DEMONSTRACAO) {
        return taxasDeDemonstracao();
    }

    return pedir(ROTAS.taxas, {}, MENSAGENS.taxas);
};

export const salvarTaxa = (taxa) => {
    if (DEMONSTRACAO) {
        return salvarTaxaDeDemonstracao(taxa);
    }

    return enviar(ROTAS.taxas, taxa, MENSAGENS.salvarTaxa);
};

export const registrarPagamento = (avaliacaoId, pagamento) => {
    if (DEMONSTRACAO) {
        return pagarDeDemonstracao(avaliacaoId, pagamento);
    }

    return enviar(
        ROTAS.ficha + encodeURIComponent(avaliacaoId) + "/pagamentos",
        pagamento,
        MENSAGENS.pagar,
    );
};

/* Estorno em vez de exclusão: o lançamento errado continua lá, marcado, com
   motivo e autor. Dinheiro sem trilha é onde nasce briga. */
export const estornarPagamento = (id, motivo) => {
    if (DEMONSTRACAO) {
        return estornarDeDemonstracao(id, motivo);
    }

    return enviar(
        ROTAS.pagamento + encodeURIComponent(id) + "/estorno",
        { motivo },
        MENSAGENS.estornar,
        "PUT",
    );
};
