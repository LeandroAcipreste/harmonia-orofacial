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

    if (typeof aoEntrar === "function") {
        aoEntrar(sessao);
    }

    return sessao;
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
