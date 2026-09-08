import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import workbench, {
  ACTIVE_PLAN_ENTRY,
  BEADS_CONTEXT_MESSAGE,
  BEADS_MODE_ENTRY,
  REANCHOR_MESSAGE,
  classifyStop,
  detectPlans,
  markdownTargets,
  planFromPrompt,
} from "../../extensions/workbench";

type Handler = (event: Record<string, unknown>, ctx: FakeContext) => unknown;

interface ExecCall {
  command: string;
  args: string[];
}

interface FakeContext {
  cwd: string;
  hasUI: boolean;
  ui: { notify: (message: string, level: string) => void };
  sessionManager: {
    getSessionId: () => string;
    getSessionFile: () => string | undefined;
    getBranch: () => Array<Record<string, unknown>>;
  };
  notices: string[];
}

interface Harness {
  handlers: Map<string, Handler[]>;
  entries: Array<{ customType: string; data: unknown }>;
  messages: Array<{ message: Record<string, unknown>; options: Record<string, unknown> | undefined }>;
  execCalls: ExecCall[];
  insideRepo: boolean;
  gitignoresBeads: boolean;
  beadsDirty: boolean;
  emit: (event: string, payload: Record<string, unknown>, ctx: FakeContext) => Promise<unknown>;
}

function createHarness(root: string): Harness {
  const handlers = new Map<string, Handler[]>();
  const harness: Harness = {
    handlers,
    entries: [],
    messages: [],
    execCalls: [],
    insideRepo: true,
    gitignoresBeads: false,
    beadsDirty: false,
    emit: async (event, payload, ctx) => {
      let result: unknown;
      for (const handler of handlers.get(event) ?? []) result = await handler({ type: event, ...payload }, ctx);
      return result;
    },
  };
  const pi = {
    on(event: string, handler: Handler) {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
    },
    appendEntry(customType: string, data: unknown) {
      harness.entries.push({ customType, data });
    },
    sendMessage(message: Record<string, unknown>, options?: Record<string, unknown>) {
      harness.messages.push({ message, options });
    },
    async exec(command: string, args: string[], options?: { cwd?: string }) {
      harness.execCalls.push({ command, args });
      if (command === "git" && args[0] === "rev-parse") {
        return { stdout: harness.insideRepo ? "true\n" : "", stderr: "fatal: not a git repository", code: harness.insideRepo ? 0 : 128, killed: false };
      }
      if (command === "git" && args[0] === "check-ignore") {
        return { stdout: "", stderr: "", code: harness.gitignoresBeads ? 0 : 1, killed: false };
      }
      if (command === "git" && args[0] === "status") {
        return { stdout: harness.beadsDirty ? " M .beads/issues.jsonl\n" : "", stderr: "", code: 0, killed: false };
      }
      if (command === "bd") {
        return { stdout: "# Beads primed\nbd ready shows 2 tasks.", stderr: "", code: 0, killed: false };
      }
      const result = Bun.spawnSync([command, ...args], { cwd: options?.cwd ?? root, stdout: "pipe", stderr: "pipe" });
      return { stdout: result.stdout.toString(), stderr: result.stderr.toString(), code: result.exitCode, killed: false };
    },
  };
  workbench(pi as never);
  return harness;
}

function createContext(root: string, harness: Harness, sessionId = "session-a"): FakeContext {
  const ctx: FakeContext = {
    cwd: root,
    hasUI: true,
    notices: [],
    ui: { notify: (message: string) => ctx.notices.push(message) },
    sessionManager: {
      getSessionId: () => sessionId,
      getSessionFile: () => undefined,
      getBranch: () =>
        harness.entries.map((entry, index) => ({
          type: "custom",
          id: String(index),
          parentId: null,
          timestamp: "",
          customType: entry.customType,
          data: entry.data,
        })),
    },
  };
  return ctx;
}

