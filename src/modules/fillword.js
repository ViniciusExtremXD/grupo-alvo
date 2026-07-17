/**
 * Fill-word do statement: a palavra FATURAMENTO (contorno) preenche com o
 * gradiente da marca conforme a pessoa ROLA a página (scroll-scrub), não no
 * hover. A ideia é o faturamento "crescer" enquanto você desce.
 */
import { gsap } from "./gsap.js";
import { $, reduceMotion } from "./env.js";

export function initFillword() {
  const echo = $(".statement .fillword-echo");
  if (!echo) return;

  // sem motion: mostra a palavra já preenchida.
  if (reduceMotion) {
    echo.style.clipPath = "inset(0 0% 0 0)";
    return;
  }

  const state = { v: 0 };
  gsap.to(state, {
    v: 1,
    ease: "none",
    scrollTrigger: {
      trigger: ".statement",
      start: "top 80%",
      end: "bottom 62%",
      scrub: 0.5,
    },
    onUpdate: () => {
      echo.style.clipPath = `inset(0 ${((1 - state.v) * 100).toFixed(1)}% 0 0)`;
    },
  });
}
