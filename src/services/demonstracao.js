import { ESTAGIOS } from "../core/config.js";

const FICHAS = [
    {
        id: "dem-1",
        hora: "08:30",
        estagio: ESTAGIOS.contato,
        paciente: {
            nome: "Maria Souza Andrade",
            cpf: "412.885.730-09",
            rg: "3.112.554 SSP/SE",
            email: "maria.andrade@exemplo.com",
            telefone: "(79) 99876-4880",
            nascimento: "1990-04-12",
            idade: "35",
            sexo: "Feminino",
            endereco: "Rua Laranjeiras, 120",
            cidade: "Aracaju",
        },
        preferencia: { data: "2026-09-15", janela: "manha" },
        saude: {
            saude: "Não",
            medicamento: "Sim",
            alergia: "Não",
            fumante: "Não",
            cicatrizacao: "Sim",
            tratamento: "Não",
            anestesia: "Sim",
            malEstar: "Não",
            hemorragia: "Não",
        },
        observacoes:
            "Uso losartana 50mg pela manhã. Incomoda o apinhamento dos dentes de baixo.",
        consentimento: {
            veracidade: true,
            dados: true,
            imagem: true,
            marketing: true,
        },
    },
    {
        id: "dem-2",
        hora: "09:20",
        estagio: ESTAGIOS.contato,
        paciente: {
            nome: "João Batista Lima",
            cpf: "605.219.480-22",
            rg: "1.874.906 SSP/SE",
            email: "joao.lima@exemplo.com",
            telefone: "(79) 99612-3344",
            nascimento: "1978-11-03",
            idade: "47",
            sexo: "Masculino",
            cidade: "Nossa Senhora do Socorro",
        },
        preferencia: { data: "2026-09-16", janela: "tarde" },
        saude: {
            saude: "Sim",
            medicamento: "Sim",
            alergia: "Sim",
            fumante: "Sim",
            cicatrizacao: "Não",
            tratamento: "Sim",
            anestesia: "Sim",
            malEstar: "Sim",
            hemorragia: "Não",
        },
        observacoes:
            "Diabético. Alergia a dipirona. Já passou mal com anestesia em extração.",
        consentimento: {
            veracidade: true,
            dados: true,
            imagem: false,
            marketing: false,
        },
    },
    {
        id: "dem-3",
        hora: "10:40",
        estagio: ESTAGIOS.cliente,
        paciente: {
            nome: "Ana Clara Menezes",
            cpf: "238.470.115-61",
            rg: "4.550.218 SSP/SE",
            email: "anaclara@exemplo.com",
            telefone: "(79) 98844-7711",
            idade: "29",
            sexo: "Feminino",
            cidade: "Aracaju",
        },
        preferencia: { data: "2026-09-15", janela: "manha" },
        saude: {
            saude: "Não",
            medicamento: "Não",
            alergia: "Não",
            fumante: "Não",
            cicatrizacao: "Sim",
            anestesia: "Sim",
            malEstar: "Não",
            hemorragia: "Não",
        },
        observacoes: "Quer avaliar harmonização e clareamento antes do casamento.",
        consentimento: {
            veracidade: true,
            dados: true,
            imagem: true,
            marketing: true,
        },
        parecer: {
            dentes: [11, 12, 21, 22],
            texto:
                "Desgaste incisal nos centrais e laterais superiores, com leve assimetria de bordo. Indicação de facetas em resina nos quatro elementos, precedida de clareamento supervisionado.",
            orcamento: {
                itens: [
                    { procedimento: "Clareamento supervisionado", valor: 120000 },
                    { procedimento: "Faceta em resina (4 elementos)", valor: 320000 },
                ],
                total: 440000,
            },
        },
    },
    {
        id: "dem-4",
        hora: "14:10",
        estagio: ESTAGIOS.contato,
        paciente: {
            nome: "Roberto Carvalho Pinto",
            cpf: "901.336.242-18",
            rg: "2.207.443 SSP/BA",
            email: "rc.pinto@exemplo.com",
            telefone: "(79) 99230-5566",
            idade: "62",
            sexo: "Masculino",
            cidade: "Aracaju",
        },
        preferencia: { data: "2026-09-17", janela: "tarde" },
        saude: {
            saude: "Sim",
            medicamento: "Sim",
            alergia: "Não",
            fumante: "Não",
            cicatrizacao: "Sim",
            tratamento: "Sim",
            anestesia: "Sim",
            malEstar: "Não",
            hemorragia: "Sim",
        },
        observacoes: "Hipertenso, usa anticoagulante. Perdeu dois molares inferiores.",
        consentimento: {
            veracidade: true,
            dados: true,
            imagem: false,
            marketing: true,
        },
    },
];

const salvos = new Map();

const anexados = new Map();

const receitados = new Map();

const requisitados = new Map();

let contador = 0;

/* A FICHA SAI FILTRADA, COMO SAI DO SERVIDOR

   Sem isto, a demonstração mostraria anamnese e parecer para a secretária,
   e quem testasse permissão aqui chegaria à conclusão errada. A regra é a
   mesma de buscarAvaliacaoService, no backend: identificação e preferência
   para quem abre a ficha, prontuário só para quem tem prontuario.ver,
   conta para quem mexe com dinheiro, insumos para quem vê o inventário. */

const guardado = (id) => {
    const base = FICHAS.find((ficha) => ficha.id === id);

    if (!base) {
        return null;
    }

    const permissoes = (quemEntrou() || {}).permissoes || [];
    const pode = (permissao) => permissoes.includes(permissao);

    const { saude, observacoes, parecer, ...identificacao } = base;

    const conta =
        pode("financeiro.registrar") || pode("financeiro.ver") ? contaDe(id) : undefined;

    if (!pode("prontuario.ver")) {
        return conta ? { ...identificacao, conta } : identificacao;
    }

    return {
        ...base,
        parecer: salvos.get(id) || parecer,
        anexos: anexados.get(id) || [],
        receituarios: receitados.get(id) || [],
        requisicoes: requisitados.get(id) || [],
        conta,
        insumos: pode("inventario.ver") ? consumoDe(id) : [],
    };
};

const espera = (valor) =>
    new Promise((resolver) => window.setTimeout(() => resolver(valor), 220));

