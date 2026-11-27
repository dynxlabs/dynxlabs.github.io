/* ============================================================
   DYNX Labs — Orbe del hero (red neuronal 3D)
   File: assets/js/hero-orb.js

   Misma técnica y parámetros que el orbe de Orah, en tonos blanco
   y grises de la paleta DYNX. Sin interacción con el cursor.
   Alineado a la derecha: se ve la mitad. Tamaño proporcional al
   lado menor del hero. Respeta prefers-reduced-motion.
============================================================ */
(function () {
  const canvas = document.getElementById('hero-orb');
  if (!canvas) return;
  const section = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PAL = {
    pLight: 60,
    halo: ['rgba(255,255,255,.20)', 'rgba(255,255,255,.08)', 'rgba(255,255,255,.02)', 'rgba(255,255,255,0)'],
    edge: '255,255,255',
    signal: '255,255,255',
    orbit: ['rgba(255,255,255,.14)', 'rgba(255,255,255,.10)']
  };

  let width = 0, height = 0, dpr = 1;
  let particles = [], edges = [], signals = [], projBuf = [];
  let time = 0, lastFrame = 0, sigAcc = 0, raf = 0;

  function resize() {
    const rect = section.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // La red se genera una sola vez: regenerarla al cambiar el tamaño la re-aleatoriza y produce saltos
    if (!particles.length) build();
  }

  function build() {
    particles = []; edges = []; signals = [];
    const count = Math.round(Math.max(900, Math.min(1800, (width * height) / 150)));
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      particles.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r,
        seed: Math.random() * Math.PI * 2, phase: Math.random() * Math.PI * 2,
        size: 0.48 + Math.random() * 1.05 });
    }
    const linked = new Set();
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      const near = [];
      for (let j = Math.max(0, i - 34); j < Math.min(particles.length, i + 35); j++) {
        if (i === j) continue;
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < 0.018) near.push([d, j]);
      }
      near.sort((m, n) => m[0] - n[0]);
      for (const pair of near.slice(0, 3)) {
        const j = pair[1];
        const key = i < j ? i + ':' + j : j + ':' + i;
        if (!linked.has(key)) { linked.add(key); edges.push([i, j]); }
      }
    }
  }

  const maxSig = () => Math.min(26, Math.max(6, Math.floor(edges.length / 55)));
  const smooth = (t) => t * t * (3 - 2 * t);

  function draw(ts) {
    const dt = Math.min(32, ts - (lastFrame || ts));
    lastFrame = ts;
    if (!reduce) time += dt * 0.00042;
    ctx.clearRect(0, 0, width, height);

    const mobile = width < 600;
    const breathe = 1 + (reduce ? 0 : Math.sin(time * 0.8) * 0.014);
    const scale = Math.min(width, height) * (mobile ? 0.405 : 0.425) * breathe;
    const cx = width;                 // borde derecho: solo se ve la mitad
    const cy = height * 0.49;

    const rotY = time * 0.32;
    const rotX = -0.2 + Math.sin(time * 0.46) * 0.1;
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

    if (projBuf.length !== particles.length) projBuf = particles.map(() => ({ sx: 0, sy: 0, z: 0, size: 0 }));
    const proj = projBuf;

    // El halo se funde a cero antes de llegar al borde del hero (sin corte visible arriba ni abajo)
    // y con caída suave (cuadrática) para no dejar un anillo visible
    const haloR = Math.min(scale * 1.48, Math.min(cy, height - cy) * 0.98);
    const halo = ctx.createRadialGradient(cx, cy, scale * 0.04, cx, cy, haloR);
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      halo.addColorStop(t, 'rgba(255,255,255,' + (0.2 * Math.pow(1 - t, 2)).toFixed(4) + ')');
    }
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(cx, cy, haloR, 0, Math.PI * 2); ctx.fill();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const wa = Math.sin(p.x * 7.4 + time * 2 + p.seed) * 0.031;
      const wb = Math.cos(p.z * 8.2 - time * 1.4 + p.phase) * 0.023;
      const wc = Math.sin(p.y * 10.5 + time * 0.9 + p.seed) * 0.015;
      const wd = Math.sin((p.x + p.z) * 5.5 + time * 1.1) * 0.012;
      const deform = 1 + wa + wb + wc + wd;
      const px = p.x * deform, py = p.y * deform, pz = p.z * deform;
      const x1 = px * cosY - pz * sinY;
      const z1 = px * sinY + pz * cosY;
      const y1 = py * cosX - z1 * sinX;
      const z2 = py * sinX + z1 * cosX;
      const persp = 2.9 / (2.9 + z2 * 0.48);
      const q = proj[i];
      q.sx = cx + x1 * scale * persp; q.sy = cy + y1 * scale * persp; q.z = z2; q.size = p.size * persp;
    }

    // Aristas agrupadas por opacidad: un trazo por grupo
    const NB = 6;
    const eb = Array.from({ length: NB }, () => []);
    for (const e of edges) {
      const a = proj[e[0]], b = proj[e[1]];
      const dx = a.sx - b.sx, dy = a.sy - b.sy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 44) continue;
      const depth = (a.z + b.z + 2) / 4;
      const alpha = (0.035 + depth * 0.1) * (1 - distance / 58);
      if (alpha <= 0.012) continue;
      const bi = Math.min(NB - 1, Math.floor(alpha / 0.03));
      eb[bi].push(a.sx, a.sy, b.sx, b.sy);
    }
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.7;
    for (let bi = 0; bi < NB; bi++) {
      const seg = eb[bi];
      if (!seg.length) continue;
      ctx.strokeStyle = 'rgba(' + PAL.edge + ',' + ((bi + 0.5) * 0.03) + ')';
      ctx.beginPath();
      for (let k = 0; k < seg.length; k += 4) { ctx.moveTo(seg[k], seg[k + 1]); ctx.lineTo(seg[k + 2], seg[k + 3]); }
      ctx.stroke();
    }

    // Señales que viajan por las aristas
    if (!reduce) {
      sigAcc += dt;
      while (sigAcc > 60 && signals.length < maxSig() && edges.length) {
        sigAcc -= 60;
        signals.push({ e: edges[(Math.random() * edges.length) | 0], t: 0, speed: 0.55 + Math.random() * 0.7 });
      }
    }
    signals = signals.filter((s) => s.t < 1);
    for (const s of signals) {
      s.t += reduce ? 1 : (dt / 1000) * s.speed;
      const a = proj[s.e[0]], b = proj[s.e[1]];
      const dx = a.sx - b.sx, dy = a.sy - b.sy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 90) continue;
      const t = Math.min(1, s.t);
      const sx = a.sx + (b.sx - a.sx) * t;
      const sy = a.sy + (b.sy - a.sy) * t;
      const fade = Math.sin(Math.PI * t);
      ctx.strokeStyle = 'rgba(' + PAL.signal + ',' + (0.5 * fade) + ')';
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(sx, sy); ctx.stroke();
      ctx.beginPath(); ctx.fillStyle = 'rgba(' + PAL.signal + ',' + (0.9 * fade) + ')';
      ctx.arc(sx, sy, 1.9 + fade * 1.1, 0, Math.PI * 2); ctx.fill();
    }

    // Anillos orbitales
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.34 + Math.sin(time * 0.3) * 0.045);
    ctx.strokeStyle = PAL.orbit[0]; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.ellipse(0, 0, scale * 1.06, scale * 0.36, 0, 0.1, Math.PI * 1.88); ctx.stroke();
    ctx.rotate(1.02);
    ctx.strokeStyle = PAL.orbit[1];
    ctx.beginPath(); ctx.ellipse(0, 0, scale * 0.98, scale * 0.31, 0, 0.12, Math.PI * 1.84); ctx.stroke();
    ctx.restore();

    // Partículas agrupadas por profundidad, de atrás hacia delante
    const PB = 8;
    const pb = Array.from({ length: PB }, () => []);
    for (const p of proj) pb[Math.max(0, Math.min(PB - 1, Math.floor(((p.z + 1) / 2) * PB)))].push(p);
    for (let bi = 0; bi < PB; bi++) {
      const list = pb[bi];
      if (!list.length) continue;
      const gd = (bi + 0.5) / PB;
      const L = Math.round((PAL.pLight + gd * 18) * 2.55);   // gris, misma luminosidad que Orah
      const G = Math.round((PAL.pLight + 8) * 2.55);
      const glowList = list.filter((p) => (p.z + 1) / 2 > 0.56);
      if (glowList.length) {
        ctx.fillStyle = 'rgba(' + G + ',' + G + ',' + G + ',' + (0.05 + gd * 0.07) + ')';
        ctx.beginPath();
        for (const p of glowList) {
          const r = p.size * (0.76 + ((p.z + 1) / 2) * 0.5) * 3.3;
          ctx.moveTo(p.sx + r, p.sy); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(' + L + ',' + L + ',' + L + ',' + (0.34 + gd * 0.58) + ')';
      ctx.beginPath();
      for (const p of list) {
        const r = p.size * (0.76 + ((p.z + 1) / 2) * 0.5);
        ctx.moveTo(p.sx + r, p.sy); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    if (!reduce) raf = requestAnimationFrame(draw);
  }

  // El bucle corre sin interrupciones; el cambio de tamaño solo ajusta el lienzo
  const onResize = () => { resize(); if (reduce) requestAnimationFrame(draw); };
  if ('ResizeObserver' in window) {
    new ResizeObserver(onResize).observe(section);
  } else {
    window.addEventListener('resize', onResize);
  }
  resize();
  raf = requestAnimationFrame(draw);
})();
