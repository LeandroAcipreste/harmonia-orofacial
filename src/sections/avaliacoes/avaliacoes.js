import { AVALIACOES, RESUMO } from "./avaliacoes-dados.js";

/* AS AVALIAÇÕES

   Um mosaico que se monta com a rolagem: cada depoimento começa escondido
   e, quando a rolagem chega nele, entra vindo do lado em que vai ficar e
   assenta no lugar, como peça de quebra-cabeça.

   O que roda, e quando:
   - uma leitura de posição, uma vez só, logo depois de montar o mosaico,
     para saber de que lado cada peça vem;
   - dois IntersectionObserver: um monta a peça quando ela entra na tela,
     o outro desmonta quando ela sai, para o quebra-cabeça se montar de
     novo a cada volta. Nenhum ouvinte de rolagem, nenhum trabalho por
     quadro, nenhum ScrollTrigger: a home já está no limite. */

const CLASSE_ENCAIXADA = "esta-encaixada";

/* Quanto a peça se afasta do lugar antes de entrar. A da ponta esquerda
   vem da esquerda, a da ponta direita vem da direita, a do meio sobe. */
const AFASTAMENTO_LATERAL = 4.5;
const AFASTAMENTO_VERTICAL = 3;
const GIRO_MAXIMO = 7;

/* Peças que entram juntas (a mesma fileira chegando na tela) não aparecem
   de uma vez: uma depois da outra, com este intervalo. */
const INTERVALO_ENTRE_PECAS = 0.09;

/* A peça começa a entrar um pouco antes de estar toda na tela, para já
   estar assentada quando o olho chega nela. */
const MARGEM_DE_ENTRADA = "0px 0px -8% 0px";

/* E só se desmonta quando saiu por inteiro. Se saísse com a mesma margem
   da entrada, rolando para cima a pessoa veria a peça voar para fora na
   borda de baixo da tela. */
const MARGEM_DE_SAIDA = "0px";

/* A PRÉVIA

   Com ?previa=avaliacoes na URL e a lista vazia, a seção aparece com cards
   de marcação, para conferir tamanho e lugar antes de os textos chegarem.
   É texto de marcação, e não depoimento: nenhuma frase é posta na boca de
   paciente nenhum. Sem o parâmetro, lista vazia esconde a seção. */
const MARCACAO = Array.from({ length: 10 }, () => ({
    nome: "Nome Sobrenome",
    quando: "há X meses",
    texto:
        "Aqui entra, palavra por palavra, o texto de uma das avaliações do Google. " +
        "Este é só o espaço reservado para ver o tamanho do card.",
}));

const emPrevia = () => {
    try {
        return new URLSearchParams(location.search).get("previa") === "avaliacoes";
    } catch (falha) {
        return false;
    }
};

/* "Maria Souza Andrade" vira "Maria S.". A avaliação é pública no Google,
   mas republicar o nome inteiro no site da clínica não acrescenta nada ao
   depoimento e expõe o paciente mais do que ele escolheu. */
const nomeCurto = (nome) => {
    const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);

    if (partes.length < 2) {
        return partes[0] || "Paciente";
    }

    return partes[0] + " " + partes[partes.length - 1][0].toUpperCase() + ".";
};

const inicialDe = (nome) => (String(nome || "").trim()[0] || "P").toUpperCase();

const montarCard = (modelo, avaliacao) => {
    const card = modelo.content.firstElementChild.cloneNode(true);

    card.querySelector(".avaliacao__texto").textContent = avaliacao.texto;
    card.querySelector(".avaliacao__nome").textContent = nomeCurto(avaliacao.nome);
    card.querySelector(".avaliacao__inicial").textContent = inicialDe(avaliacao.nome);

    /* "Google · 2 meses atrás", ou só "Google" quando o print não trouxe
       a data. A origem fica à vista: é ela que dá peso ao depoimento. */
    card.querySelector(".avaliacao__origem").textContent = avaliacao.quando
        ? "Google · " + avaliacao.quando
        : "Google";

    return card;
};