/* O PORTEIRO

   Esconder o link do menu é cortesia; quem digitar o endereço continua
   chegando na tela. No sistema de verdade quem barra é o servidor, com
   403. Aqui a demonstração precisa recusar igual, senão testar permissão
   por aqui daria uma resposta que a produção não vai repetir. */

const recusarSemPermissao = (permissao, recado) => {
    const permissoes = (quemEntrou() || {}).permissoes || [];

    return permissoes.includes(permissao)
        ? null
        : Promise.reject(new Error(recado));
};

export const agendaDeDemonstracao = (data) => {
    const barrado = recusarSemPermissao(
        "agenda.ver",
        "Seu acesso não permite ver a agenda.",
    );

    if (barrado) {
        return barrado;
    }

    const semana = new Date(data + "T12:00:00").getDay();

    if (semana === 0 || semana === 6) {
        return espera({ agendamentos: [] });
    }

    const quantos = semana === 3 ? FICHAS.length : Math.min(3, FICHAS.length);

    return espera({
        agendamentos: FICHAS.slice(0, quantos).map((ficha) => guardado(ficha.id)),
    });
};

const ACENTOS = /[\u0300-\u036f]/g;

const NAO_DIGITO = /\D/g;

const semAcento = (texto) =>
    String(texto).normalize("NFD").replace(ACENTOS, "").toLowerCase();

export const pacientesDeDemonstracao = ({ busca, estagio } = {}) => {
    const barrado = recusarSemPermissao(
        "pacientes.ver",
        "Seu acesso não permite ver a lista de pacientes.",
    );

    if (barrado) {
        return barrado;
    }

    const termo = semAcento(busca || "").trim();
    const digitos = termo.replace(NAO_DIGITO, "");

    const achados = FICHAS.filter((ficha) => {
        if (estagio && ficha.estagio !== estagio) {
            return false;
        }

        if (!termo) {
            return true;
        }

        const nome = semAcento(ficha.paciente.nome);
        const telefone = (ficha.paciente.telefone || "").replace(NAO_DIGITO, "");
        const cpf = (ficha.paciente.cpf || "").replace(NAO_DIGITO, "");
        const email = semAcento(ficha.paciente.email || "");

        return (
            nome.includes(termo) ||
            email.includes(termo) ||
            (digitos.length > 2 &&
                (telefone.includes(digitos) || cpf.includes(digitos)))
        );
    });

    return espera({
        pacientes: achados
            .map((ficha) => guardado(ficha.id))
            .sort((um, outro) => um.paciente.nome.localeCompare(outro.paciente.nome, "pt-BR")),
    });
};

export const fichaDeDemonstracao = (id) => espera(guardado(id));

export const salvarDeDemonstracao = (id, parecer) => {
    salvos.set(id, parecer);

    return espera({ ok: true });
};

export const converterDeDemonstracao = (id) => {
    const ficha = FICHAS.find((atual) => atual.id === id);

    if (ficha) {
        ficha.estagio = ESTAGIOS.cliente;
    }

    return espera({ ok: true, estagio: ESTAGIOS.cliente });
};

const CHAVE = "harmonia:demonstracao";

/* AS PERMISSÕES DE CADA PAPEL

   Cópia fiel do que as migrations 002 a 010 dão a cada papel no banco. É
   cópia porque a demonstração roda sem servidor, e é fiel porque testar
   permissão contra uma lista inventada não testa nada.

   Migration nova que mexa em papel_permissoes mexe aqui também. */
const PERMISSOES_DO_PAPEL = {
    dentista: [
        "agenda.ver",
        "agenda.marcar",
        "pacientes.ver",
        "avaliacao.ver",
        "prontuario.ver",
        "avaliacao.comparecimento",
        "parecer.editar",
        "orcamento.decidir",
        "exames.conferir",
        "google.conectar",
        "requisicao.emitir",
        "financeiro.registrar",
        "financeiro.caixa",
        "financeiro.ver",
        "financeiro.taxas",
        "financeiro.precificar",
        "relatorio.rentabilidade",
        "inventario.ver",
        "inventario.mover",
        "inventario.gerenciar",
    ],

    /* A secretária: agenda e balcão. Não abre prontuário, não vê relatório
       de período, não mexe no mínimo do estoque. */
    recepcao: [
        "agenda.ver",
        "agenda.marcar",
        "pacientes.ver",
        "avaliacao.ver",
        "avaliacao.comparecimento",
        "financeiro.registrar",
        "financeiro.caixa",
        "inventario.ver",
        "inventario.mover",
    ],

    /* O financeiro: o dinheiro inteiro, e nada de saúde. Também não entra
       no inventário, que é da clínica e não do caixa. */
    financeiro: [
        "pacientes.ver",
        "avaliacao.ver",
        "financeiro.registrar",
        "financeiro.caixa",
        "financeiro.ver",
        "financeiro.taxas",
        "financeiro.precificar",
        "relatorio.rentabilidade",
    ],

    admin: ["usuarios.gerenciar", "google.conectar"],
};

/* As contas da demonstração. A doutora é dentista e admin ao mesmo tempo,
   como no banco de verdade. */
const CONTAS = [
    {
        email: "adm@adm.com",
        senha: "12345",
        nome: "DRA. CÉLIA",
        papeis: ["dentista", "admin"],
    },
    {
        email: "financeiro@teste.com",
        senha: "12345",
        nome: "Financeiro (teste)",
        papeis: ["financeiro"],
    },
    {
        email: "secretaria@teste.com",
        senha: "12345",
        nome: "Secretária (teste)",
        papeis: ["recepcao"],
    },
];

const identidadeDe = (conta) => ({
    nome: conta.nome,
    email: conta.email,
    papel: conta.papeis[0],
    tipo: "pessoa",
    papeis: conta.papeis,
    permissoes: [
        ...new Set(conta.papeis.flatMap((papel) => PERMISSOES_DO_PAPEL[papel] || [])),
    ],
});

/* Quem está logado agora. Usado também para assinar o que a pessoa lança
   na demonstração: pagamento, movimento de estoque, consumo. */
const quemEntrou = () => {
    let email = null;

    try {
        email = sessionStorage.getItem(CHAVE);
    } catch (falha) {
        email = entrou;
    }

    const conta = CONTAS.find((uma) => uma.email === email);

    return conta ? identidadeDe(conta) : null;
};

/* Exames que chegaram por e-mail e não puderam ser identificados sozinhos.
   Servem para a tela de conferência funcionar sem backend. */
