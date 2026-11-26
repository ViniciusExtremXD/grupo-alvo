/**
 * Revelações genéricas no scroll:
 *  - [data-lines]: títulos cujas linhas (.ln > span) sobem de dentro da máscara
 *  - [data-fade]: blocos que sobem e aparecem (fora do hero, que tem a própria entrada)
 *  - [data-count-group]: números que contam até o valor final
 *  - [data-strike]: frases do diagnóstico riscadas conforme a rolagem
 *  - manifesto: "curtidas" riscado e "faturamento" escrito no scroll
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";
import { animateCounter } from "./utils.js";

export function initReveals() {
  if (reduceMotion) return;
  initLines();
  initFades();
  initCounters();
  initStrikes();
  initManifesto();
}

function initLines() {
  $$("[data-lines]").forEach((el) => {
    gsap.to($$(".ln > span", el), {
      y: 0,
      duration: 1.2,
      stagger: 0.1,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });
}

function initFades() {
  const items = $$("[data-fade]").filter((el) => !el.closest(".hero"));
  ScrollTrigger.batch(items, {
    start: "top 90%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09, ease: "expo.out", clearProps: "transform" }),
  });
}

function initCounters() {
  $$("[data-count-group]").forEach((group) => {
    ScrollTrigger.create({
      trigger: group,
      start: "top 82%",
      once: true,
      onEnter: () => $$("[data-count]", group).forEach((el, i) => animateCounter(el, { duration: 2.2, delay: i * 0.25 })),
    });
  });
}

function initStrikes() {
  $$("[data-strike]").forEach((row) => {
    const text = $(".strike-text", row);
    const fix = $(".diag-fix", row);
    gsap.timeline({
      scrollTrigger: {
        trigger: row,
        start: "top 80%",
        end: "top 42%",
        scrub: 0.6,
        onUpdate: (self) => row.classList.toggle("is-struck", self.progress > 0.85),
      },
    })
      .fromTo(text, { "--strike": "0%" }, { "--strike": "100%", ease: "none", duration: 1 }, 0)
      .fromTo(fix, { opacity: 0.2, x: -12 }, { opacity: 1, x: 0, ease: "none", duration: 0.5 }, 0.5);
  });
}

function initManifesto() {
  const sec = $("#manifesto");
  if (!sec) return;
  gsap.timeline({
    scrollTrigger: { trigger: sec, start: "top 70%", end: "center 45%", scrub: 0.6 },
  })
    .fromTo($(".strike-text", sec), { "--strike": "0%" }, { "--strike": "100%", ease: "none", duration: 1 }, 0)
    .fromTo($(".m-c", sec), { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power1.inOut", duration: 1.1 }, 0.7);
}
