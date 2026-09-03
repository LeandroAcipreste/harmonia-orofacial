export const initAbertura = () => {
    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    const entradas = performance.getEntriesByType
        ? performance.getEntriesByType("navigation")
        : [];
    const tipo = entradas.length ? entradas[0].type : "";

    if (tipo === "reload") {
        return;
    }

    let interno = false;

    if (document.referrer) {
        try {
            interno = new URL(document.referrer).origin === location.origin;
        } catch (erro) {
            interno = false;
        }
    }

    if (tipo === "back_forward" || interno) {
        document.documentElement.classList.add("sem-preloader");
    }
};
