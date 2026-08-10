# Vanilla Frontend Engineering Skill

## Arquitetura, Padrões de Projeto e Regras de Código

---

# 1. MISSÃO

Esta skill define a arquitetura obrigatória para projetos frontend desenvolvidos com:

* HTML5
* CSS3
* JavaScript ES6+
* ES Modules
* DOM APIs
* GSAP
* GSAP ScrollTrigger
* Lenis
* Three.js

O objetivo é produzir interfaces:

* modulares;
* escaláveis;
* performáticas;
* semanticamente estruturadas;
* visualmente sofisticadas;
* fáceis de manter;
* fáceis de depurar;
* sem dependência de frameworks frontend ou CSS frameworks.

A arquitetura deve separar claramente:

```text
ESTRUTURA
HTML

APRESENTAÇÃO
CSS

COMPORTAMENTO
JavaScript

ANIMAÇÃO
GSAP / ScrollTrigger

SCROLL
Lenis

3D / WEBGL
Three.js
```

---

# 2. REGRAS ABSOLUTAS

Estas regras têm prioridade máxima.

## PROIBIDO

Nunca utilizar:

* React;
* Vue;
* Angular;
* Svelte;
* jQuery;
* Bootstrap;
* Tailwind;
* Bulma;
* Foundation;
* Materialize;
* CSS-in-JS;
* `<style>`;
* `style=""`;
* JavaScript inline;
* `<script>` contendo lógica;
* comentários no HTML;
* CSS inline através de JavaScript;
* código monolítico;
* arquivos gigantes sem responsabilidade definida;
* dependências desnecessárias.

Nunca transformar o projeto em uma aplicação baseada em framework.

---

# 3. TECNOLOGIAS PERMITIDAS

## HTML

HTML5 semântico.

## CSS

CSS3 nativo.

## JavaScript

JavaScript moderno utilizando ES Modules.

Utilizar:

```javascript
import
export
const
let
async
await
Promise
class
modules
```

quando apropriado.

Os navegadores modernos suportam módulos JavaScript nativamente através de `import` e `export`.

## Bibliotecas

Podem ser utilizadas:

* GSAP;
* ScrollTrigger;
* Lenis;
* Three.js.

Outras bibliotecas somente quando houver justificativa técnica clara.

---

# 4. PRINCÍPIOS DE ARQUITETURA

A arquitetura deve seguir principalmente:

## Separation of Concerns

Cada camada possui uma responsabilidade.

```text
HTML
→ estrutura

CSS
→ apresentação

JS
→ comportamento

GSAP
→ animação

ScrollTrigger
→ animação orientada por scroll

Lenis
→ smooth scrolling

Three.js
→ renderização 3D
```

---

## Single Responsibility Principle

Cada módulo deve possuir uma responsabilidade principal.

Errado:

```text
hero.js
→ menu
→ modal
→ formulário
→ slider
→ animação
→ Three.js
```

Correto:

```text
hero.js
→ comportamento e animações do Hero

navigation.js
→ navegação

modal.js
→ modal

form.js
→ formulário

scene.js
→ Three.js
```

---

## Low Coupling

Módulos não devem depender desnecessariamente de detalhes internos de outros módulos.

Evitar:

```javascript
hero.js
→ manipula diretamente elementos internos de services
```

Preferir comunicação através de funções públicas, eventos ou estado compartilhado controlado.

---

## High Cohesion

Tudo dentro de um módulo deve pertencer ao mesmo domínio.

Exemplo:

```text
hero/
├── hero.js
└── hero.css
```

Tudo relacionado ao Hero deve permanecer nesse módulo.

---

# 5. ESTRUTURA DO PROJETO

A estrutura padrão deve ser:

```text
/
├── index.html
├── style.css
├── script.js
│
├── src/
│   ├── sections/
│   │   ├── hero/
│   │   │   ├── hero.js
│   │   │   └── hero.css
│   │   │
│   │   ├── about/
│   │   │   ├── about.js
│   │   │   └── about.css
│   │   │
│   │   ├── services/
│   │   │   ├── services.js
│   │   │   └── services.css
│   │   │
│   │   └── contact/
│   │       ├── contact.js
│   │       └── contact.css
│   │
│   ├── components/
│   │   ├── header/
│   │   │   ├── header.js
│   │   │   └── header.css
│   │   │
│   │   ├── navigation/
│   │   │   ├── navigation.js
│   │   │   └── navigation.css
│   │   │
│   │   └── footer/
│   │       ├── footer.js
│   │       └── footer.css
│   │
│   ├── animations/
│   │   ├── gsap.js
│   │   ├── scroll.js
│   │   └── transitions.js
│   │
│   ├── three/
│   │   ├── scene.js
│   │   ├── camera.js
│   │   ├── renderer.js
│   │   ├── lights.js
│   │   └── objects.js
│   │
│   ├── core/
│   │   ├── app.js
│   │   ├── events.js
│   │   └── state.js
│   │
│   └── utils/
│       ├── dom.js
│       ├── math.js
│       ├── device.js
│       └── performance.js
│
└── assets/
    ├── images/
    ├── videos/
    ├── fonts/
    └── models/
```

