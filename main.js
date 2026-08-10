/* Ponto de entrada: importa os módulos e coordena a inicialização. */

import { initScroll, recalcularAoCarregar } from "./src/core/scroll.js";
import { initNavigation } from "./src/components/navigation/navigation.js";
import { initHero } from "./src/sections/hero/hero.js";
import { initSectionTwo } from "./src/sections/sectiontwo/sectiontwo.js";
import { initSectionThree } from "./src/sections/sectionthree/sectionthree.js";
import { initSectionFour } from "./src/sections/sectionfour/sectionfour.js";
import { initSectionFive } from "./src/sections/sectionfive/sectionfive.js";
import { relatarEstado } from "./src/utils/diagnostico.js";

initScroll();

initNavigation();
initHero();
initSectionTwo();
initSectionThree();
initSectionFour();
initSectionFive();

recalcularAoCarregar();

/* Relatório no console apontando o que impede as animações de rodar.
   Comentar esta linha quando o site for para o ar. */
relatarEstado();
