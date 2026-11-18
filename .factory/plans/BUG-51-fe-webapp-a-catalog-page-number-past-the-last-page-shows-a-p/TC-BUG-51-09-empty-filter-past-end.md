---
id: TC-BUG-51-09
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected bullet 3: filtered catalog behaves exactly as today (no matching products)"]
priority: P2
---

# TC-BUG-51-09: A filter matching nothing with a page past the end keeps the no-products state

## Why

- A filter that matches nothing has zero pages; the fix must not turn that into a page 0 or a count above an empty grid. The ticket requires the filtered catalog to behave as today, and today it shows the no-products state.

## Preconditions

- Test stack running with scenario `default`: no product has brand 13 (XE) and type 8 (Cycling).
- Anonymous browser session.

## Steps

1. Open `/?brand=13&type=8&page=50` on the WebApp.

## Expected result

- The heading "No products match these filters" and the "Clear all filters" link are shown.
- No product count, no sort control, no product cards and no pager are rendered.