---

# 6. RESPONSABILIDADE DOS ARQUIVOS DA RAIZ

## index.html

Somente estrutura HTML.

Deve conter:

* metadata;
* links externos;
* estrutura da página;
* carregamento do módulo principal.

Exemplo:

```html
<script type="module" src="./script.js"></script>
```

Nenhuma lógica deve existir dentro do HTML.

---

## style.css

Somente estilos globais.

Responsabilidades:

* reset;
* `:root`;
* variáveis;
* tipografia;
* body;
* html;
* containers globais;
* utilitários globais;
* acessibilidade;
* regras gerais.

Não colocar estilos específicos de componentes neste arquivo.

---

## script.js

É o entry point.

Responsabilidades:

* importar módulos;
* inicializar aplicação;
* inicializar bibliotecas globais;
* coordenar módulos.

Não deve conter a implementação completa das seções.

Exemplo:

```javascript
import './style.css';

import './src/core/app.js';

import './src/sections/hero/hero.js';
import './src/sections/about/about.js';
import './src/sections/services/services.js';

import './src/components/navigation/navigation.js';
```

---

# 7. ES MODULES

Utilizar ES Modules como mecanismo principal de modularização.

Preferir:

```javascript
import { initHero } from './hero.js';
```

e:

```javascript
export const initHero = () => {
};
```

Evitar criar um namespace global:

```javascript
window.App = {};
window.Utils = {};
window.Hero = {};
```

Módulos devem encapsular seu próprio escopo.

Evitar dependências circulares:

```text
hero.js
→ about.js
→ hero.js
```

A arquitetura deve possuir dependências predominantemente unidirecionais.

---

# 8. PADRÃO DE ENTRY POINT

O projeto deve possuir um ponto de entrada:

```text
script.js
```

Ele importa e inicializa a aplicação.

Arquitetura:

```text
index.html
     ↓
 script.js
     ↓
   core
     ↓
sections/components
     ↓
animations/utils
```

Evitar que módulos periféricos importem o entry point.

---

# 9. PADRÃO MODULE

O padrão principal do projeto é o Module Pattern através de ES Modules.

Exemplo:

```javascript
const elements = {
    section: document.querySelector('.hero'),
    title: document.querySelector('.hero__title'),
};

const init = () => {
    if (!elements.section) {
        return;
    }

    setupAnimation();
};

const setupAnimation = () => {
};

export {
    init,
};
```

O módulo deve expor somente o que outros módulos realmente precisam.

---

# 10. PADRÃO COMPONENT

Componentes visuais reutilizáveis devem ficar em:

```text
src/components/
```

Exemplos:

```text
header
navigation
button
modal
cursor
loader
accordion
card
```

Uma seção não deve ser considerada automaticamente um componente reutilizável.

Diferença:

```text
components/
→ elementos reutilizáveis

sections/
→ blocos específicos da página
```

---

# 11. PADRÃO FACTORY

Utilizar Factory Pattern quando existir necessidade de criar múltiplos objetos com a mesma estrutura.

Exemplo:

```javascript
const createAnimationConfig = (options = {}) => ({
    duration: 1,
    ease: 'power3.out',
    ...options,
});
```

Não utilizar Factory apenas para criar uma função simples.

O padrão deve ser aplicado quando reduzir duplicação ou centralizar criação de objetos complexos.

---

# 12. PADRÃO OBSERVER

Utilizar eventos para comunicação desacoplada quando módulos precisarem reagir a acontecimentos sem criar dependência direta.

Exemplo:

```javascript
const eventBus = new EventTarget();

export const emit = (eventName, detail) => {
    eventBus.dispatchEvent(
        new CustomEvent(eventName, { detail })
    );
};

export const subscribe = (eventName, callback) => {
    eventBus.addEventListener(eventName, callback);
};
```

Uso:

```javascript
subscribe('navigation:opened', () => {
    // reação
});
```

Evitar criar um Event Bus global para tudo.

Utilizar somente quando realmente reduzir acoplamento.

---

# 13. PADRÃO STATE

Quando uma interface possuir estado compartilhado, centralizar esse estado.

Exemplo:

