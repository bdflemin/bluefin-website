# Wolves

## Boundary

**Agents edit content. Agents never edit design.**

The `/wolves/` entry is a shipped fullscreen experience. Content work uses the
sources listed in `docs/reference/wolves-runtime.md`. Do not change layout,
markup, styles, controls, animation, player synchronization, or runtime behavior
for a content request.

## Runtime

- Entry: `wolves/index.html`
- Mount: `src/wolves-main.ts` and `src/WolvesApp.vue`
- State: `src/stores/cinematic.ts`
- Intro data: `src/data/wolves-intro-sequence.ts`
- Segment data: `src/config/wolves-cinematic.ts`

## Local verification

```bash
npm run dev -- --host 127.0.0.1
```

When YouTube rejects a numeric loopback origin, open
`http://projectbluefin.io.localhost:<port>/wolves/`. Run the relevant tests,
typecheck, build, and browser flow before reporting completion.

See `docs/reference/wolves-runtime.md` and
`docs/skills/wolves-content/SKILL.md` for the canonical procedure.
