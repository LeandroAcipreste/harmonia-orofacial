/*
 * Hero: a espiral, em vídeo.
 *
 * Agora que o vídeo é um loop perfeito (início e fim idênticos), 
 * o atributo `loop` nativo do HTML cuida da volta de forma contínua,
 * sem precisarmos amarrar isso via JavaScript quadro a quadro.
 */

/*
 * A reprodução automática é um pedido, não uma garantia.
 *
 * O navegador pode recusar — economia de bateria, aba em segundo plano,
 * ajuste de quem visita — e pode pausar sozinho depois de já ter tocado.
 * As duas coisas se resolvem do mesmo jeito: pedindo de novo, sem
 * insistir, nos momentos em que faz sentido pedir.
 */
const tocar = (video) => {
    const promessa = video.play();

    if (promessa && typeof promessa.catch === "function") {
        promessa.catch(() => {
            /* Recusado. Fica o pôster, que é o primeiro quadro: a dobra
               continua sendo a espiral, parada. */
        });
    }
};

export const initHero = () => {
    const hero = document.querySelector(".hero");

    if (!hero) {
        return;
    }

    const video = hero.querySelector(".hero__video");

    if (video) {
        tocar(video);

        /* Pausado por conta própria — troca de aba, economia de energia —,
           volta a tocar assim que puder. */
        video.addEventListener("pause", () => {
            if (!hero.classList.contains("is-fora")) {
                tocar(video);
            }
        });
    }

    /*
     * O esmaecimento não é opcional por preferência de movimento.
     *
     * Ele não é enfeite: é o que tira a cena da tela antes que a rolagem
     * suave comece a reamostrá-la em posição fracionária e borrar a marca.
     * Deixá-lo de fora para quem pediu movimento reduzido daria a essas
     * pessoas justamente a versão pior, com a marca borrada o resto da
     * visita. E ele não move nada: só apaga, amarrado à rolagem.
     */
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);
    animarNaRolagem(hero, video);
};

/*
 * O hero sai de cena conforme a rolagem desce, e some por inteiro.
 *
 * Antes ele parava em 0.15 e ficava por baixo do resto da página. Uma
 * peça com opacidade entre 0 e 1 vira camada composta, e o navegador a
 * reamostra em posição fracionária a cada quadro da rolagem suave: a
 * marca, que tem texto e um aro fino, saía borrada, e assim ficava o
 * resto da visita. Chegando a zero o problema deixa de existir, porque
 * não sobra nada para reamostrar.
 *
 * O laço roda até a rolagem alcançar a dobra de baixo, e não além:
 * passado o fim do caminho, `is-fora` tira o vídeo do layout, o navegador
 * para de decodificar.
 *
 * Voltando ao topo, o `scrub` refaz o caminho ao contrário: a classe sai,
 * o vídeo volta ao layout e é mandado tocar.
 */
const animarNaRolagem = (hero, video) => {
    gsap.to(hero, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "60% top",
            scrub: true,
            onLeave: () => {
                hero.classList.add("is-fora");

                if (video) {
                    video.pause();
                }
            },
            onEnterBack: () => {
                hero.classList.remove("is-fora");

                if (video) {
                    tocar(video);
                }
            },
        },
    });
};
