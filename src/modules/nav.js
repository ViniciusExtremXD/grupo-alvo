/**
 * Navegação: troca de tema conforme a seção que está embaixo da barra
 * (escura / clara / violeta), some ao descer e volta ao subir, marca o link
 * da seção atual, menu mobile e âncoras com scroll suave.
 */
import { ScrollTrigger } from "./gsap.js";
import { $, $$ } from "./env.js";
import { lenis, scrollToTarget } from "./smooth-scroll.js";

export function initNav() {
  const nav = $("#nav");
  if (!nav) return;
  const burger = $("#navBurger");
  const menu = $("#mobileMenu");
  let theme = "dark";
  let menuOpen = false;

  const applyTheme = () => { nav.dataset.theme = menuOpen ? "dark" : theme; };

  // tema: a seção que cruza a linha do meio da barra manda
  const mid = () => `top ${Math.round(nav.offsetHeight / 2)}px`;
  $$("main > section[data-theme], footer[data-theme]").forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: mid,
      end: () => `bottom ${Math.round(nav.offsetHeight / 2)}px`,
      refreshPriority: -1, // calcula depois do pin dos sócios
      onToggle: (self) => {
        if (!self.isActive) return;
        theme = sec.dataset.theme;
        applyTheme();
      },
    });
  });

  // fundo ao rolar + esconder ao descer
  let last = 0;
  const onScroll = (y) => {
    nav.classList.toggle("is-scrolled", y > 40);
    if (!menuOpen) {
      if (y > 240 && y > last + 4) nav.classList.add("is-hidden");
      else if (y < last - 4) nav.classList.remove("is-hidden");
    }
    last = y;
  };
  if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });

  // WhatsApp flutuante some onde o CTA já está à vista: no hero e no final
  const floatWa = $("#floatWa");
  if (floatWa) {
    const away = { hero: true, end: false };
    const sync = () => floatWa.classList.toggle("is-away", away.hero || away.end);
    if ($("#topo")) {
      ScrollTrigger.create({
        trigger: "#topo", start: "top top", end: "bottom 35%",
        onToggle: (self) => { away.hero = self.isActive; sync(); },
      });
    }
    if ($("#contato")) {
      ScrollTrigger.create({
        trigger: "#contato", start: "top 70%", end: "bottom top",
        refreshPriority: -1,
        onToggle: (self) => { away.end = self.isActive; sync(); },
      });
    }
  }

  // link ativo
  $$("[data-navlink]", nav).forEach((link) => {
    const sec = $(`#${link.dataset.navlink}`);
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (self) => link.classList.toggle("is-active", self.isActive),
    });
  });

  // menu mobile
  const setMenu = (open) => {
    menuOpen = open;
    menu.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    menu.setAttribute("aria-hidden", String(!open));
    if (open) nav.classList.remove("is-hidden");
    applyTheme();
    open ? lenis?.stop() : lenis?.start();
  };
  burger?.addEventListener("click", () => setMenu(!menuOpen));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menuOpen) setMenu(false); });

  // âncoras internas
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      const target = href.length > 1 && $(href);
      if (!target) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      scrollToTarget(target);
    });
  });
}
