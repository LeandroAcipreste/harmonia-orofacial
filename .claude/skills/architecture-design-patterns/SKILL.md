# SOFTWARE ARCHITECTURE & DESIGN PATTERNS

## Skill de Arquitetura, Padrões de Projeto e Engenharia de Código

---

# 1. OBJETIVO

Esta Skill define como o agente deve analisar problemas de arquitetura e decidir quais padrões de projeto utilizar.

O agente deve conhecer e considerar:

* princípios de engenharia de software;
* princípios SOLID;
* GRASP;
* padrões GoF;
* padrões de criação;
* padrões estruturais;
* padrões comportamentais;
* padrões arquiteturais;
* padrões de modularização;
* padrões de integração;
* padrões de organização de frontend;
* padrões específicos para JavaScript;
* padrões específicos para DOM;
* padrões para animações;
* padrões para gerenciamento de estado;
* padrões para eventos;
* padrões para APIs;
* padrões para performance;
* padrões para composição.

A Skill não determina que todos os padrões devem ser utilizados.

O agente deve escolher o padrão baseado no problema real.

---

# 2. REGRA ABSOLUTA

## NÃO UTILIZE PADRÕES APENAS PARA DIZER QUE UM PADRÃO FOI UTILIZADO.

Um padrão deve existir porque resolve um problema arquitetural identificável.

Antes de aplicar qualquer Design Pattern, o agente deve responder:

```text
Qual problema existe?

Qual é a causa desse problema?

O padrão resolve essa causa?

Qual complexidade o padrão adiciona?

Essa complexidade é justificável?

Existe uma solução mais simples?
```

Se a solução simples for suficiente:

```text
NÃO UTILIZAR O PADRÃO.
```

---

# 3. HIERARQUIA DE DECISÃO

Sempre analisar nesta ordem:

```text
1. Código simples
↓
2. Função bem definida
↓
3. Módulo
↓
4. Composição
↓
5. Abstração
↓
6. Design Pattern
↓
7. Arquitetura mais complexa
```

Nunca começar diretamente pelo Design Pattern.

---

# 4. PRINCÍPIOS FUNDAMENTAIS

Antes dos Design Patterns, aplicar:

```text
KISS
DRY
YAGNI
SOLID
Separation of Concerns
High Cohesion
Low Coupling
Composition over Inheritance
Principle of Least Knowledge
Fail Fast
Single Source of Truth
Explicit over Implicit
```

---

# 5. KISS

## Keep It Simple

Preferir a solução mais simples que resolva corretamente o problema.

Exemplo:

Se um componente precisa apenas abrir e fechar:

```text
classList.toggle()
```

é preferível a:

```text
State Manager
+
Observer
+
Factory
+
Command
```

---

# 6. YAGNI

## You Aren't Gonna Need It

Não implementar funcionalidades ou abstrações apenas porque podem ser úteis futuramente.

Não criar:

```text
Factory
Repository
Service
Adapter
Facade
EventBus
```

sem necessidade real.

---

# 7. DRY

## Don't Repeat Yourself

Evitar duplicação de:

* lógica;
* regras;
* configurações;
* funções;
* componentes;
* animações;
* validações.

Mas não abstrair duas implementações diferentes apenas porque possuem algumas linhas semelhantes.

Duplicação acidental deve ser eliminada.

Duplicação conceitualmente diferente pode permanecer.

---

# 8. SOLID

---

# 8.1 SINGLE RESPONSIBILITY PRINCIPLE

Uma unidade de código deve possuir uma responsabilidade claramente definida.

Pode ser:

* função;
* módulo;
* classe;
* componente;
* serviço.

Errado:

```text
hero.js
→ DOM
→ API
→ menu
→ analytics
→ Three.js
→ formulário
```

Correto:

```text
hero.js
navigation.js
analytics.js
three-scene.js
form.js
```

### Quando adotar

Sempre que um módulo começar a possuir múltiplas razões independentes para mudar.

---

# 8.2 OPEN/CLOSED PRINCIPLE

Código deve ser extensível sem exigir alterações constantes na implementação existente.

Utilizar quando:

