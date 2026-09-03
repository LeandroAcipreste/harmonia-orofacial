const FUNDOS = ["assets/lustre-radial.jpg", "assets/lustre-trama.jpg"];

export const preaquecerFundos = (caminhos = FUNDOS) => {
    caminhos.forEach((caminho) => {
        const imagem = new Image();

        imagem.src = caminho;

        if (typeof imagem.decode === "function") {
            imagem.decode().catch(() => {});
        }
    });
};
