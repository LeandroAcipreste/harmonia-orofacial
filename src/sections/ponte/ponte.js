/* PONTE entre a dobra da doutora e a da clinica (ponte.css).
   A rolagem no trilho so marca o alvo; um laco persegue o alvo com freio, para o video nao pular quadros:
     0    a 0,08  a pelicula da doutora clareia (as letras ja sairam, ainda com a dobra presa)
     0,02 a 0,95  o video anda: o consultorio, o refletor, a luz, as ondas
     0,95         ultimo quadro da transicao: o loop da clinica assume no mesmo instante (corte seco). O video
                  termina no primeiro quadro do loop (medido: 24, dentro da variacao natural das ondas)
     0,95 a 1     a pelicula da clinica escurece um pouco, para o texto que vai subir */
import { escolherFonte } from "../../core/retrato.js";

const FREIO = 0.06;
// a dobra da doutora ja saiu com a animacao dela (sectionfour.js): o video comeca logo no inicio do trilho
const VEU_ATE = 0.08;
const VIDEO_DE = 0.02;
// o video termina no fim exato do trilho: e o instante em que a clinica encaixa no topo da tela
const VIDEO_ATE = 1;
const VEU_C_DE = 0.92;
// a emenda com o loop (medida): a transicao para no quadro 216 de 240, o mais parecido com o 1o quadro do loop
// (diferenca 7,6). As ondas do video do Flow andam ~4x mais devagar que as do loop: o loop entra a 22% da
// velocidade e acelera ate a normal em 1,6 s, para o movimento nao dar tranco na troca.
const FIM_DA_TRANSICAO = 216 / 24;
const LOOP_ENTRA_A = 0.22;
const LOOP_ACELERA_MS = 1600;

/* ESTRELA (clinica -> avaliacoes), no .ponte__trilho-estrela. O video da rolagem comeca no quadro 0 do loop da
   clinica: quando a rolagem entra no trilho, o loop acelera (ESTRELA_ACELERA) ate dar a volta e, no quadro em que
   ele estiver, o video da rolagem assume no mesmo quadro (corte seco, medido 1,4). Dali a rolagem leva o video ate
   a estrela; no ultimo quadro (que emenda com o 1o do loop da estrela, medido 1,8) o loop da estrela assume.
   A pelicula da clinica clareia enquanto o texto dela sai (ate VEU_C_SAI do trilho). */
const ESTRELA_ACELERA = 3;
const VEU_C_SAI = 0.4;
const VEU_A_ATE = "top 40%";

const limitar = (v) => Math.min(1, Math.max(0, v));

