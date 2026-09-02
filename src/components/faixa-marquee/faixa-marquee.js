/*
 * Faixa Marquee: As logos deslizam para a esquerda com a rolagem do scroll.
 * 
 * Implementado via GSAP ScrollTrigger com `scrub: 1`, garantindo física de 
 * movimento fluida, desaceleração suave (inertia) e 100% de aceleração por GPU 
 * sem nenhum tranco ou travamento.
 */

export const initFaixaMarquee = () => {
    const faixa = document.querySelector(".faixa-marquee");
    const trilho = document.querySelector(".faixa-marquee__trilho");

    if (!faixa || !trilho) return;
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    /*
     * Animação ScrollTrigger amarrada ao scroll:
     * move de xPercent: 0 até -50% (exatamente a metade duplicada para o loop perfeito)
     * enquanto a seção atravessa a janela de visualização.
     */
    gsap.fromTo(
        trilho,
        { xPercent: 0 },
        {
            xPercent: -50,
            ease: "none",
            scrollTrigger: {
                trigger: faixa,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
                invalidateOnRefresh: true,
            },
        }
    );
};