const EXAMES = [
    {
        id: "exa-1",
        motivo: "remetente_desconhecido",
        remetente: "resultados@laboratoriodaesquina.com.br",
        assunto: "Resultado de exame · CPF 412.885.730-09",
        recebidoEm: "2026-09-10T17:32:00.000Z",
        cpf: "41288573009",
        anexos: [
            { id: "anx-1", nome: "panoramica.pdf", tipo: "application/pdf", tamanho: 842113, url: "#" },
        ],
        sugestao: { avaliacaoId: "dem-1", nome: "Maria Souza Andrade" },
    },
    {
        id: "exa-2",
        motivo: "cpf_nao_encontrado",
        remetente: "resultados@labcentral.com.br",
        assunto: "Exame CPF 222.333.444-00",
        recebidoEm: "2026-09-10T12:05:00.000Z",
        cpf: "22233344400",
        anexos: [
            { id: "anx-2", nome: "hemograma.pdf", tipo: "application/pdf", tamanho: 233910, url: "#" },
        ],
        sugestao: null,
    },
    {
        id: "exa-3",
        motivo: "sem_arquivo_valido",
        remetente: "resultados@labcentral.com.br",
        assunto: "Exame · CPF 605.219.480-22",
        recebidoEm: "2026-09-09T20:41:00.000Z",
        cpf: "60521948022",
        anexos: [],
        sugestao: { avaliacaoId: "dem-2", nome: "João Batista Lima" },
    },
];

const LABORATORIOS = [
    { id: "lab-1", nome: "Lab Central", email: "resultados@labcentral.com.br", ativo: true },
    { id: "lab-2", nome: "Imagem Aracaju", email: "laudos@imagemaracaju.com.br", ativo: false },
];

let ultimaBuscaDeDemonstracao = {
    em: "2026-09-11T11:00:00.000Z",
    situacao: "ok",
    importado: 2,
    conferencia: 1,
    ignorado: 4,
    falhou: 0,
};

const tirarDaFila = (id) => {
    const posicao = EXAMES.findIndex((exame) => exame.id === id);

    if (posicao >= 0) {
        EXAMES.splice(posicao, 1);
    }
};

export const conferenciaDeDemonstracao = () => espera({ exames: EXAMES.map((exame) => ({ ...exame })) });

export const statusDaBuscaDeDemonstracao = () =>
    espera({ ligada: true, intervaloMinutos: 5, ultimaBusca: ultimaBuscaDeDemonstracao });

export const buscarExamesDeDemonstracao = () => {
    ultimaBuscaDeDemonstracao = {
        em: new Date().toISOString(),
        situacao: "ok",
        importado: 0,
        conferencia: 0,
        ignorado: 0,
        falhou: 0,
    };

    return espera(ultimaBuscaDeDemonstracao);
};

export const ligarExameDeDemonstracao = (id) => {
    tirarDaFila(id);

    return espera({ ok: true });
};

export const descartarExameDeDemonstracao = (id) => {
    tirarDaFila(id);

    return espera({ ok: true, arquivosApagados: 1 });
};

export const laboratoriosDeDemonstracao = () =>
    espera({ laboratorios: LABORATORIOS.map((laboratorio) => ({ ...laboratorio })) });

export const cadastrarLaboratorioDeDemonstracao = ({ nome, email }) => {
    const novo = { id: "lab-" + (LABORATORIOS.length + 1), nome, email, ativo: true };

    LABORATORIOS.push(novo);

    return espera(novo);
};

export const alternarLaboratorioDeDemonstracao = (id, ativo) => {
    const laboratorio = LABORATORIOS.find((atual) => atual.id === id);

    if (laboratorio) {
        laboratorio.ativo = ativo;
    }

    return espera({ ...laboratorio });
};

let entrou = null;

const lembrar = (email) => {
    try {
        if (email) {
            sessionStorage.setItem(CHAVE, email);
        } else {
            sessionStorage.removeItem(CHAVE);
        }
    } catch (falha) {
        entrou = email;
    }
};

export const entrarDeDemonstracao = ({ email, senha }) => {
    const procurado = String(email).trim().toLowerCase();
    const conta = CONTAS.find(
        (uma) => uma.email === procurado && uma.senha === String(senha),
    );

    if (!conta) {
        return espera({ ok: false, erro: "E-mail ou senha não conferem." });
    }

    entrou = conta.email;
    lembrar(conta.email);

    return espera({ ok: true, etapa: "pronto" });
};

export const sessaoDeDemonstracao = () => quemEntrou();

export const sairDeDemonstracao = () => {
    entrou = null;
    lembrar(null);
};

export const salvarAnexoDeDemonstracao = (id, anexo) => {
    contador += 1;

    const guardadoAgora = {
        ...anexo,
        id: "anx-" + contador,
        criadoEm: new Date().toISOString(),
    };

    anexados.set(id, [...(anexados.get(id) || []), guardadoAgora]);

    return espera(guardadoAgora);
};

export const removerAnexoDeDemonstracao = (id, anexoId) => {
    anexados.set(
        id,
        (anexados.get(id) || []).filter((anexo) => anexo.id !== anexoId),
    );

    return espera({ ok: true });
};

export const emitirDeDemonstracao = (id, receita) => {
    contador += 1;

    const emitida = { ...receita, id: "rec-" + contador };

    receitados.set(id, [emitida, ...(receitados.get(id) || [])]);

    return espera(emitida);
};

export const requisitarDeDemonstracao = (id, requisicao) => {
    contador += 1;

    const emitida = { ...requisicao, id: "req-" + contador };

    requisitados.set(id, [emitida, ...(requisitados.get(id) || [])]);

    return espera(emitida);
};

/* FINANCEIRO E INVENTÁRIO DE MENTIRA

   O suficiente para as duas telas ficarem de pé antes do backend entrar no
   ar: alguns recebimentos espalhados pelo mês, as taxas de uma maquininha
   qualquer e uma prateleira com dois itens já no mínimo, que é o que faz o
   aviso aparecer. Com o servidor no ar, este arquivo inteiro some. */

const comoDia = (data) =>
    [
        data.getFullYear(),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getDate()).padStart(2, "0"),
    ].join("-");

const diasAtras = (quantos) => {
    const data = new Date();

    data.setDate(data.getDate() - quantos);

    return comoDia(data);
};

