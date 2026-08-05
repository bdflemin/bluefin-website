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
| `/wolves/` | `wolves/index.html` | Public experience |
| `/dakota/` | `dakota/index.html` | Unlisted sub-application |
| `/server/` | `server/index.html` | Separate production entry |

Do not promote an unlisted path through navigation, metadata, or a sitemap.

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
npm run dev
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run preview
```

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
