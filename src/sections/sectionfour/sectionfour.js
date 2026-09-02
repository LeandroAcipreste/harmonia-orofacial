/*
 * Conheça a Dra. Célia: a leitura da dobra, presa à rolagem.
 *
 * Nada aqui entra por conta própria. A dobra inteira é um só percurso
 * preso, que começa no recolhimento do letreiro (src/sections/letreiro) e
 * segue por esta apresentação: o nome se escreve, o texto acende palavra
 * a palavra, e as áreas de atuação chegam uma de cada vez. Quem lê só vê
 * a próxima porque rolou até ela.
 *
 * Por isso este módulo não abre gatilho nenhum. Ele recebe a linha do
 * tempo que já está presa e pendura a sua parte no fim dela — dois
 * gatilhos seriam duas rolagens disputando a mesma tela.
 */

/* Mesmo aviso do letreiro, e pelo mesmo motivo: saber se a função rodou é
   outra pergunta que saber se o efeito ficou de pé. Linhas de
   desenvolvimento; apagar quando a dobra estiver fechada. */
const aviso = (recado, bom = true) =>
    console.log(
        `%c[dobra] sectionfour%c  ${recado}`,
        bom ? "color:#22c55e;font-weight:bold" : "color:#ef4444;font-weight:bold",
        "color:#94a3b8"
    );

/*
 * As cores da onda, em valor e não em `var()`.
 *
 * O GSAP interpola cor, e para interpolar precisa de dois números — uma
 * variável de CSS chega como texto e ele a repassaria sem animar. São as
 * mesmas de src/core/base.css e têm que continuar batendo com as de lá.
 */
const APAGADO = "#00279a"; /* --navy-900: idêntico ao fundo, texto invisível */
const OURO = "#fdba74"; /* --gold-300 */
const CALMO = "#94a3b8"; /* --slate-400 */
const DISCRETO = "#64748b"; /* --slate-500 */

/*
 * Onde cada movimento entra, contado a partir do fim do recolhimento.
 *
 * Os números são posições na linha do tempo, não segundos: quem os
 * converte em rolagem é o `scrub` do gatilho lá do letreiro. O que
 * importa aqui é a ordem entre eles e a sobreposição.
 */
const NOME = 0;
const REGUA = 0.1;
const CRO = 0.7;
const BIO = 1;
const PRIMEIRA_AREA = 2.5;
const PASSO_DA_AREA = 0.95;

/*
 * O arrasto do conteúdo, para telas em que a dobra não cabe.
 *
 * Começa um pouco antes da primeira área e termina com a última: é
 * exatamente o trecho em que a leitura desce pela lista, e é aí que ela
 * precisa que a lista suba ao seu encontro. Antes disso a apresentação
 * está no quadro e não há por que mexer nela.
 *
 * A folga é o respiro que sobra abaixo da última área — sem ela a lista
 * termina colada na borda de baixo.
 */
const ARRASTO_DE = PRIMEIRA_AREA - 0.3;
const ARRASTO_ATE = PRIMEIRA_AREA + 3 * PASSO_DA_AREA + 0.8;
const FOLGA_DO_ARRASTO = 48;

/*
 * Quebra o texto em palavras para poder acender uma de cada vez.
 *
 * Feito à mão, e não com o SplitText do GSAP, que é plugin licenciado.
 * Para o que esta dobra pede — palavras, não letras nem linhas — são
 * quinze linhas, e o projeto continua sem dependência nova.
 *
 * Os espaços voltam como nós de texto de verdade, e não como margem nos
 * spans: assim a quebra de linha continua sendo a do navegador, e quem lê
 * por leitor de tela continua ouvindo a frase, e não palavras soltas.
 */
const dividirEmPalavras = (elemento) => {
    if (!elemento) {
        return [];
    }

    if (elemento.dataset.dividido === "sim") {
        return Array.from(elemento.querySelectorAll(".s4__palavra"));
    }

    const texto = elemento.textContent.replace(/\s+/g, " ").trim();
    const pedaco = document.createDocumentFragment();
    const palavras = [];

    texto.split(" ").forEach((palavra, indice) => {
        if (indice > 0) {
            pedaco.appendChild(document.createTextNode(" "));
        }

        const span = document.createElement("span");
        span.className = "s4__palavra";
        span.textContent = palavra;
        pedaco.appendChild(span);
        palavras.push(span);
    });

    elemento.textContent = "";
    elemento.appendChild(pedaco);
    elemento.dataset.dividido = "sim";

    return palavras;
};

