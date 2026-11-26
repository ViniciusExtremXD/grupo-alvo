/**
 * Faixa que reage à rolagem: acelera com a velocidade do scroll, inverte o
 * sentido quando a pessoa sobe a página e inclina no embalo.
 *
 * A translação roda via Web Animations (no compositor); o JS só ajusta a
 * velocidade de reprodução, e só enquanto a faixa está na tela.
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";
import { lenis } from "./smooth-scroll.js";

const BASE_MS = 26000;

export function initMarquee() {
  const marquee = $(".marquee");
  const track = $("#marqueeTrack");
  if (!marquee || !track || reduceMotion || !track.animate) return;

  const anim = track.animate(
    [{ transform: "translate3d(0, 0, 0)" }, { transform: "translate3d(-50%, 0, 0)" }],
    { duration: BASE_MS, iterations: Infinity }
  );
  // começa "lá na frente" pra poder tocar de trás pra frente sem bater no início
  anim.currentTime = BASE_MS * 2000;

  const items = $$(".marquee-item", track);
  const skewTo = gsap.quickTo(items, "skewX", { duration: 0.6, ease: "power3.out" });

  let rate = 1;
  let dir = 1;
  let lastSkew = 0;

  function frame(_t, deltaMs) {
    const v = lenis ? lenis.velocity : 0;
    if (Math.abs(v) > 0.4) dir = v > 0 ? 1 : -1;
    const target = dir * (1 + Math.min(Math.abs(v) * 0.35, 7));
    const k = 1 - Math.pow(0.9, deltaMs / 16.667);
    const next = rate + (target - rate) * k;
    if (Math.abs(next - rate) > 0.004) {
      rate = next;
      anim.playbackRate = rate;
    }
    const skew = gsap.utils.clamp(-10, 10, -v * 0.45);
    if (Math.abs(skew - lastSkew) > 0.05) {
      lastSkew = skew;
      skewTo(skew);
    }
  }

  let running = false;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting === running) return;
    running = entry.isIntersecting;
    if (running) { anim.play(); gsap.ticker.add(frame); }
    else { anim.pause(); gsap.ticker.remove(frame); }
  }).observe(marquee);
}
