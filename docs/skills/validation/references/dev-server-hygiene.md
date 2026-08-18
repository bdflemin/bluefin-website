# Local dev server hygiene

## Local dev server hygiene

"I don't see my change in the browser" is usually a server problem, not a code
problem. Before debugging application code, prove which process answers the port.

```bash
ss -ltnp | grep -E '5173|4173|4174|5174'
ps -eo pid,lstart,args | grep vite | grep -v grep
```

Rules:

- Run exactly one dev server. Every extra `vite` or `vite preview` started by a
  previous session is a separate app on its own port, and a stale tab can sit on
  any of them for hours.
- `vite preview` serves a frozen `dist/`. It never hot-reloads and never picks up
  source edits. Never leave one running while doing source work, and delete the
  stale `dist/` so nothing can serve it again.
- Bare `vite` binds `[::1]` only; `vite --host 127.0.0.1` binds IPv4 only. When
  both exist, `localhost` reaches different apps depending on resolution order.
  Start with `--host :: --port 5173 --strictPort` so one server answers both
  stacks on a predictable port, and `--strictPort` fails loudly instead of
  silently drifting to 5174.
- Kill stale servers by explicit numeric PID, one `kill <PID>` per command.

Prove the server is live rather than assuming it:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/wolves/
curl -s http://localhost:5173/src/path/to/Edited.vue | grep -c 'marker-from-your-edit'
```

Then prove HMR actually pushes. Load the page in Chromium, collect console
output, write a real edit to a source file, restore it, and require both
`[vite] connected` and a `[vite] hot updated:` line naming that file. A page that
loads is not evidence that it refreshes.

Also confirm no service worker is registered; a cached worker produces the same
"nothing updates" symptom and this repo intentionally registers none.

---

Procedure and gate: [`../SKILL.md`](../SKILL.md).
