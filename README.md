# projectbluefin/website

The marketing website for [Project Bluefin](https://projectbluefin.io) — a collection of landing pages built with [Vite](https://vitejs.dev/) and [Vue 3](https://vuejs.org/).

## What's in this repo

| Directory | Live at | Purpose |
|-----------|---------|---------|
| root (`index.html`) | [projectbluefin.io](https://projectbluefin.io) | Main Bluefin landing page |
| `dakota/` | [projectbluefin.io/dakota](https://projectbluefin.io/dakota) | Dakota variant landing page |
| `knuckle/` | [projectbluefin.io/knuckle](https://projectbluefin.io/knuckle) | Knuckle bare-metal installer page |
| `bluespeed/` | unlisted / `noindex` | Bluespeed sub-app; hidden from nav and search engines |

For user-facing documentation, see [docs.projectbluefin.io](https://docs.projectbluefin.io).

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 24 or higher (current LTS)
- [npm](https://www.npmjs.com/)
- Optional: [just](https://github.com/casey/just) (`brew install just` or `cargo install just`)

### Setup

```bash
git clone https://github.com/projectbluefin/website
cd website
npm install
```

### Dev server

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm run preview    # Preview production build locally
```

With `just`:

```bash
just build    # Build for production
just serve    # Preview the production build locally
```

### Linting and formatting

Uses [`@antfu/eslint-config`](https://github.com/antfu/eslint-config) for both linting and formatting. Run before every PR:

```bash
npm run lint        # Check for lint errors
npm run lint:fix    # Auto-fix lint errors
npm run typecheck   # Type-check with vue-tsc
```

## Wolves soundtrack metadata

The Wolves soundtrack metadata is refreshed locally with:

```bash
npm run update:wolves-playlist
```

This workflow requires [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) to read the public YouTube playlist, writes the checked-in manifest to `public/wolves-playlist.json`, and stores the downloaded artwork under local `public/wolves-artwork/` assets. The site serves those checked-in files at build time, so no YouTube Data API key is exposed to browsers or required in the frontend bundle.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contributor guide — including the PR workflow, i18n instructions, and linting requirements.
