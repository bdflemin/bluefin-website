# Wolves Incoming Signal Sequence

## Purpose

Make the Universal Blue thesis text editable as a plain one-message-per-line
source and cycle it after the immersive HUD becomes `Incoming Signal:
Universal Blue`.

## Source

- Add `src/data/wolves-incoming-signal.txt`.
- Each non-empty line is one message, in presentation order.
- The file is the sole editable message source. Its initial contents preserve
  the approved thesis phrases currently embedded in the thesis sequence.

## Presentation

- The existing Track 0 thesis window remains 5:45 through 7:05.
- At 5:45, the HUD changes to `Incoming Signal: Universal Blue` before the
  cycling sequence begins.
- The active line advances every eight soundtrack beats. The selection is
  deterministic and wraps to the first line after the final line.
- Existing day-pulse, corruption, and legend modes remain intact. During the
  active thesis window, their displayed text is supplied by the editable
  sequence.

## Data Flow

- The thesis data module imports and parses the text file into an ordered,
  immutable list of non-empty lines.
- `WolvesApp` derives Track 0's beat position from current playback time and
  its BPM, then passes it to the thesis-state resolver.
- The resolver chooses `floor(beat / 8) % messageCount` while the thesis is
  active.

## Empty Source

If the file has no non-empty lines, the thesis overlay text is blank. The HUD
and existing presentation modes remain active; the application does not create
a substitute message.

## Validation

Tests cover parsing and ordering, every-eight-beat advancement, wrapping, the
existing time window and HUD change, and preservation of the day pulse,
corruption, and legend modes. A component-level test covers forwarding the
playback beat to the thesis resolver.
