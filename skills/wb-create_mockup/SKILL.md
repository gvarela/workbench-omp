---
name: wb-create_mockup
description: Researches existing UI patterns with a parallel agent batch, asks clarifying questions, and produces the first versioned mockup (ASCII, HTML with app styles, screenshot, decisions). Use when the user asks for a mockup, wireframe, or UI draft for a planned feature; iterate afterwards with wb-mockup-iteration.
---

# Create mockup

Document the UI that exists, then draft the first mockup version from that evidence and the user's answers. Research precedes every proposal; the mockup uses only classes, tokens, and structures found in the codebase.

Arguments:

1. Project directory: required (for example `docs/plans/2026-01-08-dashboard`).
2. Feature description: required; everything after the directory.

If either is missing, ask for the project documentation directory and a brief description of what to mock up, then stop.

All inputs come from the repository, the plan documents, and the user. Never use `web_search` or external design references; when something is unknown, ask the user or file a `UI Q:` issue.

Supporting files, read in full when a step directs you to them:

- `skill://wb-create_mockup/sub-agent-prompts.md` — the five-item research batch.
- `skill://wb-create_mockup/templates.md` — research summary, mockup.md, decisions.md, HTML mockup, mockup-log.md.

## 1. Research existing UI

### Barrier 1: research before proposing

Do not propose layout, components, or styling before the research batch has returned. Read every file the user named and `<project-directory>/research.md` when present.

Read `skill://wb-create_mockup/sub-agent-prompts.md` in full and fill every token. Call `task` exactly once with all five items in one `tasks[]`:

1. Layout patterns — `wb-codebase-analyzer`
2. Component library — `wb-codebase-analyzer`
3. Styling approach — `wb-codebase-analyzer`
4. Similar features — `wb-pattern-finder`
5. Icon system — `wb-codebase-analyzer`

Every item restates the documentarian constraint: document what exists, cite `path:line`, no improvements, no file writes.

### Barrier 2: all research returned

Record every returned job or agent id. Wait until all five settle, then read each complete result from `agent://<id>`. Do not synthesize from delivery previews. A failed or missing result is not evidence: retry only that item or report the gap before continuing.

## 2. Synthesize research

Write the UI Research Summary from `skill://wb-create_mockup/templates.md` into the conversation. Every entry carries a `path:line` reference from the returned results. Record the icon finding exactly: a named system with its usage pattern, or "None - text only".

## 3. Clarifying questions

### Checkpoint: answers required

Present the clarifying-questions block from `skill://wb-create_mockup/templates.md` and stop. Do not create directories or files until the user answers.

Exception: when the invocation already answers the questions (inline answers, or a design or research document the user points to), record each answer with its source and continue without asking. Questions the invocation leaves open become `UI Q:` Beads issues in step 5; never invent an answer.

## 4. Create the mockup directory

Create `<project-directory>/mockups/v001/`. The layout across the workflow is:

```text
<project-directory>/mockups/
├── mockup-log.md          # decision log across versions
├── v001/
│   ├── mockup.md          # ASCII structure and specs
│   ├── mockup.html        # working HTML with app styles
│   ├── preview-v001.png   # screenshot
│   └── decisions.md       # rationale for this version
└── v002/ ...              # created by wb-mockup-iteration; never overwrite a version
```

Version directories are zero-padded (`v001`, `v010`).

## 5. Create the initial mockup (v001)

### Barrier 3: no placeholders

Every value comes from research or the user's answers. No `[TBD]`, generic examples, or invented components.

Create `mockups/v001/mockup.md` from the "mockup.md v001 Template" and `mockups/v001/decisions.md` from the "decisions.md Template" in `skill://wb-create_mockup/templates.md`.

Run `bd info`. If Beads is initialized, create one issue per unresolved UI question with the exact shape in the template:

```bash
bd create "UI Q: <question>" --type=task --priority=2 \
  -d "From mockup v001. Blocks: <what cannot proceed without the answer>"
```

Record each returned id. If Beads is unavailable, report the standard response from `skill://wb-reference/beads-not-initialized.md` once and list the open questions in the step 9 presentation until Beads works.

## 6. Create the HTML mockup with app styles

### Barrier 4: real styles only

After `mockup.md` exists, create `mockups/v001/mockup.html` from the "HTML Mockup Template". Requirements:

1. Link the app's actual stylesheets found in research. Compute each relative `href` from the mockup file's own location, not from the repository root: `mockups/v001/mockup.html` is five directories below the repository root when the project directory lives under `docs/plans/` (`docs`, `plans`, `<project>`, `mockups`, `v001`), so a stylesheet at `<repo>/styles/app.css` needs five parent-directory segments before `styles/app.css`. Count the segments for the real layout; never copy the template's example depth. Use the dev-server URL from step 7 when the CSS is served rather than read from disk.
2. Copy component HTML structure from the cited `path:line` locations.
3. Use only CSS classes and tokens from research; no placeholder classes.
4. Follow the researched icon system, or text only when none exists. Never use emojis.
5. Match the ASCII layout in `mockup.md`.
6. Standalone: opens directly in a browser.
7. No CSS `animation` or `transition`, no autoplaying media, no scripts that repaint on a timer: a continuously repainting page hangs the headless `captureScreenshot` call. Render loading, spinner, and progress states statically (fixed frame, disabled controls, "Saving..." text).

