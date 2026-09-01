import { chromium } from "playwright";

const EXE = "C:/Users/User/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe";
const nav = await chromium.launch({ executablePath: EXE });
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const pag = await ctx.newPage();
await pag.goto("http://localhost:4260/", { waitUntil: "load" });
await pag.waitForTimeout(3000);

const olhar = async (rotulo, prog) => {
  if (prog !== null) {
    await pag.evaluate((x) => {
      const s = ScrollTrigger.getAll().find((t) => t.pin && t.trigger === document.querySelector(".transicao"));
      window.scrollTo(0, s.start + (s.end - s.start) * x);
    }, prog);
    await pag.waitForTimeout(3200);
  }
  const m = await pag.evaluate(() => {
    const s4 = document.querySelector(".s4");
    const bio = document.querySelectorAll(".s4__bio .s4__palavra");
    const st = ScrollTrigger.getAll().find((t) => t.pin && t.trigger === document.querySelector(".transicao"));
    return {
      temClasse: s4.classList.contains("js-leitura"),
      progresso: +st.progress.toFixed(3),
      posicaoNaLinha: +(st.progress * st.animation.duration()).toFixed(2),
      primeiraPalavra: bio[0] ? getComputedStyle(bio[0]).color : "n/d",
      ultimaPalavra: bio[bio.length - 1] ? getComputedStyle(bio[bio.length - 1]).color : "n/d",
      corDoPai: getComputedStyle(document.querySelector(".s4__bio")).color,
      nomePrimeira: getComputedStyle(document.querySelector(".s4__nome .s4__palavra")).clipPath,
    };
  });
  console.log(rotulo, JSON.stringify(m));
};

await olhar("no topo      ", null);
await olhar("t 0.05       ", 0.05);
await olhar("t 0.30       ", 0.3);
await olhar("t 0.50       ", 0.5);
await olhar("t 0.90       ", 0.9);

await nav.close();
