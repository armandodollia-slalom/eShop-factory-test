---
id: TC-CART-1-20
type: happy
layer: e2e
covers: ["AC7", "Saved products are not part of the order placed at checkout"]
priority: P1
---

# TC-CART-1-20: Placing an order orders only the cart items and keeps the saved product

## Why

- AC7 is the cross-service risk: checkout deletes the basket, which must not lose saved products, and the order must not include them.

## Preconditions

- E2E on the test stack: `loadScenario('cart-1')` in `beforeEach` (the loader clears every store first, so each case starts from the same state). Scenario `cart-1` (`extends: default`) adds brand-1/type-1 catalog items 2001 "Alpine Pack" (price 40.00), 2002 "Basecamp Mug" (price 10.00) and 2003 "Cedar Headlamp" (price 25.00), each with stock 10, and seeds Redis baskets: alice (id 50ddac7e-9b69-4d68-a91b-25100ef2e403) has cart items 2001 x 2 and 2002 x 1 and saved item 2003 x 3; bob (id bc8b0071-21af-41ab-b1d2-15c4efc368df) has an empty basket. Cart total of alice at start: $90.00; cart badge: 3.
- Signed in as alice. The checkout form is prefilled with the address from alice's profile (as in `e2e/CheckoutTest.spec.ts`: Address `15703 NE 61st Ct`, City `Redmond`); no field is edited.
- The number of `.order-number` elements on `/user/orders` is read before the test starts (call it K).

## Steps

1. Open `/user/orders` and record K, the count of `.order-number` elements.
2. Open `/cart` and click the link named `Check out`; on `/checkout` click the button named `Place order`. The page navigates to `/user/orders`.
3. On `/user/orders`, wait for the new order: the web-first assertion `expect(page.locator('.order-number')).toHaveCount(K + 1)` (Playwright polls it; the order is created asynchronously). Read the `.order-total` text of the new order.
4. Wait for the asynchronous order-started event to delete the basket: poll with `expect(async () => { await page.goto('/cart'); await expect(page.getByText('Your shopping bag is empty')).toBeVisible({ timeout: 1000 }); }).toPass()` (the default `toPass` timeout; no fixed sleep).
5. On that `/cart` page, read the Saved for later section.

## Expected result

- Step 3: the `.order-number` count is K + 1 and the new order's total is `$90.00` (Alpine Pack 2 x 40.00 + Basecamp Mug 1 x 10.00). Had Cedar Headlamp 3 x 25.00 been ordered the total would be `$165.00`. The orders page lists only number, date, total and status, so the order's lines cannot be read in the UI; the total is the observable proof that only cart items were ordered.
- Steps 4 and 5: `/cart` shows `Your shopping bag is empty` and the heading `Saved for later (1)` listing "Cedar Headlamp" with `Quantity: 3`.
