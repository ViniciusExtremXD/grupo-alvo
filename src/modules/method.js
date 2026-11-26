/**
 * Como funciona: a linha no topo dos passos enche conforme a rolagem, e cada
 * passo acende quando a linha chega nele.
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";

export function initMethod() {
  const steps = $$("[data-step]");
  if (!steps.length) return;
  if (reduceMotion) {
    steps.forEach((s) => s.classList.add("is-active"));
    const fill = $("#stepsFill");
    if (fill) fill.style.transform = "scaleX(1)";
    return;
  }

  gsap.to("#stepsFill", {
    scaleX: 1, ease: "none",
    scrollTrigger: {
      trigger: "#steps", start: "top 75%", end: "bottom 55%", scrub: 0.6,
      onUpdate: (self) => {
        steps.forEach((s, i) => s.classList.toggle("is-active", self.progress >= i / steps.length - 0.02 && self.progress > 0));
      },
    },
  });

  // no celular os passos ficam em coluna: acende cada um ao entrar na tela
  ScrollTrigger.matchMedia({
    "(max-width: 560px)": () => {
      steps.forEach((s) => ScrollTrigger.create({ trigger: s, start: "top 75%", onEnter: () => s.classList.add("is-active") }));
    },
  });
}