* existem múltiplas variações;
* novos comportamentos serão adicionados;
* regras variam por configuração.

Não aplicar artificialmente em código simples.

---

# 8.3 LISKOV SUBSTITUTION PRINCIPLE

Uma implementação especializada deve poder substituir a abstração que ela representa sem quebrar o comportamento esperado.

Aplicar principalmente quando houver:

* interfaces;
* classes;
* abstrações;
* múltiplas implementações.

No frontend Vanilla, não criar hierarquias de classes apenas para aplicar LSP.

---

# 8.4 INTERFACE SEGREGATION PRINCIPLE

Não obrigar um consumidor a depender de métodos que não utiliza.

Em JavaScript, aplicar principalmente através de:

* módulos pequenos;
* APIs pequenas;
* funções específicas;
* objetos com responsabilidades limitadas.

---

# 8.5 DEPENDENCY INVERSION PRINCIPLE

Módulos de alto nível não devem depender diretamente de detalhes de implementação quando uma abstração simples resolver o acoplamento.

Exemplo:

```text
Hero
↓
Animation API
↓
GSAP
```

em vez de espalhar GSAP por toda a aplicação.

Aplicar quando a dependência externa ou implementação puder mudar.

Não criar interfaces artificiais para dependências triviais.

---

# 9. GRASP

Considerar os princípios GRASP:

```text
Information Expert
Creator
Controller
Low Coupling
High Cohesion
Polymorphism
Pure Fabrication
Indirection
Protected Variations
```

---

# 9.1 INFORMATION EXPERT

A responsabilidade deve ficar próxima dos dados necessários para executá-la.

---

# 9.2 CREATOR

O módulo responsável por possuir ou controlar determinado objeto pode ser responsável por sua criação.

---

# 9.3 CONTROLLER

Utilizar um Controller quando uma operação precisar coordenar múltiplos módulos.

Exemplo:

```text
app.js
→ inicializa módulos
```

Não colocar toda a lógica do sistema em um Controller gigante.

---

# 9.4 LOW COUPLING

Reduzir dependências diretas entre módulos.

Preferir:

```text
Hero
↓
Animation API
```

em vez de:

```text
Hero
↓
GSAP
↓
ScrollTrigger
↓
Lenis
↓
Three.js
```

quando essas dependências não forem realmente necessárias.

---

# 9.5 HIGH COHESION

Cada módulo deve possuir funcionalidades relacionadas.

---

# 10. PADRÕES GoF

Os padrões GoF são divididos em:

```text
Creational
Structural
Behavioral
```

O agente deve conhecer todos os padrões abaixo e saber quando NÃO utilizá-los.

---

# 11. CREATIONAL PATTERNS

---

# 11.1 FACTORY METHOD

### Problema

A criação de objetos possui variações e o código consumidor não deveria conhecer todos os detalhes.

### Adotar quando

Existirem múltiplos tipos de objetos com a mesma finalidade.

Exemplo:

```text
createAnimation()
→ CSSAnimation
→ GSAPAnimation
→ ScrollAnimation
```

### Não adotar quando

Existe apenas um tipo de objeto.

---

# 11.2 ABSTRACT FACTORY

### Problema

Criar famílias relacionadas de objetos.

### Adotar quando

Existirem conjuntos de objetos que precisam permanecer compatíveis.

Exemplo:

```text
ThemeFactory
├── Button
├── Card
├── Modal
└── Navigation
```

### Não adotar

Para uma página simples.

---

# 11.3 BUILDER

### Problema

Construção de objetos complexos com muitas opções.

### Adotar quando

A criação exigir muitas etapas opcionais.

Exemplo:

```text
AnimationBuilder
→ duration
→ ease
→ delay
→ scroll
→ callbacks
```

### Não adotar

Para objetos com poucos parâmetros.

---

# 11.4 PROTOTYPE

### Problema

Criar objetos através de clonagem de estruturas existentes.

### Adotar quando

Clonagem for mais adequada que reconstrução.

No JavaScript, considerar os recursos nativos de protótipos antes de criar uma abstração própria.

---

# 11.5 SINGLETON

### Problema

Deve existir uma única instância compartilhada.

### Adotar quando

