---
name: happy-dom-external-script-tests
description: Use when Vitest or happy-dom tests append external script tags, such as the YouTube IFrame API, and need to assert insertion or drive load and error paths without fetching remote JavaScript.
metadata:
  context7-sources:
    - /capricorn86/happy-dom
---

# Happy DOM External Script Tests

## When to Use

- A unit test appends `<script src="...">` in happy-dom
- happy-dom throws `NotSupportedError` because JavaScript file loading is disabled
- You need to assert the script tag exists after a user action
- You need deterministic success and failure paths for a third-party loader

## When NOT to Use

- Real browser or Playwright coverage where the remote script should load normally
- Cases where you actually need remote JavaScript execution inside the test environment

## Core Process

1. In `beforeEach`, set `window.happyDOM.settings.handleDisabledFileLoadingAsSuccess = true`.
2. Trigger the code path that appends the external script tag.
3. Assert on the inserted `<script>` element directly.
4. Drive success manually with the loader callback your app expects.
5. Drive failure manually with `script.dispatchEvent(new Event('error'))` when you need the fallback path.

```ts
beforeEach(() => {
  ;(window as any).happyDOM.settings.handleDisabledFileLoadingAsSuccess = true
})

it('inserts the YouTube IFrame API script only after the start click', async () => {
  const wrapper = mount(WolvesSoundtrack)

  expect(document.querySelector('script[src="https://www.youtube.com/iframe_api"]')).toBeNull()

  await wrapper.get('button[aria-label="Start soundtrack"]').trigger('click')
  await flushPromises()

  const script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
  expect(script).not.toBeNull()

  ;(window as any).onYouTubeIframeAPIReady?.()
  // or: script?.dispatchEvent(new Event('error'))
})
```

## Common Rationalizations

| Rationalization | Reality |
| --- | --- |
| "I'll preinstall the global before the click." | That skips the behavior under test and hides whether the script insertion is user-initiated. |
| "I'll let happy-dom error and ignore the noise." | The thrown `NotSupportedError` can erase the script element and break the assertion you actually care about. |
| "I should enable remote script execution in unit tests." | Unit tests only need deterministic loader behavior, not third-party network execution. |

## Red Flags

- `Failed to load script "...". JavaScript file loading is disabled.`
- The test never checks whether the `<script>` tag was created
- Success depends on a pre-seeded global instead of the component's real loader path
- Failure coverage is missing because the loader callback always succeeds

## Verification

- [ ] Script is absent before the user action
- [ ] Script exists after the action that should append it
- [ ] The success path is triggered manually through the expected callback
- [ ] The failure path is triggered manually through an `error` event
- [ ] No remote JavaScript execution is required for the test to pass

## Sources

- Context7: `/capricorn86/happy-dom` (`IOptionalBrowserSettings`: `handleDisabledFileLoadingAsSuccess` emits `load` instead of `error` when file loading is disabled)
