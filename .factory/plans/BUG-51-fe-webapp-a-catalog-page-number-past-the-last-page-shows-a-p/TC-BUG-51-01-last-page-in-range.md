---
id: TC-BUG-51-01
type: happy
layer: e2e
covers: ["Steps to Reproduce step 1", "Expected: pages 1 to 12 behave exactly as today"]
priority: P1
---

# TC-BUG-51-01: The catalog's last page /?page=12 lists 2 products with the pager at "12 / 12"

## Why

- Step 1 of the reproduction is the baseline every past-the-end case compares against, and the ticket requires page 12 (the last valid page, just inside the limit) to behave as today. It must be an e2e case because the rendering of the count, products and pager happens in the Blazor page.

## Preconditions

- Test stack running with scenario `default` (101 catalog products, 9 per page).
- Anonymous browser session.

## Steps

1. Open `/?page=12` on the WebApp.

## Expected result

- The toolbar reads "101 products".
- The product area lists exactly 2 products (101 − 11 × 9).
- The pager status reads "12 / 12"; the active page number is 12 (`aria-current="page"`).
- "Next" is disabled (no link); "Prev" links to `/?page=11`.
- Record the names of the 2 products: TC-BUG-51-03, -04 and -05 compare against them.