Existir uma necessidade arquitetural real de instância única.

Exemplos possíveis:

```text
Lenis
WebGL renderer
Application configuration
Event system
```

### CUIDADO

Singleton cria estado global e aumenta acoplamento.

Nunca utilizar Singleton apenas para facilitar acesso global.

---

# 12. STRUCTURAL PATTERNS

---

# 12.1 ADAPTER

### Problema

Duas interfaces incompatíveis precisam trabalhar juntas.

### Adotar quando

Uma biblioteca externa possuir uma API diferente da interface desejada internamente.

Exemplo:

```text
Application
↓
AnimationAdapter
↓
GSAP
```

Muito útil para isolar bibliotecas externas.

---

# 12.2 BRIDGE

### Problema

Abstração e implementação precisam evoluir independentemente.

### Adotar quando

Existirem múltiplas abstrações combinadas com múltiplas implementações.

Exemplo:

```text
Animation
├── HeroAnimation
├── CardAnimation
│
Implementation
├── CSS
├── GSAP
```

Não utilizar para estruturas simples.

---

# 12.3 COMPOSITE

### Problema

Tratar objetos individuais e grupos de objetos da mesma forma.

### Adotar quando

Existir uma estrutura hierárquica de elementos.

Exemplo:

```text
Scene
├── Group
│   ├── Mesh
│   └── Mesh
└── Group
```

Particularmente relevante para estruturas Three.js.

---

# 12.4 DECORATOR

### Problema

Adicionar comportamento sem alterar o objeto original.

### Adotar quando

Existirem comportamentos opcionais combináveis.

Exemplo:

```text
Animation
+
Logging
+
Performance tracking
```

---

# 12.5 FACADE

### Problema

Uma API complexa precisa ser simplificada.

### Adotar quando

Uma biblioteca possuir muitos detalhes internos.

Exemplo:

```text
AnimationFacade
→ GSAP
→ ScrollTrigger
→ timeline
```

Consumidor:

```javascript
animateHero();
```

---

# 12.6 FLYWEIGHT

### Problema

Muitos objetos semelhantes consomem memória.

### Adotar quando

Existirem grandes quantidades de objetos com dados compartilháveis.

Exemplo:

```text
Thousands of particles
```

Pode ser relevante em Three.js.

---

# 12.7 PROXY

### Problema

Controlar acesso a outro objeto.

### Adotar quando houver:

* lazy loading;
* caching;
* acesso controlado;
* logging;
* proteção;
* carregamento tardio.

Exemplo:

```text
ImageProxy
↓
Image
```

---

# 13. BEHAVIORAL PATTERNS

---

# 13.1 CHAIN OF RESPONSIBILITY

### Problema

Uma requisição pode ser processada por diferentes handlers.

### Adotar quando

Existirem múltiplos processadores sequenciais.

Exemplo:

```text
Validation
↓
Authentication
↓
Authorization
↓
Processing
```

Não utilizar para simples `if/else`.

---

# 13.2 COMMAND

### Problema

Transformar uma ação em objeto reutilizável.

### Adotar quando

Precisar de:

* undo;
* redo;
* filas;
* histórico;
* ações reversíveis;
* execução programada.

Exemplo:

```text
OpenMenuCommand
CloseMenuCommand
ToggleMenuCommand
```

---

# 13.3 ITERATOR

### Problema

Percorrer uma coleção sem conhecer sua estrutura interna.

No JavaScript, preferir iteradores nativos quando forem suficientes.

Não criar um Iterator Pattern manual sem necessidade.

---

# 13.4 MEDIATOR

### Problema

Muitos objetos dependem diretamente uns dos outros.

### Adotar quando

A comunicação entre módulos estiver criando dependências excessivas.

Exemplo:

```text
Hero
Navigation
Modal
Gallery

↓
Mediator
```

---

# 13.5 MEMENTO

### Problema

Salvar e restaurar estado anterior.

### Adotar quando

Existirem:

* undo;
* snapshots;
* histórico;
* restauração de estado.

---

# 13.6 OBSERVER

### Problema

Um objeto precisa notificar vários consumidores sobre mudanças.

