import test from "node:test";
import assert from "node:assert/strict";
import { createSeed, validateState } from "../src/state.js";
import { STEPS } from "../src/production/catalog.js";
import {
  getRun,
  currentStep,
  updateFields,
  issues,
  approve,
  requestRevision,
  resume,
  invalidateFrom,
  toSrt,
  totalCost,
  promptFor,
  makePackage,
} from "../src/production/engine.js";

function fixture() {
  const state = createSeed();
  const run = getRun(state, "t1");
  for (const step of STEPS) {
    for (const f of step.fields)
      run.values[f.key] =
        f.type === "number" ? "90" : `Entrega documentada: ${f.label}`;
    run.checks[step.id] = [0, 1, 2];
  }
  run.sources = [
    {
      id: "source1",
      title: "Registro",
      claim: "O experimento foi executado",
      reference: "registro-01.txt",
      context: "Medição própria de laboratório",
      verified: true,
    },
  ];
  run.scenes = [
    {
      id: "scene1",
      title: "Demonstração",
      duration: 90,
      cost: 5,
      visual: "Captura de tela",
      voice: "Veja o experimento.",
      tool: "own",
      asset: "captura-01.mp4",
      rights: "Gravação própria",
      reviewed: true,
    },
  ];
  return { state, run };
}

test("empty inputs block approval and dependencies prevent skipping stages", () => {
  const state = createSeed();
  const run = getRun(state, "t1");
  assert.ok(issues(run, 0).length > 0);
  assert.equal(approve(run, 0).ok, false);
  assert.throws(() => approve(run, 3), /ordem/);
  assert.equal(run.approved.length, 0);
});
test("12 stages and 48 tasks complete in order with independent snapshots", () => {
  const { state, run } = fixture();
  assert.equal(STEPS.length, 12);
  assert.equal(
    STEPS.reduce((sum, s) => sum + s.tasks.length, 0),
    48,
  );
  for (let i = 0; i < 12; i++) assert.equal(approve(run, i).ok, true);
  assert.equal(currentStep(run), -1);
  assert.equal(run.versions.length, 12);
  assert.doesNotThrow(() => validateState(JSON.parse(JSON.stringify(state))));
  run.values.script = "changed";
  assert.notEqual(run.versions[0].values.script, "changed");
});
test("upstream changes invalidate downstream approvals and review checks", () => {
  const { run } = fixture();
  for (let i = 0; i < 5; i++) approve(run, i);
  updateFields(run, 1, {
    claims: "Nova afirmação",
    uncertainties: "A conferir",
  });
  assert.deepEqual(run.approved, ["brief"]);
  assert.deepEqual(run.checks.research, []);
  assert.equal(currentStep(run), 1);
  assert.equal(run.versions.length, 5);
});
test("evidence, timing, assets and budget are real approval gates", () => {
  const { run } = fixture();
  run.sources[0].verified = false;
  assert.ok(issues(run, 1).some((s) => s.includes("evidência")));
  run.scenes[0].duration = 40;
  assert.ok(issues(run, 4).some((s) => s.includes("duração")));
  run.scenes[0].asset = "";
  assert.ok(issues(run, 5).some((s) => s.includes("mídia")));
  run.values.budget = "2";
  assert.ok(issues(run, 10).some((s) => s.includes("excede")));
});
test("bounded revision loop pauses after three rejections and requires a new approach", () => {
  const { run } = fixture();
  for (let i = 0; i < 3; i++)
    requestRevision(run, 0, "Refazer a promessa com evidência");
  assert.equal(run.blocked, true);
  assert.throws(() => approve(run, 0), /Retome/);
  assert.throws(() => resume(run, ""), /abordagem/);
  resume(run, "Usar uma demonstração própria");
  assert.equal(run.blocked, false);
  assert.equal(run.paused, false);
});
test("scene change invalidates storyboard and downstream, keeping earlier evidence", () => {
  const { run } = fixture();
  for (let i = 0; i < 8; i++) approve(run, i);
  invalidateFrom(run, 4, "Cenas alteradas");
  assert.equal(run.approved.length, 4);
  assert.equal(currentStep(run), 4);
});
test("exports use real planning values and do not claim native editor integration", () => {
  const { state, run } = fixture();
  run.scenes[0].duration = 1.5;
  run.scenes.push({
    ...run.scenes[0],
    id: "scene2",
    duration: 2,
    voice: "Segunda cena.",
  });
  const srt = toSrt(run);
  assert.match(srt, /00:00:00,000 --> 00:00:01,500/);
  assert.match(srt, /00:00:01,500 --> 00:00:03,500/);
  assert.equal(totalCost(run), 10);
  assert.match(
    makePackage(run, state.tasks[0], state.profiles[0]),
    /Não é projeto nativo CapCut/,
  );
  assert.match(
    promptFor(run, 0, state.tasks[0], state.profiles[0]),
    /não foi executado por um modelo/,
  );
});
test("old workspaces migrate without losing data; invalid engine imports are rejected", () => {
  const legacy = createSeed();
  assert.doesNotThrow(() => validateState(legacy));
  const previous = structuredClone(legacy.tasks);
  getRun(legacy, "t1");
  assert.deepEqual(legacy.tasks, previous);
  for (const mutate of [
    (r) => {
      r.approved = ["script"];
    },
    (r) => {
      r.scenes[0].duration = -1;
    },
    (r) => {
      r.checks.brief = [0, 0];
    },
    (r) => {
      r.owner = "missing";
    },
    (r) => {
      r.history = [{ time: "invalid", message: "entry" }];
    },
    (r) => {
      r.versions = [
        {
          step: "brief",
          time: new Date().toISOString(),
          values: {},
          sources: [],
          scenes: [{}],
        },
      ];
    },
  ]) {
    const { state, run } = fixture();
    mutate(run);
    assert.throws(() => validateState(state));
  }
});
