/**
 * Preloader: a mira "trava" no logo ALVO (0→100%), dá um pop e revela o site,
 * então dispara a timeline de entrada do hero.
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, reduceMotion } from "./env.js";

/**
 * @param {gsap.core.Timeline} heroIntro timeline pausada retornada por initHero().
 */
export function initPreloader(heroIntro) {
  const preloader = $("#preloader");
  document.body.classList.add("is-loading");

  const finishLoading = () => {
    document.body.classList.remove("is-loading");
    heroIntro.play();
    ScrollTrigger.refresh();
  };

  // Sem motion, sem preloader, ou aba em segundo plano: pula direto para o site.
  if (reduceMotion || !preloader || document.visibilityState === "hidden") {
    preloader?.remove();
    heroIntro.progress(1);
    document.body.classList.remove("is-loading");
    return;
  }

  const counter = { v: 0 };
  const plCount = $("#plCount");
  const plFill = $("#plFill");
  const tl = gsap.timeline({
    onComplete: () => {
      preloader.remove();
      finishLoading();
    },
  });

  tl.to(".preloader-meta", { opacity: 1, duration: 0.25 }, 0)
    .to(".pl-target", { opacity: 1, duration: 0.3 }, 0)
    // conta 0→100 e trava a mira (rings encolhem para o logo)
    .to(counter, {
      v: 100,
      duration: 1.0,
      ease: "power2.out",
      onUpdate: () => {
        const v = counter.v;
        plCount.textContent = Math.round(v);
        if (plFill) plFill.style.transform = `scaleX(${(v / 100).toFixed(3)})`;
        // as rings da mira convergem de 1.5 → 1 conforme carrega
        const s = 1 + (1 - v / 100) * 0.5;
        gsap.set(".pl-target-ring", { scale: s });
      },
    }, 0.1)
    // trava: flash + pop do conjunto
    .to(".pl-target", { scale: 1.12, duration: 0.28, ease: "expo.out" }, ">-0.02")
    .to("#plInner", { scale: 1.18, duration: 0.32, ease: "expo.out" }, "<")
    .to(".preloader-meta", { opacity: 0, duration: 0.25 }, "<")
    // revela o site
    .to(preloader, { yPercent: -100, duration: 0.6, ease: "expo.inOut" }, "+=0.08");

  // failsafe: aba em segundo plano pausa o rAF e congelaria o preloader
  setTimeout(() => {
    if (document.body.classList.contains("is-loading")) {
      tl.kill();
      preloader.remove();
      heroIntro.progress(1);
      document.body.classList.remove("is-loading");
      ScrollTrigger.refresh();
    }
  }, 4200);
}
