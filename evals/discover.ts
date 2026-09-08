#!/usr/bin/env bun
// Tier 1: prove OMP discovers this checkout exactly as `omp --plugin-dir` /
// a marketplace install would. OMP resolves `~/.omp` when its modules load,
// so the script re-executes itself under an isolated HOME (see
// ./isolated-home.ts) before importing any discovery surface.

import { resolve } from "node:path";
import { createIsolatedHome, isolatedEnv, root } from "./isolated-home";

const ISOLATED_FLAG = "WB_EVAL_ISOLATED_PLUGIN_DIR";

if (!process.env[ISOLATED_FLAG]) {
  const isolated = await createIsolatedHome({ seedCredentials: false });
  try {
    const child = Bun.spawn([process.execPath, import.meta.path], {
      cwd: root,
      env: { ...isolatedEnv(isolated.home), [ISOLATED_FLAG]: isolated.pluginDir },
      stdout: "inherit",
      stderr: "inherit",
    });
    process.exit(await child.exited);
  } finally {
    await isolated.dispose();
  }
}

const pluginDir = process.env[ISOLATED_FLAG] as string;
// Dynamic imports on purpose: OMP snapshots `os.homedir()`/`~/.omp` when its
// modules are first evaluated, so the discovery surfaces must load only in
// the re-executed child whose HOME is already the isolated one.
const {
  discoverAgents,
  discoverAndLoadExtensions,
  discoverSkills,
  discoverSlashCommands,
} = await import("@oh-my-pi/pi-coding-agent");
const { loadCapability } = await import("@oh-my-pi/pi-coding-agent/capability");
const { injectPluginDirRoots } = await import("@oh-my-pi/pi-coding-agent/discovery/helpers");
const { marketplacePluginName } = await import("./isolated-home");

type Named = { name: string; agents?: string[] };
const workflowCommands = [
  "create_design",
  "create_handoff",
  "create_mockup",
  "create_product_research",
  "create_project",
  "create_research",
  "create_tasks",
  "explore_design",
  "help",
  "implement_coordinated",
  "implement_tasks",
  "mockup-iteration",
  "research-validation",
  "resume_handoff",
  "review-prep",
  "update_status",
  "validate_execution",
  "validate_project",
];

const pluginName = await marketplacePluginName();
const home = process.env.HOME as string;
await injectPluginDirRoots(home, [pluginDir], root);
const extensionPath = resolve(root, "extensions", "workbench.ts");
// Agents: user-scope plugin roots (`--plugin-dir`, marketplace) are gated
// behind the opt-in `claude-plugins` user source (omp:task/discovery.ts:109-113),
// so the CLI route yields none. The port's agents reach sessions through the
// extension-package lane (`extensions:` setting / `-e <dir>`), which the
// runner mirrors by staging `agents/` into the scratch `.omp/agents`.
const extensionRoots = {
  explicit: [root],
  configured: [],
  configuredLevel: "user" as const,
  mode: "explicit-only" as const,
};
const [skillsResult, commands, agentsResult, rulesResult, extensionsResult] = await Promise.all([
  discoverSkills(root),
  discoverSlashCommands(root),
  discoverAgents(root, home, extensionRoots),
  loadCapability<Named>("rules", { cwd: root }),
  discoverAndLoadExtensions([extensionPath], root),
]);

const report = {
  commands: commands.map(item => item.name).filter(name => name.startsWith(`${pluginName}:`)),
  skills: skillsResult.skills.map(item => item.name).filter(name => name.startsWith("wb-")),
  hiddenSkills: skillsResult.skills
    .filter(skill => skill.hide === true)
    .map(skill => skill.name)
    .filter(name => name.startsWith("wb-")),
  agents: agentsResult.agents.map(item => item.name).filter(name => name.startsWith("wb-")),
  agentFields: agentsResult.agents
    .filter(agent => agent.name.startsWith("wb-"))
    .map(agent => ({
      name: agent.name,
      tools: agent.tools,
      model: agent.model,
      thinkingLevel: agent.thinkingLevel,
      readSummarize: agent.readSummarize,
      blocking: agent.blocking,
      autoloadSkills: agent.autoloadSkills,
      hasOutput: agent.output !== undefined,
    })),
  rules: rulesResult.items.map(item => item.name).filter(name => name.startsWith("wb-")),
  ruleFields: rulesResult.items
    .filter(item => item.name.startsWith("wb-"))
    .map(item => ({ name: item.name, agents: item.agents })),
  extensions: extensionsResult.extensions.map(extension => ({
    path: extension.resolvedPath,
    handlers: [...extension.handlers.keys()],
    commands: [...extension.commands.keys()],
    tools: [...extension.tools.keys()],
  })),
  extensionErrors: extensionsResult.errors,
};

