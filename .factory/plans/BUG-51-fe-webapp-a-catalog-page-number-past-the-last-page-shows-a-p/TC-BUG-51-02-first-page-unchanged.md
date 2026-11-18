---
id: TC-BUG-51-02
type: happy
layer: e2e
covers: ["Expected: pages 1 to 12 behave exactly as today"]
priority: P2
---

# TC-BUG-51-02: /?page=1 lists 9 products with the pager at "1 / 12"

## Why

- The fix changes how the page computes the current page; the ticket requires in-range pages to be unchanged. Page 1 is the other end of the valid range, where a wrong clamp (for example to the last page) would show up. E2e because the pager is rendered by the page.

## Preconditions

- Test stack running with scenario `default`.
- Anonymous browser session.

## Steps

1. Open `/?page=1` on the WebApp.

## Expected result

- The toolbar reads "101 products".
- The product area lists exactly 9 products.
- The pager status reads "1 / 12"; the active page number is 1.
- "Prev" is disabled; "Next" links to `/?page=2`.