Icon handling by research result: Font Awesome `<i class="fa-<style> fa-<name>"></i>`; Material Icons `<span class="material-icons"><name></span>`; SVG sprites `<svg><use href="#icon-<name>"></use></svg>`; custom icon components — document the pattern and ask the user how to mock it; no system — text only, and create a `UI Q: Icon system?` issue (template shape) if icons are needed.

Quality checks before step 7: all classes from research; icon system matches research or text-only confirmed; layout matches the ASCII diagram; styling method matches research.

## 7. Visual validation

### Barrier 5: screenshot before presenting

Render the mockup with the Eval browser prelude (JavaScript in the `eval` tool) and write `mockups/v001/preview-v001.png`:

```javascript
const dir = "<absolute project directory>/mockups/v001";
const tab = await browser.open({ name: "wb-mockup", url: `file://${dir}/mockup.html`, viewport: { width: 1280, height: 800 } });
await tab.run(async ({ page }, out) => {
  await page.screenshot({ path: out, type: "png", fullPage: true });
}, { args: [`${dir}/preview-v001.png`] });
await tab.screenshot({ fullPage: true });
await tab.close();
```

Bound every screenshot: pass `{ timeout: 20000 }` as the `tab.run` option and race it against a 25 s timer. If it does not return, the shared headless browser is wedged: call `await browser.close({ all: true, kill: true })`, reopen the tab once, and retry. If the retry also fails, record "preview-v001.png could not be rendered: headless screenshot hung" in `decisions.md` under Needs Validation, present `mockup.html` for the user to open directly, and continue. Never search the web, install packages, or shell out to a browser binary to work around it.

`tab.screenshot()` never accepts an output path: it saves a resized copy (WebP or JPEG unless `browser.screenshotDir` is set) under a generated name, returns that path, and shows the image in the transcript. The PNG at the versioned path comes from the raw Puppeteer `page` inside `tab.run`; pass the destination through `args`, since run functions do not capture cell variables.

If the app's stylesheets require a running server (bundled CSS, framework dev server), start it with `hub` `op: "start"` (for example `application: "bun", args: ["run", "dev"], ready: { port: <port> }`), wait for readiness, and open `http://127.0.0.1:<port>/<path-to-mockup>` instead of the `file://` URL. Stop the server with `hub` `op: "stop"` when done.

### Barrier 6: stylesheets resolved

Before inspecting the image, prove the stylesheets loaded. Inside `tab.run`, evaluate `[...document.styleSheets].filter(s => s.href).map(s => ({ href: s.href, rules: (() => { try { return s.cssRules.length; } catch { return -1; } })() }))` and return it. Every linked app stylesheet must report `rules > 0`. Any `rules: 0`, `rules: -1`, or missing entry means the `href` did not resolve: this is a failed barrier, not a note. Recompute the relative path from the mockup directory (list the directories between `mockups/v001/` and the stylesheet with `glob`/`read`, one `..` per level), edit `mockup.html`, re-render, and re-run the check until it passes. Do not write the log, present, or continue to step 8 while any app stylesheet has zero rules; the screenshot of an unstyled page is not a valid preview.

Then confirm the PNG exists and is not empty, and inspect the rendered image against the research summary: colors, spacing, typography, icons, and layout. Fix `mockup.html` and re-render before presenting anything that clearly diverges from the app.

If research found a similar feature, offer a comparison: open the existing page the same way, call `tab.screenshot({ fullPage: true })` to show it, and describe the differences.

## 8. Initialize the mockup log

Create `mockups/mockup-log.md` from the "mockup-log.md Template" with `current_version: 1`, `status: iterating`, and the research reference filled from step 2. Set the v001 entry's "Feedback needed" to the visual-check items and any open `UI Q:` ids. The log is durable state and is written before the user's visual check so `wb-mockup-iteration` can resume from it.

## 9. Present and wait

Present the visual preview, the visual-check questions (colors, spacing, typography, icons, layout), and the package summary using the "Presentation" block in `skill://wb-create_mockup/templates.md`. Then stop.

Approval is never inferred. If the user says the visual check is unavailable, not confirmed, or gives no answer, leave the log's v001 status at "In Review", report that the visual check is pending, and stop. Feedback after this point is handled by `wb-mockup-iteration`.

## Output files

| File | Purpose |
| --- | --- |
| `mockups/mockup-log.md` | Versions and running requirements |
| `mockups/v001/mockup.md` | ASCII structure and specifications |
| `mockups/v001/mockup.html` | Working HTML with the app's styles |
| `mockups/v001/decisions.md` | Rationale for this version |
| `mockups/v001/preview-v001.png` | Screenshot of the HTML mockup |

## Guidelines

- Research first: cite `path:line`; follow established patterns unless the user explicitly breaks them.
- Ask before assuming: understand the why, identify constraints early.
- Versioning: never overwrite; document what changed and why; keep the decision trail for `design.md`.
- Fidelity: ASCII for structure, HTML with real styles for visual validation, component specs copied from research, researched icon system (no placeholder icons or emojis), state documentation, screenshots for approval.

## Relationship to other commands

1. `/wb:create_research` — understand the codebase
2. `/wb:create_mockup` — research UI and create v001
3. `/wb:mockup-iteration` — refine versions
4. `/wb:explore_design` — optional architecture exploration
5. `/wb:create_design` — finalize design from mockup decisions
6. `/wb:create_tasks` — plan implementation
