---
id: TC-GIFT-1-09
type: happy
layer: e2e
covers: ["AC5: removing the product and adding it again gives a line with no message"]
priority: P1
---

# TC-GIFT-1-09: Removing the product and adding it again from its product page gives a line with no message

## Why

- AC5 says the message belongs to the line, not the product: a re-added product must not inherit the old message (for example from a cache or a leftover record). The flow spans the bag and the product page, so e2e.

## Preconditions

- Scenario `default`; `alice` has an empty basket.

## Steps

1. Sign in as `alice`, add item 99 ("Adventurer GPS Watch") to the bag, open `/cart`, choose "Add a gift message", type `Happy birthday, Sam!` and save.
2. On the "Adventurer GPS Watch" line click the "Remove" button (aria-label `Remove Adventurer GPS Watch from your bag`).
3. Open the product page of item 99 and add it to the bag.
4. Open `/cart`.

## Expected result

- After step 2 the bag has no "Adventurer GPS Watch" line.
- After step 4 the bag has one line "Adventurer GPS Watch" with quantity 1.
- That line shows the "Add a gift message" action, no "Edit" action and no quoted text; `Happy birthday, Sam!` does not appear on the page.
