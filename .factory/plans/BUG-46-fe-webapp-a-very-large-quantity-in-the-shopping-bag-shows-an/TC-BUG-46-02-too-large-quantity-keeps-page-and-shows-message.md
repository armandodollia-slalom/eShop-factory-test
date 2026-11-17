---
id: TC-BUG-46-02
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: page stays on screen with header, items and totals", "Expected: message 'Enter a smaller quantity.' next to the item", "Actual: empty page must not happen", "Steps to Reproduce 1-3"]
priority: P1
---

# TC-BUG-46-02: Typing 5000000000 and pressing Enter keeps the bag page with header, item, totals and shows "Enter a smaller quantity."

## Why

- This is the bug's exact reproduction: the value does not fit the quantity type and the page went blank with no message. It checks the page stays rendered and the shopper is told why; it is separate from TC-BUG-46-03, which checks the quantity and totals are unchanged. e2e because the failure was in the Blazor page's rendering after the form post.

## Preconditions

- Test stack running with scenario `default` reloaded: user `bob` has an empty basket.
- Catalog item 7 "Explorer 45L Backpack", $149.99.

## Steps

1. Sign in as `bob` / `Pass123$`.
2. Open `/item/7` and click "Add to shopping bag".
3. Open `/cart`.
4. In the input labelled "Quantity of Explorer 45L Backpack", clear the value, type `5000000000` and press Enter.

## Expected result

- The URL is still `/cart`.
- The page header "Shopping bag" is visible.
- The item row with name "Explorer 45L Backpack" is visible, and so is the summary "Your shopping bag" with its "Total" and the "Check out" link.
- Inside the "Explorer 45L Backpack" row's quantity column, the text "Enter a smaller quantity." is visible.
- The page is not empty and shows no error page (no "An unhandled error has occurred" banner, no "Error" heading).