const TAXAS = [
    { id: "tx-1", forma: "dinheiro", parcelasDe: 1, parcelasAte: 1, percentual: 0 },
    { id: "tx-2", forma: "pix", parcelasDe: 1, parcelasAte: 1, percentual: 0 },
    { id: "tx-3", forma: "debito", parcelasDe: 1, parcelasAte: 1, percentual: 1.99 },
    { id: "tx-4", forma: "credito", parcelasDe: 1, parcelasAte: 1, percentual: 3.09 },
    { id: "tx-5", forma: "credito", parcelasDe: 2, parcelasAte: 6, percentual: 4.5 },
    { id: "tx-6", forma: "credito", parcelasDe: 7, parcelasAte: 12, percentual: 5.9 },
];

const taxaDe = (forma, parcelas) => {
    const faixa = TAXAS.find(
        (taxa) => taxa.forma === forma && parcelas >= taxa.parcelasDe && parcelas <= taxa.parcelasAte,
    );

    return faixa ? faixa.percentual : 0;
};

const comTaxa = (pagamento) => {
    const percentual = taxaDe(pagamento.forma, pagamento.parcelas || 1);
    const taxa = Math.round((pagamento.valor * percentual) / 100);

    return {
        parcelas: 1,
        ...pagamento,
        taxaPercentual: percentual,
        taxa,
        liquido: pagamento.valor - taxa,
    };
};

const PAGAMENTOS = [
    comTaxa({ id: "pag-1", avaliacaoId: "dem-3", paciente: "Ana Clara Menezes", valor: 180000, forma: "credito", parcelas: 3, recebidoEm: diasAtras(0), registradoPor: "Recepção" }),
    comTaxa({ id: "pag-2", avaliacaoId: "dem-1", paciente: "Maria Souza Andrade", valor: 45000, forma: "pix", recebidoEm: diasAtras(0), registradoPor: "Recepção" }),
    comTaxa({ id: "pag-3", avaliacaoId: "dem-4", paciente: "Roberto Carvalho Pinto", valor: 90000, forma: "debito", recebidoEm: diasAtras(1), registradoPor: "Recepção" }),
    comTaxa({ id: "pag-4", avaliacaoId: "dem-3", paciente: "Ana Clara Menezes", valor: 120000, forma: "dinheiro", recebidoEm: diasAtras(3), registradoPor: "DRA. CÉLIA" }),
    comTaxa({ id: "pag-5", avaliacaoId: "dem-4", paciente: "Roberto Carvalho Pinto", valor: 250000, forma: "credito", parcelas: 8, recebidoEm: diasAtras(9), registradoPor: "Recepção" }),
    comTaxa({ id: "pag-6", avaliacaoId: "dem-1", paciente: "Maria Souza Andrade", valor: 60000, forma: "pix", recebidoEm: diasAtras(16), registradoPor: "Recepção" }),
];

const somar = (lista) => {
    const valendo = lista.filter((pagamento) => !pagamento.estornadoEm);
    const bruto = valendo.reduce((soma, pagamento) => soma + pagamento.valor, 0);
    const taxa = valendo.reduce((soma, pagamento) => soma + pagamento.taxa, 0);

    return { bruto, taxa, liquido: bruto - taxa, quantos: valendo.length };
};

const noPeriodo = (de, ate) =>
    PAGAMENTOS.filter((pagamento) => pagamento.recebidoEm >= de && pagamento.recebidoEm <= ate);

const contaDe = (avaliacaoId) => {
    const ficha = FICHAS.find((uma) => uma.id === avaliacaoId);
    const orcamento = (ficha && ficha.parecer && ficha.parecer.orcamento) || null;
    const total = orcamento ? orcamento.total : 0;
    const pagamentos = PAGAMENTOS.filter((pagamento) => pagamento.avaliacaoId === avaliacaoId);
    const recebido = somar(pagamentos).bruto;

    return { total, recebido, saldo: total - recebido, pagamentos };
};

export const balancoDeDemonstracao = () => {
    const hoje = new Date();
    const dia = comoDia(hoje);

    const segunda = new Date(hoje);
    /* getDay() dá 0 no domingo; a semana da clínica começa na segunda. */
    segunda.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7));

    const domingo = new Date(segunda);
    domingo.setDate(segunda.getDate() + 6);

    const primeiro = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const periodos = {
        semanaDe: comoDia(segunda),
        semanaAte: comoDia(domingo),
        mesDe: comoDia(primeiro),
        mesAte: comoDia(ultimo),
    };

    const doMes = noPeriodo(periodos.mesDe, periodos.mesAte);

    const porForma = [...new Set(doMes.map((pagamento) => pagamento.forma))].map((forma) => ({
        forma,
        ...somar(doMes.filter((pagamento) => pagamento.forma === forma)),
    }));

    return espera({
        dia,
        periodos,
        balanco: {
            dia: somar(noPeriodo(dia, dia)),
            semana: somar(noPeriodo(periodos.semanaDe, periodos.semanaAte)),
            mes: somar(doMes),
        },
        porForma: porForma.sort((uma, outra) => outra.bruto - uma.bruto),
    });
};

export const lancamentosDeDemonstracao = ({ de, ate } = {}) => {
    const hoje = comoDia(new Date());
    const inicio = de || hoje;
    const fim = ate || hoje;
    const lancamentos = noPeriodo(inicio, fim).sort((um, outro) =>
        outro.recebidoEm.localeCompare(um.recebidoEm),
    );

    return espera({ de: inicio, ate: fim, total: somar(lancamentos), lancamentos });
};

export const emAbertoDeDemonstracao = () => {
    const emAberto = FICHAS.filter((ficha) => ficha.estagio === ESTAGIOS.cliente)
        .map((ficha) => {
            const conta = contaDe(ficha.id);

            return {
                id: ficha.id,
                nome: ficha.paciente.nome,
                telefone: ficha.paciente.telefone,
                total: conta.total,
                recebido: conta.recebido,
                saldo: conta.saldo,
            };
        })
        .filter((linha) => linha.saldo > 0)
        .sort((uma, outra) => outra.saldo - uma.saldo);

    return espera({
        emAberto,
        total: emAberto.reduce((soma, linha) => soma + linha.saldo, 0),
    });
};

