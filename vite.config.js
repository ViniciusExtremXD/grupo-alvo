import { defineConfig } from "vite";

// base: "./" gera caminhos relativos no build — assim o site funciona tanto
// na raiz de um domínio (Netlify/Vercel) quanto em subpasta (GitHub Pages).
export default defineConfig({
  base: "./",
});