function writePlan(root: string, name: string, status: string, ageSeconds: number): void {
  const dir = join(root, "docs", "plans", name);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "tasks.md");
  writeFileSync(file, `---\nproject: ${name}\nstatus: ${status}\n---\n\n# Plan\n`);
  const time = new Date(Date.now() - ageSeconds * 1000);
  utimesSync(file, time, time);
}

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "wb-ext-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("plan detection", () => {
  test("no plans directory yields nothing", () => {
    expect(detectPlans(root)).toEqual({ candidates: [] });
  });

  test("single incomplete plan is active; complete plans are ignored", () => {
    writePlan(root, "2026-09-01-done", "complete", 10);
    writePlan(root, "2026-09-05-open", "in-progress", 100);
    expect(detectPlans(root)).toEqual({ active: "docs/plans/2026-09-05-open", candidates: ["docs/plans/2026-09-05-open"] });
  });

  test("several incomplete plans are listed newest first without an active choice", () => {
    writePlan(root, "older", "not-started", 300);
    writePlan(root, "newer", "in-progress", 5);
    expect(detectPlans(root)).toEqual({ candidates: ["docs/plans/newer", "docs/plans/older"] });
  });

  test("command prompts name the plan directory only for Workbench invocations", () => {
    expect(planFromPrompt("/wb:implement_tasks docs/plans/2026-09-06-x 1")).toBe("docs/plans/2026-09-06-x");
    expect(planFromPrompt("Read skill://wb-create_tasks for docs/plans/2026-09-06-x/")).toBe("docs/plans/2026-09-06-x");
    expect(planFromPrompt("summarize docs/plans/2026-09-06-x/design.md")).toBeUndefined();
  });
});

