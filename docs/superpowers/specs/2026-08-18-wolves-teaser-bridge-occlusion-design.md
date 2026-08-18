# Wolves teaser bridge occlusion design

## Problem

At the authored picture cutoff (88.2 seconds), the teaser mounts the March wallpaper bridge but applies the bridge fade to the entire `.wt-backdrop`. The backdrop is therefore transparent while the wallpaper rises from black, exposing later frames from the underlying YouTube video. The dark Lanternfish/lantern shot is not part of Trailer 1 and must never appear.

## Approved behavior

The Trailer 1 composition remains three pictures:

1. YouTube picture from 0 through 88.2 seconds.
2. An opaque black-backed March wallpaper bridge from 88.2 through 102.2 seconds.
3. The March night wallpaper end card from 102.2 through 110.02 seconds.

At 88.2 seconds, the backdrop becomes fully opaque black immediately. The wallpaper composition fades over that backing. The YouTube player may continue supplying audio and clock state underneath, but none of its pixels may be visible after the picture cutoff.

## Implementation

Keep `.wt-backdrop` opaque. Place both wallpaper images in a group that retains the existing `bridge.opacity`; inside that group, keep the day image opaque and apply `bridge.nightMix` to the night image. This preserves the authored day-to-night blend and lets the whole wallpaper group fade to black without exposing either the day image or the YouTube picture. During the end card, the group and night image remain fully opaque.

Do not change the authored timings, transport, player lifecycle, fullscreen behavior, layout, or copy.

## Testing

Add a component regression test that seeks through the DEV teaser harness and verifies:

- 88.19 seconds has no bridge backdrop;
- 88.2 seconds has an opaque backdrop with a transparent wallpaper group;
- the wallpaper group rises during the opening bridge leg while the backing remains opaque;
- the night image follows the authored turn inside the fully visible group;
- the group fades to black with the night image fully covering the day image.

Run the focused Vitest tests, then inspect the boundary in Chromium at desktop and mobile viewport sizes. The browser check must measure computed opacity and capture page/runtime errors.
