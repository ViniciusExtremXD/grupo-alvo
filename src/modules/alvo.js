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
    
    // Rotação 3D (pitch) simulando queda de papel
    const scaleY = Math.abs(Math.sin(m.pitch || Math.PI / 2));
    ctx.scale(1, scaleY);
    
    const bw = m.w, bh = m.h;

    // Sombra rápida projetada (deslocada para baixo)
    ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
    roundRect(-bw / 2 + 1, -bh / 2 + 2, bw, bh, 3);
    ctx.fill();

    // Corpo da nota
    ctx.fillStyle = m.c1;
    roundRect(-bw / 2, -bh / 2, bw, bh, 3);
    ctx.fill();
    
    // Bordas e detalhes da nota
    ctx.strokeStyle = m.c2;
    ctx.lineWidth = 0.8;
    roundRect(-bw / 2 + 2, -bh / 2 + 2, bw - 4, bh - 4, 2);
    ctx.stroke();
    
    // Círculo central
    ctx.beginPath();
    ctx.ellipse(0, 0, bw * 0.2, bh * 0.26, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Símbolo do faturamento ($)
    ctx.fillStyle = m.c2;
    ctx.font = `bold ${Math.round(bh * 0.38)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 0.5);
    
    ctx.restore();
  }

  function spawnBurst(cx, cy) {
    const n = Math.min(70, Math.round(w / 17));
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.15;
      const spd = 6 + Math.random() * 10;
      const [c1, c2] = GREENS[i % GREENS.length];
      bills.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 2,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.16,
        pitch: Math.random() * Math.PI * 2,
        vpitch: (Math.random() - 0.5) * 0.28,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.04 + Math.random() * 0.05,
        swayAmp: 0.15 + Math.random() * 0.2,
        w: 32 + Math.random() * 10,
        h: 17 + Math.random() * 5,
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
        m.vy += 0.22;         // Gravidade menor para efeito de flutuação
        m.vx *= 0.95;         // Atrito horizontal
        m.vy *= 0.97;         // Atrito vertical (resistência do ar)
        m.x += m.vx;
        
        // Balanço senoidal lateral (simulando vento)
        m.swayPhase += m.swaySpeed;
        m.x += Math.sin(m.swayPhase) * m.swayAmp;
        
        m.y += m.vy;
        
        // Rotação Z e Pitch 3D
        m.rot += m.vrot;
        m.pitch += m.vpitch;
        m.vpitch *= 0.98;
        
        if (m.x < 10) { m.x = 10; m.vx *= -0.5; }
        if (m.x > w - 10) { m.x = w - 10; m.vx *= -0.5; }
        
        // Pouso suave no rodapé da seção
        if (m.y >= m.restY) {
          m.y = m.restY;
          m.settled = true;
          m.vx = 0;
          m.vy = 0;
          m.vrot = 0;
          m.vpitch = 0;
          m.rot = (Math.random() - 0.5) * 0.3; // Deita levemente inclinado
          m.pitch = Math.PI / 2; // Lie flat (scaleY = 1)
        }
      }
      drawBill(m);
    }
    if (anyMoving) requestAnimationFrame(tick);
    else running = false;
  }
  function startLoop() { if (!running) { running = true; requestAnimationFrame(tick); } }

  // ---------- disparo ----------
  gsap.set(arrow, { xPercent: -100, yPercent: -50, opacity: 0, transformOrigin: "100% 50%" });
  gsap.set("#alvoShockwave", { scale: 0.8, opacity: 0, transformOrigin: "50% 50%" });

  function fire() {
    if (reduceMotion) {
      gsap.set(arrow, { x: 0, opacity: 1 });
      spawnBurst(w / 2, h * 0.44);
      bills.forEach((b) => { b.y = b.restY; b.settled = true; });
      requestAnimationFrame(tick);
      return;
    }
    const tl = gsap.timeline();
    tl.set(arrow, { opacity: 1 })
      .fromTo(arrow, { x: -Math.min(760, w * 0.7) }, { x: 0, duration: 0.46, ease: "power3.in" })
      // Disparo da onda de choque no impacto
      .fromTo("#alvoShockwave", { scale: 0.8, opacity: 1 }, { scale: 4.5, opacity: 0, duration: 0.65, ease: "power2.out" }, "<")
      // Infla o alvo
      .to(target, { scale: 1.15, duration: 0.12, ease: "expo.out", transformOrigin: "50% 50%" }, "<")
      // Flecha vibra no centro do alvo (decaimento rápido)
      .fromTo(arrow, { rotation: -6 }, { rotation: 6, duration: 0.05, repeat: 7, yoyo: true, ease: "sine.inOut" }, "<")
      .to(arrow, { rotation: 0, duration: 0.18, ease: "power2.out" })
      // Retorno elástico do alvo
      .to(target, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" }, "<")
      .add(() => {
        const r = stage.getBoundingClientRect();
        const s = section.getBoundingClientRect();
        spawnBurst(r.left - s.left + r.width / 2, r.top - s.top + r.height / 2);
        startLoop();
      }, "-=0.42")
      // Leve tremor na cena
      .fromTo(stage, { x: 0 }, { x: 5, duration: 0.05, repeat: 4, yoyo: true, ease: "none" }, "<");
  }

  // Idle da ring tracejada no alvo de simulação
  if (!reduceMotion) {
    gsap.to("#alvoTargetRingDashed", { rotation: 360, duration: 22, ease: "none", repeat: -1, svgOrigin: "120 120" });
  }

  ScrollTrigger.create({
    trigger: section,
    start: "top 62%",
    once: true,
    onEnter: fire,
  });
}
