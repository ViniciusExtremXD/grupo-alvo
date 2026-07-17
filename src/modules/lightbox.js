/**
 * Lightbox: clique num print de resultado abre a imagem em tela cheia, pra dar
 * pra ler o que está escrito. Ignora o clique quando foi arraste do carrossel.
 */
import { $, $$ } from "./env.js";
import { lenis } from "./smooth-scroll.js";

export function initLightbox() {
  const box = $("#lightbox");
  if (!box) return;
  const img = $("#lightboxImg");

  const open = (src, alt) => {
    img.src = src;
    img.alt = alt || "";
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    lenis?.stop();
  };
  const close = () => {
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    lenis?.start();
  };

  $$("[data-lightbox]").forEach((el) => {
    let sx = 0, sy = 0;
    el.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
    el.addEventListener("pointerup", (e) => {
      // se moveu mais que 8px, foi arraste do carrossel — não abre
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 8) return;
      const pic = el.querySelector("img");
      open(pic?.src || el.dataset.lightbox, pic?.alt);
    });
  });

  box.addEventListener("click", (e) => {
    if (e.target === box || e.target.closest(".lightbox-close")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && box.classList.contains("is-open")) close();
  });
}
