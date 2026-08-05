# Wolves Unified Status Timing Design

## Goal

Show every non-locked Track 0 status line sequentially and evenly after the
fixed thesis locks, while preserving the existing finale timing.

## Scope

- Keep all five `TRACK_ZERO_LORE_PLAN` sections as the editing surface.
- Preserve every non-locked entry in source order, including duplicate text.
- Preserve all fixed status windows through `365s`.
- Rotate the combined non-locked entries from `365s` up to `408s`.
- Preserve `Bazzite Mk6 Units: Prepare for Titanfall` from `408s` through the
  existing video handoff.

## Scheduling

The runtime will flatten all non-locked entries from the five plan sections
into one ordered list. The list will not deduplicate entries. The scheduler
will divide the `43s` window from `365s` to `408s` evenly across the current
52 entries, yielding approximately `0.827s` per entry.

Locked entries remain excluded from this rotation and continue to use
`TRACK_ZERO_LOCKED_STATUSES` at their current timestamps.

## Validation

Update focused Track 0 status tests to assert that:

- the flattened sequence retains source order and duplicate entries;
- every non-locked entry appears once between `365s` and `408s`;
- all locked thesis and finale labels retain their exact windows.
