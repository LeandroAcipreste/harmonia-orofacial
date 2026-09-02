/*
 * A clínica: o texto se revela letra a letra enquanto as fotos correm.
 *
 * A dobra tem duas colunas e uma só ideia. A da esquerda para — é
 * `sticky`, não presa por script — e a da direita, que é uma pilha de
 * fotos mais alta que a tela, sobe porque a página sobe. Ninguém anima as
 * fotos: o que faz o movimento delas aparecer é ter algo parado ao lado.
 *
 * O que o script faz é só o texto, e ele é preso à rolagem: as letras
 * sobem de dentro da própria palavra, escalonadas, no compasso de quem
 * está lendo.
 */

import { ligarBrilhoDoCursor } from "../../components/shellcard/shellcard.js";

/*
 * O passo entre uma letra e a seguinte, e quanto cada uma leva.
 *
 * São os números da referência do WebHub, onde este movimento existe num
 * `SplitText` com máscara por linha e `scrub`. O passo curto é o que faz
 * a revelação parecer uma onda passando pela frase, e não um bloco
 * inteiro aparecendo de uma vez.
 */
const PASSO_DA_LETRA = 0.014;
const DURACAO_DA_LETRA = 0.3;

/* O arrasto do `scrub`: alto, para as letras chegarem atrasadas e
   continuarem subindo um instante depois de a rolagem parar. */
const ARRASTO = 2;

/*
 * Quebra o texto em palavras e letras.
 *
 * A palavra é a caixa que recorta; a letra é o que sobe. Feito à mão,
 * como na dobra da doutora, e pela mesma razão: o SplitText do GSAP é
 * plugin licenciado, e o que esta dobra pede cabe em vinte linhas.
 *
 * Os espaços entre palavras voltam como nós de texto de verdade, então a
 * quebra de linha continua sendo a do navegador e quem lê por leitor de
 * tela continua ouvindo a frase inteira.
 */
const dividirEmLetras = (elemento) => {
    if (!elemento) {
        return [];
    }

    if (elemento.dataset.dividido === "sim") {
        return Array.from(elemento.querySelectorAll(".s5__letra"));
    }

    const texto = elemento.textContent.replace(/\s+/g, " ").trim();
    const pedaco = document.createDocumentFragment();
    const letras = [];

    texto.split(" ").forEach((palavra, indice) => {
        if (indice > 0) {
            pedaco.appendChild(document.createTextNode(" "));
        }

        const caixa = document.createElement("span");
        caixa.className = "s5__palavra";

        Array.from(palavra).forEach((caractere) => {
            const letra = document.createElement("span");
            letra.className = "s5__letra";
            letra.textContent = caractere;
            caixa.appendChild(letra);
            letras.push(letra);
        });

        pedaco.appendChild(caixa);
    });

    elemento.textContent = "";
    elemento.appendChild(pedaco);
    elemento.dataset.dividido = "sim";

    return letras;
};

export const initSectionFive = () => {
    const secao = document.querySelector(".s5");

    if (!secao) {
        return;
    }

    ligarBrilhoDoCursor(secao.querySelectorAll(".shell-card"));

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const coluna = secao.querySelector(".s5__texto");
    const fotos = secao.querySelector(".s5__coluna");

    if (!coluna || !fotos) {
        return;
    }

    /*
     * Os parágrafos entram na mesma onda, na ordem em que se leem. Um
     * `stagger` só, atravessando os três blocos, e não uma animação por
     * bloco: assim a leitura não recomeça a cada parágrafo.
     */
    const letras = Array.from(coluna.querySelectorAll(".s5__paragrafo")).flatMap(
        (bloco) => dividirEmLetras(bloco)
    );

    if (!letras.length) {
        return;
    }

    secao.classList.add("js-letras");

    /* 1. Revelação das letras do texto conforme o scroll */
    gsap.fromTo(
        letras,
        { y: "100%", opacity: 0 },
        {
            y: "0%",
            opacity: 1,
            ease: "power2.out",
            duration: DURACAO_DA_LETRA,
            stagger: PASSO_DA_LETRA,
            scrollTrigger: {
                trigger: secao,
                start: "top 75%",
                end: "bottom 85%",
                scrub: ARRASTO,
                invalidateOnRefresh: true,
            },
        }
    );

    /*
     * 2. Carrossel Infinito das fotos da clínica:
     * As fotos deslizam continuamente em loop infinito (-50% a 0%),
     * com aceleração fluida sincronizada com a velocidade da rolagem do scroll.
     */
    if (fotos) {
        const loopFotos = gsap.to(fotos, {
            xPercent: -50,
            ease: "none",
            duration: 22,
            repeat: -1,
        });

        /* Aceleração interativa proporcional à velocidade do scroll */
        ScrollTrigger.create({
            trigger: secao,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
                const velocidade = Math.abs(self.getVelocity() / 250);
                if (velocidade > 0.1) {
                    gsap.to(loopFotos, { timeScale: 1 + Math.min(velocidade, 3.5), duration: 0.25, overwrite: "auto" });
                    gsap.to(loopFotos, { timeScale: 1, duration: 1.2, delay: 0.25, overwrite: false });
                }
            },
        });
    }
};
