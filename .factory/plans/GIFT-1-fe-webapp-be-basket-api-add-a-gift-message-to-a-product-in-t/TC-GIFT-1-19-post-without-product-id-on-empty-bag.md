---
id: TC-GIFT-1-19
type: sad
sad-path: validation
layer: e2e
kept-for: SOL-2
covers: ["Upheld finding SOL-2: the missing-product notice is shown on an empty bag too"]
priority: P2
---

# TC-GIFT-1-19: A gift message post without a product id on an empty bag shows the notice and the bag stays empty

## Why

- SOL-2 was upheld again after the first fix because the notice was not rendered when the bag was empty (the empty-bag branch replaced the item list). This is a separate rendering path from TC-GIFT-1-18, so it gets its own case. The stale form is produced by emptying the bag in a second tab, which only a browser can do, so e2e.

## Preconditions

- Scenario `default`; `alice` has an empty basket.

## Steps

1. Sign in as `alice`, add item 99 ("Adventurer GPS Watch") to the bag and open `/cart` in tab A.
2. In tab A choose "Add a gift message" on the line, and in the DOM remove the hidden input `GiftMessageProductId` from that line's gift message form.
3. In tab B (same browser context, same session) open `/cart` and click the line's "Remove" button (aria-label `Remove Adventurer GPS Watch from your bag`).
4. In tab A type `Happy birthday, Sam!` into the input with aria-label `Gift message for Adventurer GPS Watch` and click the line's "Save" button.

## Expected result

- After step 3 tab B shows `Your shopping bag is empty`.
- After step 4 tab A is on `/cart` (no error page) and shows the alert `Choose an item in your bag to add a gift message to.` above the `Your shopping bag is empty` heading.
- After step 4 the bag is still empty: tab A shows `Your shopping bag is empty` and no "Adventurer GPS Watch" line; `"Happy birthday, Sam!"` does not appear.
