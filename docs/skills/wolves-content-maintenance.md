---
name: wolves-content-maintenance
version: "1.0"
last_updated: 2026-07-17
tags: [wolves, content, lore]
description: Use when adding or editing Wolves lore, incoming signals, playlist metadata, creator shorts, characters, dinosaurs, guardian bonds, or wallpapers.
metadata:
  type: procedure
---

# Wolves Content Maintenance

Read `docs/wolves-maintenance.md` before touching any Wolves file. It is the canonical production reference.

**Agents edit documented content surfaces. Agents never edit Wolves design.**

## When to Use

Use for Wolves lore, incoming signals, playlist metadata, creator shorts, characters, dinosaurs, guardian bonds, or wallpapers.

## When NOT to Use

Fullscreen overlay engineering uses `wolves-fullscreen-overlays.md`. Any other Wolves design work is locked.

## Core Process

1. Match the request to an open surface in `docs/wolves-maintenance.md`.
2. If the required path or behavior is locked, stop.
3. Apply user-supplied prose exactly; `editorial-policy.md` owns authorship rules.
4. Keep Track 0 layers separate:
   - top-bar communications: `src/data/wolves-incoming-signal.txt`
   - thesis overlay: `src/data/wolves-thesis-sequence.ts`, locked
   - lore column: `src/data/lore/*.md`
   - later-track team chat: `src/data/wolves-team-chats.ts`
5. When recovering missing top-bar communications, recover both the exact signal
   source and its selection timing in `wolves-thesis-sequence.ts`; source text
   alone may be unreachable.
6. Never hand-edit `src/components/wolves/wallpapers-list.ts`.
7. Preserve Track 0, timeline anchors, fixed slide windows, playlist order, and gallery shuffle rules exactly as documented.
8. Load `build-verify-deploy.md` and complete every Wolves-specific check from the canonical reference.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "A tiny component change makes the content fit." | Components are locked design. |
| "I can write placeholder lore." | Only user-authored prose or standard lorem ipsum is allowed. |

## Red Flags

- Any `.vue`, `.scss`, layout, typography, animation, control, or rendering change.
- Any thesis text or timing change without explicit authorization.
- A new lore kind or component.
- Text moving between signal, thesis, lore, or team-chat layers.
- Generated fiction or reconstructed prose.
- Spotify playback proposed to drive Wolves visuals.

## Verification

- [ ] Diff is confined to documented open surfaces.
- [ ] Authored prose is exact.
- [ ] Locked thesis and timeline data remain unchanged.
- [ ] Relevant tests, build, and real-player timestamp checks pass.
- [ ] Exact pushed-SHA deployment and affected live state are verified.

## Sources

- `docs/wolves-maintenance.md`
- `docs/skills/editorial-policy.md`
- `docs/skills/build-verify-deploy.md`
