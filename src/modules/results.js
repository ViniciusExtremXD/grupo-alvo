/**
 * Resultados: carrossel dos prints reais (autoplay a cada 5s), setas que
 * avançam e reiniciam o timer, arraste por toque/mouse (swipe) e barra de
 * progresso. Mesma mecânica robusta usada nos demais sites da Vesta.
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";

export function initResults() {
  const section = $("#resultados");
  const track = $("#resultsTrack");
  if (!section || !track) return;

  const viewport = $(".results-viewport");
  const slides = $$(".result-card", track);
  const progress = $("#resultsProgress");
  let index = 0;
  let timer = null;

  const step = () => {
    if (slides.length < 2) return slides[0]?.getBoundingClientRect().width || 0;
    return slides[1].getBoundingClientRect().left - slides[0].getBoundingClientRect().left;
  };
  const maxScroll = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
  const targetX = (i) => -Math.min(i * step(), maxScroll());

  function runProgress() {
    if (!progress) return;
    gsap.killTweensOf(progress);
    if (reduceMotion) { gsap.set(progress, { scaleX: 1 }); return; }
    gsap.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: 5, ease: "none" });
  }
  function go(i, { animate = true } = {}) {
    const n = slides.length;
    if (!n) return;
    index = (i + n) % n;
    const x = targetX(index);
    if (animate) gsap.to(track, { x, duration: 0.8, ease: "expo.out" });
    else gsap.set(track, { x });
    runProgress();
  }
  function auto() {
    clearInterval(timer);
    if (reduceMotion || slides.length < 2) return;
    timer = setInterval(() => go(index + 1), 5000);
    runProgress();
  }

  $("#resultsNext")?.addEventListener("click", () => { go(index + 1); auto(); });
  $("#resultsPrev")?.addEventListener("click", () => { go(index - 1); auto(); });

  viewport?.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") clearInterval(timer);
  });
  viewport?.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse") auto();
  });

  // ---- swipe / arraste (toque, caneta e mouse) ----
  let active = false, dragging = false, decided = false;
  let startX = 0, startY = 0, baseX = 0, pointerId = null;
  const START_THRESHOLD = 8;

  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    active = true; dragging = false; decided = false;
    startX = e.clientX; startY = e.clientY;
    baseX = Number(gsap.getProperty(track, "x")) || 0;
    pointerId = e.pointerId;
  });

  track.addEventListener("pointermove", (e) => {
    if (!active) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!decided) {
      if (Math.abs(dx) < START_THRESHOLD && Math.abs(dy) < START_THRESHOLD) return;
      decided = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        dragging = true;
        clearInterval(timer);
        gsap.killTweensOf(track);
        if (progress) gsap.killTweensOf(progress);
        track.classList.add("is-dragging");
        try { track.setPointerCapture(pointerId); } catch (_) {}
      }
    }
    if (dragging) {
      let x = baseX + dx;
      const min = -maxScroll();
      const max = 0;
      if (x > max) x = max + (x - max) * 0.35;
      if (x < min) x = min + (x - min) * 0.35;
      gsap.set(track, { x });
    }
  });

  function endDrag(e) {
    if (dragging) {
      const dx = e.clientX - startX;
      const threshold = Math.min(60, step() * 0.2);
      if (dx <= -threshold) go(index + 1);
      else if (dx >= threshold) go(index - 1);
      else go(index);
      auto();
      track.classList.remove("is-dragging");
    }
    active = false; dragging = false; decided = false; pointerId = null;
  }
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);
  track.addEventListener("dragstart", (e) => e.preventDefault());

  window.addEventListener("resize", () => go(index, { animate: false }));
  auto();
}
