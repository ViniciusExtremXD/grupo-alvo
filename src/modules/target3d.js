/**
 * O ALVO em 3D — WebGL2 puro, sem bibliotecas (a peça-assinatura do site).
 *
 * Um fragment shader traça, por pixel, um alvo de palha (disco com
 * espessura), com a face nas cores da marca, e até 8 flechas (haste de
 * alumínio, três penas, nock). Luz principal quente vinda do alto à esquerda,
 * sombras suaves das flechas sobre a face, contraluz violeta por trás.
 * Saída transparente (premultiplicada): o alvo flutua sobre o fundo da seção.
 *
 * Movimento: flechas voam de trás da câmera e cravam (o alvo recua, a flecha
 * vibra); o conjunto balança devagar, acompanha o mouse, e pode ser girado
 * arrastando. Clicar no alvo dispara uma flecha naquele ponto.
 *
 * Contrato: roda só com a seção na tela e a aba visível; DPR ≤ 2 com
 * qualidade adaptativa (baixa a resolução se o quadro passar de ~24 ms);
 * sem WebGL2 o chamador mantém o alvo estático em CSS.
 */

const MAXA = 8;
const SHAFT = 1.15; // comprimento visível da flecha (o raio do alvo é 1)

const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
#define MAXA ${MAXA}
uniform vec2 uCenter;      // onde o centro do alvo cai na tela (px, origem embaixo)
uniform float uFocal;      // distância focal em px
uniform float uCamZ;       // distância da câmera
uniform mat3 uRot;         // objeto → mundo
uniform vec3 uObjPos;      // recuo do alvo
uniform int uCount;
uniform vec4 uTip[MAXA];   // xyz: ponta (espaço do objeto) · w: 1 = cravada
uniform vec4 uDir[MAXA];   // xyz: direção ponta→nock · w: deslocamento de voo
uniform vec3 uVane[MAXA];  // cor das penas
uniform float uHit;        // flash do centro (1 → 0)
uniform float uFade;       // opacidade geral
out vec4 o;

const float T = 0.2;        // espessura do alvo
const float RA = 0.0115;    // raio da haste
const float LS = ${SHAFT.toFixed(2)};
const float V0 = LS - 0.27; // início das penas
const float V1 = LS - 0.035;
const float VH = 0.058;     // altura das penas

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }

float capIntersect(vec3 ro, vec3 rd, vec3 pa, vec3 pb, float ra) {
  vec3 ba = pb - pa, oa = ro - pa;
  float baba = dot(ba, ba), bard = dot(ba, rd), baoa = dot(ba, oa), rdoa = dot(rd, oa), oaoa = dot(oa, oa);
  float a = baba - bard * bard;
  float b = baba * rdoa - baoa * bard;
  float c = baba * oaoa - baoa * baoa - ra * ra * baba;
  float h = b * b - a * c;
  if (h >= 0.0) {
    float t = (-b - sqrt(h)) / a;
    float y = baoa + t * bard;
    if (y > 0.0 && y < baba) return t;
    vec3 oc = (y <= 0.0) ? oa : ro - pb;
    b = dot(rd, oc); c = dot(oc, oc) - ra * ra; h = b * b - c;
    if (h > 0.0) return -b - sqrt(h);
  }
  return -1.0;
}
float capShadow(vec3 ro, vec3 rd, vec3 a, vec3 b, float r, float k) {
  vec3 ba = b - a, oa = ro - a;
  float oad = dot(oa, rd), dba = dot(rd, ba), baba = dot(ba, ba), oaba = dot(oa, ba);
  vec2 th = vec2(-oad * baba + dba * oaba, oaba - oad * dba) / (baba - dba * dba);
  th.x = max(th.x, 0.0001);
  th.y = clamp(th.y, 0.0, 1.0);
  float d = length((a + ba * th.y) - (ro + rd * th.x)) - r;
  float s = clamp(k * d / th.x + 0.5, 0.0, 1.0);
  return s * s * (3.0 - 2.0 * s);
}

