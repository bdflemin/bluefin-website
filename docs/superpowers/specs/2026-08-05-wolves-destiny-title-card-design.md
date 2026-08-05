# Wolves Destiny Title Card Design

## Goal

Make the Destiny title card easier to scan and less crowded without changing
its authored timing, assets, links, or wording beyond the supplied status-line
replacement.

## Composition

The title remains in its existing top band. The dinosaur artwork occupies the
left visual field and the MakeMeAComic QR code occupies the right visual field;
neither is centered in the title-card viewport. The QR card becomes the larger
right-hand anchor so the code remains practical to scan. At the supported
desktop viewport it has a 32rem code frame and a rendered code width of at
least 300px.

The Amber Graner quote is removed from its panel. It becomes a freeform,
left-aligned lower-third attribution above the persistent media widget, using
the existing mono typeface, contrast, and shadow treatment. The quote does not
overlap the QR card, dinosaur artwork, or widget at desktop or narrow mobile
sizes.

## Content and Runtime Constraints

- Replace the introductory status line exactly with: `a project to bring their stories to life`.
- Preserve the MakeMeAComic URL, QR asset, accessible label and alt text.
- Preserve the Amber Graner quote and attribution exactly.
- Preserve the title-card cue, asset rotation, and player-clock timing.
- Do not add new assets, prose, controls, or navigation.

## Verification

The focused Vue test verifies both the QR and quote render only in the
title-card cue. The deterministic Wolves browser test verifies desktop bounds,
the asymmetric artwork/QR ordering, a 300px QR minimum, and the quote's
freeform lower-third placement.
