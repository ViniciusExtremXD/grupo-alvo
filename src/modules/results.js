/**
 * Resultados: os seis casos. No desktop a faixa fica presa na tela e rola na
 * horizontal enquanto você desce a página (cada retorno conta ao entrar).
 * No celular é um carrossel nativo com encaixe. Clique no print abre em tela
 * cheia.
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";
import { animateCounter, formatNumber } from "./utils.js";
import { openLightbox } from "./lightbox.js";

export function initResults() {
  const cases = $("#cases");
  const track = $("#casesTrack");
  if (!cases || !track) return;
  const cards = $$(".case", track);

  cards.forEach((card) => {
    $(".case-shot", card)?.addEventListener("click", () => openLightbox(card.dataset.proof, card.dataset.alt));
  });

  if (reduceMotion) return;

  // os retornos começam zerados e contam quando o caso aparece
  const rois = cards.map((c) => $("[data-count]", c));
  rois.forEach((el) => {
    el.textContent = (el.dataset.prefix || "") + formatNumber(0, parseInt(el.dataset.decimals || "0", 10)) + (el.dataset.suffix || "");
  });
  const counted = new WeakSet();
  const count = (card) => {
    const el = $("[data-count]", card);
    if (!el || counted.has(el)) return;
    counted.add(el);
    animateCounter(el, { duration: 1.4 });
  };

  const mm = gsap.matchMedia();

  mm.add("(min-width: 1081px)", () => {
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const slide = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: cases,
        start: "center center",
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });

    cards.forEach((card) => {
      ScrollTrigger.create({
        trigger: card,
        containerAnimation: slide,
        start: "left 88%",
        onEnter: () => count(card),
      });
      // o print "assenta" conforme o caso chega ao centro
      gsap.fromTo($(".case-shot", card),
        { rotation: -5, yPercent: 10 },
        { rotation: 0, yPercent: 0, ease: "none",
          scrollTrigger: { trigger: card, containerAnimation: slide, start: "left right", end: "center 55%", scrub: true } });
    });
  });

  mm.add("(max-width: 1080px)", () => {
    // carrossel nativo: conta tudo quando a faixa aparece
    ScrollTrigger.create({
      trigger: cases,
      start: "top 85%",
      once: true,
      onEnter: () => cards.forEach((c, i) => gsap.delayedCall(i * 0.12, () => count(c))),
    });
  });

  gsap.from(cards, {
    opacity: 0, y: 50, duration: 1.1, stagger: 0.08, ease: "expo.out", clearProps: "opacity",
    scrollTrigger: { trigger: cases, start: "top 90%", once: true },
  });
}
