---
id: TC-PRB-10-02
type: happy
layer: e2e
covers: ["Expected: its text, destination and look are unchanged (catalog page)"]
priority: P2
---

# TC-PRB-10-02: "Shop all" keeps its text, destination and is-current look on the catalog page

## Why

- The fix must add only the attribute; the story requires the link's text, destination and look to stay as they were. A regression here (renamed link, broken href, lost highlight) would be visible to every shopper, so it is checked separately from the attribute case. e2e because only the rendered page shows the final markup.

## Preconditions

- Test stack running with scenario `default`.
- Anonymous browser session.

## Steps

1. Open `/`.
2. Read the "Shop all" link in `header nav[aria-label="Primary"]`: its text, its `href`, its resolved URL and its `class` attribute.

## Expected result

- Its visible text is exactly `Shop all`.
- Its `href` attribute is the empty string (as before the fix), and the link's resolved URL (`link.href` property) equals the WebApp's base URL root (`<webapp-origin>/`).
- Its `class` attribute contains both `eshop-topnav-link` and `is-current`.
- There is still exactly one link in the primary navigation.
