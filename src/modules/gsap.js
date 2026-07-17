/**
 * Instância única do GSAP com o plugin ScrollTrigger registrado.
 * Todos os módulos importam daqui para compartilhar o mesmo registro.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
