/* Hero: só a espiral. A cena inteira vive em src/three/espiralDourada.js. */

export const initHero = () => {
    const hero = document.querySelector(".hero");

    if (!hero) {
        return;
    }

    carregarFundo(hero);

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
    animarNaRolagem(hero);
};

/*
 * O three.js pesa 655 kB e a página não pode esperar por ele para
 * aparecer. Por isso o módulo entra por import dinâmico. Falhando
 * qualquer etapa, sem WebGL ou com o arquivo fora do ar, a seção fica com
 * o vórtice parado do CSS.
 *
 * A espiral desenha a própria marca, no miolo do vórtice: não existe peça
 * de HTML por cima dela.
 */
const carregarFundo = (hero) => {
    const canvas = hero.querySelector("#hero-gl");

    if (!canvas) {
        return;
    }

    const semGl = () => hero.classList.add("is-sem-gl");

    /*
     * A espiral gira sempre, inclusive para quem pediu movimento reduzido.
     *
     * A preferência existe contra movimento que compete com a leitura:
     * paralaxe presa à rolagem, coisa que pisca, peça que atravessa a
     * tela. Esta é uma deriva de uma volta a cada 48 segundos, sem
     * sobressalto e sem nada amarrado ao scroll, e é a identidade da
     * página: parada, o hero vira uma imagem chapada.
     *
     * Quem quiser devolver o congelamento troca `false` nesta linha por
     * `window.matchMedia("(prefers-reduced-motion: reduce)").matches`, e
     * mais nada.
     */
    import("../../three/espiralDourada.js")
        .then(({ iniciarEspiralDourada }) => iniciarEspiralDourada(canvas, { reduzido: false }))
        .then((assumiu) => {
            if (!assumiu) {
                semGl();
            }
        })
        .catch(semGl);
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
 * Passado o fim do caminho, `is-fora` tira o canvas do layout. Não é
 * enfeite: o observador dentro do módulo da espiral vê o canvas sem
 * área, entende que saiu da tela e desliga o laço de desenho. Enquanto
 * o hero só esmaecia, a cena continuava sendo desenhada quadro a quadro
 * para ninguém ver, disputando a GPU com a rolagem.
 *
 * Voltando ao topo, o `scrub` refaz o caminho ao contrário: a classe sai,
 * o laço volta, e a marca reaparece em opacidade 1, sem camada composta e
 * portanto nítida como no primeiro quadro.
 */
const animarNaRolagem = (hero) => {
    gsap.to(hero, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "60% top",
            scrub: true,
            onLeave: () => hero.classList.add("is-fora"),
            onEnterBack: () => hero.classList.remove("is-fora"),
        },
    });
};
