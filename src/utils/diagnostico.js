import { movimentoForcado, motivoDoMovimento } from "./movimento.js";

/* Relatório no console do que pode impedir as animações de rodar. */

const ESTILO_OK = "color:#22c55e;font-weight:bold";
const ESTILO_ERRO = "color:#ef4444;font-weight:bold";
const ESTILO_NOTA = "color:#94a3b8";

const linha = (rotulo, valor, estaBom, nota = "") => {
    console.log(
        `%c${estaBom ? "OK  " : "!!  "}%c${rotulo.padEnd(28)}%c${valor}${nota ? `  (${nota})` : ""}`,
        estaBom ? ESTILO_OK : ESTILO_ERRO,
        "color:inherit",
        ESTILO_NOTA
    );
};

export const relatarEstado = () => {
    console.group("%cHarmonia Orofacial, diagnóstico das animações", "font-size:13px;font-weight:bold");

    const protocolo = window.location.protocol;
    linha("protocolo", protocolo, protocolo !== "file:", "módulos ES precisam de servidor");

    linha("GSAP", typeof gsap, typeof gsap !== "undefined");
    linha("ScrollTrigger", typeof ScrollTrigger, typeof ScrollTrigger !== "undefined");
    linha("Lenis", typeof Lenis, typeof Lenis !== "undefined");
    linha("IntersectionObserver", typeof IntersectionObserver, typeof IntersectionObserver !== "undefined");

    /*
     * Ligado, isto desliga quase tudo: o letreiro, o recolhimento e as
     * entradas de texto verificam esta preferência e desistem por conta
     * própria. Marcava OK antes, o que é enganoso — é a causa mais
     * silenciosa que existe aqui, porque nada quebra, tudo só some.
     *
     * A leitura aqui é crua, direto do sistema, e não pela chave de
     * movimento.js: esta linha existe para dizer o que o sistema pede, e
     * a de baixo para dizer se estamos obedecendo.
     */
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    linha(
        "movimento reduzido",
        reduzido ? "LIGADO no sistema" : "desligado",
        !reduzido || movimentoForcado,
        reduzido && !movimentoForcado
            ? "desliga as animações; abra com ?movimento=sempre para destravar"
            : ""
    );

    linha(
        "animações",
        movimentoForcado ? "DESTRAVADAS" : "contidas",
        movimentoForcado || !reduzido,
        motivoDoMovimento
    );

    const item = document.querySelector(".s2__item");
    const recorta = item ? /clip|hidden/.test(getComputedStyle(item).overflow) : false;
    linha("CSS das seções", recorta ? "carregado" : "AUSENTE", recorta, "confira os @import");

    const lista = document.querySelector(".s2__lista");
    const armada = lista ? lista.classList.contains("js-anim") : false;
    linha("módulos rodaram", armada ? "sim" : "NÃO", armada, "classe .js-anim na lista");

    const texto = document.querySelector(".s2__item-txt");
    const desloc = texto ? getComputedStyle(texto).transform : "n/d";
    linha("texto escondido", desloc, desloc !== "none");

    relatarTransicao();

    console.groupEnd();

    acompanharRevelacoes(lista);
    acompanharRecolhimento();
};

/*
 * O recolhimento do letreiro sobre a dobra da doutora.
 *
 * Cada uma das quatro linhas abaixo isola uma causa diferente para o
 * efeito não aparecer, e elas se leem em ordem: se o HTML for velho não
 * há bloco; se o CSS for velho o letreiro não está sobreposto nem
 * recortado; se o bloco disser `sem-transicao` foi o próprio script que
 * desistiu, e a linha do movimento reduzido logo acima diz por quê; e se
 * tudo isso estiver certo mas não houver gatilho preso, o problema é o
 * ScrollTrigger.
 *
 * É a diferença entre uma página velha em cache e um defeito de verdade,
 * que da tela sozinha não dá para distinguir: as duas coisas se parecem.
 */
const relatarTransicao = () => {
    const bloco = document.querySelector(".transicao");
    linha("bloco da transição", bloco ? "no HTML" : "AUSENTE", !!bloco, "recarregue sem cache");

    if (!bloco) {
        return;
    }

    /*
     * A desistência vem antes do recorte na leitura, e não depois.
     *
     * Sem recorte há duas causas possíveis, e elas pedem coisas opostas:
     * ou o CSS é velho, e é para recarregar, ou o script desistiu e o CSS
     * novo tirou a máscara de propósito. Perguntando primeiro quem
     * desistiu, a linha do recorte já sai sabendo qual das duas dizer —
     * antes ela acusava cache sempre, e mandava caçar o problema errado.
     */
    const desistiu = bloco.classList.contains("sem-transicao");

    const letreiro = bloco.querySelector(".letreiro");
    const estilo = letreiro && getComputedStyle(letreiro);
    const recortado =
        !!estilo &&
        estilo.position === "absolute" &&
        (estilo.maskImage || estilo.webkitMaskImage || "none") !== "none";

    linha(
        "letreiro recortado",
        recortado ? `sim, ${estilo.maskSize}` : "NÃO",
        recortado,
        recortado
            ? ""
            : desistiu
              ? "consequência do recolhimento desligado, veja abaixo"
              : "CSS do letreiro velho em cache"
    );

    const faixas = bloco.querySelectorAll(".letreiro__linha").length;
    linha("faixas do letreiro", String(faixas), faixas === 3);

    linha(
        "recolhimento",
        desistiu ? "DESLIGADO" : "ligado",
        !desistiu,
        desistiu ? "sem GSAP ou movimento reduzido" : ""
    );

    const preso =
        typeof ScrollTrigger !== "undefined" &&
        ScrollTrigger.getAll().some((gatilho) => gatilho.pin && gatilho.trigger === bloco);

    linha("gatilho preso", preso ? "montado" : "NENHUM", preso);
};

