---
name: site-maintenance
version: "1.0"
last_updated: 2026-07-17
tags: [content, i18n, assets, data]
description: Use when changing routine website text, links, approved images, downloads, version data, Dakota, Bluespeed, or Knuckle.
metadata:
  type: procedure
---

# Site Maintenance

## When to Use

- Routine non-Wolves content or approved asset changes.
- Download selection, ISO naming, or runtime version data.
- Dakota, Bluespeed, or Knuckle maintenance.

## When NOT to Use

- Any layout, component, typography, spacing, animation, or style change. Load `design-authority.md`.
- Wolves content. Load `wolves-content-maintenance.md`.
- Creative or editorial prose. Load `editorial-policy.md`.

## Core Process

1. Find the real source before editing. Do not guess from `AGENTS.md`.
2. Keep content requests in content, locale, data, or approved asset files.
3. Edit the English source used by the page. Translation parity never blocks shipping; dedicated translation work follows `TRANSLATION-GUIDE.md`.
4. Use exact user-supplied editorial text.
5. Compress images for mobile and follow existing formats and naming.
6. Re-derive download names and data behavior from source. Public runtime fetches must use `import.meta.env.BASE_URL`.
7. Preserve `noindex` and unlisted status for Dakota, Bluespeed, and Knuckle. Do not add them to navigation or sitemaps without explicit approval.
8. Load `build-verify-deploy.md` before reporting completion.

## Project Facts

- Vue i18n runs in legacy mode. Use the existing `useLocale` helper; never change locale assignment to `.locale.value`.
- Tests may rewrite `public/dakota-versions.json`. Leave unrelated changes unstaged.
- `src/components/ImageChooser.vue` owns the main download flow. Verify ISO naming there rather than copying stale documentation.

## Human Gate

Stop before changing `.vue`, `.scss`, Tailwind classes, `src/style/**`, navigation prominence, or page discoverability unless the user explicitly approved visual work.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The content fits better with a small style tweak." | Content work grants no design authority. |
| "Every locale must be updated before shipping." | Translation parity never blocks shipping. |

## Red Flags

- A content task changes components or styles.
- An unlisted page is added to navigation.
- Internal download facts are copied without checking source.

## Verification

- [ ] Diff contains only requested content, data, or approved assets.
- [ ] Locale keys and placeholders remain intact.
- [ ] No design file changed without approval.
- [ ] Internal facts were checked against source.
- [ ] Completion follows `build-verify-deploy.md`.

## Sources

- `TRANSLATION-GUIDE.md`
- `src/composables/useLocale.ts`
- `src/components/ImageChooser.vue`
- `vite.config.ts`
