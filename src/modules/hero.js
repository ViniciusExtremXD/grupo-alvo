/**
 * Hero: o título "A GENTE MIRA, VOCÊ FATURA●" — o ponto final é o centro do
 * alvo.
 *  1. Abertura: um ponto violeta nasce no centro da tela, pulsa, e voa até
 *     virar o ponto final do título (a mira "trava").
 *  2. O título sobe, os anéis aparecem em volta do ponto e uma flecha vem da
 *     direita e crava nele.
 *  3. Depois: o alvo pulsa de tempos em tempos e acompanha o mouse de leve;
 *     no scroll, a cena se afasta.
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion, finePointer } from "./env.js";
import { lenis } from "./smooth-scroll.js";

export function initHero() {
  const hero = $("#topo");
  if (!hero) return;
  const rings = $("#heroRings");
  const dot = $("#bullseye");
  const arrow = $("#heroArrow");
  const title = $(".hero-title", hero);
  const lineSpans = $$(".hero-title .ln > span", hero);
  const circles = $$("circle:not(.ping)", rings);
  const ping = $(".ping", rings);
  const fades = $$("[data-fade]", hero);
  const intro = $("#intro");

  /**
   * Centro do ponto final em px relativos ao hero, ignorando os transforms
   * de entrada (as linhas começam deslocadas pra baixo).
   */
  function measure() {
    const prev = lineSpans.map((s) => s.style.transform);
    lineSpans.forEach((s) => { s.style.transform = "none"; });
    const h = hero.getBoundingClientRect();
    const d = dot.getBoundingClientRect();
    lineSpans.forEach((s, i) => { s.style.transform = prev[i]; });
    return {
      cx: d.left - h.left + d.width / 2,
      cy: d.top - h.top + d.height / 2,
      r: d.width / 2,
      vx: d.left + d.width / 2,
      vy: d.top + d.height / 2,
    };
  }

  function place() {
    const m = measure();
    rings.style.left = `${m.cx}px`;
    rings.style.top = `${m.cy}px`;
    // luz e radar do fundo saem do mesmo ponto
    hero.style.setProperty("--cx", `${m.cx}px`);
    hero.style.setProperty("--cy", `${m.cy}px`);
    const aw = arrow.getBoundingClientRect().width || arrow.clientWidth;
    // a ponta (x=0 do SVG) entra um pouco no ponto, como se tivesse cravado
    arrow.style.left = `${m.cx - m.r * 0.35}px`;
    arrow.style.top = `${m.cy - (aw * 24) / 400 / 2}px`;
    return m;
  }

  place();
  // centralização em % pelo GSAP (o `translate` do CSS viraria px fixos)
  gsap.set(rings, { x: 0, y: 0, xPercent: -50, yPercent: -50 });
  let lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastW) return; // barra do navegador no celular
    lastW = window.innerWidth;
    place();
  });
  document.fonts?.ready.then(place);

  // radar do fundo para de girar com o hero fora da tela
  new IntersectionObserver(([e]) => hero.classList.toggle("is-off", !e.isIntersecting)).observe(hero);

  if (reduceMotion) {
    intro?.remove();
    return;
  }

  const bg = $("#heroBg");
  lenis?.stop();
  // (a opacidade de cada anel fica com o CSS; aqui anima o conjunto)
  gsap.set(circles, { scale: 0.4, transformOrigin: "50% 50%" });
  gsap.set(arrow, { opacity: 1, x: () => window.innerWidth + 40 - parseFloat(arrow.style.left) });

  const tl = gsap.timeline({ delay: 0.1 });

  // ---------- 1. abertura: o ponto nasce e trava no título ----------
  if (intro) {
    const introDot = $("#introDot");
    const introRings = $$(".intro-ring", intro);
    tl.to(introDot, { scale: 1, duration: 0.5, ease: "back.out(2.2)" }, 0)
      .fromTo(introRings, { scale: 0.15, opacity: 0.8 }, { scale: 4.5, opacity: 0, duration: 1.2, stagger: 0.16, ease: "expo.out" }, 0.2)
      .add(() => {
        const m = measure();
        gsap.to(introDot, {
          x: m.vx - window.innerWidth / 2,
          y: m.vy - window.innerHeight / 2,
          scale: (m.r * 2) / 24,
          duration: 0.85,
          ease: "expo.inOut",
        });
      }, 0.85)
      .to(intro, { backgroundColor: "rgba(12, 11, 14, 0)", duration: 0.7, ease: "power2.inOut" }, 0.95)
      .add(() => {
        gsap.set(dot, { opacity: 1 });
        intro.remove();
        lenis?.start();
      }, 1.72);
  } else {
    gsap.set(dot, { opacity: 1 });
    lenis?.start();
  }

  // ---------- 2. título, anéis, flecha ----------
  const T = intro ? 1.0 : 0;
  tl.to(lineSpans, { y: 0, duration: 1.2, stagger: 0.1, ease: "expo.out" }, T)
    .to([rings, bg], { opacity: 1, duration: 1.4, ease: "power2.out" }, T + 0.5)
    .to(circles, { scale: 1, duration: 1.6, stagger: 0.07, ease: "expo.out" }, T + 0.6)
    .to(arrow, { x: 0, duration: 0.5, ease: "power3.in" }, T + 1.0)
    .add(() => {
      dot.classList.remove("is-hit");
      void dot.offsetWidth;
      dot.classList.add("is-hit");
    }, T + 1.5)
    .fromTo(dot, { scale: 1.9 }, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.4)", immediateRender: false }, T + 1.5)
    .fromTo(arrow, { rotation: -2.2 }, { rotation: 0, duration: 0.9, ease: "elastic.out(1.2, 0.18)", transformOrigin: "0% 50%", immediateRender: false }, T + 1.5)
    .fromTo(title, { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)", immediateRender: false }, T + 1.5)
    .to(circles, { scale: 1.06, duration: 0.25, stagger: 0.04, ease: "power2.out", yoyo: true, repeat: 1 }, T + 1.5)
    .to(fades, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "expo.out" }, T + 1.1)
    // ---------- 3. o alvo segue vivo ----------
    .add(() => {
      const pulse = gsap.fromTo(ping,
        { scale: 1, opacity: 0.7 },
        { scale: 12, opacity: 0, duration: 2.4, ease: "expo.out", repeat: -1, repeatDelay: 1.4, transformOrigin: "50% 50%" });
      // só pulsa com o hero na tela
      new IntersectionObserver(([e]) => (e.isIntersecting ? pulse.play() : pulse.pause())).observe(hero);

      // saída no scroll: o alvo abre e some, a luz apaga (criada só depois da
      // entrada, pra partir da opacidade final e não brigar com ela)
      const exit = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
      gsap.to(rings, { scale: 1.6, opacity: 0, ease: "none", scrollTrigger: exit });
      gsap.to(bg, { opacity: 0, ease: "none", scrollTrigger: { ...exit } });
    }, T + 2.2);

  // anéis acompanham o mouse de leve (a mira "procura")
  if (finePointer) {
    const xTo = gsap.quickTo(rings, "x", { duration: 1.4, ease: "power3.out" });
    const yTo = gsap.quickTo(rings, "y", { duration: 1.4, ease: "power3.out" });
    hero.addEventListener("pointermove", (e) => {
      xTo((e.clientX / window.innerWidth - 0.5) * 60);
      yTo((e.clientY / window.innerHeight - 0.5) * 40);
    });
    hero.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
  }
}
