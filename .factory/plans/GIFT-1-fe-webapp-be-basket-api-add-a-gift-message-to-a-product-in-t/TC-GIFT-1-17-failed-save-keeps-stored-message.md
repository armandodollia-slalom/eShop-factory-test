---
id: TC-GIFT-1-17
type: sad
sad-path: validation
layer: e2e
kept-for: SOL-1
covers: ["AC3: the line shows the message it has until a save succeeds", "Upheld finding SOL-1: a failed save keeps the stored message and shows an inline error"]
priority: P1
---

# TC-GIFT-1-17: A rejected save keeps the stored message under the product name and shows an inline error

## Why

- Regression case for the upheld finding SOL-1: when the Basket API refuses a save, the line must keep showing the stored message (not the refused text) and tell the shopper inline, instead of failing the page or pretending the save worked. The only way to make a save fail from the browser is a message over 60 characters, which needs the box's `maxlength` removed in the DOM; the visible result and its persistence after reload are browser behaviour, so e2e.

## Preconditions

- Scenario `default`; `alice` has an empty basket.
- Text L (61 characters): `ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ123456789`.

## Steps

1. Sign in as `alice`, add item 99 ("Adventurer GPS Watch") to the bag, open `/cart`, choose "Add a gift message", type `Happy birthday, Sam!` and save.
2. On the line choose "Edit".
3. In the DOM, remove the `maxlength` attribute from the input with aria-label `Gift message for Adventurer GPS Watch`.
4. Fill that input with text L and click the line's "Save" button.
5. Reload `/cart`.

## Expected result

- After step 4 the page is `/cart` (no error page) and the line's gift message editor is open and shows the alert `We couldn't save your gift message. Please try again.`
- After step 4 the line still shows `"Happy birthday, Sam!"` (with the quotes) under the product name; text L does not appear as a quoted message.
- After step 5 the line shows `"Happy birthday, Sam!"` under the product name and an "Edit" action; the alert text is not on the page and text L does not appear.
- The line's quantity is 1 after steps 4 and 5.
