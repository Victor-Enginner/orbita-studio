// Decorative neural field. No model, network requests or workspace data.
export const MOTION_KEY = "orbita-neural-motion:v1";

export function buildNeuralField(width, height) {
  let seed = 72841;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const mobile = width < 700;
  const nodes = [],
    edges = [];
  const clamp = (value, max) => Math.max(4, Math.min(max - 4, value));
  const add = (x, y, hub = false) => {
    nodes.push({ x: clamp(x, width), y: clamp(y, height), hub });
    return nodes.length - 1;
  };
  const connect = (a, b) => {
    const from = nodes[a],
      to = nodes[b];
    const bend = (random() - 0.5) * 60;
    edges.push({
      a,
      b,
      cx: (from.x + to.x) / 2 + bend,
      cy: (from.y + to.y) / 2 - bend,
      phase: random(),
      duration: 0.45 + random() * 0.65,
      color: random() > 0.65 ? "#b46cff" : "#00edff",
    });
  };
  const hubs = [];
  const count = mobile ? 5 : 9;
  const radius = Math.min(width, height) * (mobile ? 0.19 : 0.16);
  for (let i = 0; i < count; i++) {
    // Alternate edges and center, so the network surrounds the readable UI.
    const x = width * (i % 3 === 0 ? 0.1 : i % 3 === 1 ? 0.88 : 0.5);
    const y = height * (0.12 + (i / (count - 1)) * 0.78);
    const hub = add(x + (random() - 0.5) * radius, y, true);
    hubs.push(hub);
    for (let branch = 0; branch < 5; branch++) {
      const angle = (branch * Math.PI * 2) / 5 + random();
      const length = radius * (0.55 + random() * 0.6);
      const tip = add(
        nodes[hub].x + Math.cos(angle) * length,
        nodes[hub].y + Math.sin(angle) * length,
      );
      connect(hub, tip);
      for (let fork = -1; fork <= 1; fork += 2) {
        const leaf = add(
          nodes[tip].x + Math.cos(angle + fork * 0.65) * length * 0.45,
          nodes[tip].y + Math.sin(angle + fork * 0.65) * length * 0.45,
        );
        connect(tip, leaf);
      }
    }
    if (i) connect(hubs[i - 1], hub);
    if (i > 2) connect(hubs[i - 3], hub);
  }
  return { nodes, edges, packetCount: mobile ? 10 : 18 };
}

export function pointOnEdge(field, edge, t) {
  const a = field.nodes[edge.a],
    b = field.nodes[edge.b],
    u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * edge.cx + t * t * b.x,
    y: u * u * a.y + 2 * u * t * edge.cy + t * t * b.y,
  };
}

