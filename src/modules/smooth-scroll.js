/**
 * Smooth scroll (Lenis) integrado ao ticker do GSAP, além do controle de
 * "sempre iniciar no topo" ao carregar/recarregar a página.
 */
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, reduceMotion } from "./env.js";

/**
 * Instância do Lenis (ou `null` quando o motion está desligado).
 * Export mutável: outros módulos leem `lenis` dentro de handlers, já criado.
 */
export let lenis = null;

if (!reduceMotion) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.scrollTo(0, { immediate: true }); // garante topo mesmo com o smooth scroll
}

/** Rola suavemente até um elemento (ou seletor), com respiro para a nav. */
export function scrollToTarget(target) {
  const el = typeof target === "string" ? $(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -74, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
}

/** Força o topo imediatamente (window + Lenis). */
export function forceTop() {
  window.scrollTo(0, 0);
  lenis?.scrollTo(0, { immediate: true, force: true });
}

/**
 * Garante que o site sempre comece no topo. Desativa a restauração automática
 * de scroll do navegador e reforça o topo em vários momentos, pois alguns
 * navegadores restauram a posição de forma assíncrona mesmo após o `load`.
 */
export function initScrollTop() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  forceTop();
  document.addEventListener("DOMContentLoaded", forceTop);
  window.addEventListener("load", () => {
    forceTop();
    requestAnimationFrame(forceTop);
    setTimeout(forceTop, 80);
    ScrollTrigger.refresh();
  });
}
