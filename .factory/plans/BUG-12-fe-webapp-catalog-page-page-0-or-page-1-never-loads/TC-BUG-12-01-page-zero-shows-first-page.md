---
id: TC-BUG-12-01
type: happy
layer: e2e
covers: ["Expected: first catalog page is shown", "Acceptance: ?page=0 steps repeated"]
priority: P1
---

# TC-BUG-12-01: ?page=0 shows the first catalog page

## Why

- This is the reported bug (page=0 made the WebApp request pageIndex=-1 and the page never loaded); an e2e case is chosen because the symptom is the rendered skeleton and error bar, which only a browser shows.

## Preconditions

- Test stack is up with scenario `default` loaded (101 catalog items, page size 9, so 12 pages). Visitor is anonymous.

## Steps

1. As an anonymous visitor, open `http://localhost:18080/?page=0`.
2. Wait for the catalog to finish streaming.

## Expected result

- The loading skeleton (`[role="status"][aria-label="Loading products"]`) is not present once rendering completes.
- The error bar `#blazor-error-ui` is not visible and the text "An unhandled error has occurred." is absent from the page.
- The catalog shows 9 `.catalog-product` cards.
- The pagination nav (`nav[aria-label="Catalog pages"]`) shows the active page number `1` (`.page-number.active-page` with text `1`) and the status text `1 / 12`.
- The "Prev" control is the disabled `span.page-nav.is-disabled`, not a link.
- The 9 product names shown equal, in order, those shown at `http://localhost:18080/` (no `page` parameter).
- The browser URL is still `http://localhost:18080/?page=0` (no redirect).
