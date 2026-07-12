# Specification: Experimental Timeline-Driven Slideshow for Track 0

Date: 2026-07-12
Status: Approved
Scope: Repository

This document specifies the technical design for introducing an experimental, timeline-driven slideshow for the first song ("7 Days to the Wolves" by Nightwish, Track 0) in the Wolves fullscreen theater display. The goal is to create a non-repeating, beat-locked visual progression that starts with showcase/product artwork and transitions smoothly into people and community-focused photography, matching the tempo changes of the music.

---

## 1. Core Requirements

### 1.1 Dual-Mode Operation & Reversibility
To ensure the experiment is fully and safely reversible, the new slideshow engine is guarded by a boolean flag:
- `isExperimental`: Set to `true` to enable this restructured slideshow. Set to `false` to immediately revert to the original "Alpha 1" static PDF/wallpaper page behavior.

### 1.2 Non-Repeating, Unique Image Sequence
- Each image/photo in the slideshow is displayed exactly once.
- The total length of the song is divided into three distinct pacing phases based on the song's playhead:
  1. **Phase 1 (0s to 201s):** Standard pacing. Focuses on local showcase/product wallpapers. Day/night wallpapers are interspersed.
  2. **Phase 2 (201s to 257s):** Fast pacing. Focuses on local people and community photos to transition into the "hero" theme.
  3. **Phase 3 (257s to end of song):** Hyper pacing. Populated with unique CNCF Flickr photos to maintain accelerated dramatic momentum without any duplicates or repetition.

### 1.3 Special Day/Night Fader (Light to Dark)
- Day/night wallpapers (type `daynight`) are assigned double the active pacing duration of their phase (e.g., 20 seconds during Phase 1).
- Over the course of their display window, the image transitions smoothly from Day to Night.
- The opacity of the night overlay is calculated as:
  $$\text{opacity} = \frac{\text{currentTime} - \text{startTime}}{\text{duration}}$$
  This guarantees a unidirectional fade from light (Day) to dark (Night). It never fades in reverse.

---

## 2. Technical Architecture & Calculations

### 2.1 Precomputing the Timeline
We will construct an array of `SlideTimelineItem` objects:
```typescript
interface SlideTimelineItem {
  id: string
  isLocal: boolean
  path: string
  title: string
  type: 'single' | 'daynight'
  dayName?: string
  nightName?: string
  startTime: number
  duration: number
  endTime: number
}
```
The timeline is built chronologically by pushing unique slides from the filtered lists (`localShowcase`, `localPeople`, `remotePeople`) and tracking `currentTime`:
- From `0` to `201` seconds, push showcase and single/daynight wallpapers. Each `single` takes 10 seconds. Each `daynight` takes 20 seconds.
- From `201` to `257` seconds, push people photos. Each takes 2 seconds.
- From `257` seconds to `423` seconds (end of song), push unique CNCF Flickr photos. Each takes 1 second.
- This deterministic timeline is generated once when the first song begins, ensuring no runtime drift, repeats, or out-of-order slides.

### 2.2 Active Slide Selection
During playback, the active slide is resolved reactively:
- Find the slide in the precomputed array where `playlistCurrentTime` is between `startTime` (inclusive) and `endTime` (exclusive).
- If no slide is active (e.g., after the song ends), fallback to the last slide in the precomputed array.

---

## 3. Verification & Testing

- **Lint Compliance:** Ensure no emojis are used in the specification, implementation code, comments, or tests.
- **Type Safety:** All timeline and precomputation functions must be fully type-safe.
- **Vitest Suites:** Add tests in `src/tests/` to verify:
  - Correct initialization of the timeline.
  - Double duration for day/night slides.
  - Opacity transition calculation is linear and correct.
  - No duplicate images exist across the timeline.
