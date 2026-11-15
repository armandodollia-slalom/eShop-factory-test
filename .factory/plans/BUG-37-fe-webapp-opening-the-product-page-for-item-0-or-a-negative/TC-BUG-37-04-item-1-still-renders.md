---
id: TC-BUG-37-04
type: happy
layer: e2e
covers: ["Expected: product pages of existing products behave as they do today", "Boundary: first valid id 1"]
priority: P1
---

# TC-BUG-37-04: Existing product id 1 still answers 200 with its product page

## Why

- The fix adds a guard on the id (`ItemId <= 0` is not found); an off-by-one (`< 1` written as `<= 1`) would turn the first real product into a 404. Id 1 is the boundary just inside the valid range and an existing seeded product, so it checks both the boundary and the story's "existing products behave as they do today". The e2e layer matches the other cases: the status and page come from the running WebApp.

## Preconditions

- Test stack running with scenario `default`: catalog item id 1 is `Wanderer Black Hiking Boots`, brand `Daybird`, price `109.99`.
- Anonymous visitor (not signed in).

## Steps

1. `page.goto("/item/1")` on the WebApp and keep the returned response.

## Expected result

- The response status is `200`.
- The header `h1` text is `Wanderer Black Hiking Boots`.
- `.item-details` is visible and `.item-meta dd` has the text `Daybird`.
- `form.add-to-cart .price` has the text `$109.99`.
- The page has no `.item-notfound` element and no `h1` with the text `Not found`.
