#!/usr/bin/env bun

import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { discoverSlashCommands } from "@oh-my-pi/pi-coding-agent";
import { injectPluginDirRoots } from "@oh-my-pi/pi-coding-agent/discovery/helpers";
import { createIsolatedHome, isolatedEnv, root } from "./isolated-home";

interface EvalCase {
  name: string;
  fixture: string;
  prompt: string;
  timeoutSeconds: number;
  beads?: {
    issues?: Array<{
      title: string;
      id?: string;
      type?: string;
      parent?: string;
      description?: string;
      status?: "open" | "in_progress" | "closed";
      closeReason?: string;
    }>;
  };
  assert: {
    commands: string[];
    finalContains: string[];
    workspace?: {
      files?: string[];
      missing?: string[];
      contains?: Record<string, string[]>;
      absent?: Record<string, string[]>;
      frontmatter?: Record<string, string[]>;
      citations?: string[];
    };
    trace?: {
      singleTaskBatchAgents?: string[];
      singleTaskBatchSize?: number;
      adHocTaskContains?: string[];
      taskBatches?: string[][];
      maxTaskCalls?: number;
      closeAfterVerifierPass?: boolean;
      forbiddenTools?: string[];
      customMessages?: Array<{ customType: string; exact: number }>;
    };
    beads?: {
      titles: Array<{
        prefix: string;
        status: "open" | "in_progress" | "closed" | "not_closed";
        minimum: number;
      }>;
      hierarchy?: {
        epicPrefix: string;
        milestonePrefix: string;
        minimumTasks: number;
      };
      exactTotal?: number;
      contains?: string[];
    };
  };
}

interface TraceMessage {
  role?: string;
  customType?: string;
  timestamp?: number;
  content?: string | Array<{ type?: string; text?: string }>;
}

interface TraceEvent {
  type?: string;
  toolCallId?: string;
  toolName?: string;
  args?: unknown;
  result?: { content?: Array<{ type?: string; text?: string }> };
  message?: TraceMessage;
  messages?: TraceMessage[];
}

interface TaskItem {
  name?: string;
  agent?: string;
  task?: string;
}

/** Items that omit `agent` run on the spawn policy default, `task`. */
const DEFAULT_TASK_AGENT = "task";
/** Grace after `--max-time` before the runner kills a child that ignored it. */
const WATCHDOG_GRACE_SECONDS = 30;

