---
name: wolves-content
description: Use when editing Wolves lore, signals, characters, soundtrack metadata, gallery data, or approved images.
---

# Wolves content

## Overview

Maintain Wolves content without changing the frozen runtime design.

## When to Use

Use for lore, incoming signals, dinosaurs, guardian bonds, intro data, music
metadata, galleries, and slideshow assets.

## When NOT to Use

Do not use for components, templates, styles, controls, layout, animation,
player synchronization, or generated manifests.

## Core Process

1. Read `../../reference/wolves-runtime.md`.
2. Match the request to an open content surface.
3. Use exact user-supplied or recovered authored copy.
4. Add manifest entries for new registered records.
5. Regenerate generated files with their scripts.
6. Run the relevant tests, build, and browser checks.

For a visible WebP quality regression, compare the optimized asset with its
approved source at identical dimensions. Recover only demonstrated high-loss
PNG or screenshot derivatives as lossless WebP; do not upscale assets whose
source is already low resolution.

For Flickr-backed theater assets, retrieve the largest available Flickr
rendition (prefer 2048px, then 1600px, then the original) before encoding a
WebP derivative at high quality. Keep the existing local filename and do not
upscale when Flickr's original itself is below the target size.

When an official event album uses camera filenames instead of descriptive
titles, add its distinctive prefixes to `peopleFirst.allowPatterns`, run
`node scripts/update-flickr-photos.js`, and verify it adds photos before
claiming the presentation refresh is complete.

To re-source a local people asset whose Flickr identity is unknown, resolve
the album by title rather than guessing: the CNCF account is `143247548@N03`,
its albums index is client-rendered, so collect `/albums/<id>` links from that
page and read each album page's `<title>`. KubeCon + CloudNativeCon Europe 2026
is the Amsterdam album (`72177720332674037`). Album pages are server-rendered,
so `extractPhotosFromAlbumHtml()` from `scripts/update-flickr-photos.js` works
directly. That scraper returns a size-suffixed `secret` such as
`abc123_h`; request `{id}_{secret}.jpg` unchanged, because stripping the
suffix to build another size returns HTTP 410. Camera filenames encode the day
(`KC+CNC_EU_2603DD_Keynote_DK_NNN`), so filter on the day and session before
scanning. Match candidates by content, not title — a perceptual hash of the
local file plus a saturated-hue mask narrows hundreds of frames to a handful
for human confirmation. Confirm the chosen frame with the user before
replacing, then take the largest rendition from `/sizes/o/` and re-encode over
the existing filename so the generated wallpaper manifest stays unchanged.

For a dinosaur addition, use the registry, supplied artwork, and supplied lore
record. Do not invent names, scientific facts, pairings, or provenance.

## Red Flags

- A `.vue`, style, or runtime synchronization file changes.
- Authored prose is generated or summarized.
- A generated manifest is hand-edited.
- Text moves between signal, thesis, lore, and chat layers.

## Verification

- [ ] Diff contains only documented content surfaces.
- [ ] Authored copy is exact.
- [ ] Generated files were regenerated from source.
- [ ] Affected player timestamps were checked when applicable.
- [ ] `../validation/SKILL.md` is complete.

## References

- `../../reference/wolves-runtime.md`
- `../editorial-provenance/SKILL.md`
- `../validation/SKILL.md`
