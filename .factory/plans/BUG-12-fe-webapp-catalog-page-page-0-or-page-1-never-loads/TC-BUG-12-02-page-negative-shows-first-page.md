---
id: TC-BUG-12-02
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: first catalog page is shown", "Acceptance: ?page=-1 steps repeated"]
priority: P1
---

# TC-BUG-12-02: ?page=-1 shows the first catalog page

## Why

- The bug title names ?page=-1 as well; a negative value is a separate boundary from zero because it produced a different failing page index (-2).

## Preconditions

- Test stack is up with scenario `default` loaded (101 catalog items, page size 9, so 12 pages). Visitor is anonymous.

## Steps

1. As an anonymous visitor, open `http://localhost:18080/?page=-1`.
2. Wait for the catalog to finish streaming.

## Expected result

- The loading skeleton (`[role="status"][aria-label="Loading products"]`) is not present once rendering completes.
- The error bar `#blazor-error-ui` is not visible and the text "An unhandled error has occurred." is absent from the page.
- The catalog shows 9 `.catalog-product` cards.
- The pagination nav (`nav[aria-label="Catalog pages"]`) shows the active page number `1` (`.page-number.active-page` with text `1`) and the status text `1 / 12`.
- The "Prev" control is the disabled `span.page-nav.is-disabled`, not a link.
- The 9 product names shown equal, in order, those shown at `http://localhost:18080/`.
- The browser URL is still `http://localhost:18080/?page=-1` (no redirect).
