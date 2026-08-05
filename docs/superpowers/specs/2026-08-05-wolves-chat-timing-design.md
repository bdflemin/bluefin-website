# Wolves Chat Timing

## Goal

Keep chat conversations readable when the Track 0 music and slides accelerate.

## Design

- Preserve the Golden Era/Sarah chat's existing authored cadence.
- When a chatlog becomes active, keep it visible until its typewriter
  completes, even if the narrative timeline advances.
- Once it completes, immediately show the latest scheduled narrative record;
  do not replay records that elapsed while the chat was visible.
- Leave quote, source, dossier, and other non-chat records timeline-driven.

## Verification

- Every chat typewrites at its normal cadence rather than being compressed to
  fit a short slot.
- A later chat remains mounted while the timeline moves through short slots.
- Completion advances to the current timeline record, not an obsolete one.
- Sarah's current timing remains unchanged.
