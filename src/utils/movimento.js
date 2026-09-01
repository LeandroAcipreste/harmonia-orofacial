/*
 * A preferência por menos movimento, num lugar só — e uma exceção para a
 * máquina de quem está construindo o site.
 *
 * O site obedece a `prefers-reduced-motion`, e deve mesmo. O problema é
 * que quem tem essa preferência ligada no sistema não consegue ver o
 * próprio trabalho: o letreiro para, o recolhimento não monta, e a tela
 * fica indistinguível de uma página quebrada.
 *
 * Por isso a regra aqui não é só a preferência. Em `localhost` — e só ali
 * — as animações rodam de qualquer jeito. Fora dali, quem manda é o
 * sistema de quem visita, sem exceção.
 *
 * Quem quiser ver o comportamento real, com o movimento contido, abre com
 * `?movimento=auto`; quem estiver publicado e quiser destravar mesmo
 * assim, `?movimento=sempre`. As duas escolhas ficam guardadas.
 *
 * A regra vale só para o JavaScript. As regras de CSS dentro de
 * `@media (prefers-reduced-motion: reduce)` continuam valendo, porque
 * media query não se desliga por script — o que o navegador tem para isso
 * é a emulação do DevTools. Na prática os dois efeitos grandes daqui, o
 * letreiro e o recolhimento, são escritos pelo GSAP em estilo embutido e
 * passam por cima dessas regras; o que continua contido são entradas
 * menores, como o deslize do texto ao aparecer.
 */

const CHAVE = "harmonia:movimento";
const SEMPRE = "sempre";
const AUTOMATICO = "auto";

/* Endereços que só existem na máquina de quem desenvolve. Um site
   publicado nunca cai aqui. */
const NA_MAQUINA_DE_QUEM_FAZ =
    window.location.protocol === "file:" ||
    ["localhost", "127.0.0.1", "[::1]", "::1", ""].includes(window.location.hostname);

/*
 * Lê a escolha uma vez, no carregamento, e guarda o que achou.
 *
 * Guardar é o que faz a chave servir: sem isso ela se perderia no
 * primeiro link clicado e teria que ser redigitada a cada página. O
 * acesso vai protegido porque em janela anônima ele lança em vez de
 * devolver vazio, e uma chave de conveniência não pode derrubar o site.
 */
const lerEscolha = () => {
    const guardar = (valor) => {
        try {
            localStorage.setItem(CHAVE, valor);
        } catch (erro) {
            /* Sem onde guardar; a escolha vale só para esta página. */
        }
    };

    const daUrl = new URLSearchParams(window.location.search).get("movimento");

    if (daUrl === SEMPRE || daUrl === AUTOMATICO) {
        guardar(daUrl);
        return daUrl;
    }

    try {
        return localStorage.getItem(CHAVE);
    } catch (erro) {
        return null;
    }
};

const escolha = lerEscolha();

/*
 * A ordem importa: uma escolha explícita vence o palpite do ambiente, nos
 * dois sentidos. `?movimento=auto` existe justamente para conseguir ver,
 * em localhost, o que quem tem a preferência ligada vê de verdade.
 */
export const movimentoDestravado =
    escolha === SEMPRE || (escolha !== AUTOMATICO && NA_MAQUINA_DE_QUEM_FAZ);

/* Nome antigo, mantido para o diagnóstico. */
export const movimentoForcado = movimentoDestravado;

export const motivoDoMovimento =
    escolha === SEMPRE
        ? "destravado por ?movimento=sempre"
        : escolha === AUTOMATICO
          ? "obedecendo ao sistema por ?movimento=auto"
          : NA_MAQUINA_DE_QUEM_FAZ
            ? "destravado na transição por estar em localhost"
            : "obedecendo ao sistema";

/*
 * A preferência crua, como o sistema a declara.
 *
 * Quem lê isto — o preloader, a lista de procedimentos, as partículas da
 * dobra dos cards — obedece sempre, inclusive em localhost. O
 * destravamento não passa por aqui de propósito: ele existe para uma
 * dobra que não dava para ver sendo construída, e não para mudar como o
 * resto da página se comporta na máquina de quem a faz. Aplicado a tudo,
 * ele acendia a cintilação do glitter e a correnteza da poeira, que
 * ninguém tinha pedido para mexer.
 */
export const prefereMovimentoReduzido = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
