#!/usr/bin/env bun
// Tier 3 special case: drive a real session through compaction and prove the
// extension re-anchors on the active plan. Uses the SDK because `/compact`
// cannot be issued from a single print-mode prompt.

import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createAgentSession, SessionManager, Settings } from "@oh-my-pi/pi-coding-agent";
import { initializeExtensions } from "@oh-my-pi/pi-coding-agent/modes/runtime-init";

const root = resolve(import.meta.dir, "..");
const scratch = await mkdtemp(join(tmpdir(), "wb-compact-"));

async function run(): Promise<string> {
  await cp(resolve(root, "evals", "fixtures", "execution-input"), scratch, { recursive: true });
  const bd = Bun.which("bd");
  if (!bd) throw new Error("bd executable not found");
  for (const command of [
    ["git", "init", "--quiet"],
    [bd, "init", "--non-interactive", "--skip-agents", "--skip-hooks", "--prefix", "eval"],
  ]) {
    const result = Bun.spawnSync(command, { cwd: scratch, stdout: "pipe", stderr: "pipe" });
    if (result.exitCode !== 0) throw new Error(`${command[0]} failed: ${result.stderr.toString()}`);
  }

  const settings = Settings.isolated({
    modelRoles: { default: "anthropic/claude-haiku-4-5" },
    compaction: { enabled: false },
  } as never);
  const { session } = await createAgentSession({
    cwd: scratch,
    settings,
    sessionManager: SessionManager.inMemory(scratch),
    additionalExtensionPaths: [resolve(root, "extensions", "workbench.ts")],
    disableExtensionDiscovery: true,
    autoApprove: true,
  });
  const extensionErrors: string[] = [];
  await initializeExtensions(session, {
    reportSendError: (action, error) => extensionErrors.push(`${action}: ${error.message}`),
    reportRuntimeError: error => extensionErrors.push(`extension runtime error: ${JSON.stringify(error)}`),
  });

  try {
    await session.prompt(
      "/wb:implement_tasks docs/plans/2026-09-06-command-aliases 1 -- stop immediately: reply with the single word ready and call no tools.",
    );
    await session.compact("Summarize briefly.");
    await session.prompt(
      "Without calling any tool: quote verbatim any injected line that begins with 'Active plan:' and any injected sentence containing 'paraphrase'. If neither exists, answer exactly 'no reanchor'.",
    );

    const final = session.getLastAssistantMessage();
    const text = (final?.content ?? [])
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map(part => part.text)
      .join("\n");
    const reanchors = session.messages.filter(
      message => message.role === "custom" && "customType" in message && message.customType === "wb-reanchor",
    );
    const entries = session.sessionManager.getEntries();
    const compactions = entries.filter(entry => entry.type === "compaction");
    const customEntries = entries.filter(entry => entry.type === "custom");
    const pointers = customEntries.filter(entry => entry.customType === "wb-active-plan");
    const modes = customEntries.filter(entry => entry.customType === "wb-beads-mode");

    if (extensionErrors.length > 0) throw new Error(extensionErrors.join("\n"));
    if (compactions.length !== 1) throw new Error(`expected one compaction entry, got ${compactions.length}`);
    if (modes.length !== 1) throw new Error(`expected exactly one wb-beads-mode entry, got ${modes.length}`);
    if (pointers.length === 0) throw new Error("active-plan pointer entry was not recorded on /wb: dispatch");
    if (reanchors.length !== 1) throw new Error(`expected exactly one wb-reanchor message after compaction, got ${reanchors.length}`);
    if (!text.includes("Active plan: docs/plans/2026-09-06-command-aliases")) {
      throw new Error(`model did not see the active plan; final was:\n${text}`);
    }
    if (!/paraphrase/i.test(text)) throw new Error(`model did not see the paraphrase warning; final was:\n${text}`);
    return `PASS compaction-reanchor (compactions=${compactions.length} reanchors=${reanchors.length} pointer=${JSON.stringify(pointers.at(-1)?.data)} mode=${JSON.stringify(modes[0].data)})\n`;
  } finally {
    await session.dispose();
  }
}

let exitCode = 0;
try {
  process.stdout.write(await run());
} catch (error) {
  exitCode = 1;
  process.stderr.write(`FAIL compaction-reanchor: ${error instanceof Error ? error.message : String(error)}\n`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
process.exit(exitCode);
