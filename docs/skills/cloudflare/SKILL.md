---
name: cloudflare
description: Use when configuring Cloudflare DNS, Workers, Pages, custom domains, redirects, or Wrangler authentication.
---

# Cloudflare operations

## Overview

Change live delivery resources only through documented Wrangler flows, and
verify the result at the live hostname.

## When to Use

Use for domain, DNS, Workers, Pages, route, redirect, or Wrangler work.

## When NOT to Use

Do not use for application code, content, or GitHub Pages build changes, and
never deploy a Worker as a substitute for a DNS record.

## Core Process

1. Read the current Wrangler/Cloudflare documentation before changing a live
   resource. Context7 source: `/cloudflare/workers-sdk`.
2. Confirm the local account and permissions:
   ```bash
   wrangler whoami
   ```
3. Identify whether the request is DNS/custom-domain configuration or an
   application Worker.
4. Use the documented Wrangler config/command for the requested resource. Keep
   the configuration in the repository when it is meant to be repeatable.
5. Verify the live hostname with `curl -I` and a browser after propagation.
6. If permissions do not include DNS edit, stop and request reauthentication.

## DNS versus Worker

- **DNS/subdomain request:** create or update the zone record/custom-domain
  configuration only.
- **Current website delivery:** `projectbluefin.io` is Cloudflare-proxied
  GitHub Pages, not a Cloudflare Pages project. `public/_headers` therefore
  documents a Pages-compatible policy but does not set live response headers;
  verify live cache behavior with `curl -I` before relying on it.
- **Existing redirect-subdomain pattern:** before changing DNS, inspect the
  account's existing routes. Project subdomains backed by GitHub Pages may use
  a dedicated redirect Worker route (`host.example/*`) because GitHub Pages
  accepts the apex custom domain but does not map arbitrary subdomains to a
  path such as `/wolves/`. Mirror that established route pattern when the
  requested destination is an existing path on the same site; do not invent a
  new routing architecture.
- **Path rewrite/proxy request:** requires explicit approval for a Worker or
  redirect rule because it changes runtime behavior.
- **Pages deployment:** verify the Pages project and custom domain in the
  documented Cloudflare flow; do not assume GitHub Pages and Cloudflare Pages
  are interchangeable.

## Red Flags

- Deploying a Worker just to make a hostname exist.
- Assuming an existing redirect is removed by attaching a Worker domain.
- Using a fork or a guessed Cloudflare account.
- Claiming a subdomain works from a local Worker deploy without checking DNS and
  the live HTTPS response.
- Passing tokens through logs or committing Wrangler credentials.

## Verification

- [ ] `wrangler whoami` shows the intended account.
- [ ] The exact requested resource was changed, and no temporary Worker remains.
- [ ] DNS/custom-domain state is verified in Wrangler/Cloudflare docs and live
  HTTP checks.
- [ ] No credentials are in the repository or command output.
- [ ] The resulting hostname returns the intended status and content.

## Delivery topology verification

```bash
curl -I https://projectbluefin.io/wolves/
curl -I https://projectbluefin.io/img/wallpapers/wolves/people/kubecon-54927422306.webp
wrangler pages project list
```

## References

- Cloudflare Workers SDK: `/cloudflare/workers-sdk`
- Wrangler custom-domain route configuration: `routes[].custom_domain = true`