### Adotar quando

Existirem múltiplos módulos interessados em um evento.

Exemplos:

```text
Navigation
↓
menu:opened

Analytics
↓
menu:opened

Animation
↓
menu:opened
```

No frontend Vanilla, considerar:

```javascript
EventTarget
CustomEvent
```

antes de criar um Event Bus customizado.

---

# 13.7 STATE

### Problema

O comportamento de um objeto muda de acordo com seu estado.

### Adotar quando

Existirem estados significativos e comportamentos diferentes.

Exemplo:

```text
Menu
├── closed
├── opening
├── open
└── closing
```

Não utilizar State Pattern para um simples booleano.

---

# 13.8 STRATEGY

### Problema

Existem vários algoritmos intercambiáveis.

### Adotar quando

O comportamento puder variar dinamicamente.

Exemplo:

```text
ScrollStrategy
├── Native
├── Lenis
└── Custom
```

Outro exemplo:

```text
AnimationStrategy
├── CSS
├── GSAP
└── ScrollTrigger
```

Muito útil para desacoplar comportamentos.

---

# 13.9 TEMPLATE METHOD

### Problema

Vários algoritmos compartilham uma estrutura, mas possuem etapas diferentes.

### Adotar principalmente

Quando houver classes ou estruturas realmente semelhantes.

No frontend funcional, considerar composição antes desse padrão.

---

# 13.10 VISITOR

### Problema

Adicionar operações a uma estrutura de objetos sem modificar suas classes.

### Adotar somente

Em estruturas complexas e estáveis.

Raramente necessário em frontend Vanilla.

---

# 14. PADRÕES ARQUITETURAIS

---

# 14.1 MODULE PATTERN

### Adotar quando

Precisar encapsular comportamento.

É um dos padrões principais desta arquitetura.

Preferir ES Modules nativos.

```text
hero.js
navigation.js
modal.js
```

---

# 14.2 REVEALING MODULE PATTERN

### Adotar quando

Um módulo possuir implementação privada e uma API pública pequena.

Exemplo:

```javascript
const init = () => {};
const destroy = () => {};

export {
    init,
    destroy,
};
```

---

# 14.3 MVC

```text
Model
View
Controller
```

### Adotar quando

A aplicação possuir:

* dados complexos;
* múltiplas views;
* lógica de apresentação separada;
* interação significativa com dados.

Não implementar MVC completo em uma landing page simples.

---

# 14.4 MVP

Pode ser utilizado quando a View precisar ser extremamente passiva e a lógica estiver centralizada em um Presenter.

Utilizar somente quando houver necessidade real.

---

# 14.5 MVVM

No frontend Vanilla, considerar somente quando existir:

* estado complexo;
* binding;
* múltiplas views;
* necessidade real de sincronização entre estado e interface.

Não simular React/Vue manualmente apenas para seguir MVVM.

---

# 15. ARQUITETURA EM CAMADAS

Quando a aplicação possuir complexidade suficiente, separar:

```text
Presentation
↓
Application
↓
Domain
↓
Infrastructure
```

### Presentation

DOM e UI.

### Application

Casos de uso e orquestração.

### Domain

Regras de negócio.

### Infrastructure

APIs, armazenamento e bibliotecas externas.

---

# 16. CLEAN ARCHITECTURE

Adotar somente quando o projeto possuir complexidade suficiente.

Exemplo:

```text
src/
├── domain/
├── application/
├── infrastructure/
└── presentation/
```

Não utilizar Clean Architecture em uma landing page simples.

---

# 17. HEXAGONAL ARCHITECTURE

Também conhecida como Ports and Adapters.

### Adotar quando

O sistema possuir várias integrações externas.

Exemplo:

```text
Application
├── Port
│
├── API Adapter
├── Storage Adapter
└── Analytics Adapter
```

Muito útil quando a aplicação precisa ser independente de fornecedores externos.

---

# 18. REPOSITORY PATTERN

### Problema

Separar acesso aos dados da lógica da aplicação.

### Adotar quando

Existirem múltiplas fontes de dados ou operações de persistência relevantes.

Exemplo:

```text
UserRepository
ProductRepository
ContentRepository
```

