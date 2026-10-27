import { ligarBrilhoDoCursor } from "../../components/shellcard/shellcard.js";
import { prefereMovimentoReduzido } from "../../utils/movimento.js";
import { escolherFonte } from "../../core/retrato.js";
import { freio, rolagem } from "../../core/rolagem-toque.js";
import { buscarQuadro, ligarPorZona } from "../../core/video-rolagem.js";

const ROLAGEM_POR_CARD = 0.9;

const ROLAGEM_DA_TELA = 1;

// desktop: quantas telas de rolagem o video da entrada na clinica ocupa, antes de a caixa subir
const ROLAGEM_DO_FILME = 3;
// peso do video na linha do tempo presa (os cartoes somam ~2,6 cada)
const DURACAO_DO_FILME = 7;
// celular: a cada quadro o video anda essa fracao do que falta ate a rolagem (deslize rapido nao pula quadros)
const FREIO = freio(0.08);

const DEITADO = { rotateX: 90, scaleX: 0.44, yPercent: 44 };
const DE_FRENTE = { rotateX: 0, scaleX: 1, yPercent: 0 };

const ABERTURA = 2.2;
const ACENDER = 0.15;
const ASSENTA = 0.5;

const CONSULTA_PRESA = "(min-width: 900px)";
const CONSULTA_SOLTA = "(max-width: 899px)";

const RESPIRO_ENTRADA = 0.9;
const RESPIRO_SAIDA = 0.7;

const TRANSICAO = 1;
const PAUSA = 0.6;

const ESCALA_ENTRADA = 1.06;
const ESCALA_SAIDA = 0.94;

export const initSectionThree = () => {
    const secao = document.querySelector(".s3");

    if (!secao) {
        return;
    }

    ligarBrilhoDoCursor(secao.querySelectorAll(".shell-card"));

    ligarSequencia(secao);
};

/* FILME: a entrada na clinica, levada pela rolagem. So busca quadro (nunca toca sozinho). */
const levarFilme = (filme, p) => {
    if (!filme || !Number.isFinite(filme.duration) || filme.duration <= 0) {
        return;
    }

    const tempo = Math.min(1, Math.max(0, p)) * Math.max(0, filme.duration - 0.05);

    buscarQuadro(filme, tempo);
};

const prepararFilme = (secao) => {
    const filme = secao.querySelector(".s3__pelicula-filme");

    if (!filme) {
        return null;
    }

    secao.classList.add("tem-filme");
    escolherFonte(filme);
    filme.preload = "auto";
    filme.load();
    ligarPorZona(filme, secao);

    // o Safari do iPhone so desenha o quadro buscado depois de o video ter tocado uma vez
    let acordado = false;
    filme.acordar = () => {
        if (acordado) {
            return;
        }

        acordado = true;
        const promessa = filme.play();

        if (promessa && typeof promessa.then === "function") {
            promessa.then(() => filme.pause()).catch(() => {});
        }
    };

    return filme;
};

const ligarSequencia = (secao) => {
    const cards = Array.from(secao.querySelectorAll(".s3__card"));

    if (!cards.length) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    const filme = prepararFilme(secao);

    const consulta = gsap.matchMedia();

    consulta.add(CONSULTA_PRESA, () => {
        secao.classList.add("js-sequencia");

        montarMestre(secao, cards, filme, {
            start: "top top",
            end: () =>
                `+=${window.innerHeight * rolagem(ROLAGEM_POR_CARD * cards.length + ROLAGEM_DA_TELA + (filme ? ROLAGEM_DO_FILME : 0))}`,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
        });

        return () => secao.classList.remove("js-sequencia");
    });

    consulta.add(CONSULTA_SOLTA, () => {
        montarFilmeSolto(secao, filme);
        cards.forEach(montarCardSolto);
    });
};

// celular: a secao nao fica presa. O trecho .s3__entrada rola com o fundo parado (sticky) e o video anda com ele;
// no fim do trecho a pelicula escurece e os cartoes sobem por cima do balcao.
const montarFilmeSolto = (secao, filme) => {
    const entrada = secao.querySelector(".s3__entrada");

    if (!filme || !entrada) {
        return;
    }

    let alvo = 0;
    let atual = 0;
    let laco = 0;

    const pintar = (p) => {
        levarFilme(filme, p);
        secao.style.setProperty("--escuro", Math.min(1, Math.max(0, (p - 0.85) / 0.15)).toFixed(3));
    };

    const perseguir = () => {
        const falta = alvo - atual;
        atual = Math.abs(falta) < 0.0005 ? alvo : atual + falta * FREIO;
        pintar(atual);
        laco = atual === alvo ? 0 : window.requestAnimationFrame(perseguir);
    };

    ScrollTrigger.create({
        trigger: entrada,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
            if (self.progress > 0) {
                filme.acordar();
            }

            alvo = self.progress;

            if (!laco) {
                laco = window.requestAnimationFrame(perseguir);
            }
        },
        onRefresh: (self) => {
            alvo = atual = self.progress;
            pintar(atual);
        },
    });
};

const desdobrar = (linha, peca, posicao) => {
    linha.fromTo(
        peca,
        { opacity: 0 },
        { opacity: 1, duration: ACENDER, ease: "none" },
        posicao
    );

    linha.fromTo(
        peca,
        { ...DEITADO },
        { ...DE_FRENTE, duration: ABERTURA, ease: "power3.out" },
        posicao
    );
};

const montarCardSolto = (card) => {
    const linha = gsap.timeline({
        scrollTrigger: {

            trigger: card.parentElement,
            start: "top 72%",
            end: "top 12%",
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

const montarMestre = (secao, cards, filme, gatilho) => {
    const mestre = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
            trigger: secao,
            scrub: true,
            invalidateOnRefresh: true,
            ...gatilho,
        },
    });

    // primeiro o video, com a pelicula transparente; quando ele para, a pelicula escurece e a caixa sobe
    let inicioDaCaixa = 0;

    if (filme) {
        const relogio = { p: 0 };

        mestre.fromTo(
            relogio,
            { p: 0 },
            {
                p: 1,
                duration: DURACAO_DO_FILME,
                ease: "none",
                onStart: () => filme.acordar(),
                onUpdate: () => levarFilme(filme, relogio.p),
            },
            0
        );

        mestre.fromTo(secao, { "--escuro": 0 }, { "--escuro": 1, duration: ABERTURA, ease: "none" }, DURACAO_DO_FILME);
        inicioDaCaixa = DURACAO_DO_FILME;
    }

    abrirTela(mestre, secao, inicioDaCaixa);

    cards.forEach((card) => {
        mestre.add(criarSequenciaDoCard(card), ">");
    });

    return mestre;
};

const abrirTela = (linha, secao, inicio) => {
    const tela = secao.querySelector(".s3__palco");

    if (!tela) {
        return;
    }

    desdobrar(linha, tela, inicio);

    linha.to({}, { duration: ASSENTA });
};

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

        const total = linha.duration();

        linha.fromTo(
            trilho,
            { scaleX: 0, opacity: 1 },
            { scaleX: 1, duration: total, ease: "none" },
            0
        );

        linha.to(
            trilho,
            { opacity: 0, duration: total * 0.12, ease: "none" },
            total * 0.88
        );
    }

    return linha;
};
