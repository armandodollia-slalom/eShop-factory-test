---
id: TC-ADDED-1-01
type: happy
layer: e2e
covers: ["AC1: line says 'Added on' and the date", "Implementation Notes: format d MMM yyyy under the product name"]
priority: P1
---

# TC-ADDED-1-01: Shopping bag line shows "Added on" with today's date after adding a product

## Why

- AC1 is the user-visible outcome of the story: without it the stored date is invisible. Only the e2e layer exercises the whole path (WebApp add → Basket gRPC → Redis → GetBasket → CartPage rendering and date format).

## Preconditions

- Test stack running scenario `default`; `alice` has an empty basket.
- Catalog item 99 "Adventurer GPS Watch" exists.

## Steps

1. Sign in to the WebApp as `alice` (password from the scenario).
2. Open the product page of item 99 and click "Add to shopping bag".
3. Open the shopping bag page (`/cart`).

## Expected result

- The bag shows exactly one line, "Adventurer GPS Watch", quantity 1.
- Inside that line, directly under the product name, there is a text exactly `Added on <today>` where `<today>` is the current UTC date formatted `d MMM yyyy` with the invariant culture (for example `Added on 20 Nov 2026`; no leading zero on the day).
- The "Added on" text uses the same muted style as the line's price text (same computed color as `.price`).