export const initAvaliacoes = () => {
    const secao = document.querySelector(".avaliacoes");

    if (!secao) {
        return;
    }

    const lista = AVALIACOES.length ? AVALIACOES : emPrevia() ? MARCACAO : [];

    /* Sem avaliação real, sem seção. A home não vai ao ar com texto de
       exemplo no lugar da palavra de um paciente. */
    if (!lista.length) {
        secao.hidden = true;
        return;
    }

    secao.hidden = false;

    const nota = secao.querySelector(".avaliacoes__nota");
    const total = secao.querySelector(".avaliacoes__total");

    if (nota) {
        nota.textContent = RESUMO.nota;
    }

    if (total) {
        total.textContent = "Nota máxima em " + RESUMO.total + " avaliações no Google";
    }

    const mosaico = secao.querySelector(".avaliacoes__mosaico");
    const modelo = document.querySelector("#modelo-avaliacao");

    if (!mosaico || !modelo) {
        return;
    }

    const fila = document.createDocumentFragment();

    lista.forEach((avaliacao) => fila.appendChild(montarCard(modelo, avaliacao)));

    mosaico.appendChild(fila);

    const pecas = Array.from(mosaico.children);

    apontarDeOndeVem(mosaico, pecas);
    encaixarComARolagem(pecas);
};

/* DE ONDE CADA PEÇA VEM

   Uma leitura de layout, uma vez: onde cada peça ficou no mosaico, em
   relação ao centro dele. De -1 (coluna da esquerda) a 1 (da direita).
   O giro alterna o sentido de uma peça para a outra, para as peças não
   entrarem todas inclinadas iguais, que é o que dá cara de quebra-cabeça
   e não de lista. */
const apontarDeOndeVem = (mosaico, pecas) => {
    const caixa = mosaico.getBoundingClientRect();
    const centro = caixa.left + caixa.width / 2;
    const meiaLargura = caixa.width / 2 || 1;

    pecas.forEach((peca, posicao) => {
        const lugar = peca.getBoundingClientRect();
        const lado = Math.max(-1, Math.min(1, (lugar.left + lugar.width / 2 - centro) / meiaLargura));
        const sentido = posicao % 2 === 0 ? 1 : -1;

        peca.style.setProperty("--de-x", (lado * AFASTAMENTO_LATERAL).toFixed(2) + "rem");
        peca.style.setProperty(
            "--de-y",
            (AFASTAMENTO_VERTICAL * (1 - Math.abs(lado) * 0.4)).toFixed(2) + "rem",
        );
        peca.style.setProperty(
            "--de-giro",
            (sentido * GIRO_MAXIMO * (0.45 + Math.abs(lado) * 0.55)).toFixed(2) + "deg",
        );
    });
};

/* A MONTAGEM, A CADA VOLTA

   O IntersectionObserver entrega junto a posição de cada peça que entrou,
   então escalonar não exige ler layout de novo.

   Quem monta e quem desmonta são observadores diferentes, com margens
   diferentes: montar um pouco antes de a peça estar à vista, desmontar só
   depois de ela sumir inteira. Assim a desmontagem acontece sempre fora
   da tela, e a pessoa só vê a montagem. */
const encaixarComARolagem = (pecas) => {
    if (typeof IntersectionObserver === "undefined") {
        pecas.forEach((peca) => peca.classList.add(CLASSE_ENCAIXADA));
        return;
    }

    const montar = new IntersectionObserver(
        (entradas) => {
            entradas
                .filter((entrada) => entrada.isIntersecting)
                .sort(
                    (uma, outra) =>
                        uma.boundingClientRect.top - outra.boundingClientRect.top ||
                        uma.boundingClientRect.left - outra.boundingClientRect.left,
                )
                .forEach((entrada, ordem) => {
                    entrada.target.style.setProperty(
                        "--atraso",
                        (ordem * INTERVALO_ENTRE_PECAS).toFixed(2) + "s",
                    );
                    entrada.target.classList.add(CLASSE_ENCAIXADA);
                });
        },
        { rootMargin: MARGEM_DE_ENTRADA },
    );

    const desmontar = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    return;
                }

                /* Sem atraso na volta ao ponto de partida: fora da tela,
                   ninguém vê, e a peça fica pronta para a próxima entrada. */
                entrada.target.style.setProperty("--atraso", "0s");
                entrada.target.classList.remove(CLASSE_ENCAIXADA);
            });
        },
        { rootMargin: MARGEM_DE_SAIDA },
    );

    pecas.forEach((peca) => {
        montar.observe(peca);
        desmontar.observe(peca);
    });
};
