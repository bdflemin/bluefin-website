# Documentation map

**Agents edit content. Agents never edit design.**

## Start

- `../AGENTS.md`: repository rules and boundaries.
- `SKILL.md`: task→skill router; choose one lazy-loaded workflow.
- `reference/content-map.md`: locate production content.
- `reference/production-entrypoints.md`: locate mounted applications.

## Two different products

This repository ships a **website** at `/` and a **presentation** at
`/wolves/`. They have different rules. The presentation is performed to a live
audience in theater seats, is read from a distance, is paced by music, and
cannot be interacted with. See `../AGENTS.md` under "`/wolves/` is a
presentation" and `reference/wolves-runtime.md`.

## Architecture

- `architecture/application-map.md`: production entry points and component areas.
- `architecture/runtime-data-flow.md`: state, media, and generated-data flow.

## Skills

Each skill lives in its own directory and starts at `SKILL.md`. Load supporting
references only when the selected skill links to them.

## References

Reference files state current production facts. Skills define procedures. Keep
those roles separate and update the canonical owner when source code changes.
