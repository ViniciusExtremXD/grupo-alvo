/**
 * Método: linha de progresso vertical que preenche no scroll, passos que se
 * acendem ao entrar na tela e entrada suave do formulário.
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";

export function initMethod() {
  if ($("#stepsProgress") && !reduceMotion) {
    gsap.to("#stepsProgress", {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".method-steps",
        start: "top 70%",
        end: "bottom 45%",
        scrub: 0.6,
      },
    });
  }

  $$("[data-step]").forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: "top 70%",
      onEnter: () => step.classList.add("is-active"),
      onLeaveBack: () => step.classList.remove("is-active"),
    });
  });

  if ($(".lead-form") && !reduceMotion) {
    gsap.from(".lead-form", {
      opacity: 0, y: 60, duration: 1.1, ease: "power3.out",
      scrollTrigger: { trigger: ".lead-form", start: "top 85%", once: true },
    });
  }
}
