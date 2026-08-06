# Agent instructions

## Scope

This repository builds a production website and separately mounted
sub-applications with Vue, TypeScript, Vite, SCSS, and Tailwind.

## Absolute boundary

**Agents edit content. Agents never edit design.**

Content includes prose, translations, URLs, data values, registered records, and
approved assets inside existing structures.

Design includes layout, markup structure, component behavior, styles, typography,
responsive behavior, navigation prominence, and animation.

A content request does not authorize a design change. Stop and ask for explicit
approval if the requested result needs a design file or runtime behavior change.

## Start here

1. Read this file.
2. Read `docs/SKILL.md` and load the one matching skill it names.
3. Read the source file that owns the requested content.
4. Check `git status --short` before editing.
5. Before finishing, write back what you learned. See `## Self-Improvement`.

## Production entry points

| Path | Entry file | Status |
|---|---|---|
| `/` | `index.html` | Public main site |
| `/wolves/` | `wolves/index.html` | Public presentation (see below) |
| `/dakota/` | `dakota/index.html` | Unlisted sub-application |
| `/server/` | `server/index.html` | Separate production entry |

Do not promote an unlisted path through navigation, metadata, or a sitemap.

## `/wolves/` is a presentation

`/wolves/` is not a web page that happens to animate. It is a cinematic
presentation performed to a live audience seated in a theater, projected on a
large screen and synchronized to music by the media player clock.

That single fact decides most arguments about it:

- **Nobody can interact with it.** The audience has no input device and the
  presenter is not driving it. Never require, offer, or depend on click, hover,
  pointer, touch, keyboard, or scroll to follow the narrative. If text needs
  input to be finished reading, it is broken.
- **It is read from the back row.** Type is sized for projection distance, not
  for a laptop. Small, dense, or low-contrast text is a defect.
- **Nothing scrolls or pans.** Every beat is a complete, self-contained page
  that appears, holds long enough to be read, and is replaced.
- **Consistency is the product.** Identical chrome, metadata, and type scale on
  every record. On a large screen, per-view variation does not read as variety;
  it reads as a broken slide deck.
- **A quote is never split across pages.** Splitting re-renders the quote mark
  and attribution and destroys the beat.
- **Time is the binding constraint.** Every record is allocated a window from
  the music. Content that does not fit its window never reaches the audience,
  no matter how good it is. Adding words removes other words.
- **It must survive unattended.** There is no chance to recover live. A
  mid-show failure is seen by everyone.

Judge every Wolves change by "can the back row read this in the time the music
allows", not by whether it looks right on your monitor.

Detail lives in `docs/reference/wolves-runtime.md`.

## Content sources

- Main-site locale copy: `src/locales/en-US.json`
- Main-site fixed data and links: `src/content.ts`
- Wolves content: `docs/reference/wolves-runtime.md`
- Locale rules: `TRANSLATION-GUIDE.md`
- Generated data: use the generator named by the owning reference

Use `import.meta.env.BASE_URL` for public runtime asset paths.

## Commands

```bash
npm install --include=dev
npm run dev -- --host :: --port 5173 --strictPort
npm run lint
npm run typecheck
npm run test:gate
npm run build
npm run preview
```

Run exactly one dev server. `npm run test:gate` is the test signal, not
`npm run test:run`: the suite carries a recorded baseline of known failures in
`tests/known-failures.txt` and the gate fails only on new ones.

For documentation-only changes:

```bash
git diff --check
```

Use the smallest relevant check. See `docs/skills/validation/SKILL.md` before
reporting completion.

## Temporary artifacts

Use `/var/tmp/website-agent/` for logs, screenshots, browser fixtures, and
handoff artifacts. Do not write session artifacts to `/tmp`.

## Worktree safety

- Do not modify unrelated dirty files. Before committing local work, classify
  every dirty path and confirm each deletion has no remaining manifest, import,
  timeline, or generated-data references.
- Stage explicit paths only.
- Never use `git add .` or `git add -A`.
- Do not use destructive reset or restore commands.
- Do not hand-edit generated files.
- Do not claim production completion from a local build. Start the affected
  route and exercise it in Chromium; build success does not catch eager runtime
  loaders such as `import.meta.glob()` manifest failures.
- Verify the exact pushed commit's deployment workflow and affected live route
  before saying the change is live.

## Authored content

Do not invent lore, fiction, dialogue, quotes, attributions, or release-note
narrative. Preserve supplied wording, provenance, URLs, and placeholders. Read
`docs/skills/editorial-provenance/SKILL.md`.

## Design gate

If the diff would touch a component, template, style, layout, animation, control,
or navigation surface, stop and load `docs/skills/design-gate/SKILL.md`.

## Self-Improvement

Every session ships two outputs: the work **and** the updated skill file in
`docs/skills/`. Same commit. Not a follow-up.

Banned:

- No changelog files. Delete `IMPROVEMENTS.md`, `CHANGELOG.md`, `CHANGES.md`,
  or `SESSION.md` if found.
- No session notes committed to the repo (`NOTES.md`, `PLAN.md`, `TODO.md`,
  progress files). Session state stays in the agent's session folder.
- No "append here" docs. Route the learning to `docs/skills/` instead.

Before marking work done:

- [ ] Discovered a workaround, pattern, convention, or corrected fact?
- [ ] Skill file updated (or created)?
- [ ] Committed in this same PR?

Full contract: `docs/skills/skill-improvement/SKILL.md`.

## Factory context

This repository is part of the Project Bluefin factory. Local authority wins:
this file and `docs/SKILL.md` are authoritative for paths, boundaries, and
commands. `projectbluefin/common` attaches as a pinned shared-contract sidecar
supplying factory-wide rules; it never overrides local authority, and an
unreachable sidecar is degraded mode rather than permission to use a stale
sibling checkout.

Every task loop runs preflight, the smallest scoped change, validation, and a
durable write-back. Stop at named human gates: design changes, production
claims, credentials, and cross-repository breakage.

Cross-repo learning goes to an issue in `projectbluefin/common` with the
learning, affected component, and evidence. Never edit `ublue-os/*`; ask a human
to report upstream manually.

## References

- `docs/SKILL.md`
- `docs/skills/skill-improvement/SKILL.md`
- `docs/reference/content-map.md`
- `docs/reference/production-entrypoints.md`
- `docs/architecture/application-map.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
