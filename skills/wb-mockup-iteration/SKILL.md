---
name: wb-mockup-iteration
description: Iterates on versioned UI mockups after wb-create_mockup. Classifies feedback as KEEP, REMOVE, CHANGE, QUESTION, or ASSUMPTION with verbatim quotes, tracks questions in Beads, creates zero-padded versions with screenshots, and finalizes into a design.md section. Use when the user gives mockup feedback, asks for the next version, wants to preview, revert, compare, or finalize a mockup.
---

# Mockup iteration

Capture every piece of mockup feedback without fidelity loss, version each iteration, and keep `mockups/mockup-log.md` as the decision record that feeds `design.md`.

Supporting files, read in full when a step directs you to them:

- `skill://wb-mockup-iteration/templates.md` — version log entry and decisions.md.
- `skill://wb-mockup-iteration/examples.md` — an example interaction.

All inputs come from the repository, the mockup log, prior versions, and the user. Never use `web_search` or external design references; unknowns become `UI Q:` issues or questions to the user, never research.

## 1. Find the mockup context

Before processing any feedback:

1. Locate `mockups/mockup-log.md` (`glob` for `**/mockups/mockup-log.md`; prefer the directory the user named).
2. Read `project_directory` from its frontmatter to confirm the location.
3. Read `current_version` from its frontmatter.
4. Verify `mockups/v00N/` exists for that version; if not, use the highest existing version directory and note the mismatch.

If no `mockup-log.md` exists, report:

```text
I can't find an active mockup session.

Options:
1. Start new mockup: /wb:create_mockup [directory] [feature]
2. Point me to existing mockup-log.md location
```

If it is unclear whether the message is mockup feedback, say once: "I'm treating this as mockup feedback for [feature] (currently v00N). If this isn't about the mockup, let me know."

## 2. Classify feedback

For each statement the user makes:

- **KEEP** — confirmed requirement; add to "Confirmed (KEEP)".
- **REMOVE** — rejected idea; add to "Rejected (REMOVE)" with the user's rationale.
- **CHANGE** — modification for the next version.
- **QUESTION** — needs an answer; create a Beads issue, ask it in the summary, and carry it as "Still Open" in the next `decisions.md`. Open questions block finalization only; they never block a version, and the version keeps the previous behavior for the questioned element.
- **ASSUMPTION** — unvalidated belief the mockup depends on; create a Beads issue.

Split compound feedback into one entry per type: "Keep header but make it blue" → KEEP header layout + CHANGE header color to blue. Quote the user's exact words in every entry; never paraphrase into a vague summary.

Questions and assumptions become Beads issues (run `bd info` first; if Beads is unavailable, report `skill://wb-reference/beads-not-initialized.md` once and list them under "Open (DECIDING)" until it works):

```bash
# For questions that need answers:
bd create "UI Q: [question]" --type=task --priority=2 \
  -d "From mockup iteration. Blocks: finalization"

# For assumptions that need validation:
bd create "UI Assumption: [assumption]" --type=task --priority=3 \
  -d "Assuming [X]. If wrong: [impact]. Validate before implementation."
```

Record each returned id.

## 3. Update the log immediately

Write the classified entries into `mockups/mockup-log.md` before anything else:

```markdown
### Confirmed (KEEP)
- [Requirement] - confirmed [date] - "[user quote]"

### Rejected (REMOVE)
- [Idea] - rejected [date] - reason: "[user rationale]"
```

CHANGE items go under "Open (DECIDING)" until versioned. Then summarize:

```text
Got it. For the next version:

KEEPING: [list]
REMOVING: [list]
CHANGING: [list]
CLARIFYING: [UI Q: ids, if any]

Ready to create v00[N+1]?
```

## Checkpoint: confirm before versioning

Do not create a version until the user confirms or asks for the next version. Ambiguous feedback is a QUESTION, not a guess. When the invocation itself says "create the next version" (or equivalent) with the feedback, treat that as the confirmation and continue without asking again, even when QUESTION or ASSUMPTION items were filed: they stay open in Beads and in `decisions.md`.

## 4. Create the next version

1. Read `current_version` from the log frontmatter.
2. Read `mockups/v00N/mockup.md` in full as the base.
3. Read `mockups/v00N/mockup.html` in full as the base.
4. Read the log's Running Requirements and UI Research Reference (icon system, styling).
5. Create `mockups/v00[N+1]/` (zero-padded: v001, v002, ..., v010).
6. Write the new `mockup.md` incorporating all KEEP, REMOVE, and CHANGE entries.
7. Write the new `mockup.html` to match the new `mockup.md`: keep the app's stylesheet links and classes from research, update icons per feedback using the researched icon system only, no placeholder classes, no emojis, and no CSS `animation`/`transition` or timer-driven scripts (a continuously repainting page hangs the headless screenshot; render loading states statically).
8. Read `skill://wb-mockup-iteration/templates.md` now and write `decisions.md` with its exact frontmatter (`version: [N+1]`, `created`, `previous_version: [N]`) and sections (delta from v00N only, plus cumulative requirements).
9. Visual validation (step 5).
10. Update `mockups/mockup-log.md`: frontmatter `current_version: [N+1]` and `last_updated: [date]`; add the version entry from the template to Version History; move versioned CHANGE items out of "Open (DECIDING)".

Never modify a previous version directory.

## 5. Visual validation

