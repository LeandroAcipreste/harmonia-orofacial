const LADO_MAXIMO = 2000;

const LADO_MINIMO = 900;

const ALVO_BYTES = 800 * 1024;

const QUALIDADES = [0.9, 0.82, 0.74, 0.66, 0.58];

const ENCOLHE_LADO = 0.8;

const TIPO_SAIDA = "image/jpeg";

const lerComo = (arquivo, como) =>
    new Promise((resolver, rejeitar) => {
        const leitor = new FileReader();

        leitor.onload = () => resolver(leitor.result);
        leitor.onerror = () => rejeitar(new Error("Não foi possível ler o arquivo."));

        leitor[como](arquivo);
    });

const carregar = (fonte) =>
    new Promise((resolver, rejeitar) => {
        const imagem = new Image();

        imagem.onload = () => resolver(imagem);
        imagem.onerror = () => rejeitar(new Error("Esse arquivo não é uma imagem."));

        imagem.src = fonte;
    });

/* Um dataURL carrega ~4 bytes para cada 3 de conteudo, mais o cabecalho. */
const pesoDe = (dataUrl) => {
    const virgula = dataUrl.indexOf(",") + 1;
    const enchimento = dataUrl.endsWith("==") ? 2 : dataUrl.endsWith("=") ? 1 : 0;

    return Math.round(((dataUrl.length - virgula) * 3) / 4) - enchimento;
};

const desenhar = (imagem, largura, altura, qualidade) => {
    const tela = document.createElement("canvas");

    tela.width = largura;
    tela.height = altura;

    const pincel = tela.getContext("2d");

    pincel.imageSmoothingEnabled = true;
    pincel.imageSmoothingQuality = "high";
    pincel.drawImage(imagem, 0, 0, largura, altura);

    return tela.toDataURL(TIPO_SAIDA, qualidade);
};

export const ehImagem = (arquivo) => arquivo.type.startsWith("image/");

/* Foto de celular chega com 4000px de lado e varios megabytes. Aqui ela
   perde tamanho ate caber no alvo: primeiro cede qualidade, e so depois
   cede dimensao — reduzir o lado apaga detalhe clinico, entao e o ultimo
   recurso, e nunca abaixo de LADO_MINIMO. PDF passa intacto. */
export const encolher = async (arquivo) => {
    const bruto = await lerComo(arquivo, "readAsDataURL");

    if (!ehImagem(arquivo)) {
        return {
            nome: arquivo.name,
            tipo: arquivo.type || "application/octet-stream",
            tamanho: arquivo.size,
            tamanhoOriginal: arquivo.size,
            conteudo: bruto,
        };
    }

    const imagem = await carregar(bruto);

    let largura = imagem.naturalWidth;
    let altura = imagem.naturalHeight;

    const maior = Math.max(largura, altura);

    if (maior > LADO_MAXIMO) {
        const escala = LADO_MAXIMO / maior;

        largura = Math.round(largura * escala);
        altura = Math.round(altura * escala);
    }

    if (maior <= LADO_MAXIMO && arquivo.size <= ALVO_BYTES) {
        return {
            nome: arquivo.name,
            tipo: arquivo.type,
            tamanho: arquivo.size,
            tamanhoOriginal: arquivo.size,
            largura,
            altura,
            conteudo: bruto,
        };
    }

    let melhor = null;

    while (!melhor || pesoDe(melhor.conteudo) > ALVO_BYTES) {
        for (const qualidade of QUALIDADES) {
            const conteudo = desenhar(imagem, largura, altura, qualidade);

            melhor = { conteudo, largura, altura, qualidade };

            if (pesoDe(conteudo) <= ALVO_BYTES) {
                break;
            }
        }

        if (pesoDe(melhor.conteudo) <= ALVO_BYTES) {
            break;
        }

        const proxima = Math.round(Math.max(largura, altura) * ENCOLHE_LADO);

        if (proxima < LADO_MINIMO) {
            break;
        }

        const escala = proxima / Math.max(largura, altura);

        largura = Math.round(largura * escala);
        altura = Math.round(altura * escala);
    }

    return {
        nome: arquivo.name.replace(/\.[^.]+$/, "") + ".jpg",
        tipo: TIPO_SAIDA,
        tamanho: pesoDe(melhor.conteudo),
        tamanhoOriginal: arquivo.size,
        largura: melhor.largura,
        altura: melhor.altura,
        conteudo: melhor.conteudo,
    };
};

export const emTamanhoLegivel = (bytes) => {
    if (!bytes) {
        return "";
    }

    if (bytes < 1024) {
        return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
        return Math.round(bytes / 1024) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(1).replace(".", ",") + " MB";
};
