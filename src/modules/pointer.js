/**
 * Botões magnéticos ([data-magnetic]): puxados de leve pelo cursor.
 * Só com mouse/trackpad.
 */
import { gsap } from "./gsap.js";
import { $$, reduceMotion, finePointer } from "./env.js";

export function initPointer() {
  if (!finePointer || reduceMotion) return;

  $$("[data-magnetic]").forEach((el) => {
    gsap.set(el, { x: 0, y: 0 });
    // o GSAP zera inline o `scale` do CSS ao assumir o transform; devolve
    // pro CSS pra o "aperto" do :active continuar funcionando
    el.style.removeProperty("scale");
    el.style.removeProperty("translate");
    el.style.removeProperty("rotate");

    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });

    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
  });
}
