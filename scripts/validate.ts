#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { BUILTIN_TOOL_NAMES, HIDDEN_TOOL_NAMES } from "@oh-my-pi/pi-coding-agent/tools/builtin-names";
import Ajv from "ajv";
import { parse } from "yaml";

const projectRoot = resolve(import.meta.dir, "..");
const scanRoot = process.argv[2] ? resolve(process.argv[2]) : projectRoot;
const errors: string[] = [];
const sourceDirectories = ["skills", "agents", "commands", "rules"];
// Keys match bare, YAML (`key:`), or JSON (`"key":`) spellings so prompt
// fragments inside sub-agent-prompts.md cannot smuggle Claude constructs.
const forbidden = [
  /Task\(\{/,
  /["']?subagent_type["']?\s*:/,
  /\b(?:haiku|sonnet|opus|fable)\b/i,
  /CLAUDE_/,
  /mcp__/,
  /["']?allowed-tools["']?\s*:/,
  /["']?user-invocable["']?\s*:/,
  /^effort:/m,
  /["']?maxTurns["']?\s*:/,
  /Bash\(/,
  /BEADS_MODE/,
  /["']?argument-hint["']?\s*:/,
  // `model:` with a concrete provider/model id in any quoting; `@role` aliases are the only allowed value.
  /["']?model["']?[^\S\n]*:[^\S\n]*["'\[]?[^\S\n]*(?![@\]"'\s])[A-Za-z0-9./:_-]+/,
];
// Reference docs live in the hidden `wb-reference` skill; plugin-root relative
// paths do not resolve from an installed plugin (OMP has no plugin-root scheme).
const unreachablePaths = [/docs\/reference\//, /(?:^|[\s`"'(])\.\.\//];
// OMP does not validate agent tool names itself, so this allowlist is load-bearing.
const knownTools: Record<string, true> = Object.fromEntries(
  [...BUILTIN_TOOL_NAMES, ...HIDDEN_TOOL_NAMES].map(name => [name, true]),
);
/** Role aliases agents may declare. `@review` is the cross-family verification role; `@advisor` stays forbidden. */
const modelRoles = ["@smol", "@task", "@slow", "@default", "@review"];
const ajv = new Ajv({ strict: false });

async function markdownFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  const glob = new Bun.Glob("**/*.md");
  for await (const file of glob.scan({ cwd: root, absolute: true, onlyFiles: true })) {
    if (!file.includes("/node_modules/") && !file.includes("/.git/")) files.push(file);
  }
  return files.sort();
}

function frontmatter(content: string, file: string): Record<string, unknown> {
  if (!content.startsWith("---\n")) {
    errors.push(`${file}: missing YAML frontmatter`);
    return {};
  }
  const close = content.indexOf("\n---", 4);
  if (close < 0) {
    errors.push(`${file}: unclosed YAML frontmatter`);
    return {};
  }
  try {
    const value = parse(content.slice(4, close));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("expected a mapping");
    return value as Record<string, unknown>;
  } catch (error) {
    errors.push(`${file}: invalid YAML frontmatter: ${String(error)}`);
    return {};
  }
}

for (const directory of sourceDirectories) {
  const root = resolve(scanRoot, directory);
  if (!existsSync(root)) continue;
  const checkPaths = directory === "skills" || directory === "commands";
  for (const file of await markdownFiles(root)) {
    const content = await readFile(file, "utf8");
    for (const pattern of forbidden) {
      if (pattern.test(content)) errors.push(`${relative(scanRoot, file)}: forbidden source construct ${pattern}`);
    }
    if (!checkPaths) continue;
    for (const pattern of unreachablePaths) {
      if (pattern.test(content)) {
        errors.push(`${relative(scanRoot, file)}: unreachable plugin-root path ${pattern}; use skill://wb-reference/<file>`);
      }
    }
  }
}

const agentsRoot = resolve(scanRoot, "agents");
if (existsSync(agentsRoot)) {
  for (const file of await markdownFiles(agentsRoot)) {
    const display = relative(scanRoot, file);
    const fields = frontmatter(await readFile(file, "utf8"), display);
    if (typeof fields.name !== "string" || fields.name.length === 0) errors.push(`${display}: missing agent name`);
    if (typeof fields.description !== "string" || fields.description.length === 0) {
      errors.push(`${display}: missing agent description`);
    }
    if (fields.tools !== undefined) {
      const tools = Array.isArray(fields.tools) ? fields.tools : String(fields.tools).split(",");
      for (const value of tools) {
        const tool = String(value).trim();
        if (tool !== tool.toLowerCase() || knownTools[tool] !== true) {
          errors.push(`${display}: invalid agent tool ${tool}`);
        }
      }
    }
    if (fields.model !== undefined) {
      const models = Array.isArray(fields.model) ? fields.model : [fields.model];
      for (const value of models) {
        if (typeof value !== "string" || !modelRoles.includes(value)) {
          errors.push(`${display}: model must be one of ${modelRoles.join(", ")}, got ${String(value)}`);
        }
      }
    }
    if (fields.autoloadSkills !== undefined) {
      const skills = Array.isArray(fields.autoloadSkills) ? fields.autoloadSkills : [fields.autoloadSkills];
      for (const value of skills) {
        const target = resolve(scanRoot, "skills", String(value), "SKILL.md");
        if (!existsSync(target)) errors.push(`${display}: unknown autoload skill ${String(value)}`);
      }
    }
    if (fields.output !== undefined) {
      try {
        ajv.compile(fields.output);
      } catch (error) {
        errors.push(`${display}: invalid output JSON Schema: ${String(error)}`);
      }
    }
  }
}

const commandsRoot = resolve(scanRoot, "commands");
if (existsSync(commandsRoot)) {
  for (const file of await markdownFiles(commandsRoot)) {
    const content = await readFile(file, "utf8");
    for (const match of content.matchAll(/skill:\/\/([a-z0-9_-]+)/g)) {
      const target = resolve(scanRoot, "skills", match[1], "SKILL.md");
      if (!existsSync(target)) errors.push(`${relative(scanRoot, file)}: missing ${match[0]} target`);
    }
  }
}

if (scanRoot === projectRoot) {
  // Check 4: every `skills/wb-*/` destination named in the file map exists on disk.
  const syncGuide = await readFile(resolve(projectRoot, "docs/upstream-sync.md"), "utf8");
  const mappedSkills = new Set([...syncGuide.matchAll(/`skills\/(wb-[a-z0-9_-]+)\/`/g)].map(match => match[1]));
  if (mappedSkills.size === 0) errors.push("docs/upstream-sync.md: file map names no skills/wb-*/ destination");
  for (const skill of mappedSkills) {
    if (!existsSync(resolve(projectRoot, "skills", skill, "SKILL.md"))) {
      errors.push(`docs/upstream-sync.md: mapped destination skills/${skill}/SKILL.md does not exist`);
    }
  }

  const workerModels: Record<string, [string[], string]> = {
    "wb-task-worker-smol.md": [["@smol"], "high"],
    "wb-task-worker-task.md": [["@task"], "medium"],
    "wb-task-worker-slow.md": [["@slow", "@task"], "high"],
  };
  const expectedTools = ["read", "write", "edit", "grep", "glob", "bash"];
  const expectedAutoload = ["wb-task-worker-contract", "wb-tdd-discipline"];
  let workerOutput: string | undefined;
  for (const [file, [model, thinkingLevel]] of Object.entries(workerModels)) {
    const display = `agents/${file}`;
    const fields = frontmatter(await readFile(resolve(projectRoot, display), "utf8"), display);
    if (fields.name !== file.slice(0, -3)) errors.push(`${display}: name must match filename`);
    if (JSON.stringify(fields.tools) !== JSON.stringify(expectedTools)) {
      errors.push(`${display}: worker tools must match the shared profile`);
    }
    if (JSON.stringify(fields.model) !== JSON.stringify(model)) {
      errors.push(`${display}: expected model ${JSON.stringify(model)}`);
    }
    if (fields.thinkingLevel !== thinkingLevel) errors.push(`${display}: thinkingLevel must be ${thinkingLevel}`);
    if (JSON.stringify(fields.autoloadSkills) !== JSON.stringify(expectedAutoload)) {
      errors.push(`${display}: must autoload the worker contract and TDD discipline`);
    }
    const output = JSON.stringify(fields.output);
    workerOutput ??= output;
    if (output !== workerOutput) errors.push(`${display}: output schema must match the other worker profiles`);
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}

if (scanRoot !== projectRoot) {
  process.stdout.write(`Static checks passed: ${scanRoot}\n`);
  process.exit(0);
}

for (const command of [
  [resolve(projectRoot, "scripts/lint"), "--all"],
  [resolve(projectRoot, "node_modules/.bin/bun"), resolve(projectRoot, "evals/discover.ts")],
]) {
  const child = Bun.spawnSync(command, { cwd: projectRoot, stdout: "inherit", stderr: "inherit" });
  if (child.exitCode !== 0) process.exit(child.exitCode);
}

process.stdout.write("Validation passed.\n");
