# Wolves Slow-Motion Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a shorter Wolves edit that starts when the instrumental begins and slows the flash-to-impact moment for dramatic effect.

**Architecture:** Use `ffmpeg` filter graphs to trim the first 50.700 seconds from the exact YouTube-source video, time-remap the source flash-to-impact interval to 50% speed, and mux the unmodified instrumental from time zero. Preserve the natural fade to black and write a separate output file.

**Tech Stack:** `ffmpeg`, `ffprobe`, AV1 video, Opus source audio, AAC output audio, MP4 container.

## Global Constraints

- Remove the source video’s first `50.700` seconds, which contain no music.
- Start the output with the instrumental at `00:00`; do not time-stretch or otherwise alter the music.
- Slow the flash-to-impact segment, approximately source `100.700` through `103.700`, to `50%` speed.
- Resume normal video speed after the impact.
- Preserve the source’s natural fade to black.
- Remove all original source audio.
- Create `recordings/wolves-deutschland-slow-test.mp4`; do not overwrite the existing corrected output.

---

### Task 1: Generate and validate the slow-motion edit

**Files:**
- Read: `recordings/Zavala Gives a Speech The Witness Raid Fight Cinematic Destiny 2 [j1_sMbw-DEg].webm`
- Read: `/var/home/jorge/Downloads/RAMMSTEIN - Deutschland (Instrumental) [WqaiHivKlsE].webm`
- Create: `recordings/wolves-deutschland-slow-test.mp4`

**Interfaces:**
- Consumes the exact source video and instrumental paths above.
- Produces a separate MP4 with one slowed/remapped video stream and one unmodified replacement audio stream.

- [ ] **Step 1: Trim the non-music intro and build the video segments**

Use source-relative segments:

```bash
ffmpeg -y \
  -i 'recordings/Zavala Gives a Speech The Witness Raid Fight Cinematic Destiny 2 [j1_sMbw-DEg].webm' \
  -i "/var/home/jorge/Downloads/RAMMSTEIN - Deutschland (Instrumental) [WqaiHivKlsE].webm" \
  -filter_complex "
    [0:v]trim=start=50.700:end=100.700,setpts=PTS-STARTPTS[pre];
    [0:v]trim=start=100.700:end=103.700,setpts=PTS-STARTPTS,setpts=2*PTS[slow];
    [0:v]trim=start=103.700,setpts=PTS-STARTPTS[post];
    [pre][slow][post]concat=n=3:v=1:a=0,setpts=PTS-STARTPTS[v];
    [1:a]apad[a]
  " \
  -map "[v]" -map "[a]" \
  -c:v libsvtav1 -preset 8 -crf 30 \
  -c:a aac -b:a 192k \
  -shortest recordings/wolves-deutschland-slow-test.mp4
```

If `libsvtav1` is unavailable, use the installed AV1 encoder reported by
`ffmpeg -encoders`; do not substitute the source audio or alter the music
timeline.

- [ ] **Step 2: Verify output metadata**

Run:

```bash
ffprobe -v error \
  -show_entries format=duration:stream=index,codec_type,codec_name,width,height,r_frame_rate,channels \
  -of default=noprint_wrappers=1 \
  recordings/wolves-deutschland-slow-test.mp4
```

Expected: approximately 74.9 seconds, one video stream, one AAC audio stream,
1920x1080 video at 60 fps, and no original source audio.

- [ ] **Step 3: Verify timing and fade preservation**

Confirm that source time 100.700 maps to output time 50.000, the slowed segment
ends at approximately output time 56.000, and the post-impact section continues
at normal speed through the source fade to black. Run:

```bash
git diff --check
git status --short
```

Expected: only the new output and the already-present session artifacts appear;
unrelated dirty website files remain untouched.

- [ ] **Step 4: Commit the generated media**

```bash
git add recordings/wolves-deutschland-slow-test.mp4
git commit -m "media: add Wolves slow-motion test edit" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
