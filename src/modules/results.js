/**
 * Resultados: carrossel que passa sozinho. O caso da vez se expande e ganha
 * cor; os outros ficam menores e em tons neutros. Setas, arraste/deslize,
 * contador "01 / 08" e barra de progresso. Clicar num caso leva até ele;
 * clicar no caso ativo abre o print em tela cheia.
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";
import { openLightbox } from "./lightbox.js";

const AUTO_MS = 3600;

export function initResults() {
  const view = $("#cases");
  if (!view) return;
  const cards = $$(".case", view);
  const N = cards.length;
  if (!N) return;

  // trilho que desliza dentro da área visível
  const track = document.createElement("div");
  track.className = "cases-track";
  cards.forEach((c) => track.appendChild(c));
  view.appendChild(track);

  // sondas para ler as larguras definidas no CSS (--cw e --cwa) em px
  const probe = (v) => {
    const el = document.createElement("i");
    el.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;height:0;width:var(${v})`;
    view.appendChild(el);
    return el;
  };
  const pw = probe("--cw"), pa = probe("--cwa");

  const now = $("#casesNow"), total = $("#casesTotal"), bar = $("#casesBar");
  const pad2 = (n) => String(n).padStart(2, "0");
  if (total) total.textContent = pad2(N);
  if (bar) bar.style.width = `${100 / N}%`;

  let i = 0;
  function go(n, instant) {
    i = ((n % N) + N) % N;
    cards.forEach((c, k) => c.classList.toggle("is-active", k === i));
    const w = pw.offsetWidth, wa = pa.offsetWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const cs = getComputedStyle(view);
    const avail = view.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const full = (N - 1) * (w + gap) + wa;
    const x = -Math.min(i * (w + gap), Math.max(0, full - avail));
    gsap.to(track, { x, duration: instant || reduceMotion ? 0 : 0.9, ease: "power3.inOut", overwrite: true });
    if (now) now.textContent = pad2(i + 1);
    if (bar) bar.style.left = `${(i * 100) / N}%`;
  }
  go(0, true);
  window.addEventListener("resize", () => go(i, true));

  // ---------- avanço automático ----------
  let timer = null, visible = false, hover = false;
  const stop = () => { clearInterval(timer); timer = null; };
  const play = () => {
    stop();
    if (reduceMotion || !visible || hover) return;
    timer = setInterval(() => go(i + 1), AUTO_MS);
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; play(); }, { threshold: 0.3 }).observe(view);
  view.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hover = true; stop(); } });
  view.addEventListener("pointerleave", () => { hover = false; play(); });

  $("#casesPrev")?.addEventListener("click", () => { go(i - 1); play(); });
  $("#casesNext")?.addEventListener("click", () => { go(i + 1); play(); });

  // ---------- arrastar / deslizar ----------
  let down = null, dragged = false;
  view.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    down = { x: e.clientX, y: e.clientY };
    dragged = false;
  });
  window.addEventListener("pointerup", (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - down.y)) {
      dragged = true;
      go(i + (dx < 0 ? 1 : -1));
      play();
      setTimeout(() => { dragged = false; }, 60);
    }
    down = null;
  });
  window.addEventListener("pointercancel", () => { down = null; });
  view.addEventListener("dragstart", (e) => e.preventDefault());

  cards.forEach((card, k) => {
    card.addEventListener("click", () => {
      if (dragged) return;
      if (k !== i) { go(k); play(); return; }
      openLightbox(card.dataset.proof, card.dataset.alt);
    });
  });

  if (reduceMotion) return;
  gsap.from(view, {
    opacity: 0, y: 50, duration: 1.2, ease: "expo.out", clearProps: "transform,opacity",
    scrollTrigger: { trigger: view, start: "top 88%", once: true },
  });
}
