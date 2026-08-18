---
name: validation
description: Use when checking changes, staging files, pushing commits, or deciding whether production is live.
---

# Validation

## Overview

Choose checks that prove the changed behavior without claiming more than they
prove.

## When to Use

Use before completion reports, commits, pushes, deployment checks, or live-status
claims.

## When NOT to Use

Do not run the full application suite for documentation-only changes.

## Core Process

1. Match checks to changed paths.
2. Run `git diff --check`.
3. Inspect `git status --short` and the diff; classify unrelated dirty files
   before staging.
4. For deletions, search manifest, import, timeline, and generated-data
   references before committing.
5. Stage explicit paths only.
6. For a push, verify the exact commit's deployment workflow and smoke-test the
   affected route in Chromium for page errors.

Documentation-only check:

```bash
git diff --check
```

Application content or data checks:

```bash
npm run typecheck
npm run test:gate
npm run build
```

Full code checks:

```bash
npm run lint:fix
npm run typecheck
npm run test:gate
npm run build
```

## Red Flags

- Completion is based only on a local build.
- A different commit's deployment is cited.
- Unrelated generated changes are staged.
- A deletion is committed while a manifest still references the missing file.
- Only a build is checked for a route that eagerly loads runtime data.
- `git add .` or `git add -A` is used.
- More than one dev server is listening, or a `vite preview` is up during source
  work.
- A change is called missing from the browser before the serving process and its
  port were identified.
- `npm run test:run` output is used to decide whether a change is safe.
- `tests/known-failures.txt` is re-recorded in the same commit as the change that
  added the failures.
- Something is deleted as "dead code" without checking the non-Wolves
  experiences that share `WolvesComicReader.vue`.

## Verification

After pushing, verify the exact commit:

```bash
sha=$(git rev-parse HEAD)
gh run list --repo projectbluefin/website \
  --workflow "Deploy to GitHub Pages" --commit "$sha" --limit 1 \
  --json databaseId,headSha,status,conclusion,url
```

Production is complete only when the run has the same SHA, status `completed`,
and conclusion `success`. For multi-entry builds, also smoke-test every path
listed in `../../reference/production-entrypoints.md`; adding an HTML entry alone
is insufficient unless the Vite Rollup input and directory redirect include it.
For runtime manifests, the browser smoke must assert both a non-empty rendered
body and zero `pageerror` events.

## References

Procedure lives here; the detail each area has already cost the repo lives in
these references. Load only the one the change needs.

| Reference | Covers |
|---|---|
| [`references/baseline-gate.md`](references/baseline-gate.md) | Why `test:gate` is the signal, `tests/known-failures.txt`, and re-recording rules. |
| [`references/wolves-show-validation.md`](references/wolves-show-validation.md) | Why a green suite proves nothing about the show, and Wolves timing validation. |
| [`references/component-tests.md`](references/component-tests.md) | Component test patterns and the traps that shipped past them. |
| [`references/dev-server-hygiene.md`](references/dev-server-hygiene.md) | "I don't see my change": ports, stale `vite preview`, HMR proof. |
| [`references/ci-signals.md`](references/ci-signals.md) | Cache keys as part of the cache path list, and red integration branches. |

- `../../reference/production-entrypoints.md`
- `../../architecture/runtime-data-flow.md`