export const taxasDeDemonstracao = () => espera({ taxas: TAXAS.map((taxa) => ({ ...taxa })) });

export const salvarTaxaDeDemonstracao = (nova) => {
    contador += 1;

    const de = nova.parcelasDe || 1;
    const ate = nova.parcelasAte || de;
    const antiga = TAXAS.find(
        (taxa) => taxa.forma === nova.forma && taxa.parcelasDe === de && taxa.parcelasAte === ate,
    );

    if (antiga) {
        antiga.percentual = Number(nova.percentual);

        return espera({ ...antiga });
    }

    const criada = {
        id: "tx-" + contador,
        forma: nova.forma,
        parcelasDe: de,
        parcelasAte: ate,
        percentual: Number(nova.percentual),
    };

    TAXAS.push(criada);

    return espera({ ...criada });
};

export const pagarDeDemonstracao = (avaliacaoId, pagamento) => {
    contador += 1;

    const ficha = FICHAS.find((uma) => uma.id === avaliacaoId);
    const registrado = comTaxa({
        ...pagamento,
        id: "pag-" + contador,
        avaliacaoId,
        paciente: ficha ? ficha.paciente.nome : "",
        recebidoEm: pagamento.recebidoEm || comoDia(new Date()),
        registradoPor: (quemEntrou() || {}).nome,
    });

    PAGAMENTOS.unshift(registrado);

    return espera(registrado);
};

export const estornarDeDemonstracao = (id, motivo) => {
    const pagamento = PAGAMENTOS.find((um) => um.id === id);

    if (pagamento) {
        pagamento.estornadoEm = new Date().toISOString();
        pagamento.estornoMotivo = motivo;
    }

    return espera({ ok: true });
};

/* O INVENTÁRIO */

const INSUMOS = [
    { id: "ins-1", nome: "Anestésico Mepivacaína 3%", categoria: "Anestesia", unidade: "tubete", minimo: 20, ativo: true },
    { id: "ins-2", nome: "Agulha gengival curta", categoria: "Anestesia", unidade: "unidade", minimo: 30, ativo: true },
    { id: "ins-3", nome: "Luva de procedimento M", categoria: "Descartáveis", unidade: "caixa", minimo: 4, ativo: true },
    { id: "ins-4", nome: "Sugador descartável", categoria: "Descartáveis", unidade: "unidade", minimo: 100, ativo: true },
    { id: "ins-5", nome: "Resina composta A2", categoria: "Restauração", unidade: "seringa", minimo: 3, ativo: true },
    { id: "ins-6", nome: "Ácido fosfórico 37%", categoria: "Restauração", unidade: "seringa", minimo: 2, ativo: true },
    { id: "ins-7", nome: "Fio de sutura 4-0", categoria: "Cirurgia", unidade: "envelope", minimo: 10, ativo: true },
    { id: "ins-8", nome: "Gaze estéril", categoria: "Descartáveis", unidade: "pacote", minimo: 15, ativo: true },
];

const MOVIMENTOS = [
    { id: "mov-1", insumoId: "ins-1", tipo: "entrada", quantidade: 50, motivo: "Compra do mês", autor: "DRA. CÉLIA", criadoEm: diasAtras(20) },
    { id: "mov-2", insumoId: "ins-1", tipo: "saida", quantidade: -34, motivo: "Usado no atendimento", autor: "DRA. CÉLIA", criadoEm: diasAtras(4), avaliacaoId: "dem-3", paciente: "Ana Clara Menezes" },
    { id: "mov-3", insumoId: "ins-2", tipo: "entrada", quantidade: 100, motivo: "Compra do mês", autor: "Recepção", criadoEm: diasAtras(20) },
    { id: "mov-4", insumoId: "ins-2", tipo: "saida", quantidade: -78, motivo: "Usado no atendimento", autor: "DRA. CÉLIA", criadoEm: diasAtras(2) },
    { id: "mov-5", insumoId: "ins-3", tipo: "entrada", quantidade: 10, motivo: "Compra do mês", autor: "Recepção", criadoEm: diasAtras(25) },
    { id: "mov-6", insumoId: "ins-3", tipo: "saida", quantidade: -4, motivo: "Usado no atendimento", autor: "DRA. CÉLIA", criadoEm: diasAtras(6) },
    { id: "mov-7", insumoId: "ins-4", tipo: "entrada", quantidade: 400, motivo: "Compra trimestral", autor: "Recepção", criadoEm: diasAtras(40) },
    { id: "mov-8", insumoId: "ins-4", tipo: "saida", quantidade: -160, motivo: "Usado no atendimento", autor: "DRA. CÉLIA", criadoEm: diasAtras(5) },
    { id: "mov-9", insumoId: "ins-5", tipo: "entrada", quantidade: 6, motivo: "Compra do mês", autor: "DRA. CÉLIA", criadoEm: diasAtras(30) },
    { id: "mov-10", insumoId: "ins-5", tipo: "saida", quantidade: -4, motivo: "Usado no atendimento", autor: "DRA. CÉLIA", criadoEm: diasAtras(3), avaliacaoId: "dem-4", paciente: "Roberto Carvalho Pinto" },
    { id: "mov-11", insumoId: "ins-6", tipo: "entrada", quantidade: 5, motivo: "Compra do mês", autor: "DRA. CÉLIA", criadoEm: diasAtras(30) },
    { id: "mov-12", insumoId: "ins-6", tipo: "saida", quantidade: -2, motivo: "Usado no atendimento", autor: "DRA. CÉLIA", criadoEm: diasAtras(7) },
    { id: "mov-13", insumoId: "ins-7", tipo: "entrada", quantidade: 24, motivo: "Compra do mês", autor: "Recepção", criadoEm: diasAtras(22) },
    { id: "mov-14", insumoId: "ins-7", tipo: "perda", quantidade: -2, motivo: "Embalagem violada", autor: "Recepção", criadoEm: diasAtras(8) },
    { id: "mov-15", insumoId: "ins-8", tipo: "entrada", quantidade: 40, motivo: "Compra do mês", autor: "Recepção", criadoEm: diasAtras(18) },
    { id: "mov-16", insumoId: "ins-8", tipo: "saida", quantidade: -27, motivo: "Usado no atendimento", autor: "DRA. CÉLIA", criadoEm: diasAtras(1) },
];

