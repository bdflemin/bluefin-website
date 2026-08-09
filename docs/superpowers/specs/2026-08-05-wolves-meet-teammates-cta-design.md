# Wolves Lobby Draft-State Controls

## Goal

Make the primary `MEET YOUR TEAMMATES` control on the Wolves lobby visibly
actionable at rest while making the donation and nomination areas clearly
unavailable in this draft.

## Scope

- Update the primary lobby CTA and its fixed waypoint counterpart in
  `src/components/wolves/cinematic/CinematicLobby.vue`.
- Use a persistent gold-filled button with dark, high-contrast text.
- Preserve the existing label, click behavior, placement, responsive sizing,
  hover treatment, and keyboard-focus treatment.
- Do not alter markup, navigation, animation, or the Director's Cut control.
- Update the donation controls in
  `src/components/wolves/WolvesCharacterGallery.vue` to be non-interactive
  `COMING SOON` controls with disabled semantics and no destination.
- Replace the two QR-code cards with two non-interactive character-card
  placeholders: an unnamed future guardian and `NOMINATE A MAINTAINER`.
- Mark the nomination placeholder `COMING SOON`; it must not submit anywhere
  until a destination is supplied.
- Center the constrained maintainer-support paragraphs in the gallery, including
  their text, without changing their width or copy.
- Use a single centered treatment for constrained editorial and support copy in
  the gallery. Preserve left alignment for card and quote content, where it
  supports scanning and reading.
- Use the command CTA treatment for `MEET YOUR TEAMMATES`: add a prominent
  play/start glyph before the existing label without changing its behavior.
- Place `Click to begin the Wolves Experience` in small text above each entry
  control and use `Meet your Teammates` as the shared button label.

## Verification

- The primary CTA and waypoint CTA are visibly filled before hover.
- Both controls retain a clear keyboard focus state.
- Donation and nomination controls do not navigate away from the draft.
- The QR-code images and their external destinations are absent.
- Both replacement character placeholders make their unavailable state clear.
- The constrained maintainer-support paragraphs are centered as text blocks.
- Editorial support copy shares one alignment rule; cards and quote content
  retain their intentional left alignment.
- The entry CTA's play/start glyph is visible at rest and does not replace the
  accessible button label.
- Both entry controls pair the small instruction with the supplied button
  label.
- The lobby remains usable at desktop and mobile widths.
