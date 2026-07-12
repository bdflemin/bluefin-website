# Development

This website is built with [Vite](https://vitejs.dev/) and [Vue](https://vuejs.org/). npm is the primary package manager; `just` is optional to simplify common commands.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- Optional: [just](https://github.com/casey/just) (for simplified commands)

### Getting Started

First, install the dependencies:

```bash
npm install --include=dev
```

Then, you can use `just` to run the common commands:

-   `just build`: Build for production
-   `just serve`: Preview the production build locally

<details>
<summary>Don't have `just`? Use npm</summary>

-   `npm run dev`: Run the development server
-   `npm run build`: Build for production
-   `npm run preview`: Preview the production build locally
-   `npm run lint`: Lint the project
-   `npm run lint:fix`: Lint and fix all possible errors
-   `npm run typecheck`: Typechecks the project with `vue-tsc`

### Formatting

The project utilizes the [@antfu/eslint-config](https://github.com/antfu/eslint-config) to standardize formatting. This means that we solely utilize ESLint to lint and format the project.

Since the `@antfu/eslint-config` doesn't support formatting for CSS files, we have to utilize an external formatter (in this case prettier) under `eslint-plugin-format` to actually format the files.

Please ensure that you format your code before submitting a PR!

</details>

## Wolves soundtrack metadata

Run `npm run update:wolves-playlist` after installing `yt-dlp` to refresh the checked-in `public/wolves-playlist.json` and local track artwork for playlist `PLA78oiE-RGAE`. The site consumes those static assets at runtime and does not expose a YouTube Data API key.

## Contributing

If you want to add another language to this website, add a json file to [src/locales](src/locales) with your language file named following [Navigator.language](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language) and it should be good to go!

Your new language will follow the schema from `enUS`, so make sure the fields and everything are the same. Some fields may contain markdown support or HTML support, that really depends and there is just no way I can document this here.
