/**
 * Revelações no scroll: split de títulos palavra a palavra, parallax de mídia,
 * contadores de números e entradas suaves das seções (dor, serviços, para
 * quem, quem somos, finale).
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";
import { animateCounter } from "./utils.js";

export function initReveals() {
  initSplitTitles();
  initParallax();
  initStats();
  initSectionReveals();
  initFinale();
}

/**
 * Quebra os títulos [data-split] em palavras e sobe cada uma com máscara.
 * Respeita quebras de linha explícitas via <br> no HTML — cada linha vira um
 * bloco, então o controle de onde a linha quebra é do conteúdo, não do wrap.
 */
function initSplitTitles() {
  $$("[data-split]").forEach((el) => {
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = lines
      .map((line) => {
        const words = line
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((word) => `<span class="w"><span class="wi">${word}</span></span>`)
          .join(" ");
        return `<span class="tline">${words}</span>`;
      })
      .join("");
    if (reduceMotion) return;
    gsap.from($$(".wi", el), {
      yPercent: 118,
      duration: 1,
      stagger: 0.05,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });
}

/** Mídia marcada com [data-parallax] desliza no eixo Y conforme o scroll. */
function initParallax() {
  if (reduceMotion) return;
  $$("[data-parallax]").forEach((el) => {
    const strength = parseFloat(el.dataset.parallax);
    gsap.to(el, {
      yPercent: strength,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
}

/** Contadores dos números-chave (projetos, ROI, anos, comprometimento). */
function initStats() {
  $$("[data-count-group]").forEach((group) => {
    ScrollTrigger.create({
      trigger: group,
      start: "top 80%",
      once: true,
      onEnter: () => {
        $$("[data-count]", group).forEach((el, i) =>
          animateCounter(el, { duration: 2.1, delay: i * 0.12 })
        );
      },
    });
  });
}

/** Entradas suaves de cards em grades diversas. */
function initSectionReveals() {
  if (reduceMotion) return;
  $$("[data-reveal-group]").forEach((group) => {
    const items = $$("[data-reveal]", group);
    gsap.from(items, {
      opacity: 0, y: 52, stagger: 0.1, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: group, start: "top 82%", once: true },
    });
  });
}

/**
 * Título da seção final: efeito de máquina de escrever, letra por letra,
 * terminando com um cursor "|" piscando (persiste depois de digitado).
 */
function initFinale() {
  // processa CADA linha isoladamente (não o título inteiro) — assim os nós
  // de texto só-espaço/quebra entre os `<span class="line">` (formatação do
  // HTML) nunca entram na contagem de caracteres da digitação.
  const lineInners = $$(".finale-title .line-inner");
  const chars = lineInners.flatMap((line) => splitIntoChars(line));
  const cursor = document.createElement("span");
  cursor.className = "typewriter-cursor";
  cursor.textContent = "|";
  if (chars.length) chars[chars.length - 1].after(cursor);

  if (reduceMotion) {
    gsap.set(chars, { opacity: 1 });
    cursor.classList.add("is-blinking");
  } else {
    gsap.set(chars, { opacity: 0 });
    ScrollTrigger.create({
      trigger: ".finale",
      start: "top 70%",
      once: true,
      onEnter: () => {
        gsap.to(chars, {
          opacity: 1,
          duration: 0.01,
          stagger: 0.032,
          ease: "none",
          onComplete: () => cursor.classList.add("is-blinking"),
        });
      },
    });
  }

  if (reduceMotion) return;
  gsap.from([".finale-sub", ".finale .btn"], {
    opacity: 0, y: 30, stagger: 0.12, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".finale", start: "top 60%", once: true },
  });
}

/**
 * Envolve cada caractere de `el` num <span class="char"> e devolve os spans
 * em ordem de leitura — base para o efeito de máquina de escrever.
 *
 * Palavras com gradiente (`.brand-text`, que usa `background-clip: text`)
 * são a exceção: esse recorte é pintado a partir do elemento que tem a
 * classe, usando a forma de TODO o texto dentro dele — um span-filho com
 * opacity:0 não impede o gradiente do pai de aparecer "atrás" da letra
 * escondida. Por isso essas palavras não são quebradas em letras; entram
 * na sequência como uma unidade só, com a opacidade no próprio elemento
 * que já tem o recorte do gradiente (sem pai/filho conflitando).
 */
function splitIntoChars(el) {
  const units = [];
  function walk(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        [...child.textContent].forEach((ch) => {
          const span = document.createElement("span");
          span.className = "char";
          span.textContent = ch;
          frag.appendChild(span);
          units.push(span);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.classList.contains("brand-text")) {
          units.push(child);
        } else {
          walk(child);
        }
      }
    });
  }
  walk(el);
  return units;
}
