/**
 * Revelações no scroll: split de títulos palavra a palavra, parallax de mídia,
 * contadores de números e entradas suaves das seções (dor, serviços, para
 * quem, quem somos, finale).
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $$, reduceMotion } from "./env.js";
import { animateCounter } from "./utils.js";

export function initReveals() {
  initSplitTitles();
  initParallax();
  initStats();
  initSectionReveals();
  initFinale();
}

/**
 * Quebra os títulos [data-split] em palavras e sobe cada uma com máscara.
 * Respeita quebras de linha explícitas via <br> no HTML — cada linha vira um
 * bloco, então o controle de onde a linha quebra é do conteúdo, não do wrap.
 */
function initSplitTitles() {
  $$("[data-split]").forEach((el) => {
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = lines
      .map((line) => {
        const words = line
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((word) => `<span class="w"><span class="wi">${word}</span></span>`)
          .join(" ");
        return `<span class="tline">${words}</span>`;
      })
      .join("");
    if (reduceMotion) return;
    gsap.from($$(".wi", el), {
      yPercent: 118,
      duration: 1,
      stagger: 0.05,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });
}

/** Mídia marcada com [data-parallax] desliza no eixo Y conforme o scroll. */
function initParallax() {
  if (reduceMotion) return;
  $$("[data-parallax]").forEach((el) => {
    const strength = parseFloat(el.dataset.parallax);
    gsap.to(el, {
      yPercent: strength,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
}

/** Contadores dos números-chave (projetos, ROI, anos, comprometimento). */
function initStats() {
  $$("[data-count-group]").forEach((group) => {
    ScrollTrigger.create({
      trigger: group,
      start: "top 80%",
      once: true,
      onEnter: () => {
        $$("[data-count]", group).forEach((el, i) =>
          animateCounter(el, { duration: 2.1, delay: i * 0.12 })
        );
      },
    });
  });
}

/** Entradas suaves de cards em grades diversas. */
function initSectionReveals() {
  if (reduceMotion) return;
  $$("[data-reveal-group]").forEach((group) => {
    const items = $$("[data-reveal]", group);
    gsap.from(items, {
      opacity: 0, y: 52, stagger: 0.1, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: group, start: "top 82%", once: true },
    });
  });
}

/** Título e CTA da seção final. */
function initFinale() {
  if (reduceMotion) return;
  gsap.from(".finale-title .line-inner", {
    yPercent: 118,
    duration: 1.1,
    stagger: 0.1,
    ease: "expo.out",
    scrollTrigger: { trigger: ".finale", start: "top 70%", once: true },
  });
  gsap.from([".finale-sub", ".finale .btn"], {
    opacity: 0, y: 30, stagger: 0.12, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".finale", start: "top 60%", once: true },
  });
}
