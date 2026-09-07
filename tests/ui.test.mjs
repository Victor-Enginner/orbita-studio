import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { STORAGE_KEY } from "../src/state.js";

// Interaction checks do not substitute for browser layout inspection.
test("frontend workflows", async (t) => {
  const window = new Window({ url: "http://localhost:4173/" });
  for (const key of ["window", "document", "location", "FormData"])
    globalThis[key] = key === "window" ? window : window[key];
  globalThis.requestAnimationFrame = (fn) => fn();
  document.body.innerHTML =
    '<div id="app"></div><div id="overlay"></div><div id="toast"></div>';
  await import("../src/app.js");
  const $ = (selector) => document.querySelector(selector);
  const click = (selector) => {
    assert.ok($(selector), `Missing control: ${selector}`);
    $(selector).click();
  };
  const fill = (selector, value) => {
    $(selector).value = value;
    $(selector).dispatchEvent(new window.Event("input", { bubbles: true }));
  };
  const submit = (selector) =>
    $(selector).dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true }),
    );
  const go = (hash) => {
    window.location.hash = hash;
    window.dispatchEvent(new window.HashChangeEvent("hashchange"));
  };
  const saved = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY));

  await t.test("dashboard renders demo status and navigation", () => {
    assert.match(document.body.textContent, /O que vamos criar hoje/);
    assert.match(document.body.textContent, /Demonstração/);
    for (const route of ["agents", "profiles", "production", "settings"])
      assert.ok($(`a[href="#${route}"]`));
  });
  await t.test(
    "creation entry opens an editable briefing, preserves draft on cancel",
    () => {
      const idea =
        "Um vídeo sobre IA <script>\\nPesquisar exemplos antes de escrever.";
      fill("#idea-input", "   ");
      submit("#idea-form");
      assert.equal($("#task-form"), null);
      fill("#idea-input", idea);
      submit("#idea-form");
      assert.equal($('[name="title"]').value, "Um vídeo sobre IA <script>");
      assert.equal($('[name="brief"]').value, idea);
      assert.equal(document.querySelectorAll("script").length, 0);
      click('[data-action="close-modal"]');
      assert.equal($("#idea-input").value, idea);
      submit("#idea-form");
      fill('[name="title"]', "Piloto da nova interface");
      submit("#task-form");
      assert.equal(saved().tasks.at(-1).title, "Piloto da nova interface");
      assert.equal(saved().tasks.at(-1).brief, idea);
    },
  );
  let agentId;
  await t.test("create agent, edit function, escape user text", () => {
    go("agents");
    click('[data-action="new-agent"]');
    fill('[name="name"]', "Maya <script>");
    fill('[name="role"]', "Pesquisa editorial");
    fill('[name="mission"]', "Pesquisar conteúdos com fontes");
    fill('[name="output"]', "Briefing e fontes");
    submit("#agent-form");
    agentId = saved().agents.at(-1).id;
    assert.equal(saved().agents.at(-1).name, "Maya <script>");
    assert.equal(document.querySelectorAll("script").length, 0);
    click('[data-action="agent-tab"][data-tab="config"]');
    click(`[data-action="edit-agent"][data-id="${agentId}"]`);
    fill('[name="rules"]', "Não inventar números");
    submit("#agent-form");
    assert.equal(saved().agents.at(-1).rules, "Não inventar números");
  });
  await t.test("isolated chats and paused agents", () => {
    click('[data-action="agent-tab"][data-tab="chat"]');
    fill("#chat-input", "Minha ideia de vídeo");
    submit("#chat-form");
    assert.equal(saved().messages[agentId].length, 2);
    assert.match($(".messages").textContent, /resposta simulada/);
    click('[data-action="select-agent"][data-id="a1"]');
    assert.equal($(".messages").querySelectorAll(".message").length, 0);
    click(`[data-action="select-agent"][data-id="${agentId}"]`);
    assert.equal($(".messages").querySelectorAll(".message").length, 2);
    click('[data-action="agent-tab"][data-tab="config"]');
    click('[data-action="toggle-agent"]');
    click('[data-action="agent-tab"][data-tab="chat"]');
    assert.ok($("#chat-input").disabled);
  });
  let profileId;
  await t.test("editorial profile networks and team association", () => {
    go("profiles");
    click('[data-action="new-profile"]');
    fill('[name="name"]', "Teste editorial");
    fill('[name="niche"]', "Tecnologia");
    $('[name="platforms"][value="YouTube"]').checked = true;
    $(`[name="agentIds"][value="${agentId}"]`).checked = true;
    submit("#profile-form");
    const profile = saved().profiles.at(-1);
    profileId = profile.id;
    assert.deepEqual(profile.platforms, ["YouTube"]);
    assert.deepEqual(profile.agentIds, [agentId]);
    click(`[data-action="edit-profile"][data-id="${profileId}"]`);
    fill('[name="voice"]', "Direto e curioso");
    submit("#profile-form");
    assert.equal(saved().profiles.at(-1).voice, "Direto e curioso");
  });
  await t.test("create, move and filter content", () => {
    go("production");
    click('[data-action="new-task"]');
    fill('[name="title"]', "Meu piloto");
    $('[name="profileId"]').value = profileId;
    $('[name="agentId"]').value = agentId;
    fill('[name="brief"]', "Gravar o experimento pelo celular");
    submit("#task-form");
    const task = saved().tasks.at(-1);
    const stage = $(`[data-task-stage="${task.id}"]`);
    stage.value = "Em revisão";
    stage.dispatchEvent(new window.Event("change", { bubbles: true }));
    assert.equal(saved().tasks.at(-1).stage, "Em revisão");
    $("#profile-filter").value = profileId;
    $("#profile-filter").dispatchEvent(
      new window.Event("change", { bubbles: true }),
    );
    assert.equal(document.querySelectorAll(".task-card").length, 1);
    fill("#task-search", "não existe");
    assert.equal(document.querySelectorAll(".task-card").length, 0);
    go("overview");
    assert.match($(".review-list").textContent, /Meu piloto/);
  });
  await t.test("search and Escape dismissal", () => {
    click('[data-action="search"]');
    fill("#global-search", "Meu piloto");
    assert.equal(document.querySelectorAll(".search-result").length, 1);
    fill("#global-search", "não existe");
    assert.match($("#search-results").textContent, /Nenhum resultado/);
    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    assert.equal($("#overlay").children.length, 0);
    assert.equal($("#app").inert, false);
  });
  await t.test("cancelled forms preserve data", () => {
    const count = saved().agents.length;
    go("agents");
    click('[data-action="new-agent"]');
    fill('[name="name"]', "Descartado");
    click('[data-action="close-modal"]');
    assert.equal(saved().agents.length, count);
    assert.ok(
      window.localStorage.getItem(STORAGE_KEY).includes("Minha ideia de vídeo"),
    );
  });
  await window.happyDOM.close();
});
