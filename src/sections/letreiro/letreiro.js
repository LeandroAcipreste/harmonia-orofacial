const ARRASTO = 1.2;

const ESQUERDA = { de: "0%", para: "-22%" };
const DIREITA = { de: "-20%", para: "2%" };

export const initLetreiro = () => {

    const secao = document.querySelector(".letreiro");

    if (!secao) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const linha = gsap.timeline({
        scrollTrigger: {
            trigger: secao.closest(".transicao") || secao,
            scrub: ARRASTO,
            start: "top bottom",
            end: "bottom top",
            invalidateOnRefresh: true,
        },
    });

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

};

const RECORTE_FINAL = { desktop: "11vw", movel: "28vw" };

const POUSO_FINAL = { desktop: "46.6% 96.8%", movel: "50% 11.7%" };

const RECORTE_INICIAL = "3400vmax";

const ROLAGEM_POR_UNIDADE = 0.62;

export const EVENTO_DESCOBERTA = "harmonia:descoberta";

const CONSULTA_DESKTOP = "(min-width: 900px)";
const CONSULTA_MOVEL = "(max-width: 899px)";

export const initTransicao = ({ aoRecolher } = {}) => {

    const bloco = document.querySelector(".transicao");
    const letreiro = bloco && bloco.querySelector(".letreiro");

    if (!bloco || !letreiro) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        bloco.classList.add("sem-transicao");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const consulta = gsap.matchMedia();

    const montar = (medidas, largura) => () => {

        let avisado = false;

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

        linha.to(
            ".letreiro__sobreposicao",
            { opacity: 1, ease: "none", duration: 0.5 },
            0.5
        );

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
                    bloco.dispatchEvent(new CustomEvent(EVENTO_DESCOBERTA));
                },
            },
            1.5
        );

        if (typeof aoRecolher === "function") {
            aoRecolher(linha, linha.duration());

            if (linha.scrollTrigger) {
                linha.scrollTrigger.refresh();
            }
        }

        return () => {
            gsap.set(letreiro, {
                clearProps: "maskSize,maskPosition,webkitMaskSize,webkitMaskPosition,opacity",
            });
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
