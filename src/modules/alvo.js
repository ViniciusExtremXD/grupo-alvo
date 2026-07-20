/**
 * "No alvo" — o momento assinatura, em três atos:
 *  1. Arco (esquerda) e alvo (direita) bem separados — a flecha nocada
 *     puxa a corda e dispara, cravando exatamente no centro do alvo.
 *  2. Impacto: o arco some, dinheiro explode, e o alvo (com a flecha
 *     cravada) cresce e desliza até o centro da tela.
 *  3. Com o alvo centralizado, o texto de apoio e o título "NO ALVO."
 *     sobem em cena.
 * Dispara uma vez ao entrar na seção.
 */
import { gsap, ScrollTrigger } from "./gsap.js";
import { $, $$, reduceMotion } from "./env.js";

export function initAlvoHit() {
  const section = $("#alvoHit");
  if (!section) return;

  const canvas = $("#alvoMoney");
  const stage = $("#alvoStage");
  const bowWrap = $("#alvoBowWrap");
  const arrow = $("#alvoArrow");
  const stringTop = $("#bowStringTop");
  const stringBottom = $("#bowStringBottom");
  const targetWrap = $("#alvoTargetWrap");
  const target = $("#alvoTarget");
  const lead = $(".alvo-lead", section);
  const wordUnits = $$(".alvo-word .wi", section);

  // ---------- canvas de dinheiro ----------
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0;
  const bills = [];
  const BILL_COLORS = [
    ["#3fb765", "#0e5a30"],
    ["#54c47a", "#12613a"],
    ["#2ea45b", "#0b4a28"],
    ["#f1c40f", "#7d6608"],
    ["#f39c12", "#7e5109"],
    ["#f5b041", "#9a7d0a"],
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
    const scaleY = Math.abs(Math.sin(m.pitch || Math.PI / 2));
    ctx.scale(1, scaleY);
    const bw = m.w, bh = m.h;

    ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
    roundRect(-bw / 2 + 1, -bh / 2 + 2, bw, bh, 3);
    ctx.fill();

    ctx.fillStyle = m.c1;
    roundRect(-bw / 2, -bh / 2, bw, bh, 3);
    ctx.fill();

    ctx.strokeStyle = m.c2;
    ctx.lineWidth = 0.8;
    roundRect(-bw / 2 + 2, -bh / 2 + 2, bw - 4, bh - 4, 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 0, bw * 0.2, bh * 0.26, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = m.c2;
    ctx.font = `bold ${Math.round(bh * 0.38)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 0.5);

    ctx.restore();
  }

  function spawnBurst(cx, cy) {
    const n = Math.min(75, Math.round(w / 16));
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.15;
      const spd = 2 + Math.random() * 11;
      const [c1, c2] = BILL_COLORS[i % BILL_COLORS.length];
      bills.push({
        x: cx + (Math.random() - 0.5) * 16,
        y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 2,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.16,
        pitch: Math.random() * Math.PI * 2,
        vpitch: (Math.random() - 0.5) * 0.28,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.03 + Math.random() * 0.04,
        swayAmp: 0.12 + Math.random() * 0.18,
        w: 38 + Math.random() * 10,
        h: 15 + Math.random() * 4,
        c1, c2,
        settled: false,
        restY: h - 10 - Math.random() * 42,
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
        m.vy += 0.20;
        m.vx *= 0.985;
        m.vy *= 0.98;
        m.vx += (Math.random() - 0.5) * 0.08;
        m.x += m.vx;
        m.swayPhase += m.swaySpeed;
        m.x += Math.sin(m.swayPhase) * m.swayAmp;
        m.y += m.vy;
        m.rot += m.vrot;
        m.pitch += m.vpitch;
        m.vpitch *= 0.985;
        if (m.x < 10) { m.x = 10; m.vx *= -0.5; }
        if (m.x > w - 10) { m.x = w - 10; m.vx *= -0.5; }
        if (m.y >= m.restY) {
          m.y = m.restY;
          m.settled = true;
          m.vx = 0; m.vy = 0; m.vrot = 0; m.vpitch = 0;
          m.rot = (Math.random() - 0.5) * 0.35;
          m.pitch = Math.PI / 2;
        }
      }
      drawBill(m);
    }
    if (anyMoving) requestAnimationFrame(tick);
    else running = false;
  }
  function startLoop() { if (!running) { running = true; requestAnimationFrame(tick); } }

  function resetState() {
    gsap.set([arrow, bowWrap, targetWrap, lead, wordUnits, ".alvo-hud-bracket", "#alvoShockwave", "#alvoLockRing", "#alvoCoreDot", target, stringTop, stringBottom, stage], { clearProps: "all" });
    gsap.set("#alvoShockwave", { scale: 0.8, opacity: 0, transformOrigin: "50% 50%" });
    gsap.set(".alvo-hud-tl", { x: -35, y: -35, opacity: 0 });
    gsap.set(".alvo-hud-tr", { x: 35, y: -35, opacity: 0 });
    gsap.set(".alvo-hud-bl", { x: -35, y: 35, opacity: 0 });
    gsap.set(".alvo-hud-br", { x: 35, y: 35, opacity: 0 });
    gsap.set("#alvoLockRing", { scale: 1.8, opacity: 0, transformOrigin: "50% 50%" });
    gsap.set("#alvoCoreDot", { scale: 0.8, transformOrigin: "50% 50%" });
    gsap.set(arrow, { opacity: 0 });
    gsap.set(bowWrap, { opacity: 0 });
    gsap.set([stringTop, stringBottom], { attr: { x2: 38 } });
    gsap.set(lead, { opacity: 0, y: 18 });
    gsap.set(wordUnits, { yPercent: 120 });
    bills.forEach(b => { b.settled = true; b.y = 9999; });
  }

  // Initial state setup
  resetState();

  /**
   * Mede o layout no instante do disparo (depois que tudo já assentou) e
   * devolve as posições, em pixels relativos ao `#alvoStage`, que a flecha
   * precisa assumir: nocada junto ao arco, puxada pra trás, e cravada bem
   * no centro do núcleo do alvo.
   */
  function measure() {
    const stageRect = stage.getBoundingClientRect();
    const bowRect = bowWrap.getBoundingClientRect();
    const targetRect = targetWrap.getBoundingClientRect();
    const arrowRect = arrow.getBoundingClientRect();
    const arrowW = arrowRect.width;
    // usa a altura REAL renderizada (não uma suposição pela proporção do
    // viewBox) — qualquer arredondamento entre as duas gera um desvio
    // vertical que cresce junto com a escala no recentro.
    const arrowH = arrowRect.height;
    const tipFrac = 210 / 210; // posição da ponta dentro do viewBox da flecha

    const centerY = (targetRect.top + targetRect.bottom) / 2 - stageRect.top - arrowH / 2;
    const restLeft = bowRect.right - stageRect.left - arrowW * (10 / 210);
    const targetCenterX = (targetRect.left + targetRect.right) / 2 - stageRect.left;
    const releaseLeft = targetCenterX - arrowW * tipFrac;
    const travel = releaseLeft - restLeft;

    const targetCenterInStage = (targetRect.left + targetRect.right) / 2 - stageRect.left;
    const stageCenter = stageRect.width / 2;
    const recenterDelta = stageCenter - targetCenterInStage;

    return {
      top: centerY,
      restLeft,
      drawLeft: restLeft - Math.max(40, travel * 0.28),
      releaseLeft,
      recenterDelta,
    };
  }

  function fire() {
    const m = measure();

    if (reduceMotion) {
      gsap.set(arrow, { top: m.top, left: m.releaseLeft, opacity: 1 });
      gsap.set(bowWrap, { opacity: 0 });
      gsap.set(targetWrap, { x: m.recenterDelta, scale: 1.4 });
      gsap.set(lead, { opacity: 1, y: 0 });
      gsap.set(wordUnits, { yPercent: 0 });
      spawnBurst(w / 2, h * 0.44);
      bills.forEach((b) => { b.y = b.restY; b.settled = true; });
      requestAnimationFrame(tick);
      return;
    }

    gsap.set(arrow, { top: m.top, left: m.restLeft });

    const tl = gsap.timeline();
    tl
      // 1. Busca da mira (retículos aproximam suavemente)
      .to(".alvo-hud-tl", { x: -12, y: -12, opacity: 0.7, duration: 0.6, ease: "power2.out" })
      .to(".alvo-hud-tr", { x: 12, y: -12, opacity: 0.7, duration: 0.6, ease: "power2.out" }, "<")
      .to(".alvo-hud-bl", { x: -12, y: 12, opacity: 0.7, duration: 0.6, ease: "power2.out" }, "<")
      .to(".alvo-hud-br", { x: 12, y: 12, opacity: 0.7, duration: 0.6, ease: "power2.out" }, "<")

      // 2. Tensão & Vibração pré lock-on
      .to("#alvoLockBrackets", { x: "+=1.5", y: "+=1.5", duration: 0.05, repeat: 4, yoyo: true, ease: "sine.inOut" })

      // 3. LOCK-ON INSTANTÂNEO!
      .add("lock")
      .to(".alvo-hud-tl", { x: 0, y: 0, opacity: 1, duration: 0.35, ease: "back.out(2.5)" }, "lock")
      .to(".alvo-hud-tr", { x: 0, y: 0, opacity: 1, duration: 0.35, ease: "back.out(2.5)" }, "lock")
      .to(".alvo-hud-bl", { x: 0, y: 0, opacity: 1, duration: 0.35, ease: "back.out(2.5)" }, "lock")
      .to(".alvo-hud-br", { x: 0, y: 0, opacity: 1, duration: 0.35, ease: "back.out(2.5)" }, "lock")
      .to("#alvoLockRing", { scale: 1, opacity: 1, duration: 0.4, ease: "expo.out" }, "lock")

      // 4. IMPACTO: shockwave, núcleo pisca, dinheiro explode
      .add("impact", "lock+=0.15")
      .fromTo("#alvoShockwave", { scale: 0.8, opacity: 1 }, { scale: 5.5, opacity: 0, duration: 0.9, ease: "power3.out" }, "impact")
      .to(target, { scale: 1.25, duration: 0.15, ease: "expo.out", transformOrigin: "50% 50%" }, "impact")
      .to("#alvoCoreDot", { scale: 1.6, fill: "#ffffff", duration: 0.15, ease: "expo.out" }, "impact")
      .to("#alvoCoreDot", { scale: 1, fill: "var(--violet-2)", duration: 0.6, ease: "elastic.out(1.2, 0.3)" }, "impact+=0.15")
      .to(target, { scale: 1, duration: 0.7, ease: "elastic.out(1.2, 0.3)" }, "impact+=0.15")
      .fromTo(stage, { x: 0 }, { x: 6, duration: 0.05, repeat: 5, yoyo: true, ease: "none" }, "impact")
      .add(() => {
        const r = targetWrap.getBoundingClientRect();
        const s = section.getBoundingClientRect();
        spawnBurst(r.left - s.left + r.width / 2, r.top - s.top + r.height / 2);
        startLoop();
      }, "impact")

      // 5. Arco some, e o alvo (com a flecha cravada) desliza pro centro
      .to(bowWrap, { opacity: 0, duration: 0.45, ease: "power2.in" }, "impact+=0.1")
      .add("recenter", "impact+=0.45")
      // a flecha vira FILHA do alvo aqui (só depois que a quivera de impacto
      // termina, senão a rotação residual distorce a medição) — assim ela
      // cresce e desliza junto com o alvo como uma coisa só, sem precisar
      // sincronizar na mão dois transform-origins de elementos separados
      // (fonte do desalinhamento).
      .add(() => {
        gsap.set(arrow, { rotation: 0 });
        const arrowRect = arrow.getBoundingClientRect();
        const wrapRect = targetWrap.getBoundingClientRect();
        gsap.set(arrow, {
          left: arrowRect.left - wrapRect.left,
          top: arrowRect.top - wrapRect.top,
        });
        targetWrap.appendChild(arrow);
      }, "recenter")
      .to(targetWrap, {
        x: m.recenterDelta, scale: 1.42, duration: 1.2, ease: "power3.inOut",
      }, "recenter")

      // 6. Com o alvo centralizado: texto de apoio e "NO ALVO." sobem
      .add("centered", "recenter+=1.0")
      .to(lead, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "centered")
      .to(wordUnits, { yPercent: 0, duration: 1.2, stagger: 0.12, ease: "expo.out" }, "centered+=0.2");

    // ---------- ARCO & FLECHA: puxa e solta ----------
    tl.fromTo([bowWrap, arrow], { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, 0)
      .to(arrow, { left: m.drawLeft, duration: 0.8, ease: "power2.out" }, 0.1)
      .to([stringTop, stringBottom], { attr: { x2: 10 }, duration: 0.8, ease: "power2.out" }, 0.1)
      .to(arrow, { left: "+=3", duration: 0.05, repeat: 3, yoyo: true, ease: "sine.inOut" }, 0.8)
      .to(arrow, { left: m.releaseLeft, opacity: 1, duration: 0.2, ease: "power4.in" }, "lock")
      .to([stringTop, stringBottom], { attr: { x2: 38 }, duration: 0.4, ease: "elastic.out(1, 0.35)" }, "lock")
      .to(bowWrap, { x: "+=5", duration: 0.06, repeat: 3, yoyo: true, ease: "none" }, "lock")
      .to(arrow, { rotation: 3, transformOrigin: "100% 50%", duration: 0.06, repeat: 5, yoyo: true, ease: "none" }, "impact");
      
    // Loop every 30 seconds
    setTimeout(() => {
      resetState();
      fire();
    }, 30000);
  }

  // Idle da ring tracejada e da ring de lock no alvo
  if (!reduceMotion) {
    gsap.to("#alvoTargetRingDashed", { rotation: 360, duration: 22, ease: "none", repeat: -1, svgOrigin: "120 120" });
    gsap.to("#alvoLockRing", { rotation: -360, duration: 16, ease: "none", repeat: -1, svgOrigin: "120 120" });
  }

  ScrollTrigger.create({
    trigger: section,
    start: "top 62%",
    once: true,
    onEnter: fire,
  });
}
