import { mountNeuralBackground } from "./neural-background.js";
import {
  invalidateFrom,
  record as recordProduction,
} from "./production/engine.js";
import { createProductionUI } from "./production/ui.js";
import { icon } from "./icons.js";
import {
  STORAGE_KEY,
  STAGES,
  PLATFORMS,
  COLORS,
  uid,
  escapeHTML as e,
  loadState,
  validateState,
  moveTask,
  simulationReply,
} from "./state.js";

let storage;
try {
  storage = window.localStorage;
} catch {
  storage = {
    getItem() {
      throw new Error();
    },
    setItem() {
      throw new Error();
    },
  };
}
const loaded = loadState(storage);
let state = loaded.data;
let page = [
  "overview",
  "agents",
  "profiles",
  "production",
  "engine",
  "settings",
].includes(location.hash.slice(1))
  ? location.hash.slice(1)
  : "overview";
let selectedAgent = state.agents[0]?.id;
let productionProfile = "";
let agentTab = "chat";
let filter = "";
let modal = null;
let lastFocus;
let toastTimer;
const app = document.querySelector("#app");
const overlay = document.querySelector("#overlay");
const nav = [
  ["overview", "grid", "Visão geral"],
  ["agents", "agents", "Agentes"],
  ["profiles", "layers", "Perfis"],
  ["production", "board", "Produção"],
  ["engine", "spark", "Engine"],
  ["settings", "settings", "Meu workspace"],
];
const initials = (name) =>
  e(
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join(""),
  );
const avatar = (a, size = "") =>
  `<span class="avatar ${a?.color || "lime"} ${size}">${a ? initials(a.name) : icon("agents")}</span>`;
const badge = (label, color = "") =>
  `<span class="badge ${color}">${e(label)}</span>`;
const empty = (title, text, action = "") =>
  `<div class="empty">${icon("spark")}<h3>${e(title)}</h3><p>${e(text)}</p>${action}</div>`;
const button = (label, action, glyph = "plus", cls = "primary", extra = "") =>
  `<button type="button" class="button ${cls}" data-action="${action}" ${extra}>${icon(glyph)}<span>${label}</span></button>`;
const platformIcons = (platforms) =>
  `<div class="platforms">${platforms.map((p) => `<span title="${e(p)}" aria-label="${e(p)}">${icon(p.toLowerCase())}</span>`).join("")}</div>`;
const profileName = (id) =>
  state.profiles.find((p) => p.id === id)?.name || "Sem perfil";
const agentName = (id) =>
  state.agents.find((a) => a.id === id)?.name || "Sem agente";
const header = (eyebrow, title, description, actions = "") =>
  `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subtitle">${description}</p></div><div class="heading-actions">${actions}</div></div>`;

function toast(message) {
  const target = document.querySelector("#toast");
  target.textContent = message;
  target.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => target.classList.remove("visible"), 4500);
}

function persist(activity) {
  if (activity)
    state.activity.unshift({
      id: uid(),
      text: activity,
      time: new Date().toISOString(),
    });
  state.activity = state.activity.slice(0, 30);
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    toast(
      "Armazenamento indisponível. Exporte o workspace antes de fechar esta página.",
    );
    return false;
  }
}

function render() {
  app.innerHTML = `<aside class="sidebar"><a class="brand" href="#overview" aria-label="Órbita, visão geral"><span class="orbit-logo"></span>órbita<span class="brand-dot">studio</span></a>
    <a href="#settings" class="workspace-name"><span class="workspace-icon">S</span><span>Meu estúdio<small>Workspace pessoal</small></span>${icon("chevron")}</a>
    ${button("Novo conteúdo", "new-task", "plus", "sidebar-create")}<p class="nav-label">WORKSPACE</p><nav aria-label="Navegação principal">${nav
      .slice(0, 5)
      .map(
        ([id, glyph, label]) =>
          `<a href="#${id}" class="nav-item ${page === id ? "active" : ""}" ${page === id ? 'aria-current="page"' : ""}>${icon(glyph)}<span>${label}</span>${id === "agents" ? `<span class="nav-count">${state.agents.length}</span>` : ""}</a>`,
      )
      .join("")}</nav>
    <div class="sidebar-recents"><p class="nav-label">NO SEU FLUXO</p>${state.tasks
      .slice(0, 3)
      .map(
        (t) =>
          `<button data-action="open-room" data-id="${t.id}" title="${e(t.title)}">${icon("video")}<span>${e(t.title)}</span></button>`,
      )
      .join(
        "",
      )}</div><div class="sidebar-bottom"><div class="prototype-note">${icon("folder")}<span>Salvo neste navegador<small>Frontend · execução simulada</small></span></div><a href="#settings" class="nav-item ${page === "settings" ? "active" : ""}" ${page === "settings" ? 'aria-current="page"' : ""}>${icon("settings")}Meu workspace</a><div class="user"><span class="user-avatar">EU</span><span>Criador<small>Uma ideia de cada vez.</small></span></div></div></aside>
    <div class="workspace"><header class="topbar"><div class="breadcrumb">Workspace ${icon("chevron")} <span>${nav.find((n) => n[0] === page)[2]}</span></div><div class="topbar-actions"><button type="button" class="search-trigger" data-action="search">${icon("search")}<span>Buscar no estúdio</span><kbd>/</kbd></button><span class="demo-label"><span class="live-dot"></span>Demonstração</span><button type="button" class="user-avatar" data-action="navigate" data-page="settings" aria-label="Abrir meu workspace">EU</button></div></header>
    <main id="main" data-view="${page}" tabindex="-1">${{ overview: overview, agents: agents, profiles: profiles, production: production, engine: () => productionUI.render(), settings: settings }[page]()}</main>
    <footer class="workspace-footer"><span>ÓRBITA STUDIO <span class="muted">/</span> V.03.1</span><span>Feito para ideias em movimento.</span></footer></div>
    <nav class="mobile-nav" aria-label="Navegação móvel">${nav.map(([id, glyph, label]) => `<a href="#${id}" class="${page === id ? "active" : ""}" ${page === id ? 'aria-current="page"' : ""}>${icon(glyph)}<span>${id === "overview" ? "Início" : id === "settings" ? "Workspace" : label}</span></a>`).join("")}</nav>`;
  if (page === "agents") document.querySelector(".messages")?.scrollTo(0, 1e7);
}

