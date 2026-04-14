export const siteMeta = {
  workingTitle: "Repos Hub",
  strapline: "Curated open-source intelligence for AI operators, automation-heavy teams, and workflow builders.",
  description:
    "A magazine-style watchtower for trending repositories, Codex-adjacent tools, and reusable open-source patterns across AI, automation, media, and developer workflows.",
  publicBoundary:
    "The public site shows only curated, public-safe research records. Internal session notes, local paths, repo telemetry, and manager-only backlog data stay out of the public build.",
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
      "We bias towards repos that already have real traction, real stars, and a plausible path to practical reuse. The goal is not to hoard links. It is to surface work we can actually learn from or build against.",
  },
  {
    id: "scope",
    title: "What we care about",
    body:
      "The strongest signals here sit around AI command centres, workflow automation, productivity layers, creator tooling, and the open-source infrastructure around modern coding agents.",
  },
  {
    id: "boundary",
    title: "Why the public feed is curated",
    body:
      "The public site is intentionally lighter than the internal manager view. It keeps the useful research and leaves out workspace-specific operations, private notes, and live internal coordination.",
  },
];

export const namingTrack = {
  status: "pending-validation",
  summary: "Working label stays as Repos Hub until domain and X-handle validation is complete.",
  nextActions: [
    "Generate a shortlist of names that feel credible for open-source discovery and Codex-adjacent editorial.",
    "Validate .com availability before final branding.",
    "Validate x.com handle availability before locking the public name.",
  ],
};
