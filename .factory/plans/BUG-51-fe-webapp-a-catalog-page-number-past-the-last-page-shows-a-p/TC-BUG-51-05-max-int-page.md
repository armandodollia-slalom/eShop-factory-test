---
id: TC-BUG-51-05
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected bullet 2: pager never shows a current page larger than the number of pages (largest page value)"]
priority: P2
---

# TC-BUG-51-05: /?page=2147483647 shows the last page

## Why

- "Never" in the ticket includes the largest page number the page accepts. The paging offset (page − 1) × 9 does not fit in an int for this value, so a naive request could fail instead of showing the last page. E2e because the value travels from the address through the WebApp to the Catalog API.

## Preconditions

- Test stack running with scenario `default`.
- Anonymous browser session.

## Steps

1. Open `/?page=12` and record the names of the listed products.
2. Open `/?page=2147483647` on the WebApp.

## Expected result

- The page renders the catalog (no error page, no "An unhandled error has occurred" banner).
- The toolbar reads "101 products".
- The product area lists exactly 2 products, with the same names as step 1.
- The pager status reads "12 / 12"; the active page number is 12.
