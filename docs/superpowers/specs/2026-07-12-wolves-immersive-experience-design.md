# Specification: Immersive "Seven Days to the Wolves" Fullscreen Experience

Date: 2026-07-12
Status: Draft
Scope: Repository

This document specifies the technical design for a dedicated, immersive, theater-style fullscreen experience for "Seven Days to the Wolves" (projectbluefin.io/wolves). The experience highlights the comic slideshow, synchronizes monthly wallpapers with high-fidelity crossfades, embeds a HUD for music controls, and introduces rotating mascot avatars in a dedicated console frame.

---

## 1. User Experience and Entrance Flow

### 1.1 Entrance Button
* **Location:** Rendered immediately below the comic book description within the hero section in `WolvesApp.vue`.
* **Visual style:** High-tech, dark terminal CTA button styled with Tailwind utility classes. No emojis are used.
* **Label:** `[ EXPERIENCE SEVEN DAYS TO THE WOLVES ]`
* **Sub-label:** `RECOMMENDED: HEADPHONES ON // VOLUME UP` (monospaced, dim gray)
* **Behavior:** 
  1. Sets Vue state `isImmersive = true`.
  2. Automatically starts soundtrack playback (equivalent to clicking "Start Soundtrack" if not already playing).
  3. Triggers native HTML5 browser fullscreen on the document's root element (`document.documentElement.requestFullscreen()`).

### 1.2 The HUD Layout (Active Immersive Experience)
When `isImmersive = true`:
* The standard top navigation bar (`TopNavbar`) is hidden.
* The normal page sections (Hero, support cards, Discord widget, QR codes) are hidden.
* The viewport transitions to a dark, high-contrast, edge-to-edge layout filling `100vw` and `100vh` exactly.
* The layout comprises three main sections:
  1. **Top Status Bar:** Displays a digital readout `[ COGNITIVE_CHANNEL_SECURED // SEVEN DAYS TO THE WOLVES ]` and an `[ EXIT EXPERIENCE ]` button.
  2. **Middle Widescreen Split (2fr 1fr):**
     * **Left Area (66%):** Centers the `WolvesComicReader` slideshow, scaled to maximize vertical space. Controls are seamlessly placed within the reader frame.
     * **Right Area (33%):** Houses the scrollable `WolvesLoreColumn` display for decrypted story transmissions.
  3. **Bottom Controls HUD:** Houses soundtrack play/pause, next/prev track, a larger progress/timeline bar, and the **Tactical Mascot Console**.

---

## 2. Core Functional Requirements

### 2.1 Double-Buffered Monthly Wallpaper Crossfader
To fix the jarring snap between monthly wallpapers during playlist progression:
* We will implement double-buffered background layer states in `WolvesApp.vue`:
  * `activeWallpaper` (opacity transition 1.5s to 1)
  * `previousWallpaper` (opacity transition 1.5s to 0)
* Dynamic calculations will update background image layers smoothly without blank flashes when transitioning between months (`currentPairIndex` change).

### 2.2 Tactical Mascot Console
* **Mascot assets:** Sourced from `LangLandingBluefinImageURLs` inside `src/content.ts`.
* **Removal filter:** The specific aurora-themed wallpapers requested (`aurora-xe_sunset.webp`, `aurora-xe_space_needle.webp`, `aurora-xe_foothills.webp`, `aurora-xe_clouds.webp`, `aurora-jonatan-pie-aurora.webp`) will be completely removed from any slideshow or asset loops.
* **Visual layout:** Sits inside a circular HUD frame in the bottom left console area.
* **Behavior:** Every 6 seconds, the console crossfades to a random mascot image from the filtered list, giving a live telemetry-feed feel to the interface.

---

## 3. Technical Architecture & State Synchronization

### 3.1 State Representation
We will introduce a reactive state block inside `WolvesApp.vue`:
```typescript
const isImmersive = ref(false)
```

To sync native browser fullscreen (e.g., when a user exits via `ESC` key):
```typescript
function handleFullscreenChange() {
  isImmersive.value = !!document.fullscreenElement
}
```

### 3.2 Viewport Isolation CSS Classes
When `isImmersive` is true, a class `.immersive-experience-active` is appended to the root container.
```scss
.wolves-teaser-page.immersive-experience-active {
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  
  // Hide non-immersive content
  .wolves-hero,
  #wolves-support,
  .wolves-page-qr,
  footer,
  header:not(.immersive-hud-header) {
    display: none !important;
  }
}
```

---

## 4. Verification & Linting
* We will execute local validation using `npm run typecheck`, `npm run lint`, and `npm run build` to guarantee no compilation issues occur.
* We will ensure all code modifications preserve the "no emoji" directive across comments, variables, and documentation.
