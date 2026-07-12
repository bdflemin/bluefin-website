# Wolves Final Layout Design

## Goal

Deliver `/wolves` as a comic-first teaser page for *Seven Days to the Wolves*. The comic reader remains unchanged. A persistent soundtrack experience accompanies reading without autoplaying, restarting, or changing tracks as pages change.

## Layout

Desktop uses one content grid:

- The left two-thirds contains the unchanged `WolvesComicReader` and, immediately below it, the full soundtrack panel.
- The right third is a full-height sticky, independently scrollable lore sidebar. It contains lore quotes and the QR-code section.
- The existing page header remains a compact introduction above the grid.

Below the desktop breakpoint, the document order is comic reader, full soundtrack panel, lore column, and QR codes. After the visitor explicitly starts the soundtrack, the same soundtrack component changes to a compact bottom-pinned mobile bar. It does not create a second player.

## Components

`WolvesApp.vue` composes the page and owns only layout-level state. Its top README comment documents quote maintenance, the donation target, playlist ID, playback decision, and adding Spotify.

`WolvesComicReader.vue` is untouched.

`WolvesSoundtrack.vue` owns a single, page-lifetime YouTube IFrame API player and the full desktop/mobile soundtrack presentation. It creates the player only after an explicit click. It exposes a compact presentation from the same state when mobile playback begins.

`WolvesLoreColumn.vue` renders quote data and controls. `WolvesQrCodes.vue` renders the generated Store and Donate QR assets.

## Soundtrack

The soundtrack uses a provider-neutral source and track manifest:

- Provider configuration identifies the YouTube playlist `PLA78oiE-RGAE`, public playlist URL, YouTube Music deep link, and a reserved Spotify URI.
- Track records provide title, artist, video ID, and local artwork path. The UI never invents tracks or uses copied lyrics.
- A manually run build-time refresh script scrapes the public YouTube playlist and writes the checked-in manifest and artwork assets under `public/`. Vite builds only consume these static files, so build output is deterministic and needs no browser-visible YouTube Data API key.
- The YouTube IFrame API is loaded after Start Soundtrack. Player state events, not button intent, drive `loading`, `ready`, `playing`, `paused`, and `error` UI states.
- The player stays mounted while comic pages turn. Neither page nor chapter state is passed to playback, so it never changes the listener's selected track.

The page cannot reliably detect YouTube sign-in, and signing in alone does not ensure ad-free playback; YouTube Premium does. The chosen UX is an in-page YouTube playlist player plus a visible YouTube Music deep link and a concise Premium requirement notice. Neither route autoplays.

Spotify later requires adding its URI and a provider adapter implementing the same source/track contract. No layout changes are required.

## Lore And QR Data

`src/data/bazzite-quotes.json` uses this schema:

```ts
interface BazziteQuote {
  quote: string
  attribution: string
  context?: string
  date?: string
}
```

It starts with five clearly labelled lorem ipsum placeholders and a comment explaining that real, approved Discord quotes belong there. The component does not depend on older fictional archive or intercepted-conversation data.

`scripts/generate-qrs.js` generates the existing Store SVG for `https://store.projectbluefin.io` and a Donate SVG encoding `#`. A source comment marks the one place to replace the donation URL.

## Failure Behavior And Tests

If playlist metadata cannot be loaded or YouTube cannot initialize, the soundtrack panel reports the failure and keeps the external YouTube/YouTube Music links usable. It never presents an idle or failed player as playing.

Vitest coverage validates the quote schema, QR destinations, explicit player creation, real player-state rendering, playback persistence while the reader emits page changes, external-link fallbacks, and the mobile persistent-bar state. Targeted tests, typechecking, linting, and the production build verify the completed integration.

## Scope Boundaries

The comic reader and unrelated site components are not changed. The Wolves entry HTML is corrected only as necessary for the site base path. The Spring 2026 documentation page is not modified.
