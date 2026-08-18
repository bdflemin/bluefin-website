# The baseline gate

## The baseline gate

`npm run test:run` is the pass/fail signal again: as of 2026-08-09 the vitest
suite is fully green and `tests/known-failures.txt` is empty (issue #705). The
suite was red for weeks before that (35 failing on 2026-07-29, 23 on 2026-08-09
morning), and agents learned to ignore the bare run — which is how real
regressions shipped unnoticed. If the baseline grows again, the current count
is `tests/known-failures.txt`'s line count, not any prose figure; re-derive it
instead of trusting documentation.

Keep the gate as the guard:

```bash
npm run test:gate
```

It runs the suite, compares the failing set against `tests/known-failures.txt`,
and exits non-zero **only for failures you introduced**. It also lists baseline
failures that now pass, so the baseline shrinks as the suite is repaired.

**CI does not use the gate.** The `test` job in `.github/workflows/ci.yml` runs
`npm run test:run -- --coverage` directly, so `tests/known-failures.txt` was
never applied in CI: every baseline failure failed every PR, which is why a red
`main` hid in plain sight while the local gate stayed green (found 2026-08-09,
issue #705). Until the workflow is changed, a nonzero baseline means red CI no
matter what the gate says — treat any `test:gate:update` re-record as a CI
break. The same CI command also enforces the v8 coverage thresholds in
`vite.config.ts` — ratcheted 2026-08-09 from a flat 50% to just below measured
coverage, plus a `src/components/**` glob backstop (issues #674/#676) — so
verify with the exact CI invocation when touching test infrastructure:

```bash
npm run test:run -- --coverage
```

**What CI actually enforces.** The `test` job runs, in order: `check:docs`,
`lint`, `typecheck`, `test:run -- --coverage`, and `build`. The `lint`,
`typecheck`, and `build` steps were added 2026-08-09 — before that CI ran only
`check:docs` and the suite, so a type error or a broken production build could
merge with a green tick. Run the full local list above before pushing; a green
`test:gate` alone no longer predicts a green CI.

Re-record only when you have deliberately changed the failure set, and say so in
the commit message:

```bash
npm run test:gate:update
```

Never re-record to silence a failure you caused. Never delete an entry by hand
to hide a still-failing test.
A shrinking `tests/known-failures.txt` is good; a growing one needs a reason.

### Coverage measurement and thresholds

Vitest 4 with the v8 provider has three traps this repo's config now guards
against (learned 2026-08-09, issues #673–#676):

- **Untested files are invisible by default.** Only files imported by tests are
  counted; a component with zero tests does not appear in the report at all, so
  "All files" ran ~3 points high while 24 components sat outside it.
  `coverage.include: ['src/**']` in `vite.config.ts` forces every source file
  into the report at its true 0%.
- **Glob thresholds check the aggregate of matched files.**
  `thresholds['src/components/**']` is the backstop that stops new untested
  components from regressing the group. Verify semantics before trusting a new
  threshold: set it impossibly high, expect
  `ERROR: Coverage for statements (X%) does not meet ...`, then set the real
  value.
- **Ratchet below measured, never at aspirational targets.** Global thresholds
  sit ~3pt under the *lowest* measured figure, and the components glob gets a
  wider margin because one added component moves an aggregate more than the
  global figure. Thresholds above measured fail CI on day one; thresholds far
  below allow silent regression.
- **v8 coverage is Node-version sensitive — floor thresholds against the
  lowest supported version, not against CI.** The same commit measures
  77.8/67.3/79.5/77.6 on Node 24 (what CI pins) but 73.6/65.1/77.6/73.2 on
  Node 22 — a ~4pt spread with an identical test set. Thresholds derived from
  a CI run alone therefore pass CI while failing every contributor on an older
  Node, which reads as "the suite is broken on main" (hit 2026-08-09, right
  after #712 set them ~1pt under the Node 24 figures). Measure on your local
  Node *and* read the CI log before choosing numbers.

Run coverage the way CI does — `CI=true npm run test:run -- --coverage`.
`src/tests/wolvesBackCatalogue.test.ts` carries a live-network audit gated on
`skipIf(process.env.CI)`, and `wolvesComicReader` timing tests are slow on a
loaded box; a bare local `vitest run` can show failures CI never sees.

### Baseline entry format and shrinking it deliberately

Each baseline line is `<test file path> :: <full concatenated describe + test
name>`, one test per line, sorted (see `scripts/test-baseline.mjs`). When you
repair a stale test (the test was wrong, the code was right), the correct
shrink is: fix the test, delete exactly its line from
`tests/known-failures.txt` in the same change, and prove it with
`npm run test:gate` — the gate must report `no new failures (N known,
baseline N)` with the count reduced. Prefer deriving repaired expectations
from the owning source data (e.g. import `buildIntroVideoSequence` /
`INTRO_SEQUENCE_DURATION`) over fresh hardcoded literals, so authored-timing
changes don't re-stale the test. Issue #705 drained the baseline to zero; keep
it there.

When triaging a baseline failure, read the git history of both the test and the
code under test before choosing a side: an authored commit that deliberately
changed the behavior (its message usually says so) means the *test* is stale.
On `/wolves/` the design gate makes that the strong default — correct the test
to match the shipped show; escalate instead of editing show behavior.

---

Procedure and gate: [`../SKILL.md`](../SKILL.md).
