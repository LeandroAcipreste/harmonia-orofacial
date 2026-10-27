/* VIDEO LEVADO PELA ROLAGEM: duas regras para nao travar (sobretudo no Android).

   1. Um pulo de quadro por vez. Cada currentTime novo cancela a busca que ainda estava em andamento; mandando um
      por quadro de tela, o aparelho lento cancela sem parar e nao mostra quadro nenhum. Enquanto o video busca,
      o pedido novo so fica anotado; quando a busca termina ('seeked'), ele vai direto ao ultimo pedido.

   2. No toque, so os videos perto da tela ficam ligados. O celular decodifica poucos videos de uma vez; com todos
      ligados, as transicoes engasgam. Cada video se liga meia tela (ANTECEDENCIA) antes do trecho dele e se solta (sem src,
      load(): o decodificador fica livre) quando fica longe. No computador nada se solta. */
const TOQUE = "(hover: none) and (pointer: coarse)";
const ANTECEDENCIA = "50% 0px 50% 0px";
const MEIO_QUADRO = 1 / 48;

export const buscarQuadro = (video, tempo) => {
    if (!video._buscaLigada) {
        video._buscaLigada = true;
        video.addEventListener("seeked", () => {
            const proximo = video._proximoQuadro;
            video._proximoQuadro = null;

            if (proximo != null && Math.abs(video.currentTime - proximo) > MEIO_QUADRO) {
                video.currentTime = proximo;
            }
        });
    }

    if (video.seeking) {
        video._proximoQuadro = tempo;
        return;
    }

    if (Math.abs(video.currentTime - tempo) > MEIO_QUADRO) {
        video.currentTime = tempo;
    }
};

const soltar = (video) => {
    const fonte = video.getAttribute("src");

    if (!fonte) {
        return;
    }

    video.dataset.fonte = fonte;
    video.dataset.solto = "1";
    video.pause();
    video.removeAttribute("src");
    video.load();
};

const prender = (video, aoPrender) => {
    if (video.dataset.solto !== "1") {
        return;
    }

    delete video.dataset.solto;
    video.src = video.dataset.fonte;
    video.preload = "auto";
    video.load();

    if (aoPrender) {
        video.addEventListener("loadeddata", () => aoPrender(video), { once: true });
    }
};

// zona: o trecho da pagina em que o video aparece. aoPrender: quem precisa saber que ele voltou (um loop que
// deve tocar, por exemplo)
export const ligarPorZona = (video, zona, aoPrender) => {
    if (!video || !zona || !window.matchMedia(TOQUE).matches || typeof IntersectionObserver === "undefined") {
        return;
    }

    const vigia = new IntersectionObserver(
        ([entrada]) => {
            if (entrada.isIntersecting) {
                prender(video, aoPrender);
            } else {
                soltar(video);
            }
        },
        { rootMargin: ANTECEDENCIA },
    );

    vigia.observe(zona);
};
