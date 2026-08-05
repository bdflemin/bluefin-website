# Wolves Destiny Title Card Design

## Goal

Make the Destiny title card easier to scan and less crowded without changing
its authored timing, assets, links, or wording beyond the supplied status-line
replacement.

## Composition

The supplied phrase appears only in the top status plate. The title card has no
duplicate headline: the dinosaur artwork and MakeMeAComic QR code form one
horizontally centered composition, with the dinosaur on the left and the QR on
the right. The QR card remains the larger right-hand anchor so the code is
practical to scan. At the supported desktop viewport it has a 32rem code frame
and a rendered code width of at least 300px.

The Amber Graner quote is removed from its panel and centered along the bottom
of the screen above the persistent media widget. Its enlarged mono treatment,
high contrast, and deep shadow are intended for theater-distance reading. The
quote does not overlap the QR card, dinosaur artwork, or widget.

## Content and Runtime Constraints

- Replace the introductory status line exactly with: `a project to bring their stories to life`.
- Preserve the MakeMeAComic URL, QR asset, accessible label and alt text.
- Preserve the Amber Graner quote and attribution exactly.
- Preserve the title-card cue, asset rotation, and player-clock timing.
- Do not add new assets, prose, controls, or navigation.

## Verification

The focused Vue test verifies both the QR and quote render only in the
title-card cue. The deterministic Wolves browser test verifies desktop bounds,
the centered artwork/QR ordering, a 300px QR minimum, and the quote's
freeform bottom-band placement.
