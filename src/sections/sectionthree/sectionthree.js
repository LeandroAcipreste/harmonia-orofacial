/* Destaques: cada card percorre procedimento → antes → depois com a rolagem. */

import { ligarBrilhoDoCursor } from "../../components/shellcard/shellcard.js";
import { prefereMovimentoReduzido } from "../../utils/movimento.js";

/* Alturas de viewport de rolagem por card. Define o ritmo da sequência. */
const ROLAGEM_POR_CARD = 0.9;

/* Uma tela a mais de rolagem, só para o desdobramento acontecer. */
const ROLAGEM_DA_TELA = 1;

/*
 * Estado deitado do desdobramento, um só para os dois casos: o painel no
 * desktop e cada card no celular. `rotateX(90deg)` é a peça exatamente de
 * perfil, invisível; o `scaleX` estreito dá a impressão de que ela estava
 * dobrada e se abre ao subir; o `yPercent` faz ela chegar de baixo.
 *
 * Vem do JS, e não do CSS, para os cards ficarem visíveis quando o
 * JavaScript não roda.
 *
 * A perspectiva não está aqui: ela é do elemento pai, em CSS — `.s3` para
 * o painel, `.s3__linha` para o card. Assim os dois usam o mesmo modelo de
 * projeção, e não uma perspectiva de parente e outra de peça.
 */
const DEITADO = { rotateX: 90, scaleX: 0.44, yPercent: 44, opacity: 0 };
const DE_FRENTE = { rotateX: 0, scaleX: 1, yPercent: 0, opacity: 1 };

/* Unidades da timeline gastas no desdobramento. */
const ABERTURA = 2.2;
const ASSENTA = 0.5;

/* Prender a seção custa quase quatro telas de rolagem, o que pesa demais
   num aparelho pequeno. A partir daqui a dobra fica presa; abaixo, a
   sequência corre enquanto a seção atravessa a tela. */
const CONSULTA_PRESA = "(min-width: 768px)";
const CONSULTA_SOLTA = "(max-width: 767px)";

/*
 * Respiro das pontas da sequência solta, nas mesmas unidades da timeline
 * do card. Na entrada, é o tempo em que o nome do procedimento fica
 * parado na tela antes de a primeira foto trocar — sem ele o card já
 * chega trocando, e ninguém sabe do que aquele antes e depois é. Na
 * saída, é o tempo em que o depois permanece antes de o card subir.
 */
const RESPIRO_ENTRADA = 0.9;
const RESPIRO_SAIDA = 0.7;

/* Unidades da timeline de um card: troca de etapa e respiro entre elas. */
const TRANSICAO = 1;
const PAUSA = 0.6;

const ESCALA_ENTRADA = 1.06;
const ESCALA_SAIDA = 0.94;

export const initSectionThree = () => {
    const secao = document.querySelector(".s3");

    if (!secao) {
        return;
    }

    carregarFundo(secao);

    ligarBrilhoDoCursor(secao.querySelectorAll(".shell-card"));

    /*
     * A revelação em desfoque que existia aqui saiu junto com o CSS dela.
     * Ela e o desdobramento animavam `opacity` e `transform` do mesmo
     * card, e o GSAP escreve em linha, que ganha da folha: era sempre o
     * desdobramento que valia. Uma entrada só, e é essa.
     */
    ligarSequencia(secao);
};

/*
 * Só a poeira em suspensão. A chapa de glitter que vinha junto saiu: era
 * uma malha cobrindo o quadro inteiro com mistura ligada, e numa placa
 * integrada isso disputa cada quadro com a rolagem.
 *
 * Entra por import dinâmico pelo motivo de sempre: o three.js pesa 655 kB
 * e os cards não podem esperar por ele. Falhando qualquer etapa, a dobra
 * cai na foto do CSS.
 *
 * O canvas está dentro do `sticky` de 100vh, então ele tem sempre o
 * tamanho da tela, e não o da dobra inteira, que no celular passa de dois
 * mil e quinhentos pixels.
 */
