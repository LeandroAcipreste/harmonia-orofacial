/* VIDEO DO CELULAR EM PE

   Os videos de fundo sao 16:9 e ficam em cover, centralizados: num celular em pe so a faixa do meio aparece.
   Para essa tela cada video tem uma versao so com essa faixa (data-retrato, 406x720, o mesmo recorte central),
   com 3 vezes menos pixels para decodificar a cada quadro da rolagem. Escolhido antes de o video baixar. */
const CELULAR_EM_PE = "(max-aspect-ratio: 9/16)";

export const escolherFonte = (video) => {
    if (!video || !video.dataset.retrato) {
        return;
    }

    if (!window.matchMedia(CELULAR_EM_PE).matches) {
        return;
    }

    // solto (longe da tela, video-rolagem.js): so troca o arquivo que ele vai usar quando voltar
    if (video.dataset.solto === "1") {
        video.dataset.fonte = video.dataset.retrato;
    } else {
        video.src = video.dataset.retrato;
    }
};
