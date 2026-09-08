import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { ExtensionAPI, ExtensionContext, SessionStopEventResult } from "@oh-my-pi/pi-coding-agent";

export const BEADS_MODE_ENTRY = "wb-beads-mode";
export const ACTIVE_PLAN_ENTRY = "wb-active-plan";
export const BEADS_CONTEXT_MESSAGE = "wb-beads-context";
export const REANCHOR_MESSAGE = "wb-reanchor";

export type BeadsMode = "git" | "stealth" | "none";

export interface PlanDetection {
  active?: string;
  candidates: string[];
}

export interface StopVerdict {
  continue: boolean;
  reason?: "plan" | "promise" | "question";
}

const PRIME_TIMEOUT_MS = 5000;
const PRIME_MAX_CHARS = 6000;
const LINT_TIMEOUT_MS = 10_000;
const STOP_CONTINUATION_CAP = 2;
const LINT_TOOLS: Record<string, true> = { write: true, edit: true };
/** Repo-local markdownlint configs, in markdownlint-cli discovery order; the plugin's own config is the fallback. */
const LINT_CONFIG_NAMES = [".markdownlintrc", ".markdownlint.json", ".markdownlint.jsonc", ".markdownlint.yaml", ".markdownlint.yml"];
/** Upper bound on remembered event keys; doubled events arrive back to back, so clearing on overflow is safe. */
const DEDUPE_LIMIT = 2048;
/** Two `session_tree` emits for the same leaf inside this window are one navigation. */
const TREE_DEDUPE_WINDOW_MS = 2000;

const ACTION_VERBS =
  "run|start|implement|spawn|update|create|write|check|verify|read|fix|add|apply|open|search|inspect|test|finish|do|make|move|investigate|look|try|continue|proceed|commit|edit|remove|delete|refactor|rerun|re-run|wire|build";
/** A closing promise to act. `let me` only counts before an action verb, so `let me know…` is a wait, not a promise. */
const PROMISE_PATTERN = new RegExp(
  `\\b(?:I(?:'ll| will| am going to|'m going to)|next,? I(?:'ll| will)|now I(?:'ll| will)|let me (?:now |also |first |just |quickly |go ahead and )?(?:${ACTION_VERBS})|going to (?:now )?(?:${ACTION_VERBS}))\\b`,
  "i",
);
const PLAN_PATTERN = /^(?:plan|next steps?|remaining(?: work| steps)?|to do next)\s*:/im;
/** Human-checkpoint vocabulary; execution-skill templates end every checkpoint paragraph with `checkpoint` + `awaiting your …`. */
const CHECKPOINT_PATTERN = /\bcheckpoint\b|\bconfirm\w*|\bapprov\w*|\bblock(?:ed|er|ing)\b|\bdecid\w*|\bdecision\w*|\bmanual\b|Decide:/i;

/** Newest incomplete tasks.md under docs/plans; one hit is active, several are candidates. */
export function detectPlans(cwd: string): PlanDetection {
  const plansDir = join(cwd, "docs", "plans");
  if (!existsSync(plansDir)) return { candidates: [] };
  const ranked: Array<{ name: string; mtime: number }> = [];
  for (const entry of readdirSync(plansDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const tasks = join(plansDir, entry.name, "tasks.md");
    if (!existsSync(tasks)) continue;
    const status = readFrontmatterStatus(tasks);
    if (status === "complete") continue;
    ranked.push({ name: `docs/plans/${entry.name}`, mtime: statSync(tasks).mtimeMs });
  }
  ranked.sort((left, right) => right.mtime - left.mtime);
  const candidates = ranked.map(item => item.name);
  return candidates.length === 1 ? { active: candidates[0], candidates } : { candidates };
}

function readFrontmatterStatus(path: string): string | undefined {
  const content = readFileSync(path, "utf8");
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)?.[1];
  return frontmatter?.match(/^status:\s*(.+)$/m)?.[1]?.trim();
}

/** Extract the `docs/plans/<dir>` a Workbench command prompt targets. */
export function planFromPrompt(prompt: string): string | undefined {
  if (!/\/wb:|skill:\/\/wb-/.test(prompt)) return undefined;
  const match = prompt.match(/\bdocs\/plans\/([A-Za-z0-9._-]+)/);
  return match ? `docs/plans/${match[1]}` : undefined;
}

