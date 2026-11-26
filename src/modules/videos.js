/**
 * Depoimentos em vídeo: cada card abre um player em tela cheia.
 * Prioridade: arquivo próprio (data-video, ex.: "assets/videos/rodrigo.mp4");
 * sem arquivo, toca o reel do Instagram (data-ig = código do reel).
 * O iframe/vídeo só é criado no clique — a página não carrega nada do
 * Instagram antes disso.
 */
import { $, $$ } from "./env.js";
import { lenis } from "./smooth-scroll.js";

export function initVideos() {
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
      v.src = file;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      frame.appendChild(v);
    } else if (card.dataset.ig) {
      const f = document.createElement("iframe");
      f.src = `https://www.instagram.com/reel/${card.dataset.ig}/embed/`;
      f.title = card.querySelector(".vcard-title")?.textContent || "Vídeo";
      f.allow = "autoplay; encrypted-media; picture-in-picture";
      f.loading = "lazy";
      frame.appendChild(f);
    }
    player.classList.add("is-open");
    player.setAttribute("aria-hidden", "false");
    lenis?.stop();
    $(".player-close", player)?.focus({ preventScroll: true });
  }

  function close() {
    player.classList.remove("is-open");
    player.setAttribute("aria-hidden", "true");
    lenis?.start();
    // tira o vídeo depois do fade (para o áudio na hora)
    const media = frame.querySelector("video");
    media?.pause();
    setTimeout(() => { if (!player.classList.contains("is-open")) frame.innerHTML = ""; }, 450);
    lastFocus?.focus?.({ preventScroll: true });
  }

  $$(".vcard").forEach((card) => card.addEventListener("click", () => open(card)));
  player.addEventListener("click", (e) => {
    if (e.target === player || e.target.closest(".player-close")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && player.classList.contains("is-open")) close();
  });
}