```javascript
const state = {
    menuOpen: false,
    currentSection: null,
};
```

Não espalhar variáveis globais pelo projeto.

Não utilizar `localStorage` como estado global automaticamente.

Usar armazenamento persistente somente quando houver necessidade real.

---

# 14. PADRÃO ADAPTER

Quando uma biblioteca externa precisar ser isolada da aplicação, criar um adapter.

Exemplo:

```text
src/
└── animations/
    └── gsap-adapter.js
```

Isso permite que a aplicação dependa de uma interface própria em vez de espalhar chamadas de uma biblioteca por todo o código.

Especialmente útil para:

* GSAP;
* Lenis;
* Three.js.

---

# 15. PADRÃO FACADE

Quando uma biblioteca possuir uma API extensa, criar uma interface simplificada para o restante da aplicação.

Exemplo:

```javascript
animateIn(element);
animateOut(element);
scrollTo(target);
```

Em vez de espalhar:

```javascript
gsap.to(...)
gsap.from(...)
lenis.scrollTo(...)
```

por dezenas de arquivos.

A Facade não deve esconder funcionalidades que precisam ser acessadas diretamente.

---

# 16. DOM

O DOM deve ser manipulado somente através de JavaScript.

O DOM é a interface que representa o documento e permite que scripts consultem e modifiquem sua estrutura.

Preferir:

```javascript
const hero = document.querySelector('.hero');
```

Em vez de:

```javascript
document.querySelector('section');
```

Preferir seletores específicos.

---

# 17. CACHE DE ELEMENTOS

Não realizar buscas repetidas desnecessariamente.

Evitar:

```javascript
document.querySelector('.hero');
document.querySelector('.hero');
document.querySelector('.hero');
```

Preferir:

```javascript
const hero = document.querySelector('.hero');
```

Quando vários elementos pertencem ao mesmo componente:

```javascript
const hero = document.querySelector('.hero');

if (!hero) {
    return;
}

const title = hero.querySelector('.hero__title');
const button = hero.querySelector('.hero__button');
```

---

# 18. INICIALIZAÇÃO DEFENSIVA

Todo módulo de seção deve verificar se seu elemento raiz existe.

Exemplo:

```javascript
const initHero = () => {
    const hero = document.querySelector('.hero');

    if (!hero) {
        return;
    }

    // inicialização
};

initHero();
```

Isso permite que módulos sejam reutilizados em diferentes páginas.

---

# 19. CLASSES CSS

Toda interface visual deve utilizar classes.

Preferir BEM:

```text
.hero
.hero__content
.hero__title
.hero__description
.hero__button

.hero--featured
```

Estados devem utilizar classes semânticas:

```text
.is-active
.is-open
.is-hidden
.is-visible
.is-loading
.is-disabled
```

Não utilizar:

```text
.active
.open
.hidden
```

quando houver risco de conflito global.

---

# 20. CSS E JAVASCRIPT

JavaScript deve controlar estado.

CSS deve controlar apresentação.

Preferir:

```javascript
element.classList.add('is-active');
```

CSS:

```css
.navigation.is-active {
    opacity: 1;
}
```

Evitar:

```javascript
element.style.opacity = '1';
element.style.transform = 'translateY(0)';
```

Exceção:

GSAP pode modificar propriedades durante animações.

---

# 21. CSS CUSTOM PROPERTIES

Utilizar variáveis CSS para valores globais.

Exemplo:

```css
:root {
    --color-primary: #000;
    --color-secondary: #fff;

    --space-xs: 0.5rem;
    --space-sm: 1rem;
    --space-md: 2rem;
    --space-lg: 4rem;

    --container-width: 1200px;

    --transition-fast: 200ms;
    --transition-base: 400ms;
}
```

Não duplicar valores globais desnecessariamente.

---

# 22. RESPONSIVIDADE

Preferir:

* fluid typography;
* `clamp()`;
* Grid;
* Flexbox;
* media queries;
* unidades relativas.

Evitar criar uma regra diferente para cada resolução.

---

# 23. GSAP

GSAP deve ser a principal ferramenta para animações complexas.

GSAP fornece tweens e timelines como abstrações centrais para controlar animações.

Preferir:

```javascript
gsap.to(element, {
    y: 0,
    opacity: 1,
    duration: 1,
});
```

Para sequências:

```javascript
const timeline = gsap.timeline();

timeline
    .from(...)
    .to(...)
    .from(...);
```

Utilizar Timeline quando houver relacionamento temporal entre animações.

Não criar dezenas de `gsap.to()` independentes quando uma timeline representar melhor a sequência.

---

# 24. GSAP CONTEXTUAL

