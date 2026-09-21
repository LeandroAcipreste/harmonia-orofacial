# Harmonia Orofacial · site e front do ERP

Site institucional e telas do ERP em HTML, CSS e JavaScript puros, sem
build. A API fica no repositório irmão `../orofacial-backend`, e o
contrato que ela cumpre está em `.claude/backend/`.

## Página nova

Pasta em `pages/<nome>/` com três arquivos: `<nome>.html`, `<nome>.css` e
`<nome>.js`. O HTML carrega `../../main.js`, e não o próprio JavaScript.

1. `<body class="fundo-interno" data-pagina="<nome>">`.
2. O `.js` exporta `init`, e não se chama sozinho no fim do arquivo.
3. Acrescente a linha em `main.js`, que é o despachante: ele lê o
   `data-pagina` e baixa só o módulo daquela tela, por `import()` dinâmico.

Assim uma tela do sistema não arrasta o código da home (preloader, hero,
letreiro, WebGL), que vive em `src/core/home.js`.

O CSS da página importa `../../src/core/erp.css` nas telas do sistema. Bloco
que se repetir em duas páginas sobe para o `erp.css`, que existe para o que
as telas têm em comum.

## O contrato está fechado

O contrato com a clínica mora em
`C:\Users\User\Documents\contratos\harmonia-orofacial\`, fora do git
porque tem CPF e endereço das partes.

A **versão 10 é a final** (21 de setembro de 2026). **Não edite
`escopo.js` nem `contrato.js`, e não rode `npm run gerar`**, nem para
página ou funcionalidade nova.

Pelo item 6.7, até a aprovação da última entrega do Anexo I, o que for
acrescentado ao sistema entra por conta da CONTRATADA, sem custo para a
clínica, sem Termo Aditivo e sem nova versão do contrato. Então página
nova é só código.

Isso vale **até a entrega final**. Depois dela, o item 6.8 devolve a
regra geral: coisa nova volta a ser orçamento e Termo Aditivo. Se o
pedido vier depois da entrega, avise antes de construir.

## Texto

Nada de travessão (—) em nenhum texto: cópia do site, `alt`,
`aria-label`, `<title>` e documentos. Use ponto, vírgula ou "·".
