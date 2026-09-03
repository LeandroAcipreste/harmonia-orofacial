import { ligarBrilhoDoCursor } from "../../components/shellcard/shellcard.js";

const PASSO_DA_LETRA = 0.014;
const DURACAO_DA_LETRA = 0.3;

const ARRASTO = 2;

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

    const letras = Array.from(coluna.querySelectorAll(".s5__paragrafo")).flatMap(
        (bloco) => dividirEmLetras(bloco)
    );

    if (!letras.length) {
        return;
    }

    secao.classList.add("js-letras");

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

    if (fotos) {
        const loopFotos = gsap.to(fotos, {
            xPercent: -50,
            ease: "none",
            duration: 22,
            repeat: -1,
        });

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
