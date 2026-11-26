/**
 * Método: cada passo acende ao passar do meio da tela; e o CTA final, que é o
 * próprio centro do alvo, "mira" de leve na direção do cursor.
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, $$, reduceMotion, finePointer } from "./env.js";

export function initMethod() {
  $$("[data-step]").forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: "top 62%",
      onEnter: () => step.classList.add("is-active"),
      onLeaveBack: () => step.classList.remove("is-active"),
    });
  });
  if (reduceMotion) $$("[data-step]").forEach((s) => s.classList.add("is-active"));
}

export function initFinale() {
  const target = $("#finaleTarget");
  const cta = $("#finaleCta");
  if (!target || !cta || reduceMotion) return;
  const rings = $$(".ring", target);

  // anéis entram de fora pra dentro, travando no botão
  gsap.from(rings, {
    scale: 1.6, opacity: 0, duration: 1.4, stagger: { each: 0.12, from: "end" }, ease: "expo.out",
    scrollTrigger: { trigger: target, start: "top 85%", once: true },
  });
  gsap.from(cta, {
    scale: 0, duration: 1.1, ease: "elastic.out(1, 0.55)", delay: 0.35,
    scrollTrigger: { trigger: target, start: "top 85%", once: true },
  });

  // pulso de radar saindo do botão (só enquanto a seção está na tela)
  const ping = target.querySelector(".ping");
  if (ping) {
    const pulse = gsap.fromTo(ping,
      { scale: 1, opacity: 0.8 },
      { scale: 3.4, opacity: 0, duration: 2, ease: "expo.out", repeat: -1, repeatDelay: 0.6, paused: true });
    ScrollTrigger.create({
      trigger: target,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive ? pulse.play() : pulse.pause()),
    });
  }

  if (!finePointer) return;
  const section = target.closest("section");
  const tos = [cta, ...rings].map((el, i) => {
    const k = [0.22, 0.12, 0.07, 0.035][i] ?? 0.03;
    return {
      k,
      x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3.out" }),
      y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3.out" }),
    };
  });
  section.addEventListener("pointermove", (e) => {
    const r = target.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    tos.forEach((t) => { t.x(dx * t.k); t.y(dy * t.k); });
  });
  section.addEventListener("pointerleave", () => tos.forEach((t) => { t.x(0); t.y(0); }));
}