Cada módulo de animação deve trabalhar dentro do seu próprio escopo.

Preferir selecionar elementos a partir da seção:

```javascript
const hero = document.querySelector('.hero');

if (!hero) {
    return;
}

const title = hero.querySelector('.hero__title');
```

Evitar seletores globais genéricos.

---

# 25. GSAP E CSS

GSAP é responsável pela animação.

CSS é responsável pelo estado visual padrão.

Exemplo:

```css
.hero__title {
    opacity: 0;
    transform: translateY(40px);
}
```

GSAP controla a transição para:

```text
opacity: 1
transform: translateY(0)
```

Não utilizar GSAP para substituir toda a arquitetura CSS.

---

# 26. PROPRIEDADES ANIMÁVEIS

Priorizar:

```text
transform
opacity
```

Evitar animações constantes de:

```text
width
height
top
left
margin
```

quando `transform` puder resolver.

---

# 27. SCROLLTRIGGER

ScrollTrigger deve ser utilizado para animações ligadas ao scroll.

A API suporta:

* trigger;
* start;
* end;
* scrub;
* pin;
* snap;
* callbacks;
* toggleClass;
* integração com timelines.

Exemplo:

```javascript
gsap.to(element, {
    y: 100,
    scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: true,
    },
});
```

---

# 28. SCROLLTRIGGER E RESPONSIVIDADE

Para comportamentos diferentes entre dispositivos, utilizar mecanismos responsivos do ScrollTrigger e media queries.

Não criar hacks baseados em:

```javascript
if (window.innerWidth === 768)
```

Preferir ranges:

```javascript
ScrollTrigger.matchMedia();
```

quando apropriado.

---

# 29. SCROLLTRIGGER REFRESH

Depois de alterações significativas no layout, verificar se os triggers precisam ser recalculados.

Não criar chamadas indiscriminadas de:

```javascript
ScrollTrigger.refresh();
```

Executar somente quando necessário.

---

# 30. LENIS

Lenis deve ser utilizado exclusivamente para smooth scrolling.

Lenis é projetado para ser leve, performático e baseado no scroll nativo, mantendo compatibilidade com recursos como `position: sticky`, links de âncora e acessibilidade.

Não transformar Lenis em gerenciador geral de estado.

---

# 31. LENIS + GSAP

Quando Lenis e ScrollTrigger forem utilizados juntos, sincronizar ambos.

Arquitetura recomendada:

```text
Lenis
   ↓
scroll event
   ↓
ScrollTrigger.update()

GSAP ticker
   ↓
Lenis.raf()
```

A integração documentada pelo Lenis utiliza esse padrão de sincronização e desativa o lag smoothing do GSAP para evitar discrepâncias temporais.

Centralizar essa integração em:

```text
src/core/scroll.js
```

ou:

```text
src/animations/scroll.js
```

Não duplicar a instância do Lenis em cada seção.

---

# 32. LENIS E ÂNCORAS

Quando o projeto possuir navegação por âncoras, configurar o Lenis de acordo com a necessidade do projeto.

Não implementar manualmente um sistema de smooth scrolling paralelo ao Lenis.

---

# 33. LENIS E ELEMENTOS INTERNOS

Para modais, menus ou áreas com scroll interno, considerar as opções documentadas pelo Lenis.

Quando necessário utilizar:

```text
data-lenis-prevent
```

ou mecanismos equivalentes.

Não criar listeners globais de wheel para simular esse comportamento.

---

# 34. THREE.JS

Three.js deve permanecer isolado em:

```text
src/three/
```

ou dentro da seção que realmente possuir a cena 3D.

Nunca misturar:

```text
DOM
GSAP
Lenis
Three.js
```

em um único arquivo gigante.

---

# 35. ARQUITETURA THREE.JS

Separar responsabilidades:

```text
three/
├── scene.js
├── camera.js
├── renderer.js
├── lights.js
├── objects.js
└── animation.js
```

Responsabilidades:

```text
scene.js
→ Scene

camera.js
→ Camera

renderer.js
→ WebGLRenderer

lights.js
→ iluminação

objects.js
→ Mesh / Geometry / Material

animation.js
→ render loop
```

---

# 36. THREE.JS RENDER LOOP

Manter um único loop de renderização por cena.

Evitar:

```javascript
requestAnimationFrame(...)
```

em múltiplos módulos para a mesma cena.

Centralizar:

```text
render loop
```

e permitir que outros módulos registrem atualizações quando necessário.

---

# 37. THREE.JS E LENIS

Quando houver experiência 3D sincronizada com scroll:

```text
Lenis
↓
scroll state
↓
Three.js scene
```

