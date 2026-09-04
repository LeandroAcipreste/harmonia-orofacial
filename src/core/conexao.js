const TIPOS_LENTOS = ["slow-2g", "2g", "3g"];

const DOWNLINK_MINIMO = 3;

const LEVE = "leve";
const PESADO = "pesado";

export const nivelDaConexao = () => {
    const rede =
        navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!rede) {
        return PESADO;
    }

    if (rede.saveData) {
        return LEVE;
    }

    if (rede.effectiveType && TIPOS_LENTOS.includes(rede.effectiveType)) {
        return LEVE;
    }

    if (typeof rede.downlink === "number" && rede.downlink < DOWNLINK_MINIMO) {
        return LEVE;
    }

    return PESADO;
};
