/**
 * Captura screenshots do site usando o Chrome instalado, headless.
 *  - full-page com ?motion=0 (reveals desativados — tudo visível)
 *  - hero e seções COM motion (após a intro tocar)
 * Uso: node scripts/shoot.mjs [urlBase]
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const base = process.argv[2] || "http://localhost:5173";
const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "shots");
mkdirSync(outDir, { recursive: true });

const VIEWS = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
];

const executablePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await puppeteer.launch({ executablePath, headless: "new" });

async function settleImages(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = "eager"));
    await Promise.all(
      [...document.images].map((i) =>
        i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })
      )
    );
  });
}

// ---- full-page estático (motion=0) ----
for (const view of VIEWS) {
  const page = await browser.newPage();
  await page.setViewport({ width: view.width, height: view.height, deviceScaleFactor: 1 });
  await page.goto(`${base}/?motion=0`, { waitUntil: "networkidle0", timeout: 45000 });
  await settleImages(page);
  await new Promise((r) => setTimeout(r, 2600));
  await page.screenshot({ path: join(outDir, `full-${view.tag}.png`), fullPage: true });
  console.log("ok full", view.tag);
  await page.close();
}

// ---- home COM motion: hero após a intro ----
const live = await browser.newPage();
live.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
await live.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await live.goto(base, { waitUntil: "networkidle0", timeout: 45000 });
await new Promise((r) => setTimeout(r, 4200)); // preloader + intro do hero
await live.screenshot({ path: join(outDir, "live-hero.png") });
// seção no alvo (disparo e dinheiro acumulado)
await live.evaluate(() => {
  const el = document.querySelector("#alvoHit");
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
});
await new Promise((r) => setTimeout(r, 800)); // Espera o tensionamento (arco esticado)
await live.screenshot({ path: join(outDir, "live-alvobow.png") });
console.log("ok live-alvobow");
await new Promise((r) => setTimeout(r, 3700)); // Espera o disparo acontecer e o dinheiro assentar
await live.screenshot({ path: join(outDir, "live-alvohit.png") });
console.log("ok live-alvohit");

// seção de serviços (motion aplicado)
await live.evaluate(() => {
  const el = document.querySelector("#servicos");
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 80);
});
await new Promise((r) => setTimeout(r, 1600));
await live.screenshot({ path: join(outDir, "live-servicos.png") });
console.log("ok live-servicos");

// statement / fillword
await live.evaluate(() => {
  const el = document.querySelector(".statement");
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 120);
});
await new Promise((r) => setTimeout(r, 1400));
await live.screenshot({ path: join(outDir, "live-statement.png") });
console.log("ok live-statement");

await browser.close();
console.log("done");
