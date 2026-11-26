---
id: TC-SUMM-1-10
type: sad
sad-path: validation
layer: e2e
covers: ["AC5: the shipping address form and its validation are unchanged"]
priority: P2
---

# TC-SUMM-1-10: Shipping address validation still blocks an order with an empty Address

## Why

- AC5 requires the shipping address validation to be unchanged. The `EditContext` is now built inside `OnInitializedAsync`; if it were rebuilt or bound wrongly the `[Required]` rule on Street could stop firing and an order with no address would be placed. Uses a non-empty bag so the only reason to refuse is the address.

## Preconditions

- Scenario `default`; alice's basket is empty and she has no orders.
- Signed in as alice (`alice` / `Pass123$`).
- On `/item/2` alice presses **Add to shopping bag** once.

## Steps

1. As alice, navigate to `/checkout`.
2. Clear the **Address** input (leave it as the empty string) and press **Place order**.
3. Navigate to `/user/orders`.

## Expected result

- After step 2 the URL path is still `/checkout`; the validation message under **Address** reads `The Street field is required.`; `Your cart is empty` is not shown.
- After step 3 the page shows `No orders yet` and contains no `.order-number` element.
