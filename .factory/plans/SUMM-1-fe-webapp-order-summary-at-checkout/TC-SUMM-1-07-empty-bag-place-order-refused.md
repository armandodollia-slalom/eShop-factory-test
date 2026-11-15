---
id: TC-SUMM-1-07
type: sad
sad-path: validation
layer: e2e
covers: ["AC4: pressing Place order still shows \"Your cart is empty\""]
priority: P1
---

# TC-SUMM-1-07: Place order with an empty bag still shows "Your cart is empty"

## Why

- AC4 requires the existing empty-cart guard to keep working: the new summary text must not replace or bypass the "Your cart is empty" validation, and no order may be created. The risk is a regression in the form submit path after `OnInitialized` became `OnInitializedAsync`. Checking the orders page proves nothing was placed.

## Preconditions

- Scenario `default`; alice's basket is empty and she has no orders.
- Signed in as alice (`alice` / `Pass123$`).

## Steps

1. As alice, navigate to `/checkout`.
2. Leave the pre-filled shipping address as it is and press **Place order**.
3. Navigate to `/user/orders`.

## Expected result

- After step 2 the URL path is still `/checkout` and the validation summary (`ul.validation-errors`) contains `Your cart is empty`.
- After step 3 the page shows `No orders yet` and contains no `.order-number` element.
