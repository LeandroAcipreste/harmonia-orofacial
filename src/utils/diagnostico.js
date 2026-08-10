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

    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    linha(
        "movimento reduzido",
        reduzido ? "LIGADO" : "desligado",
        true,
        reduzido ? "Windows > Acesso facilitado > Efeitos visuais" : ""
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

    console.groupEnd();

    acompanharRevelacoes(lista);
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
