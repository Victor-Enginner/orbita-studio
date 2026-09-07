import { validateProduction } from "./production/engine.js";
export const STORAGE_KEY = "orbita-studio:v1";
export const STAGES = ["Ideias", "Em produção", "Em revisão", "Pronto"];
export const PLATFORMS = ["YouTube", "Instagram", "TikTok", "Facebook", "Kwai"];
export const COLORS = ["lime", "lavender", "peach", "blue"];
export const uid = () => globalThis.crypto.randomUUID();
export const escapeHTML = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export function createSeed() {
  return {
    version: 1,
    agents: [
      {
        id: "a1",
        name: "Luna",
        role: "Pesquisa & referências",
        color: "lavender",
        active: true,
        mission:
          "Encontrar pautas relevantes e reunir fontes verificáveis sobre IA, tecnologia e cultura digital.",
        output: "Briefing com proposta, fontes e oportunidades de abordagem.",
        rules:
          "Separar fatos de hipóteses. Sinalizar fontes que precisam de verificação.",
      },
      {
        id: "a2",
        name: "Otto",
        role: "Roteiro & narrativa",
        color: "lime",
        active: true,
        mission:
          "Transformar briefings em histórias claras, com um bom início e uma conclusão que entrega a promessa.",
        output: "Roteiro com narração, cenas e três sugestões de título.",
        rules:
          "Preservar os fatos do briefing. Não inventar resultados de experimentos.",
      },
      {
        id: "a3",
        name: "Íris",
        role: "Direção visual",
        color: "peach",
        active: true,
        mission:
          "Criar uma linguagem visual consistente e planejar as cenas de cada conteúdo.",
        output:
          "Storyboard, referências visuais e lista de materiais para edição.",
        rules:
          "Priorizar clareza e ritmo. Indicar a origem dos materiais sugeridos.",
      },
      {
        id: "a4",
        name: "Nexo",
        role: "Qualidade & revisão",
        color: "blue",
        active: false,
        mission:
          "Revisar clareza, precisão e coerência antes de um conteúdo seguir para aprovação.",
        output:
          "Parecer com pontos aprovados, problemas e correções sugeridas.",
        rules:
          "Conferir se o título entrega a promessa. Destacar afirmações sem evidência.",
      },
    ],
    profiles: [
      {
        id: "p1",
        name: "Além do prompt",
        handle: "@alem.doprompt",
        niche: "IA na prática",
        audience:
          "Criadores e curiosos que querem entender o que a IA consegue fazer de verdade.",
        voice: "Curioso, direto e visual. Mostrar o processo e os resultados.",
        platforms: ["YouTube", "Instagram", "TikTok"],
        color: "lime",
        agentIds: ["a1", "a2", "a3"],
      },
      {
        id: "p2",
        name: "Arquivo futuro",
        handle: "@arquivo.futuro",
        niche: "Cultura digital",
        audience:
          "Pessoas interessadas nas ideias e tecnologias que estão mudando o cotidiano.",
        voice: "Documental, acessível e instigante.",
        platforms: ["Instagram", "Facebook", "Kwai"],
        color: "lavender",
        agentIds: ["a1", "a4"],
      },
    ],
    tasks: [
      {
        id: "t1",
        title: "Construindo um agente pelo celular",
        profileId: "p1",
        agentId: "a2",
        stage: "Em revisão",
        format: "Vídeo",
        brief:
          "Apresentar o experimento do início ao fim, com gravação de tela e resultados observáveis.",
        color: "lime",
      },
      {
        id: "t2",
        title: "O que existe além do prompt?",
        profileId: "p1",
        agentId: "a3",
        stage: "Em produção",
        format: "Reel",
        brief:
          "Explicar contexto, ferramentas e memória com exemplos visuais simples.",
        color: "lavender",
      },
      {
        id: "t3",
        title: "Uma pequena história do futuro",
        profileId: "p2",
        agentId: "a1",
        stage: "Ideias",
        format: "Carrossel",
        brief:
          "Pesquisar três previsões sobre tecnologia e o que aconteceu com cada uma.",
        color: "peach",
      },
      {
        id: "t4",
        title: "Seu primeiro fluxo de criação",
        profileId: "p1",
        agentId: "a2",
        stage: "Pronto",
        format: "Short",
        brief: "Demonstrar as etapas de pauta, pesquisa, roteiro e revisão.",
        color: "blue",
      },
      {
        id: "t5",
        title: "A estética da internet que vem aí",
        profileId: "p2",
        agentId: "a3",
        stage: "Ideias",
        format: "Reel",
        brief: "Reunir referências e propor uma leitura visual das tendências.",
        color: "lavender",
      },
    ],
    messages: {},
    activity: [
      {
        id: "seed",
        text: "Seu estúdio de demonstração está pronto para explorar.",
        time: new Date().toISOString(),
      },
    ],
  };
}

