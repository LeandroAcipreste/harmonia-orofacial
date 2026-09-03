import { initAbertura } from "./src/core/abertura.js";
import { initPreloader } from "./src/components/preloader/preloader.js";
import { preaquecerFundos } from "./src/utils/preaquecer.js";
import { initScroll, recalcularAoCarregar } from "./src/core/scroll.js";
import { initNavigation } from "./src/components/navigation/navigation.js";
import { initFooter } from "./src/components/footer/footer.js";
import { initHero } from "./src/sections/hero/hero.js";
import { initSectionTwo } from "./src/sections/sectiontwo/sectiontwo.js";
import { initSectionThree } from "./src/sections/sectionthree/sectionthree.js";
import { initFaixaMarquee } from "./src/components/faixa-marquee/faixa-marquee.js";
import { initLetreiro, initTransicao } from "./src/sections/letreiro/letreiro.js";
import { montarLeituraDaDobra } from "./src/sections/sectionfour/sectionfour.js";
import { initSectionFive } from "./src/sections/sectionfive/sectionfive.js";

initAbertura();
initPreloader();

preaquecerFundos();

initScroll();

initNavigation();
initHero();
initSectionTwo();
initSectionThree();
initFaixaMarquee();
initLetreiro();


initTransicao({ aoRecolher: montarLeituraDaDobra });
initSectionFive();
initFooter();

recalcularAoCarregar();
