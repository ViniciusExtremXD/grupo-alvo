/**
 * Ambiente de execução + helpers de seleção usados por todos os módulos.
 */

/** querySelector curto. */
export const $ = (selector, ctx = document) => ctx.querySelector(selector);

/** querySelectorAll como array. */
export const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/**
 * Motion LIGADO por padrão (decisão do cliente — o site deve "acertar o alvo"
 * em qualquer máquina, mesmo com "reduzir movimento" ativo no sistema).
 * Override manual: `?motion=0` força a versão estática (teste / acessibilidade).
 */
const motionParam = new URLSearchParams(location.search).get("motion");
export const reduceMotion = motionParam === "0";

/** Ponteiro fino com hover (mouse/trackpad) — libera cursor custom, ímã e tilt. */
export const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

document.documentElement.classList.toggle("reduced-motion", reduceMotion);
