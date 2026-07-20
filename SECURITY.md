# Security policy

## Scope

This repository builds a static website. Security-relevant areas include
third-party dependencies, GitHub Actions, build tooling, deployment, and content
rendered into HTML.

## Boundary

**Agents edit content. Agents never edit design.**

Security work does not authorize changes to layout, markup, component behavior,
styles, typography, responsive behavior, navigation prominence, or animation.

## Report a vulnerability

Do not open a public issue for a security vulnerability. Use the repository's
private GitHub Security Advisory workflow and include:

- affected path or dependency
- reproduction steps
- impact
- proposed mitigation, if known

For issues affecting a wider project, use that project's security policy.

## Supply-chain rules

- Review dependency changes for known vulnerabilities.
- Pin third-party GitHub Actions according to repository policy.
- Keep generated content reviewable in pull requests.
- Treat translated and HTML-rendered content as untrusted input.

## Limits

The site has no runtime authentication, server-side application state, or user
data store. Locale files and generated assets are still reviewed as shipped
content.