export const initPonte = () => {
    const ponte = document.querySelector(".ponte");
    const trilho = document.querySelector(".ponte__trilho");
    const doutora = document.querySelector(".transicao");
    const clinica = document.querySelector(".s5");

    if (!ponte || !trilho || !doutora || !clinica) {
        return;
    }

    const transicao = ponte.querySelector(".ponte__transicao");
    const loop = ponte.querySelector(".ponte__loop");
    const estrela = ponte.querySelector(".ponte__estrela");
    const estrelaLoop = ponte.querySelector(".ponte__estrela-loop");
    const trilhoEstrela = document.querySelector(".ponte__trilho-estrela");
    const avaliacoes = document.querySelector(".avaliacoes");

    /* os videos da doutora e da clinica so baixam depois do preloader: baixando junto com a abertura, eles
       ocupavam as conexoes, o CSS chegava atrasado e a tela ficava na pagina anterior (a logo) em vez do preto */
    const carregarPonte = () => {
        [transicao, loop].forEach((v) => {
            if (v && v.preload === "none") {
                escolherFonte(v);
                v.preload = "auto";
                v.load();
            }
        });
    };

    if (document.documentElement.classList.contains("esta-carregando")) {
        document.addEventListener("harmonia:preloader-fim", carregarPonte, { once: true });
    } else {
        carregarPonte();
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        ponte.classList.add("esta-ativa");
        ponte.style.setProperty("--mistura", "1");
        if (loop) {
            loop.play().catch(() => {});
        }
        ponte.style.setProperty("--veu-d", "0");
        ponte.style.setProperty("--veu-c", "1");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    let ativa = false;
    let noLoop = false;
    let alvo = 0;
    let atual = 0;
    let laco = 0;
    let acordada = false;
    // "clinica" (loop da clinica), "esperando" (loop acelerado ate dar a volta) ou "estrela" (video da rolagem)
    let fase = "clinica";
    let veuDaPonte = 0;
    let veuDaSaida = 0;
    const escritos = {};

    const escrever = (nome, valor) => {
        const v = Math.round(valor * 1000) / 1000;

        if (escritos[nome] !== v) {
            escritos[nome] = v;
            ponte.style.setProperty(nome, v);
        }
    };

    const levarTransicao = (p) => {
        if (!transicao || !Number.isFinite(transicao.duration) || transicao.duration <= 0) {
            return;
        }

        const tempo = p * Math.min(FIM_DA_TRANSICAO, transicao.duration - 0.05);

        if (Math.abs(transicao.currentTime - tempo) > 1 / 48) {
            transicao.currentTime = tempo;
        }
    };

    const tocarLoop = () => {
        if (!loop || !ativa || !noLoop || fase === "estrela") {
            return;
        }

        const promessa = loop.play();

        if (promessa && typeof promessa.catch === "function") {
            promessa.catch(() => {});
        }
    };

    let rampa = 0;

    const acelerarLoop = () => {
        const inicio = performance.now();

        const passo = (agora) => {
            const t = limitar((agora - inicio) / LOOP_ACELERA_MS);
            const suave = t * t * (3 - 2 * t);
            loop.playbackRate = LOOP_ENTRA_A + (1 - LOOP_ENTRA_A) * suave;
            rampa = t < 1 ? window.requestAnimationFrame(passo) : 0;
        };

        rampa = window.requestAnimationFrame(passo);
    };

    const ligarLoop = (ligar) => {
        if (ligar === noLoop) {
            return;
        }

        noLoop = ligar;

        if (!loop) {
            return;
        }

        window.cancelAnimationFrame(rampa);

        if (ligar) {
            loop.currentTime = 0;
            loop.playbackRate = LOOP_ENTRA_A;
            tocarLoop();
            acelerarLoop();
        } else {
            loop.pause();
            loop.playbackRate = 1;
        }
    };

    // o Safari do iPhone so desenha o quadro buscado depois de o video ter tocado uma vez
    const acordar = () => {
        if (acordada || !transicao) {
            return;
        }

        acordada = true;
        const promessa = transicao.play();

        if (promessa && typeof promessa.then === "function") {
            promessa.then(() => {
                transicao.pause();
                levarTransicao(limitar((atual - VIDEO_DE) / (VIDEO_ATE - VIDEO_DE)));
            }).catch(() => {});
        }
    };

    // a pelicula da clinica escurece no fim da ponte e clareia de novo quando o texto da clinica sai
    const escreverVeuDaClinica = () => escrever("--veu-c", veuDaPonte * (1 - veuDaSaida));

    const pintar = (p) => {
        escrever("--veu-d", 1 - limitar(p / VEU_ATE));
        veuDaPonte = limitar((p - VEU_C_DE) / (1 - VEU_C_DE));
        escreverVeuDaClinica();

        const andado = limitar((p - VIDEO_DE) / (VIDEO_ATE - VIDEO_DE));
        const noFim = andado >= 0.995;

        levarTransicao(andado);
        escrever("--mistura", noFim ? 1 : 0);
        ligarLoop(noFim);
        clinica.classList.toggle("esta-esperando", !noFim);
    };

    const perseguir = () => {
        const falta = alvo - atual;
        atual = Math.abs(falta) < 0.0005 ? alvo : atual + falta * FREIO;
        pintar(atual);
        laco = atual === alvo ? 0 : window.requestAnimationFrame(perseguir);
    };

    /* ESTRELA */
    let alvoE = 0;
    let atualE = 0;
    let lacoE = 0;
    let vigia = 0;
    let carregada = false;
    let estrelaAcordada = false;

    // os dois videos da estrela so baixam quando a camada liga (a doutora chegando), nao no carregamento da pagina
    const carregarEstrela = () => {
        if (carregada) {
            return;
        }

        carregada = true;
        [estrela, estrelaLoop].forEach((v) => {
            if (v) {
                escolherFonte(v);
                v.preload = "auto";
                v.load();
            }
        });
    };

    const tocarLoopDaEstrela = () => {
        if (!estrelaLoop || !ativa || !ponte.classList.contains("no-loop-estrela")) {
            return;
        }

        const promessa = estrelaLoop.play();

        if (promessa && typeof promessa.catch === "function") {
            promessa.catch(() => {});
        }
    };

    const duracaoDaEstrela = () => (estrela && Number.isFinite(estrela.duration) && estrela.duration > 0 ? estrela.duration - 1 / 48 : 0);

    const levarEstrela = (q) => {
        const d = duracaoDaEstrela();

        if (d && Math.abs(estrela.currentTime - q * d) > 1 / 48) {
            estrela.currentTime = q * d;
        }
    };

    const pintarEstrela = (q) => {
        levarEstrela(q);

        const noFim = q >= 0.995;

        if (noFim !== ponte.classList.contains("no-loop-estrela")) {
            ponte.classList.toggle("no-loop-estrela", noFim);

            if (noFim) {
                estrelaLoop.currentTime = 0;
                tocarLoopDaEstrela();
            } else {
                estrelaLoop.pause();
            }
        }
    };

    const perseguirEstrela = () => {
        const falta = alvoE - atualE;
        atualE = Math.abs(falta) < 0.0005 ? alvoE : atualE + falta * FREIO;
        pintarEstrela(atualE);

        // voltou ate o quadro 0: o loop da clinica retoma do quadro 0, que e o mesmo
        if (atualE === 0 && alvoE === 0) {
            voltarParaClinica();
        }

        lacoE = atualE === alvoE ? 0 : window.requestAnimationFrame(perseguirEstrela);
    };

    const assumirEstrela = (tempo) => {
        window.cancelAnimationFrame(vigia);
        vigia = 0;
        fase = "estrela";
        loop.pause();
        loop.playbackRate = 1;

        const d = duracaoDaEstrela();
        atualE = d ? limitar(tempo / d) : 0;
        estrela.currentTime = atualE * (d || 0);
        ponte.classList.add("na-estrela");

        if (!lacoE) {
            lacoE = window.requestAnimationFrame(perseguirEstrela);
        }
    };

    // espera o loop da clinica dar a volta (acelerado) e passa a vez no quadro em que ele estiver
    const esperarAVolta = () => {
        fase = "esperando";
        window.cancelAnimationFrame(rampa);
        rampa = 0;
        loop.playbackRate = ESTRELA_ACELERA;
        tocarLoop();

        let antes = loop.currentTime;
        const desde = performance.now();

        const olhar = () => {
            if (fase !== "esperando") {
                return;
            }

            const agora = loop.currentTime;

            // loop parado (pulo direto pelo menu, aba em segundo plano): nao espera para sempre
            if (performance.now() - desde > 4000 && duracaoDaEstrela()) {
                assumirEstrela(0);
                return;
            }

            if (agora + 0.5 < antes && duracaoDaEstrela()) {
                assumirEstrela(agora);
                return;
            }

            antes = agora;
            vigia = window.requestAnimationFrame(olhar);
        };

        vigia = window.requestAnimationFrame(olhar);
    };

    const voltarParaClinica = () => {
        window.cancelAnimationFrame(vigia);
        vigia = 0;

        if (fase === "estrela") {
            ponte.classList.remove("na-estrela");
            loop.currentTime = 0;
        }

        fase = "clinica";
        loop.playbackRate = 1;
        tocarLoop();
    };

    // o Safari do iPhone so desenha o quadro buscado depois de o video ter tocado uma vez
    const acordarEstrela = () => {
        if (estrelaAcordada || !estrela) {
            return;
        }

        estrelaAcordada = true;
        const promessa = estrela.play();

        if (promessa && typeof promessa.then === "function") {
            promessa.then(() => {
                estrela.pause();
                levarEstrela(atualE);
            }).catch(() => {});
        }
    };

    // a camada so aparece (e o loop so toca) enquanto a doutora, o trilho ou a clinica estao na tela.
    // A dobra da doutora fica presa (pin): o gatilho e o pin-spacer em volta dela, nao ela, senao o fim do trecho
    // sai errado e a camada desligava no meio da leitura.
    const envolve = doutora.parentElement && doutora.parentElement.classList.contains("pin-spacer")
        ? doutora.parentElement
        : doutora;

    ScrollTrigger.create({
        trigger: envolve,
        invalidateOnRefresh: true,
        start: "top bottom",
        // ate as notas sairem da tela por cima: a estrela fica atras delas
        endTrigger: avaliacoes && !avaliacoes.hidden
            ? avaliacoes
            : clinica.parentElement && clinica.parentElement.classList.contains("pin-spacer") ? clinica.parentElement : clinica,
        end: "bottom top",
        onToggle: (self) => {
            ativa = self.isActive;
            ponte.classList.toggle("esta-ativa", ativa);

            if (ativa) {
                carregarEstrela();
                tocarLoop();
                tocarLoopDaEstrela();
            } else {
                if (loop) {
                    loop.pause();
                }
                if (estrelaLoop) {
                    estrelaLoop.pause();
                }
            }
        },
    });

    const caminho = ScrollTrigger.create({
        trigger: trilho,
        start: "top bottom",
        end: "bottom bottom",
        onUpdate: (self) => {
            if (self.progress > 0) {
                acordar();
            }

            alvo = self.progress;

            if (!laco) {
                laco = window.requestAnimationFrame(perseguir);
            }
        },
        onRefresh: (self) => {
            alvo = atual = self.progress;
            pintar(atual);
        },
    });

    alvo = atual = caminho.progress;
    pintar(atual);

    if (trilhoEstrela && estrela && estrelaLoop && loop) {
        const seguirTrilhoDaEstrela = (progresso) => {
            alvoE = progresso;
            veuDaSaida = limitar(progresso / VEU_C_SAI);
            escreverVeuDaClinica();

            if (progresso > 0) {
                acordarEstrela();
            }

            if (fase === "clinica" && progresso > 0) {
                esperarAVolta();
            } else if (fase === "esperando" && progresso === 0) {
                voltarParaClinica();
            } else if (fase === "estrela" && !lacoE) {
                lacoE = window.requestAnimationFrame(perseguirEstrela);
            }
        };

        ScrollTrigger.create({
            trigger: trilhoEstrela,
            start: "top bottom",
            end: "bottom bottom",
            onUpdate: (self) => seguirTrilhoDaEstrela(self.progress),
            onRefresh: (self) => seguirTrilhoDaEstrela(self.progress),
        });

        if (avaliacoes && !avaliacoes.hidden) {
            ScrollTrigger.create({
                trigger: avaliacoes,
                start: "top bottom",
                end: VEU_A_ATE,
                onUpdate: (self) => escrever("--veu-a", self.progress),
                onRefresh: (self) => escrever("--veu-a", self.progress),
            });
        }
    }

    if (transicao) {
        transicao.addEventListener("loadedmetadata", () => pintar(atual));
    }
};
