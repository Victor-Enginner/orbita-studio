import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { createSeed, STORAGE_KEY } from "../src/state.js";
import { STEPS } from "../src/production/catalog.js";
import { getRun, approve } from "../src/production/engine.js";

test("completed cycle creates a fresh experiment and browser navigation preserves drafts", async () => {
  const data = createSeed();
  const r = getRun(data, "t1");
  for (const step of STEPS) {
    for (const f of step.fields)
      r.values[f.key] = f.type === "number" ? "30" : `Material de ${f.label}`;
    r.checks[step.id] = [0, 1, 2];
  }
  r.values.nextHypothesis = "Testar uma abertura com a demonstração primeiro";
  r.sources = [
    {
      id: "s1",
      title: "Registro",
      claim: "Resultado",
      reference: "arquivo.txt",
      context: "Teste documentado",
      verified: true,
    },
  ];
  r.scenes = [
    {
      id: "c1",
      title: "Cena",
      visual: "Tela própria",
      voice: "Narração",
      duration: 30,
      cost: 0,
      tool: "own",
      asset: "take.mp4",
      rights: "Próprio",
      reviewed: true,
    },
  ];
  for (let i = 0; i < 12; i++) assert.ok(approve(r, i).ok);
  const window = new Window({ url: "http://localhost:4173/#engine" });
  for (const key of ["window", "document", "location", "FormData"])
    globalThis[key] = key === "window" ? window : window[key];
  globalThis.requestAnimationFrame = (fn) => fn();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  document.body.innerHTML =
    '<div id="app"></div><div id="overlay"></div><div id="toast"></div>';
  await import("../src/app.js");
  document.querySelector('[data-engine="tab"][data-tab="results"]').click();
  const next = document.querySelector('[data-engine="next-cycle"]');
  assert.equal(next.disabled, false);
  next.click();
  const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  const newTask = saved.tasks.at(-1);
  const newRun = saved.production[newTask.id];
  assert.equal(saved.tasks.length, 6);
  assert.equal(newTask.stage, "Ideias");
  assert.equal(newRun.cycle, 2);
  assert.equal(newRun.values.angle, r.values.nextHypothesis);
  assert.deepEqual(newRun.approved, []);
  assert.deepEqual(newRun.sources, []);
  assert.deepEqual(newRun.scenes, []);
  assert.equal(saved.production.t1.approved.length, 12);
  assert.equal(saved.production.t1.versions.length, 12);
  const audience = document.querySelector('[name="audience"]');
  audience.value = "Novo público do experimento";
  audience.dispatchEvent(new window.Event("input", { bubbles: true }));
  window.location.hash = "overview";
  window.dispatchEvent(new window.HashChangeEvent("hashchange"));
  const restored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  assert.equal(
    restored.production[newTask.id].values.audience,
    "Novo público do experimento",
  );
  assert.equal(restored.production.t1.values.audience, r.values.audience);
  await window.happyDOM.close();
});
