export const siteMeta = {
  workingTitle: "Repo Foundry",
  strapline: "A sharper public foundry for high-signal repositories, workflow systems, and operator-grade open-source infrastructure.",
  description:
    "Repo Foundry is a magazine-style discovery site for repositories worth studying, shipping against, or borrowing ideas from across AI, automation, coding agents, media systems, and practical developer workflows.",
  publicBoundary:
    "The public site ships curated, public-safe repository research only. Private workspace operations, local paths, telemetry, and coordination records are excluded before build.",
};

export const categoryCopy = {
  "AI command centre": {
    shortLabel: "AI command centre",
    description: "Control surfaces, model workspaces, self-hosted AI hubs, and operating consoles for agent-heavy work.",
  },
  "Workflow automation": {
    shortLabel: "Workflow automation",
    description: "Automation engines, approvals, schedules, connectors, and event-driven operational plumbing.",
  },
  "Agent workflow builder": {
    shortLabel: "Agent builder",
    description: "Graph builders, orchestration canvases, and agent authoring tools that turn flows into reusable products.",
  },
  "Video and media tooling": {
    shortLabel: "Media tooling",
    description: "Graph-based creator workflows, video tooling, and modular pipeline systems for visual output.",
  },
  "Video and music tooling": {
    shortLabel: "Music tooling",
    description: "Audio generation, music workflows, and adjacent media systems that might become practical tooling.",
  },
  Productivity: {
    shortLabel: "Productivity",
    description: "Useful interfaces and tools that make day-to-day work faster, calmer, or more automatable.",
  },
};

export const codexResources = [
  {
    title: "Codex CLI",
    url: "https://github.com/openai/codex",
    summary: "The main Codex CLI repo worth watching for workflow changes, commands, and practical coding-agent improvements.",
    tags: ["Codex", "CLI", "coding agents"],
  },
  {
    title: "Gemini CLI",
    url: "https://github.com/google-gemini/gemini-cli",
    summary: "A useful comparator for model-facing command-line workflows and operational UX decisions.",
    tags: ["CLI", "agents", "comparison"],
  },
  {
    title: "Open WebUI",
    url: "https://github.com/open-webui/open-webui",
    summary: "One of the strongest open references for a private AI command centre with multi-model control surfaces.",
    tags: ["AI workspace", "self-hosted", "control plane"],
  },
  {
    title: "n8n",
    url: "https://github.com/n8n-io/n8n",
    summary: "A high-signal automation reference for approvals, schedules, integrations, and operational workflows.",
    tags: ["automation", "workflows", "ops"],
  },
];

export const editorialNotes = [
  {
    id: "methodology",
    title: "How we curate",
    body:
      "We bias towards repos with real traction, real momentum, and a believable path to practical reuse. The goal is not to hoard links. It is to surface work we can actually learn from, build against, or operationalise.",
  },
  {
    id: "scope",
    title: "What we care about",
    body:
      "The strongest signals here sit around AI control planes, workflow automation, creator infrastructure, developer productivity, and the open-source systems shaping modern coding-agent work.",
  },
  {
    id: "boundary",
    title: "Why the public feed is curated",
    body:
      "The public site is intentionally lighter than the private working surface. It keeps the useful research, readable summaries, and public-safe structure while leaving operational notes and private coordination out of the build.",
  },
];

export const namingTrack = {
  status: "locked",
  summary: "Repo Foundry is the locked public and internal brand for the repo estate hub.",
  nextActions: [
    "Migrate the canonical repo and internal runtime naming to Repo Foundry.",
    "Refresh the public site copy, metadata, and documentation around the new brand.",
    "Carry the stronger foundry identity into the next visual design pass.",
  ],
};