Não criar outro sistema independente de scroll dentro do Three.js.

---

# 38. THREE.JS E GSAP

GSAP pode controlar propriedades de objetos Three.js.

Exemplo conceitual:

```javascript
gsap.to(mesh.rotation, {
    y: Math.PI * 2,
    duration: 2,
});
```

Porém:

* GSAP controla a animação;
* Three.js controla a renderização;
* o render loop permanece centralizado.

---

# 39. DISPOSAL THREE.JS

Ao remover uma cena ou objeto, liberar recursos quando aplicável:

```text
Geometry
Material
Texture
RenderTarget
WebGLRenderer
```

Não manter objetos WebGL abandonados.

Isso é especialmente importante em experiências que criam/desmontam cenas dinamicamente.

---

# 40. PERFORMANCE

Prioridades:

```text
1. CSS
2. DOM APIs
3. GPU-friendly transforms
4. GSAP
5. Three.js somente quando necessário
```

Não utilizar Three.js para resolver problemas que CSS ou GSAP resolvem.

Não utilizar GSAP para resolver problemas que CSS resolve.

---

# 41. REQUESTANIMATIONFRAME

Nunca criar vários loops independentes sem necessidade.

Evitar:

```javascript
requestAnimationFrame(loopA);
requestAnimationFrame(loopB);
requestAnimationFrame(loopC);
```

Preferir um scheduler centralizado quando múltiplas animações dependem de atualização contínua.

---

# 42. EVENTOS

Adicionar listeners somente quando necessário.

Preferir funções nomeadas:

```javascript
const handleClick = () => {
};
```

Em vez de:

```javascript
button.addEventListener('click', () => {
});
```

quando houver necessidade de posteriormente remover o listener.

Para listeners temporários:

```javascript
element.removeEventListener('click', handleClick);
```

---

# 43. EVENT DELEGATION

Para listas dinâmicas, utilizar Event Delegation.

Em vez de adicionar listeners individuais a centenas de elementos:

```javascript
container.addEventListener('click', (event) => {
    const target = event.target.closest('.card');

    if (!target) {
        return;
    }
});
```

Usar somente quando fizer sentido para a estrutura.

---

# 44. CLEANUP

Todo módulo que cria:

* listeners;
* timers;
* observers;
* GSAP animations;
* ScrollTriggers;
* Three.js resources;

deve possuir estratégia de cleanup quando o contexto exigir desmontagem.

Exemplo conceitual:

```javascript
const destroy = () => {
    animation.kill();
    window.removeEventListener('resize', handleResize);
};
```

---

# 45. INTERSECTION OBSERVER

Para comportamentos simples de entrada no viewport, considerar:

```javascript
IntersectionObserver
```

antes de utilizar ScrollTrigger.

Regra:

```text
Interação simples com viewport
→ IntersectionObserver

Animação complexa baseada em scroll
→ ScrollTrigger
```

Não utilizar GSAP + ScrollTrigger para algo que um Observer resolve adequadamente.

---

# 46. MUTATION OBSERVER

Utilizar `MutationObserver` somente quando houver necessidade real de reagir a alterações no DOM.

Não utilizar como solução padrão para sincronização.

---

# 47. DEBOUNCE E THROTTLE

Utilizar quando eventos de alta frequência exigirem controle:

* resize;
* input;
* scroll customizado;
* mousemove;
* pointermove.

Não aplicar automaticamente em todo evento.

---

# 48. ACCESSIBILITY

A arquitetura deve preservar:

* navegação por teclado;
* foco;
* `aria-*` quando necessário;
* semântica HTML;
* contraste;
* `prefers-reduced-motion`.

Animações não podem impedir a utilização da interface.

---

# 49. REDUCED MOTION

Quando o projeto possuir animações significativas, respeitar:

```css
@media (prefers-reduced-motion: reduce) {
}
```

E reduzir ou desabilitar animações não essenciais.

JavaScript também deve considerar a preferência do usuário quando necessário.

---

# 50. NOMENCLATURA

Utilizar nomes descritivos.

Classes:

```text
hero__title
hero__description
hero__button
```

Funções:

```text
initHero()
setupHeroAnimation()
handleMenuToggle()
destroyHero()
```

Variáveis:

```text
heroElement
navigationElement
animationTimeline
scrollInstance
```

Evitar:

```text
x
y
foo
bar
data
thing
temp
```

quando não forem semanticamente adequados.

---

# 51. FUNÇÕES

Funções devem possuir uma única responsabilidade.

Evitar:

```javascript
initPage();
```

com centenas de linhas.

Preferir:

```javascript
initNavigation();
initHero();
initAbout();
initAnimations();
```

