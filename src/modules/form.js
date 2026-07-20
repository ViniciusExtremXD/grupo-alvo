/**
 * Formulário de lead: valida os campos e monta uma mensagem pré-preenchida no
 * WhatsApp da agência (nenhum dado é enviado a servidores de terceiros).
 */
import { gsap } from "./gsap.js";
import { $, $$ } from "./env.js";
import { WHATSAPP_NUMBER } from "../config.js";

export function initForm() {
  const form = $("#leadForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let valid = true;
    $$("input, select", form).forEach((f) => {
      const empty = !f.value || (f.tagName === "SELECT" && f.selectedIndex === 0);
      f.classList.toggle("is-invalid", empty);
      if (empty) valid = false;
    });
    if (!valid) {
      gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.35)" });
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    const msg = [
      "Olá, Grupo Alvo!",
      "Quero lotar minha casa e escalar meu faturamento.",
      "",
      "*Meus dados:*",
      `• Nome: ${data.nome}`,
      `• E-mail: ${data.email}`,
      `• WhatsApp: ${data.whatsapp}`,
      `• Objetivo: ${data.objetivo}`,
      "",
      "Aguardo o contato!",
    ].join("\n");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");

    const label = $(".btn-label", $("button[type=submit]", form));
    if (label) {
      const original = label.textContent;
      label.textContent = "Recebido! Abrindo WhatsApp…";
      setTimeout(() => (label.textContent = original), 4000);
    }
  });
}