const casesRoot = resolve(import.meta.dir, "cases");
const fixturesRoot = resolve(import.meta.dir, "fixtures");
const rawArgs = process.argv.slice(2);
const configFlag = rawArgs.indexOf("--config");
const configName = configFlag >= 0 ? rawArgs[configFlag + 1] : undefined;
if (configFlag >= 0 && !configName) {
  process.stderr.write("--config requires a file name under evals/\n");
  process.exit(1);
}
/** Model-role config for the spawned OMP; `--config config.swap.yml` selects the cross-provider overlay. */
const configPath = resolve(import.meta.dir, configName ?? "config.yml");
const args = configFlag >= 0 ? [...rawArgs.slice(0, configFlag), ...rawArgs.slice(configFlag + 2)] : rawArgs;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function loadCases(): Promise<EvalCase[]> {
  const paths: string[] = [];
  for await (const path of new Bun.Glob("*.json").scan({ cwd: casesRoot, absolute: true, onlyFiles: true })) {
    paths.push(path);
  }
  paths.sort();

  const cases: EvalCase[] = [];
  for (const path of paths) {
    const value: unknown = JSON.parse(await readFile(path, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${path}: expected an object`);
    const candidate = value as Partial<EvalCase>;
    if (candidate.name !== basename(path, ".json")) fail(`${path}: name must match its filename`);
    if (typeof candidate.fixture !== "string" || candidate.fixture.length === 0) fail(`${path}: fixture is required`);
    if (typeof candidate.prompt !== "string" || candidate.prompt.length === 0) fail(`${path}: prompt is required`);
    if (!Number.isFinite(candidate.timeoutSeconds) || Number(candidate.timeoutSeconds) <= 0) {
      fail(`${path}: timeoutSeconds must be positive`);
    }
    if (!candidate.assert || !Array.isArray(candidate.assert.commands) || !Array.isArray(candidate.assert.finalContains)) {
      fail(`${path}: assert.commands and assert.finalContains are required`);
    }
    for (const entry of candidate.assert.trace?.customMessages ?? []) {
      if (typeof entry?.customType !== "string" || !Number.isInteger(entry.exact) || entry.exact < 0) {
        fail(`${path}: assert.trace.customMessages entries need customType and a non-negative integer exact`);
      }
    }
    const fixturePath = resolve(fixturesRoot, candidate.fixture);
    if (!(await Bun.file(join(fixturePath, "README.md")).exists())) fail(`${path}: missing fixture ${candidate.fixture}`);
    cases.push(candidate as EvalCase);
  }
  if (cases.length === 0) fail("No eval cases found");
  return cases;
}

function parseSelection(cases: EvalCase[]): { mode: "list" | "validate" | "dry-run" | "run"; cases: EvalCase[] } {
  if (args.length === 1 && args[0] === "--list") return { mode: "list", cases };
  if (args.length === 1 && args[0] === "--validate-cases") return { mode: "validate", cases };
  if (args.length === 1 && args[0] === "--dry-run") return { mode: "dry-run", cases };
  if (args.length === 2 && args[0] === "--case") {
    if (args[1] === "all") return { mode: "run", cases };
    const selected = cases.find(candidate => candidate.name === args[1]);
    if (!selected) fail(`Unknown eval case: ${args[1]}`);
    return { mode: "run", cases: [selected] };
  }
  fail("Usage: scripts/eval [--config <file>] --list | --validate-cases | --dry-run | --case <name|all>");
}

function messageText(message: TraceMessage | undefined): string {
  const content = message?.content;
  if (typeof content === "string") return content;
  return content?.filter(part => part.type === "text").map(part => part.text ?? "").join("") ?? "";
}

function assistantText(events: TraceEvent[]): string {
  const messages = events
    .filter(event => event.type === "message_end" && event.message?.role === "assistant")
    .map(event => messageText(event.message))
    .filter(Boolean);
  return messages.at(-1) ?? "";
}

async function matchingFiles(root: string, pattern: string): Promise<string[]> {
  const paths: string[] = [];
  for await (const path of new Bun.Glob(pattern).scan({ cwd: root, onlyFiles: true })) paths.push(path);
  return paths.sort();
}

async function assertWorkspace(testCase: EvalCase, scratch: string): Promise<void> {
  const workspace = testCase.assert.workspace;
  if (!workspace) return;

  for (const pattern of workspace.files ?? []) {
    if ((await matchingFiles(scratch, pattern)).length === 0) {
      throw new Error(`workspace file pattern matched nothing: ${pattern}`);
    }
  }

  for (const pattern of workspace.missing ?? []) {
    if ((await matchingFiles(scratch, pattern)).length !== 0) {
      throw new Error(`workspace pattern should be absent: ${pattern}`);
    }
  }

  for (const [pattern, required] of Object.entries(workspace.contains ?? {})) {
    const paths = await matchingFiles(scratch, pattern);
    if (paths.length === 0) throw new Error(`workspace content pattern matched nothing: ${pattern}`);
    for (const path of paths) {
      const content = await readFile(resolve(scratch, path), "utf8");
      for (const text of required) {
        if (!content.includes(text)) throw new Error(`${path} is missing ${JSON.stringify(text)}`);
      }
    }
  }

  for (const [pattern, forbidden] of Object.entries(workspace.absent ?? {})) {
    const paths = await matchingFiles(scratch, pattern);
    if (paths.length === 0) throw new Error(`workspace absence pattern matched nothing: ${pattern}`);
    for (const path of paths) {
      const content = await readFile(resolve(scratch, path), "utf8");
      for (const text of forbidden) {
        if (content.includes(text)) throw new Error(`${path} contains forbidden text ${JSON.stringify(text)}`);
      }
    }
  }

  for (const [pattern, fields] of Object.entries(workspace.frontmatter ?? {})) {
    const paths = await matchingFiles(scratch, pattern);
    if (paths.length === 0) throw new Error(`frontmatter pattern matched nothing: ${pattern}`);
    for (const path of paths) {
      const content = await readFile(resolve(scratch, path), "utf8");
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)?.[1];
      if (!frontmatter) throw new Error(`${path} has no YAML frontmatter`);
      for (const field of fields) {
        if (!new RegExp(`^${field}:`, "m").test(frontmatter)) {
          throw new Error(`${path} frontmatter is missing ${field}`);
        }
      }
    }
  }

  for (const pattern of workspace.citations ?? []) {
    const paths = await matchingFiles(scratch, pattern);
    if (paths.length === 0) throw new Error(`citation pattern matched nothing: ${pattern}`);
    for (const path of paths) {
      const content = await readFile(resolve(scratch, path), "utf8");
      const citations = [...content.matchAll(/`([A-Za-z0-9_./-]+\.[A-Za-z0-9]+):(\d+)(?:-(\d+))?`/g)];
      if (citations.length === 0) throw new Error(`${path} contains no file:line citations`);
      for (const citation of citations) {
        const [, citedPath, startText, endText] = citation;
        const target = resolve(scratch, citedPath);
        if (!(await Bun.file(target).exists())) throw new Error(`${path} cites missing file ${citedPath}`);
        const lineCount = (await readFile(target, "utf8")).split("\n").length;
        const start = Number(startText);
        const end = Number(endText ?? startText);
        if (start < 1 || end < start || end > lineCount) {
          throw new Error(`${path} has invalid citation ${citedPath}:${start}-${end}; file has ${lineCount} lines`);
        }
      }
    }
  }
}

function taskItems(event: TraceEvent): TaskItem[] {
  return (event.args as { tasks?: TaskItem[] } | undefined)?.tasks ?? [];
}

function agentOf(item: TaskItem): string {
  return item.agent || DEFAULT_TASK_AGENT;
}

/** Agents of one spawn, sorted for multiset comparison. */
function batchAgents(event: TraceEvent): string[] {
  return taskItems(event).map(agentOf).sort();
}

/** Verifier payload says pass: parse the structured output, tolerate a truncated preview. */
function verifierPassed(body: string): boolean {
  const output = body.match(/<(?:output|preview)[^>]*>\n?([\s\S]*?)\n?<\/(?:output|preview)>/)?.[1] ?? "";
  try {
    const parsed = JSON.parse(output) as { status?: unknown };
    return parsed.status === "pass";
  } catch {
    return /"status"\s*:\s*"pass"/.test(output);
  }
}

function customMessageCounts(events: TraceEvent[]): Map<string, number> {
  // The same message appears in message_start, message_end, and the agent_end
  // transcript; dedupe by identity fields before counting.
  const seen = new Set<string>();
  const counts = new Map<string, number>();
  const messages = events.flatMap(event => [...(event.message ? [event.message] : []), ...(event.messages ?? [])]);
  for (const message of messages) {
    if (message.role !== "custom" || typeof message.customType !== "string") continue;
    const key = `${message.customType}\u0000${message.timestamp ?? ""}\u0000${messageText(message)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    counts.set(message.customType, (counts.get(message.customType) ?? 0) + 1);
  }
  return counts;
}

function assertTrace(testCase: EvalCase, events: TraceEvent[]): void {
  const trace = testCase.assert.trace;
  if (!trace) return;
  const calls = events.filter(event => event.type === "tool_execution_start" && event.toolName);
  const taskCalls = calls.filter(call => call.toolName === "task");

  for (const forbidden of trace.forbiddenTools ?? []) {
    if (calls.some(call => call.toolName === forbidden)) throw new Error(`trace used forbidden tool ${forbidden}`);
  }

  if (trace.maxTaskCalls !== undefined && taskCalls.length > trace.maxTaskCalls) {
    throw new Error(`expected at most ${trace.maxTaskCalls} task call(s), got ${taskCalls.length}`);
  }

  if (trace.singleTaskBatchAgents) {
    if (taskCalls.length !== 1) throw new Error(`expected one task call, got ${taskCalls.length}`);
    const actual = batchAgents(taskCalls[0]);
    const expected = [...trace.singleTaskBatchAgents].sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`expected task batch agents ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  if (trace.singleTaskBatchSize !== undefined || trace.adHocTaskContains) {
    if (taskCalls.length !== 1) throw new Error(`expected one task call, got ${taskCalls.length}`);
    const items = taskItems(taskCalls[0]);
    if (trace.singleTaskBatchSize !== undefined && items.length !== trace.singleTaskBatchSize) {
      throw new Error(`expected task batch size ${trace.singleTaskBatchSize}, got ${items.length}`);
    }
    const adHocItems = items.filter(item => agentOf(item) === DEFAULT_TASK_AGENT);
    for (const required of trace.adHocTaskContains ?? []) {
      if (adHocItems.length === 0 || adHocItems.some(item => !item.task?.includes(required))) {
        throw new Error(`every ad-hoc task must contain ${JSON.stringify(required)}`);
      }
    }
  }

  if (trace.taskBatches) {
    const unused = new Set(taskCalls.map((_, index) => index));
    for (const expectedBatch of trace.taskBatches) {
      const expected = JSON.stringify([...expectedBatch].sort());
      const match = [...unused].find(index => JSON.stringify(batchAgents(taskCalls[index])) === expected);
      if (match === undefined) throw new Error(`no unused task batch matched ${expected}`);
      unused.delete(match);
    }
  }

  if (trace.closeAfterVerifierPass) {
    // A verifier result names neither the task nor the Beads issue, so a pass
    // is mapped back to an issue through its spawn item: `<task-result id>`
    // echoes the item `name`, and the item `task` prompt cites the issue id.
    // Limitation: an id no verifier prompt mentions (or an unnamed item) cannot
    // be paired, so its close only has to follow the first verifier pass.
    const spawns = new Map<string, TaskItem[]>();
    const passes: Array<{ index: number; prompt: string }> = [];
    events.forEach((event, index) => {
      if (event.type === "tool_execution_start" && event.toolName === "task" && event.toolCallId) {
        spawns.set(event.toolCallId, taskItems(event));
      }
      if (event.type !== "tool_execution_end" || event.toolName !== "task") return;
      const items = event.toolCallId ? (spawns.get(event.toolCallId) ?? []) : [];
      const text = event.result?.content?.filter(part => part.type === "text").map(part => part.text ?? "").join("\n") ?? "";
      const blocks = text.matchAll(
        /<task-result id="([^"]*)" agent="wb-task-verifier" status="([^"]*)"[^>]*>([\s\S]*?)<\/task-result>/g,
      );
      for (const [, id, status, body] of blocks) {
        if (status !== "completed" || !verifierPassed(body)) continue;
        passes.push({ index, prompt: items.find(item => item.name === id)?.task ?? "" });
      }
    });
    const closes = events.flatMap((event, index) => {
      if (event.type !== "tool_execution_start" || event.toolName !== "bash") return [];
      const command = (event.args as { command?: unknown } | undefined)?.command;
      if (typeof command !== "string") return [];
      return [...command.matchAll(/\bbd close\s+(\S+)/g)].map(match => ({ index, id: match[1] }));
    });
    if (passes.length === 0 || closes.length === 0) throw new Error("missing verifier pass or coordinator bd close trace");
    for (const close of closes) {
      const mentioning = passes.filter(pass => pass.prompt.includes(close.id));
      const required = mentioning.length > 0 ? mentioning : passes.slice(0, 1);
      if (!required.some(pass => pass.index < close.index)) {
        throw new Error(`coordinator closed ${close.id} before verifier pass evidence`);
      }
    }
  }

  if (trace.customMessages) {
    const counts = customMessageCounts(events);
    for (const { customType, exact } of trace.customMessages) {
      const actual = counts.get(customType) ?? 0;
      if (actual !== exact) throw new Error(`expected ${exact} ${customType} custom message(s), got ${actual}`);
    }
  }
}

function runChecked(command: string[], cwd: string, label: string): string {
  const result = Bun.spawnSync(command, { cwd, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error(`${label}: ${result.stderr.toString() || result.stdout.toString()}`);
  return result.stdout.toString().trim();
}

function setupBeads(testCase: EvalCase, scratch: string): void {
  if (!testCase.beads) return;
  const bd = Bun.which("bd");
  if (!bd) throw new Error("bd executable not found");
  runChecked([bd, "init", "--non-interactive", "--skip-agents", "--skip-hooks", "--prefix", "eval"], scratch, "bd init failed");
  const created: Array<{
    issue: NonNullable<NonNullable<EvalCase["beads"]>["issues"]>[number];
    id: string;
  }> = [];
  for (const issue of testCase.beads.issues ?? []) {
    const createArgs = [
      bd,
      "create",
      issue.title,
      "--type",
      issue.type ?? "task",
      "--description",
      issue.description ?? "",
      "--silent",
    ];
    if (issue.parent && !issue.id) createArgs.push("--parent", issue.parent);
    if (issue.id) createArgs.push("--id", issue.id);
    const id = runChecked(createArgs, scratch, "bd create failed");
    created.push({ issue, id });
  }
  for (const { id } of created.filter(entry => entry.issue.status === "in_progress")) {
    runChecked([bd, "update", id, "--status", "in_progress"], scratch, "bd start failed");
  }
  const closed = created
    .filter(entry => entry.issue.status === "closed")
    .sort((left, right) => right.id.split(".").length - left.id.split(".").length);
  for (const { issue, id } of closed) {
    runChecked([bd, "close", id, "--reason", issue.closeReason ?? "Closed by eval fixture."], scratch, "bd close failed");
  }
}

/** Commands as the child will see them: the staged `--plugin-dir` under the isolated home. */
async function discoveredCommands(home: string, pluginDir: string, cwd: string, expected: string[]): Promise<string[]> {
  await injectPluginDirRoots(home, [pluginDir], cwd);
  const commands = await discoverSlashCommands(cwd);
  return commands
    .map(command => command.name)
    .filter(command => expected.includes(command))
    .sort();
}

function assertBeads(testCase: EvalCase, scratch: string): void {
  const expected = testCase.assert.beads;
  if (!expected) return;
  const bd = Bun.which("bd");
  if (!bd) throw new Error("bd executable not found");
  const parsed = JSON.parse(runChecked([bd, "list", "--all", "-n", "0", "--json"], scratch, "bd list failed")) as unknown;
  let issues: unknown[] = [];
  if (Array.isArray(parsed)) {
    issues = parsed;
  } else if (parsed && typeof parsed === "object" && "issues" in parsed && Array.isArray(parsed.issues)) {
    issues = parsed.issues;
  }
  if (expected.exactTotal !== undefined && issues.length !== expected.exactTotal) {
    throw new Error(`expected exactly ${expected.exactTotal} Beads issue(s), got ${issues.length}`);
  }
  const serializedIssues = JSON.stringify(issues);
  for (const fragment of expected.contains ?? []) {
    if (!serializedIssues.includes(fragment)) throw new Error(`Beads records are missing ${JSON.stringify(fragment)}`);
  }
  for (const title of expected.titles) {
    const count = issues.filter(issue => {
      if (!issue || typeof issue !== "object" || !("title" in issue) || !("status" in issue)) return false;
      const stateMatches = title.status === "not_closed" ? issue.status !== "closed" : issue.status === title.status;
      return typeof issue.title === "string" && issue.title.toLowerCase().startsWith(title.prefix.toLowerCase()) && stateMatches;
    }).length;
    if (count < title.minimum) {
      throw new Error(
        `expected at least ${title.minimum} ${title.status} Beads title(s) beginning ${JSON.stringify(title.prefix)}, got ${count}`,
      );
    }
  }
  const hierarchy = expected.hierarchy;
  if (!hierarchy) return;
  const records = issues.filter(
    (issue): issue is Record<string, unknown> => Boolean(issue) && typeof issue === "object",
  );
  const epic = records.find(
    issue =>
      typeof issue.title === "string" &&
      issue.title.toLowerCase().startsWith(hierarchy.epicPrefix.toLowerCase()) &&
      issue.issue_type === "epic" &&
      typeof issue.id === "string",
  );
  if (!epic || typeof epic.id !== "string") throw new Error(`no epic beginning ${JSON.stringify(hierarchy.epicPrefix)}`);
  const milestones = records.filter(
    issue =>
      typeof issue.title === "string" &&
      issue.title.toLowerCase().startsWith(hierarchy.milestonePrefix.toLowerCase()) &&
      typeof issue.id === "string",
  );
  if (milestones.length === 0) throw new Error(`no milestone beginning ${JSON.stringify(hierarchy.milestonePrefix)}`);
  for (const milestone of milestones) {
    if (typeof milestone.id !== "string" || !milestone.id.startsWith(`${epic.id}.`)) {
      throw new Error(`milestone ${String(milestone.id)} is not a child of epic ${epic.id}`);
    }
  }
  const milestoneIds = milestones
    .map(milestone => milestone.id)
    .filter((id): id is string => typeof id === "string");
  const childTasks = records.filter(
    issue =>
      typeof issue.id === "string" &&
      milestoneIds.some(milestoneId => issue.id.startsWith(`${milestoneId}.`)),
  );
  if (childTasks.length < hierarchy.minimumTasks) {
    throw new Error(`expected at least ${hierarchy.minimumTasks} task children under milestones, got ${childTasks.length}`);
  }
}

interface CaseSummary {
  name: string;
  status: "pass" | "fail";
  reason?: string;
  commands?: string[];
}

async function runCase(testCase: EvalCase, artifactRoot: string): Promise<CaseSummary> {
  const scratch = await mkdtemp(join(tmpdir(), `wb-eval-${testCase.name}-`));
  const artifactDir = resolve(artifactRoot, testCase.name);
  await mkdir(artifactDir, { recursive: true });
  const isolated = await createIsolatedHome({ seedCredentials: true });
  let summary: CaseSummary = { name: testCase.name, status: "fail" };

  try {
    await cp(resolve(fixturesRoot, testCase.fixture), scratch, { recursive: true });
    await mkdir(resolve(scratch, ".omp", "agents"), { recursive: true });
    await cp(resolve(root, "agents"), resolve(scratch, ".omp", "agents"), { recursive: true });
    await writeFile(resolve(scratch, ".omp", "config.yml"), await readFile(configPath, "utf8"));
    const gitPath = Bun.which("git");
    if (!gitPath) throw new Error("git executable not found");
    runChecked([gitPath, "init", "--quiet"], scratch, "git init failed");
    setupBeads(testCase, scratch);
    runChecked([gitPath, "config", "user.name", "Workbench Eval"], scratch, "git name config failed");
    runChecked([gitPath, "config", "user.email", "eval@example.invalid"], scratch, "git email config failed");
    runChecked([gitPath, "add", "."], scratch, "git add failed");
    runChecked([gitPath, "commit", "--quiet", "-m", "eval fixture"], scratch, "git commit failed");

    const actualCommands = await discoveredCommands(isolated.home, isolated.pluginDir, scratch, testCase.assert.commands);
    const expectedCommands = [...testCase.assert.commands].sort();
    if (JSON.stringify(actualCommands) !== JSON.stringify(expectedCommands)) {
      throw new Error(`expected commands ${JSON.stringify(expectedCommands)}, got ${JSON.stringify(actualCommands)}`);
    }
    summary.commands = actualCommands;

    const omp = process.env.OMP_BIN ?? Bun.which("omp");
    if (!omp) throw new Error("omp executable not found");
    const child = Bun.spawn(
      [
        omp,
        "--mode",
        "json",
        "--print",
        "--no-session",
        "--approval-mode",
        "yolo",
        "--plugin-dir",
        isolated.pluginDir,
        "-e",
        resolve(root, "extensions", "workbench.ts"),
        "--config",
        configPath,
        "--max-time",
        String(testCase.timeoutSeconds),
        testCase.prompt,
      ],
      { cwd: scratch, env: isolatedEnv(isolated.home), stdout: "pipe", stderr: "pipe" },
    );
    let watchdogFired = false;
    const watchdog = setTimeout(() => {
      watchdogFired = true;
      child.kill("SIGKILL");
    }, (testCase.timeoutSeconds + WATCHDOG_GRACE_SECONDS) * 1000);
    const stdoutPromise = new Response(child.stdout).text();
    const stderrPromise = new Response(child.stderr).text();
    const exitCode = await child.exited;
    clearTimeout(watchdog);
    const [stdout, stderr] = await Promise.all([stdoutPromise, stderrPromise]);
    await writeFile(resolve(artifactDir, "trace.jsonl"), stdout);
    await writeFile(resolve(artifactDir, "stderr.log"), stderr);

    const events = stdout
      .split("\n")
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line) as TraceEvent;
        } catch {
          throw new Error(`invalid JSON trace line: ${line}`);
        }
      });
    const final = assistantText(events);
    await writeFile(resolve(artifactDir, "final.md"), final);
    await cp(scratch, resolve(artifactDir, "workspace-after"), { recursive: true });

    if (watchdogFired) {
      throw new Error(`omp ignored --max-time; killed ${WATCHDOG_GRACE_SECONDS}s after ${testCase.timeoutSeconds}s`);
    }
    if (exitCode !== 0) throw new Error(`omp exited ${exitCode}; see ${artifactDir}/stderr.log`);
    assertTrace(testCase, events);
    for (const required of testCase.assert.finalContains) {
      if (!final.includes(required)) throw new Error(`final response missing ${JSON.stringify(required)}`);
    }
    await assertWorkspace(testCase, scratch);
    assertBeads(testCase, scratch);
    summary = { ...summary, status: "pass" };
  } catch (error) {
    summary = { ...summary, status: "fail", reason: error instanceof Error ? error.message : String(error) };
  } finally {
    await writeFile(resolve(artifactDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await rm(scratch, { recursive: true, force: true });
    await isolated.dispose();
  }
  const status = summary.status === "pass" ? "PASS" : "FAIL";
  process.stdout.write(`${status} ${testCase.name} (${artifactDir})${summary.reason ? `: ${summary.reason}` : ""}\n`);
  return summary;
}

const cases = await loadCases();
const selection = parseSelection(cases);

if (selection.mode === "list") {
  process.stdout.write(`${cases.map(candidate => candidate.name).join("\n")}\n`);
} else if (selection.mode === "validate") {
  process.stdout.write(`Validated ${cases.length} eval case(s).\n`);
} else if (selection.mode === "dry-run") {
  const isolated = await createIsolatedHome({ seedCredentials: false });
  try {
    process.stdout.write(
      `${JSON.stringify(
        {
          pluginDir: isolated.pluginDir,
          env: { HOME: isolated.home, PI_CODING_AGENT_DIR: null, PI_PROFILE: null, OMP_PROFILE: null },
          cases: cases.map(candidate => ({
            name: candidate.name,
            fixture: candidate.fixture,
            modelConfig: configPath,
            timeoutSeconds: candidate.timeoutSeconds,
            watchdogSeconds: candidate.timeoutSeconds + WATCHDOG_GRACE_SECONDS,
          })),
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await isolated.dispose();
  }
} else {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const artifactRoot = resolve(root, ".artifacts", "evals", stamp);
  const summaries: CaseSummary[] = [];
  for (const testCase of selection.cases) summaries.push(await runCase(testCase, artifactRoot));
  await writeFile(resolve(artifactRoot, "summary.json"), `${JSON.stringify(summaries, null, 2)}\n`);
  const failed = summaries.filter(summary => summary.status === "fail").length;
  process.stdout.write(`${summaries.length - failed}/${summaries.length} passed (${artifactRoot})\n`);
  if (failed > 0) process.exit(1);
}
