---
id: TC-BUG-37-02
type: sad
sad-path: boundary
layer: e2e
covers: ["Steps to Reproduce step 2", "Expected: /item/0 answers 404 and the same page as /item/999999", "Acceptance Criteria"]
priority: P1
---

# TC-BUG-37-02: Product id 0 answers 404 with the same Not found page

## Why

- This is the reported defect: `/item/0` answered `500` because Catalog.API answers 400 for it and the page did not handle that. 0 is the boundary just below the first catalog id (1), so it is a separate case from the negative id. The e2e layer is required because the acceptance criterion is the status and page the running WebApp serves.

## Preconditions

- Test stack running with scenario `default` (no catalog item with id 0).
- Anonymous visitor (not signed in).

## Steps

1. `page.goto("/item/0")` on the WebApp and keep the returned response.

## Expected result

- The response status is `404` (not `500`).
- The header `h1` text is `Not found`.
- `.item-page .item-notfound` has the text `Sorry, we couldn't find any such product.`
- `.item-page a.item-back` is visible with the text `Back to catalog`.
- The page has no `.item-details` element and no `form.add-to-cart` element.
- The page does not contain the text `Internal Server Error`.