const saldoDe = (insumoId) =>
    MOVIMENTOS.filter((movimento) => movimento.insumoId === insumoId).reduce(
        (soma, movimento) => Math.round((soma + movimento.quantidade) * 1000) / 1000,
        0,
    );

const comSaldo = (insumo) => {
    const saldo = saldoDe(insumo.id);

    return { ...insumo, saldo, noMinimo: saldo <= insumo.minimo };
};

const semAcentoNem = (texto) => semAcento(texto).trim();

export const insumosDeDemonstracao = ({ busca, situacao } = {}) => {
    const termo = semAcentoNem(busca || "");

    const insumos = INSUMOS.map(comSaldo)
        .filter((insumo) => !termo || semAcento(insumo.nome).includes(termo))
        .filter((insumo) => situacao !== "baixos" || (insumo.noMinimo && insumo.ativo))
        .filter((insumo) => situacao !== "ativos" || insumo.ativo)
        .sort(
            (um, outro) =>
                Number(outro.noMinimo && outro.ativo) - Number(um.noMinimo && um.ativo) ||
                um.nome.localeCompare(outro.nome, "pt-BR"),
        );

    return espera({ insumos });
};

export const alertasDeDemonstracao = () => {
    const insumos = INSUMOS.map(comSaldo)
        .filter((insumo) => insumo.ativo && insumo.noMinimo)
        .sort((um, outro) => um.saldo - um.minimo - (outro.saldo - outro.minimo));

    return espera({ quantos: insumos.length, insumos });
};

export const cadastrarInsumoDeDemonstracao = (insumo) => {
    contador += 1;

    const repetido = INSUMOS.some(
        (um) => semAcento(um.nome) === semAcento(insumo.nome || ""),
    );

    if (repetido) {
        return Promise.reject(new Error("Já existe um insumo com esse nome."));
    }

    const criado = {
        id: "ins-" + contador,
        nome: insumo.nome,
        categoria: insumo.categoria || null,
        unidade: insumo.unidade || "unidade",
        minimo: Number(insumo.minimo) || 0,
        ativo: true,
    };

    INSUMOS.push(criado);

    return espera(comSaldo(criado));
};

export const atualizarInsumoDeDemonstracao = (id, mudancas) => {
    const insumo = INSUMOS.find((um) => um.id === id);

    if (insumo) {
        Object.assign(insumo, {
            nome: mudancas.nome ?? insumo.nome,
            categoria: mudancas.categoria ?? insumo.categoria,
            unidade: mudancas.unidade ?? insumo.unidade,
            minimo: Number(mudancas.minimo ?? insumo.minimo),
            ativo: mudancas.ativo === undefined ? insumo.ativo : Boolean(mudancas.ativo),
        });
    }

    return espera({ ok: true });
};

export const moverInsumoDeDemonstracao = (id, movimento) => {
    contador += 1;

    const saldo = saldoDe(id);
    let quantidade = 0;

    if (movimento.tipo === "ajuste") {
        quantidade = Math.round((Number(movimento.contagem) - saldo) * 1000) / 1000;

        if (quantidade === 0) {
            return Promise.reject(new Error("A contagem bate com o saldo: não há o que ajustar."));
        }
    } else {
        const pedida = Number(movimento.quantidade);

        quantidade = movimento.tipo === "entrada" ? pedida : -pedida;
    }

    MOVIMENTOS.push({
        id: "mov-" + contador,
        insumoId: id,
        tipo: movimento.tipo,
        quantidade,
        motivo: movimento.motivo || null,
        autor: (quemEntrou() || {}).nome,
        criadoEm: new Date().toISOString(),
    });

    return espera({ ok: true, saldo: Math.round((saldo + quantidade) * 1000) / 1000 });
};

export const extratoDeDemonstracao = (id) => {
    const insumo = INSUMOS.find((um) => um.id === id);

    return espera({
        insumo: insumo ? comSaldo(insumo) : null,
        movimentos: MOVIMENTOS.filter((movimento) => movimento.insumoId === id)
            .slice()
            .reverse(),
    });
};

const consumoDe = (avaliacaoId) =>
    MOVIMENTOS.filter((movimento) => movimento.avaliacaoId === avaliacaoId).map((movimento) => {
        const insumo = INSUMOS.find((um) => um.id === movimento.insumoId) || {};

        return {
            id: movimento.id,
            insumoId: movimento.insumoId,
            nome: insumo.nome,
            unidade: insumo.unidade,
            quantidade: Math.abs(movimento.quantidade),
            criadoEm: movimento.criadoEm,
        };
    });

export const consumirDeDemonstracao = (avaliacaoId, itens) => {
    itens.forEach((item) => {
        contador += 1;

        MOVIMENTOS.push({
            id: "mov-" + contador,
            insumoId: item.insumoId,
            tipo: "saida",
            quantidade: -Number(item.quantidade),
            motivo: "Usado no atendimento",
            autor: (quemEntrou() || {}).nome,
            avaliacaoId,
            criadoEm: new Date().toISOString(),
        });
    });

    return espera({ ok: true, lancados: itens.length });
};

/* PRECIFICAÇÃO DE MENTIRA

   Os mesmos números da conta de verdade, só que fixos: custos fixos de uma
   clínica pequena, 112 horas de cadeira, e quatro procedimentos com ficha
   técnica. Serve para a tela mostrar o raciocínio antes de a clínica
   preencher os dados dela. */

const CUSTOS_FIXOS = [
    { id: "cf-1", nome: "Aluguel", categoria: "Instalações", valor: 280000, ativo: true },
    { id: "cf-2", nome: "Energia e água", categoria: "Instalações", valor: 62000, ativo: true },
    { id: "cf-3", nome: "Internet e telefone", categoria: "Instalações", valor: 18000, ativo: true },
    { id: "cf-4", nome: "Secretária", categoria: "Pessoal", valor: 165000, ativo: true },
    { id: "cf-5", nome: "Contador", categoria: "Serviços", valor: 45000, ativo: true },
    { id: "cf-6", nome: "Autoclave e manutenção", categoria: "Equipamentos", valor: 30000, ativo: true },
];

let PARAMETROS = {
    horasClinicas: 112,
    prolabore: 800000,
    margem: 15,
    impostos: 6,
    vigenteDesde: comoDia(new Date()),
};

