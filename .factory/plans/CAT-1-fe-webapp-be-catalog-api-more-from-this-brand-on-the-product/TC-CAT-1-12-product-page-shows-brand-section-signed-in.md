---
id: TC-CAT-1-12
type: happy
layer: e2e
covers: ["AC6: shopper signed in or not"]
priority: P2
---

# TC-CAT-1-12: A signed-in shopper sees the same "More from" section

## Why

- AC6 says "signed in or not". The product page renders differently for signed-in users (for example the add-to-cart controls), so the section must be shown in that state too. E2E, same reason as TC-CAT-1-11.

## Preconditions

- Scenario `brand-mates` loaded; user `alice` / `Pass123$` exists (from `default`).

## Steps

1. Sign in as `alice` through the WebApp login.
2. Open `/item/1001`.

## Expected result

- The heading "More from Brand Alpha" is shown below the product details, with 4 product cards named "Bravo Pack", "Charlie Pack", "Delta Pack", "Echo Pack".