const expected = {
  commands: workflowCommands.map(name => `${pluginName}:${name}`),
  skills: [
    ...workflowCommands.map(name => `wb-${name}`),
    "wb-doc-adherence",
    "wb-reference",
    "wb-status-sync",
    "wb-task-worker-contract",
    "wb-tdd-discipline",
  ],
  hiddenSkills: ["wb-reference", "wb-task-worker-contract", "wb-tdd-discipline"],
  agents: [
    "wb-codebase-analyzer",
    "wb-codebase-locator",
    "wb-pattern-finder",
    "wb-product-analyzer",
    "wb-research-validator",
    "wb-task-verifier",
    "wb-task-worker-slow",
    "wb-task-worker-smol",
    "wb-task-worker-task",
  ],
  rules: ["wb-project-structure", "wb-red-flags", "wb-verification"],
};

for (const key of Object.keys(expected) as Array<keyof typeof expected>) {
  const actual = [...report[key]].sort();
  const wanted = [...expected[key]].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${key}: expected ${JSON.stringify(wanted)}, got ${JSON.stringify(actual)}`);
  }
}

const agentFields = new Map(report.agentFields.map(agent => [agent.name, agent]));
function requireAgent(name: string) {
  const agent = agentFields.get(name);
  if (!agent) throw new Error(`missing normalized agent fields for ${name}`);
  return agent;
}

for (const name of [
  "wb-codebase-analyzer",
  "wb-pattern-finder",
  "wb-product-analyzer",
  "wb-research-validator",
  "wb-task-verifier",
]) {
  if (requireAgent(name).readSummarize !== false) throw new Error(`${name}: readSummarize must be false`);
}
for (const name of ["wb-research-validator", "wb-task-verifier"]) {
  if (requireAgent(name).blocking !== true) throw new Error(`${name}: blocking must be true`);
}
for (const name of [
  "wb-task-verifier",
  "wb-task-worker-smol",
  "wb-task-worker-task",
  "wb-task-worker-slow",
]) {
  if (!requireAgent(name).hasOutput) throw new Error(`${name}: output schema is required`);
}
const workerProfiles: Array<[string, string[]]> = [
  ["wb-task-worker-smol", ["@smol"]],
  ["wb-task-worker-task", ["@task"]],
  ["wb-task-worker-slow", ["@slow", "@task"]],
];
const workerTools = ["read", "write", "edit", "grep", "glob", "bash", "yield"];
const workerSkills = ["wb-task-worker-contract", "wb-tdd-discipline"];
for (const [name, model] of workerProfiles) {
  const agent = requireAgent(name);
  if (JSON.stringify(agent.tools) !== JSON.stringify(workerTools)) {
    throw new Error(`${name}: normalized tools do not match the worker profile`);
  }
  if (JSON.stringify(agent.model) !== JSON.stringify(model)) {
    throw new Error(`${name}: expected normalized model ${JSON.stringify(model)}`);
  }
  if (agent.thinkingLevel !== "xhigh") throw new Error(`${name}: thinkingLevel must be xhigh`);
  if (JSON.stringify(agent.autoloadSkills) !== JSON.stringify(workerSkills)) {
    throw new Error(`${name}: shared worker skills must autoload in order`);
  }
}
for (const agent of report.agentFields) {
  if (agent.model?.some(model => !model.startsWith("@"))) {
    throw new Error(`${agent.name}: concrete model ids are forbidden`);
  }
}
const verificationRule = report.ruleFields.find(rule => rule.name === "wb-verification");
if (
  !verificationRule ||
  JSON.stringify(verificationRule.agents) !==
    JSON.stringify(["main", "wb-task-worker-*"])
) {
  throw new Error("wb-verification: expected main and wb-task-worker-* agent scope");
}

if (report.extensionErrors.length > 0) {
  throw new Error(`extension load failed: ${JSON.stringify(report.extensionErrors)}`);
}
const workbenchExtensions = report.extensions.filter(item => item.path.endsWith("/extensions/workbench.ts"));
if (workbenchExtensions.length !== 1 || workbenchExtensions[0].path !== extensionPath) {
  throw new Error(
    `expected exactly one workbench extension at ${extensionPath}, got ${JSON.stringify(workbenchExtensions.map(item => item.path))}`,
  );
}
const workbenchExtension = workbenchExtensions[0];
const expectedHandlers = [
  "before_agent_start",
  "session.compacting",
  "session_compact",
  "session_shutdown",
  "session_start",
  "session_stop",
  "session_switch",
  "session_tree",
  "tool_result",
];
if (JSON.stringify([...workbenchExtension.handlers].sort()) !== JSON.stringify(expectedHandlers)) {
  throw new Error(`workbench extension handlers: expected ${JSON.stringify(expectedHandlers)}, got ${JSON.stringify(workbenchExtension.handlers)}`);
}

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
