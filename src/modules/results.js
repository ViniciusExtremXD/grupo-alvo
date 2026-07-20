/**
 * Resultados: carrossel de prints reais com rotação infinita (lista encadeada/circular).
 * Clona slides dinamicamente nas pontas para permitir transição contínua em loop infinito.
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";

export function initResults() {
  const section = $("#resultados");
  const track = $("#resultsTrack");
  if (!section || !track) return;

  const viewport = $(".results-viewport");
  const originalSlides = Array.from(track.children);
  if (originalSlides.length < 2) return;

  // Clona os 3 últimos slides no início e os 3 primeiros no final
  const numClones = 3;
  const prependedClones = originalSlides.slice(-numClones).map(el => {
    const clone = el.cloneNode(true);
    clone.classList.add("is-clone");
    return clone;
  });
  const appendedClones = originalSlides.slice(0, numClones).map(el => {
    const clone = el.cloneNode(true);
    clone.classList.add("is-clone");
    return clone;
  });

  // Insere clones no DOM
  prependedClones.reverse().forEach(clone => track.insertBefore(clone, track.firstChild));
  appendedClones.forEach(clone => track.appendChild(clone));

  const slides = Array.from(track.children);
  const progress = $("#resultsProgress");
  let index = 0; // Índice do slide real ativo (0 a originalSlides.length - 1)
  let timer = null;

  const step = () => {
    if (slides.length < 2) return 0;
    return slides[1].getBoundingClientRect().left - slides[0].getBoundingClientRect().left;
  };

  const getPositionX = (i) => - (i + numClones) * step();

  function runProgress() {
    if (!progress) return;
    gsap.killTweensOf(progress);
    if (reduceMotion) { gsap.set(progress, { scaleX: 1 }); return; }
    gsap.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: 5, ease: "none" });
  }

  // Ajusta a posição inicial sem animação
  gsap.set(track, { x: getPositionX(0) });

  function go(i, { animate = true } = {}) {
    const n = originalSlides.length;
    let targetIndex = i;

    if (animate) {
      const x = getPositionX(targetIndex);
      gsap.to(track, {
        x,
        duration: 0.8,
        ease: "expo.out",
        onComplete: () => {
          // Loop contínuo: se chegou nos clones das pontas, salta silenciosamente para o original
          if (targetIndex >= n) {
            index = 0;
            gsap.set(track, { x: getPositionX(0) });
          } else if (targetIndex < 0) {
            index = n - 1;
            gsap.set(track, { x: getPositionX(n - 1) });
          } else {
            index = targetIndex;
          }
        }
      });
    } else {
      if (targetIndex >= n) targetIndex = 0;
      if (targetIndex < 0) targetIndex = n - 1;
      index = targetIndex;
      gsap.set(track, { x: getPositionX(index) });
    }
    runProgress();
  }

  function auto() {
    clearInterval(timer);
    if (reduceMotion || originalSlides.length < 2) return;
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
      // Limites baseados nos clones prepended/appended
      const min = getPositionX(originalSlides.length + 0.5);
      const max = getPositionX(-1.5);
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
