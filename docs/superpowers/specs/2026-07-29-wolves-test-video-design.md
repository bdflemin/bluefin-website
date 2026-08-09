# Wolves Test Video Edit

## Goal

Create a new test video from the supplied Wolves source video and the supplied
Rammstein “Deutschland” instrumental.

## Edit

- Source video: `recordings/wolves-first-song-1440p.mp4`
- Instrumental source:
  `/var/home/jorge/Downloads/RAMMSTEIN - Deutschland (Instrumental) [WqaiHivKlsE].webm`
- Remove all original source audio.
- Extract and use the instrumental audio track.
- Trim the source video from `00:52.000` through `06:06.908`.
- Align instrumental time `00:48.000` with source-video time `01:40.000`.
- Preserve the source video’s 2560x1440 resolution and 25 fps.
- Write a new output file under `recordings/`; do not modify website code or
  existing media.

## Output and validation

The output should contain one video stream and the replacement instrumental
audio, with a duration of approximately 5:14.908. Verify stream metadata and
the requested timestamp relationship with `ffprobe`.
