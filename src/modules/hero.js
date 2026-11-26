/**
 * Hero: o título "A GENTE MIRA, VOCÊ FATURA●" — o ponto final é o centro do
 * alvo. Os anéis nascem em volta dele, o título sobe, e uma flecha vem da
 * direita e crava no ponto. No scroll, a cena se afasta.
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";

export function initHero() {
  const hero = $("#topo");
  if (!hero) return;
  const rings = $("#heroRings");
  const dot = $("#bullseye");
  const arrow = $("#heroArrow");
  const title = $(".hero-title", hero);
  const lineSpans = $$(".hero-title .ln > span", hero);
  const circles = $$("circle", rings);
  const fades = $$("[data-fade]", hero);
  const eyebrows = $$(".hero-top .eyebrow", hero);

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
    return { cx: d.left - h.left + d.width / 2, cy: d.top - h.top + d.height / 2, r: d.width / 2 };
  }

  function place() {
    const { cx, cy, r } = measure();
    rings.style.left = `${cx}px`;
    rings.style.top = `${cy}px`;
    const aw = arrow.getBoundingClientRect().width || arrow.clientWidth;
    const ah = aw * (24 / 400);
    // a ponta (x=0 do SVG) entra um pouco no ponto, como se tivesse cravado
    arrow.style.left = `${cx - r * 0.35}px`;
    arrow.style.top = `${cy - ah / 2}px`;
    return { cx, cy };
  }

  place();
  // centralização em % pelo GSAP (o `translate` do CSS viraria px fixos ao
  // ser lido por ele, e os anéis sairiam do lugar ao redimensionar)
  gsap.set(rings, { x: 0, y: 0, xPercent: -50, yPercent: -50 });
  let lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastW) return; // barra do navegador no celular
    lastW = window.innerWidth;
    place();
  });
  document.fonts?.ready.then(place);

  if (reduceMotion) return;

  // ---------- entrada ----------
  gsap.set(rings, { opacity: 1 });
  gsap.set(circles, { scale: 0.4, opacity: 0, transformOrigin: "50% 50%" });
  gsap.set(arrow, { opacity: 1, x: () => window.innerWidth + 40 - parseFloat(arrow.style.left) });
  gsap.set(eyebrows, { opacity: 0, y: 12 });

  const intro = gsap.timeline({ delay: 0.15 });
  intro
    .to(circles, { scale: 1, opacity: 1, duration: 1.6, stagger: 0.07, ease: "expo.out" }, 0)
    .to(lineSpans, { y: 0, duration: 1.2, stagger: 0.12, ease: "expo.out" }, 0.1)
    .to(eyebrows, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" }, 0.2)
    // a flecha cruza a tela e crava
    .to(arrow, { x: 0, duration: 0.5, ease: "power3.in" }, 0.95)
    .add(() => {
      dot.classList.remove("is-hit");
      void dot.offsetWidth;
      dot.classList.add("is-hit");
    }, 1.45)
    .fromTo(dot, { scale: 1.9 }, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.4)", immediateRender: false }, 1.45)
    .fromTo(arrow, { rotation: -2.2 }, { rotation: 0, duration: 0.9, ease: "elastic.out(1.2, 0.18)", transformOrigin: "0% 50%", immediateRender: false }, 1.45)
    .fromTo(title, { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)", immediateRender: false }, 1.45)
    .to(circles, { scale: 1.06, duration: 0.25, stagger: 0.04, ease: "power2.out", yoyo: true, repeat: 1 }, 1.45)
    .to(fades, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "expo.out" }, 1.15);

  // ---------- saída no scroll ----------
  gsap.timeline({
    scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
  })
    .to(rings, { scale: 1.6, opacity: 0, ease: "none" }, 0)
    .to([title, arrow], { y: () => -window.innerHeight * 0.14, ease: "none" }, 0);
}
