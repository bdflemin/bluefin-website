# Wolves Test Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a new Wolves test video with the supplied instrumental replacing the source audio and aligned to the requested timestamps.

**Architecture:** Use `ffmpeg` to trim the existing source video, discard its audio, extract the Opus audio stream from the supplied WebM, and mux the replacement audio into a new MP4 under `recordings/`. Preserve the source video stream without re-encoding.

**Tech Stack:** `ffmpeg`, `ffprobe`, VP9 video, Opus audio, MP4 container.

## Global Constraints

- Remove all original source audio.
- Trim source video from `00:52.000` through `06:06.908`.
- Align instrumental time `00:48.000` with source-video time `01:40.000`.
- Preserve 2560x1440 resolution and 25 fps.
- Do not modify website code or existing media.

---

### Task 1: Generate the replacement-audio test video

**Files:**
- Read: `recordings/wolves-first-song-1440p.mp4`
- Read: `/var/home/jorge/Downloads/RAMMSTEIN - Deutschland (Instrumental) [WqaiHivKlsE].webm`
- Create: `recordings/wolves-deutschland-test.mp4`

**Interfaces:**
- Consumes the source video and local instrumental media paths above.
- Produces a new MP4 with one video stream and one replacement audio stream.

- [ ] **Step 1: Extract and mux the edit**

Run:

```bash
ffmpeg -y \
  -ss 52.000 -t 314.908 \
  -i recordings/wolves-first-song-1440p.mp4 \
  -i "/var/home/jorge/Downloads/RAMMSTEIN - Deutschland (Instrumental) [WqaiHivKlsE].webm" \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k \
  -shortest recordings/wolves-deutschland-test.mp4
```

- [ ] **Step 2: Verify output streams and duration**

Run:

```bash
ffprobe -v error \
  -show_entries format=duration:stream=index,codec_type,codec_name,width,height,r_frame_rate \
  -of default=noprint_wrappers=1 \
  recordings/wolves-deutschland-test.mp4
```

Expected: approximately 314.908 seconds, 2560x1440 video at 25 fps, no source
audio stream, and one replacement audio stream.

- [ ] **Step 3: Verify the timestamp mapping**

The output starts at source-video time 00:52.000, so output time 00:48.000
corresponds to source-video time 01:40.000. Confirm the trim and duration from
the `ffprobe` result, then run:

```bash
git diff --check
git status --short
```

Expected: only the new output media is added by this task; pre-existing dirty
files remain untouched.

- [ ] **Step 4: Commit the generated video**

```bash
git add recordings/wolves-deutschland-test.mp4
git commit -m "media: add Wolves Deutschland test video" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
