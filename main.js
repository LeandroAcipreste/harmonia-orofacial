/* Ponto de entrada: importa os módulos e coordena a inicialização. */

import { initPreloader } from "./src/components/preloader/preloader.js";
import { initScroll, recalcularAoCarregar } from "./src/core/scroll.js";
import { initNavigation } from "./src/components/navigation/navigation.js";
import { initFooter } from "./src/components/footer/footer.js";
import { initHero } from "./src/sections/hero/hero.js";
import { initSectionTwo } from "./src/sections/sectiontwo/sectiontwo.js";
import { initSectionThree } from "./src/sections/sectionthree/sectionthree.js";
import { initLetreiro, initTransicao } from "./src/sections/letreiro/letreiro.js";
import {
    initSectionFour,
    montarLeituraDaDobra,
} from "./src/sections/sectionfour/sectionfour.js";
import { initSectionFive } from "./src/sections/sectionfive/sectionfive.js";
import { relatarEstado } from "./src/utils/diagnostico.js";

/* Primeiro de todos: a camada já nasce visível no HTML e este módulo
   assume o controle dela antes de qualquer outra coisa. */
initPreloader();

initScroll();

initNavigation();
initHero();
initSectionTwo();
initSectionThree();
initLetreiro();

initSectionFour();

/* O recolhimento monta a linha do tempo presa e recebe, aqui, a leitura
   da dobra da doutora para pendurar no fim dela. É main.js quem apresenta
   as duas: nenhuma das seções precisa conhecer a outra. */
initTransicao({ aoRecolher: montarLeituraDaDobra });
initSectionFive();
initFooter();

recalcularAoCarregar();

/* Relatório no console apontando o que impede as animações de rodar.
   Comentar esta linha quando o site for para o ar. */
relatarEstado();
