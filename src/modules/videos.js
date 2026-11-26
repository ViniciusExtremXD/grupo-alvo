/**
 * Depoimentos em vídeo.
 *  - Prévia: com MP4 (data-video), o vídeo toca sozinho, sem som e em loop,
 *    enquanto o card está na tela. Sem MP4, a capa ganha um zoom lento.
 *  - Clique: abre em tela cheia — o MP4 com som, ou o reel do Instagram.
 */
import { $, $$, reduceMotion } from "./env.js";
import { lenis } from "./smooth-scroll.js";

export function initVideos() {
  const cards = $$(".vcard");
  if (!cards.length) return;

  // ---------- prévia na tela ----------
  cards.forEach((card) => {
    const src = card.dataset.video?.trim();
    if (!src || reduceMotion) return;
    const v = document.createElement("video");
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
    v.setAttribute("aria-hidden", "true");
    v.src = src;
    v.addEventListener("playing", () => card.classList.add("is-playing"));
    $(".vcard-media", card).appendChild(v);
    card._preview = v;
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const card = e.target;
      card.classList.toggle("in-view", e.isIntersecting);
      const v = card._preview;
      if (!v) return;
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
  }, { threshold: 0.35 });
  cards.forEach((c) => io.observe(c));

  // ---------- player em tela cheia ----------
  const player = $("#player");
  const frame = $("#playerFrame");
  if (!player || !frame) return;
  let lastFocus = null;

  function open(card) {
    lastFocus = card;
    frame.innerHTML = "";
    const file = card.dataset.video?.trim();
    if (file) {
      const v = document.createElement("video");
      v.src = file; v.controls = true; v.autoplay = true; v.playsInline = true;
      frame.appendChild(v);
    } else if (card.dataset.ig) {
      const f = document.createElement("iframe");
      f.src = `https://www.instagram.com/reel/${card.dataset.ig}/embed/`;
      f.title = card.querySelector(".vcard-title")?.textContent || "Vídeo";
      f.allow = "autoplay; encrypted-media; picture-in-picture";
      frame.appendChild(f);
    }
    cards.forEach((c) => c._preview?.pause());
    player.classList.add("is-open");
    player.setAttribute("aria-hidden", "false");
    lenis?.stop();
    $(".player-close", player)?.focus({ preventScroll: true });
  }

  function close() {
    player.classList.remove("is-open");
    player.setAttribute("aria-hidden", "true");
    lenis?.start();
    frame.querySelector("video")?.pause();
    setTimeout(() => { if (!player.classList.contains("is-open")) frame.innerHTML = ""; }, 500);
    cards.forEach((c) => { if (c.classList.contains("in-view")) c._preview?.play().catch(() => {}); });
    lastFocus?.focus?.({ preventScroll: true });
  }

  cards.forEach((card) => card.addEventListener("click", () => open(card)));
  player.addEventListener("click", (e) => {
    if (e.target === player || e.target.closest(".player-close")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && player.classList.contains("is-open")) close();
  });
}
