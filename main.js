/* Ponto de entrada único do site.

   Cada página diz quem é pelo data-pagina do <body>, e só o módulo dela é
   baixado, por import() dinâmico. Sem isso, as telas do sistema
   arrastariam o código da home: preloader, hero, letreiro e WebGL.

   Página nova: crie a pasta com os três arquivos, exporte init do .js,
   ponha o data-pagina no <body> e acrescente uma linha aqui. */

const PAGINAS = {
    home: () => import("./src/core/home.js"),
    avaliacao: () => import("./pages/avaliacao/avaliacao.js"),
    login: () => import("./pages/login/login.js"),
    agenda: () => import("./pages/agenda/agenda.js"),
    pacientes: () => import("./pages/pacientes/pacientes.js"),
    exames: () => import("./pages/exames/exames.js"),
    financeiro: () => import("./pages/financeiro/financeiro.js"),
    inventario: () => import("./pages/inventario/inventario.js"),
    administracao: () => import("./pages/administracao/administracao.js"),
};

const pagina = document.body.dataset.pagina;
const carregar = PAGINAS[pagina];

if (carregar) {
    carregar().then((modulo) => modulo.init());
} else if (pagina) {
    console.warn("Página sem módulo no main.js:", pagina);
}
