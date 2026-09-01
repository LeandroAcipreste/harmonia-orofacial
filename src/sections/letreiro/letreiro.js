import { prefereMovimentoReduzido, movimentoDestravado } from "../../utils/movimento.js";

/*
 * Aviso no console de que cada função desta dobra rodou, e de onde ela
 * parou quando parou.
 *
 * É grosseiro de propósito. O relatório de diagnostico.js diz o estado
 * final — se o efeito está montado —, e isso não é a mesma pergunta que
 * "a função chegou a ser chamada?". Quando as duas se separam, é aqui que
 * se vê: cada saída antecipada diz o motivo dela, com o nome da função na
 * frente, e o que não aparecer no console não rodou.
 *
 * Linhas de desenvolvimento. Apagar quando a dobra estiver fechada.
 */
const aviso = (funcao, recado, bom = true) =>
    console.log(
        `%c[dobra] ${funcao}%c  ${recado}`,
        bom ? "color:#22c55e;font-weight:bold" : "color:#ef4444;font-weight:bold",
        "color:#94a3b8"
    );

/*
 * As três faixas do letreiro andam com a rolagem: as de fora para um
 * lado, a do meio para o outro.
 *
 * O movimento é preso à rolagem (`scrub`) e não a um laço próprio. Um
 * letreiro que corre sozinho seria mais um movimento competindo com a
 * leitura numa página que já tem a espiral do hero e a película da
 * terceira dobra; preso à rolagem, ele obedece a quem está lendo — para
 * quando a pessoa para, e volta atrás quando ela sobe.
 *
 * O `scrub` é o que dá o peso: a faixa não acompanha o dedo, ela chega
 * atrasada e continua um instante depois que a rolagem parou.
 */

const ARRASTO = 1.2;

/*
 * Onde cada sentido começa e onde termina, em fração da própria largura.
 *
 * A sobra que cada faixa tem para fora da tela é metade do que ela mede
 * além dela, e estes valores ficam bem abaixo disso: é o que garante que
 * nenhuma ponta entre no quadro no fim do percurso.
 *
 * O recuo inicial das faixas que vão para a direita está repetido no CSS,
 * e tem que continuar batendo com o de lá. É o estado sem script.
 */
const ESQUERDA = { de: "0%", para: "-22%" };
const DIREITA = { de: "-20%", para: "2%" };

export const initLetreiro = () => {
    aviso("initLetreiro", "entrei");

    const secao = document.querySelector(".letreiro");

    if (!secao) {
        aviso("initLetreiro", "PAREI: não achei .letreiro no HTML", false);
        return;
    }

    /* Sem GSAP as faixas ficam paradas no enquadramento que o CSS já deu,
       que continua sendo o nome da clínica escrito grande. */
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        aviso("initLetreiro", "PAREI: sem GSAP ou ScrollTrigger", false);
        return;
    }

    if (prefereMovimentoReduzido() && !movimentoDestravado) {
        aviso("initLetreiro", "PAREI: obedecendo ao movimento reduzido do sistema", false);
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    /*
     * Uma linha do tempo só, e não um gatilho por faixa. O gatilho é o
     * bloco da transição, e não o letreiro: é o bloco que fica preso, e
     * as faixas precisam continuar correndo justamente ali, enquanto o
     * recorte se fecha.
     *
     * As três têm que andar exatamente na mesma medida de rolagem, ou o
     * cruzamento entre elas — que é o efeito inteiro — sai desencontrado.
     * Antes eram dois `fromTo` recebendo o mesmo objeto de configuração,
     * e objeto de configuração de ScrollTrigger não é para ser reusado: o
     * GSAP escreve dentro dele ao montar o primeiro, e o segundo já o
     * encontrava sujo.
     */
    const linha = gsap.timeline({
        scrollTrigger: {
            trigger: secao.closest(".transicao") || secao,
            scrub: ARRASTO,
            start: "top bottom",
            end: "bottom top",
            invalidateOnRefresh: true,
        },
    });

    /*
     * `fromTo` e não `to`: com `scrub`, quem lê o estado inicial do CSS é
     * o GSAP, e ele o lê já resolvido em pixel pelo navegador. Numa
     * medida em porcentagem da própria largura isso desanda no
     * redimensionamento. Escrevendo as duas pontas, a conta é sempre a
     * mesma, em qualquer largura de tela.
     *
     * Os dois entram na posição 0 da linha do tempo, lado a lado.
     */
    const correr = (seletor, { de, para }) => {
        const faixas = secao.querySelectorAll(seletor);

        if (!faixas.length) {
            return;
        }

        linha.fromTo(
            faixas,
            { x: de },
            { x: para, ease: "none", duration: 1 },
            0
        );
    };

    correr(".letreiro__linha--esq", ESQUERDA);
    correr(".letreiro__linha--dir", DIREITA);

    aviso(
        "initLetreiro",
        `ESTOU FUNCIONANDO: ${secao.querySelectorAll(".letreiro__linha").length} faixas presas à rolagem`
    );
};

