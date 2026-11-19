---
id: TC-BUG-37-01
type: sad
sad-path: not-found
layer: e2e
covers: ["Steps to Reproduce step 1", "Expected: reference 404 page for /item/999999"]
priority: P1
---

# TC-BUG-37-01: Unknown product id 999999 answers 404 with the Not found page

## Why

- The story defines the expected answer for 0 and -1 as "exactly as `/item/999999` does", so the reference page itself must be pinned: if it changed, cases 02 and 03 would be checking against a moving target. It needs the e2e layer because the status and page come from the WebApp rendering on the test stack, with Catalog.API answering 404 for the unknown id.

## Preconditions

- Test stack running with scenario `default` (101 catalog items, ids 1 to 101; no item with id 999999).
- Anonymous visitor (not signed in).

## Steps

1. `page.goto("/item/999999")` on the WebApp and keep the returned response.

## Expected result

- The response status is `404`.
- The header `h1` text is `Not found`.
- `.item-page .item-notfound` has the text `Sorry, we couldn't find any such product.`
- `.item-page a.item-back` is visible with the text `Back to catalog`.
- The page has no `.item-details` element and no `form.add-to-cart` element.
- The page does not contain the text `Internal Server Error`.
