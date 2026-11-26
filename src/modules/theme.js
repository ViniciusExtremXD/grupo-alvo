/**
 * O fio temático do site — arco, flecha e alvo:
 *  1. Hero: a trajetória de uma flecha cruza a foto e crava num alvo na
 *     parede do time. Depois, de tempos em tempos, um traçador refaz o voo.
 *  2. Lateral: uma flecha desce acompanhando a rolagem e acerta o alvo
 *     quando a página chega ao fim.
 *  3. Rodapé: a cena-assinatura — a flecha entra cravada no alvo e um
 *     traçador percorre a trajetória do arco até o alvo.
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, reduceMotion } from "./env.js";
import { lenis } from "./smooth-scroll.js";

export function initTheme() {
  heroShot();
  rail();
  signature();
}

function ripple(el) {
  if (!el) return;
  gsap.fromTo(el, { scale: 1, opacity: 0.9, transformOrigin: "50% 50%" }, { scale: 4.5, opacity: 0, duration: 1.4, ease: "expo.out" });
}

/* ---------- 1. trajetória no hero ---------- */
function heroShot() {
  const hero = $("#topo");
  const svg = $("#heroShot");
  if (!hero || !svg) return;
  const path = $("#shotPath");
  const target = $("#shotTarget");
  const arrow = $("#shotArrow");
  const tracer = $("#shotTracer");
  const rip = $(".ripple", target);

  // geometria relativa ao tamanho do hero (o alvo fica na parede, acima das cabeças)
  function layout() {
    const W = hero.clientWidth;
    const H = hero.clientHeight;
    const mobile = W < 861;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const s = mobile ? { x: W * 0.02, y: H * 0.46 } : { x: W * 0.58, y: H * 1.02 };
    const t = mobile ? { x: W * 0.64, y: H * 0.1 } : { x: W * 0.74, y: H * 0.17 };
    const c = mobile ? { x: W * 0.3, y: H * 0.0 } : { x: W * 0.6, y: H * 0.08 };
    path.setAttribute("d", `M${s.x.toFixed(1)} ${s.y.toFixed(1)} Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${t.x.toFixed(1)} ${t.y.toFixed(1)}`);
    target.setAttribute("transform", `translate(${t.x.toFixed(1)} ${t.y.toFixed(1)})`);
    return path.getTotalLength();
  }
  let len = layout();
  let lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    len = layout();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: 0 });
    gsap.set(arrow, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: true, start: 1, end: 1 } });
  });

  if (reduceMotion) {
    gsap.set(arrow, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: true, start: 1, end: 1 } });
    gsap.set(tracer, { opacity: 0 });
    return;
  }

  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(target, { scale: 0, transformOrigin: "50% 50%" });
  gsap.set([arrow, tracer], { opacity: 0 });

  // entrada: a trajetória se desenha, o alvo aparece e a flecha crava
  gsap.timeline({ delay: 1.2 })
    .to(path, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" }, 0)
    .to(target, { scale: 1, duration: 0.9, ease: "back.out(2)" }, 0.6)
    .set(arrow, { opacity: 1 }, 1.0)
    .fromTo(arrow,
      { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: true, start: 0, end: 0 } },
      { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: true, start: 0, end: 1 }, duration: 1.1, ease: "power1.in", immediateRender: false }, 1.0)
    .add(() => { ripple(rip); gsap.fromTo(target, { scale: 1.25 }, { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.4)" }); }, 2.1)
    .fromTo(arrow, { rotation: "-=6" }, { rotation: "+=6", duration: 0.7, ease: "elastic.out(1.3, 0.2)" }, 2.1);

  // depois: um traçador refaz o voo de tempos em tempos (só com o hero na tela)
  const loop = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 4.5, paused: true })
    .set(tracer, { opacity: 1 })
    .fromTo(tracer,
      { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
      { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 1.6, ease: "power1.in", immediateRender: false })
    .add(() => ripple(rip))
    .to(tracer, { opacity: 0, duration: 0.2 }, "<");
  setTimeout(() => loop.play(), 4500);
  new IntersectionObserver(([e]) => (e.isIntersecting ? loop.resume() : loop.pause())).observe(hero);
}

/* ---------- 2. flecha na lateral, acompanhando a rolagem ---------- */
function rail() {
  const el = $("#rail");
  if (!el) return;
  const arrow = $("#railArrow");
  const fill = $("#railFill");
  const target = $("#railTarget");
  let hit = false;

  const setY = gsap.quickSetter(arrow, "y", "px");
  const setFill = gsap.quickSetter(fill, "scaleY");
  function update(scroll) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scroll / max)) : 0;
    const travel = el.clientHeight - 28;
    setY(p * travel);
    setFill(p);
    el.classList.toggle("is-on", scroll > window.innerHeight * 0.6);
    if (p > 0.995 && !hit) {
      hit = true;
      target.classList.add("is-hit");
      if (!reduceMotion) ripple($("i", target));
    } else if (p < 0.97 && hit) {
      hit = false;
      target.classList.remove("is-hit");
    }
  }
  if (lenis) lenis.on("scroll", ({ scroll }) => update(scroll));
  else window.addEventListener("scroll", () => update(window.scrollY), { passive: true });
  window.addEventListener("resize", () => update(window.scrollY));
  update(window.scrollY);
}

/* ---------- 3. assinatura no rodapé ---------- */
function signature() {
  const sec = $("#signature");
  if (!sec) return;
  const arrow = $("#sigArrow");
  const target = $("#sigTarget");
  const path = $("#sigPath");
  const tracer = $("#sigTracer");
  const bigRip = $(".ripple", target);
  const miniRip = $(".mini-target .ripple", sec);

  if (reduceMotion) { gsap.set(tracer, { opacity: 0 }); return; }

  const len = path.getTotalLength();
  gsap.set(arrow, { x: -160, y: -160, opacity: 0 });
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(tracer, { opacity: 0 });

  gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 80%", once: true } })
    .to(path, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" }, 0)
    .to(arrow, { x: 0, y: 0, opacity: 1, duration: 0.55, ease: "power3.in" }, 0.5)
    .add(() => { ripple(bigRip); gsap.fromTo(target, { scale: 1.04 }, { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.35)", transformOrigin: "50% 50%" }); }, 1.05)
    .fromTo(arrow, { rotation: -4 }, { rotation: 0, duration: 0.8, ease: "elastic.out(1.3, 0.2)", svgOrigin: "0 0" }, 1.05);

  const loop = gsap.timeline({ repeat: -1, repeatDelay: 1.4, paused: true })
    .set(tracer, { opacity: 1 })
    .fromTo(tracer,
      { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
      { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 1.8, ease: "power1.in", immediateRender: false })
    .add(() => ripple(miniRip))
    .to(tracer, { opacity: 0, duration: 0.2 }, "<");
  ScrollTrigger.create({
    trigger: sec, start: "top bottom", end: "bottom top",
    onToggle: (s) => (s.isActive ? loop.play() : loop.pause()),
  });
}
