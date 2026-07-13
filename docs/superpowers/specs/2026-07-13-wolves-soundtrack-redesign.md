# Wolves Soundtrack Widget Redesign

## Goal
Fix clipping issues, crude controls, and missing progress tracking in the `WolvesSoundtrack.vue` component on the Wolves page. The new design should be sleeker, standardizing media controls while preserving the existing theme (dark/ocean colors, monospace fonts).

## Architecture & Data Flow

The component (`src/components/wolves/WolvesSoundtrack.vue`) wraps the YouTube IFrame API. The existing player logic, state machine (`status: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error'`), and interval-based progress events already exist and function correctly.

The redesign is entirely structural (HTML) and stylistic (SCSS), with minor logic additions to support seeking if desired.

## Components & Layout

The redesign uses a "Compact & Unified" approach (Option A).

### Desktop Sidebar Panel (`.soundtrack-panel-main`)

**Grid Structure:**
Changes from a 3-column grid (`auto 1fr auto`) to a modified flow where track info and controls sit inline, and the announcement text is moved below.

1.  **Artwork (`.soundtrack-artwork-shell`):** Remains on the left, maintaining its glow effect when playing.
2.  **Track Info & Progress:**
    *   Label, Title, and Artist remain. Title uses `truncate` to prevent layout breakage.
    *   **New:** Progress Bar container. Flex row with current time (left), progress track (center, flex-1), and total time (right).
3.  **Controls Group (`.soundtrack-controls-group`):**
    *   Moved to standard media player icons (SVG paths) instead of text strings ("|&lt;", "Start Soundtrack", "&gt;|").
    *   Maintains the existing Bluefin button styles (`.soundtrack-action`, `.soundtrack-skip-btn` colors/borders).
4.  **Status/Announcement Text (`.soundtrack-status`):**
    *   Moved out of the main grid flow to a full-width block at the bottom of the panel, above the lyrics section, separated by a subtle border (`border-t border-[#4285f4]/20`).

### Mobile Bottom Bar (`.soundtrack-mobile-bar`)

1.  **Layout:** Keeps Artwork, Info, and Play/Pause button in a single row.
2.  **Controls:** Replace the text action button with the SVG Play/Pause icon button.
3.  **New Progress Indicator:** A thin, 2px-4px absolute positioned progress bar spanning the top edge of the mobile bar container (`absolute top-0 left-0 right-0`).

## Logic Updates

1.  **Time Formatting:** Need a small utility function to format seconds into `M:SS` for the progress labels.
2.  **Seek (Optional but Recommended):** The progress bar track should be clickable. Calculate click X position relative to width to find the percentage, then call `player?.seekTo(duration * percentage, true)`. The YouTube API is already typed and available in the component.
3.  **Event Binding:** Ensure the existing `@click` handlers for `prevTrack`, `handlePrimaryAction`, and `nextTrack` are bound to the new SVG buttons.

## Dependencies

*   `src/components/wolves/WolvesSoundtrack.vue`: Target file for HTML/SCSS updates.
*   No new dependencies required. Standard SVG icons will be inline.

## Testing

*   Verify layout on desktop sidebar (min-width: 900px).
*   Verify layout on mobile bottom bar (max-width: 767px).
*   Test with long track titles to ensure `truncate` works without expanding the container.
*   Verify the progress bar updates smoothly using the existing `progressTimer`.
