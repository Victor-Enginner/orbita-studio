import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { STORAGE_KEY } from "../src/state.js";

test("production room workflows preserve state and keep execution explicit", async (t) => {
  const window = new Window({ url: "http://localhost:4173/" });
  for (const key of ["window", "document", "location", "FormData"])
    globalThis[key] = key === "window" ? window : window[key];
  globalThis.requestAnimationFrame = (fn) => fn();
  document.body.innerHTML =
    '<div id="app"></div><div id="overlay"></div><div id="toast"></div>';
  await import("../src/app.js");
  const $ = (s) => document.querySelector(s);
  const click = (s) => {
    assert.ok($(s), s);
    $(s).click();
  };
  const fill = (s, v) => {
    $(s).value = v;
    $(s).dispatchEvent(new window.Event("input", { bubbles: true }));
  };
  const submit = (s) =>
    $(s).dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true }),
    );
  const change = (s) =>
    $(s).dispatchEvent(new window.Event("change", { bubbles: true }));
  const saved = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  const go = (hash) => {
    location.hash = hash;
    window.dispatchEvent(new window.HashChangeEvent("hashchange"));
  };

  await t.test("open room and block incomplete approval", () => {
    go("production");
    click('[data-action="open-room"][data-id="t1"]');
    window.dispatchEvent(new window.HashChangeEvent("hashchange"));
    assert.equal(document.querySelectorAll(".engine-step").length, 12);
    assert.match(document.body.textContent, /48 tarefas/);
    click('[data-engine="approve"]');
    assert.match($(".engine-feedback").textContent, /Preencha/);
  });
  await t.test(
    "save briefing, review and approve; next step is evidence",
    () => {
      fill('[name="audience"]', "Criadores interessados em IA");
      fill('[name="promise"]', "Mostrar um agente real em execução");
      fill('[name="angle"]', "Experimento próprio no celular");
      fill('[name="duration"]', "20");
      fill('[name="budget"]', "10");
      submit("#engine-stage-form");
      for (let i = 0; i < 3; i++) {
        const input = $(`[data-engine-check="${i}"]`);
        input.checked = true;
        change(`[data-engine-check="${i}"]`);
      }
      click('[data-engine="approve"]');
      assert.deepEqual(saved().production.t1.approved, ["brief"]);
      assert.match(
        $(".engine-stage-heading").textContent,
        /Fontes e evidências/,
      );
    },
  );
  await t.test("save evidence, edit source and preserve safe text", () => {
    click('[data-engine="tab"][data-tab="sources"]');
    fill('[name="title"]', "Registro <img>");
    fill('[name="claim"]', "Resultado observado");
    fill('[name="reference"]', "registro-01.txt");
    fill('[name="context"]', "Teste próprio registrado no celular");
    $('[name="verified"]').checked = true;
    submit("#engine-source-form");
    assert.equal(saved().production.t1.sources.length, 1);
    assert.equal(document.querySelectorAll("img").length, 0);
    click('[data-engine="edit-source"]');
    fill('[name="context"]', "Contexto revisado");
    submit("#engine-source-form");
    assert.equal(saved().production.t1.sources[0].context, "Contexto revisado");
  });
  await t.test(
    "storyboard records timing, costs and contextual prompts",
    () => {
      click('[data-engine="tab"][data-tab="scenes"]');
      fill('[name="title"]', "Abertura");
      fill('[name="duration"]', "20");
      fill('[name="cost"]', "2");
      fill('[name="visual"]', "Captura de tela do experimento");
      fill('[name="voice"]', "Veja o agente funcionando");
      fill('[name="asset"]', "take-01.mp4");
      fill('[name="rights"]', "Captura própria");
      $('[name="reviewed"]').checked = true;
      submit("#engine-scene-form");
      assert.equal(saved().production.t1.scenes[0].duration, 20);
      assert.equal(saved().production.t1.scenes[0].cost, 2);
      click('[data-engine="scene-prompt"]');
      assert.equal(saved().production.t1.prompts.length, 1);
      assert.match(saved().production.t1.prompts[0].text, /Abertura/);
      click('[data-engine="prompt-version"]');
      assert.equal(saved().production.t1.prompts.length, 2);
    },
  );
  await t.test(
    "catalog is explicit, notes are linked, metrics calculated from manual input",
    () => {
      click('[data-engine="tab"][data-tab="tools"]');
      assert.equal(document.querySelectorAll(".engine-tool-card").length, 7);
      assert.match(document.body.textContent, /não conectado/);
      click('[data-engine="tab"][data-tab="notes"]');
      fill('[name="text"]', "Revisar a abertura com Otto");
      submit("#engine-note-form");
      assert.equal(saved().production.t1.notes.length, 1);
      click('[data-engine="tab"][data-tab="results"]');
      fill('[name="views"]', "100");
      fill('[name="watch"]', "10");
      fill('[name="duration"]', "20");
      fill('[name="origin"]', "Teste de dados manuais");
      fill('[name="observation"]', "Somente exemplo de validação");
      submit("#engine-results-form");
      assert.equal($(".engine-result-number").textContent, "50.0%");
      assert.ok($('[data-engine="next-cycle"]').disabled);
    },
  );
  await t.test(
    "switching content isolates the production room and old records survive",
    () => {
      $("#engine-task-picker").value = "t2";
      change("#engine-task-picker");
      click('[data-engine="tab"][data-tab="scenes"]');
      assert.equal(document.querySelectorAll(".scene-record").length, 0);
      $("#engine-task-picker").value = "t1";
      change("#engine-task-picker");
      click('[data-engine="tab"][data-tab="scenes"]');
      assert.equal(document.querySelectorAll(".scene-record").length, 1);
      assert.equal(saved().tasks.length, 5);
      assert.equal(saved().agents.length, 4);
    },
  );
  await window.happyDOM.close();
});
