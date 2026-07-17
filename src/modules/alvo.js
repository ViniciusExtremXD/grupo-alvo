/**
 * "No alvo" — o momento assinatura: a flecha dispara no alvo tematizado e, ao
 * cravar no centro, EXPLODE dinheiro. As cédulas voam, caem com gravidade e
 * ficam acumuladas na tela (não somem). Dispara uma vez ao entrar na seção.
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, reduceMotion } from "./env.js";

export function initAlvoHit() {
  const section = $("#alvoHit");
  if (!section) return;

  const canvas = $("#alvoMoney");
  const arrow = $("#alvoArrow");
  const target = $("#alvoTarget");
  const stage = $(".alvo-stage", section);

  // ---------- canvas de dinheiro ----------
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0;
  const bills = [];
  const GREENS = [
    ["#3fb765", "#0e5a30"],
    ["#54c47a", "#12613a"],
    ["#2ea45b", "#0b4a28"],
  ];

  function resize() {
    w = section.offsetWidth;
    h = section.offsetHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  function roundRect(x, y, rw, rh, r) {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, rw, rh, r); return; }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + rw, y, x + rw, y + rh, r);
    ctx.arcTo(x + rw, y + rh, x, y + rh, r);
    ctx.arcTo(x, y + rh, x, y, r);
    ctx.arcTo(x, y, x + rw, y, r);
    ctx.closePath();
  }

  function drawBill(m) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.rot);
    const bw = m.w, bh = m.h;
    ctx.fillStyle = m.c1;
    roundRect(-bw / 2, -bh / 2, bw, bh, 3); ctx.fill();
    ctx.strokeStyle = m.c2; ctx.lineWidth = 1;
    roundRect(-bw / 2 + 2.5, -bh / 2 + 2.5, bw - 5, bh - 5, 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, bh * 0.26, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = m.c2;
    ctx.font = `bold ${Math.round(bh * 0.42)}px sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 1);
    ctx.restore();
  }

  function spawnBurst(cx, cy) {
    const n = Math.min(70, Math.round(w / 17));
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.15;
      const spd = 7 + Math.random() * 11;
      const [c1, c2] = GREENS[i % GREENS.length];
      bills.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 3,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.32,
        w: 30 + Math.random() * 12,
        h: 16 + Math.random() * 6,
        c1, c2,
        settled: false,
        restY: h - 8 - Math.random() * 46,
      });
    }
  }

  let running = false;
  function tick() {
    ctx.clearRect(0, 0, w, h);
    let anyMoving = false;
    for (const m of bills) {
      if (!m.settled) {
        anyMoving = true;
        m.vy += 0.36;         // gravidade
        m.vx *= 0.992;
        m.x += m.vx;
        m.y += m.vy;
        m.rot += m.vrot;
        if (m.x < 10) { m.x = 10; m.vx *= -0.5; }
        if (m.x > w - 10) { m.x = w - 10; m.vx *= -0.5; }
        if (m.y >= m.restY) {   // pousa e fica
          m.y = m.restY;
          m.settled = true;
          m.vrot = 0;
          m.rot = (Math.random() - 0.5) * 0.5;
        }
      }
      drawBill(m);
    }
    // continua desenhando (as cédulas ficam na tela); só encerra o loop
    // depois que tudo assentou, mantendo o último frame renderizado.
    if (anyMoving) requestAnimationFrame(tick);
    else running = false;
  }
  function startLoop() { if (!running) { running = true; requestAnimationFrame(tick); } }

  // ---------- disparo ----------
  gsap.set(arrow, { xPercent: -100, yPercent: -50, opacity: 0 });

  function fire() {
    if (reduceMotion) {
      gsap.set(arrow, { x: 0, opacity: 1 });
      spawnBurst(w / 2, h * 0.44);
      // assenta imediato
      bills.forEach((b) => { b.y = b.restY; b.settled = true; });
      requestAnimationFrame(tick);
      return;
    }
    const tl = gsap.timeline();
    tl.set(arrow, { opacity: 1 })
      .fromTo(arrow, { x: -Math.min(760, w * 0.7) }, { x: 0, duration: 0.46, ease: "power3.in" })
      .to(target, { scale: 1.16, duration: 0.12, ease: "expo.out", transformOrigin: "50% 50%" })
      .to(target, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" })
      .add(() => {
        const r = stage.getBoundingClientRect();
        const s = section.getBoundingClientRect();
        spawnBurst(r.left - s.left + r.width / 2, r.top - s.top + r.height / 2);
        startLoop();
      }, "-=0.5")
      // tremidinha da cena no impacto
      .fromTo(stage, { x: 0 }, { x: 6, duration: 0.06, repeat: 5, yoyo: true, ease: "none" }, "<");
  }

  ScrollTrigger.create({
    trigger: section,
    start: "top 62%",
    once: true,
    onEnter: fire,
  });
}