---

# 52. EARLY RETURN

Preferir early return para reduzir nesting.

Errado:

```javascript
if (hero) {
    if (title) {
        if (button) {
            init();
        }
    }
}
```

Preferir:

```javascript
if (!hero) {
    return;
}

if (!title) {
    return;
}

if (!button) {
    return;
}

init();
```

---

# 53. ERROR HANDLING

Erros previsíveis devem ser tratados.

Exemplo:

```javascript
try {
    await loadResource();
} catch (error) {
    console.error('Falha ao carregar recurso:', error);
}
```

Não utilizar `try/catch` indiscriminadamente.

Não esconder erros silenciosamente.

---

# 54. ASYNC / AWAIT

Preferir `async/await` para fluxos assíncronos complexos.

Evitar cadeias excessivamente longas de `.then()` quando `async/await` tornar o código mais claro.

---

# 55. CONSTANTES

Valores de configuração devem ser centralizados.

Exemplo:

```javascript
const ANIMATION_CONFIG = {
    duration: 1,
    ease: 'power3.out',
};
```

Evitar magic numbers espalhados.

---

# 56. MAGIC NUMBERS

Evitar:

```javascript
gsap.to(element, {
    y: 137,
    duration: 1.37,
});
```

sem significado contextual.

Preferir:

```javascript
const HERO_ANIMATION_DISTANCE = 140;
const HERO_ANIMATION_DURATION = 1.4;
```

Quando o valor possuir significado de negócio ou configuração.

Não criar constantes artificiais para valores triviais.

---

# 57. CONFIGURAÇÃO

Configurações compartilhadas devem ficar separadas da lógica.

Exemplo:

```text
src/
└── core/
    └── config.js
```

Não espalhar configurações globais por dezenas de arquivos.

---

# 58. NÃO DUPLICAR INSTÂNCIAS

Nunca criar múltiplas instâncias globais desnecessárias de:

```text
Lenis
GSAP global configuration
Three.js renderer
Event Bus
```

Uma infraestrutura compartilhada deve possuir um único ponto de inicialização quando o projeto exigir comportamento global.

---

# 59. RESPONSABILIDADE DAS SEÇÕES

Uma seção pode possuir:

```text
section.js
section.css
```

O JavaScript deve controlar:

* eventos;
* comportamento;
* animações;
* integração com outros módulos.

O CSS deve controlar:

* layout;
* aparência;
* estados visuais;
* responsividade.

---

# 60. REGRA DE ISOLAMENTO

Uma seção não deve conhecer detalhes internos de outra.

Errado:

```javascript
hero.js
→ document.querySelector('.services__card')
```

Correto:

```javascript
hero.js
→ emite evento

services.js
→ reage ao evento
```

quando houver necessidade de comunicação.

---

# 61. ARQUITETURA DE DEPENDÊNCIAS

Preferir:

```text
core
 ↓
components / sections
 ↓
utils
```

Evitar:

```text
utils
 ↓
section
 ↓
core
 ↓
utils
```

Dependências circulares devem ser evitadas.

---

# 62. UTILITIES

`utils/` deve conter funções realmente genéricas.

Exemplos:

```text
dom.js
math.js
device.js
performance.js
```

Não colocar lógica específica de uma seção dentro de `utils`.

Errado:

```text
utils/heroAnimation.js
```

Correto:

```text
sections/hero/hero.js
```

---

# 63. QUANDO USAR CLASSES JAVASCRIPT

Classes podem ser utilizadas quando houver:

* múltiplas instâncias;
* estado interno;
* lifecycle;
* encapsulamento de comportamento;
* objetos complexos.

Não transformar todo módulo em uma classe.

JavaScript possui suporte nativo a classes e métodos, mas classes são uma ferramenta de modelagem e não uma obrigação arquitetural.

Para módulos simples, preferir funções.

---

# 64. QUANDO USAR FUNÇÕES

Preferir funções quando:

* existe uma única responsabilidade;
* não existe estado persistente complexo;
* o comportamento pode ser stateless;
* não existem múltiplas instâncias.

Exemplo:

```javascript
export const formatValue = (value) => {
    return value.toFixed(2);
};
```

---

# 65. PADRÃO COMPOSITION OVER INHERITANCE

Preferir composição a hierarquias extensas de classes.

Evitar:

```text
BaseAnimation
→ HeroAnimation
→ AdvancedHeroAnimation
→ MobileHeroAnimation
```

Preferir composição:

```text
hero
+
animation
+
scroll
+
interaction
```

---

# 66. HTML SEM COMENTÁRIOS

Nunca adicionar:

```html
<!-- Hero -->
```