/** Markdown files a mutating tool call touched, derived from its input only. */
export function markdownTargets(toolName: string, input: Record<string, unknown>): string[] {
  const paths: unknown[] = [];
  if (toolName === "write") paths.push(input.path);
  if (toolName === "edit") {
    // OMP normalizes every edit mode to `path`/`paths` (extensibility/tool-event-input.ts); the raw
    // text still carries apply_patch file markers and hashline `MV` destinations.
    paths.push(...(Array.isArray(input.paths) ? input.paths : [input.path]));
    if (typeof input.input === "string") {
      for (const match of input.input.matchAll(/^\*\*\* (?:Update|Add) File: (.+)$/gm)) paths.push(match[1].trim());
      for (const match of input.input.matchAll(/^MV\s+"?([^"\n]+?)"?\s*$/gm)) paths.push(match[1]);
    }
  }
  const markdown = paths.filter(
    (path): path is string => typeof path === "string" && path.endsWith(".md") && !path.includes("node_modules/"),
  );
  return [...new Set(markdown)];
}

/** Classify the closing paragraph of an assistant turn against the autonomy contract. */
export function classifyStop(text: string): StopVerdict {
  const paragraphs = text
    .trim()
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
  const last = paragraphs.at(-1);
  if (!last) return { continue: false };
  if (PLAN_PATTERN.test(last) && !CHECKPOINT_PATTERN.test(last)) return { continue: true, reason: "plan" };
  if (PROMISE_PATTERN.test(last) && !CHECKPOINT_PATTERN.test(last)) return { continue: true, reason: "promise" };
  if (last.endsWith("?") && !CHECKPOINT_PATTERN.test(text)) return { continue: true, reason: "question" };
  return { continue: false };
}

function assistantText(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const content = (message as { content?: unknown }).content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((part): part is { type: string; text: string } => Boolean(part) && typeof part === "object" && (part as { type?: unknown }).type === "text")
    .map(part => part.text)
    .join("\n");
}

function lastCustomEntry<T>(ctx: ExtensionContext, customType: string): T | undefined {
  const branch = ctx.sessionManager.getBranch();
  for (let index = branch.length - 1; index >= 0; index--) {
    const entry = branch[index];
    if (entry.type === "custom" && entry.customType === customType) return entry.data as T;
  }
  return undefined;
}

/** Subagent sessions live at `<parent>/<id>.jsonl` beside `<parent>.jsonl`. */
function isSubagentSession(ctx: ExtensionContext): boolean {
  const file = ctx.sessionManager.getSessionFile();
  return Boolean(file) && existsSync(`${dirname(file as string)}.jsonl`);
}

function reanchorText(ctx: ExtensionContext, lead: string): string | undefined {
  const pointer = lastCustomEntry<{ dir: string }>(ctx, ACTIVE_PLAN_ENTRY)?.dir;
  const detection = detectPlans(ctx.cwd);
  const active = pointer && existsSync(join(ctx.cwd, pointer, "tasks.md")) ? pointer : detection.active;
  if (!active && detection.candidates.length === 0) return undefined;
  const lines = [lead];
  if (active) lines.push(`Active plan: ${active}`);
  else lines.push(`Candidate plans (newest first): ${detection.candidates.join(", ")}`);
  lines.push(
    "Re-read research.md, design.md, and tasks.md fully from that directory before asserting their contents; summaries are paraphrase. Use `bd ready` and `bd list` for project status rather than the summary.",
  );
  return lines.join("\n");
}

