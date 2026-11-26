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

  $$("input, select", form).forEach((f) =>
    f.addEventListener("input", () => f.closest(".field")?.classList.remove("is-invalid"))
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let valid = true;
    $$("input, select", form).forEach((f) => {
      const empty = !f.value || (f.tagName === "SELECT" && f.selectedIndex === 0);
      f.closest(".field")?.classList.toggle("is-invalid", empty);
      if (empty) valid = false;
    });
    if (!valid) {
      gsap.fromTo(form, { x: -10 }, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.3)", clearProps: "transform" });
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    const msg = [
      "Olá, Grupo Alvo!",
      "Quero crescer meu negócio.",
      "",
      "*Meus dados:*",
      `• Nome: ${data.nome}`,
      `• WhatsApp: ${data.whatsapp}`,
      `• Objetivo: ${data.objetivo}`,
      "",
      "Aguardo o contato!",
    ].join("\n");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");

    const label = $(".btn-label", form);
    if (label) {
      const original = label.textContent;
      label.textContent = "Abrindo o WhatsApp…";
      setTimeout(() => (label.textContent = original), 4000);
    }
  });
}
