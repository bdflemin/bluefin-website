# Wolves Slow-Motion Edit

## Goal

Create a shorter dramatic edit from the exact YouTube-source recording and
the existing instrumental replacement.

## Edit

- Source video:
  `recordings/Zavala Gives a Speech The Witness Raid Fight Cinematic Destiny 2 [j1_sMbw-DEg].webm`
- Instrumental source:
  `/var/home/jorge/Downloads/RAMMSTEIN - Deutschland (Instrumental) [WqaiHivKlsE].webm`
- Remove the source video’s first `50.700` seconds, which contain no music.
- Start the output with the instrumental at `00:00`; do not time-stretch or
  otherwise alter the music.
- Slow the flash-to-impact segment, approximately source `100.700` through
  `103.700`, to `50%` speed.
- Resume normal video speed after the impact.
- Preserve the source’s natural fade to black.
- Remove all original source audio.
- Create `recordings/wolves-deutschland-slow-test.mp4`; do not overwrite the
  existing corrected output.

## Timing and validation

After trimming, source time `100.700` becomes output time `50.000`, so the
music smash remains aligned with the electricity flash. The slowed segment adds
approximately three seconds to the output. Verify the output has one video
stream, one replacement audio stream, no original audio, and a duration of
approximately `74.9` seconds.