// Reject malformed imports before replacing the local workspace.
export function validateState(data) {
  if (!data || data.version !== 1)
    throw new Error("Este arquivo não é uma exportação compatível do Órbita.");
  const str = (v, max = 12000) => typeof v === "string" && v.length <= max;
  const list = (v, max = 2000) => Array.isArray(v) && v.length <= max;
  const unique = (rows) =>
    new Set(rows.map((row) => row.id)).size === rows.length;
  const base = (row) =>
    row &&
    str(row.id, 100) &&
    /^[a-zA-Z0-9_-]+$/.test(row.id) &&
    !["__proto__", "constructor", "prototype"].includes(row.id);
  if (
    !list(data.agents) ||
    !list(data.profiles) ||
    !list(data.tasks) ||
    !list(data.activity, 100)
  )
    throw new Error("Estrutura de dados inválida.");
  if (
    !data.agents.every(
      (a) =>
        base(a) &&
        str(a.name, 80) &&
        a.name.trim() &&
        str(a.role, 100) &&
        str(a.mission) &&
        str(a.output) &&
        str(a.rules) &&
        COLORS.includes(a.color) &&
        typeof a.active === "boolean",
    ) ||
    !unique(data.agents)
  )
    throw new Error("Configuração de agentes inválida.");
  const agentIds = new Set(data.agents.map((a) => a.id));
  if (
    !data.profiles.every(
      (p) =>
        base(p) &&
        str(p.name, 80) &&
        p.name.trim() &&
        str(p.handle, 100) &&
        str(p.niche, 100) &&
        str(p.audience) &&
        str(p.voice) &&
        COLORS.includes(p.color) &&
        list(p.platforms, 5) &&
        p.platforms.every((v) => PLATFORMS.includes(v)) &&
        list(p.agentIds) &&
        p.agentIds.every((id) => agentIds.has(id)),
    ) ||
    !unique(data.profiles)
  )
    throw new Error("Configuração de perfis inválida.");
  const profileIds = new Set(data.profiles.map((p) => p.id));
  if (
    !data.tasks.every(
      (t) =>
        base(t) &&
        str(t.title, 160) &&
        t.title.trim() &&
        (t.profileId === "" || profileIds.has(t.profileId)) &&
        (t.agentId === "" || agentIds.has(t.agentId)) &&
        STAGES.includes(t.stage) &&
        ["Vídeo", "Reel", "Short", "Carrossel"].includes(t.format) &&
        str(t.brief) &&
        COLORS.includes(t.color),
    ) ||
    !unique(data.tasks)
  )
    throw new Error("Quadro de produção inválido.");
  if (
    !data.messages ||
    typeof data.messages !== "object" ||
    Array.isArray(data.messages) ||
    !Object.entries(data.messages).every(
      ([id, msgs]) =>
        agentIds.has(id) &&
        list(msgs, 1000) &&
        msgs.every(
          (m) => m && ["user", "assistant"].includes(m.role) && str(m.text),
        ),
    )
  )
    throw new Error("Conversas inválidas.");
  if (
    !data.activity.every(
      (a) =>
        base(a) &&
        str(a.text, 500) &&
        str(a.time, 100) &&
        !Number.isNaN(Date.parse(a.time)),
    )
  )
    throw new Error("Histórico inválido.");
  validateProduction(data);
  return data;
}

export function loadState(storage) {
  try {
    const saved = storage.getItem(STORAGE_KEY);
    return {
      data: saved ? validateState(JSON.parse(saved)) : createSeed(),
      warning: "",
    };
  } catch {
    return {
      data: createSeed(),
      warning:
        "Não foi possível recuperar os dados locais. Exporte seu trabalho para manter uma cópia.",
    };
  }
}

export function moveTask(data, id, stage) {
  if (!STAGES.includes(stage)) throw new Error("Etapa inválida.");
  const task = data.tasks.find((t) => t.id === id);
  if (!task) throw new Error("Conteúdo não encontrado.");
  task.stage = stage;
  return task;
}

export function simulationReply(agent, message) {
  const sample = message.trim().slice(0, 180);
  return `Recebi seu briefing: “${sample}${message.trim().length > 180 ? "…" : ""}”\n\nMinha função configurada é ${agent.role.toLowerCase()}. A entrega esperada é: ${agent.output || "ainda não definida"}.\n\nNesta prévia, sua mensagem fica registrada para validar o fluxo de conversa. Pesquisa, geração de conteúdo e execução de tarefas serão conectadas na etapa de backend.`;
}