describe("Beads lifecycle", () => {
  const prompt = { prompt: "hello", systemPrompt: [] };

  test("session_start records git mode; the first prompt receives bd prime exactly once", async () => {
    mkdirSync(join(root, ".beads"));
    const harness = createHarness(root);
    const ctx = createContext(root, harness);
    await harness.emit("session_start", {}, ctx);
    await harness.emit("session_start", {}, ctx);
    const first = (await harness.emit("before_agent_start", prompt, ctx)) as { message: Record<string, unknown> } | undefined;
    const second = await harness.emit("before_agent_start", prompt, ctx);

    expect(harness.entries).toEqual([{ customType: BEADS_MODE_ENTRY, data: { mode: "git" } }]);
    expect(harness.execCalls.filter(call => call.command === "bd")).toHaveLength(1);
    expect(first?.message.customType).toBe(BEADS_CONTEXT_MESSAGE);
    expect(String(first?.message.content)).toContain("Beads mode: git");
    expect(String(first?.message.content)).toContain("Beads primed");
    expect(second).toBeUndefined();
  });

  test("gitignored .beads reports stealth mode", async () => {
    mkdirSync(join(root, ".beads"));
    const harness = createHarness(root);
    harness.gitignoresBeads = true;
    const ctx = createContext(root, harness);
    await harness.emit("session_start", {}, ctx);
    const first = (await harness.emit("before_agent_start", prompt, ctx)) as { message: Record<string, unknown> };
    expect(harness.entries[0]).toEqual({ customType: BEADS_MODE_ENTRY, data: { mode: "stealth" } });
    expect(String(first.message.content)).toContain("Beads mode: stealth");
  });

  test("uninitialized repositories record none, never call bd, and inject nothing", async () => {
    const harness = createHarness(root);
    const ctx = createContext(root, harness);
    await harness.emit("session_start", {}, ctx);
    const first = await harness.emit("before_agent_start", prompt, ctx);
    expect(harness.entries[0]).toEqual({ customType: BEADS_MODE_ENTRY, data: { mode: "none" } });
    expect(harness.execCalls.some(call => call.command === "bd")).toBe(false);
    expect(first).toBeUndefined();
  });

  test("shutdown warns about uncommitted .beads only in git mode and never runs bd", async () => {
    mkdirSync(join(root, ".beads"));
    const harness = createHarness(root);
    harness.beadsDirty = true;
    const ctx = createContext(root, harness);
    await harness.emit("session_start", {}, ctx);
    await harness.emit("before_agent_start", prompt, ctx);
    harness.execCalls.length = 0;
    await harness.emit("session_shutdown", {}, ctx);
    expect(ctx.notices).toEqual([expect.stringContaining("Beads drift")]);
    expect(harness.execCalls.some(call => call.command === "bd")).toBe(false);

    const stealth = createHarness(root);
    stealth.gitignoresBeads = true;
    stealth.beadsDirty = true;
    const stealthCtx = createContext(root, stealth, "session-b");
    await stealth.emit("session_start", {}, stealthCtx);
    await stealth.emit("session_shutdown", {}, stealthCtx);
    expect(stealthCtx.notices).toEqual([]);
  });

  test(".beads outside a git work tree is stealth: local-only persistence, no drift notice", async () => {
    mkdirSync(join(root, ".beads"));
    const harness = createHarness(root);
    harness.insideRepo = false;
    harness.beadsDirty = true;
    const ctx = createContext(root, harness);
    await harness.emit("session_start", {}, ctx);
    const first = (await harness.emit("before_agent_start", prompt, ctx)) as { message: Record<string, unknown> };
    await harness.emit("session_shutdown", {}, ctx);
    expect(harness.entries[0]).toEqual({ customType: BEADS_MODE_ENTRY, data: { mode: "stealth" } });
    expect(String(first.message.content)).toContain("Beads mode: stealth");
    expect(harness.execCalls.some(call => call.command === "git" && call.args[0] === "check-ignore")).toBe(false);
    expect(ctx.notices).toEqual([]);
  });

  test("session_switch re-detects but persists a mode entry only when it changed; shutdown re-detects", async () => {
    mkdirSync(join(root, ".beads"));
    const harness = createHarness(root);
    const ctx = createContext(root, harness);
    await harness.emit("session_start", {}, ctx);
    await harness.emit("before_agent_start", prompt, ctx);
    await harness.emit("session_switch", { reason: "resume" }, ctx);
    await harness.emit("before_agent_start", prompt, ctx);
    expect(harness.entries.filter(entry => entry.customType === BEADS_MODE_ENTRY)).toEqual([{ customType: BEADS_MODE_ENTRY, data: { mode: "git" } }]);

    harness.gitignoresBeads = true;
    await harness.emit("session_switch", { reason: "resume" }, ctx);
    await harness.emit("before_agent_start", prompt, ctx);
    expect(harness.entries.filter(entry => entry.customType === BEADS_MODE_ENTRY).map(entry => entry.data)).toEqual([{ mode: "git" }, { mode: "stealth" }]);

    harness.gitignoresBeads = false;
    harness.beadsDirty = true;
    await harness.emit("session_shutdown", {}, ctx);
    expect(ctx.notices).toEqual([expect.stringContaining("Beads drift")]);
  });

  test("headless shutdown writes the drift notice to stderr", async () => {
    mkdirSync(join(root, ".beads"));
    const harness = createHarness(root);
    harness.beadsDirty = true;
    const ctx = createContext(root, harness);
    ctx.hasUI = false;
    const written: string[] = [];
    const original = process.stderr.write;
    process.stderr.write = ((chunk: string | Uint8Array) => {
      written.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;
    try {
      await harness.emit("session_shutdown", {}, ctx);
    } finally {
      process.stderr.write = original;
    }
    expect(ctx.notices).toEqual([]);
    expect(written.join("")).toContain("Beads drift");
  });
});

describe("re-anchoring", () => {
  test("compacting preserves the active plan pointer and paraphrase warning", async () => {
    writePlan(root, "2026-09-06-plan", "in-progress", 10);
    const harness = createHarness(root);
    const ctx = createContext(root, harness);
    await harness.emit("before_agent_start", { prompt: "/wb:implement_tasks docs/plans/2026-09-06-plan 1" }, ctx);
    expect(harness.entries).toEqual([{ customType: ACTIVE_PLAN_ENTRY, data: { dir: "docs/plans/2026-09-06-plan" } }]);

    const result = (await harness.emit("session.compacting", { sessionId: "s", messages: [] }, ctx)) as {
      context: string[];
      preserveData: Record<string, unknown>;
    };
    expect(result.context.join("\n")).toContain("Active plan: docs/plans/2026-09-06-plan");
    expect(result.context.join("\n")).toContain("paraphrase");
    expect(result.preserveData).toEqual({ wbActivePlan: "docs/plans/2026-09-06-plan" });
  });

  test("compact, tree navigation, and resume emit the re-anchor message; ambiguity lists candidates", async () => {
    writePlan(root, "a", "in-progress", 50);
    writePlan(root, "b", "not-started", 5);
    const harness = createHarness(root);
    const ctx = createContext(root, harness);
    await harness.emit("session_compact", { compactionEntry: { id: "c1" }, fromExtension: false }, ctx);
    await harness.emit("session_tree", { newLeafId: "leaf-1" }, ctx);
    await harness.emit("session_switch", { reason: "resume" }, ctx);
    await harness.emit("session_switch", { reason: "new" }, ctx);

    const reanchors = harness.messages.filter(item => item.message.customType === REANCHOR_MESSAGE);
    expect(reanchors).toHaveLength(3);
    expect(String(reanchors[0].message.content)).toContain("Candidate plans (newest first): docs/plans/b, docs/plans/a");
    expect(String(reanchors[0].message.content)).toContain("paraphrase");
  });

  test("no plan means no re-anchor message", async () => {
    const harness = createHarness(root);
    await harness.emit("session_compact", { compactionEntry: { id: "c1" }, fromExtension: false }, createContext(root, harness));
    expect(harness.messages.filter(item => item.message.customType === REANCHOR_MESSAGE)).toHaveLength(0);
  });

  test("doubled compact and tree events re-anchor once; a new compaction re-anchors again", async () => {
    writePlan(root, "a", "in-progress", 5);
    const harness = createHarness(root);
    const ctx = createContext(root, harness);
    await harness.emit("session_compact", { compactionEntry: { id: "c1" }, fromExtension: false }, ctx);
    await harness.emit("session_compact", { compactionEntry: { id: "c1" }, fromExtension: false }, ctx);
    await harness.emit("session_tree", { newLeafId: "leaf-1", oldLeafId: null }, ctx);
    await harness.emit("session_tree", { newLeafId: "leaf-1", oldLeafId: null }, ctx);
    expect(harness.messages.filter(item => item.message.customType === REANCHOR_MESSAGE)).toHaveLength(2);

    await harness.emit("session_compact", { compactionEntry: { id: "c2" }, fromExtension: false }, ctx);
    expect(harness.messages.filter(item => item.message.customType === REANCHOR_MESSAGE)).toHaveLength(3);
  });
});

describe("markdown lint report", () => {
  test("targets come from write paths, normalized edit paths, and apply_patch markers inside edit input", () => {
    expect(markdownTargets("write", { path: "docs/a.md" })).toEqual(["docs/a.md"]);
    expect(markdownTargets("write", { path: "src/a.ts" })).toEqual([]);
    expect(markdownTargets("edit", { path: "docs/b.md", paths: ["docs/b.md", "src/c.ts"], input: "[docs/b.md#1A2B]\nPUT 1.=1:\n+x" })).toEqual(["docs/b.md"]);
    expect(markdownTargets("edit", { path: "docs/replace.md", oldText: "a", newText: "b" })).toEqual(["docs/replace.md"]);
    expect(markdownTargets("edit", { input: "*** Begin Patch\n*** Update File: docs/d.md\n*** Add File: notes/e.md\n*** Update File: src/f.ts\n*** End Patch" })).toEqual([
      "docs/d.md",
      "notes/e.md",
    ]);
    expect(markdownTargets("edit", { path: "node_modules/pkg/README.md" })).toEqual([]);
    expect(markdownTargets("apply_patch", { input: "*** Update File: docs/d.md" })).toEqual([]);
  });

  test("findings are appended to the result and the file bytes stay unchanged", async () => {
    const file = join(root, "note.md");
    const original = "#Bad heading\n\n\n\nText\n";
    writeFileSync(file, original);
    const harness = createHarness(root);
    const result = (await harness.emit(
      "tool_result",
      { toolName: "write", toolCallId: "t1", input: { path: "note.md" }, content: [{ type: "text", text: "ok" }], isError: false },
      createContext(root, harness),
    )) as { content: Array<{ type: string; text: string }> } | undefined;
    expect(result?.content[0]).toEqual({ type: "text", text: "ok" });
    expect(result?.content[1]?.text).toContain("markdownlint findings");
    expect(result?.content[1]?.text).toContain("MD0");
    expect(readFileSync(file, "utf8")).toBe(original);
  });

  test("clean markdown and non-markdown writes are left untouched", async () => {
    writeFileSync(join(root, "clean.md"), "# Title\n\nBody.\n");
    const harness = createHarness(root);
    const ctx = createContext(root, harness);
    const clean = await harness.emit(
      "tool_result",
      { toolName: "write", toolCallId: "t2", input: { path: "clean.md" }, content: [], isError: false },
      ctx,
    );
    const code = await harness.emit(
      "tool_result",
      { toolName: "write", toolCallId: "t3", input: { path: "a.ts" }, content: [], isError: false },
      ctx,
    );
    expect(clean).toBeUndefined();
    expect(code).toBeUndefined();
  });

  test("errored tool results are not linted", async () => {
    writeFileSync(join(root, "note.md"), "#Bad heading\n");
    const harness = createHarness(root);
    const result = await harness.emit(
      "tool_result",
      { toolName: "write", toolCallId: "t4", input: { path: "note.md" }, content: [], isError: true },
      createContext(root, harness),
    );
    expect(result).toBeUndefined();
  });

  test("a doubled tool_result for one call is linted once", async () => {
    writeFileSync(join(root, "note.md"), "#Bad heading\n");
    const harness = createHarness(root);
    const ctx = createContext(root, harness);
    const event = { toolName: "write", toolCallId: "t5", input: { path: "note.md" }, content: [], isError: false };
    const first = await harness.emit("tool_result", event, ctx);
    const second = await harness.emit("tool_result", event, ctx);
    expect(first).toMatchObject({ content: [expect.objectContaining({ text: expect.stringContaining("markdownlint findings") })] });
    expect(second).toBeUndefined();
    expect(harness.execCalls.filter(call => call.command.endsWith("markdownlint"))).toHaveLength(1);
  });

  test("the repository's own markdownlint config takes precedence over the plugin's", async () => {
    writeFileSync(join(root, "note.md"), "#Bad heading\n");
    writeFileSync(join(root, ".markdownlint.json"), '{ "default": false }\n');
    const harness = createHarness(root);
    const result = await harness.emit(
      "tool_result",
      { toolName: "write", toolCallId: "t6", input: { path: "note.md" }, content: [], isError: false },
      createContext(root, harness),
    );
    expect(result).toBeUndefined();
    expect(harness.execCalls.at(-1)?.args.slice(0, 2)).toEqual(["--config", join(root, ".markdownlint.json")]);
  });
});

describe("autonomy stop check", () => {
  test("classifies promises, plans, and open questions but respects checkpoints", () => {
    expect(classifyStop("Tests pass.\n\nI'll now run the phase verification.")).toEqual({ continue: true, reason: "promise" });
    expect(classifyStop("Tests pass.\n\nLet me run the phase verification.")).toEqual({ continue: true, reason: "promise" });
    expect(classifyStop("Done reading.\n\nNext steps:\n1. implement\n2. verify")).toEqual({ continue: true, reason: "plan" });
    expect(classifyStop("Should I use a Map or a Record here?")).toEqual({ continue: true, reason: "question" });
    expect(classifyStop("Phase 1 automated gate passed.\n\nConfirm the manual checks before the milestone is closed?")).toEqual({ continue: false });
    expect(classifyStop("Phase milestone remains open until you confirm.")).toEqual({ continue: false });
    expect(classifyStop("Implemented and verified: 2 pass, 0 fail.")).toEqual({ continue: false });
  });

  test("waiting for the user is not a promise", () => {
    expect(classifyStop("Two designs are sketched above.\n\nLet me know which direction you prefer.")).toEqual({ continue: false });
    expect(classifyStop("Let me clarify: the fixture is unchanged.")).toEqual({ continue: false });
  });

  test("checkpoint vocabulary exempts inflected forms and the blocking template", () => {
    expect(classifyStop("Next steps:\n1. close the milestone once the user confirms these checks")).toEqual({ continue: false });
    expect(classifyStop("I'll continue once the design revision is approved.")).toEqual({ continue: false });
    expect(classifyStop("Blocking: task 3 needs credentials.\n\nThis is a checkpoint; awaiting your decision.")).toEqual({ continue: false });
    expect(classifyStop("Next steps:\n1. resolve the blocking dependency")).toEqual({ continue: false });
    expect(classifyStop("Decide: keep the Map or switch to a Record?")).toEqual({ continue: false });
  });

  test("continues with context and stops after the cap", async () => {
    const harness = createHarness(root);
    const ctx = createContext(root, harness);
    const message = (timestamp: number) => ({ role: "assistant", content: [{ type: "text", text: "I'll now update the tests." }], timestamp });
    const first = await harness.emit(
      "session_stop",
      { session_id: "s1", turn_id: 1, stop_hook_active: false, last_assistant_message: message(1), messages: [] },
      ctx,
    );
    const second = await harness.emit(
      "session_stop",
      { session_id: "s1", turn_id: 1, stop_hook_active: true, last_assistant_message: message(2), messages: [] },
      ctx,
    );
    const third = await harness.emit(
      "session_stop",
      { session_id: "s1", turn_id: 1, stop_hook_active: true, last_assistant_message: message(3), messages: [] },
      ctx,
    );
    expect(first).toMatchObject({ continue: true, additionalContext: expect.stringContaining("promise") });
    expect(second).toMatchObject({ continue: true });
    expect(third).toBeUndefined();

    const fresh = await harness.emit(
      "session_stop",
      { session_id: "s1", turn_id: 2, stop_hook_active: false, last_assistant_message: message(4), messages: [] },
      ctx,
    );
    expect(fresh).toMatchObject({ continue: true });
  });

  test("a doubled session_stop for one turn spends a single continuation", async () => {
    const harness = createHarness(root);
    const ctx = createContext(root, harness);
    const message = (timestamp: number) => ({ role: "assistant", content: [{ type: "text", text: "I'll now update the tests." }], timestamp });
    const stop = { session_id: "s1", turn_id: 1, stop_hook_active: false, last_assistant_message: message(1), messages: [] };
    const first = await harness.emit("session_stop", stop, ctx);
    const replay = await harness.emit("session_stop", stop, ctx);
    expect(replay).toEqual(first);

    const continuation = await harness.emit(
      "session_stop",
      { session_id: "s1", turn_id: 1, stop_hook_active: true, last_assistant_message: message(2), messages: [] },
      ctx,
    );
    expect(continuation).toMatchObject({ continue: true });
  });
});