function overview() {
  const reviewing = state.tasks.filter((t) => t.stage === "Em revisão");
  const active = state.agents.filter((a) => a.active).length;
  return `<section class="creation-home" aria-labelledby="creation-title">
    <div class="studio-orb" aria-hidden="true"><span></span></div>
    <p class="eyebrow">SEU ESTÚDIO. SUA DIREÇÃO.</p>
    <h1 id="creation-title">O que vamos criar hoje?</h1>
    <p class="creation-subtitle">Da primeira ideia ao último corte, um espaço para o seu processo.</p>
    <form id="idea-form" class="idea-composer">
      <label class="sr-only" for="idea-input">Sua próxima ideia de conteúdo</label>
      <textarea id="idea-input" name="idea" rows="2" maxlength="12000" required placeholder="Descreva sua próxima ideia de vídeo…"></textarea>
      <div class="idea-composer-bottom"><span>${icon("video")}Novo briefing <span class="composer-local">· planejamento local</span></span><button class="button primary" type="submit"><span>Criar conteúdo</span>${icon("arrow")}</button></div>
    </form>
    <div class="quick-actions" aria-label="Atalhos de criação">
      ${button("Conversar com agentes", "navigate", "chat", "quick-action", 'data-page="agents"')}
      ${button("Organizar perfis", "navigate", "layers", "quick-action", 'data-page="profiles"')}
      ${button("Abrir meu quadro", "navigate", "board", "quick-action", 'data-page="production"')}
    </div>
  </section>
  <section class="engine-entry"><span class="engine-entry-symbol">${icon("spark")}</span><div><p class="eyebrow">PRODUCTION ENGINE</p><h2>Uma ideia. Doze passos para dar forma.</h2><p>Briefing, evidências, roteiro e revisão no mesmo fluxo.</p></div>${button("Abrir sala de criação", "navigate", "arrow", "secondary", 'data-page="engine"')}</section>
  <div class="stats">${[
    [
      "Equipe configurada",
      active.toString().padStart(2, "0"),
      `${state.agents.length} agentes no workspace`,
      "agents",
      "agents",
    ],
    [
      "Perfis editoriais",
      String(state.profiles.length).padStart(2, "0"),
      "Identidades prontas para explorar",
      "layers",
      "profiles",
    ],
    [
      "Conteúdos no fluxo",
      String(state.tasks.length).padStart(2, "0"),
      `${state.tasks.filter((t) => t.stage === "Em produção").length} em produção`,
      "board",
      "production",
    ],
    [
      "Pedem seu olhar",
      String(reviewing.length).padStart(2, "0"),
      "Conteúdos em revisão",
      "spark",
      "production",
    ],
  ]
    .map(
      ([label, value, caption, glyph, route]) =>
        `<button class="stat" data-action="navigate" data-page="${route}"><span class="stat-label">${label}${icon(glyph)}</span><strong>${value}</strong><span class="stat-caption">${caption}${icon("diagonal")}</span></button>`,
    )
    .join("")}</div>
  <div class="dashboard-grid"><section><div class="section-heading"><div><h2>Sua equipe criativa</h2><p>Cada agente, uma especialidade.</p></div><a href="#agents" class="text-link">Ver equipe ${icon("arrow")}</a></div><div class="agent-mini-grid">${
    state.agents
      .slice(0, 4)
      .map(
        (a) =>
          `<button class="agent-mini" data-action="open-agent" data-id="${a.id}">${avatar(a)}<span class="agent-mini-info"><strong>${e(a.name)}</strong><small>${e(a.role)}</small></span><span class="status-dot ${a.active ? "on" : ""}" title="${a.active ? "Disponível na prévia" : "Pausado"}"></span>${icon("chevron")}</button>`,
      )
      .join("") || empty("Monte sua equipe", "Crie seu primeiro agente.")
  }</div>
    <div class="section-heading spaced"><div><h2>Na sua mesa</h2><p>Um olhar final antes do próximo passo.</p></div>${badge(`${reviewing.length} EM REVISÃO`, "warm")}</div><div class="review-list">${
      reviewing
        .slice(0, 3)
        .map(
          (t) =>
            `<button class="review-row" data-action="edit-task" data-id="${t.id}"><span class="content-thumb ${t.color}">${icon("play")}</span><span class="review-info"><small>${e(profileName(t.profileId))} <span>·</span> ${e(t.format)}</small><strong>${e(t.title)}</strong><span class="muted">Revisar briefing e atualizar etapa</span></span>${icon("arrow")}</button>`,
        )
        .join("") ||
      empty(
        "Tudo em dia por aqui",
        "Conteúdos em revisão aparecerão nesta área.",
      )
    }</div></section>
    <section class="activity-panel"><div class="section-heading"><h2>Movimento do estúdio</h2>${icon("pulse")}</div><span class="micro-label">ATIVIDADE LOCAL</span><div class="activity-list">${state.activity
      .slice(0, 5)
      .map(
        (a, i) =>
          `<div class="activity-item"><span class="activity-node ${i === 0 ? "current" : ""}">${icon(i === 0 ? "spark" : "check")}</span><div><p>${e(a.text)}</p><time>${new Date(a.time).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time></div></div>`,
      )
      .join(
        "",
      )}</div><div class="studio-tip">${icon("info")}<p>Este é seu espaço de teste. Conversas e fluxos são demonstrativos; suas configurações ficam neste navegador.</p></div></section></div>
  <div class="section-heading spaced"><div><h2>Universos que você está criando</h2><p>Uma identidade para cada projeto.</p></div><a href="#profiles" class="text-link">Ver perfis ${icon("arrow")}</a></div><div class="profile-preview-grid">${state.profiles
    .slice(0, 3)
    .map(
      (p) =>
        `<button class="profile-preview" data-action="edit-profile" data-id="${p.id}"><span class="profile-monogram ${p.color}">${initials(p.name)}</span><span><strong>${e(p.name)}</strong><small>${e(p.niche)}</small></span>${platformIcons(p.platforms)}${icon("diagonal")}</button>`,
    )
    .join("")}</div>`;
}

function agents() {
  const agent =
    state.agents.find((a) => a.id === selectedAgent) || state.agents[0];
  selectedAgent = agent?.id;
  const messages = agent ? state.messages[agent.id] || [] : [];
  return `${header("EQUIPE", "Sua equipe criativa.", "Defina o papel de cada agente e crie uma conversa para cada ideia.", button("Criar agente", "new-agent"))}
  <div class="agents-workspace"><section class="agent-directory"><div class="directory-heading"><h2>Seus agentes</h2>${badge(String(state.agents.length))}</div>${state.agents.map((a) => `<button class="agent-list-item ${a.id === agent?.id ? "selected" : ""}" data-action="select-agent" data-id="${a.id}">${avatar(a)}<span><strong>${e(a.name)}</strong><small>${e(a.role)}</small></span><span class="status-dot ${a.active ? "on" : ""}"></span></button>`).join("")}<button class="add-agent" data-action="new-agent">${icon("plus")}Adicionar à equipe</button><div class="directory-note">${icon("info")}<p>Agentes configuráveis.<br>Execução simulada nesta versão.</p></div></section>
  <section class="agent-detail">${
    agent
      ? `<div class="agent-detail-header">${avatar(agent, "large")}<div><h2>${e(agent.name)} ${badge(agent.active ? "Disponível na prévia" : "Pausado", agent.active ? "green" : "")}</h2><p>${e(agent.role)}</p></div><button class="icon-button" data-action="edit-agent" data-id="${agent.id}" aria-label="Editar ${e(agent.name)}">${icon("settings")}</button></div><div class="tabs" role="tablist" aria-label="Detalhes do agente"><button role="tab" id="tab-chat" aria-controls="agent-panel" aria-selected="${agentTab === "chat"}" tabindex="${agentTab === "chat" ? "0" : "-1"}" class="${agentTab === "chat" ? "active" : ""}" data-action="agent-tab" data-tab="chat">${icon("chat")}Conversa</button><button role="tab" id="tab-config" aria-controls="agent-panel" aria-selected="${agentTab === "config"}" tabindex="${agentTab === "config" ? "0" : "-1"}" class="${agentTab === "config" ? "active" : ""}" data-action="agent-tab" data-tab="config">${icon("settings")}Função e instruções</button></div>
  <div id="agent-panel" role="tabpanel" aria-labelledby="tab-${agentTab}">${
    agentTab === "chat"
      ? `<div class="chat-notice">${icon("info")}Conversa de demonstração · sem conexão com IA</div><div class="messages" aria-live="polite" aria-relevant="additions text">${messages.length ? messages.map((m) => `<div class="message ${m.role}">${m.role === "assistant" ? avatar(agent, "tiny") : '<span class="user-avatar tiny">EU</span>'}<div><span class="message-author">${m.role === "user" ? "Você" : `${e(agent.name)} <span>· resposta simulada</span>`}</span><p>${e(m.text).replace(/\n/g, "<br>")}</p></div></div>`).join("") : `<div class="chat-welcome"><span class="welcome-spark ${agent.color}">${icon("spark")}</span><p class="eyebrow">UMA NOVA CONVERSA</p><h3>O que vamos criar com ${e(agent.name)}?</h3><p>${e(agent.mission)}</p><div class="suggestions">${["Quero explorar uma ideia de conteúdo", "Como você pode ajudar meu estúdio?", "Vamos preparar um briefing"].map((s) => `<button data-action="suggestion" data-prompt="${e(s)}">${e(s)}${icon("diagonal")}</button>`).join("")}</div></div>`}</div><form id="chat-form" class="chat-composer"><label class="sr-only" for="chat-input">Mensagem para ${e(agent.name)}</label><textarea id="chat-input" name="message" placeholder="${agent.active ? `Converse com ${e(agent.name)} sobre sua próxima ideia…` : "Ative o agente em Função e instruções para conversar."}" rows="2" maxlength="12000" required ${agent.active ? "" : "disabled"}></textarea><div class="composer-bottom"><span>${icon("link")}Briefings e ideias em texto</span><button class="send-button" type="submit" aria-label="Enviar mensagem de demonstração" ${agent.active ? "" : "disabled"}>${icon("send")}</button></div></form><p class="composer-hint">Enter envia · Shift + Enter quebra a linha · salvo neste navegador</p>`
      : `<div class="agent-config"><div class="config-callout">${icon("spark")}<p>Uma boa função deixa claro o objetivo, a entrega e os limites.</p></div>${[
          ["Missão", agent.mission],
          ["Entrega esperada", agent.output],
          ["Instruções e limites", agent.rules],
        ]
          .map(
            ([label, value]) =>
              `<section><p class="eyebrow">${label}</p><p class="config-text">${e(value) || "Ainda não definido."}</p></section>`,
          )
          .join(
            "",
          )}<div class="config-actions">${button("Editar função", "edit-agent", "edit", "primary", `data-id="${agent.id}"`)}${button(agent.active ? "Pausar agente" : "Ativar agente", "toggle-agent", agent.active ? "pause" : "play", "secondary", `data-id="${agent.id}"`)}</div><p class="muted">A disponibilidade altera o fluxo da prévia. Não inicia processos externos.</p></div>`
  }</div>`
      : empty(
          "Sua equipe começa com uma função",
          "Crie um agente para explorar o chat e suas instruções.",
          button("Criar agente", "new-agent"),
        )
  }</section></div>`;
}

function profiles() {
  return `${header("IDENTIDADES", "Seus perfis editoriais.", "Organize a voz, o público e a equipe dos seus projetos editoriais.", button("Criar perfil", "new-profile"))}<div class="inline-notice">${icon("info")}Perfis editoriais de planejamento. Nenhuma conta social está conectada.</div><div class="profiles-grid">${state.profiles
    .map(
      (p) =>
        `<article class="profile-card"><div class="profile-cover ${p.color}"><div class="cover-rings" aria-hidden="true"></div><span class="cover-word">${e(p.niche || "Novo universo")}</span><span class="profile-monogram ${p.color}">${initials(p.name)}</span>${badge("PLANEJAMENTO")}</div><div class="profile-body"><div class="profile-title"><div><h2>${e(p.name)}</h2><p>${e(p.handle || "Identidade em construção")}</p></div><button class="icon-button" data-action="edit-profile" data-id="${p.id}" aria-label="Editar ${e(p.name)}">${icon("edit")}</button></div><p class="profile-audience">${e(p.audience || "Defina o público deste projeto.")}</p><div class="profile-networks">${platformIcons(p.platforms)}<span>${p.platforms.length} redes planejadas</span></div><div class="profile-team"><div class="avatar-stack">${p.agentIds
          .map((id) => state.agents.find((a) => a.id === id))
          .filter(Boolean)
          .slice(0, 4)
          .map((a) => avatar(a, "tiny"))
          .join(
            "",
          )}</div><span>${p.agentIds.length} agentes associados</span><button class="text-link" data-action="profile-production" data-id="${p.id}">Conteúdos ${icon("arrow")}</button></div></div></article>`,
    )
    .join(
      "",
    )}<button class="profile-create-card" data-action="new-profile"><span>${icon("plus")}</span><h3>Um novo universo</h3><p>Dê nome e direção<br>à sua próxima ideia.</p></button></div>`;
}

function taskCard(t) {
  const agent = state.agents.find((a) => a.id === t.agentId);
  return `<article class="task-card"><button class="task-open" data-action="edit-task" data-id="${t.id}"><span class="task-art ${t.color}"><span class="task-art-orbit"></span><span class="task-art-label">${e(t.format)}</span>${icon(t.format === "Carrossel" ? "layers" : "play")}</span><span class="task-profile">${e(profileName(t.profileId))}</span><h3>${e(t.title)}</h3><span class="task-brief">${e(t.brief || "Adicione um briefing para orientar sua equipe.")}</span></button><div class="task-bottom"><span class="task-owner">${avatar(agent, "tiny")}${e(agentName(t.agentId))}</span><label class="sr-only" for="stage-${t.id}">Etapa de ${e(t.title)}</label><select id="stage-${t.id}" data-task-stage="${t.id}" aria-label="Etapa de ${e(t.title)}">${STAGES.map((s) => `<option ${s === t.stage ? "selected" : ""}>${s}</option>`).join("")}</select></div><button type="button" class="task-room-link" data-action="open-room" data-id="${t.id}">Abrir sala de criação ${icon("arrow")}</button></article>`;
}

function production() {
  const tasks = state.tasks.filter(
    (t) =>
      (!productionProfile || t.profileId === productionProfile) &&
      `${t.title} ${t.brief}`
        .toLocaleLowerCase("pt-BR")
        .includes(filter.toLocaleLowerCase("pt-BR")),
  );
  return `${header("FLUXO CRIATIVO", "Seu quadro de produção.", "Acompanhe cada conteúdo e decida o próximo movimento.", button("Novo conteúdo", "new-task"))}<div class="board-toolbar"><div class="board-mode">${icon("board")}Quadro de produção ${badge(String(tasks.length))}</div><div class="board-filters"><label class="input-search">${icon("search")}<input id="task-search" placeholder="Buscar conteúdo…" aria-label="Buscar conteúdo" value="${e(filter)}" /></label><label class="sr-only" for="profile-filter">Filtrar por perfil</label><select id="profile-filter"><option value="">Todos os perfis</option>${state.profiles.map((p) => `<option value="${p.id}" ${p.id === productionProfile ? "selected" : ""}>${e(p.name)}</option>`).join("")}</select></div></div><div class="kanban">${STAGES.map(
    (stage, index) =>
      `<section class="kanban-column"><div class="column-heading"><h2><span class="stage-dot stage-${index}"></span>${stage}<span>${tasks.filter((t) => t.stage === stage).length}</span></h2><button class="icon-button" data-action="new-task" data-stage="${stage}" aria-label="Adicionar conteúdo em ${stage}">${icon("plus")}</button></div><div class="column-body">${
        tasks
          .filter((t) => t.stage === stage)
          .map(taskCard)
          .join("") ||
        `<div class="column-empty">${icon("layers")}<span>${filter || productionProfile ? "Nenhum conteúdo neste filtro." : "Espaço para o próximo passo."}</span></div>`
      }</div></section>`,
  ).join(
    "",
  )}</div><p class="board-footnote">${icon("info")}Altere a etapa no cartão ou abra o conteúdo para editar o briefing. “Pronto” indica conclusão editorial, sem publicação nas redes.</p>`;
}

function settings() {
  return `${header("SEU ESPAÇO", "O estúdio vai com você.", "Guarde uma cópia do trabalho e continue de onde parou.")}<div class="settings-grid"><section class="settings-card"><span class="settings-symbol lime">${icon("folder")}</span><h2>Seu workspace, em um arquivo.</h2><p>Exporte agentes, funções, perfis, conteúdos e conversas. No PC, abra o Órbita e importe esse arquivo para continuar.</p><div class="export-summary">${badge(`${state.agents.length} agentes`)}${badge(`${state.profiles.length} perfis`)}${badge(`${state.tasks.length} conteúdos`)}</div><div class="settings-actions">${button("Exportar workspace", "export", "download")}${button("Importar arquivo", "import", "upload", "secondary")}</div><input id="import-file" type="file" accept="application/json,.json" hidden /></section><section class="settings-card"><p class="eyebrow">VERSÃO 0.3.1 · FRONTEND</p><h2>O que já está em órbita</h2><ul class="feature-list"><li>${icon("check")}Cadastro e edição de agentes e funções</li><li>${icon("check")}Chat individual de demonstração</li><li>${icon("check")}Perfis editoriais e associação de agentes</li><li>${icon("check")}Quadro de produção com etapas</li><li>${icon("check")}Dados locais e exportação</li></ul><div class="next-version"><p class="eyebrow">PRÓXIMA ETAPA, NO PC</p><p>Conectar modelos de IA, armazenamento remoto, arquivos de mídia e integrações de publicação.</p></div></section></div><div class="local-note">${icon("info")}Os dados ficam neste navegador e neste endereço. Limpar os dados do navegador remove essa cópia. A exportação inclui suas conversas; guarde o arquivo com cuidado.</div>`;
}

function navigate(target) {
  if (page === target) render();
  else location.hash = target;
}

function closeModal() {
  overlay.innerHTML = "";
  modal = null;
  document.body.classList.remove("modal-open");
  app.inert = false;
  const fallback =
    document.querySelector(".heading-actions button") ||
    document.querySelector("main");
  (lastFocus?.isConnected ? lastFocus : fallback)?.focus();
}

function openModal(type, id = "", stage = "Ideias") {
  lastFocus = document.activeElement;
  modal = { type, id, stage };
  document.body.classList.add("modal-open");
  app.inert = true;
  let title = "",
    subtitle = "",
    body = "",
    form = "";
  const field = (
    label,
    name,
    value = "",
    placeholder = "",
    required = false,
    max = 100,
  ) =>
    `<label class="field">${label}<input name="${name}" value="${e(value)}" placeholder="${e(placeholder)}" maxlength="${max}" ${required ? "required" : ""} /></label>`;
  const area = (label, name, value = "", placeholder = "") =>
    `<label class="field">${label}<textarea name="${name}" rows="3" maxlength="12000" placeholder="${e(placeholder)}">${e(value)}</textarea></label>`;
  const colorField = (color = "lime") =>
    `<fieldset class="color-field"><legend>Cor de identificação</legend>${COLORS.map((c, i) => `<label class="color-choice ${c}"><input type="radio" name="color" value="${c}" ${c === color ? "checked" : ""} /><span aria-label="${["Verde", "Lavanda", "Pêssego", "Azul"][i]}">${icon("check")}</span></label>`).join("")}</fieldset>`;
  if (type === "agent") {
    const a = state.agents.find((a) => a.id === id) || {};
    title = id ? `Editar ${e(a.name)}` : "Um novo talento na equipe.";
    subtitle = "Dê um nome, uma missão e uma forma de trabalhar.";
    form = "agent-form";
    body = `${field("Nome do agente", "name", a.name, "Ex.: Maya", true, 80)}${field("Função", "role", a.role, "Ex.: Pesquisa de tendências", true)}${colorField(a.color)}${area("Missão", "mission", a.mission, "Qual problema esse agente resolve?")}${area("Entrega esperada", "output", a.output, "O que ele deve entregar ao terminar?")}${area("Instruções e limites", "rules", a.rules, "Critérios de qualidade, fontes e limites de autonomia.")}<label class="checkbox-line"><input type="checkbox" name="active" ${a.active !== false ? "checked" : ""} />Disponível para conversar na prévia</label>`;
  } else if (type === "profile") {
    const p = state.profiles.find((p) => p.id === id) || {};
    title = id
      ? "A identidade do seu projeto."
      : "Dê forma a um novo universo.";
    subtitle = "Este cadastro planeja o perfil. Não cria uma conta nas redes.";
    form = "profile-form";
    body = `${field("Nome do perfil", "name", p.name, "Ex.: Além do prompt", true, 80)}<div class="form-row">${field("Identificador desejado", "handle", p.handle, "@seuperfil")}${field("Tema / nicho", "niche", p.niche, "Ex.: IA na prática")}</div>${colorField(p.color)}${area("Para quem você cria?", "audience", p.audience, "Descreva o público e seus interesses.")}${area("Voz e direção editorial", "voice", p.voice, "Como este perfil fala e o que o torna único?")}<fieldset class="choice-field"><legend>Redes planejadas</legend><div class="checkbox-chips">${PLATFORMS.map((platform) => `<label><input type="checkbox" name="platforms" value="${platform}" ${p.platforms?.includes(platform) ? "checked" : ""} /><span>${icon(platform.toLowerCase())}${platform}</span></label>`).join("")}</div></fieldset><fieldset class="choice-field"><legend>Equipe deste perfil</legend><div class="checkbox-chips">${state.agents.map((a) => `<label><input type="checkbox" name="agentIds" value="${a.id}" ${p.agentIds?.includes(a.id) ? "checked" : ""} /><span>${e(a.name)}</span></label>`).join("") || '<p class="muted">Crie agentes para associar a este perfil.</p>'}</div></fieldset>`;
  } else if (type === "task") {
    const t = state.tasks.find((t) => t.id === id) || {
      stage,
      profileId: productionProfile,
    };
    title = id ? "Cada detalhe conta." : "Toda criação começa aqui.";
    subtitle = "Organize a ideia e deixe claro o próximo passo.";
    form = "task-form";
    body = `${field("Título do conteúdo", "title", t.title, "Qual é a próxima história?", true, 160)}<div class="form-row"><label class="field">Perfil<select name="profileId"><option value="">Sem perfil</option>${state.profiles.map((p) => `<option value="${p.id}" ${p.id === t.profileId ? "selected" : ""}>${e(p.name)}</option>`).join("")}</select></label><label class="field">Responsável<select name="agentId"><option value="">Sem agente</option>${state.agents.map((a) => `<option value="${a.id}" ${a.id === t.agentId ? "selected" : ""}>${e(a.name)}</option>`).join("")}</select></label></div><div class="form-row"><label class="field">Formato<select name="format">${["Vídeo", "Reel", "Short", "Carrossel"].map((f) => `<option ${f === t.format ? "selected" : ""}>${f}</option>`).join("")}</select></label><label class="field">Etapa<select name="stage">${STAGES.map((s) => `<option ${s === t.stage ? "selected" : ""}>${s}</option>`).join("")}</select></label></div>${area("Briefing", "brief", t.brief, "Objetivo, referências, promessa do conteúdo e orientações para produção.")}${colorField(t.color)}<p class="form-note">As etapas organizam seu planejamento. Nenhuma tarefa é executada ou publicada automaticamente.</p>`;
  } else if (type === "search") {
    title = "Encontre seu próximo passo.";
    subtitle = "Busque agentes, perfis e conteúdos no workspace.";
    body =
      '<label class="input-search large-search">' +
      icon("search") +
      '<input id="global-search" placeholder="Digite um nome, ideia ou função…" aria-label="Buscar no workspace" /></label><div id="search-results"></div>';
  }
  overlay.innerHTML = `<div class="modal-backdrop"><section class="modal ${type === "search" ? "search-modal" : ""}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-header"><div><p class="eyebrow">ÓRBITA WORKSPACE</p><h2 id="modal-title">${title}</h2><p>${subtitle}</p></div><button class="icon-button" data-action="close-modal" aria-label="Fechar janela">${icon("close")}</button></div>${form ? `<form id="${form}"><div class="modal-body">${body}</div><div class="modal-footer">${button("Cancelar", "close-modal", "close", "secondary")}<button type="submit" class="button primary">${icon("check")}Salvar ${type === "agent" ? "agente" : type === "profile" ? "perfil" : "conteúdo"}</button></div></form>` : `<div class="modal-body">${body}</div>`}</section></div>`;
  if (type === "search") renderSearch("");
  requestAnimationFrame(() =>
    overlay
      .querySelector('input:not([type="radio"]):not([type="checkbox"])')
      ?.focus(),
  );
}

function renderSearch(query) {
  const q = query.trim().toLocaleLowerCase("pt-BR");
  const items = [
    ...nav.map(([id, glyph, name]) => ({
      id,
      glyph,
      name,
      detail: "Página",
      action: "navigate",
      attr: "page",
    })),
    ...state.agents.map((a) => ({
      id: a.id,
      glyph: "agents",
      name: a.name,
      detail: a.role,
      action: "open-agent",
      attr: "id",
    })),
    ...state.profiles.map((p) => ({
      id: p.id,
      glyph: "layers",
      name: p.name,
      detail: p.niche,
      action: "edit-profile",
      attr: "id",
    })),
    ...state.tasks.map((t) => ({
      id: t.id,
      glyph: "video",
      name: t.title,
      detail: t.stage,
      action: "edit-task",
      attr: "id",
    })),
  ]
    .filter((item) =>
      `${item.name} ${item.detail}`.toLocaleLowerCase("pt-BR").includes(q),
    )
    .slice(0, 16);
  document.querySelector("#search-results").innerHTML =
    items
      .map(
        (item) =>
          `<button class="search-result" data-action="${item.action}" data-${item.attr}="${item.id}">${icon(item.glyph)}<span><strong>${e(item.name)}</strong><small>${e(item.detail)}</small></span>${icon("arrow")}</button>`,
      )
      .join("") || empty("Nenhum resultado", "Tente outro nome ou termo.");
}

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("modal-backdrop")) {
    closeModal();
    return;
  }
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const { action, id } = target.dataset;
  if (modal?.type === "search" && !["close-modal", "search"].includes(action))
    closeModal();
  if (action === "navigate") navigate(target.dataset.page);
  else if (action === "open-room") productionUI.open(id);
  else if (action === "new-agent" || action === "edit-agent")
    openModal("agent", id);
  else if (action === "new-profile" || action === "edit-profile")
    openModal("profile", id);
  else if (action === "new-task" || action === "edit-task")
    openModal("task", id, target.dataset.stage);
  else if (action === "close-modal") closeModal();
  else if (action === "search") openModal("search");
  else if (action === "select-agent" || action === "open-agent") {
    selectedAgent = id;
    agentTab = "chat";
    navigate("agents");
  } else if (action === "agent-tab") {
    agentTab = target.dataset.tab;
    render();
    document.querySelector(`#tab-${agentTab}`)?.focus();
  } else if (action === "toggle-agent") {
    const a = state.agents.find((a) => a.id === id);
    a.active = !a.active;
    persist(`${a.name} foi ${a.active ? "ativado" : "pausado"} na prévia.`);
    render();
  } else if (action === "profile-production") {
    productionProfile = id;
    filter = "";
    navigate("production");
  } else if (action === "suggestion") {
    const input = document.querySelector("#chat-input");
    if (input.disabled) {
      toast("Ative este agente em Função e instruções.");
      return;
    }
    input.value = target.dataset.prompt;
    input.focus();
  } else if (action === "export") {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `orbita-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Exportação preparada. Guarde o arquivo para continuar no PC.");
  } else if (action === "import")
    document.querySelector("#import-file").click();
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (
    ![
      "agent-form",
      "profile-form",
      "task-form",
      "chat-form",
      "idea-form",
    ].includes(form.id)
  )
    return;
  event.preventDefault();
  const data = new FormData(form);
  const text = (key) => String(data.get(key) || "").trim();
  const blankField = [
    ...form.querySelectorAll("input[required], textarea[required]"),
  ].find((field) => !field.value.trim());
  if (blankField) {
    blankField.setCustomValidity("Escreva algo além de espaços.");
    blankField.reportValidity();
    return;
  }
  if (form.id === "idea-form") {
    const idea = text("idea");
    if (!idea) return;
    openModal("task");
    overlay.querySelector('[name="title"]').value = idea
      .split(/\\n/)[0]
      .slice(0, 160);
    overlay.querySelector('[name="brief"]').value = idea;
    return;
  }
  if (form.id === "chat-form") {
    const agent = state.agents.find((a) => a.id === selectedAgent);
    if (!agent?.active || !text("message")) return;
    const messages = (state.messages[agent.id] ||= []);
    messages.push(
      { role: "user", text: text("message") },
      { role: "assistant", text: simulationReply(agent, text("message")) },
    );
    state.messages[agent.id] = messages.slice(-1000);
    persist();
    render();
    document.querySelector("#chat-input")?.focus();
    return;
  }
  const id = modal.id || uid();
  let collection, record, activity;
  if (form.id === "agent-form") {
    collection = state.agents;
    record = {
      id,
      name: text("name"),
      role: text("role"),
      color: text("color"),
      mission: text("mission"),
      output: text("output"),
      rules: text("rules"),
      active: data.has("active"),
    };
    activity = `${record.name}: ${modal.id ? "função atualizada" : "novo agente na equipe"}.`;
    selectedAgent = id;
  } else if (form.id === "profile-form") {
    collection = state.profiles;
    record = {
      id,
      name: text("name"),
      handle: text("handle"),
      niche: text("niche"),
      audience: text("audience"),
      voice: text("voice"),
      color: text("color"),
      platforms: data.getAll("platforms"),
      agentIds: data.getAll("agentIds"),
    };
    activity = `Perfil ${record.name} ${modal.id ? "atualizado" : "adicionado ao planejamento"}.`;
  } else {
    collection = state.tasks;
    record = {
      id,
      title: text("title"),
      profileId: text("profileId"),
      agentId: text("agentId"),
      format: text("format"),
      stage: text("stage"),
      brief: text("brief"),
      color: text("color"),
    };
    activity = `“${record.title}” ${modal.id ? "atualizado" : "adicionado ao fluxo"}.`;
  }
  const index = collection.findIndex((item) => item.id === id);
  if (index !== -1 && form.id === "task-form" && state.production?.[id]) {
    const before = collection[index];
    if (
      ["title", "brief", "profileId", "format"].some(
        (key) => before[key] !== record[key],
      )
    ) {
      invalidateFrom(
        state.production[id],
        0,
        "Briefing ou identidade do conteúdo alterados no quadro.",
      );
      recordProduction(
        state.production[id],
        "Confira a direção editorial com o novo cadastro do conteúdo.",
      );
    }
  }
  if (index !== -1 && form.id === "profile-form") {
    const before = collection[index];
    if (
      ["name", "audience", "voice", "niche"].some(
        (key) => before[key] !== record[key],
      ) ||
      JSON.stringify(before.platforms) !== JSON.stringify(record.platforms)
    ) {
      for (const task of state.tasks.filter((task) => task.profileId === id)) {
        if (state.production?.[task.id])
          invalidateFrom(
            state.production[task.id],
            0,
            "Identidade editorial do perfil alterada.",
          );
      }
    }
  }
  if (index === -1) collection.push(record);
  else collection[index] = record;
  const saved = persist(activity);
  render();
  closeModal();
  if (saved) toast("Salvo no seu workspace.");
});

document.addEventListener("input", (event) => {
  event.target.setCustomValidity?.("");
  if (event.target.id === "global-search") renderSearch(event.target.value);
  if (event.target.id === "task-search") {
    const position = event.target.selectionStart;
    filter = event.target.value;
    render();
    const input = document.querySelector("#task-search");
    input.focus();
    input.setSelectionRange(position, position);
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.id === "profile-filter") {
    productionProfile = event.target.value;
    render();
    document.querySelector("#profile-filter")?.focus();
  }
  if (event.target.dataset.taskStage) {
    const id = event.target.dataset.taskStage;
    const task = moveTask(state, id, event.target.value);
    const saved = persist(
      `“${task.title}” movido para ${task.stage.toLowerCase()}.`,
    );
    render();
    document.querySelector(`#stage-${id}`)?.focus();
    if (saved) toast(`Conteúdo movido para ${task.stage.toLowerCase()}.`);
  }
  if (event.target.id === "import-file") {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 5_000_000)
        throw new Error("Escolha uma exportação de até 5 MB.");
      const imported = validateState(JSON.parse(await file.text()));
      if (
        !window.confirm(
          `Importar ${imported.agents.length} agentes, ${imported.profiles.length} perfis e ${imported.tasks.length} conteúdos? Isso substitui os dados deste navegador. Exporte a versão atual antes se quiser preservá-la.`,
        )
      )
        return;
      state = imported;
      selectedAgent = state.agents[0]?.id;
      productionProfile = "";
      filter = "";
      const saved = persist("Workspace importado neste dispositivo.");
      render();
      if (saved) toast("Workspace importado. Continue de onde parou.");
    } catch (error) {
      toast(
        error instanceof SyntaxError
          ? "O arquivo não contém JSON válido."
          : error.message,
      );
    } finally {
      const input = document.querySelector("#import-file");
      if (input) input.value = "";
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal) {
    closeModal();
    return;
  }
  if (
    event.target.matches('[role="tab"]') &&
    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
  ) {
    event.preventDefault();
    agentTab =
      event.key === "Home"
        ? "chat"
        : event.key === "End"
          ? "config"
          : agentTab === "chat"
            ? "config"
            : "chat";
    render();
    document.querySelector(`#tab-${agentTab}`)?.focus();
  }
  if (
    event.key === "/" &&
    !modal &&
    !event.target.matches("input, textarea, select")
  ) {
    event.preventDefault();
    openModal("search");
  }
  if (
    event.target.id === "chat-input" &&
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing
  ) {
    event.preventDefault();
    event.target.form.requestSubmit();
  }
  if (event.key === "Tab" && modal) {
    const focusable = [
      ...overlay.querySelectorAll(
        'button, input, textarea, select, [tabindex="0"]',
      ),
    ].filter((el) => !el.disabled && el.getClientRects().length);
    const first = focusable[0],
      last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});

window.addEventListener("hashchange", () => {
  productionUI.flush();
  page = nav.some((n) => n[0] === location.hash.slice(1))
    ? location.hash.slice(1)
    : "overview";
  if (modal) closeModal();
  render();
  window.scrollTo(0, 0);
  document.querySelector("main")?.focus({ preventScroll: true });
});

const productionUI = createProductionUI({
  getState: () => state,
  persist,
  rerender: render,
  navigate,
  toast,
  openAgent: (id) => {
    selectedAgent = id;
    agentTab = "chat";
    navigate("agents");
  },
});

render();
if (loaded.warning) toast(loaded.warning);

mountNeuralBackground();