/*
 * O recolhimento: o letreiro se fecha para dentro do dente e descobre a
 * dobra da doutora.
 *
 * O recorte do letreiro é o traço do dente (ver letreiro.css). Ele começa
 * enorme — a tela inteira cabe dentro da espessura do traço, e ninguém vê
 * que há recorte — e encolhe com a rolagem. Encolhendo, o traço se fecha
 * em volta da âncora: o letreiro vai sumindo por fora, sobra o desenho do
 * dente, e o que estava atrás dele aparece.
 *
 * É o contrário de abrir um buraco. Não é a dobra que nasce de dentro de
 * um vão que cresce; é o letreiro que se recolhe até virar a marca.
 */

/* Onde o recorte termina, e onde a marca vai parar na tela. Dois pontos
   de quebra porque no retrato o dente precisa ser mais largo para ainda
   se ler, e mais baixo para escapar da barra do navegador. */
const RECORTE_FINAL = { desktop: "11vw", movel: "28vw" };
/*
 * Onde a marca encaixa, em `mask-position`.
 *
 * Os números saem de conta, e não de tentativa. `mask-position` casa um
 * ponto da imagem com o mesmo ponto em porcentagem do quadro, então o
 * valor que se escreve aqui não é onde o dente aparece — é preciso
 * resolver para trás. Medida a caixa do traço no arquivo, o centro dele
 * cai a 50,07% / 47,46% da imagem; daí, para o centro pousar em 47% / 83%
 * da tela com o recorte final em 11vw, a posição é esta. Mexer no tamanho
 * final obriga a refazer a conta: os dois andam juntos.
 *
 * O vão da coluna da esquerda, embaixo da apresentação, é o único lugar
 * da dobra onde a marca não passa por cima de texto.
 */
const POUSO_FINAL = { desktop: "46.6% 87.7%", movel: "50% 9.6%" };

/*
 * Onde o recorte começa. Está repetido no CSS, que é quem desenha o
 * estado antes de o script chegar, e os dois têm que continuar batendo.
 */
const RECORTE_INICIAL = "3400vmax";

/*
 * Quanta rolagem custa cada unidade da linha do tempo, em telas.
 *
 * O percurso preso não é mais só o recolhimento: a dobra da doutora
 * pendura a leitura dela no fim desta mesma linha, e o comprimento total
 * só se sabe depois disso. Por isso a medida é por unidade, e o fim do
 * gatilho lê a duração já montada.
 */
const ROLAGEM_POR_UNIDADE = 0.62;

