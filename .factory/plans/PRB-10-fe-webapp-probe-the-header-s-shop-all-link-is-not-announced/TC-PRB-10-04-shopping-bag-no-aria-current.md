---
id: TC-PRB-10-04
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: on the shopping bag the link has no aria-current"]
priority: P2
---

# TC-PRB-10-04: "Shop all" has no aria-current on the shopping bag

## Why

- The shopping bag is one of the three non-catalog pages the story names. It is a different page component from the product page and sits behind sign-in, so it gets its own case to prove the attribute depends on the catalog page only, not on some other page property.

## Preconditions

- Test stack running with scenario `default`; user `alice` (password `Pass123$`) exists with an empty basket.

## Steps

1. Sign in as `alice` / `Pass123$` through the WebApp's sign-in flow.
2. Open `/cart` (full page load).
3. Locate the "Shop all" link in `header nav[aria-label="Primary"]`.

## Expected result

- The shopping bag page is shown (URL path `/cart`).
- The "Shop all" link exists, its text is `Shop all`, and it has no `aria-current` attribute (`getAttribute('aria-current')` returns `null`).
- Its `class` attribute does not contain `is-current`.