const PROCEDIMENTOS = [
    { id: "pr-1", nome: "Clareamento", duracao: 60, preco: 120000, ativo: true, custoInsumos: 8500 },
    { id: "pr-2", nome: "Faceta em resina", duracao: 180, preco: 320000, ativo: true, custoInsumos: 42000 },
    { id: "pr-3", nome: "Restauração", duracao: 50, preco: 38000, ativo: true, custoInsumos: 4200 },
    { id: "pr-4", nome: "Limpeza e profilaxia", duracao: 40, preco: 22000, ativo: true, custoInsumos: 1800 },
];

const taxaMediaDaDemonstracao = () => {
    const valendo = PAGAMENTOS.filter((pagamento) => !pagamento.estornadoEm);
    const bruto = valendo.reduce((soma, pagamento) => soma + pagamento.valor, 0);
    const taxa = valendo.reduce((soma, pagamento) => soma + pagamento.taxa, 0);

    return bruto ? Math.round((taxa / bruto) * 10000) / 100 : 0;
};

const mesaDeDemonstracao = () => {
    const custosFixos = CUSTOS_FIXOS.filter((custo) => custo.ativo).reduce(
        (soma, custo) => soma + custo.valor,
        0,
    );
    const custoMensal = custosFixos + PARAMETROS.prolabore;
    const custoDaHora = Math.round(custoMensal / PARAMETROS.horasClinicas);
    const taxa = taxaMediaDaDemonstracao();
    const retido = (PARAMETROS.margem + PARAMETROS.impostos + taxa) / 100;

    const procedimentos = PROCEDIMENTOS.map((procedimento) => {
        const custoTempo = Math.round((custoDaHora / 60) * procedimento.duracao);
        const custo = procedimento.custoInsumos + custoTempo;
        const retidoNoPreco = Math.round(
            (procedimento.preco * (PARAMETROS.impostos + taxa)) / 100,
        );
        const sobra = procedimento.preco - custo - retidoNoPreco;

        return {
            ...procedimento,
            custoTempo,
            custo,
            precoSugerido: retido >= 1 ? null : Math.round(custo / (1 - retido)),
            sobra,
            margem: procedimento.preco
                ? Math.round((sobra / procedimento.preco) * 1000) / 10
                : null,
            porHora: Math.round((sobra * 60) / procedimento.duracao),
            insumosSemPreco: [],
        };
    });

    return {
        parametros: PARAMETROS,
        custosFixos,
        prolabore: PARAMETROS.prolabore,
        custoMensal,
        custoDaHora,
        custoDoMinuto: custoDaHora / 60,
        taxaMedia: taxa,
        procedimentos,
    };
};

export const precificacaoDeDemonstracao = () => espera(mesaDeDemonstracao());

export const catalogoDeDemonstracao = () =>
    espera({
        procedimentos: PROCEDIMENTOS.filter((procedimento) => procedimento.ativo).map(
            ({ id, nome, duracao, preco }) => ({ id, nome, duracao, preco }),
        ),
    });

export const custosDeDemonstracao = () =>
    espera({
        custos: CUSTOS_FIXOS.map((custo) => ({ ...custo })),
        total: CUSTOS_FIXOS.filter((custo) => custo.ativo).reduce(
            (soma, custo) => soma + custo.valor,
            0,
        ),
    });

export const salvarCustoDeDemonstracao = (custo) => {
    contador += 1;

    const criado = {
        id: "cf-" + contador,
        nome: custo.nome,
        categoria: custo.categoria || null,
        valor: Number(custo.valor) || 0,
        ativo: true,
    };

    CUSTOS_FIXOS.push(criado);

    return espera(criado);
};

export const removerCustoDeDemonstracao = (id) => {
    const custo = CUSTOS_FIXOS.find((um) => um.id === id);

    if (custo) {
        custo.ativo = false;
    }

    return espera({ ok: true });
};

export const salvarParametrosDeDemonstracao = (parametros) => {
    PARAMETROS = {
        horasClinicas: Number(parametros.horasClinicas) || PARAMETROS.horasClinicas,
        prolabore: Number(parametros.prolabore) || 0,
        margem: Number(parametros.margem) || 0,
        impostos: Number(parametros.impostos) || 0,
        vigenteDesde: comoDia(new Date()),
    };

    return espera({ ...PARAMETROS });
};

export const salvarProcedimentoDeDemonstracao = (procedimento) => {
    const existente = PROCEDIMENTOS.find((um) => um.id === procedimento.id);

    if (existente) {
        Object.assign(existente, {
            nome: procedimento.nome,
            duracao: Number(procedimento.duracao),
            preco: Number(procedimento.preco),
            ativo: procedimento.ativo === undefined ? existente.ativo : Boolean(procedimento.ativo),
        });

        return espera({ ok: true });
    }

    contador += 1;

    const criado = {
        id: "pr-" + contador,
        nome: procedimento.nome,
        duracao: Number(procedimento.duracao) || 40,
        preco: Number(procedimento.preco) || 0,
        ativo: true,
        custoInsumos: 0,
    };

    PROCEDIMENTOS.push(criado);

    return espera(criado);
};

/* A rentabilidade sai dos mesmos recebimentos da demonstração, rateados
   pelos procedimentos como o servidor faz. */
