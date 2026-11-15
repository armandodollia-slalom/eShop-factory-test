---
id: TC-BUG-37-03
type: sad
sad-path: validation
layer: e2e
covers: ["Steps to Reproduce step 3", "Expected: /item/-1 answers 404 and the same page as /item/999999", "Acceptance Criteria"]
priority: P1
---

# TC-BUG-37-03: Product id -1 answers 404 with the same Not found page

## Why

- The story names `/item/-1` as a second failing input: a negative id is a different class of invalid input from 0, and a fix that only special-cased 0 would still answer `500` here. The e2e layer is required because the acceptance criterion is the status and page the running WebApp serves.

## Preconditions

- Test stack running with scenario `default` (no catalog item with id -1).
- Anonymous visitor (not signed in).

## Steps

1. `page.goto("/item/-1")` on the WebApp and keep the returned response.

## Expected result

- The response status is `404` (not `500`).
- The header `h1` text is `Not found`.
- `.item-page .item-notfound` has the text `Sorry, we couldn't find any such product.`
- `.item-page a.item-back` is visible with the text `Back to catalog`.
- The page has no `.item-details` element and no `form.add-to-cart` element.
- The page does not contain the text `Internal Server Error`.
