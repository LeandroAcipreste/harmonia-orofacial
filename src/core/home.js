import { initAbertura } from "./abertura.js";
import { initPreloader } from "../components/preloader/preloader.js";
import { initScroll, recalcularAoCarregar } from "./scroll.js";
import { initNavigation } from "../components/navigation/navigation.js";
import { initFooter } from "../components/footer/footer.js";
import { initHero } from "../sections/hero/hero.js";
import { initSectionTwo } from "../sections/sectiontwo/sectiontwo.js";
import { initSectionThree } from "../sections/sectionthree/sectionthree.js";
import { initFaixaMarquee } from "../components/faixa-marquee/faixa-marquee.js";
import { initLetreiro, initTransicao } from "../sections/letreiro/letreiro.js";
import { montarLeituraDaDobra } from "../sections/sectionfour/sectionfour.js";
import { initSectionFive } from "../sections/sectionfive/sectionfive.js";
import { initPonte } from "../sections/ponte/ponte.js";
import { initAvaliacoes } from "../sections/avaliacoes/avaliacoes.js";
import { initRolarDevagar } from "../components/rolar-devagar/rolar-devagar.js";

/* A home inteira, na ordem em que ela precisa acontecer. Só é baixada
   quando o main.js encontra data-pagina="home". */
export const init = () => {
    initAbertura();
    initPreloader();


    initScroll();

    initNavigation();
    initHero();
    initSectionTwo();
    initSectionThree();
    initFaixaMarquee();
    initLetreiro();

    initTransicao({ aoRecolher: montarLeituraDaDobra });
    initSectionFive();
    // as notas antes da ponte: a camada da ponte fica ligada ate o fim delas, e a secao precisa estar montada
    initAvaliacoes();
    initPonte();
    initFooter();
    initRolarDevagar();

    recalcularAoCarregar();
};
