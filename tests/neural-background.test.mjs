import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import {
  buildNeuralField,
  pointOnEdge,
  mountNeuralBackground,
  MOTION_KEY,
} from "../src/neural-background.js";

test("neural topology is bounded, deterministic and lighter on mobile", () => {
  const mobile = buildNeuralField(390, 844);
  const desktop = buildNeuralField(1440, 900);
  assert.deepEqual(mobile, buildNeuralField(390, 844));
  assert.ok(mobile.nodes.length < desktop.nodes.length);
  assert.ok(mobile.packetCount < desktop.packetCount);
  assert.ok(desktop.edges.length < 180);
  for (const [width, height] of [
    [320, 640],
    [390, 844],
    [1440, 900],
  ]) {
    const field = buildNeuralField(width, height);
    for (const p of field.nodes) {
      assert.ok(p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= height);
    }
    for (const edge of field.edges) {
      const start = pointOnEdge(field, edge, 0);
      const end = pointOnEdge(field, edge, 1);
      assert.deepEqual(start, {
        x: field.nodes[edge.a].x,
        y: field.nodes[edge.a].y,
      });
      assert.deepEqual(end, {
        x: field.nodes[edge.b].x,
        y: field.nodes[edge.b].y,
      });
    }
  }
});

function fixture({ reduced = false, paused = false, context = true } = {}) {
  const win = new Window({ url: "http://localhost:4173" });
  win.document.body.innerHTML =
    '<canvas id="neural-background" aria-hidden="true"></canvas><div><button id="neural-motion-toggle"><span data-motion-state></span></button></div>';
  let hidden = false,
    draws = 0,
    seq = 0;
  const frames = new Map();
  const media = new win.EventTarget();
  media.matches = reduced;
  win.matchMedia = () => media;
  Object.defineProperty(win.document, "hidden", {
    get: () => hidden,
    configurable: true,
  });
  win.requestAnimationFrame = (fn) => {
    frames.set(++seq, fn);
    return seq;
  };
  win.cancelAnimationFrame = (id) => frames.delete(id);
  const ctx = {
    clearRect() {},
    setTransform() {},
    beginPath() {},
    moveTo() {},
    quadraticCurveTo() {},
    stroke() {},
    arc() {},
    fill() {},
    drawImage() {
      draws++;
    },
  };
  win.HTMLCanvasElement.prototype.getContext = () => (context ? ctx : null);
  if (paused) win.localStorage.setItem(MOTION_KEY, "off");
  const dispose = mountNeuralBackground(win);
  return {
    win,
    media,
    frames,
    dispose,
    button: win.document.querySelector("button"),
    get draws() {
      return draws;
    },
    step(time) {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((fn) => fn(time));
    },
    setHidden(value) {
      hidden = value;
      win.document.dispatchEvent(new win.Event("visibilitychange"));
    },
    setReduced(value) {
      media.matches = value;
      media.dispatchEvent(new win.Event("change"));
    },
  };
}

test("animation has one frame loop, throttles, pauses and persists preference", () => {
  const f = fixture();
  assert.equal(f.frames.size, 1);
  f.step(0);
  const first = f.draws;
  f.step(16);
  assert.equal(f.draws, first);
  f.step(40);
  assert.ok(f.draws > first);
  f.button.click();
  assert.equal(f.frames.size, 0);
  assert.equal(f.button.getAttribute("aria-pressed"), "false");
  assert.equal(f.win.localStorage.getItem(MOTION_KEY), "off");
  f.button.click();
  assert.equal(f.frames.size, 1);
  f.win.dispatchEvent(new f.win.Event("resize"));
  assert.equal(f.frames.size, 1);
  f.dispose();
  assert.equal(f.frames.size, 0);
  f.button.click();
  assert.equal(f.frames.size, 0);
  f.win.happyDOM.abort();
});

test("hidden tabs and reduced motion stop drawing without losing the manual setting", () => {
  const f = fixture();
  f.setHidden(true);
  assert.equal(f.frames.size, 0);
  f.setHidden(false);
  assert.equal(f.frames.size, 1);
  f.setReduced(true);
  assert.equal(f.frames.size, 0);
  assert.equal(f.button.disabled, true);
  f.setReduced(false);
  assert.equal(f.frames.size, 1);
  f.win.dispatchEvent(new f.win.Event("pagehide"));
  assert.equal(f.frames.size, 0);
  f.win.dispatchEvent(new f.win.Event("pageshow"));
  assert.equal(f.frames.size, 1);
  f.dispose();
  f.win.happyDOM.abort();
  for (const config of [{ reduced: true }, { paused: true }]) {
    const quiet = fixture(config);
    assert.equal(quiet.frames.size, 0);
    assert.equal(quiet.button.getAttribute("aria-pressed"), "false");
    quiet.dispose();
    quiet.win.happyDOM.abort();
  }
});

test("unavailable canvas degrades to a plain background", () => {
  const f = fixture({ context: false });
  assert.equal(f.frames.size, 0);
  assert.equal(f.button.parentElement.hidden, true);
  assert.equal(f.win.document.querySelector("canvas").hidden, true);
  f.dispose();
  f.win.happyDOM.abort();
});
