import { icon } from "../icons.js";
import { escapeHTML as e, uid } from "../state.js";
import { STEPS, TOOLS } from "./catalog.js";
import {
  getRun,
  createRun,
  currentStep,
  record,
  updateFields,
  invalidateFrom,
  issues,
  approve,
  requestRevision,
  resume,
  readiness,
  totalDuration,
  totalCost,
  promptFor,
  scenePrompt,
  toSrt,
  makePackage,
} from "./engine.js";

export function createProductionUI({
  getState,
  persist,
  rerender,
  navigate,
  toast,
  openAgent,
}) {
  let selected = "";
  let tab = "flow";
  let stepIndex = 0;
  let feedback = [];
  let sceneEdit = "";
  let sourceEdit = "";
  let dirty = false;
  const state = () => getState();
  const task = () =>
    state().tasks.find((t) => t.id === selected) || state().tasks[0];
  const run = () => getRun(state(), task().id);
  const profile = () =>
    state().profiles.find((p) => p.id === task()?.profileId);
  const btn = (
    label,
    action,
    glyph = "plus",
    style = "secondary",
    attrs = "",
  ) =>
    `<button type="button" class="button ${style}" data-engine="${action}" ${attrs}>${icon(glyph)}${label}</button>`;
  const field = (label, name, value = "", hint = "", type = "textarea") =>
    `<label class="field">${e(label)}${type === "textarea" ? `<textarea name="${name}" rows="4" maxlength="16000" placeholder="${e(hint)}">${e(value)}</textarea>` : `<input name="${name}" type="${type === "number" ? "number" : "text"}" ${type === "number" ? 'min="0" step="any" max="1000000"' : ""} maxlength="16000" value="${e(value)}" placeholder="${e(hint)}" />`}</label>`;
  const tag = (label, cls = "") =>
    `<span class="badge ${cls}">${e(label)}</span>`;
  const blank = (title, text) =>
    `<div class="engine-empty">${icon("layers")}<h3>${e(title)}</h3><p>${e(text)}</p></div>`;
  function save(message) {
    const ok = persist(message);
    dirty = false;
    return ok;
  }
  function download(name, content, type = "text/plain;charset=utf-8") {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Arquivo preparado para download.");
  }
  function commitDraft() {
    const form = document.querySelector("#engine-stage-form");
    if (!form || !task()) return false;
    const values = Object.fromEntries(new FormData(form));
    const changed = updateFields(run(), stepIndex, values);
    if (changed) {
      form.querySelectorAll("[data-engine-check]").forEach((c) => {
        c.checked = false;
      });
      save();
    }
    dirty = false;
    return changed;
  }
  function open(id) {
    commitDraft();
    selected = id;
    const next = currentStep(run());
    stepIndex = next === -1 ? 11 : next;
    tab = "flow";
    feedback = [];
    sceneEdit = "";
    sourceEdit = "";
    navigate("engine");
  }
  function render() {
    if (!task())
      return `<div class="page-heading"><div><p class="eyebrow">PRODUCTION ENGINE</p><h1>Sua próxima criação começa aqui.</h1><p class="subtitle">Crie um conteúdo no quadro para abrir um ciclo guiado.</p></div></div><a href="#production" class="button primary">Ir para produção ${icon("arrow")}</a>`;
    selected = task().id;
    const r = run();
    const current = currentStep(r);
    const status = r.blocked
      ? "Replanejamento necessário"
      : r.paused
        ? "Ciclo pausado"
        : current === -1
          ? "Ciclo concluído"
          : "Ciclo em andamento";
    return `<div class="page-heading"><div><p class="eyebrow">ÓRBITA / PRODUCTION ENGINE</p><h1>Uma ideia. Um processo inteiro.</h1><p class="subtitle">Direção criativa, evidências e decisões que acompanham cada corte.</p></div>${btn("Pacote de montagem", "export-package", "download", "primary")}</div>
    <section class="engine-masthead"><div class="engine-masthead-copy"><span class="hero-kicker"><span class="live-dot"></span>CRIAÇÃO COM CRITÉRIO</span><h2>${e(task().title)}</h2><p>${e(profile()?.name || "Perfil ainda não associado")} <span>·</span> ${e(task().format)} <span>·</span> Ciclo ${r.cycle}</p><div class="engine-tags">${tag(status, r.blocked ? "warm" : "green")}${tag("Operação local · revisão humana")}</div></div><div class="engine-progress"><strong>${String(r.approved.length).padStart(2, "0")}<span>/12</span></strong><p>etapas aprovadas</p><progress value="${r.approved.length}" max="12" aria-label="Etapas aprovadas"></progress></div></section>
    <div class="engine-toolbar"><label>Conteúdo<select id="engine-task-picker">${state()
      .tasks.map(
        (t) =>
          `<option value="${t.id}" ${t.id === selected ? "selected" : ""}>${e(t.title)}</option>`,
      )
      .join(
        "",
      )}</select></label><label>Responsável pelo ciclo<select id="engine-owner"><option value="">Operador</option>${state()
      .agents.map(
        (a) =>
          `<option value="${a.id}" ${r.owner === a.id ? "selected" : ""}>${e(a.name)} · ${e(a.role)}</option>`,
      )
      .join(
        "",
      )}</select></label><div class="engine-toolbar-actions">${r.owner ? btn("Abrir agente", "open-agent", "chat") : ""}${btn(r.paused || r.blocked ? "Retomar" : "Pausar", r.paused || r.blocked ? "resume" : "pause", r.paused || r.blocked ? "play" : "pause")}</div></div>
    <nav class="engine-tabs" aria-label="Áreas da sala de criação">${[
      ["flow", "board", "Etapas"],
      ["sources", "search", "Evidências"],
      ["scenes", "video", "Storyboard"],
      ["prompts", "spark", "Prompts"],
      ["tools", "settings", "Ferramentas"],
      ["notes", "chat", "Discussão"],
      ["results", "pulse", "Aprendizado"],
      ["history", "clock", "Histórico"],
    ]
      .map(
        ([id, glyph, label]) =>
          `<button type="button" data-engine="tab" data-tab="${id}" class="${tab === id ? "active" : ""}" ${tab === id ? 'aria-current="page"' : ""}>${icon(glyph)}${label}</button>`,
      )
      .join("")}</nav>
    <div class="engine-content">${{ flow, sources, scenes, prompts, tools, notes, results, history }[tab]()}</div>
    <p class="engine-disclosure">${icon("info")}O motor organiza tarefas e valida os registros. Geração, edição de mídia e publicação acontecem nas ferramentas externas; nenhuma conexão está ativa.</p>`;
  }
  function flow() {
    const r = run();
    const current = currentStep(r);
    const step = STEPS[stepIndex];
    const locked = current !== -1 && stepIndex > current;
    const approved = r.approved.includes(step.id);
    return `<div class="engine-flow"><aside class="engine-steps"><div class="engine-section-label"><span>LINHA DE PRODUÇÃO</span>${tag("48 tarefas")}</div>${STEPS.map((s, i) => `<button type="button" data-engine="step" data-step="${i}" class="engine-step ${i === stepIndex ? "selected" : ""} ${r.approved.includes(s.id) ? "done" : ""}" ${i === stepIndex ? 'aria-current="step"' : ""}><span class="step-number">${r.approved.includes(s.id) ? icon("check") : String(i + 1).padStart(2, "0")}</span><span><strong>${s.title}</strong><small>${s.role}</small></span>${i === current ? '<span class="live-dot"></span>' : ""}</button>`).join("")}</aside>
    <section class="engine-stage"><div class="engine-stage-heading"><div><p class="eyebrow">ETAPA ${String(stepIndex + 1).padStart(2, "0")} / ${step.role.toUpperCase()}</p><h2>${step.title}</h2><p>Entrega: ${step.output}</p></div>${tag(approved ? "Aprovada" : locked ? "Depende da etapa anterior" : "Em desenvolvimento", approved ? "green" : "")}</div>
    ${r.blocked ? '<div class="engine-warning">Três devoluções nesta abordagem. Use Retomar e registre o que será diferente para continuar.</div>' : ""}
    ${locked ? '<div class="engine-warning">Você pode planejar esta etapa. A aprovação depende da conclusão das anteriores.</div>' : ""}
    <div class="engine-task-list">${step.tasks.map((t, i) => `<div><span>${String(i + 1).padStart(2, "0")}</span>${e(t)}</div>`).join("")}</div>
    <form id="engine-stage-form"><div class="engine-fields">${step.fields.map((f) => field(f.label, f.key, r.values[f.key], f.hint, f.type)).join("")}</div><div class="engine-save-row"><span id="engine-save-status">Rascunho local · salvo ao trocar de área</span><button type="submit" class="button secondary">${icon("check")}Salvar rascunho</button></div></form>
    ${stepIndex === 1 ? `<div class="engine-related">${icon("search")} ${r.sources.length} evidências cadastradas ${btn("Abrir evidências", "tab", "arrow", "secondary", 'data-tab="sources"')}</div>` : ""}
    ${[4, 5].includes(stepIndex) ? `<div class="engine-related">${icon("video")} ${r.scenes.length} cenas · ${totalDuration(r)} s · R$ ${totalCost(r).toFixed(2)} ${btn("Abrir storyboard", "tab", "arrow", "secondary", 'data-tab="scenes"')}</div>` : ""}
    ${stepIndex === 3 && r.values.script ? `<p class="engine-reading">${r.values.script.trim().split(/\s+/).length} palavras · estimativa de ${Math.round((r.values.script.trim().split(/\s+/).length / 150) * 60)} s a 150 palavras/min. Confirme com leitura real.</p>` : ""}
    <section class="engine-gate"><div class="engine-section-label"><span>REVISÃO DO OPERADOR</span>${tag(`${readiness(r, stepIndex)}% preenchido`)}</div><p>Preenchimento não comprova veracidade. Confira o material antes de marcar.</p>${step.checks.map((c, i) => `<label class="engine-check"><input type="checkbox" data-engine-check="${i}" ${r.checks[step.id]?.includes(i) ? "checked" : ""} />${e(c)}</label>`).join("")}
    ${feedback.length ? `<div class="engine-feedback" role="status"><strong>O que precisa de atenção</strong><ul>${feedback.map((x) => `<li>${e(x)}</li>`).join("")}</ul></div>` : ""}
    <div class="engine-gate-actions">${btn("Verificar entrada", "validate", "search")}${btn("Aprovar e avançar", "approve", "arrow", "primary", `${locked || approved || r.paused || r.blocked ? "disabled" : ""}`)}</div><details class="revision-details"><summary>Devolver para correção · ${r.attempts[step.id] || 0}/3</summary><label class="field">Motivo e correção esperada<textarea id="revision-reason" rows="3" maxlength="4000" placeholder="O que precisa mudar e qual evidência demonstrará a correção?"></textarea></label>${btn("Registrar devolução", "revise", "edit")}</details></section></section></div>`;
  }
  function sources() {
    const r = run();
    const s = r.sources.find((s) => s.id === sourceEdit) || {};
    return `<div class="engine-section-intro"><div><p class="eyebrow">QUALIDADE DA ENTRADA</p><h2>Afirmações precisam de lastro.</h2><p>Registre a fonte, o contexto e o que ela realmente sustenta.</p></div>${tag(`${r.sources.filter((s) => s.verified).length}/${r.sources.length} conferidas`)}</div><div class="engine-two-columns"><section class="engine-panel"><h3>${sourceEdit ? "Editar evidência" : "Nova evidência"}</h3><form id="engine-source-form">${field("Título", "title", s.title, "Ex.: Registro do experimento", "input")}${field("Afirmação sustentada", "claim", s.claim, "O que essa fonte permite afirmar?")}${field("Referência", "reference", s.reference, "URL http(s) ou identificação de arquivo/registro próprio", "input")}${field("Contexto e data", "context", s.context, "Data da consulta, trecho relevante, limites e origem do registro.")}<label class="engine-check"><input type="checkbox" name="verified" ${s.verified ? "checked" : ""} />Conferi esta evidência e seu contexto</label><button class="button primary" type="submit">${icon("check")}Salvar evidência</button>${sourceEdit ? btn("Cancelar edição", "cancel-source", "close") : ""}</form></section><section class="engine-record-list">${r.sources.map((s) => `<article class="engine-record"><div class="engine-section-label"><h3>${e(s.title)}</h3>${tag(s.verified ? "Conferida pelo operador" : "Pendente", s.verified ? "green" : "warm")}</div><p>${e(s.claim)}</p><p class="source-reference">${e(s.reference)}</p><p class="muted">${e(s.context)}</p>${btn("Editar", "edit-source", "edit", "secondary", `data-id="${s.id}"`)}</article>`).join("") || blank("Construa seu dossiê", "Links e registros próprios cabem aqui. Nenhuma fonte é verificada automaticamente.")}</section></div>`;
  }
  function scenes() {
    const r = run();
    const s = r.scenes.find((s) => s.id === sceneEdit) || {};
    return `<div class="engine-section-intro"><div><p class="eyebrow">DIREÇÃO VISUAL</p><h2>Planeje o que entra em cada segundo.</h2><p>${totalDuration(r)} s de ${e(r.values.duration)} s planejados · R$ ${totalCost(r).toFixed(2)} de R$ ${Number(r.values.budget || 0).toFixed(2)} de teto</p></div>${btn("Exportar SRT planejado", "export-srt", "download")}</div><div class="scene-timeline" aria-label="Sequência de cenas">${r.scenes.map((s, i) => `<button type="button" data-engine="edit-scene" data-id="${s.id}" style="flex-grow:${Math.max(1, s.duration)}"><span>${String(i + 1).padStart(2, "0")}</span><strong>${e(s.title)}</strong><small>${s.duration}s</small></button>`).join("") || "<p>Adicione cenas para construir a sequência.</p>"}</div>
    <div class="engine-two-columns"><section class="engine-panel"><h3>${sceneEdit ? "Editar cena" : "Nova cena"}</h3><form id="engine-scene-form">${field("Nome da cena", "title", s.title, "Ex.: Demonstração inicial", "input")}<div class="form-row">${field("Duração (segundos)", "duration", s.duration ?? "10", "", "number")}${field("Custo acumulado desta cena (R$)", "cost", s.cost ?? "0", "Inclua tentativas descartadas", "number")}</div>${field("Descrição visual", "visual", s.visual, "Plano, ação, câmera, luz e elementos essenciais.")}${field("Narração / texto da cena", "voice", s.voice, "O texto que acompanha esta cena.")}<label class="field">Ferramenta pretendida<select name="tool"><option value="own">Captura / edição própria</option>${TOOLS.map((t) => `<option value="${t.id}" ${s.tool === t.id ? "selected" : ""}>${t.name}</option>`).join("")}</select></label>${field("Referência da mídia selecionada", "asset", s.asset, "Ex.: cena-01-take-03.mp4; arquivo mantido no editor", "input")}${field("Origem e permissão de uso", "rights", s.rights, "Material próprio, licença, autorização ou condições do fornecedor.")}<label class="engine-check"><input type="checkbox" name="reviewed" ${s.reviewed ? "checked" : ""} />Conferi a mídia e suas condições de uso</label><button class="button primary" type="submit">${icon("check")}Salvar cena</button>${sceneEdit ? btn("Cancelar edição", "cancel-scene", "close") : ""}</form></section><section class="engine-record-list">${r.scenes.map((s, i) => `<article class="engine-record scene-record"><div class="engine-section-label"><span class="scene-index">${String(i + 1).padStart(2, "0")}</span><h3>${e(s.title)}</h3>${tag(`${s.duration}s`)}</div><p>${e(s.visual)}</p><blockquote>${e(s.voice)}</blockquote><p class="muted">${e(TOOLS.find((t) => t.id === s.tool)?.name || "Material próprio")} · ${e(s.asset || "Mídia pendente")} · R$ ${s.cost.toFixed(2)}</p><div class="engine-record-actions">${btn("Editar", "edit-scene", "edit", "secondary", `data-id="${s.id}"`)}${btn("Prompt da cena", "scene-prompt", "spark", "secondary", `data-id="${s.id}"`)}${i > 0 ? btn("Subir", "scene-up", "upload", "secondary", `data-id="${s.id}"`) : ""}</div></article>`).join("") || blank("Seu storyboard está vazio", "Cadastre planos com duração, narrativa e origem das mídias. Arquivos de vídeo permanecem fora do navegador nesta versão.")}</section></div><p class="engine-disclosure">O SRT usa a duração planejada das cenas; revise a sincronização com o áudio final no editor.</p>`;
  }
  function prompts() {
    return `<div class="engine-section-intro"><div><p class="eyebrow">INSTRUÇÕES COM CONTEXTO</p><h2>Cada etapa recebe o briefing certo.</h2><p>Templates montados com seus registros. Compare versões e copie para a ferramenta escolhida.</p></div>${btn("Criar versão da etapa", "prompt-version", "spark", "primary")}</div><label class="field">Etapa do prompt<select id="prompt-step">${STEPS.map((s, i) => `<option value="${i}" ${i === stepIndex ? "selected" : ""}>${i + 1}. ${s.title}</option>`).join("")}</select></label><div class="engine-two-columns"><section class="engine-panel"><h3>Preview do prompt</h3><textarea class="prompt-preview" readonly aria-label="Prompt contextual da etapa">${e(promptFor(run(), stepIndex, task(), profile()))}</textarea>${btn("Baixar prompt", "download-prompt", "download")}</section><section class="engine-record-list">${
      run()
        .prompts.map(
          (p, i) =>
            `<details class="engine-record"><summary>Versão ${run().prompts.length - i} · ${e(p.step)}<small>${new Date(p.time).toLocaleString("pt-BR")}</small></summary><pre>${e(p.text)}</pre></details>`,
        )
        .join("") ||
      blank(
        "Histórico de prompts",
        "Crie uma versão para preservar o contexto e as instruções usados neste momento.",
      )
    }</section></div>`;
  }
  function tools() {
    return `<div class="engine-section-intro"><div><p class="eyebrow">FERRAMENTAS / PESQUISA DE 07.09.2026</p><h2>Uma rota clara para cada entrega.</h2><p>Catálogo de opções verificadas em fontes oficiais. Nenhuma ferramenta foi instalada ou conectada.</p></div></div><div class="engine-tool-grid">${TOOLS.map((t) => `<article class="engine-tool-card"><div class="engine-section-label">${tag(t.kind)}${icon("diagonal")}</div><h3>${t.name}</h3><p class="tool-stage">${t.stage}</p><p>${e(t.route)}</p><dl><dt>Condição / licença</dt><dd>${e(t.license)}</dd><dt>Custo a considerar</dt><dd>${e(t.cost)}</dd><dt>Estado no Órbita</dt><dd>${e(t.readiness)} · não conectado</dd></dl><p class="tool-note">${e(t.note)}</p><a class="text-link" href="${t.url}" target="_blank" rel="noopener noreferrer">Fonte oficial ${icon("diagonal")}</a>${t.source ? ` <a class="text-link" href="${t.source}" target="_blank" rel="noopener noreferrer">Condições ${icon("diagonal")}</a>` : ""}</article>`).join("")}</div>`;
  }
  function notes() {
    return `<div class="engine-section-intro"><div><p class="eyebrow">DISCUSSÃO DO CONTEÚDO</p><h2>Decisões que ficam com o projeto.</h2><p>Registre feedback e instruções para sua equipe. Não há respostas automáticas nesta área.</p></div></div><div class="engine-two-columns"><section class="engine-panel"><form id="engine-note-form">${field("Nota / briefing para o responsável", "text", "", "O que precisa ser decidido ou corrigido neste conteúdo?")}<button type="submit" class="button primary">${icon("send")}Registrar nota</button></form></section><section class="engine-record-list">${
      run()
        .notes.map(
          (n) =>
            `<article class="engine-record"><div class="engine-section-label"><strong>${e(n.author)}</strong><small>${new Date(n.time).toLocaleString("pt-BR")}</small></div><p>${e(n.text)}</p></article>`,
        )
        .join("") ||
      blank(
        "O contexto mora aqui",
        "Suas notas ficam associadas a este vídeo, em vez de se perderem nas conversas gerais.",
      )
    }</section></div>`;
  }
  function results() {
    const m = run().metrics;
    const ratio =
      m.watch !== "" && Number(m.duration) > 0
        ? (Number(m.watch) / Number(m.duration)) * 100
        : null;
    return `<div class="engine-section-intro"><div><p class="eyebrow">OBSERVAR → APRENDER → TESTAR</p><h2>O próximo vídeo começa no aprendizado.</h2><p>Métricas e feedback são inseridos por você. Não há sincronização com redes.</p></div>${btn("Criar próximo experimento", "next-cycle", "plus", "primary", currentStep(run()) !== -1 ? "disabled" : "")}</div><div class="engine-two-columns"><section class="engine-panel"><h3>Registro de resultado</h3><form id="engine-results-form"><div class="form-row">${field("Visualizações", "views", m.views, "Opcional", "number")}${field("Duração média assistida (s)", "watch", m.watch, "Opcional", "number")}</div>${field("Duração do vídeo medido (s)", "duration", m.duration, "Opcional", "number")}${field("Origem e janela de medição", "origin", m.origin, "Ex.: YouTube Studio, 48 horas após publicação. Ou revisão interna sem publicação.")}${field("Observação e limitações", "observation", m.observation, "Descreva o que você observou; não invente métricas.")}<button class="button primary" type="submit">${icon("check")}Salvar observação</button></form></section><section class="engine-panel"><p class="eyebrow">REGISTROS DESTE VÍDEO</p><div class="engine-result-number">${ratio === null ? "—" : `${ratio.toFixed(1)}%`}</div><p>Relação entre duração média assistida e duração do vídeo. Pode superar 100% em reproduções repetidas; não mede causalidade.</p><div class="engine-result-cost"><span>Custo acumulado das cenas</span><strong>R$ ${totalCost(run()).toFixed(2)}</strong><small>Teto do briefing: R$ ${Number(run().values.budget || 0).toFixed(2)}</small></div><p>Depois de aprovar as 12 etapas, “Criar próximo experimento” abre um novo cartão com a hipótese. O ciclo anterior permanece intacto.</p></section></div>`;
  }
  function history() {
    return `<div class="engine-section-intro"><div><p class="eyebrow">RASTREABILIDADE</p><h2>O que mudou, por quê e quando.</h2><p>Até 100 eventos e as 36 aprovações mais recentes por conteúdo.</p></div>${btn("Exportar ciclo JSON", "export-run", "download")}</div><div class="engine-two-columns"><section class="engine-record-list">${
      run()
        .history.map(
          (h) =>
            `<article class="engine-record"><small>${new Date(h.time).toLocaleString("pt-BR")}</small><p>${e(h.message)}</p></article>`,
        )
        .join("") ||
      blank(
        "Nenhum evento ainda",
        "Salvamentos, revisões e aprovações aparecerão aqui.",
      )
    }</section><section class="engine-record-list">${
      run()
        .versions.map(
          (v) =>
            `<details class="engine-record"><summary>${e(STEPS.find((s) => s.id === v.step)?.title || v.step)}<small>${new Date(v.time).toLocaleString("pt-BR")} · versão aprovada</small></summary><pre>${e(JSON.stringify({ values: v.values, sources: v.sources, scenes: v.scenes }, null, 2))}</pre></details>`,
        )
        .join("") ||
      blank(
        "Versões aprovadas",
        "Cada aprovação preserva uma cópia das entradas, evidências e cenas.",
      )
    }</section></div>`;
  }
  // Draft fields are flushed before local navigation, without running a model.
  document.addEventListener(
    "click",
    (event) => {
      if (
        event.target.closest(
          'a[href^="#"], [data-action="navigate"], [data-action="search"]',
        )
      )
        commitDraft();
      const button = event.target.closest("[data-engine]");
      if (!button) return;
      const action = button.dataset.engine;
      try {
        const changed = commitDraft();
        const r = run();
        if (action === "tab") {
          tab = button.dataset.tab;
          feedback = [];
        } else if (action === "step") {
          stepIndex = Number(button.dataset.step);
          feedback = [];
        } else if (action === "validate") {
          feedback = issues(r, stepIndex);
          if (!feedback.length)
            feedback = [
              "Entradas preenchidas e revisão registrada. Você pode aprovar esta etapa.",
            ];
        } else if (action === "approve") {
          if (changed) {
            feedback = ["O rascunho mudou. Refaça a revisão antes de aprovar."];
          } else {
            const result = approve(r, stepIndex);
            feedback = result.problems || [];
            if (result.ok) {
              save(
                `Etapa aprovada: ${STEPS[stepIndex].title} · ${task().title}`,
              );
              if (!result.complete) stepIndex = currentStep(r);
              toast(
                result.complete
                  ? "Ciclo concluído. Registre o próximo experimento."
                  : "Etapa aprovada. Próxima entrega liberada.",
              );
            }
          }
        } else if (action === "revise") {
          requestRevision(
            r,
            stepIndex,
            document.querySelector("#revision-reason").value,
          );
          save();
          feedback = [];
        } else if (action === "pause") {
          r.paused = true;
          record(r, "Ciclo pausado pelo operador.");
          save();
        } else if (action === "resume") {
          const reason = r.blocked
            ? window.prompt(
                "Qual mudança de abordagem permite retomar este ciclo?",
              )
            : "";
          if (reason === null) return;
          resume(r, reason);
          save();
        } else if (action === "open-agent") {
          openAgent(r.owner);
          return;
        } else if (action === "edit-source") {
          sourceEdit = button.dataset.id;
        } else if (action === "cancel-source") {
          sourceEdit = "";
        } else if (action === "edit-scene") {
          sceneEdit = button.dataset.id;
        } else if (action === "cancel-scene") {
          sceneEdit = "";
        } else if (action === "scene-up") {
          const i = r.scenes.findIndex((s) => s.id === button.dataset.id);
          if (i > 0) {
            [r.scenes[i - 1], r.scenes[i]] = [r.scenes[i], r.scenes[i - 1]];
            invalidateFrom(r, 4, "Ordem das cenas alterada.");
            record(r, "Storyboard reordenado.");
            save();
          }
        } else if (action === "scene-prompt") {
          const s = r.scenes.find((s) => s.id === button.dataset.id);
          r.prompts.unshift({
            time: new Date().toISOString(),
            step: `Cena: ${s.title}`,
            text: scenePrompt(r, s),
          });
          r.prompts = r.prompts.slice(0, 30);
          save();
          tab = "prompts";
        } else if (action === "prompt-version") {
          r.prompts.unshift({
            time: new Date().toISOString(),
            step: STEPS[stepIndex].title,
            text: promptFor(r, stepIndex, task(), profile()),
          });
          r.prompts = r.prompts.slice(0, 30);
          record(r, `Prompt versionado: ${STEPS[stepIndex].title}`);
          save();
        } else if (action === "download-prompt") {
          download(
            `orbita-${selected}-prompt.txt`,
            promptFor(r, stepIndex, task(), profile()),
          );
          return;
        } else if (action === "export-package") {
          download(
            `orbita-${selected}-montagem.md`,
            makePackage(r, task(), profile()),
            "text/markdown;charset=utf-8",
          );
          return;
        } else if (action === "export-run") {
          download(
            `orbita-${selected}-ciclo.json`,
            JSON.stringify(
              {
                kind: "orbita-production-cycle",
                version: 1,
                task: task(),
                profile: profile(),
                run: r,
              },
              null,
              2,
            ),
            "application/json",
          );
          return;
        } else if (action === "export-srt") {
          if (!r.scenes.length)
            throw new Error("Adicione cenas antes de exportar legendas.");
          download(`orbita-${selected}-legendas-planejadas.srt`, toSrt(r));
          return;
        } else if (action === "next-cycle") {
          if (currentStep(r) !== -1)
            throw new Error(
              "Conclua a revisão das 12 etapas antes de abrir outro ciclo.",
            );
          const next = {
            ...task(),
            id: uid(),
            title:
              `Experimento ${r.cycle + 1}: ${r.values.nextHypothesis}`.slice(
                0,
                160,
              ),
            brief: r.values.nextHypothesis,
            stage: "Ideias",
          };
          state().tasks.push(next);
          const nr = createRun(next, profile());
          nr.cycle = r.cycle + 1;
          nr.values.audience = r.values.audience;
          nr.values.angle = r.values.nextHypothesis;
          nr.values.duration = r.values.duration;
          nr.values.budget = r.values.budget;
          state().production[next.id] = nr;
          record(r, `Novo experimento criado: ${next.title}`);
          save(`Novo experimento no quadro: ${next.title}`);
          selected = next.id;
          stepIndex = 0;
          tab = "flow";
          feedback = [];
        }
        rerender();
      } catch (error) {
        toast(error.message);
      }
    },
    true,
  );
  document.addEventListener("input", (event) => {
    if (event.target.closest("#engine-stage-form")) {
      dirty = true;
      const status = document.querySelector("#engine-save-status");
      if (status)
        status.textContent = "Alterações em rascunho · salve ou troque de área";
    }
  });
  document.addEventListener("change", (event) => {
    try {
      if (event.target.id === "engine-task-picker") {
        commitDraft();
        open(event.target.value);
      } else if (event.target.id === "engine-owner") {
        commitDraft();
        run().owner = event.target.value;
        record(run(), "Responsável pelo ciclo atualizado.");
        save();
        rerender();
      } else if (event.target.id === "prompt-step") {
        stepIndex = Number(event.target.value);
        rerender();
      } else if (event.target.hasAttribute("data-engine-check")) {
        const checked = event.target.checked;
        const i = Number(event.target.dataset.engineCheck);
        const changed = commitDraft();
        const r = run();
        const id = STEPS[stepIndex].id;
        if (r.approved.includes(id))
          invalidateFrom(r, stepIndex, "Revisão alterada.");
        const values = new Set(r.checks[id] || []);
        if (checked) values.add(i);
        else values.delete(i);
        r.checks[id] = [...values];
        save();
        rerender();
        document.querySelector(`[data-engine-check="${i}"]`)?.focus();
        if (changed)
          toast("Rascunho salvo. Confira novamente os demais critérios.");
      }
    } catch (error) {
      toast(error.message);
    }
  });
  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!form.id.startsWith("engine-")) return;
    event.preventDefault();
    const data = new FormData(form);
    const val = (key) => String(data.get(key) || "").trim();
    try {
      const r = run();
      if (form.id === "engine-stage-form") {
        commitDraft();
        toast("Rascunho salvo. Revise os critérios antes de avançar.");
      } else if (form.id === "engine-source-form") {
        if (
          !val("title") ||
          !val("claim") ||
          !val("reference") ||
          !val("context")
        )
          throw new Error("Preencha título, afirmação, referência e contexto.");
        if (
          /^[a-z][a-z\d+.-]*:\/\//i.test(val("reference")) &&
          !/^https?:\/\//i.test(val("reference"))
        )
          throw new Error(
            "Use URL http(s) ou uma identificação textual do registro.",
          );
        const entry = {
          id: sourceEdit || uid(),
          title: val("title"),
          claim: val("claim"),
          reference: val("reference"),
          context: val("context"),
          verified: data.has("verified"),
        };
        if (!sourceEdit && r.sources.length >= 100)
          throw new Error("Limite de 100 evidências por conteúdo.");
        const i = r.sources.findIndex((s) => s.id === entry.id);
        if (i === -1) r.sources.push(entry);
        else r.sources[i] = entry;
        invalidateFrom(r, 1, "Dossiê de evidências alterado.");
        record(r, `Evidência salva: ${entry.title}`);
        sourceEdit = "";
        save();
      } else if (form.id === "engine-scene-form") {
        if (!val("title") || !val("visual") || !val("voice"))
          throw new Error("Preencha nome, descrição visual e narração/texto.");
        const duration = Number(val("duration")),
          cost = Number(val("cost"));
        if (
          !val("duration") ||
          !Number.isFinite(duration) ||
          duration <= 0 ||
          duration > 86400 ||
          !Number.isFinite(cost) ||
          cost < 0
        )
          throw new Error("Informe duração positiva e custo não negativo.");
        if (!sceneEdit && r.scenes.length >= 200)
          throw new Error("Limite de 200 cenas por conteúdo.");
        const entry = {
          id: sceneEdit || uid(),
          title: val("title"),
          visual: val("visual"),
          voice: val("voice"),
          duration,
          cost,
          tool: val("tool"),
          asset: val("asset"),
          rights: val("rights"),
          reviewed: data.has("reviewed"),
        };
        const i = r.scenes.findIndex((s) => s.id === entry.id);
        if (i === -1) r.scenes.push(entry);
        else r.scenes[i] = entry;
        invalidateFrom(r, 4, "Storyboard ou mídias alterados.");
        record(r, `Cena salva: ${entry.title}`);
        sceneEdit = "";
        save();
      } else if (form.id === "engine-note-form") {
        if (!val("text")) throw new Error("Escreva a nota antes de registrar.");
        r.notes.unshift({
          text: val("text"),
          author: "Você",
          time: new Date().toISOString(),
        });
        r.notes = r.notes.slice(0, 100);
        save();
      } else if (form.id === "engine-results-form") {
        if (!val("origin") || !val("observation"))
          throw new Error("Informe a origem e a observação do resultado.");
        if (
          ["views", "watch", "duration"].some(
            (k) =>
              val(k) !== "" &&
              (!Number.isFinite(Number(val(k))) || Number(val(k)) < 0),
          ) ||
          (val("views") !== "" && !Number.isInteger(Number(val("views")))) ||
          (val("watch") !== "" && Number(val("duration")) <= 0)
        )
          throw new Error(
            "Revise os valores: visualizações inteiras, tempos não negativos e duração positiva para calcular a relação.",
          );
        r.metrics = {
          views: val("views"),
          watch: val("watch"),
          duration: val("duration"),
          origin: val("origin"),
          observation: val("observation"),
        };
        invalidateFrom(r, 11, "Observações de resultado alteradas.");
        record(r, "Resultados manuais atualizados.");
        save();
      }
      feedback = [];
      rerender();
    } catch (error) {
      toast(error.message);
    }
  });
  window.addEventListener("beforeunload", () => {
    if (dirty) commitDraft();
  });
  return { render, open, flush: commitDraft };
}
