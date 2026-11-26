/**
 * Resultados: grade de casos. Cada caso entra em cascata, o retorno conta
 * na hora e o print abre em tela cheia.
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";
import { animateCounter, formatNumber } from "./utils.js";
import { openLightbox } from "./lightbox.js";

export function initResults() {
  const grid = $("#cases");
  if (!grid) return;
  const cards = $$(".case", grid);

  cards.forEach((card) => {
    $(".case-shot", card)?.addEventListener("click", () => openLightbox(card.dataset.proof, card.dataset.alt));
  });

  if (reduceMotion) return;

  cards.forEach((card) => {
    const roi = $("[data-count]", card);
    if (roi) roi.textContent = (roi.dataset.prefix || "") + formatNumber(0, 0) + (roi.dataset.suffix || "");
  });

  gsap.set(cards, { opacity: 0, y: 40 });
  ScrollTrigger.batch(cards, {
    start: "top 88%",
    once: true,
    onEnter: (batch) => {
      gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: "expo.out", clearProps: "transform" });
      batch.forEach((card, i) => {
        const roi = $("[data-count]", card);
        if (roi) animateCounter(roi, { duration: 1.4, delay: 0.15 + i * 0.08 });
      });
    },
  });
}
