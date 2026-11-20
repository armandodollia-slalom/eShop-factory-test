---
id: TC-BUG-51-04
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected bullet 2: pager never above the number of pages (no filter, just outside the limit)"]
priority: P1
---

# TC-BUG-51-04: /?page=13, one past the last page, shows the last page

## Why

- Page 13 is the first value just outside the limit; an off-by-one in the comparison with the last page would leave it empty while 50 works. E2e for the same reason as TC-BUG-51-03.

## Preconditions

- Test stack running with scenario `default`.
- Anonymous browser session.

## Steps

1. Open `/?page=12` and record the names of the listed products.
2. Open `/?page=13` on the WebApp.

## Expected result

- The toolbar reads "101 products".
- The product area lists exactly 2 products, with the same names as step 1.
- The pager status reads "12 / 12"; the active page number is 12; "Next" is disabled.
- The text "13 / 12" does not appear on the page.
