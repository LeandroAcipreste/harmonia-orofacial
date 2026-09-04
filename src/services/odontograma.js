const FAMILIAS = {
    1: "Incisivo central",
    2: "Incisivo lateral",
    3: "Canino",
    4: "Primeiro pré-molar",
    5: "Segundo pré-molar",
    6: "Primeiro molar",
    7: "Segundo molar",
    8: "Terceiro molar (siso)",
};

const LADOS = {
    1: "superior direito",
    2: "superior esquerdo",
    3: "inferior esquerdo",
    4: "inferior direito",
};

export const MAPA = {
    imagem: "../../assets/dentes.png",
    proporcao: 2.7148,
    arcadas: [
        {
            nome: "Arcada superior",
            topo: 3.285,
            altura: 42.97,
            dentes: [
                { numero: 18, esquerda: 4.114, largura: 5.421 },
                { numero: 17, esquerda: 9.487, largura: 6.196 },
                { numero: 16, esquerda: 15.634, largura: 6.002 },
                { numero: 15, esquerda: 21.588, largura: 5.227 },
                { numero: 14, esquerda: 26.767, largura: 5.615 },
                { numero: 13, esquerda: 32.333, largura: 6.099 },
                { numero: 12, esquerda: 38.383, largura: 4.985 },
                { numero: 11, esquerda: 43.32, largura: 6.341 },
                { numero: 21, esquerda: 49.613, largura: 6.583 },
                { numero: 22, esquerda: 56.147, largura: 5.276 },
                { numero: 23, esquerda: 61.375, largura: 6.05 },
                { numero: 24, esquerda: 67.377, largura: 5.663 },
                { numero: 25, esquerda: 72.991, largura: 5.373 },
                { numero: 26, esquerda: 78.316, largura: 6.099 },
                { numero: 27, esquerda: 84.366, largura: 6.244 },
                { numero: 28, esquerda: 90.561, largura: 5.373 },
            ],
        },
        {
            nome: "Arcada inferior",
            topo: 54.665,
            altura: 39.685,
            dentes: [
                { numero: 48, esquerda: 2.42, largura: 6.583 },
                { numero: 47, esquerda: 8.955, largura: 6.776 },
                { numero: 46, esquerda: 15.682, largura: 6.776 },
                { numero: 45, esquerda: 22.41, largura: 5.421 },
                { numero: 44, esquerda: 27.783, largura: 5.373 },
                { numero: 43, esquerda: 33.107, largura: 5.857 },
                { numero: 42, esquerda: 38.916, largura: 5.082 },
                { numero: 41, esquerda: 43.95, largura: 5.47 },
                { numero: 31, esquerda: 49.371, largura: 5.954 },
                { numero: 32, esquerda: 55.276, largura: 5.324 },
                { numero: 33, esquerda: 60.552, largura: 5.954 },
                { numero: 34, esquerda: 66.457, largura: 5.518 },
                { numero: 35, esquerda: 71.926, largura: 5.663 },
                { numero: 36, esquerda: 77.541, largura: 6.825 },
                { numero: 37, esquerda: 84.318, largura: 6.825 },
                { numero: 38, esquerda: 91.094, largura: 6.486 },
            ],
        },
    ],
};

export const nomeDoDente = (numero) => {
    const quadrante = Math.floor(numero / 10);
    const posicao = numero % 10;

    return FAMILIAS[posicao] + " " + LADOS[quadrante] + ", dente " + numero;
};

export const emOrdem = (dentes) =>
    [...dentes].sort((um, outro) => um - outro);
