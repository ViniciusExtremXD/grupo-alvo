/**
 * Como funciona: os passos se acendem um a um, sozinhos, enquanto uma flecha
 * corre pela linha — no último passo ela acerta o alvo no fim da linha.
 * Passar o mouse (ou tocar) num passo leva a flecha até ele.
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";

const STEP_MS = 2600;

export function initMethod() {
  const wrap = $("#steps");
  const steps = $$("[data-step]");
  if (!wrap || !steps.length) return;
  const fill = $("#stepsFill"), arrow = $("#stepsArrow"), target = $("#stepsTarget");
  const N = steps.length;

  if (reduceMotion) {
    steps.forEach((s) => s.classList.add("is-active"));
    if (fill) fill.style.transform = "scaleX(1)";
    if (arrow) arrow.style.left = "100%";
    return;
  }

  let i = -1;
  function set(n) {
    if (n === i) return;
    i = n;
    steps.forEach((s, k) => {
      s.classList.toggle("is-active", k === i);
      s.classList.toggle("is-done", k < i);
    });
    const p = (i + 1) / N;
    gsap.to(fill, { scaleX: p, duration: 0.9, ease: "power3.inOut", overwrite: true });
    gsap.to(arrow, {
      left: `${p * 100}%`, duration: 0.9, ease: "power3.inOut", overwrite: true,
      onComplete: () => {
        if (i !== N - 1 || !target) return;
        target.classList.remove("is-hit");
        void target.offsetWidth;
        target.classList.add("is-hit");
      },
    });
  }

  let timer = null, visible = false, hover = false;
  const stop = () => { clearInterval(timer); timer = null; };
  const play = () => {
    stop();
    if (!visible || hover) return;
    if (i < 0) set(0);
    timer = setInterval(() => set((i + 1) % N), STEP_MS);
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; play(); }, { threshold: 0.4 }).observe(wrap);

  steps.forEach((s, k) => {
    s.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hover = true; stop(); set(k); } });
    s.addEventListener("pointerleave", () => { hover = false; play(); });
    s.addEventListener("click", () => { set(k); play(); });
  });
}
