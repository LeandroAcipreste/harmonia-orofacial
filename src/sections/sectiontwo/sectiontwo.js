import { revelarAoEntrar } from "../../utils/reveal.js";

const MARGEM_LISTA = "0px 0px -50% 0px";

export const initSectionTwo = () => {
    const secao = document.querySelector(".s2");

    if (!secao) {
        return;
    }

    const lista = secao.querySelector(".s2__lista");

    if (!lista) {
        return;
    }

    lista.classList.add("js-anim");

    void lista.offsetHeight;

    // a lista so aparece quando a espiral termina de deslizar para a direita (hero.js)
    aoHeroParar(() => {
        revelarAoEntrar(lista.querySelectorAll(".s2__item"), { margem: MARGEM_LISTA });
        revelarAoEntrar(secao.querySelectorAll(".s2-reveal"), { margem: MARGEM_LISTA });
    });

    abrirCortina(secao);
};

// a cortina abre com a rolagem enquanto a caixa da lista sobe. Aqui so se escreve --abre (0 a 1) na caixa; o CSS
// move os fios e recorta o conteudo no vao entre eles (sectiontwo.css).
const abrirCortina = (secao) => {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const caixa = secao.querySelector(".s2__caixa");

    if (!caixa) {
        return;
    }

    let ultimo = -1;

    const escrever = (p) => {
        const valor = Math.round(p * 1000) / 1000;

        if (valor !== ultimo) {
            ultimo = valor;
            caixa.style.setProperty("--abre", valor);
        }
    };

    const suave = gsap.parseEase("power2.inOut");

    const linha = ScrollTrigger.create({
        trigger: caixa,
        start: "top 95%",
        end: "top 30%",
        onUpdate: (self) => escrever(suave(self.progress)),
    });

    escrever(suave(linha.progress));
};

const aoHeroParar = (aoLiberar) => {
    const hero = document.querySelector(".hero");

    const semEspera =
        !hero ||
        hero.classList.contains("is-fora") ||
        typeof gsap === "undefined" ||
        typeof ScrollTrigger === "undefined";

    if (semEspera) {
        aoLiberar();
        return;
    }

    document.addEventListener("harmonia:hero-parado", aoLiberar, { once: true });
};
