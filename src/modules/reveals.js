/**
 * Revelações no scroll:
 *  - [data-lines]: títulos cujas linhas (.ln > span) sobem de dentro da máscara
 *  - [data-fade]: blocos que sobem e aparecem (o hero tem a própria entrada)
 *  - [data-count-group]: números que contam até o valor final
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $$, reduceMotion } from "./env.js";
import { animateCounter } from "./utils.js";

export function initReveals() {
  if (reduceMotion) return;

  $$("[data-lines]").forEach((el) => {
    gsap.to($$(".ln > span", el), {
      y: 0, duration: 1.3, stagger: 0.1, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  const fades = $$("[data-fade]").filter((el) => !el.closest(".hero"));
  ScrollTrigger.batch(fades, {
    start: "top 90%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, ease: "expo.out", clearProps: "transform" }),
  });

  $$("[data-count-group]").forEach((group) => {
    ScrollTrigger.create({
      trigger: group, start: "top 85%", once: true,
      onEnter: () => $$("[data-count]", group).forEach((el, i) => animateCounter(el, { duration: 2, delay: i * 0.12 })),
    });
  });
}