export function mountNeuralBackground(win = window) {
  const doc = win.document;
  const canvas = doc.querySelector("#neural-background");
  const toggle = doc.querySelector("#neural-motion-toggle");
  if (!canvas || !toggle) return () => {};
  let ctx;
  try {
    ctx = canvas.getContext("2d", { alpha: true });
  } catch {
    /* Black fallback. */
  }
  if (!ctx) {
    canvas.hidden = true;
    toggle.parentElement.hidden = true;
    return () => {};
  }
  const reduced = win.matchMedia("(prefers-reduced-motion: reduce)");
  let enabled = true;
  try {
    enabled = win.localStorage.getItem(MOTION_KEY) !== "off";
  } catch {
    /* Optional preference. */
  }
  let frame = 0,
    last = -Infinity,
    time = 0,
    width = 0,
    height = 0,
    field;
  let disposed = false;
  // Cache static dendrites; per-frame work is only one blit and a few particles.
  const layer = doc.createElement("canvas");
  const ink = layer.getContext("2d");
  const allowed = () => enabled && !reduced.matches && !doc.hidden && !disposed;
  const path = (context, edge) => {
    const a = field.nodes[edge.a],
      b = field.nodes[edge.b];
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.quadraticCurveTo(edge.cx, edge.cy, b.x, b.y);
  };
  function staticField() {
    if (!ink) return;
    ink.clearRect(0, 0, width, height);
    for (const edge of field.edges) {
      path(ink, edge);
      ink.strokeStyle = edge.color;
      ink.globalAlpha = 0.13;
      ink.lineWidth = 0.65;
      ink.stroke();
    }
    for (const node of field.nodes) {
      ink.globalAlpha = node.hub ? 0.65 : 0.25;
      ink.fillStyle = node.hub ? "#75fff5" : "#29a6ba";
      ink.beginPath();
      ink.arc(node.x, node.y, node.hub ? 1.9 : 0.85, 0, Math.PI * 2);
      ink.fill();
      if (node.hub) {
        ink.globalAlpha = 0.14;
        ink.strokeStyle = "#00edff";
        ink.lineWidth = 0.7;
        ink.beginPath();
        ink.arc(node.x, node.y, 7, 0, Math.PI * 2);
        ink.stroke();
      }
    }
    ink.globalAlpha = 1;
  }
  function draw(moving) {
    ctx.clearRect(0, 0, width, height);
    if (ink) ctx.drawImage(layer, 0, 0, width, height);
    if (!moving) return;
    for (let i = 0; i < field.packetCount; i++) {
      const cycle = time / (0.65 + (i % 4) * 0.17) + i * 0.618;
      const edge =
        field.edges[(i * 17 + Math.floor(cycle) * 7) % field.edges.length];
      const t = cycle % 1;
      // Small continuous traveling tails; no full-screen blinking or strobes.
      for (let tail = 5; tail >= 0; tail--) {
        const p = pointOnEdge(field, edge, Math.max(0, t - tail * 0.022));
        ctx.globalAlpha = (1 - tail / 6) * 0.65;
        ctx.fillStyle = tail ? edge.color : "#baffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, tail ? 1 : 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  function tick(now) {
    frame = 0;
    if (!allowed()) return;
    if (now - last >= 1000 / 30) {
      time += Number.isFinite(last) ? Math.min((now - last) / 1000, 0.08) : 0;
      last = now;
      draw(true);
    }
    frame = win.requestAnimationFrame(tick);
  }
  function sync() {
    if (frame) win.cancelAnimationFrame(frame);
    frame = 0;
    last = -Infinity;
    const active = enabled && !reduced.matches;
    toggle.setAttribute("aria-pressed", String(active));
    toggle.disabled = reduced.matches;
    toggle.querySelector("[data-motion-state]").textContent = reduced.matches
      ? "reduzido"
      : enabled
        ? "ativo"
        : "pausado";
    toggle.title = reduced.matches
      ? "Movimento reduzido nas preferências do dispositivo"
      : active
        ? "Pausar animação de fundo"
        : "Ativar animação de fundo";
    draw(false);
    if (allowed()) frame = win.requestAnimationFrame(tick);
  }
  function resize() {
    width = Math.max(32, win.innerWidth);
    height = Math.max(32, win.innerHeight);
    // Bound backing-store memory even on high-density phone screens.
    const dpr = Math.min(
      win.devicePixelRatio || 1,
      1.5,
      Math.sqrt(2500000 / (width * height)),
    );
    canvas.width = layer.width = Math.round(width * dpr);
    canvas.height = layer.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ink?.setTransform(dpr, 0, 0, dpr, 0, 0);
    field = buildNeuralField(width, height);
    staticField();
    sync();
  }
  function click() {
    enabled = !enabled;
    try {
      win.localStorage.setItem(MOTION_KEY, enabled ? "on" : "off");
    } catch {
      /* Keep working without storage. */
    }
    sync();
  }
  toggle.addEventListener("click", click);
  win.addEventListener("resize", resize);
  doc.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  // Stop when suspended in the back/forward cache; resume on restoration.
  const suspend = () => {
    if (frame) win.cancelAnimationFrame(frame);
    frame = 0;
  };
  win.addEventListener("pagehide", suspend);
  win.addEventListener("pageshow", sync);
  resize();
  return () => {
    disposed = true;
    suspend();
    toggle.removeEventListener("click", click);
    win.removeEventListener("resize", resize);
    doc.removeEventListener("visibilitychange", sync);
    reduced.removeEventListener("change", sync);
    win.removeEventListener("pagehide", suspend);
    win.removeEventListener("pageshow", sync);
  };
}
