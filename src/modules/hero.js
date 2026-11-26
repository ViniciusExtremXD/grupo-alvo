/**
 * Hero: o alvo em 3D ao lado do título.
 *  - Entrada: o título sobe; três flechas chegam — a primeira longe do
 *    centro, a segunda mais perto, a terceira no centro ("10 · no alvo").
 *  - Depois: o alvo balança devagar, acompanha o mouse, gira ao arrastar e
 *    recebe uma flecha onde a pessoa clicar (com a pontuação do tiro).
 *  - No scroll: a câmera mergulha no centro do alvo.
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";
import { createTarget } from "./target3d.js";

export function initHero() {
  const hero = $("#topo");
  if (!hero) return;
  const hint = $("#heroHint", hero);

  // onde o alvo fica dentro do hero (px): à direita no desktop, em cima no celular
  const layout = () => {
    const w = hero.clientWidth, h = hero.clientHeight;
    const L = w < 861
      ? { cx: w * 0.5, cy: h * 0.25, radius: Math.min(w * 0.34, h * 0.19) }
      : { cx: w * 0.75, cy: h * 0.5, radius: Math.min(h * 0.33, w * 0.2) };
    hero.style.setProperty("--tx", `${L.cx}px`);
    hero.style.setProperty("--ty", `${L.cy}px`);
    hero.style.setProperty("--tr", `${L.radius}px`);
    return L;
  };
  layout();

  const lines = $$(".hero-title .ln > span", hero);
  const fades = $$("[data-fade]", hero);
  if (reduceMotion) return; // fica o alvo estático em CSS

  const target = createTarget(hero, { layout, onHit: showScore });
  if (target) hero.classList.add("has-gl");

  let shots = 0, best = 0;
  function showScore(score, arrow) {
    if (!target) return;
    const [x, y] = target.project(arrow.x, arrow.y);
    const chip = document.createElement("span");
    chip.className = `score-chip${score === 10 ? " is-bull" : ""}`;
    chip.textContent = score === 10 ? "10 · no alvo" : score ? String(score) : "fora";
    chip.style.left = `${x}px`;
    chip.style.top = `${y}px`;
    hero.appendChild(chip);
    gsap.fromTo(chip, { opacity: 0, y: 4, scale: 0.7 }, { opacity: 1, y: -30, scale: 1, duration: 0.5, ease: "back.out(2.2)" });
    gsap.to(chip, { opacity: 0, y: -52, duration: 0.6, delay: score === 10 ? 1.8 : 1.0, ease: "power2.in", onComplete: () => chip.remove() });
    if (arrow.user) {
      shots++; best = Math.max(best, score);
      if (hint) hint.textContent = `${shots} ${shots === 1 ? "tiro" : "tiros"} · melhor: ${best}`;
    }
  }

  // ---------- entrada ----------
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.to(fades[0], { opacity: 1, y: 0, duration: 1 }, 0.2)
    .to(lines, { y: 0, duration: 1.3, stagger: 0.12 }, 0.3)
    .to(fades.slice(1), { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.8);
  if (target) {
    tl.add(() => target.fire(-0.56, 0.3, { color: 1 }), 1.0)
      .add(() => target.fire(0.3, -0.34, { color: 2 }), 1.55)
      .add(() => target.fire(0.012, -0.008, { color: 0, spread: 0.03 }), 2.25)
      .fromTo(hint, { opacity: 0 }, { opacity: 1, duration: 1 }, 3.4);

    // mergulho no centro do alvo conforme o hero sai da tela
    gsap.to({ v: 0 }, {
      v: 1, ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true, onUpdate: (s) => target.setDive(s.progress) },
    });
  }

  gsap.to($(".hero-inner", hero), {
    yPercent: -14, opacity: 0, ease: "none",
    scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
  });
}