Não criar Repository para uma simples chamada `fetch()` isolada.

---

# 19. SERVICE PATTERN

### Problema

Centralizar uma operação ou conjunto de operações relacionadas.

### Adotar quando

A lógica de negócio estiver sendo repetida entre módulos.

Exemplo:

```text
authService
analyticsService
apiService
```

Não transformar toda função em Service.

---

# 20. USE CASE PATTERN

### Adotar quando

A aplicação possuir operações de negócio claras.

Exemplo:

```text
CreateOrder
LoginUser
UpdateProfile
SubmitForm
```

Cada Use Case representa uma ação do sistema.

---

# 21. DTO

## Data Transfer Object

### Adotar quando

A estrutura de dados que atravessa uma fronteira precisar ser controlada.

Exemplo:

```text
API Response
↓
DTO
↓
Application
```

Não criar DTO para cada objeto simples.

---

# 22. MAPPER

### Problema

Converter estruturas entre camadas.

### Adotar quando

Existirem modelos diferentes.

Exemplo:

```text
API User
↓
UserMapper
↓
Application User
```

---

# 23. ANTI-CORRUPTION LAYER

### Adotar quando

Um sistema externo possuir conceitos incompatíveis com o domínio interno.

Exemplo:

```text
External API
↓
Adapter
↓
Mapper
↓
Internal Domain
```

Muito útil quando integrações externas possuem modelos ruins ou instáveis.

---

# 24. EVENT-DRIVEN ARCHITECTURE

### Adotar quando

Módulos precisarem reagir a eventos sem depender diretamente uns dos outros.

Exemplo:

```text
menu:opened
gallery:changed
form:submitted
```

Utilizar eventos nativos antes de criar sistemas complexos.

---

# 25. PUB/SUB

### Adotar quando

Existirem muitos produtores e consumidores de eventos.

No frontend pequeno, preferir `EventTarget`.

No frontend complexo, considerar um mecanismo Pub/Sub somente quando o acoplamento realmente justificar.

---

# 26. STATE MACHINE

### Adotar quando

Uma interface possuir estados e transições complexas.

Exemplo:

```text
Idle
↓
Loading
↓
Success

ou

Idle
↓
Opening
↓
Open
↓
Closing
↓
Closed
```

Ideal para:

* modais complexos;
* upload;
* checkout;
* formulários multi-etapas;
* animações com lifecycle;
* componentes com estados rigorosos.

Não utilizar para:

```text
menuOpen = true
```

---

# 27. FINITE STATE MACHINE

Utilizar quando os estados válidos forem finitos e as transições precisarem ser controladas.

O agente deve impedir estados impossíveis.

Exemplo:

```text
Closed
→ Opening
→ Open
→ Closing
→ Closed
```

Não permitir:

```text
Closed
→ Closing
```

sem uma razão arquitetural.

---

# 28. STRATEGY PARA RESPONSIVIDADE

Quando o comportamento variar significativamente entre dispositivos:

```text
DesktopStrategy
MobileStrategy
```

pode ser utilizado.

Antes disso, verificar se CSS Media Queries resolvem o problema.

CSS deve ser preferido para diferenças puramente visuais.

---

# 29. ADAPTER PARA BIBLIOTECAS

Bibliotecas externas devem ser isoladas quando sua utilização estiver espalhada pelo projeto.

Exemplo:

```text
src/
└── infrastructure/
    └── animations/
        ├── gsap-adapter.js
        └── lenis-adapter.js
```

Isso permite substituir uma biblioteca posteriormente com menor impacto.

---

# 30. FACADE PARA ANIMAÇÕES

Quando houver:

```text
GSAP
+
ScrollTrigger
+
Lenis
```

uma Facade pode expor:

```javascript
animateIn();
animateOut();
createScrollAnimation();
scrollTo();
```

O restante da aplicação não precisa conhecer todos os detalhes.

---

# 31. OBSERVER PARA DOM

Para componentes independentes que precisam reagir a mudanças:

```text
MutationObserver
IntersectionObserver
ResizeObserver
```

preferir APIs nativas.

Não implementar Observer manualmente quando uma Web API resolver.