export default function workbench(pi: ExtensionAPI): void {
  const primed = new Set<string>();
  /** Beads context computed at session start, delivered on the session's next prompt. */
  const pendingBeadsContext = new Map<string, Promise<string | undefined>>();
  const stopContinuations = new Map<string, number>();
  /** Last `session_stop` key and verdict per session; a doubled emit replays the verdict without spending a continuation. */
  const lastStop = new Map<string, { key: string; result: SessionStopEventResult | undefined }>();
  /** Event keys already handled in the current session (`tool:<callId>`, `compact:<entryId>`). */
  const handled = new Set<string>();
  let lastTree: { leaf: string | null; at: number } | undefined;
  // Marketplace installs clone the repo without node_modules; fall back to a PATH markdownlint.
  const bundledLint = resolve(import.meta.dir, "..", "node_modules", ".bin", "markdownlint");
  const lintBinary = existsSync(bundledLint) ? bundledLint : Bun.which("markdownlint");
  const pluginLintConfig = resolve(import.meta.dir, "..", ".markdownlintrc");

  function firstSeen(key: string): boolean {
    if (handled.has(key)) return false;
    if (handled.size >= DEDUPE_LIMIT) handled.clear();
    handled.add(key);
    return true;
  }

  function resetSessionState(): void {
    handled.clear();
    lastTree = undefined;
  }

  /**
   * `none`: no `.beads/`. `stealth`: `.beads/` is gitignored, or there is no git work tree at all, so
   * Beads state can only persist locally and shutdown drift has nothing to check. `git`: tracked.
   */
  async function detectMode(cwd: string): Promise<BeadsMode> {
    if (!existsSync(join(cwd, ".beads"))) return "none";
    const tree = await pi.exec("git", ["rev-parse", "--is-inside-work-tree"], { cwd, timeout: 2000 });
    if (tree.code !== 0 || tree.stdout.trim() !== "true") return "stealth";
    const ignored = await pi.exec("git", ["check-ignore", "-q", ".beads/"], { cwd, timeout: 2000 });
    return ignored.code === 0 ? "stealth" : "git";
  }

  async function buildBeadsContext(cwd: string, previousMode: BeadsMode | undefined): Promise<string | undefined> {
    const mode = await detectMode(cwd);
    if (mode !== previousMode) pi.appendEntry(BEADS_MODE_ENTRY, { mode });
    if (mode === "none") return undefined;
    const prime = await pi.exec("bd", ["prime"], { cwd, timeout: PRIME_TIMEOUT_MS });
    const primeText =
      prime.code === 0 && !prime.killed
        ? prime.stdout.trim().slice(0, PRIME_MAX_CHARS)
        : "`bd prime` was unavailable within the time budget; run `bd ready` before acting on task state.";
    return `Beads mode: ${mode}. Skills trust this value for the session.\n\n${primeText}`;
  }

  function armBeadsContext(ctx: ExtensionContext): void {
    const sessionId = ctx.sessionManager.getSessionId();
    if (primed.has(sessionId) || isSubagentSession(ctx)) return;
    primed.add(sessionId);
    const previousMode = lastCustomEntry<{ mode: BeadsMode }>(ctx, BEADS_MODE_ENTRY)?.mode;
    const pending = buildBeadsContext(ctx.cwd, previousMode);
    pending.catch(() => undefined);
    pendingBeadsContext.set(sessionId, pending);
  }

  function reanchor(ctx: ExtensionContext, lead: string): void {
    if (isSubagentSession(ctx)) return;
    const text = reanchorText(ctx, lead);
    if (!text) return;
    pi.sendMessage({ customType: REANCHOR_MESSAGE, content: text, display: true }, { deliverAs: "nextTurn" });
  }

  function lintConfigFor(cwd: string): string | undefined {
    for (const name of LINT_CONFIG_NAMES) {
      const candidate = join(cwd, name);
      if (existsSync(candidate)) return candidate;
    }
    return existsSync(pluginLintConfig) ? pluginLintConfig : undefined;
  }

  pi.on("session_start", (_event, ctx) => {
    armBeadsContext(ctx);
  });

  pi.on("session_switch", (event, ctx) => {
    resetSessionState();
    primed.delete(ctx.sessionManager.getSessionId());
    armBeadsContext(ctx);
    if (event.reason === "resume") reanchor(ctx, "Session resumed; prior plan-document knowledge is unverified.");
  });

  pi.on("before_agent_start", async (event, ctx) => {
    const dir = planFromPrompt(event.prompt);
    if (dir) pi.appendEntry(ACTIVE_PLAN_ENTRY, { dir });
    const sessionId = ctx.sessionManager.getSessionId();
    const pending = pendingBeadsContext.get(sessionId);
    if (!pending) return undefined;
    pendingBeadsContext.delete(sessionId);
    const content = await pending.catch(() => undefined);
    if (!content) return undefined;
    return { message: { customType: BEADS_CONTEXT_MESSAGE, content, display: false } };
  });

  pi.on("session.compacting", (_event, ctx) => {
    const text = reanchorText(ctx, "Workbench plan context to preserve verbatim:");
    if (!text) return undefined;
    const pointer = lastCustomEntry<{ dir: string }>(ctx, ACTIVE_PLAN_ENTRY)?.dir;
    return { context: text.split("\n"), preserveData: pointer ? { wbActivePlan: pointer } : undefined };
  });

  pi.on("session_compact", (event, ctx) => {
    if (!firstSeen(`compact:${event.compactionEntry.id}`)) return;
    reanchor(ctx, "Context was just compacted; any plan-document summary above is paraphrase, not verified content.");
  });

  pi.on("session_tree", (event, ctx) => {
    const now = Date.now();
    if (lastTree && lastTree.leaf === event.newLeafId && now - lastTree.at < TREE_DEDUPE_WINDOW_MS) return;
    lastTree = { leaf: event.newLeafId, at: now };
    reanchor(ctx, "Session tree navigation changed the active branch; plan-document knowledge is unverified.");
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    resetSessionState();
    if (isSubagentSession(ctx)) return;
    // Re-detect: the mode recorded at session start is stale after `bd init`, ignore edits, or a resumed session from another checkout.
    const mode = await detectMode(ctx.cwd);
    if (mode !== "git") return;
    const status = await pi.exec("git", ["status", "--porcelain", "--", ".beads/"], { cwd: ctx.cwd, timeout: 2000 });
    if (status.code !== 0 || status.stdout.trim().length === 0) return;
    const notice = "Beads drift: .beads/ has uncommitted changes. Run `git add .beads/ && git commit` before ending the session.";
    if (ctx.hasUI) ctx.ui.notify(notice, "warning");
    else process.stderr.write(`${notice}\n`);
  });

  pi.on("tool_result", async (event, ctx) => {
    if (!LINT_TOOLS[event.toolName] || event.isError) return undefined;
    if (!firstSeen(`tool:${event.toolCallId}`)) return undefined;
    const targets = markdownTargets(event.toolName, event.input).filter(path => existsSync(resolve(ctx.cwd, path)));
    if (targets.length === 0 || !lintBinary) return undefined;
    const config = lintConfigFor(ctx.cwd);
    const args = config ? ["--config", config, ...targets] : targets;
    const lint = await pi.exec(lintBinary, args, { cwd: ctx.cwd, timeout: LINT_TIMEOUT_MS });
    const findings = `${lint.stdout}\n${lint.stderr}`.trim();
    if (lint.code === 0 || lint.killed || findings.length === 0) return undefined;
    return {
      content: [
        ...event.content,
        {
          type: "text",
          text: `markdownlint findings (report only; fix explicitly or run scripts/lint --fix):\n${findings}`,
        },
      ],
    };
  });

  pi.on("session_stop", event => {
    // `turn_id` restarts per agent run, so the assistant message timestamp separates continuation turns
    // from a doubled emit of the same settle.
    const timestamp = (event.last_assistant_message as { timestamp?: unknown } | undefined)?.timestamp ?? "";
    const key = `${event.turn_id}:${event.stop_hook_active}:${timestamp}`;
    const previous = lastStop.get(event.session_id);
    if (previous?.key === key) return previous.result;
    if (!event.stop_hook_active) stopContinuations.set(event.session_id, 0);
    const count = stopContinuations.get(event.session_id) ?? 0;
    const verdict = count < STOP_CONTINUATION_CAP ? classifyStop(assistantText(event.last_assistant_message)) : undefined;
    let result: SessionStopEventResult | undefined;
    if (verdict?.continue) {
      stopContinuations.set(event.session_id, count + 1);
      result = {
        continue: true,
        additionalContext: `The turn ended on a ${verdict.reason}. Workbench autonomy contract: do the described work now with tool calls, or state the concrete blocker with evidence. Only a human checkpoint, a plan defect, or an unavailable prerequisite justifies stopping.`,
      };
    }
    lastStop.set(event.session_id, { key, result });
    return result;
  });
}