// face do alvo: cinco zonas de cor (osso, tinta, osso, lavanda, violeta), dez anéis
vec3 faceAlbedo(vec2 q, float aa, out float lum) {
  float r = length(q);
  vec3 bone = vec3(0.935, 0.905, 0.85), ink = vec3(0.105, 0.1, 0.125), lav = vec3(0.71, 0.65, 1.0);
  vec3 vio = vec3(0.357, 0.235, 0.965), vio2 = vec3(0.47, 0.36, 1.0);
  vec3 c = bone;
  c = mix(ink, c, smoothstep(0.8 - aa, 0.8 + aa, r));
  c = mix(bone, c, smoothstep(0.6 - aa, 0.6 + aa, r));
  c = mix(lav, c, smoothstep(0.4 - aa, 0.4 + aa, r));
  c = mix(vio, c, smoothstep(0.2 - aa, 0.2 + aa, r));
  c = mix(vio2, c, smoothstep(0.1 - aa, 0.1 + aa, r));
  lum = dot(c, vec3(0.3, 0.6, 0.1));
  // linhas de pontuação a cada 0,1
  float ring = abs(fract(r * 10.0 + 0.5) - 0.5) / 10.0;
  float line = (1.0 - smoothstep(0.0022, 0.0022 + aa, ring)) * step(0.05, r) * step(r, 0.97);
  vec3 lc = lum > 0.35 ? vec3(0.16, 0.15, 0.2) : vec3(0.72, 0.7, 0.8);
  c = mix(c, lc, line * 0.6);
  // cruz do centro
  float cr = min(abs(q.x), abs(q.y));
  float cross = (1.0 - smoothstep(0.0018, 0.0018 + aa, cr)) * step(max(abs(q.x), abs(q.y)), 0.028);
  c = mix(c, bone, cross);
  // papel: grão e fibras
  float g = noise(q * 240.0) * 0.45 + noise(q * vec2(36.0, 480.0)) * 0.35 + noise(q * 22.0) * 0.2;
  c *= 0.88 + 0.2 * g;
  // furos de tiros antigos
  vec2 cell = floor(q * 6.0);
  vec2 hc = (cell + 0.5 + (vec2(hash(cell), hash(cell + 7.3)) - 0.5) * 0.7) / 6.0;
  float hd = length(q - hc);
  float has = step(0.66, hash(cell + 3.1)) * step(length(hc), 0.92);
  c *= 1.0 - has * 0.75 * (1.0 - smoothstep(0.006, 0.0105, hd));
  c *= 1.0 + has * 0.1 * (smoothstep(0.0105, 0.013, hd) - smoothstep(0.016, 0.022, hd));
  c *= 1.0 - 0.22 * smoothstep(0.93, 1.0, r); // borda gasta
  return c;
}

vec3 sideAlbedo(vec3 h) {
  float ang = atan(h.y, h.x);
  float rows = (h.z + T) / T * 11.0;
  float row = floor(rows), fr = fract(rows);
  float n = hash(vec2(floor(ang * 70.0 + row * 13.7), row));
  float n2 = noise(vec2(ang * 300.0, rows * 3.0));
  vec3 straw = mix(vec3(0.5, 0.39, 0.25), vec3(0.8, 0.68, 0.46), n * 0.7 + n2 * 0.3);
  float groove = smoothstep(0.0, 0.22, fr) * smoothstep(1.0, 0.78, fr);
  return straw * (0.45 + 0.55 * groove);
}