const carregarFundo = (secao) => {
    const canvas = secao.querySelector("#s3-gl");

    if (!canvas) {
        return;
    }

    const semGl = () => secao.classList.add("is-sem-gl");

    import("../../three/heroGlitter.js")
        .then(({ iniciarHeroGlitter }) =>
            iniciarHeroGlitter(canvas, {
                reduzido: prefereMovimentoReduzido(),
                superficie: false,
            })
        )
        .then((assumiu) => {
            if (!assumiu) {
                semGl();
            }
        })
        .catch(semGl);
};

/*
 * A rolagem percorre uma timeline mestre. Cada card entra nela na posição
 * ">", ou seja, no fim do card anterior: um card completa procedimento →
 * antes → depois antes de o seguinte começar. É isso que faz a troca
 * acontecer um de cada vez.
 *
 * `scrub` amarra o progresso à rolagem real, o que faz o caminho de volta
 * funcionar sozinho. Nenhum listener de wheel.
 *
 * O que muda entre telas é só onde a sequência acontece: presa na dobra
 * no desktop, correndo com a página no celular. O `matchMedia` do GSAP
 * desfaz sozinho o que criou quando a consulta deixa de valer.
 */
const ligarSequencia = (secao) => {
    const cards = Array.from(secao.querySelectorAll(".s3__card"));

    if (!cards.length) {
        return;
    }

    /* Sem GSAP a seção continua legível, só mostra o procedimento parado. */
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    const consulta = gsap.matchMedia();

    consulta.add(CONSULTA_PRESA, () => {
        secao.classList.add("js-sequencia");

        montarMestre(secao, cards, {
            start: "top top",
            end: () =>
                `+=${window.innerHeight * (ROLAGEM_POR_CARD * cards.length + ROLAGEM_DA_TELA)}`,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
        });

        return () => secao.classList.remove("js-sequencia");
    });

    /*
     * Solto, cada card tem o próprio gatilho, ancorado nele mesmo.
     *
     * Uma timeline só para a seção inteira, que era o que havia aqui,
     * encadeia as quatro sequências em fila e as espalha pela altura da
     * seção. Com os cards lado a lado isso funcionava, porque todos
     * estavam na tela ao mesmo tempo. Empilhados em coluna, não: a
     * timeline avança com a rolagem sem nenhuma relação com onde cada
     * card está, e a sequência de um card corre antes de ele chegar.
     */
    consulta.add(CONSULTA_SOLTA, () => {
        cards.forEach(montarCardSolto);
    });
};

/*
 * O desdobramento em si. Uma função só, usada pelo painel no desktop e
 * por cada card no celular: é o mesmo movimento, então tem que ser o
 * mesmo código — foi tentar manter duas versões que fez as duas
 * divergirem.
 *
 * `fromTo` e não `from`: com `scrub`, o estado inicial é aplicado assim
 * que o gatilho nasce, então a peça já entra deitada, e o estado final
 * fica escrito por extenso em vez de depender do que o navegador tinha
 * calculado.
 */
const desdobrar = (linha, peca, posicao) => {
    linha.fromTo(
        peca,
        { ...DEITADO },
        { ...DE_FRENTE, duration: ABERTURA, ease: "power3.out" },
        posicao
    );
};

/*
 * A entrada de um card no celular, de ponta a ponta.
 *
 * O gatilho é a linha, não o card. O card se deita, e sob `rotateX(90deg)`
 * o retângulo dele fica achatado a zero — é pelo retângulo que o
 * ScrollTrigger calcula início e fim, e a conta sairia toda errada. A
 * linha nunca se transforma, então a caixa dela é estável.
 *
 * A ordem é a mesma do desktop: a peça desdobra, o nome do procedimento
 * fica parado o tempo de ser lido, entra o antes, entra o depois, e o
 * depois permanece enquanto o card sai pelo topo.
 */
