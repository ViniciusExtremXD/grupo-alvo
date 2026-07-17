/**
 * Grupo Alvo — ponto de entrada.
 *
 * Cada módulo em `modules/` cuida de uma responsabilidade e expõe uma função
 * `init…()`. Aqui apenas orquestramos a ordem de inicialização.
 */
import "./styles/main.css";

import { initScrollTop } from "./modules/smooth-scroll.js";
import { initHero } from "./modules/hero.js";
import { initPreloader } from "./modules/preloader.js";
import { initPointer } from "./modules/pointer.js";
import { initNav } from "./modules/nav.js";
import { initFillword } from "./modules/fillword.js";
import { initReveals } from "./modules/reveals.js";
import { initAlvoHit } from "./modules/alvo.js";
import { initResults } from "./modules/results.js";
import { initLightbox } from "./modules/lightbox.js";
import { initMethod } from "./modules/method.js";
import { initForm } from "./modules/form.js";
import { initFaq } from "./modules/faq.js";

// Sempre começar no topo (antes de qualquer restauração do navegador).
initScrollTop();

// Hero é montado primeiro: sua timeline (pausada) é entregue ao preloader,
// que a dispara assim que o carregamento termina.
const heroIntro = initHero();
initPreloader(heroIntro);

// Interações e seções.
initPointer();
initNav();
initFillword();
initReveals();
initAlvoHit();
initResults();
initLightbox();
initMethod();
initForm();
initFaq();
