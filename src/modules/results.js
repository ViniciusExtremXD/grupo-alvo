/**
 * Resultados: carrossel horizontal com encaixe. Setas, arrasto com o mouse,
 * toque no celular, contador "01 / 08" e barra de progresso. Avança sozinho
 * a cada 4,5 s enquanto está na tela (pausa com o mouse em cima ou ao
 * interagir). O print abre em tela cheia.
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";
import { openLightbox } from "./lightbox.js";

const AUTO_MS = 4500;

export function initResults() {
  const track = $("#cases");
  if (!track) return;
  const cards = $$(".case", track);
  const now = $("#casesNow");
  const total = $("#casesTotal");
  const bar = $("#casesBar");
  const pad2 = (n) => String(n).padStart(2, "0");
  if (total) total.textContent = pad2(cards.length);

  let dragged = false;
  cards.forEach((card) => {
    $(".case-shot", card)?.addEventListener("click", () => {
      if (dragged) return;
      openLightbox(card.dataset.proof, card.dataset.alt);
    });
  });

  const step = () => (cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth);
  const maxScroll = () => track.scrollWidth - track.clientWidth;
  const current = () => Math.round(track.scrollLeft / step());

  function go(i) {
    const last = cards.length - 1;
    if (i < 0) i = last;
    if (i > last || (i > current() && track.scrollLeft >= maxScroll() - 4)) i = 0;
    track.scrollTo({ left: Math.min(i * step(), maxScroll()), behavior: reduceMotion ? "auto" : "smooth" });
  }

  // contador + barra
  const update = () => {
    const m = maxScroll();
    const p = m > 0 ? track.scrollLeft / m : 1;
    const visible = Math.max(1, Math.round(track.clientWidth / step()));
    // no fim da faixa mostra o último número (os últimos cards já estão à vista)
    if (now) now.textContent = pad2(p > 0.99 ? cards.length : Math.min(cards.length, current() + 1));
    // a barra é um "trilho": o trecho claro mostra quais casos estão à vista
    const v = Math.min(1, visible / cards.length);
    if (bar) { bar.style.width = `${(v * 100).toFixed(2)}%`; bar.style.left = `${(p * (1 - v) * 100).toFixed(2)}%`; }
  };
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();

  // autoplay
  let timer = null;
  let visible = false;
  let hover = false;
  const stop = () => { clearInterval(timer); timer = null; };
  const play = () => {
    stop();
    if (reduceMotion || !visible || hover) return;
    timer = setInterval(() => go(current() + 1), AUTO_MS);
  };
  ScrollTrigger.create({ trigger: track, start: "top bottom", end: "bottom top", onToggle: (s) => { visible = s.isActive; play(); } });
  track.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hover = true; stop(); } });
  track.addEventListener("pointerleave", () => { hover = false; play(); });

  $("#casesPrev")?.addEventListener("click", () => { go(current() - 1); play(); });
  $("#casesNext")?.addEventListener("click", () => { go(current() + 1); play(); });

  // arrastar com o mouse (no toque é o scroll nativo)
  let down = false, sx = 0, sl = 0;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    down = true; dragged = false; sx = e.clientX; sl = track.scrollLeft;
  });
  window.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 6 && !dragged) { dragged = true; track.classList.add("is-dragging"); }
    if (dragged) track.scrollLeft = sl - dx;
  });
  window.addEventListener("pointerup", () => {
    if (!down) return;
    down = false;
    if (dragged) {
      track.classList.remove("is-dragging");
      go(current());
      setTimeout(() => { dragged = false; }, 50);
    }
  });
  track.addEventListener("dragstart", (e) => e.preventDefault());

  if (reduceMotion) return;
  gsap.from(cards, {
    opacity: 0, x: 60, duration: 1.2, stagger: 0.08, ease: "expo.out", clearProps: "transform,opacity",
    scrollTrigger: { trigger: track, start: "top 88%", once: true },
  });
}