---

# 32. LAZY LOADING

Pode utilizar:

```text
Proxy
Facade
Dynamic import
IntersectionObserver
```

quando houver necessidade de carregamento tardio.

Exemplo:

```javascript
const loadGallery = async () => {
    const module = await import('./gallery.js');

    module.initGallery();
};
```

---

# 33. CODE SPLITTING

Utilizar `import()` dinâmico quando:

* módulo for pesado;
* funcionalidade não for necessária imediatamente;
* Three.js puder ser carregado sob demanda;
* seção estiver distante;
* funcionalidade for rara.

Não dividir arquivos arbitrariamente.

---

# 34. THREE.JS E DESIGN PATTERNS

Para experiências 3D complexas, considerar:

```text
Facade
Factory
Composite
Strategy
Observer
Singleton
Command
```

Exemplo:

```text
ThreeFacade
↓
Scene
↓
ObjectFactory
↓
Objects
↓
AnimationStrategy
```

Somente utilizar quando a cena justificar.

---

# 35. ANIMAÇÕES E DESIGN PATTERNS

Para sistemas de animação complexos, considerar:

```text
Strategy
State
Command
Facade
Adapter
Observer
```

Exemplo:

```text
AnimationController
↓
AnimationStrategy
├── CSS
├── GSAP
└── ScrollTrigger
```

A escolha deve ser baseada na necessidade.

---

# 36. CONTROLLER

Um Controller pode coordenar:

```text
DOM
State
Animation
Events
```

Mas não deve executar toda a implementação.

Exemplo:

```text
MenuController
├── state
├── DOM
└── animation
```

---

# 37. MANAGER

Evitar nomes genéricos como:

```text
UtilsManager
DataManager
EverythingManager
GlobalManager
```

Um Manager deve possuir responsabilidade claramente definida.

Aceitável:

```text
AnimationManager
AudioManager
SceneManager
AssetManager
```

desde que sua responsabilidade seja realmente de gerenciamento.

---

# 38. GOD OBJECT

É proibido criar objetos gigantes.

Sinais:

```text
> 1 responsabilidade
> muitos métodos não relacionados
> muitas dependências
> conhecimento excessivo do sistema
```

Dividir em módulos coesos.

---

# 39. GOD FUNCTION

É proibido criar funções que:

```text
selecionam DOM
+
fazem API
+
alteram estado
+
animam
+
validam
+
renderizam
```

Separar responsabilidades.

---

# 40. CIRCULAR DEPENDENCY

É proibido criar dependências circulares.

Errado:

```text
A → B
B → C
C → A
```

Resolver através de:

* composição;
* abstração;
* eventos;
* inversão de dependência;
* módulo intermediário.

---

# 41. SINGLE SOURCE OF TRUTH

Uma informação deve possuir uma fonte principal.

Evitar:

```text
DOM
+
JS State
+
localStorage
+
data attribute
```

todos armazenando a mesma informação sem sincronização clara.

---

# 42. COMMAND PARA UNDO/REDO

Adotar Command quando o sistema exigir:

```text
undo
redo
history
replay
queue
```

Exemplo:

```text
Command
├── execute()
└── undo()
```

---

# 43. STRATEGY PARA ALGORITMOS

Se existir:

```text
if type === 'A'
if type === 'B'
if type === 'C'
```

e cada branch representar um algoritmo independente, considerar Strategy.

Exemplo:

```text
PricingStrategy
├── Standard
├── Premium
└── Discount
```

Não transformar qualquer `if` em Strategy.

---

# 44. POLYMORPHISM

Quando múltiplas implementações possuírem a mesma interface conceitual, considerar polimorfismo.

Em JavaScript:

```javascript
const strategies = {
    css: animateWithCSS,
    gsap: animateWithGSAP,
    scroll: animateWithScroll,
};
```

Pode ser preferível a uma hierarquia de classes.

---

# 45. NULL OBJECT

### Adotar quando

Uma ausência de comportamento puder ser representada por um objeto seguro.

Exemplo:

```text
NoAnimationStrategy
```

em vez de dezenas de:

```javascript
if (animation) {
}
```