/*
 * A onda: uma luz dourada atravessa o texto palavra por palavra e deixa
 * claro atrás de si.
 *
 * É o pedido — o texto começa azul escuro e vai se revelando —, mas com o
 * ouro no meio do caminho em vez de um clareamento direto. A passagem
 * pelo dourado é o que dá a leitura de uma luz correndo pela linha, e não
 * de um texto que muda de cor; e o dourado é o acento da marca, então a
 * luz que lê é da própria clínica.
 *
 * `keyframes` e não dois `to` sobrepostos: dois tweens na mesma
 * propriedade disputam o último a renderizar, e a onda saía picada.
 */
const onda = (linha, palavras, quando, percurso, corFinal) => {
    if (!palavras.length) {
        return;
    }

    /*
     * O apagado entra aqui, e não só no CSS.
     *
     * O CSS o declara para não haver piscada antes de o script chegar, mas
     * quem manda na animação é este módulo: escrito em estilo embutido, o
     * ponto de partida vale mesmo que alguma regra de mídia diga outra
     * coisa. Confiar só no CSS já custou uma onda que começava clara —
     * uma regra de `prefers-reduced-motion` sobrescrevia o azul e o GSAP
     * lia o valor errado como início.
     */
    gsap.set(palavras, { color: APAGADO });

    linha.to(
        palavras,
        {
            keyframes: [
                { color: APAGADO, duration: 0 },
                { color: OURO, duration: 0.15, ease: "none" },
                { color: corFinal, duration: 0.35, ease: "none" },
            ],
            stagger: { each: percurso / palavras.length },
        },
        quando
    );
};

/* Escrita da esquerda para a direita, palavra a palavra, como quem
   assina. O recorte anda; a palavra não sai do lugar. */
const escrever = (linha, palavras, quando, duracao, passo) => {
    if (!palavras.length) {
        return;
    }

    linha.fromTo(
        palavras,
        { clipPath: "inset(0 100% 0 0)" },
        {
            clipPath: "inset(0 0% 0 0)",
            ease: "power2.out",
            duration: duracao,
            stagger: { each: passo },
        },
        quando
    );
};

export const initSectionFour = () => {
    aviso("entrei");

    const secao = document.querySelector(".s4");

    if (!secao) {
        aviso("PAREI: não achei .s4 no HTML", false);
        return;
    }

    aviso("ESTOU FUNCIONANDO: esperando a linha do tempo do recolhimento");
};

/*
 * Pendura a leitura no fim da linha do tempo do recolhimento.
 *
 * Chamada por main.js, que entrega a linha que o letreiro montou. Roda
 * dentro do contexto do `matchMedia` de lá, então o GSAP desfaz tudo isto
 * sozinho quando o ponto de quebra muda.
 */