export const rentabilidadeDeDemonstracao = () => {
    const mesa = mesaDeDemonstracao();
    const recebido = PAGAMENTOS.filter((pagamento) => !pagamento.estornadoEm).reduce(
        (soma, pagamento) => soma + pagamento.valor,
        0,
    );

    /* Distribuição de mentira, mas coerente: o que entrou no mês dividido
       entre os procedimentos na proporção do preço de tabela. */
    const tabela = mesa.procedimentos.reduce((soma, item) => soma + item.preco, 0);

    const procedimentos = mesa.procedimentos
        .map((item, posicao) => {
            const vezes = [4, 2, 6, 9][posicao] || 1;
            const receita = Math.round((recebido * item.preco) / tabela);
            const custo = item.custo * vezes;
            const margem = receita - custo;
            const minutos = item.duracao * vezes;

            return {
                id: item.id,
                nome: item.nome,
                vezes,
                duracao: item.duracao,
                orcado: item.preco * vezes,
                receita,
                custo,
                margem,
                margemPercentual: receita ? Math.round((margem / receita) * 1000) / 10 : null,
                margemPorHora: Math.round((margem * 60) / minutos),
                horasOcupadas: Math.round((minutos / 60) * 10) / 10,
            };
        })
        .sort((um, outro) => outro.receita - um.receita);

    const porHora = [...procedimentos].sort(
        (um, outro) => outro.margemPorHora - um.margemPorHora,
    );

    return espera({
        periodo: { de: comoDia(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), ate: comoDia(new Date()) },
        custoDaHora: mesa.custoDaHora,
        taxaMedia: mesa.taxaMedia,
        total: {
            receita: procedimentos.reduce((soma, item) => soma + item.receita, 0),
            custo: procedimentos.reduce((soma, item) => soma + item.custo, 0),
            margem: procedimentos.reduce((soma, item) => soma + item.margem, 0),
        },
        procedimentos,
        paraConteudo: {
            criadoEm: new Date().toISOString(),
            criterio: "margem por hora de cadeira",
            destaques: porHora.slice(0, 3).map((item) => ({
                procedimento: item.nome,
                margemPorHora: item.margemPorHora,
                margemPercentual: item.margemPercentual,
                vezes: item.vezes,
            })),
            revisar: porHora
                .filter((item) => item.margem <= 0)
                .map((item) => ({
                    procedimento: item.nome,
                    margem: item.margem,
                    motivo: "custo acima do recebido no período",
                })),
        },
    });
};

/* ADMINISTRAÇÃO DE MENTIRA

   Três pessoas, um agente e uma chave que se comporta como a de verdade:
   aparece uma vez, some, e revogar mata na hora. */

const USUARIOS = [
    { id: "us-1", nome: "DRA. CÉLIA", email: "adm@adm.com", tipo: "pessoa", ativo: true, papeis: ["admin", "dentista"] },
    { id: "us-2", nome: "Recepção", email: "recepcao@harmonia.com", tipo: "pessoa", ativo: true, papeis: ["recepcao"] },
    { id: "us-3", nome: "Financeiro", email: "financeiro@harmonia.com", tipo: "pessoa", ativo: true, papeis: ["financeiro"] },
    { id: "ag-1", nome: "Automação n8n", email: null, tipo: "agente", ativo: true, papeis: ["agente"] },
];

const PAPEIS = [
    { codigo: "admin", nome: "Administrador", descricao: "Cadastra usuários e define papéis. Sozinho, não vê prontuário." },
    { codigo: "agente", nome: "Agente de IA", descricao: "Extensão da doutora na automação: enxerga e opera o ERP inteiro, com a chave sob a guarda dela." },
    { codigo: "dentista", nome: "Dentista", descricao: "Atende, escreve o parecer e o orçamento, registra o aceite." },
    { codigo: "financeiro", nome: "Financeiro", descricao: "Cuida do dinheiro: recebimentos, taxas e relatórios. Não abre prontuário." },
    { codigo: "recepcao", nome: "Recepção", descricao: "Cuida da agenda e do comparecimento. Não vê anamnese nem parecer." },
];

const CHAVES = [
    { id: "ch-1", usuarioId: "ag-1", prefixo: "hof_7Kd2mX", criadaEm: diasAtras(30), usadaEm: diasAtras(0), revogadaEm: null },
];

const chaveNova = () => {
    /* Nada de criptografia aqui: é demonstração. A de verdade nasce de 32
       bytes aleatórios no servidor, em agenteService.js. */
    const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let corpo = "";

    for (let posicao = 0; posicao < 43; posicao += 1) {
        corpo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
    }

    return "hof_" + corpo;
};

export const usuariosDeDemonstracao = () =>
    espera({ usuarios: USUARIOS.map((usuario) => ({ ...usuario })) });

export const papeisDeDemonstracao = () => espera({ papeis: PAPEIS.map((papel) => ({ ...papel })) });

export const criarUsuarioDeDemonstracao = (usuario) => {
    contador += 1;

    const criado = {
        id: "us-" + contador,
        nome: usuario.nome,
        email: usuario.email,
        tipo: "pessoa",
        ativo: true,
        papeis: usuario.papeis || [],
    };

    USUARIOS.push(criado);

    return espera(criado);
};

export const atualizarUsuarioDeDemonstracao = (id, mudancas) => {
    const usuario = USUARIOS.find((um) => um.id === id);

    if (usuario) {
        if ("ativo" in mudancas) {
            usuario.ativo = Boolean(mudancas.ativo);
        }

        if (mudancas.papeis) {
            usuario.papeis = mudancas.papeis;
        }
    }

    return espera({ ok: true });
};

export const agentesDeDemonstracao = () =>
    espera({ agentes: USUARIOS.filter((usuario) => usuario.tipo === "agente").map((um) => ({ ...um })) });

export const criarAgenteDeDemonstracao = (nome) => {
    contador += 1;

    const chave = chaveNova();
    const usuario = {
        id: "ag-" + contador,
        nome,
        email: null,
        tipo: "agente",
        ativo: true,
        papeis: ["agente"],
    };

    USUARIOS.push(usuario);
    CHAVES.push({
        id: "ch-" + contador,
        usuarioId: usuario.id,
        prefixo: chave.slice(0, 10),
        criadaEm: new Date().toISOString(),
        usadaEm: null,
        revogadaEm: null,
    });

    return espera({ usuario, chave });
};

export const chavesDeDemonstracao = (usuarioId) =>
    espera({
        chaves: CHAVES.filter((chave) => chave.usuarioId === usuarioId).map((chave) => ({ ...chave })),
    });

export const emitirChaveDeDemonstracao = (usuarioId) => {
    contador += 1;

    const chave = chaveNova();

    CHAVES.push({
        id: "ch-" + contador,
        usuarioId,
        prefixo: chave.slice(0, 10),
        criadaEm: new Date().toISOString(),
        usadaEm: null,
        revogadaEm: null,
    });

    return espera({ chave, prefixo: chave.slice(0, 10) });
};

export const revogarChaveDeDemonstracao = (id) => {
    const chave = CHAVES.find((uma) => uma.id === id);

    if (chave) {
        chave.revogadaEm = new Date().toISOString();
    }

    return espera({ ok: true });
};

export const googleDeDemonstracao = () =>
    espera({
        ligado: true,
        conectada: true,
        conta: "clinica@harmoniaorofacial.com.br",
        conectadaEm: diasAtras(45),
        email: true,
        respondendo: true,
    });
