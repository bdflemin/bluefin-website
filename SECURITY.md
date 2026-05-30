# Security Policy — projectbluefin/website

## Scope

This repository contains the **projectbluefin.io** marketing website — a
static Vite/Vue 3 SPA. It serves no user authentication, processes no secrets,
and stores no user data. The primary security-relevant surfaces are:

- **Supply chain** — npm dependencies, GitHub Actions, and build tooling.
- **CI/CD pipeline** — GitHub Actions workflows that build and deploy the site.
- **Deployed content** — XSS vectors in translated strings or user-supplied
  content injected into HTML at build time.

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Report privately via GitHub's built-in advisory tooling:

1. Go to the [Security Advisories](https://github.com/projectbluefin/website/security/advisories) page.
2. Click **Report a vulnerability**.
3. Describe the issue, reproduction steps, and impact.

We will acknowledge within **5 business days** and aim for coordinated
disclosure within 90 days.

For issues affecting Project Bluefin broadly (not specific to this repo), see
the [main project security policy](https://github.com/projectbluefin/bluefin/security/policy).

## Supply Chain Controls

- **Dependency review** — `dependency-review-action` blocks PRs that introduce
  high-severity CVEs.
- **Renovate** — automated dependency updates keep npm packages current.
- **GitHub Actions pinning** — action steps should reference pinned commit SHAs
  for third-party actions; PRs that introduce floating tags should be flagged.

## Known Limitations

- i18n locale files are community-contributed and are not cryptographically
  signed. Content is reviewed in PRs before merge.
- The site is a static build; no server-side execution or user data processing
  occurs at runtime.
