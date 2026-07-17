/**
 * Utilitários compartilhados.
 */
import { gsap } from "./gsap.js";

/** Formata número no padrão brasileiro (1.234,56). */
export function formatNumber(value, decimals) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Anima um contador de 0 até `data-count`, respeitando os data-attributes:
 * `data-decimals`, `data-prefix`, `data-suffix`.
 */
export function animateCounter(el, { duration = 1.8, delay = 0 } = {}) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const state = { v: 0 };
  return gsap.to(state, {
    v: target,
    duration,
    delay,
    ease: "power3.out",
    onUpdate() {
      el.textContent = prefix + formatNumber(state.v, decimals) + suffix;
    },
  });
}
