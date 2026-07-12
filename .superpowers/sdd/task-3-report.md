# Task 3 Report: Build Dynamic Canvas-Based PDF Comic Reader (PDF.js CDN)

## Status: DONE

## Summary

Replaced the placeholder Stacklet `comicPages` image array in `src/WolvesApp.vue`
with a real PDF.js-based canvas reader that fetches and renders
`https://download.projectbluefin.io/color-with-bluefin.pdf` on demand.

## Implementation Details

1. **Dynamic PDF.js injection** — `loadPdfJs()` injects
   `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js` via a
   dynamically created `<script>` tag in `onMounted`, then points
   `pdfjsLib.GlobalWorkerOptions.workerSrc` at
   `.../3.11.174/pdf.worker.min.js`. Re-entrant/idempotent (skips if the script
   tag or cached lib already exists).
2. **PDF loading & on-demand render** — `loadComicPdf()` calls
   `pdfjsLib.getDocument(PDF_URL).promise`, then `renderPageOnCanvas()` calls
   `page.getPage(n)` → `page.render({ canvasContext, viewport, transform })`,
   with device-pixel-ratio-aware canvas sizing for crisp output. In-flight
   `RenderTask`s are tracked per page number and cancelled before a new render
   starts on the same canvas (avoids pdf.js's "already rendering" errors during
   rapid resize/page-flip).
3. **Auto-scaling page fit** — `ResizeObserver` instances (`flipResizeObserver`,
   `scrollResizeObserver`) observe the `.comic-viewport` (flip mode) and
   `.scroll-comic-layout` (scroll mode) containers, recomputing
   `scale = containerWidth / baseViewport.width` and re-rendering on resize.
   Fixed `aspect-ratio: 4/5` was removed from `.comic-viewport` CSS so the real
   PDF page's aspect ratio is preserved instead of being cropped/stretched.
4. **Page turning, jump dropdown, layout toggle** — `nextPage()`/`prevPage()`/
   `jumpToPage()` now operate against the PDF's real `totalPages` (was the
   placeholder array length). Existing Left/Right keydown handling and the
   Page-By-Page vs Continuous Scroll toggle buttons were preserved and now
   drive canvas-based rendering; Continuous Scroll renders one canvas per page
   into a `scrollCanvases` ref array via a function `:ref` callback.
5. Added loading (spinner) and error (message + Retry button) states shown
   while PDF.js/the PDF document loads, since fetch is now async/network-bound
   instead of instant local placeholder data.
6. Cleanup: `onBeforeUnmount` now disconnects both `ResizeObserver`s, cancels
   any pending render tasks, and calls `pdfDocument.destroy()`.

## Verification

- `npm run typecheck` — clean, 0 errors.
- `npm run lint:fix` — clean, 0 errors/warnings.
- `npm run build` — succeeds (only the pre-existing, expected harmless
  `[lightningcss minify] Unknown at rule: @theme/@tailwind` warnings).
- `npm run test:run` — all 37 existing Vitest tests pass (no tests reference
  `WolvesApp.vue` directly).
- **Live functional smoke test** (Playwright against `npm run dev`):
  - Confirmed `https://download.projectbluefin.io/color-with-bluefin.pdf`
    serves CORS headers (`access-control-allow-origin`) for the
    `https://projectbluefin.io` production origin, but **not** for
    `localhost` dev origins — so in local dev the fetch is correctly blocked
    by the browser and the reader falls back to the new error state with a
    working Retry button (verified in both Page-By-Page and Continuous
    Scroll layouts, in both cases with zero unrelated console errors).
  - Using Playwright request interception to simulate the production CORS
    allowlist, verified the full happy path against the real PDF: 15 pages
    loaded, canvas rendered actual ink content (549k+ non-white opaque
    pixels sampled), Next/Prev buttons, Left/Right arrow keys, and the jump
    dropdown all correctly changed the rendered page and the "Page X of 15"
    indicator; resizing the viewport (900px → 500px) correctly rescaled the
    canvas (638px → 450px wide) via the `ResizeObserver`; toggling to
    Continuous Scroll rendered all 15 page canvases. Zero console errors in
    all cases.

