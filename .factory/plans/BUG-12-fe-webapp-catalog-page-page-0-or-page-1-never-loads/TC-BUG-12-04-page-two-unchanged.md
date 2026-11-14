---
id: TC-BUG-12-04
type: happy
layer: e2e
covers: ["Regression: pages above 1 are not clamped"]
priority: P2
---

# TC-BUG-12-04: ?page=2 still shows the second catalog page

## Why

- Proves the clamp only affects values below 1: page 2 must still differ from page 1 and have an enabled Prev.

## Preconditions

- Test stack is up with scenario `default` loaded (101 catalog items, page size 9, so 12 pages). Visitor is anonymous.

## Steps

1. As an anonymous visitor, open `http://localhost:18080/`; record the 9 product names.
2. Open `http://localhost:18080/?page=2`.
3. Wait for the catalog to finish streaming.

## Expected result

- The skeleton is gone, `#blazor-error-ui` is not visible, and 9 `.catalog-product` cards are shown.
- None of the 9 product names equals a name recorded in step 1.
- The active page number is `2` and the status text is `2 / 12`.
- The "Prev" control is an `a.page-nav[rel="prev"]` link whose href has no `page` query parameter (it points to page 1).
