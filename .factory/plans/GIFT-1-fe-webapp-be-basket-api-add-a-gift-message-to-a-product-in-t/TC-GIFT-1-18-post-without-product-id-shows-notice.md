---
id: TC-GIFT-1-18
type: sad
sad-path: validation
layer: e2e
kept-for: SOL-2
covers: ["Upheld finding SOL-2: a gift message post without a product id shows a notice above the bag and leaves the basket unchanged"]
priority: P2
---

# TC-GIFT-1-18: A gift message post without a product id shows a notice above the bag and changes nothing

## Why

- Regression case for the upheld finding SOL-2: a gift-message post that names no line (no `GiftMessageProductId`) must not change any line or fail the page; it shows a notice above the bag instead. The post can only be produced by removing the hidden input in the browser, and the notice is rendered markup, so e2e.

## Preconditions

- Scenario `default`; `alice` has an empty basket.

## Steps

1. Sign in as `alice`, add item 99 ("Adventurer GPS Watch") to the bag, open `/cart`, choose "Add a gift message", type `Happy birthday, Sam!` and save.
2. On the line choose "Edit".
3. In the DOM, remove the hidden input `GiftMessageProductId` from that line's gift message form.
4. Replace the text of the input with aria-label `Gift message for Adventurer GPS Watch` with `Other text` and click the line's "Save" button.
5. Reload `/cart`.

## Expected result

- After step 4 the page is `/cart` (no error page) and shows the alert `Choose an item in your bag to add a gift message to.` above the bag's item list (before the `.cart` container in the DOM).
- After step 4 the line still shows `"Happy birthday, Sam!"` under the product name with quantity 1; `"Other text"` is not shown as a gift message.
- After step 5 the alert is not on the page and the line shows `"Happy birthday, Sam!"` with quantity 1.
