---
id: TC-STORE-1-10
type: happy
layer: e2e
covers: ["Inputs: city starts with the text (boundary: whole city name)"]
priority: P3
---

# TC-STORE-1-10: The whole city name `Seattle` (longest matching prefix) lists only AdventureWorks Seattle

## Why

- Boundary just inside the prefix rule: the text equal to the full city still matches. Pairs with TC-STORE-1-11 (one character longer). e2e via the URL, as in AC3.

## Preconditions

- Test stack with scenario `default`; anonymous shopper.

## Steps

1. Open `/stores?city=Seattle`.

## Expected result

- Exactly one store is listed: `AdventureWorks Seattle`, with `1200 Pine St`, `Seattle` and `Mon–Sat 9:00–20:00`.
- The text `No stores in` does not appear on the page.