Não utilizar quando `null` for suficientemente claro.

---

# 46. SPECIFICATION

### Adotar quando

Existirem regras de seleção ou validação combináveis.

Exemplo:

```text
isVisible
isActive
isAvailable
```

Podem ser combinadas:

```text
isVisible AND isActive
```

Útil para filtros complexos.

---

# 47. UNIT OF WORK

### Adotar quando

Múltiplas operações precisarem ser tratadas como uma única unidade lógica.

Mais relevante em aplicações com persistência ou operações transacionais.

Não utilizar em frontend simples.

---

# 48. CACHE-ASIDE

### Adotar quando

Dados forem caros para obter e puderem ser reutilizados.

Fluxo:

```text
Cache
↓
Existe?
├── Sim → retorna
└── Não
     ↓
   API
     ↓
   Cache
```

---

# 49. RETRY

### Adotar quando

Uma operação falhar temporariamente.

Utilizar principalmente para:

* APIs;
* rede;
* carregamento de assets.

Nunca aplicar retry infinito.

Utilizar limite e backoff quando apropriado.

---

# 50. CIRCUIT BREAKER

### Adotar quando

Uma dependência externa estiver falhando repetidamente e continuar sendo chamada piorar o problema.

Mais relevante para:

* APIs;
* serviços externos;
* sistemas distribuídos.

Raramente necessário em frontend simples.

---

# 51. FALLBACK

Quando uma funcionalidade avançada falhar, oferecer uma alternativa funcional.

Exemplo:

```text
Three.js
↓
falha
↓
background CSS
```

Ou:

```text
Lenis
↓
falha
↓
scroll nativo
```

A interface não deve depender exclusivamente de efeitos decorativos.

---

# 52. PROGRESSIVE ENHANCEMENT

A arquitetura deve funcionar em camadas:

```text
HTML
↓
CSS
↓
JavaScript
↓
GSAP
↓
Three.js
```

Cada camada deve adicionar capacidade.

Nenhuma camada decorativa deve ser requisito para o funcionamento básico.

---

# 53. DECISION MATRIX

Antes de aplicar um padrão, utilizar esta análise:

| Problema                    | Padrão possível         |
| --------------------------- | ----------------------- |
| Criação variável            | Factory                 |
| Construção complexa         | Builder                 |
| Instância única real        | Singleton               |
| API incompatível            | Adapter                 |
| API complexa                | Facade                  |
| Composição hierárquica      | Composite               |
| Adicionar comportamento     | Decorator               |
| Controle de acesso          | Proxy                   |
| Eventos                     | Observer                |
| Algoritmos intercambiáveis  | Strategy                |
| Estados complexos           | State                   |
| Ações reversíveis           | Command                 |
| Comunicação indireta        | Mediator                |
| Histórico                   | Memento                 |
| Pipeline de handlers        | Chain of Responsibility |
| Dados persistentes          | Repository              |
| Operação de negócio         | Service / Use Case      |
| Conversão de modelos        | Mapper                  |
| Dados entre fronteiras      | DTO                     |
| Integração externa complexa | Anti-Corruption Layer   |
| Múltiplas implementações    | Polymorphism            |
| Carregamento tardio         | Proxy / Dynamic Import  |
| Cache                       | Cache-Aside             |
| Falhas temporárias          | Retry                   |
| Dependência indisponível    | Circuit Breaker         |
| Estado complexo da UI       | State Machine           |

---

# 54. QUANDO NÃO USAR DESIGN PATTERN

Não utilizar Design Pattern quando:

```text
o código é pequeno;
a lógica é linear;
existe apenas uma implementação;
não existe variação;
não existe reutilização;
não existe acoplamento relevante;
não existe complexidade;
a abstração seria maior que o problema.
```

---

# 55. REGRA DE REFACTORING

Primeiro fazer funcionar corretamente.

Depois:

```text
identificar duplicação
↓
identificar acoplamento
↓
identificar responsabilidades
↓
identificar variações
↓
selecionar padrão
↓
refatorar
```

Não começar criando abstrações antes de conhecer o problema.

---

# 56. REGRA DE EVOLUÇÃO

