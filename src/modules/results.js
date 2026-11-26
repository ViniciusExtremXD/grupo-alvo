/**
 * Resultados: tabela (cada linha abre o print original), faixa de prints
 * arrastável e a entrada das linhas com os retornos contando.
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";
import { animateCounter } from "./utils.js";
import { openLightbox } from "./lightbox.js";

export function initResults() {
  const section = $("#resultados");
  if (!section) return;

  // ---- linhas da tabela: clique em qualquer lugar abre o print ----
  const rows = $$(".ledger-row.is-click", section);
  rows.forEach((row) => {
    row.addEventListener("click", () => openLightbox(row.dataset.proof, row.dataset.alt));
  });

  // ---- faixa de prints: arraste com o mouse (no toque é o scroll nativo) ----
  const strip = $("#proofs");
  let dragged = false;
  if (strip) {
    let down = false, startX = 0, startScroll = 0;
    strip.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; dragged = false;
      startX = e.clientX; startScroll = strip.scrollLeft;
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) { dragged = true; strip.classList.add("is-dragging"); }
      if (dragged) strip.scrollLeft = startScroll - dx;
    });
    window.addEventListener("pointerup", () => {
      down = false;
      strip.classList.remove("is-dragging");
    });
    strip.addEventListener("dragstart", (e) => e.preventDefault());
  }
  $$(".proof", section).forEach((btn) => {
    btn.addEventListener("click", () => {
      if (dragged) { dragged = false; return; }
      openLightbox(btn.dataset.proof, btn.dataset.alt);
    });
  });

  if (reduceMotion) return;

  // ---- entrada das linhas, com o retorno contando ----
  gsap.set(rows, { opacity: 0, y: 24 });
  rows.forEach((row) => {
    gsap.to(row, {
      opacity: 1, y: 0, duration: 1, ease: "expo.out", clearProps: "transform",
      scrollTrigger: {
        trigger: row,
        start: "top 92%",
        once: true,
        onEnter: () => {
          const roi = $("[data-count]", row);
          if (roi) animateCounter(roi, { duration: 1.6 });
        },
      },
    });
  });

  const proofs = $$(".proof", section);
  gsap.from(proofs, {
    opacity: 0, y: 60, duration: 1.2, stagger: 0.07, ease: "expo.out", clearProps: "transform,opacity",
    scrollTrigger: { trigger: strip, start: "top 88%", once: true },
  });
}
