/**
 * Instância única do GSAP com os plugins registrados (ScrollTrigger e
 * MotionPath, usado pela flecha que voa pelas trajetórias).
 * Todos os módulos importam daqui para compartilhar o mesmo registro.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export { gsap, ScrollTrigger };
