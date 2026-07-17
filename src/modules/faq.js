/**
 * FAQ: acordeão que mantém apenas um item aberto por vez.
 */
import { $, $$ } from "./env.js";

export function initFaq() {
  $$(".faq-item").forEach((item) => {
    const btn = $(".faq-q", item);
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      $$(".faq-item.is-open").forEach((other) => {
        other.classList.remove("is-open");
        $(".faq-q", other).setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}
