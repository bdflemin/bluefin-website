---
name: wolves-content-maintenance
version: "1.2"
last_updated: 2026-07-19
tags: [wolves, content, lore]
description: Use when adding or editing Wolves lore, incoming signals, playlist or back-catalogue metadata, creator shorts, characters, dinosaurs, guardian bonds, or wallpapers.
metadata:
  type: procedure
---

# Wolves Content Maintenance

Read `docs/wolves-maintenance.md` before touching any Wolves file. It is the canonical production reference.

**Agents edit documented content surfaces. Agents never edit Wolves design.**

## When to Use

Use for Wolves lore, incoming signals, playlist or back-catalogue metadata, creator shorts, characters, dinosaurs, guardian bonds, or wallpapers.

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
8. For an explicitly owner-approved Track 0 pacing recovery, make the music authoritative over slideshow coverage. Use only measured section boundaries and `trackZeroBeatCuts()` tiers, assert allocations by beat index rather than a fixed duration range, carry unscheduled local people into later tracks, and capture the affected browser boundary.
9. Chapter-transition `transitionLore` conversations stay authored in `src/config/wolves-cinematic.ts` and drive the transition sound effects, but the overlay renders the terminal block instead; do not restore the conversations to the overlay without explicit authorization.
10. Every selected Track 0 shot plays once. The generator collapses byte-identical wallpaper files to one manifest entry; never add a second copy of an existing shot under a new filename expecting both to play — give the curated copy its `curatedTitles` entry and let the dedupe pick the survivor. Unscheduled local people carry forward to the later-track gallery; never backfill the music-authoritative barrage from the CNCF feed.
11. For the Comic Hero QR rotation, compare rendered candidate artwork rather than filenames. Include one high-quality representative of each distinct visual; reject pose duplicates and guardian-bond artwork, even if their files differ. Record each source image's alpha-content bounds in its `contentFrame` so the visible dinosaur, not transparent canvas padding, determines its scale.
12. Load `build-verify-deploy.md` and complete every Wolves-specific check from the canonical reference.

## Back Catalogue

- Never hand-edit `public/experiences/catalogue.json` or its album covers. Regenerate them with `npm run update:back-catalogue`.
- The documentation repository's published `data/playlist-metadata.json` is the album index and single source of truth. `music.projectbluefin.io` redirects to that documentation page; do not scrape it.
- The generator reads each YouTube playlist with `yt-dlp --flat-playlist --dump-single-json`, copies covers byte-for-byte from the documentation site, and rewrites `public/experiences/catalogue.json`.
- Every generated experience is audited against the source playlist entries before the catalogue is written: the script throws if any playable source entry is dropped, reordered, or loses a valid `youtubeId`/duration. Treat that failure as a content bug and fix the generator or override table rather than editing the generated JSON.
- Keep irreducible per-video title or artist corrections in the generator's small `TRACK_METADATA_OVERRIDES` table; do not patch generated JSON.
- The generator filters unavailable/private entries, removes presentation noise, and deduplicates by YouTube video ID plus normalized artist/title identity. Preserve version-defining descriptors such as live, cover, instrumental, and featured artist labels.
- Generated segments use their album title as the runtime chapter/status label; the runtime supplies each track's position counter.
- Album covers are public runtime assets and must retain their source bytes. Do not resize, crop, or re-encode them.

## Wallpaper Weight Budget

Wallpapers are slideshow-only (never offered for download), so lossy re-encoding is safe. When a wallpaper exceeds roughly 500KB:

- Re-encode in place, keeping the exact filename and extension. Track 0 slide windows hardcode path IDs (including case-sensitive names like `hikari.JPG`); a renamed file silently breaks locked scheduling.
- Cap the long edge at 2560px. Use JPEG quality 82 (progressive, optimized) via Pillow, or `cwebp -q 80` for WebP.
- PNG-format photos stay large because PNG is lossless; converting them to JPEG/WebP requires a filename change, so treat that as a separate, explicitly approved manifest edit.
- Verify every re-encoded file decodes (`PIL Image.load()`), then run `npm run test:run` and capture browser screenshots at the affected Track 0 slide windows.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "A tiny component change makes the content fit." | Components are locked design. |
| "I can write placeholder lore." | Only user-authored prose or standard lorem ipsum is allowed. |
| "The generated title is almost right; editing JSON is faster." | Fix the generator or its explicit override table, then regenerate every album. |

## Red Flags

- Any `.vue`, `.scss`, layout, typography, animation, control, or rendering change.
- Any thesis text or timing change without explicit authorization.
- A new lore kind or component.
- Text moving between signal, thesis, lore, or team-chat layers.
- Generated fiction or reconstructed prose.
- Spotify playback proposed to drive Wolves visuals.
- A wallpaper re-encode that changes a filename or extension.
- The same shot registered under two filenames, or a repeated slide anywhere in Track 0.
- Hand-editing `public/experiences/catalogue.json` or generated album covers.
- Scraping `music.projectbluefin.io` instead of using documentation playlist metadata.
- Removing version-defining title text while cleaning YouTube marketing noise.

## Verification

- [ ] Diff is confined to documented open surfaces.
- [ ] Authored prose is exact.
- [ ] Locked thesis and timeline data remain unchanged.
- [ ] Relevant tests, build, and real-player timestamp checks pass.
- [ ] Every documentation album appears once in the generated catalogue.
- [ ] Generated tracks have no duplicate IDs or normalized artist/title identities.
- [ ] Covers retain source bytes and all track metadata passes the generator audit.
- [ ] Exact pushed-SHA deployment and affected live state are verified.

## Sources

- `docs/wolves-maintenance.md`
- `docs/skills/editorial-policy.md`
- `docs/skills/build-verify-deploy.md`
- yt-dlp playlist and JSON extraction: `/yt-dlp/yt-dlp`
