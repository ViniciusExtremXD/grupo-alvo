/**
 * Micro-interações de ponteiro (apenas mouse/trackpad, com motion ligado):
 * botões magnéticos e tilt 3D nos cards. (Cursor customizado removido a pedido
 * do cliente — o ponteiro padrão do sistema é mantido.)
 */
import { gsap } from "./gsap.js";
import { $$, reduceMotion, finePointer } from "./env.js";

export function initPointer() {
  // Sem ponteiro fino ou sem motion: nada de ímã/tilt.
  if (!finePointer || reduceMotion) return;

  initMagnetic();
  initTilt();
}

/** Botões marcados com [data-magnetic] são atraídos pelo cursor. */
function initMagnetic() {
  $$("[data-magnetic]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
  });
}

/** Cards marcados com [data-tilt] inclinam em 3D e recebem um brilho no cursor. */
function initTilt() {
  $$("[data-tilt]").forEach((card) => {
    const rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power2.out" });
    const ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power2.out" });
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      rx(ny * -6); ry(nx * 8);
      card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    });
    card.addEventListener("pointerleave", () => { rx(0); ry(0); });
  });
}