/*
 * O aviso que a dobra de baixo espera para se apresentar. Quem escuta é
 * src/sections/sectionfour.
 *
 * Ele sai do fim da animação, e não de uma fração da rolagem. Os dois não
 * são a mesma coisa: com `scrub: 2` a rolagem corre à frente do que está
 * na tela, e um limiar medido na rolagem mandaria o texto entrar com o
 * dente ainda a caminho. Preso ao término do movimento, o aviso sai
 * exatamente quando o dente encaixou.
 */
export const EVENTO_DESCOBERTA = "harmonia:descoberta";

const CONSULTA_DESKTOP = "(min-width: 900px)";
const CONSULTA_MOVEL = "(max-width: 899px)";

export const initTransicao = ({ aoRecolher } = {}) => {
    aviso("initTransicao", "entrei");

    const bloco = document.querySelector(".transicao");
    const letreiro = bloco && bloco.querySelector(".letreiro");

    if (!bloco || !letreiro) {
        aviso("initTransicao", "PAREI: não achei .transicao ou .letreiro no HTML", false);
        return;
    }

    /* Sem GSAP o recorte fica no tamanho enorme que o CSS deu, que é o
       letreiro inteiro visível. A dobra da doutora fica coberta, então o
       CSS também precisa soltá-la — é o que faz `.sem-transicao`. */
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        bloco.classList.add("sem-transicao");
        aviso("initTransicao", "PAREI: sem GSAP ou ScrollTrigger", false);
        return;
    }

    if (prefereMovimentoReduzido() && !movimentoDestravado) {
        bloco.classList.add("sem-transicao");
        aviso("initTransicao", "PAREI: obedecendo ao movimento reduzido do sistema", false);
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const consulta = gsap.matchMedia();

    const montar = (medidas, largura) => () => {
        aviso("recolhimento", `ESTOU FUNCIONANDO: montei em ${largura}, recorte até ${medidas.recorte}`);

        let avisado = false;

        /*
         * `let` e não `const`: o `end` do gatilho lê a duração desta mesma
         * linha, e o ScrollTrigger o chama já na criação — antes de a
         * atribuição terminar. A guarda devolve 1 nesse primeiro cálculo,
         * e o `refresh` lá embaixo, depois de tudo pendurado, é quem dá o
         * valor de verdade.
         */
        let linha;

        linha = gsap.timeline({
            scrollTrigger: {
                trigger: bloco,
                start: "top top",
                end: () =>
                    `+=${window.innerHeight * ROLAGEM_POR_UNIDADE * (linha ? linha.duration() : 1)}`,
                pin: true,
                pinSpacing: true,
                anticipatePin: 1,
                scrub: 2,
                invalidateOnRefresh: true,
            },
        });

        /*
         * São quatro movimentos, e a ordem entre eles é o efeito inteiro.
         *
         * 1. O letreiro corre inteiro, sem sinal de que está recortado.
         * 2. A chapa entra e as faixas somem num esmaecimento: sobra a
         *    tela chapada de azul.
         * 3. Esse azul chapado é que vira o dente, encolhendo.
         * 4. O dente pousa de marca, e a dobra de baixo se apresenta.
         *
         * Nos dois primeiros movimentos o recorte não se mexe, e isso é de
         * propósito.
         *
         * Ele é maior que a tela o tempo todo ali, ou seja, é invisível: o
         * que se vê é o letreiro correndo e depois esmaecendo. Animá-lo
         * nesse trecho seria pagar o desenho mais caro que existe aqui —
         * a máscara no maior tamanho — para não mudar nada no quadro. Uma
         * versão anterior fazia isso e custava metade do orçamento de
         * quadro à toa.
         *
         * Então a linha do tempo começa vazia. O primeiro movimento é só
         * as faixas correndo, que têm gatilho próprio.
         */

        /*
         * Segundo movimento: a chapa fecha, e como o recorte continua em
         * 3400vmax — acima dos 2997 em que ele deixaria de cobrir a
         * tela, conta que mora em letreiro.css — o que sobra é a tela azul
         * chapada, sem nada escrito e sem forma nenhuma à vista.
         */
        linha.to(
            ".letreiro__sobreposicao",
            { opacity: 1, ease: "none", duration: 0.5 },
            0.5
        );

        /*
         * Terceiro movimento: esse azul chapado vira o dente.
         *
         * `power3.out` porque os dois pedaços deste caminho não valem a
         * mesma rolagem. De 7000 a umas 300vmax o dente é grande demais
         * para caber no quadro — passa como borda varrendo, e ninguém lê
         * uma borda; de 300vmax para baixo ele é a forma que se reconhece.
         * A saída forte gasta 45% do trecho nessa segunda parte, que é
         * onde está o efeito.
         *
         * A cobertura só se perde em 0,19 daqui, depois de a chapa já ter
         * fechado — é o que impede o terceiro movimento de começar antes
         * do segundo.
         *
         * `fromTo` porque com `scrub` quem lê o estado inicial é o GSAP, e
         * a ponta de cima precisa ser a mesma em qualquer tela.
         */
        linha.fromTo(
            letreiro,
            { maskSize: RECORTE_INICIAL, webkitMaskSize: RECORTE_INICIAL },
            {
                maskSize: medidas.recorte,
                webkitMaskSize: medidas.recorte,
                ease: "power3.out",
                duration: 1.2,
            },
            1
        );

        /*
         * Quarto movimento: o dente escorrega para o vão que a dobra
         * deixa na coluna da esquerda e encaixa ali. Só na parte do
         * trecho em que ele já é desenho: escorregar antes seria mover uma
         * borda, e ninguém vê uma borda mudar de lugar.
         *
         * Encaixado, ele avisa a dobra de baixo, que só então se
         * apresenta. É esta a ordem: primeiro a marca acha o lugar dela,
         * depois o texto escreve.
         */
        linha.to(
            letreiro,
            {
                maskPosition: medidas.pouso,
                webkitMaskPosition: medidas.pouso,
                ease: "power1.inOut",
                duration: 0.7,
                onComplete: () => {
                    if (avisado) {
                        return;
                    }

                    avisado = true;
                    aviso("recolhimento", "ESTOU FUNCIONANDO: dente encaixou, avisei a dobra da doutora");
                    bloco.dispatchEvent(new CustomEvent(EVENTO_DESCOBERTA));
                },
            },
            1.5
        );

        /* No fim a chapa afrouxa um fio, e a marca deixa passar um
           respiro do que está atrás em vez de ficar um decalque opaco. */
        linha.to(".letreiro__sobreposicao", {
            opacity: 0.9,
            ease: "none",
            duration: 0.3,
        });

        /*
         * Aqui o recolhimento acaba e a dobra de baixo pendura a leitura
         * dela na mesma linha, a partir deste ponto. É o que faz a
         * apresentação da doutora ser a continuação do movimento, e não
         * outra rolagem competindo com ele.
         *
         * Depois disso a linha ficou mais comprida, e o alcance do gatilho
         * foi calculado com a antiga: o `refresh` refaz a conta.
         */
        if (typeof aoRecolher === "function") {
            aoRecolher(linha, linha.duration());

            if (linha.scrollTrigger) {
                linha.scrollTrigger.refresh();
            }
        }

        return () => {
            gsap.set(letreiro, { clearProps: "maskSize,maskPosition,webkitMaskSize,webkitMaskPosition" });
            gsap.set(".letreiro__sobreposicao", { clearProps: "opacity" });
        };
    };

    consulta.add(
        CONSULTA_DESKTOP,
        montar(
            { recorte: RECORTE_FINAL.desktop, pouso: POUSO_FINAL.desktop },
            "desktop"
        )
    );

    consulta.add(
        CONSULTA_MOVEL,
        montar(
            { recorte: RECORTE_FINAL.movel, pouso: POUSO_FINAL.movel },
            "celular"
        )
    );
};
