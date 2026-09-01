import { chromium } from "playwright";

const EXE = "C:/Users/User/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe";
const nav = await chromium.launch({ executablePath: EXE });
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const pag = await ctx.newPage();

const dobra = [];
pag.on("console", (m) => {
  const t = m.text().replace(/%c/g, "").split("color:")[0].trim();
  if (t.startsWith("[dobra]")) dobra.push(t);
});
pag.on("pageerror", (e) => dobra.push("PAGEERROR: " + e.message));

await pag.goto("http://localhost:4260/", { waitUntil: "load" });
await pag.waitForTimeout(3000);

const montagem = await pag.evaluate(() => {
  const bloco = document.querySelector(".transicao");
  const st = ScrollTrigger.getAll().find((t) => t.pin && t.trigger === bloco);
  window.__tr = st;
  return st
    ? {
        inicio: Math.round(st.start),
        fim: Math.round(st.end),
        telasDeRolagem: +((st.end - st.start) / window.innerHeight).toFixed(2),
        duracaoDaLinha: +st.animation.duration().toFixed(2),
        palavras: document.querySelectorAll(".s4 .s4__palavra").length,
      }
    : null;
});
console.log("montagem:", JSON.stringify(montagem));
console.log("--- log ---");
dobra.forEach((l) => console.log("  " + l));

const amostra = async (p) => {
  await pag.evaluate((x) => {
    const s = window.__tr;
    window.scrollTo(0, s.start + (s.end - s.start) * x);
  }, p);
  await pag.waitForTimeout(3200);
  const m = await pag.evaluate(() => {
    const cor = (sel) => {
      const e = document.querySelector(sel);
      return e ? getComputedStyle(e).color : "n/d";
    };
    const acesas = (sel) =>
      Array.from(document.querySelectorAll(sel)).filter(
        (e) => getComputedStyle(e).color !== "rgb(10, 17, 40)"
      ).length;
    const escritas = (sel) =>
      Array.from(document.querySelectorAll(sel)).filter((e) => {
        const c = getComputedStyle(e).clipPath;
        return c === "none" || /inset\(0px\)/.test(c) || /0%\)/.test(c) === false;
      }).length;
    return {
      recorte: getComputedStyle(document.querySelector(".letreiro")).maskSize,
      eyebrow: getComputedStyle(document.querySelector(".s4__eyebrow")).opacity,
      nomeEscrito: escritas(".s4__nome .s4__palavra") + "/" + document.querySelectorAll(".s4__nome .s4__palavra").length,
      bioAcesa: acesas(".s4__bio .s4__palavra") + "/" + document.querySelectorAll(".s4__bio .s4__palavra").length,
      areasAcesas: Array.from(document.querySelectorAll(".s4__area")).map(
        (a) => acesas(a.querySelectorAll ? "#nada" : "") // placeholder
      ),
      areaTextos: Array.from(document.querySelectorAll(".s4__area")).map((a) =>
        Array.from(a.querySelectorAll(".s4__area-texto .s4__palavra")).filter(
          (e) => getComputedStyle(e).color !== "rgb(10, 17, 40)"
        ).length
      ),
    };
  });
  console.log(`t ${p}:`, JSON.stringify(m));
  await pag.screenshot({ path: `C:/tmp/leitura-${String(p).replace(".", "_")}.png` });
};

for (const p of [0.3, 0.45, 0.55, 0.7, 0.85, 1]) await amostra(p);

console.log("--- log final ---");
dobra.forEach((l) => console.log("  " + l));
await nav.close();
