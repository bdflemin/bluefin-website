# Wolves Meet Your Teammates CTA

## Goal

Make the primary `MEET YOUR TEAMMATES` control on the Wolves lobby visibly
actionable at rest.

## Scope

- Update the primary lobby CTA and its fixed waypoint counterpart in
  `src/components/wolves/cinematic/CinematicLobby.vue`.
- Use a persistent gold-filled button with dark, high-contrast text.
- Preserve the existing label, click behavior, placement, responsive sizing,
  hover treatment, and keyboard-focus treatment.
- Do not alter markup, navigation, animation, or the Director's Cut control.

## Verification

- The primary CTA and waypoint CTA are visibly filled before hover.
- Both controls retain a clear keyboard focus state.
- The lobby remains usable at desktop and mobile widths.
