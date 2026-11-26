/**
 * Lightbox: mostra um print em tela cheia pra dar pra ler os números.
 */
import { $ } from "./env.js";
import { lenis } from "./smooth-scroll.js";

let box, img, lastFocus;

export function openLightbox(src, alt = "") {
  if (!box || !src) return;
  lastFocus = document.activeElement;
  img.src = src;
  img.alt = alt;
  box.classList.add("is-open");
  box.setAttribute("aria-hidden", "false");
  lenis?.stop();
  $(".lightbox-close", box)?.focus({ preventScroll: true });
}

function close() {
  box.classList.remove("is-open");
  box.setAttribute("aria-hidden", "true");
  lenis?.start();
  lastFocus?.focus?.({ preventScroll: true });
}

export function initLightbox() {
  box = $("#lightbox");
  if (!box) return;
  img = $("#lightboxImg");
  box.addEventListener("click", (e) => {
    if (e.target === box || e.target.closest(".lightbox-close")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && box.classList.contains("is-open")) close();
  });
}
