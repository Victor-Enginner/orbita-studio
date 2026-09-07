import test from "node:test";
import assert from "node:assert/strict";
import {
  createSeed,
  validateState,
  loadState,
  moveTask,
  escapeHTML,
  simulationReply,
} from "../src/state.js";

test("workspace survives JSON export and import with its relationships", () => {
  const seed = createSeed();
  seed.messages.a1 = [{ role: "user", text: "Meu briefing" }];
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(seed))), seed);
});

test("import rejects invalid relationships, duplicate IDs, stages and color values", () => {
  for (const mutate of [
    (state) => {
      state.tasks[0].agentId = "missing";
    },
    (state) => {
      state.profiles[0].agentIds = ["missing"];
    },
    (state) => {
      state.tasks[0].stage = "Publicado";
    },
    (state) => {
      state.agents[0].id = state.agents[1].id;
    },
    (state) => {
      state.profiles[0].platforms = ["unknown"];
    },
    (state) => {
      state.messages.missing = [];
    },
    (state) => {
      state.agents[0].color = 'lime" onclick="alert(1)';
    },
    (state) => {
      state.activity[0].time = "bad date";
    },
  ]) {
    const state = createSeed();
    mutate(state);
    assert.throws(() => validateState(state));
  }
});

test("moving a card changes only the selected task and rejects invalid transitions", () => {
  const state = createSeed();
  const other = structuredClone(state.tasks[1]);
  moveTask(state, "t1", "Pronto");
  assert.equal(state.tasks[0].stage, "Pronto");
  assert.deepEqual(state.tasks[1], other);
  assert.throws(() => moveTask(state, "t1", "Publicando"));
  assert.throws(() => moveTask(state, "missing", "Pronto"));
});

test("unavailable or corrupt storage does not prevent opening the UI", () => {
  assert.ok(
    loadState({
      getItem() {
        throw new Error("blocked");
      },
    }).warning,
  );
  assert.ok(
    loadState({
      getItem() {
        return "{broken";
      },
    }).warning,
  );
  assert.equal(
    loadState({
      getItem() {
        return null;
      },
    }).data.agents.length,
    4,
  );
});

test("user content is escaped and simulation does not claim real execution", () => {
  assert.equal(
    escapeHTML('<img src=x onerror="bad()">'),
    "&lt;img src=x onerror=&quot;bad()&quot;&gt;",
  );
  const reply = simulationReply(
    createSeed().agents[0],
    "Pesquise as novidades",
  );
  assert.match(reply, /etapa de backend/);
  assert.match(reply, /Pesquise as novidades/);
});
