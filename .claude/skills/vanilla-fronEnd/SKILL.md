# VANILLA FRONTEND

Desenvolva seguindo estas regras:

1. STACK
HTML5 + CSS3 + JavaScript ES6+ + ES Modules.
Permitidos: GSAP, ScrollTrigger, Lenis e Three.js.
Não utilizar React, Vue, Angular, Svelte, jQuery, Bootstrap, Tailwind ou CSS-in-JS.

2. SEPARAÇÃO
HTML = estrutura.
CSS = aparência/layout.
JavaScript = comportamento.
GSAP = animação.
ScrollTrigger = animação baseada em scroll.
Lenis = smooth scroll.
Three.js = 3D/WebGL.

3. ARQUITETURA
Código modular, baixo acoplamento e alta coesão.
Cada arquivo deve possuir uma responsabilidade clara.
Não criar arquivos gigantes, funções gigantes ou objetos gigantes.

4. ESTRUTURA
Use:
src/core
src/components
src/sections
src/animations
src/three
src/utils

Não criar arquivos ou pastas sem necessidade real.

5. CSS
Usar CSS puro e classes semânticas/BEM.
Não usar style="" ou element.style.
Estados visuais devem ser controlados por classes como:
.is-active
.is-open
.is-hidden
Use CSS Custom Properties para valores compartilhados.

6. JAVASCRIPT
Usar ES Modules com import/export.
Preferir funções simples e composição.
Usar classes somente quando houver necessidade real de múltiplas instâncias ou estado complexo.
Evitar estado global, dependências circulares, código duplicado e magic numbers.

7. ANIMAÇÃO
Use CSS para animações simples.
Use GSAP para animações complexas.
Use ScrollTrigger somente quando o scroll controlar a animação.
Use Lenis somente para smooth scrolling.
Use Three.js somente quando existir necessidade real de 3D.
Não usar uma tecnologia para resolver um problema que uma solução mais simples resolve.

8. DESIGN PATTERNS
Não aplicar Design Patterns por obrigação.
Use Factory, Strategy, Observer, State, Adapter, Facade ou outros padrões somente quando resolverem um problema real.
KISS + YAGNI têm prioridade sobre abstrações.
Não fazer overengineering.

9. PERFORMANCE E ACESSIBILIDADE
Priorizar transform e opacity nas animações.
Evitar listeners, loops e instâncias duplicadas.
Otimizar assets.
Respeitar teclado, foco, semântica e prefers-reduced-motion.
Efeitos visuais nunca podem ser necessários para o funcionamento da interface.

10. EXECUÇÃO
Antes de implementar:
→ entenda o requisito;
→ inspecione o código existente;
→ reutilize o que já existe;
→ altere somente o necessário;
→ mantenha a arquitetura existente quando estiver correta.

Não reescreva partes do projeto sem necessidade.
Não crie abstrações sem necessidade.
Não adicione bibliotecas sem necessidade.
Não explique arquitetura ou padrões ao usuário se ele não solicitar.
Priorize implementar corretamente o que foi solicitado.