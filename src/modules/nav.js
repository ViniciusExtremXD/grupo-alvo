/**
 * Navegação: barra de progresso do scroll, esconder a nav ao descer, marcar o
 * link ativo por seção, menu mobile e âncoras com scroll suave.
 */
import { ScrollTrigger } from "./gsap.js";
import { $, $$ } from "./env.js";
import { lenis, scrollToTarget } from "./smooth-scroll.js";

export function initNav() {
  const nav = $("#nav");
  const progressBar = $("#scrollProgress");
  let lastScroll = 0;

  function onScroll(scrollY) {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.transform = `scaleX(${Math.min(scrollY / max, 1)})`;
    if (scrollY > 60) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
    if (scrollY > 160 && scrollY > lastScroll + 4) nav.classList.add("is-hidden");
    else if (scrollY < lastScroll - 4) nav.classList.remove("is-hidden");
    lastScroll = scrollY;
  }
  if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });

  // link ativo conforme a seção visível
  ["servicos", "metodo", "resultados", "contato"].forEach((id) => {
    if (!$(`#${id}`)) return;
    ScrollTrigger.create({
      trigger: `#${id}`,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (self) => {
        $(`[data-navlink="${id}"]`)?.classList.toggle("is-active", self.isActive);
      },
    });
  });

  // menu mobile (burger)
  const burger = $("#navBurger");
  const mobileMenu = $("#mobileMenu");
  function closeMobileMenu() {
    mobileMenu.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    lenis?.start();
  }
  burger?.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
    open ? lenis?.stop() : lenis?.start();
  });

  // âncoras internas: fecham o menu e rolam suave até a seção
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (href.length > 1 && $(href)) {
        e.preventDefault();
        if (mobileMenu?.classList.contains("is-open")) closeMobileMenu();
        scrollToTarget(href);
      }
    });
  });
}
