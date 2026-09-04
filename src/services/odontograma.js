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

export const ARCADAS = [
    {
        nome: "Arcada superior",
        direita: [18, 17, 16, 15, 14, 13, 12, 11],
        esquerda: [21, 22, 23, 24, 25, 26, 27, 28],
    },
    {
        nome: "Arcada inferior",
        direita: [48, 47, 46, 45, 44, 43, 42, 41],
        esquerda: [31, 32, 33, 34, 35, 36, 37, 38],
    },
];

export const nomeDoDente = (numero) => {
    const quadrante = Math.floor(numero / 10);
    const posicao = numero % 10;

    return FAMILIAS[posicao] + " " + LADOS[quadrante] + ", dente " + numero;
};

export const emOrdem = (dentes) =>
    [...dentes].sort((um, outro) => um - outro);
