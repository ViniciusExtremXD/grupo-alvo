/**
 * Contato: o alvo em 3D de novo, agora pra pessoa atirar. Duas flechas
 * chegam fora do centro quando a seção aparece; cada clique no alvo dispara
 * uma flecha e mostra a pontuação. Acertou o centro: o botão do WhatsApp
 * pulsa — "agora é a nossa vez".
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, reduceMotion } from "./env.js";
import { createTarget, scoreChip } from "./target3d.js";

export function initContact() {
  const stage = $("#contactStage");
  if (!stage) return;
  const hint = $(".hero-hint", stage);
  const cta = $(".btn-primary", stage);

  const layout = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    const mobile = w < 861;
    const radius = mobile ? Math.min(w * 0.3, 140) : Math.min(h * 0.36, w * 0.18);
    const L = mobile ? { cx: w * 0.5, cy: radius + 36, radius } : { cx: w * 0.74, cy: h * 0.5, radius };
    stage.style.setProperty("--tx", `${L.cx}px`);
    stage.style.setProperty("--ty", `${L.cy}px`);
    stage.style.setProperty("--tr", `${L.radius}px`);
    return L;
  };
  layout();
  if (reduceMotion) return;

  let shots = 0, best = 0;
  const target = createTarget(stage, {
    layout,
    onHit(score, arrow) {
      scoreChip(stage, target, score, arrow);
      if (!arrow.user) return;
      shots++; best = Math.max(best, score);
      if (score === 10) {
        if (hint) hint.textContent = "Na mosca. Agora é a nossa vez.";
        if (cta) { cta.classList.remove("is-pulse"); void cta.offsetWidth; cta.classList.add("is-pulse"); }
      } else if (hint) {
        hint.textContent = `${shots} ${shots === 1 ? "tiro" : "tiros"} · melhor: ${best} · mire no centro`;
      }
    },
  });
  if (!target) return;
  stage.classList.add("has-gl");

  ScrollTrigger.create({
    trigger: stage, start: "top 65%", once: true,
    onEnter: () => {
      target.relayout();
      gsap.delayedCall(0.3, () => target.fire(-0.5, -0.36, { color: 1 }));
      gsap.delayedCall(0.9, () => target.fire(0.42, 0.3, { color: 2 }));
      if (hint) gsap.fromTo(hint, { opacity: 0 }, { opacity: 1, duration: 1, delay: 1.8 });
    },
  });
}
