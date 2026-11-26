/**
 * Sócios — a cena. No desktop a seção fica presa na tela enquanto você rola:
 * o Felipe entra pela esquerda, depois o Gabriel pela direita (a "luz acende"
 * neles). No celular, cada um entra quando chega na tela.
 *
 * Vídeo: se o <video> tiver data-video preenchido (ex.: "assets/felipe.mp4"),
 * ele toca no momento da entrada no lugar da foto. Sem vídeo, usa a foto.
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";

export function initFounders() {
  const stage = $("#foundersStage");
  if (!stage) return;
  const people = $$("[data-person]", stage).map(setupPerson);

  if (reduceMotion) return;

  const enter = (p, fromLeft) => {
    const tl = gsap.timeline();
    tl.fromTo(p.frame,
      { clipPath: fromLeft ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power3.inOut" }, 0)
      .fromTo(p.media,
        { xPercent: fromLeft ? -14 : 14, scale: 1.28, filter: "brightness(0.12) contrast(1.2)" },
        { xPercent: 0, scale: 1, filter: "brightness(1) contrast(1)", duration: 1.5, ease: "power2.out" }, 0)
      .add(() => p.play(), 0.05)
      .to(p.credit, { y: 0, duration: 0.8, stagger: 0.08, ease: "expo.out" }, 0.75);
    return tl;
  };

  const mm = gsap.matchMedia();

  // desktop: cena presa, rolagem conduz as entradas
  mm.add("(min-width: 1081px)", () => {
    gsap.timeline({
      scrollTrigger: { trigger: stage, start: "top top", end: "+=130%", pin: true, scrub: 0.8, anticipatePin: 1 },
    })
      .add(enter(people[0], true), 0)
      .add(enter(people[1], false), 0.9)
      .to({}, { duration: 0.5 });
  });

  // tablet/celular: cada um entra ao aparecer
  mm.add("(max-width: 1080px)", () => {
    people.forEach((p, i) => {
      gsap.timeline({ scrollTrigger: { trigger: p.el, start: "top 78%", once: true } }).add(enter(p, i === 0));
    });
  });
}

function setupPerson(el) {
  const frame = $(".person-frame", el);
  const video = $("video", el);
  const photo = $(".person-photo", el);
  const credit = $$(".person-credit .ln > span", el);
  let hasVideo = false;

  const src = video?.dataset.video?.trim();
  if (src) {
    video.src = src;
    video.preload = "auto";
    video.addEventListener("loadeddata", () => {
      hasVideo = true;
      el.classList.add("has-video");
    }, { once: true });
    video.addEventListener("error", () => video.remove(), { once: true });
  } else {
    video?.remove();
  }

  return {
    el,
    frame,
    credit,
    // foto e vídeo recebem a mesma entrada (o vídeo cobre a foto quando carrega)
    media: src ? [video, photo] : [photo],
    play() {
      if (!hasVideo) return;
      video.currentTime = 0;
      video.play().catch(() => {});
    },
  };
}