const montarCardSolto = (card) => {
    const linha = gsap.timeline({
        scrollTrigger: {
            /*
             * Começa com a linha já quase inteira na tela, e não assim que
             * ela encosta na borda de baixo. Disparando cedo, a abertura
             * acontecia na beirada inferior, onde ninguém está olhando, e
             * o card chegava ao meio da tela com o efeito já terminado.
             *
             * ATENÇÃO: estes dois números estão amarrados ao vão entre as
             * linhas, no CSS. Um card só começa depois do anterior
             * terminar enquanto valer
             *
             *     vão entre linhas = (início − fim) × altura da tela
             *
             * Aqui a diferença é 72% − 40% = 32%, e o `row-gap` da grade
             * no celular é 32vh. Mexer num sem mexer no outro faz as
             * sequências voltarem a se sobrepor, ou abre rolagem morta
             * entre elas.
             */
            trigger: card.parentElement,
            start: "top 72%",
            end: "bottom 40%",
            scrub: true,
            invalidateOnRefresh: true,
        },
    });

    desdobrar(linha, card, 0);

    linha
        .add(criarSequenciaDoCard(card), ABERTURA + RESPIRO_ENTRADA)
        .to({}, { duration: RESPIRO_SAIDA });

    return linha;
};

const montarMestre = (secao, cards, gatilho) => {
    const mestre = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
            trigger: secao,
            scrub: true,
            invalidateOnRefresh: true,
            ...gatilho,
        },
    });

    abrirTela(mestre, secao);

    cards.forEach((card) => {
        mestre.add(criarSequenciaDoCard(card), ">");
    });

    return mestre;
};

/*
 * A tela do desktop: o painel inteiro desdobra antes de os cards
 * começarem a trocar de etapa.
 *
 * O `border-radius` não entra na animação de propósito. Girar e esmaecer
 * são trabalho do compositor e não custam nada; mudar o raio a cada
 * quadro obriga a repintar o recorte de um painel de mil e cem pixels com
 * quatro cards e oito imagens dentro. Era o único passo do efeito que
 * travaria, e é o único que ficou de fora.
 */
const abrirTela = (linha, secao) => {
    const tela = secao.querySelector(".s3__palco");

    if (!tela) {
        return;
    }

    desdobrar(linha, tela, 0);

    /* Um respiro antes do primeiro card trocar de etapa: a tela precisa
       chegar e ser vista de frente antes de algo se mexer dentro dela. */
    linha.to({}, { duration: ASSENTA });
};

/*
 * As três etapas ocupam o mesmo espaço do card e só trocam opacidade e
 * escala, o que mantém a transição no compositor. Com movimento reduzido
 * a escala sai de cena e resta a fusão entre as imagens.
 */
const criarSequenciaDoCard = (card) => {
    const procedimento = card.querySelector(".s3__etapa--procedimento");
    const antes = card.querySelector(".s3__etapa--antes");
    const depois = card.querySelector(".s3__etapa--depois");
    const trilho = card.querySelector(".s3__trilho");

    const reduzido = prefereMovimentoReduzido();
    const entrada = reduzido ? 1 : ESCALA_ENTRADA;
    const saida = reduzido ? 1 : ESCALA_SAIDA;

    const segundaTroca = TRANSICAO + PAUSA;
    const linha = gsap.timeline();

    linha
        .to(procedimento, { opacity: 0, scale: saida, duration: TRANSICAO }, 0)
        .fromTo(
            antes,
            { opacity: 0, scale: entrada },
            { opacity: 1, scale: 1, duration: TRANSICAO },
            0
        )
        .to(antes, { opacity: 0, scale: saida, duration: TRANSICAO }, segundaTroca)
        .fromTo(
            depois,
            { opacity: 0, scale: entrada },
            { opacity: 1, scale: 1, duration: TRANSICAO },
            segundaTroca
        );

    if (trilho) {
        linha.fromTo(
            trilho,
            { scaleX: 0 },
            { scaleX: 1, duration: linha.duration(), ease: "none" },
            0
        );
    }

    return linha;
};

