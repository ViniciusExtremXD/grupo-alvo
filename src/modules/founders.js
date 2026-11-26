/**
 * Sócios: cada foto "sobe" por uma máscara e a imagem desinfla o zoom, com a
 * luz acendendo. Se o <video> tiver data-video preenchido (ex.:
 * "assets/felipe.mp4"), ele toca no momento da entrada no lugar da foto.
 */
import { gsap } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";

export function initFounders() {
  const stage = $("#foundersStage");
  if (!stage) return;
  const people = $$("[data-person]", stage).map(setupPerson);
  if (reduceMotion) return;

  people.forEach((p, i) => {
    gsap.timeline({
      delay: i * 0.15,
      scrollTrigger: { trigger: p.el, start: "top 85%", once: true },
    })
      .fromTo(p.frame, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.inOut" }, 0)
      .fromTo(p.media,
        { scale: 1.3, filter: "brightness(0.2)" },
        { scale: 1, filter: "brightness(1)", duration: 1.6, ease: "expo.out", clearProps: "filter" }, 0.1)
      .add(() => p.play(), 0.1)
      .to(p.credit, { y: 0, duration: 0.8, ease: "expo.out" }, 0.8);
  });
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