Nunca:

```html
<!-- Navigation -->
```

Nunca comentários técnicos no DOM.

A estrutura deve ser autoexplicativa através de:

* semântica;
* classes;
* hierarquia;
* nomes.

---

# 67. COMENTÁRIOS JAVASCRIPT

Comentários devem explicar:

* decisões arquiteturais;
* comportamento não óbvio;
* integração específica;
* workaround inevitável.

Não comentar código óbvio.

Errado:

```javascript
// Seleciona o botão
const button = document.querySelector('.button');
```

Correto:

```javascript
// Mantém o scroll sincronizado com o ticker do GSAP.
```

---

# 68. COMENTÁRIOS CSS

Comentários devem ser curtos.

Exemplo:

```css
/* Hero */
```

```css
/* Responsive layout */
```

```css
/* Reduced motion */
```

Não escrever documentação extensa dentro do CSS.

---

# 69. DOCUMENTAÇÃO EXTERNA

Quando existir dúvida sobre uma API de:

* GSAP;
* ScrollTrigger;
* Lenis;
* Three.js;
* Web APIs;

consultar a documentação oficial antes de inventar comportamento ou API.

Não assumir que uma API funciona com base em versões antigas.

---

# 70. VERSIONAMENTO DE CDN

Ao utilizar CDN, preferir versões explícitas e estáveis.

Evitar dependências sem versão:

```text
https://cdn.../library/latest
```

Preferir:

```text
https://cdn.../library/X.Y.Z/...
```

Isso reduz mudanças inesperadas.

---

# 71. CDN E ORDEM DE CARREGAMENTO

Bibliotecas globais devem ser carregadas antes dos módulos que dependem delas.

A ordem deve ser explicitamente planejada.

Exemplo conceitual:

```text
GSAP
↓
ScrollTrigger
↓
Lenis
↓
Three.js
↓
script.js
```

Não depender de condições de corrida.

---

# 72. THREE.JS MODULES

Quando Three.js for utilizado como módulo, respeitar sua arquitetura baseada em ES Modules.

Three.js documenta explicitamente o uso de ES modules e `import`/`script type="module"` em sua documentação.

Não misturar indiscriminadamente:

```text
global THREE
+
import THREE
```

no mesmo projeto.

Escolher uma estratégia e mantê-la consistente.

---

# 73. THREE.JS RESPONSIVE

Renderização 3D deve responder corretamente a:

* resize;
* pixel ratio;
* aspect ratio;
* viewport.

Centralizar:

```text
resize handler
```

e evitar múltiplos listeners independentes para a mesma cena.

---

# 74. THREE.JS DEVICE PIXEL RATIO

Não utilizar pixel ratio máximo indiscriminadamente.

Considerar limitar o valor em dispositivos de alta densidade para preservar performance.

Exemplo conceitual:

```javascript
renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);
```

O limite deve ser definido de acordo com a experiência.

---

# 75. ASSETS PESADOS

Assets grandes devem ser tratados conscientemente.

Priorizar:

* WebP;
* AVIF;
* compressão;
* lazy loading;
* preload somente quando necessário;
* resolução adequada;
* vídeos comprimidos;
* modelos 3D otimizados.

Não carregar recursos gigantes no primeiro paint sem necessidade.

---

# 76. LAZY LOADING

Utilizar lazy loading para recursos que não são críticos para o primeiro viewport.

Exemplo:

```html
<img class="gallery__image" loading="lazy" ...>
```

Não aplicar lazy loading cegamente ao conteúdo crítico do Hero.

---

# 77. CRITICAL PATH

Priorizar o carregamento de:

```text
HTML
↓
CSS crítico
↓
conteúdo principal
↓
JavaScript necessário
↓
animações secundárias
↓
recursos pesados
```

Experiências 3D e animações secundárias não devem bloquear inutilmente o conteúdo principal.

---

# 78. ACESSIBILIDADE DE ANIMAÇÃO

Toda animação deve ser considerada progressivamente aprimorável.

Se GSAP, Lenis ou Three.js falhar:

```text
conteúdo continua acessível
layout continua funcional
navegação continua possível
```

Nunca fazer a funcionalidade depender exclusivamente de animação.

---

# 79. PROGRESSIVE ENHANCEMENT

Estrutura:

```text
HTML
↓
funcionalidade básica
↓
CSS
↓
JavaScript
↓
animações
↓
efeitos avançados
↓
3D
```

O projeto deve funcionar sem depender de efeitos decorativos.

---

# 80. REGRA DE COMPLEXIDADE

Sempre utilizar a solução mais simples capaz de cumprir o requisito.

Exemplo:

```text
Fade simples
→ CSS

Entrada com sequência
→ GSAP

Entrada ligada ao scroll
→ ScrollTrigger

Smooth scrolling
→ Lenis

Objeto 3D
→ Three.js
```

Não utilizar Three.js para um fade.

Não utilizar GSAP para uma transição CSS simples.

Não utilizar Lenis para uma animação.

---

# 81. CHECKLIST ANTES DE FINALIZAR

Antes de considerar uma implementação concluída, verificar:

## Arquitetura

* [ ] Cada seção possui responsabilidade clara.
* [ ] Não existem arquivos monolíticos.
* [ ] Não existem dependências circulares.
* [ ] Módulos utilizam `import/export`.
* [ ] Entry point está limpo.

## HTML

* [ ] HTML5 semântico.
* [ ] Classes consistentes.
* [ ] Nenhum `<style>`.
* [ ] Nenhum JavaScript inline.
* [ ] Nenhum comentário.
* [ ] Nenhum `style=""`.

## CSS

* [ ] CSS puro.
* [ ] Nenhum framework.
* [ ] BEM ou convenção equivalente.
* [ ] Variáveis globais centralizadas.
* [ ] Responsividade implementada.
* [ ] Estados controlados por classes.

## JavaScript

* [ ] Funções pequenas.
* [ ] Responsabilidade única.
* [ ] Early returns.
* [ ] Sem variáveis globais desnecessárias.
* [ ] Eventos corretamente registrados.
* [ ] Cleanup considerado.
* [ ] Sem código duplicado.

## GSAP

* [ ] Timeline utilizada quando apropriado.
* [ ] Transform/opacity priorizados.
* [ ] ScrollTrigger registrado quando necessário.
* [ ] Não existem animações duplicadas.

## Lenis

* [ ] Uma instância global quando aplicável.
* [ ] Integração correta com GSAP.
* [ ] Scroll interno considerado.
* [ ] Âncoras funcionando.

## Three.js

* [ ] Cena isolada.
* [ ] Render loop centralizado.
* [ ] Resize tratado.
* [ ] Pixel ratio controlado.
* [ ] Recursos liberados quando necessário.
* [ ] Não utilizado sem necessidade.

## Performance

* [ ] Console sem erros.
* [ ] Assets otimizados.
* [ ] Animações performáticas.
* [ ] Não existem listeners desnecessários.
* [ ] Não existem loops duplicados.

## Acessibilidade

* [ ] Navegação por teclado.
* [ ] Foco preservado.
* [ ] Semântica correta.
* [ ] `prefers-reduced-motion` considerado.
* [ ] Conteúdo funciona sem animações.

---

# 82. PROTOCOLO DE IMPLEMENTAÇÃO

Antes de escrever código:

### Etapa 1 — Analisar

Identificar:

* páginas;
* seções;
* componentes;
* interações;
* animações;
* recursos;
* dependências externas.

### Etapa 2 — Arquitetar

Definir:

```text
sections
components
core
animations
three
utils
```

### Etapa 3 — Estruturar

Criar os arquivos necessários.

Não criar arquivos que não possuam responsabilidade definida.

### Etapa 4 — HTML

Criar primeiro a estrutura semântica.

### Etapa 5 — CSS

Implementar:

```text
global
layout
component
responsive
states
```

### Etapa 6 — JavaScript

Implementar:

```text
DOM
events
state
behavior
```

### Etapa 7 — Animações

Adicionar:

```text
GSAP
ScrollTrigger
Lenis
```

somente depois do comportamento base.

### Etapa 8 — Three.js

Adicionar somente se existir requisito 3D.

### Etapa 9 — Performance

Verificar:

* render;
* animações;
* listeners;
* assets;
* memory;
* WebGL.

### Etapa 10 — Validação

Testar:

* desktop;
* tablet;
* mobile;
* teclado;
* reduced motion;
* console;
* resize;
* navegação;
* carregamento.

---

# 83. REGRA FINAL DO AGENTE

Antes de criar qualquer código, o agente deve perguntar internamente:

```text
1. Isso precisa realmente de JavaScript?
2. CSS resolve?
3. DOM API resolve?
4. GSAP é necessário?
5. ScrollTrigger é necessário?
6. Lenis é necessário?
7. Three.js é necessário?
8. Existe um módulo existente que já resolve isso?
9. Estou criando uma dependência desnecessária?
10. Estou violando Single Responsibility?
```

Se uma solução mais simples atender ao requisito, utilizar a solução mais simples.

O agente não deve adicionar complexidade apenas para demonstrar conhecimento de arquitetura.

A arquitetura deve servir ao projeto, e não o contrário.