/* Avisa cada procedimento que entra, para conferir a cascata rolando. */
const acompanharRevelacoes = (lista) => {
    if (!lista || typeof MutationObserver === "undefined") {
        return;
    }

    const itens = Array.from(lista.querySelectorAll(".s2__item"));

    const observador = new MutationObserver((mutacoes) => {
        mutacoes.forEach(({ target }) => {
            if (target.classList.contains("is-visivel")) {
                console.log(
                    `%c-> revelado%c  ${itens.indexOf(target) + 1}. ${target.textContent.trim()}`,
                    ESTILO_OK,
                    ESTILO_NOTA
                );
            }
        });
    });

    itens.forEach((item) => observador.observe(item, { attributes: true, attributeFilter: ["class"] }));
};

/*
 * O recolhimento, quadro a quadro.
 *
 * O relatório de cima diz se o efeito está montado; este diz o que ele
 * está fazendo enquanto se rola. São coisas diferentes: dá para o gatilho
 * estar montado e o efeito mesmo assim não aparecer na tela, porque os
 * movimentos saíram fora de ordem ou porque um deles come o percurso
 * inteiro e os outros passam num quadro só.
 *
 * O nome do movimento não vem de faixas de rolagem decoradas aqui, vem
 * dos valores que estão de fato na tela — o tamanho do recorte e a
 * opacidade da chapa. Assim o log não pode concordar com o código e
 * discordar do que se vê: se ele disser "faixas correndo" é porque a
 * chapa está mesmo aberta, não porque a rolagem chegou num número.
 */

/* Abaixo disto o recorte deixa de cobrir a tela. A conta mora em
   letreiro.css; aqui o número só serve para nomear o que se vê. */
const RECORTE_QUE_COBRE = 2997;

/*
 * Dois valores bastam para separar os quatro movimentos, porque cada um
 * deles muda uma coisa só.
 *
 * Cobrindo a tela, o que distingue é a chapa: aberta é o letreiro
 * correndo, fechando é o esmaecimento. Já sem cobrir, a chapa está em 1 o
 * caminho todo — menos no último passo, em que ela afrouxa para 0,9. É
 * esse afrouxamento que diz que o dente chegou.
 */
const nomeDoMovimento = (recorteVmax, chapa) => {
    if (recorteVmax >= RECORTE_QUE_COBRE) {
        return chapa < 0.01
            ? "1. faixas correndo, tela inteira"
            : "2. chapa fechando, tela azul chapada";
    }

    return chapa < 0.999
        ? "4. marca pousada, dobra à mostra"
        : "3. o azul virando dente";
};

const acompanharRecolhimento = () => {
    const bloco = document.querySelector(".transicao");
    const letreiro = bloco && bloco.querySelector(".letreiro");
    const chapa = bloco && bloco.querySelector(".letreiro__sobreposicao");

    if (!bloco || !letreiro || !chapa) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    const preso = ScrollTrigger.getAll().find(
        (gatilho) => gatilho.pin && gatilho.trigger === bloco
    );

    if (!preso) {
        console.log(
            "%c!!  recolhimento%c  sem gatilho preso: o efeito não vai rodar",
            ESTILO_ERRO,
            ESTILO_NOTA
        );
        return;
    }

    /* O aviso que a dobra de baixo espera para entrar. Vendo esta linha,
       sabe-se que o problema não é o texto da doutora — é o recorte. */
    bloco.addEventListener("harmonia:descoberta", () =>
        console.log(
            "%c->  dobra avisada%c  a Dra. Célia já pode entrar",
            ESTILO_OK,
            ESTILO_NOTA
        )
    );

    const emVmax = (valor) =>
        parseFloat(valor) / (Math.max(window.innerWidth, window.innerHeight) / 100);

    let anterior = "";
    let anunciou = false;

    /*
     * O portão é o `isActive`, e fica dentro da chamada e não no
     * agendamento: fora do bloco isto não custa mais que um booleano por
     * quadro. Dentro dele custa duas leituras de estilo, que é o preço de
     * ler o que está na tela em vez de adivinhar — e este módulo inteiro
     * sai do ar junto com a linha que o chama no main.js.
     */
    gsap.ticker.add(() => {
        if (!preso.isActive) {
            return;
        }

        /* O alcance do gatilho só existe depois do primeiro `refresh`, e
           esse acontece bem depois do relatório: anunciado lá em cima,
           saía `NaN`. Aqui já está medido. */
        if (!anunciou) {
            anunciou = true;
            console.log(
                `%c->  recolhimento%c  prende em ${Math.round(preso.start)}px, solta em ${Math.round(
                    preso.end
                )}px  (${Math.round(preso.end - preso.start)}px de rolagem)`,
                ESTILO_OK,
                ESTILO_NOTA
            );
        }

        const recorte = emVmax(getComputedStyle(letreiro).maskSize);
        const veu = Number(getComputedStyle(chapa).opacity);
        const agora = nomeDoMovimento(recorte, veu);

        if (agora === anterior) {
            return;
        }

        anterior = agora;

        console.log(
            `%c->  ${agora}%c  rolagem ${preso.progress.toFixed(2)} · recorte ${Math.round(
                recorte
            )}vmax · chapa ${veu.toFixed(2)}`,
            ESTILO_OK,
            ESTILO_NOTA
        );
    });
};
