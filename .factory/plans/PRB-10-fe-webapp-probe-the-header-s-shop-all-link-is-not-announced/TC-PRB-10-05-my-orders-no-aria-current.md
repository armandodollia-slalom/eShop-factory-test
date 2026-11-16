---
id: TC-PRB-10-05
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: on My orders the link has no aria-current"]
priority: P2
---

# TC-PRB-10-05: "Shop all" has no aria-current on My orders

## Why

- My orders is the third non-catalog page the story names. It is a separate authenticated page component; a case here guards against the attribute being tied to anything but the catalog page.

## Preconditions

- Test stack running with scenario `default`; user `alice` (password `Pass123$`) exists with no orders.

## Steps

1. Sign in as `alice` / `Pass123$` through the WebApp's sign-in flow.
2. Open `/user/orders` (full page load).
3. Locate the "Shop all" link in `header nav[aria-label="Primary"]`.

## Expected result

- The My orders page is shown (URL path `/user/orders`).
- The "Shop all" link exists, its text is `Shop all`, and it has no `aria-current` attribute (`getAttribute('aria-current')` returns `null`).
- Its `class` attribute does not contain `is-current`.
