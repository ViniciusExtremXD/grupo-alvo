/**
 * Hero: a foto do time entra com um "zoom out" lento, o título sobe linha a
 * linha e o resto aparece em seguida. No scroll, a foto desce mais devagar
 * que o texto (parallax) e escurece.
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";

export function initHero() {
  const hero = $("#topo");
  if (!hero || reduceMotion) return;
  const img = $(".hero-media img", hero);
  const lines = $$(".hero-title .ln > span", hero);
  const fades = $$("[data-fade]", hero);
  const label = $(".hero-label", hero);

  const start = () => {
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .to(img, { scale: 1, duration: 2.6 }, 0)
      .to(label, { opacity: 1, y: 0, duration: 1 }, 0.25)
      .to(lines, { y: 0, duration: 1.3, stagger: 0.12 }, 0.35)
      .to(fades.filter((f) => f !== label), { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.8);
  };
  if (img.complete) start();
  else {
    img.addEventListener("load", start, { once: true });
    setTimeout(() => { if (gsap.getProperty(img, "scale") > 1.1) start(); }, 1200);
  }

  // parallax: foto mais lenta e escurecendo, texto sobe um pouco mais
  gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } })
    .to($(".hero-media", hero), { yPercent: 18, opacity: 0.35, ease: "none" }, 0)
    .to($(".hero-inner", hero), { yPercent: -14, opacity: 0, ease: "none" }, 0);
}
