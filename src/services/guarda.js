import { sessaoAtual } from "./sessao.js";

const LOGIN = "/pages/login/login.html";

export const exigirSessao = async ({ aoEntrar, login = LOGIN } = {}) => {
    const sessao = await sessaoAtual();

    if (!sessao) {
        const volta = encodeURIComponent(location.pathname + location.search);

        location.replace(login + "?volta=" + volta);

        return null;
    }

    document.documentElement.classList.add("tem-sessao");

    ajustarNavegacao(sessao);

    if (typeof aoEntrar === "function") {
        aoEntrar(sessao);
    }

    return sessao;
};

/* Esconde do menu a tela que esta pessoa não pode abrir. É cortesia, não
   proteção: quem digitar o endereço continua barrado pelo servidor, que
   recusa cada rota por conta própria. */
export const ajustarNavegacao = (sessao) => {
    const permitidas = (sessao && sessao.permissoes) || [];

    document.querySelectorAll("[data-permissao]").forEach((elemento) => {
        elemento.hidden = !permitidas.includes(elemento.dataset.permissao);
    });
};

/* PARA ONDE CADA UM VAI DEPOIS DE ENTRAR

   Mandar todo mundo para a agenda funcionava quando só a doutora usava o
   sistema. O financeiro não tem agenda.ver: ele entraria numa tela que o
   servidor recusa, e pensaria que o login falhou.

   A ordem abaixo é a do dia de trabalho de cada perfil: quem tem agenda
   começa na agenda, quem só cuida do dinheiro começa no financeiro. */
const TELAS = [
    { permissao: "agenda.ver", endereco: "/pages/agenda/agenda.html" },
    { permissao: "financeiro.caixa", endereco: "/pages/financeiro/financeiro.html" },
    { permissao: "pacientes.ver", endereco: "/pages/pacientes/pacientes.html" },
    { permissao: "inventario.ver", endereco: "/pages/inventario/inventario.html" },
    { permissao: "usuarios.gerenciar", endereco: "/pages/administracao/administracao.html" },
];

export const telaInicialDe = (sessao) => {
    const permitidas = (sessao && sessao.permissoes) || [];
    const primeira = TELAS.find((tela) => permitidas.includes(tela.permissao));

    return primeira ? primeira.endereco : "/pages/login/login.html";
};

export const destinoDeVolta = (padrao = "/") => {
    const volta = new URLSearchParams(location.search).get("volta");

    if (!volta) {
        return padrao;
    }

    if (!volta.startsWith("/") || volta.startsWith("//")) {
        return padrao;
    }

    return volta;
};
