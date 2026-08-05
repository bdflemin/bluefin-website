# Wolves Unified Status Timing Design

## Goal

Show every non-locked pre-finale Track 0 status line sequentially and evenly
through the smooth front of the video, while preserving the fixed locks and
the fast finale timing.

## Scope

- Keep all five `TRACK_ZERO_LORE_PLAN` sections as the editing surface.
- Preserve every non-locked pre-finale entry in source order, including
  duplicate text.
- Preserve every fixed status window.
- Rotate the pre-finale entries from `41.982s` through `345s`, pausing the
  sequence while a fixed status is active.
- Keep the existing fast finale section rotation from `365s` through `408s`.
- Preserve `Bazzite Mk6 Units: Prepare for Titanfall` from `408s` through the
  existing video handoff.

## Scheduling

The runtime will flatten the first four plan sections into one ordered,
duplicate-preserving front queue. Its available player-clock time excludes
the fixed status windows, so the queue pauses during those locks and resumes
without losing its even cadence. The finale's existing section-specific
rotation remains fast and separate.

Locked entries remain excluded from this rotation and continue to use
`TRACK_ZERO_LOCKED_STATUSES` at their current timestamps.

## Validation

Update focused Track 0 status tests to assert that:

- the front queue retains source order and duplicate entries;
- the front queue pauses and resumes around fixed status windows;
- the finale keeps its existing rapid section-specific rotation;
- all locked thesis and finale labels retain their exact windows.
