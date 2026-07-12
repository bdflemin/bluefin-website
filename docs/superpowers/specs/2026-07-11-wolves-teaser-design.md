# Specification: Bluefin Wolves Teaser Landing Page Revisions

- **Status:** IMPLEMENTED
- **Date:** 2026-07-11
- **Target Route:** `projectbluefin.io/wolves`
- **Primary Source:** `https://download.projectbluefin.io/color-with-bluefin.pdf`
- **Quote Data:** `src/data/bazzite-quotes.json` (77 unique dispatches)
- **Playlist ID:** `PLA78oiE-RGAE` ("Bluefin: Seven Days to the Wolves")

---

## 1. Visual Identity & Token System
The page revisions remove the temporary red crimson styling and restore the native, professional, and dark-themed Project Bluefin branding.

### Brand Tokens
- **Background (Deep Night):** `--color-bg` / `#0c1016` (reused global background)
- **Primary Accent (Bluefin Blue):** `--color-blue` / `#4285f4` (standard brand color)
- **Secondary Accent (Highlight Blue):** `--color-blue-light` / `#8a97f7` (borders, hover, active elements)
- **Text Light (Starlight):** `--color-text-light` / `#ffffff` (titles and readable content)
- **Text Muted (Mist Gray):** `--color-text` / `#bdbdbd` (body copy, quotes, and metadata)

---

## 2. Floating Viewport Soundtrack Widget
The soundtrack widget playing Nightwish's "7 Days to the Wolves" is repositioned to float persistently. This ensures that audio playback persists without restarting as the reader scrolls the comic pages.

### Design & Behavior
- **Desktop Layout:** Fixed to the **bottom-right** of the viewport with a high z-index (999), a subtle glassmorphic background blur (`backdrop-filter`), and a thin border colored with `#4285f4/30`.
- **Mobile Layout:** Collapses to a **full-width bottom-pinned bar** to save vertical viewport space.
- **Controls:** Strict click-to-activate playback. Renders a poster/play state overlay before loading, and displays the standard YouTube playlist iframe player upon click.
- **Dismissability:** Includes a close (`&times;`) button that persists the dismissed state during the active session.

---

## 3. Dynamic Canvas-Based PDF Comic Reader
Instead of a rigid, fragile iframe, the comic book experience utilizes Mozilla's **PDF.js** engine to load and render `https://download.projectbluefin.io/color-with-bluefin.pdf` dynamically.

### Core Architecture
- **CDN Loading:** Dynamically injects `pdf.min.js` and configures the `pdf.worker.min.js` worker path at runtime in the Vue `onMounted` lifecycle hook. This avoids bloat in the main site bundle.
- **On-Demand Rendering:** Resolves the PDF document asynchronously, caches page count, and renders only the active page onto a `<canvas>` element using the canvas rendering context.
- **Auto-Scaling Algorithm:** A resize observer listens to container bound changes and window resize events, re-calculating the PDF page scale dynamically so pages **always fit perfectly** on both desktop and mobile viewports.
- **Controls:** Next/Prev page flip buttons, quick-jump select dropdown, keyboard arrow listener (`Left`/`Right` arrow keys), and a layout toggle to switch between Page-by-Page and continuous vertical stacked scroll.

---

## 4. Single-Quote Bazzite Dispatch Teaser
The Quotes section is revised to show exactly **one quote at a time** as an atmospheric comic teaser dispatch.

### Behavior
- **Source File:** `src/data/bazzite-quotes.json` containing 77 unique statements extracted from Jorge Castro's (`j0rge`) actual Discord announcements.
- **Cycling Interval (Option C):** Automatically transitions to the next quote in the array every **9 seconds**.
- **Transitions:** Utilizes a hardware-accelerated CSS transition (`opacity` with absolute positioning over standard block flows) to achieve a smooth, stutter-free text fade.
- **Attribution:** Credited to the fictional comic protagonist **"John Bazzite"** with the subtext *"Bluefin Discord Teaser Dispatch"*.

---

## 5. Support & QR Codes
Side-by-side or stacked grid layout containing the build-time generated inline SVG files:
- **Official Store QR:** `src/assets/svg/qr-store.svg` pointing to `https://store.projectbluefin.io`
- **Donation QR:** `src/assets/svg/qr-donate.svg` pointing to `https://docs.projectbluefin.io/donations`

---

## 6. Verification Criteria
- [x] Visual checks: Theme is Bluefin Blue (`#4285f4`), not red.
- [x] Audio check: Sound widget stays visible/active in bottom-right/bottom-mobile as reader scrolls.
- [x] Reader check: Coloring Book PDF renders dynamically on canvas, scales to fit view, and supports page navigation (arrows + dropdown).
- [x] Quote check: Exactly one quote at a time, cycling every 9 seconds, credited to "John Bazzite".
- [x] Typecheck: `npm run typecheck` passes with zero errors.
- [x] Linter: `npm run lint:fix` reports zero problems.

## 7. Current Refinement Pass
- The explicit "Comic Reader" heading was removed to reduce visual clutter.
- Hero and section spacing were tightened to reduce wasted vertical space.
- The comic viewport now uses a capped height and tighter canvas sizing so the page feels more compact while keeping the comic readable on screen.
- Reader controls and mode toggles are aligned into a single compact toolbar.