Render the new version with the Eval browser prelude (JavaScript in the `eval` tool) and write `mockups/v00[N+1]/preview-v00[N+1].png`:

```javascript
const dir = "<absolute project directory>/mockups/v00[N+1]";
const tab = await browser.open({ name: "wb-mockup", url: `file://${dir}/mockup.html`, viewport: { width: 1280, height: 800 } });
await tab.run(async ({ page }, out) => {
  await page.screenshot({ path: out, type: "png", fullPage: true });
}, { args: [`${dir}/preview-v00[N+1].png`] });
await tab.screenshot({ fullPage: true });
await tab.close();
```

`tab.screenshot()` takes no output path; it saves a resized copy under a generated name and shows the image in the transcript. The versioned PNG comes from the raw Puppeteer `page` inside `tab.run`, with the destination passed through `args`. If the stylesheets need a running server, start it with `hub` `op: "start"` and `ready: { port }`, open the `http://127.0.0.1:<port>/...` URL instead, and stop it afterwards.

Bound every screenshot: pass `{ timeout: 20000 }` to `tab.run` and race it against a 25 s timer. If it does not return, call `await browser.close({ all: true, kill: true })`, reopen once, and retry; if that fails too, note "preview could not be rendered: headless screenshot hung" in `decisions.md` under Still Open, present the HTML path, and continue. Never search the web or install packages to work around it.

Prove the stylesheets loaded before inspecting: inside the same `tab.run`, evaluate `[...document.styleSheets].filter(s => s.href).map(s => ({ href: s.href, rules: (() => { try { return s.cssRules.length; } catch { return -1; } })() }))` and require every app stylesheet to report `rules > 0`; otherwise fix the `href` (count directory levels from the version directory) and re-render. Confirm the PNG exists, inspect it against the feedback, then present it: "Created mockups/v00[N+1]/ ... Anything else to adjust?"

## 6. Quick commands

| Command | Action |
| --- | --- |
| "keep [X]" | Add to Confirmed, preserve in next version |
| "remove [X]" | Add to Rejected, cut from next version |
| "change [X] to [Y]" | Note modification for next version |
| "next version" | Create v00[N+1] with all feedback |
| "show mockup" | Render current `mockup.html` with `browser.open` and `tab.screenshot({ fullPage: true })`; no new version |
| "show log" | Display current mockup-log.md |
| "show keeps" | List all confirmed requirements |
| "show removes" | List all rejected ideas |
| "revert to v00[N]" | Create new version based on v00[N] |
| "compare v00[A] and v00[B]" | Show differences between versions |
| "finalize" | Prepare for design.md |

## 7. Revert and compare

**Revert to v00N**: read `v00N/mockup.md` and `mockup.html` as the new base; create `v00[current+1]` with that content; screenshot it (step 5); add "Reverted to v00N base" to the log entry; mark decisions from v00[N+1] through v00[current] as "superseded by revert" in the new `decisions.md`. Old versions stay on disk.

**Compare v00A and v00B**: render any missing `preview-v00X.png` (step 5), then report:

```markdown
## v00[A] → v00[B] Visual Comparison

**Screenshots:** v00[A]: preview-v00A.png; v00[B]: preview-v00B.png

**Added in v00[B]:**
- [element]

**Removed in v00[B]:**
- [element]

**Changed:**
- [element]: [v00A state] → [v00B state]

**Style/Icon changes:**
- [CSS/icon differences if any]

**Decisions between versions:**
- v00[A+1]: [summary]
```

## 8. Finalize to design

When the user says "finalize" or "ready for design":

### Gate: no open UI questions

```bash
bd list -n 0 --status=open | grep -E "UI Q:|UI Assumption:"
```

Never use `bd q`. If any line matches, stop and report:

```text
Cannot finalize - unresolved items:

| Issue | Status |
| --- | --- |
| UI Q: [question] | Open |
| UI Assumption: [assumption] | Open |

Options:
1. Resolve these first (answer questions, validate assumptions)
2. Close as "deferred to implementation" if acceptable
3. Close as "out of scope" if not needed
```

Do not produce the design section while the gate fails.

### After all resolved

1. Compile every KEEP decision from the log.
2. List every REMOVE decision as out of scope.
3. Re-run the gate command and confirm it prints nothing.
4. Output the design.md section for `/wb:create_design` to consume:

```markdown
## UI Design: [Feature]

### Requirements (from mockup iteration)

_Confirmed through [N] mockup iterations_

1. [Requirement] - v00[X]
2. [Requirement] - v00[Y]

### Out of Scope

_Explicitly excluded during mockup iteration_

1. [Excluded item] - reason: [from REMOVE log]

### Final Mockup Reference

- Structure: `mockups/v00[final]/mockup.md`
- Visual: `mockups/v00[final]/mockup.html`
- Screenshot: `mockups/v00[final]/preview-v00[final].png`

### Open Items for Implementation

- [ ] [Remaining question]
```

## Session continuity

If the session ends mid-iteration or the user requests a handoff, add a "Pending Feedback (Not Yet Versioned)" section to the log listing each quote with its classification, and note the mockup path, current version, and pending count in the handoff document. On resume, read that section first.

## Do not

- Create a version without reading the current `mockup.md` and `mockup.html` first.
- Skip the log update or the screenshot.
- Proceed on ambiguous feedback; ask.
- Overwrite a previous version or lose REMOVE decisions.
- Use emojis or placeholder classes in `mockup.html`.
- Lose cumulative requirements across versions.