Uma arquitetura pode começar simples e evoluir.

Exemplo:

```text
Função
↓
Módulo
↓
Strategy
↓
Factory
↓
Adapter
↓
Arquitetura em camadas
```

Não começar no último estágio.

---

# 57. TESTABILIDADE

Ao escolher um padrão, considerar se ele melhora ou piora a testabilidade.

Preferir:

* funções puras;
* dependências explícitas;
* módulos pequenos;
* adapters;
* interfaces simples;
* baixo acoplamento.

Evitar:

* estado global excessivo;
* Singleton desnecessário;
* dependências ocultas;
* funções gigantes.

---

# 58. PADRÃO DE IMPLEMENTAÇÃO

Quando o agente decidir utilizar um padrão, deve registrar no comentário do código apenas quando necessário:

```javascript
// Strategy: seleciona a implementação de animação.
```

Não escrever explicações enormes.

Não inserir documentação excessiva no código.

---

# 59. REGRA DE TRANSPARÊNCIA

Quando um padrão for adotado, sua estrutura deve permanecer compreensível.

O agente não deve criar:

```text
FactoryFactory
AbstractStrategyFactory
ManagerBuilder
UniversalFacade
```

apenas para aumentar a abstração.

Se o padrão começar a exigir mais código do que a lógica que deveria organizar, reconsiderar sua utilização.

---

# 60. ANTI-PATTERNS

O agente deve evitar:

```text
God Object
God Function
Spaghetti Code
Big Ball of Mud
Premature Optimization
Premature Abstraction
Overengineering
Circular Dependency
Global State
Magic Numbers
Magic Strings
Copy/Paste Programming
Feature Envy
Shotgun Surgery
Primitive Obsession
Dead Code
Hidden Dependencies
```

---

# 61. SHOTGUN SURGERY

Se uma pequena alteração exigir modificar muitos arquivos sem necessidade, investigar o acoplamento.

Considerar:

```text
Facade
Adapter
Strategy
Centralized configuration
Event-driven communication
```

---

# 62. FEATURE ENVY

Se um módulo depender excessivamente de dados e funções de outro módulo, investigar se a responsabilidade está no lugar errado.

Aplicar:

```text
Information Expert
Encapsulation
Move Function
Facade
```

---

# 63. PREMATURE ABSTRACTION

Não criar abstração baseada em uma única ocorrência.

Primeiro identificar repetição real.

---

# 64. PREMATURE OPTIMIZATION

Não otimizar antes de existir um problema mensurável.

Priorizar:

```text
Correção
↓
Clareza
↓
Arquitetura
↓
Performance mensurável
```

---

# 65. DECISÃO AUTOMÁTICA DO AGENTE

Quando encontrar um problema arquitetural, o agente deve executar mentalmente:

```text
1. Existe um problema real?
2. Qual é o problema?
3. A solução simples resolve?
4. Existe duplicação?
5. Existe acoplamento?
6. Existe variação?
7. Existe estado complexo?
8. Existe dependência externa?
9. Existe necessidade de comunicação indireta?
10. Existe necessidade de criação variável?
11. Existe necessidade de abstração?
12. Qual padrão resolve isso?
13. Qual complexidade o padrão adiciona?
14. O benefício supera a complexidade?
```

Somente então aplicar o padrão.

---

# 66. REGRA FINAL

O objetivo desta Skill não é fazer o agente utilizar muitos Design Patterns.

O objetivo é fazer o agente:

```text
reconhecer problemas
↓
entender suas causas
↓
selecionar a solução apropriada
↓
aplicar o padrão somente quando necessário
↓
manter baixo acoplamento
↓
manter alta coesão
↓
preservar simplicidade
↓
permitir evolução
```

## PRINCÍPIO ABSOLUTO

**Pattern não é objetivo. Pattern é ferramenta.**

O agente deve sempre preferir:

```text
Código simples
```

a:

```text
Código sofisticado sem necessidade.
```

E deve preferir:

```text
Arquitetura evolutiva
```

a:

```text
Arquitetura superdimensionada.
```

Um padrão somente deve ser adotado quando o problema que ele resolve for maior que a complexidade que ele introduz.
