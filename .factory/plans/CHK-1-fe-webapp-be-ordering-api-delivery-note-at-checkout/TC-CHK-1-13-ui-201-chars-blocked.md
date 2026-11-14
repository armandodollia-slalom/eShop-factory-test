---
id: TC-CHK-1-13
type: sad
sad-path: boundary
layer: e2e
covers: ["AC6", "Outputs: field error Delivery note must be 200 characters or fewer"]
priority: P1
---

# TC-CHK-1-13: A 201-character note is blocked on the checkout page with the field error

## Why

- AC6: only the browser shows that the user stays on the page and sees the exact message next to the field; the API side is TC-CHK-1-08.

## Preconditions

- Scenario `chk-1` (extends `default`, see `_index.md`): alice has item 99 "Adventurer GPS Watch" quantity 1 in her basket; no orders exist.
- Browser signed in as alice (password `Pass123$`).

## Steps

1. On the checkout page fill the address fields with Address `1 Main St`, City `Seattle`, State `WA`, Country `USA`, Zip code `98101`.
2. Enter the character `a` repeated 201 times in `Delivery note (optional)`.
3. Press `Place order`.
4. As alice, call `GET /api/orders?api-version=1.0` on the Ordering API.

## Expected result

- After step 3 the browser is still on the checkout page.
- The text `Delivery note must be 200 characters or fewer` is shown for the delivery note field.
- Step 4 returns an empty list: no order was created.
