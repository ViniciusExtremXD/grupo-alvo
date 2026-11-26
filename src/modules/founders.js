/**
 * Sócios: texto no centro, Felipe de um lado e Gabriel do outro.
 * Entrada em sequência — primeiro o Felipe (abre da esquerda), depois o
 * Gabriel (abre da direita) — com a luz "acendendo" em cada um.
 * Foto viva: a imagem respira devagar (CSS), um reflexo passa de tempos em
 * tempos e ela acompanha o mouse de leve.
 * Vídeo: com data-video preenchido (ex.: "assets/felipe.mp4"), o vídeo toca
 * na entrada no lugar da foto.
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion, finePointer } from "./env.js";

export function initFounders() {
  const stage = $("#foundersStage");
  if (!stage) return;
  const people = $$("[data-person]", stage).map(setupPerson);
  if (reduceMotion) return;

  const enter = (p, fromLeft) =>
    gsap.timeline()
      .fromTo(p.frame,
        { clipPath: fromLeft ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" }, 0)
      .fromTo(p.media,
        { scale: 1.35, xPercent: fromLeft ? -8 : 8, filter: "brightness(0.1) saturate(0.4)" },
        { scale: 1, xPercent: 0, filter: "brightness(1) saturate(1)", duration: 1.9, ease: "expo.out", clearProps: "filter" }, 0.1)
      .add(() => { p.el.classList.add("is-in"); p.play(); }, 0.2)
      .to(p.credit, { y: 0, duration: 0.9, ease: "expo.out" }, 0.9);

  gsap.timeline({ scrollTrigger: { trigger: stage, start: "top 72%", once: true } })
    .add(enter(people[0], true), 0)
    .add(enter(people[1], false), 0.8);

  // acompanha o mouse de leve
  if (finePointer) {
    people.forEach((p) => {
      const xTo = gsap.quickTo(p.media, "x", { duration: 0.9, ease: "power3.out" });
      const yTo = gsap.quickTo(p.media, "y", { duration: 0.9, ease: "power3.out" });
      p.el.addEventListener("pointermove", (e) => {
        const r = p.el.getBoundingClientRect();
        xTo(((e.clientX - r.left) / r.width - 0.5) * -14);
        yTo(((e.clientY - r.top) / r.height - 0.5) * -14);
      });
      p.el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }
}

function setupPerson(el) {
  const video = $("video", el);
  const photo = $(".person-photo", el);
  const src = video?.dataset.video?.trim();
  let hasVideo = false;

  if (src) {
    video.src = src;
    video.preload = "auto";
    video.addEventListener("loadeddata", () => { hasVideo = true; el.classList.add("has-video"); }, { once: true });
    video.addEventListener("error", () => video.remove(), { once: true });
  } else {
    video?.remove();
  }

  return {
    el,
    frame: $(".person-frame", el),
    credit: $$(".person-credit .ln > span", el),
    media: src ? [video, photo] : [photo],
    play() {
      if (!hasVideo) return;
      video.currentTime = 0;
      video.play().catch(() => {});
    },
  };
}
