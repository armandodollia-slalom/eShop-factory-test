---
id: TC-BUG-51-03
type: sad
sad-path: boundary
layer: e2e
covers: ["Steps to Reproduce step 2", "Expected bullet 1: step 2 shows the last page", "Expected bullet 2: pager never above the number of pages (no filter)", "Actual"]
priority: P1
---

# TC-BUG-51-03: /?page=50 shows the catalog's last page with the pager at "12 / 12"

## Why

- This is the reported defect itself: a page number past the end showed "101 products" over an empty product area and a pager reading "50 / 12". E2e reproduces the ticket's exact steps on the test stack.

## Preconditions

- Test stack running with scenario `default`.
- Anonymous browser session.
- The 2 product names on `/?page=12` (TC-BUG-51-01, step 1 of the reproduction).

## Steps

1. Open `/?page=12` and record the names of the listed products.
2. Open `/?page=50` on the WebApp.

## Expected result

- The toolbar reads "101 products".
- The product area lists exactly 2 products, with the same names, in the same order, as step 1.
- The pager status reads "12 / 12"; the active page number is 12; "Next" is disabled.
- The text "50 / 12" does not appear anywhere on the page, and the product area is not empty.
