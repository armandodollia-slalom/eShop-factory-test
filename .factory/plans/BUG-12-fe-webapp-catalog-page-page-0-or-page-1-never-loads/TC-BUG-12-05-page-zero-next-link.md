---
id: TC-BUG-12-05
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: first catalog page is shown (navigation from it)"]
priority: P2
---

# TC-BUG-12-05: Next on the clamped first page leads to page 2

## Why

- The clamp feeds the pagination too; if it only fixed the data call, Next could compute page 1 from the raw value 0 and loop back to the same page.

## Preconditions

- Test stack is up with scenario `default` loaded (101 catalog items, page size 9, so 12 pages). Visitor is anonymous.

## Steps

1. As an anonymous visitor, open `http://localhost:18080/?page=0`.
2. Click the "Next page" link (`a.page-nav[rel="next"]`).
3. Wait for the catalog to finish streaming.

## Expected result

- The browser URL contains `page=2`.
- The active page number is `2`, the status text is `2 / 12`, and 9 `.catalog-product` cards are shown.
- `#blazor-error-ui` is not visible.