## Commit

- `175a948` — `feat(wolves): Build responsive canvas-based PDF.js reader`
  (`src/WolvesApp.vue` only, as specified in the task brief)

## Concerns

- **CORS is production-domain-gated.** The download server only returns
  `Access-Control-Allow-Origin` for allowlisted origins (confirmed
  `https://projectbluefin.io` works, `localhost` does not). This is expected
  and outside the scope of this frontend-only task, but it means the reader
  will show the network error state whenever tested from any non-allowlisted
  origin (local dev, preview deployments, forks on different domains). No
  code change can fix this from the client side — flagging in case the
  download origin's CORS allowlist needs to be widened for staging/preview
  domains.
- Continuous Scroll mode renders **all** pages up front (this PDF has 15
  pages, so it's fast in testing) rather than lazily via `IntersectionObserver`.
  The task brief only required a `ResizeObserver` for scaling, not lazy
  loading, so this was left simple by design; worth revisiting if the PDF
  grows substantially longer.

## Fix Report

The two important findings from Task 3's review have been successfully resolved:

1. **Accessibility Gap:**
   - In `src/WolvesApp.vue`, added `role="img"` and dynamic `aria-label` attributes to the HTML5 `<canvas>` elements in both Flip and Continuous Scroll reading modes to ensure screen reader visibility.
     - Flip mode canvas now contains: `:aria-label="\`Comic page \${currentPageIndex + 1} of \${totalPages}\`"`
     - Continuous scroll mode canvas now contains: `:aria-label="\`Page \${n} of \${totalPages}\`"`

2. **Observer Leak on Mode Toggle:**
   - Resolved potential memory and event loop leaks in the `readingMode` watcher of `src/WolvesApp.vue` by explicitly calling `disconnect()` on the unused resize observer when toggling modes:
     - Switching to `'flip'` mode now calls `scrollResizeObserver?.disconnect()` before initializing and observing the flip viewport.
     - Switching to `'scroll'` mode now calls `flipResizeObserver?.disconnect()` before initializing and observing the scroll container.

### Verification and Tests

All build, lint, and type-checks passed perfectly without errors or warnings:
- `npm run typecheck` - Verified clean TypeScript compilation.
- `npm run lint:fix` - Checked and formatted styles and Vue rules.
- `npm run build` - Verified successful Vite production packaging.

### Commit Details

- **Commit Message:** `fix(wolves): Add canvas aria-labels and disconnect stale resize observers`

## 2026-07-12 Follow-up Review Fixes

- Moved lore rendering into `src/components/wolves/WolvesLoreColumn.vue` and updated `src/WolvesApp.vue` to consume the component instead of reading legacy quote fields directly.
- Converted `src/data/bazzite-quotes.json` to the final schema (`quote`, `attribution`, optional `context`, optional `date`) and added `src/components/wolves/lore.ts` as the typed adapter/export used by the live Wolves route and tests.
- Restored QR rendering with Vite asset imports (`qr-store.svg`, `qr-donate.svg`) in the lore component instead of literal source URLs.
- Removed the remaining `any`-style JSON consumer in Wolves coverage by switching `src/tests/wolvesStory.test.ts` to the typed lore export.
- Added focused Vitest coverage for the Wolves app chapter handoff and the lore column's final-schema quote rendering plus QR asset wiring.

## 2026-07-12 QR Asset Production Follow-up

- Split the QR markup out of `src/components/wolves/WolvesLoreColumn.vue` into the dedicated `src/components/wolves/WolvesQrCodes.vue` described by the final layout spec.
- Statically imported `qr-store.svg` and `qr-donate.svg` inside `WolvesQrCodes.vue` and bound the generated asset URLs to the rendered `<img>` tags so Vite rewrites them correctly in production builds.
- Updated focused Wolves coverage to assert the lore column still includes the QR component and moved the asset-URL assertions into `src/tests/wolvesQrCodes.test.ts`.
- Verified the targeted QR test and the production build after the component split.