void main() {
  vec3 C = vec3(0.0, 0.0, uCamZ);
  vec3 rdw = normalize(vec3((gl_FragCoord.xy - uCenter) / uFocal, -1.0));
  mat3 Rt = transpose(uRot);
  vec3 ro = Rt * (C - uObjPos);
  vec3 rd = Rt * rdw;
  vec3 L = Rt * normalize(vec3(-0.42, 0.52, 1.0));     // luz principal
  vec3 Lr = Rt * normalize(vec3(0.85, 0.25, -0.75));   // contraluz violeta
  vec3 V = -rd;
  // largura de 1 px sobre a face (pra suavizar os anéis), calculada fora dos ifs
  vec2 fq = (ro - (ro.z / min(rd.z, -1e-4)) * rd).xy;
  float faa = min(fwidth(length(fq)) * 1.2 + 0.0008, 0.05);

  // esfera envolvente: fora dela só existem flechas em voo
  vec3 bc = ro - vec3(0.0, 0.0, 0.5);
  float bb = dot(bc, rd), bq = dot(bc, bc) - 1.45 * 1.45;
  bool inB = bb * bb - bq > 0.0;

  float tBest = 1e9;
  int mat = 0;              // 1 face · 2 lateral · 3 haste · 4 pena
  vec3 n = vec3(0.0), alb = vec3(0.0), hp = vec3(0.0);
  float axial = 0.0; int who = -1;

  if (inB) {
    if (rd.z < 0.0) {
      float t = -ro.z / rd.z;
      vec3 h = ro + t * rd;
      if (t > 0.0 && dot(h.xy, h.xy) <= 1.0) { tBest = t; mat = 1; hp = h; n = vec3(0.0, 0.0, 1.0); }
    }
    float a = dot(rd.xy, rd.xy), b = dot(ro.xy, rd.xy), c = dot(ro.xy, ro.xy) - 1.0;
    float hh = b * b - a * c;
    if (hh > 0.0 && a > 1e-6) {
      float t = (-b - sqrt(hh)) / a;
      vec3 h = ro + t * rd;
      if (t > 0.0 && t < tBest && h.z < 0.0 && h.z > -T) { tBest = t; mat = 2; hp = h; n = vec3(normalize(h.xy), 0.0); }
    }
  }

  for (int i = 0; i < MAXA; i++) {
    if (i >= uCount) break;
    float f = uDir[i].w;
    if (!inB && f < 0.02) continue;
    vec3 D = uDir[i].xyz;
    vec3 A = uTip[i].xyz + D * f;
    vec3 B = A + D * LS;
    float t = capIntersect(ro, rd, A, B, RA);
    if (t > 0.0 && t < tBest) {
      vec3 h = ro + t * rd;
      float s = clamp(dot(h - A, D), 0.0, LS);
      tBest = t; mat = 3; hp = h; n = normalize(h - (A + D * s)); axial = s; who = i;
    }
    // três penas: planos que contêm o eixo
    vec3 up = abs(D.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 e1 = normalize(cross(up, D)), e2 = cross(D, e1);
    for (int k = 0; k < 3; k++) {
      float th = 0.6 + float(k) * 2.0943951;
      vec3 vdir = cos(th) * e1 + sin(th) * e2;
      vec3 pn = cross(D, vdir);
      float den = dot(rd, pn);
      if (abs(den) < 1e-5) continue;
      float tv = dot(A - ro, pn) / den;
      if (tv <= 0.0 || tv >= tBest) continue;
      vec3 rel = ro + tv * rd - A;
      float s = dot(rel, D), r = dot(rel, vdir);
      if (s < V0 || s > V1 || r < RA * 0.6) continue;
      float u = (s - V0) / (V1 - V0);
      float prof = VH * smoothstep(0.0, 0.7, u) * (1.0 - 0.55 * smoothstep(0.86, 1.0, u));
      if (r > prof) continue;
      tBest = tv; mat = 4; hp = ro + tv * rd; n = pn * sign(-den); who = i; axial = u;
    }
  }

  if (mat == 0) { o = vec4(0.0); return; }

  vec3 key = vec3(1.0, 0.95, 0.88) * 2.6;
  vec3 amb = vec3(0.13, 0.12, 0.2);
  vec3 rimC = vec3(0.42, 0.27, 1.0);
  float sh = 1.0, spec = 0.0, specPow = 24.0, emis = 0.0;
  vec3 emisC = vec3(0.0);

  if (mat == 1 || mat == 2) {
    // sombras suaves das flechas
    vec3 sp = hp + n * 0.002;
    for (int i = 0; i < MAXA; i++) {
      if (i >= uCount) break;
      vec3 D = uDir[i].xyz;
      vec3 A = uTip[i].xyz + D * uDir[i].w;
      sh *= mix(1.0, capShadow(sp, L, A, A + D * LS, RA, 15.0), 0.8);
      sh *= mix(1.0, capShadow(sp, L, A + D * V0, A + D * V1, VH * 0.55, 7.0), 0.6);
    }
    if (mat == 1) {
      float lum;
      alb = lin(faceAlbedo(hp.xy, faa, lum));
      // foco: mais luz no alto à esquerda
      sh *= 1.0 - 0.5 * smoothstep(0.1, 1.6, length(hp.xy - vec2(-0.38, 0.45)));
      // furos e sombra de contato de cada flecha cravada
      for (int i = 0; i < MAXA; i++) {
        if (i >= uCount) break;
        if (uTip[i].w < 0.5) continue;
        vec3 D = uDir[i].xyz;
        vec2 e = uTip[i].xy - D.xy * (uTip[i].z / D.z);
        float d = length(hp.xy - e);
        alb *= 0.25 + 0.75 * smoothstep(RA * 0.9, RA * 1.6, d);
        sh *= 0.72 + 0.28 * smoothstep(0.0, 0.075, d);
      }
      // onda do acerto no centro
      float r = length(hp.xy);
      float w = (1.0 - uHit) * 1.25;
      float wave = exp(-pow((r - w) / 0.045, 2.0)) * uHit;
      emisC = vec3(0.72, 0.62, 1.0); emis = wave * 2.2 + uHit * 1.6 * (1.0 - smoothstep(0.0, 0.2, r));
      spec = 0.1; specPow = 10.0;
    } else {
      alb = lin(sideAlbedo(hp));
      spec = 0.08;
    }
  } else if (mat == 3) {
    vec3 alu = vec3(0.74, 0.73, 0.78);
    alb = lin(alu);
    spec = 0.9; specPow = 70.0;
    // anéis de identificação e nock
    vec3 vc = uVane[who];
    float band = step(LS - 0.36, axial) * step(axial, LS - 0.3) * step(0.5, fract(axial * 55.0));
    alb = mix(alb, lin(vc), band);
    float nock = step(LS - 0.03, axial);
    alb = mix(alb, lin(vec3(0.8, 0.74, 1.0)), nock);
    emisC = vec3(0.6, 0.5, 1.0); emis = nock * 0.9;
  } else {
    vec3 vc = uVane[who];
    alb = lin(vc) * (0.82 + 0.18 * axial);
    spec = 0.18; specPow = 30.0;
    emisC = alb; emis = 0.25 * max(dot(-n, L), 0.0); // luz atravessando a pena
  }

  float nl = max(dot(n, L), 0.0);
  vec3 col = alb * (amb + key * nl * sh);
  vec3 hv = normalize(L + V);
  col += key * spec * pow(max(dot(n, hv), 0.0), specPow) * sh;
  float fres = pow(1.0 - max(dot(n, V), 0.0), 2.6);
  col += rimC * fres * (0.35 + 0.65 * max(dot(n, Lr), 0.0)) * (mat == 1 ? 0.5 : mat == 2 ? 0.7 : 1.6);
  if (mat == 2) col += alb * vec3(0.3, 0.25, 0.2); // luz rebatida: a palha não some na sombra
  col += emisC * emis;

  col = col / (1.0 + col * 0.85);          // tone map
  col = pow(col, vec3(1.0 / 2.2));
  o = vec4(col * uFade, uFade);
}`;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function rotMat(yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  // R = Ry(yaw) · Rx(pitch), em colunas (formato do uniformMatrix3fv)
  return [cy, 0, -sy, sy * sp, cp, cy * sp, sy * cp, -sp, cy * cp];
}
const mulT = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const normalize = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

const VANES = [[0.357, 0.235, 0.965], [0.925, 0.91, 0.875], [0.71, 0.65, 1.0]];

/**
 * @param {HTMLElement} host  elemento que o canvas vai preencher (position ≠ static)
 * @param {object} opts
 *   layout(): { cx, cy, radius }  centro e raio do alvo em px CSS dentro do host
 *   onHit(score, clientPoint)     chamado quando uma flecha crava (score 1–10, 0 = fora)
 * @returns API ou null se não houver WebGL2
 */
export function createTarget(host, opts) {
  const canvas = document.createElement("canvas");
  canvas.className = "target3d";
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "high-performance" });
  if (!gl) return null;

  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
    return s;
  };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
  } catch (e) {
    return null;
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  ["uCenter", "uFocal", "uCamZ", "uRot", "uObjPos", "uCount", "uTip", "uDir", "uVane", "uHit", "uFade"].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

  host.prepend(canvas);

  // ---------- estado ----------
  const S = {
    w: 1, h: 1, scale: 1, cx: 0, cy: 0, radius: 100,
    camZ: 4.2, dive: 0, fade: 0,
    yaw: 0, pitch: 0, dragYaw: 0, dragPitch: 0, vYaw: 0, vPitch: 0,
    mx: 0, my: 0, tmx: 0, tmy: 0,
    kick: 0, kickT: 0, kx: 0, ky: 0,
    hit: 0,
    arrows: [],
    t: 0, running: false, visible: false, dragging: false,
  };
  const tips = new Float32Array(MAXA * 4), dirs = new Float32Array(MAXA * 4), vanes = new Float32Array(MAXA * 3);
  const pinned = /[?&]glq=([\d.]+)/.exec(location.search);
  const dprCap = () => (pinned ? +pinned[1] : clamp(window.devicePixelRatio || 1, 1.5, 2));
  S.scale = dprCap();

  function resize() {
    const r = host.getBoundingClientRect();
    S.w = Math.max(1, r.width); S.h = Math.max(1, r.height);
    const L = opts.layout();
    S.cx = L.cx; S.cy = L.cy; S.radius = L.radius;
    canvas.width = Math.round(S.w * S.scale);
    canvas.height = Math.round(S.h * S.scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  // câmera: raio de pixel (coordenadas CSS, origem no canto de cima) → espaço do objeto
  function cam() {
    const zoom = 1 + S.dive * 1.5;
    const camZ = S.camZ / (1 + S.dive * 0.9);
    const focal = (S.radius * zoom * camZ);
    // no mergulho, o centro do alvo vai para o meio da tela
    const cx = S.cx + (S.w / 2 - S.cx) * S.dive * 0.55;
    const cy = S.cy + (S.h / 2 - S.cy) * S.dive * 0.55;
    return { camZ, focal, cx, cy };
  }
  function rotation() {
    const idleY = Math.sin(S.t * 0.42) * 0.09, idleP = Math.sin(S.t * 0.31 + 1.2) * 0.035;
    const yaw = -0.6 + idleY + S.mx * 0.14 + S.dragYaw + S.kx;
    const pitch = 0.14 + idleP - S.my * 0.09 + S.dragPitch + S.ky;
    return rotMat(yaw, pitch);
  }
  function unproject(x, y, R, c) {
    const rd = normalize([(x - c.cx) / c.focal, -(y - c.cy) / c.focal, -1]);
    const ro = mulT(R, [0, 0, c.camZ]);
    const d = mulT(R, rd);
    if (d[2] >= 0) return null;
    const t = -ro[2] / d[2];
    return { x: ro[0] + t * d[0], y: ro[1] + t * d[1] };
  }

  // ---------- flechas ----------
  function fire(x, y, o = {}) {
    if (S.arrows.length >= MAXA) S.arrows.shift();
    // a flecha chega perpendicular ao alvo, descendo um pouco, com um desvio
    const j = o.spread ?? 0.1;
    const dir = normalize([(Math.random() - 0.5) * j, 0.07 + (Math.random() - 0.5) * j, 1]);
    S.arrows.push({
      x, y, dir, f: o.instant ? 0 : 6.5, speed: 15, stuck: !!o.instant, user: !!o.user,
      wob: 0, wobT: 0, wax: normalize([-(dir[1]), dir[0], 0.0001]),
      vane: VANES[(o.color ?? S.arrows.length) % VANES.length],
      depth: 0.07 + Math.random() * 0.03,
      cb: o.onHit,
    });
    wake();
  }
  function impact(a) {
    a.stuck = true; a.f = 0; a.wob = 0.075; a.wobT = 0;
    const r = Math.hypot(a.x, a.y);
    const score = r > 1 ? 0 : Math.max(1, 10 - Math.floor(r * 10));
    S.kick = 0.05; S.kickT = 0;
    S.kimpX = -a.x * 0.045; S.kimpY = a.y * 0.045;
    if (score === 10) S.hit = 1;
    a.cb?.(score);
    opts.onHit?.(score, a);
  }

  // ---------- quadro ----------
  let last = 0, slow = 0, fast = 0;
  function frame(now) {
    if (!S.running) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    const cost = last ? now - last : 16;
    last = now;
    S.t += dt;

    // qualidade adaptativa
    if (!pinned) {
      if (cost > 26) { slow++; fast = 0; } else if (cost < 18) { fast++; slow = Math.max(0, slow - 1); }
      if (slow > 20 && S.scale > 0.75) { S.scale = Math.max(0.75, S.scale * 0.8); slow = 0; resize(); }
    }

    S.fade += (1 - S.fade) * Math.min(1, dt * 2.2);
    S.mx += (S.tmx - S.mx) * Math.min(1, dt * 3);
    S.my += (S.tmy - S.my) * Math.min(1, dt * 3);
    if (!S.dragging) {
      // solta: gira por inércia e volta devagar para a posição de repouso
      S.dragYaw += S.vYaw * dt; S.dragPitch += S.vPitch * dt;
      S.vYaw *= Math.pow(0.04, dt); S.vPitch *= Math.pow(0.04, dt);
      S.dragYaw *= Math.pow(0.35, dt); S.dragPitch *= Math.pow(0.35, dt);
    }
    S.dragYaw = clamp(S.dragYaw, -0.8, 1.3); S.dragPitch = clamp(S.dragPitch, -0.55, 0.55);

    // recuo do alvo no impacto (mola amortecida)
    S.kickT += dt;
    const k = Math.exp(-7 * S.kickT) * Math.cos(26 * S.kickT);
    const kz = S.kick * k;
    S.kx = (S.kimpX || 0) * k; S.ky = (S.kimpY || 0) * k;
    S.hit = Math.max(0, S.hit - dt * 0.9);

    S.arrows.forEach((a, i) => {
      if (!a.stuck) {
        a.f -= a.speed * dt;
        if (a.f <= 0) impact(a);
      } else if (a.wob > 0.0005) {
        a.wobT += dt;
      }
      const w = a.stuck ? a.wob * Math.exp(-5.5 * a.wobT) * Math.sin(46 * a.wobT) : 0;
      if (a.stuck && Math.exp(-5.5 * a.wobT) < 0.01) a.wob = 0;
      const d = normalize([a.dir[0] + a.wax[0] * w, a.dir[1] + a.wax[1] * w, a.dir[2]]);
      // a ponta fica enterrada: o eixo cruza a face exatamente em (x, y)
      tips.set([a.x - d[0] * a.depth, a.y - d[1] * a.depth, -d[2] * a.depth, a.stuck ? 1 : 0], i * 4);
      dirs.set([d[0], d[1], d[2], Math.max(0, a.f)], i * 4);
      vanes.set(a.vane, i * 3);
    });

    const c = cam();
    const R = rotation();
    gl.uniform2f(U.uCenter, c.cx * S.scale, (S.h - c.cy) * S.scale);
    gl.uniform1f(U.uFocal, c.focal * S.scale);
    gl.uniform1f(U.uCamZ, c.camZ);
    gl.uniformMatrix3fv(U.uRot, false, R);
    gl.uniform3f(U.uObjPos, 0, Math.sin(S.t * 0.8) * 0.012, -kz);
    gl.uniform1i(U.uCount, S.arrows.length);
    gl.uniform4fv(U.uTip, tips);
    gl.uniform4fv(U.uDir, dirs);
    gl.uniform3fv(U.uVane, vanes);
    gl.uniform1f(U.uHit, S.hit);
    gl.uniform1f(U.uFade, S.fade * (1 - clamp((S.dive - 0.55) / 0.45, 0, 1)));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    requestAnimationFrame(frame);
  }
  function wake() {
    if (S.running || !S.visible || document.hidden) return;
    S.running = true; last = 0;
    requestAnimationFrame(frame);
  }
  function sleep() { S.running = false; }

  new IntersectionObserver(([e]) => { S.visible = e.isIntersecting; S.visible ? wake() : sleep(); }).observe(host);
  document.addEventListener("visibilitychange", () => (document.hidden ? sleep() : wake()));
  new ResizeObserver(resize).observe(host);
  resize();

  // ---------- ponteiro: parallax, girar arrastando, clicar para atirar ----------
  const local = (e) => { const r = host.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const over = (x, y) => {
    const p = unproject(x, y, rotation(), cam());
    return p && Math.hypot(p.x, p.y) < 1.08 ? p : null;
  };
  let down = null;
  host.addEventListener("pointermove", (e) => {
    const [x, y] = local(e);
    if (e.pointerType === "mouse") {
      S.tmx = clamp((x - S.cx) / S.w, -0.6, 0.6); S.tmy = clamp((y - S.cy) / S.h, -0.6, 0.6);
      if (!down) host.classList.toggle("is-aiming", !!over(x, y));
    }
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (!S.dragging && Math.hypot(dx, dy) > 7) { S.dragging = true; host.classList.add("is-grabbing"); }
    if (S.dragging) {
      const ny = down.yaw + dx * 0.0075, np = down.pitch + dy * 0.006;
      S.vYaw = (ny - S.dragYaw) * 60 * 0.35; S.vPitch = (np - S.dragPitch) * 60 * 0.35;
      S.dragYaw = ny; S.dragPitch = np;
    }
  });
  host.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || e.target.closest("a, button")) return;
    const [x, y] = local(e);
    const p = over(x, y);
    if (!p) return;
    if (e.pointerType === "mouse") e.preventDefault(); // não seleciona o texto ao arrastar
    down = { x: e.clientX, y: e.clientY, yaw: S.dragYaw, pitch: S.dragPitch, p };
  });
  window.addEventListener("pointerup", (e) => {
    if (!down) return;
    if (!S.dragging) {
      const [x, y] = local(e);
      const p = over(x, y) || down.p;
      fire(p.x, p.y, { spread: 0.14, user: true });
    }
    down = null; S.dragging = false;
    host.classList.remove("is-grabbing");
  });
  window.addEventListener("pointercancel", () => { down = null; S.dragging = false; host.classList.remove("is-grabbing"); });
  host.addEventListener("pointerleave", () => { S.tmx = 0; S.tmy = 0; host.classList.remove("is-aiming"); });

  return {
    canvas,
    fire,
    /** 0 → 1: a câmera mergulha no centro do alvo (ligado à rolagem) */
    setDive(v) { S.dive = clamp(v, 0, 1); wake(); },
    /** posição na tela (px do host) de um ponto da face — pra ancorar rótulos */
    project(x, y) {
      const c = cam(); const R = rotation();
      const w = [R[0] * x + R[3] * y, R[1] * x + R[4] * y, R[2] * x + R[5] * y];
      const z = c.camZ - w[2];
      return [c.cx + (w[0] / z) * c.focal, c.cy - (w[1] / z) * c.focal];
    },
    relayout: resize,
  };
}
