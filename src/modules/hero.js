/**
 * Hero: timeline de entrada (revelada pelo preloader), a MIRA (retícula/alvo)
 * que "trava" no centro, poeira de partículas em canvas, parallax da cena com
 * o mouse e parallax no scroll.
 *
 * Todo o conceito visual da marca gira em torno do ALVO: a retícula converge,
 * os brackets travam e o núcleo pulsa — "faturamento no alvo".
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion, finePointer } from "./env.js";

/**
 * Monta a timeline de entrada do hero (pausada) e liga as animações de idle.
 * @returns {gsap.core.Timeline} timeline pausada, tocada pelo preloader.
 */
export function initHero() {
  const heroIntro = gsap.timeline({ paused: true });

  // estado inicial da mira (antes da intro)
  gsap.set(".target-ring", { scale: 1.35, opacity: 0, transformOrigin: "50% 50%" });
  gsap.set(".target-cross", { scaleX: 0, scaleY: 0, opacity: 0, transformOrigin: "50% 50%" });
  gsap.set(".target-bracket", { opacity: 0 });
  gsap.set("#targetCore", { scale: 0, opacity: 0, transformOrigin: "50% 50%" });
  gsap.set("#targetTicks", { opacity: 0, transformOrigin: "50% 50%" });
  gsap.set("#targetScan", { opacity: 0 });
  gsap.set(".alvo-bracket", { opacity: 0 });
  gsap.set(".alvo-bracket-tl", { x: -14, y: -14 });
  gsap.set(".alvo-bracket-tr", { x: 14, y: -14 });
  gsap.set(".alvo-bracket-bl", { x: -14, y: 14 });
  gsap.set(".alvo-bracket-br", { x: 14, y: 14 });

  heroIntro
    // a retícula surge e "trava" no centro
    .to(".target-ring", {
      scale: 1, opacity: 1, duration: 1.2, stagger: 0.09, ease: "expo.out",
    }, 0)
    .to("#targetTicks", { opacity: 1, duration: 1.0, ease: "power2.out" }, 0.2)
    .to(".target-cross", {
      scaleX: 1, scaleY: 1, opacity: 1, duration: 0.9, ease: "expo.out",
    }, 0.35)
    // brackets convergem de fora pra dentro (lock-on)
    .from(".target-bracket-tl", { x: -46, y: -46, duration: 0.7, ease: "back.out(2)" }, 0.5)
    .from(".target-bracket-tr", { x: 46, y: -46, duration: 0.7, ease: "back.out(2)" }, 0.5)
    .from(".target-bracket-bl", { x: -46, y: 46, duration: 0.7, ease: "back.out(2)" }, 0.5)
    .from(".target-bracket-br", { x: 46, y: 46, duration: 0.7, ease: "back.out(2)" }, 0.5)
    .to(".target-bracket", { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.5)
    // núcleo dispara
    .to("#targetCore", { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2.4)" }, 0.85)
    .to("#targetScan", { opacity: 1, duration: 0.4 }, 0.9)
    // texto entra sobre a mira travada
    .from(".hero-eyebrow", { opacity: 0, y: 20, duration: 0.7, ease: "power3.out" }, 0.55)
    .from(".hero-title .line-inner", {
      yPercent: 118, duration: 1.1, stagger: 0.1, ease: "expo.out",
    }, 0.7)
    // mini-brackets do próprio texto convergem e travam
    .to(".alvo-bracket-tl", { x: 0, y: 0, duration: 0.6, ease: "back.out(2)" }, 0.85)
    .to(".alvo-bracket-tr", { x: 0, y: 0, duration: 0.6, ease: "back.out(2)" }, 0.85)
    .to(".alvo-bracket-bl", { x: 0, y: 0, duration: 0.6, ease: "back.out(2)" }, 0.85)
    .to(".alvo-bracket-br", { x: 0, y: 0, duration: 0.6, ease: "back.out(2)" }, 0.85)
    .to(".alvo-bracket", { opacity: 1, duration: 0.4, ease: "power2.out" }, 0.85)
    .from(".hero-sub", { opacity: 0, y: 26, duration: 0.8, ease: "power3.out" }, 1.1)
    .from(".hero-ctas > *", { opacity: 0, y: 26, stagger: 0.1, duration: 0.7, ease: "power3.out" }, 1.25)
    .from(".hero-statstrip .hstat", { opacity: 0, y: 24, stagger: 0.1, duration: 0.7, ease: "power3.out" }, 1.4)
    .from(".hero-scrollhint", { opacity: 0, duration: 0.8 }, 1.6)
    .set(".hero-title .line", { overflow: "visible" });

  // idle: retícula de ticks gira devagar, núcleo pulsa, scan varre.
  // svgOrigin garante a rotação em torno do centro real da SVG (200,200),
  // não do bounding-box do elemento (que descentralizaria a linha do scan).
  if (!reduceMotion) {
    gsap.to("#targetTicks", { rotation: 360, duration: 46, ease: "none", repeat: -1, svgOrigin: "200 200" });
    gsap.to("#targetRingDashed", { rotation: -360, duration: 34, ease: "none", repeat: -1, svgOrigin: "200 200" });
    gsap.to("#targetScan", { rotation: 360, duration: 6.5, ease: "none", repeat: -1, svgOrigin: "200 200" });
    gsap.to("#targetCore", {
      scale: 1.35, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "50% 50%",
    });
    // respiro sutil das rings externas
    gsap.to(".target-ring-outer", {
      scale: 1.04, duration: 4.2, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "50% 50%",
    });
  }

  initParticles();
  initParallax();

  return heroIntro;
}

/** Poeira de partículas violeta que deriva e reage ao mouse. */
function initParticles() {
  const canvas = $("#heroParticles");
  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext("2d");
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  let particles = [];
  let w, h;

  function resize() {
    w = canvas.offsetWidth; h = canvas.offsetHeight;
    canvas.width = w * DPR; canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.min(90, Math.round((w * h) / 20000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.14,
      p: Math.random() * Math.PI * 2,
      s: 0.4 + Math.random() * 1.1,
    }));
  }
  resize();
  window.addEventListener("resize", resize);

  const violet = [167, 139, 250]; // --violet-2
  let t = 0;
  function draw() {
    t += 0.016;
    ctx.clearRect(0, 0, w, h);
    for (const pt of particles) {
      pt.x += pt.vx; pt.y += pt.vy;
      if (pt.x < 0) pt.x = w; if (pt.x > w) pt.x = 0;
      if (pt.y < 0) pt.y = h; if (pt.y > h) pt.y = 0;
      const a = 0.14 + 0.4 * Math.abs(Math.sin(pt.p + t * pt.s));
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${violet[0]},${violet[1]},${violet[2]})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
}

/** Parallax da mira com o mouse + parallax da cena no scroll. */
function initParallax() {
  if (reduceMotion) return;

  // mouse: a cena da mira desliza suavemente
  if (finePointer) {
    const scene = $(".hero-target");
    const hero = $(".hero");
    if (scene && hero) {
      const mx = gsap.quickTo(scene, "xPercent", { duration: 1.2, ease: "power2.out" });
      const my = gsap.quickTo(scene, "yPercent", { duration: 1.2, ease: "power2.out" });
      hero.addEventListener("pointermove", (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        mx(nx * 4); my(ny * 4);
      });
    }
  }

  // scroll: a mira sobe e desvanece; o título sobe um pouco mais rápido
  gsap.to(".hero-target", {
    yPercent: 16, opacity: 0.15, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
  gsap.to(".hero-inner", {
    yPercent: -10, opacity: 0.2, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom 20%", scrub: true },
  });
}
