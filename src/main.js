/**
 * Grupo Alvo — ponto de entrada.
 *
 * Cada módulo em `modules/` cuida de uma parte da página e expõe uma função
 * `init…()`. Aqui só orquestramos a ordem.
 */
import "./styles/main.css";

// avisa o guarda do <head> que o JS carregou (senão ele mostra tudo sem animação)
window.__alvoReady = true;

import { initScrollTop } from "./modules/smooth-scroll.js";
import { initHero } from "./modules/hero.js";
import { initNav } from "./modules/nav.js";
import { initReveals } from "./modules/reveals.js";
import { initResults } from "./modules/results.js";
import { initVideos } from "./modules/videos.js";
import { initFounders } from "./modules/founders.js";
import { initLightbox } from "./modules/lightbox.js";
import { initMethod } from "./modules/method.js";
import { initForm } from "./modules/form.js";
import { initFaq } from "./modules/faq.js";
import { initContact } from "./modules/contact.js";

initScrollTop();
initLightbox();
initHero();
initResults();
initVideos();
initFounders();
initNav();
initReveals();
initMethod();
initContact();
initForm();
initFaq();