export const montarLeituraDaDobra = (linha, posicao) => {
    const secao = document.querySelector(".s4");

    if (!secao || !linha) {
        aviso("PAREI: sem seção ou sem linha do tempo para pendurar", false);
        return;
    }

    /* A classe acende os estados escondidos do CSS. Sem ela — sem
       recolhimento — a dobra é texto normal, legível e parado. */
    secao.classList.add("js-leitura");

    const nome = dividirEmPalavras(secao.querySelector(".s4__nome"));
    const cro = dividirEmPalavras(secao.querySelector(".s4__cro"));
    const bio = dividirEmPalavras(secao.querySelector(".s4__bio"));
    const areas = Array.from(secao.querySelectorAll(".s4__area"));

    /* O "Conheça a Dra. Célia" abre a fala, um instante antes do nome. */
    linha.fromTo(
        secao.querySelector(".s4__eyebrow"),
        { opacity: 0 },
        { opacity: 1, ease: "none", duration: 0.25 },
        posicao + NOME
    );

    /* Depois o nome se escreve, e a régua dourada sai na frente dele: o
       traço é lançado e as palavras o alcançam. */
    escrever(linha, nome, posicao + NOME + 0.15, 0.45, 0.08);

    linha.fromTo(
        secao.querySelector(".s4__regua"),
        { scaleX: 0 },
        { scaleX: 1, ease: "power2.out", duration: 0.8 },
        posicao + REGUA
    );

    /* O registro entra pela mesma luz, curto, como um carimbo. */
    onda(linha, cro, posicao + CRO, 0.2, DISCRETO);

    /* E então a apresentação acende, devagar, palavra por palavra. É o
       trecho mais longo de propósito: é o que se lê. */
    onda(linha, bio, posicao + BIO, 1.4, CALMO);

    /*
     * As áreas, uma de cada vez. Cada uma repete o mesmo gesto em
     * miniatura — a régua desenha, o título se escreve, o texto acende —
     * para a dobra ter uma gramática só, e não quatro.
     */
    areas.forEach((area, indice) => {
        const quando = posicao + PRIMEIRA_AREA + indice * PASSO_DA_AREA;

        linha.fromTo(
            area.querySelector(".s4__area-regua"),
            { scaleX: 0 },
            { scaleX: 1, ease: "power2.out", duration: 0.35 },
            quando
        );

        escrever(
            linha,
            dividirEmPalavras(area.querySelector(".s4__area-nome")),
            quando + 0.12,
            0.35,
            0.06
        );

        onda(
            linha,
            dividirEmPalavras(area.querySelector(".s4__area-texto")),
            quando + 0.3,
            0.5,
            DISCRETO
        );
    });

    /*
     * E, se a dobra não couber na tela, ela sobe enquanto é lida.
     *
     * Presa, a dobra não rola: o que estiver abaixo da linha d'água acende
     * sem ninguém ver. No retrato isso são as duas últimas áreas — mais de
     * quinhentos pixels de texto que se iluminavam fora do quadro.
     *
     * Então a leitura arrasta o conteúdo para cima no mesmo compasso em
     * que acende, e cada área chega ao quadro na hora de ser lida. No
     * desktop a dobra cabe inteira e a conta dá zero: não há tween, não há
     * arrasto, e nada muda.
     *
     * A distância vem de função, e não de número: com `invalidateOnRefresh`
     * no gatilho ela é refeita a cada medida, o que importa num retrato
     * onde a barra do navegador entra e sai e a altura da tela muda.
     */
    const bloco = secao.closest(".transicao");
    const inner = secao.querySelector(".s4__inner");
    const sobra = () =>
        Math.max(0, secao.getBoundingClientRect().height - window.innerHeight + FOLGA_DO_ARRASTO);

    /*
     * Sobe o texto e a marca do dente juntos.
     *
     * A marca não é um enfeite grudado no quadro: ela pousou num lugar da
     * página, acima do cabeçalho, e pertence àquele lugar. Subindo só o
     * texto, ela ficava presa na tela feito adesivo e o conteúdo passava
     * por trás dela — que é o contrário de estar num lugar.
     *
     * Levando as duas no mesmo tween, a marca sai de cena pelo topo junto
     * com o cabeçalho que ela encima, e volta quando a rolagem volta: é o
     * `scrub` desfazendo o caminho, sem nada a mais para escrever.
     *
     * Quem carrega a marca é o próprio letreiro: o dente é o que sobrou
     * dele depois do recolhimento, e mover o elemento move o recorte.
     */
    const sobem = [inner, bloco && bloco.querySelector(".letreiro")].filter(Boolean);

    if (sobem.length && sobra() > 0) {
        linha.to(
            sobem,
            { y: () => -sobra(), ease: "none", duration: ARRASTO_ATE - ARRASTO_DE },
            posicao + ARRASTO_DE
        );
    }

    aviso(
        `ESTOU FUNCIONANDO: leitura pendurada em ${posicao.toFixed(2)}; ` +
            `${nome.length} palavras no nome, ${bio.length} na apresentação, ` +
            `${areas.length} áreas; arrasto de ${Math.round(sobra())}px`
    );
};
