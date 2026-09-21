import { API } from "../core/config.js";

/* A conversa com a API, num lugar só.

   O `pedir` de atendimento.js e o de exames.js são este mesmo código,
   escrito duas vezes antes deste arquivo existir. As telas novas usam
   daqui; migrar as duas antigas é uma limpeza para outro dia, e sem pressa,
   porque elas funcionam.

   Três decisões moram aqui:

   - 401 recarrega a página. A sessão morreu, e a guarda de rota manda para
     o login sozinha. Tentar consertar no meio de um clique só confunde.
   - A mensagem do servidor ganha da nossa. "Este pagamento já foi
     estornado" diz mais do que "não foi possível estornar".
   - Falha de rede tem recado próprio: não é erro do sistema, é o wi-fi da
     clínica. */

const SEM_CONEXAO = "A conexão falhou. Verifique a internet e tente de novo.";

export const pedir = async (rota, opcoes, recado) => {
    let resposta = null;

    try {
        resposta = await fetch(API.base + rota, { credentials: "include", ...opcoes });
    } catch (falha) {
        throw new Error(SEM_CONEXAO);
    }

    if (resposta.status === 401) {
        location.reload();

        throw new Error(recado);
    }

    let corpo = null;

    try {
        corpo = await resposta.json();
    } catch (falha) {
        corpo = null;
    }

    if (!resposta.ok) {
        throw new Error((corpo && corpo.erro) || recado);
    }

    return corpo;
};

export const enviar = (rota, corpo, recado, metodo = "POST") =>
    pedir(
        rota,
        {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo),
        },
        recado,
    );

/* Query string sem parâmetro vazio: "?de=&ate=" faria o servidor achar que
   a pessoa pediu período nenhum, que é diferente de não ter pedido. */
export const comBusca = (rota, parametros = {}) => {
    const busca = new URLSearchParams();

    Object.entries(parametros).forEach(([chave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== "") {
            busca.set(chave, String(valor));
        }
    });

    const texto = busca.toString();

    return texto ? rota + "?" + texto : rota;
};
