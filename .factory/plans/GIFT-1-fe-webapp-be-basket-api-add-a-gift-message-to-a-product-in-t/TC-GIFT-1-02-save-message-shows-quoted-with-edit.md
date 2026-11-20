---
id: TC-GIFT-1-02
type: happy
layer: e2e
covers: ["AC2: message shown under the product name, in quotes", "AC2: \"Edit\" action replaces \"Add a gift message\""]
priority: P1
---

# TC-GIFT-1-02: Saving a gift message shows it in quotes under the product name with an "Edit" action

## Why

- AC2 is the core happy path: write, save, see it. It is a full browser round trip (form post on the static SSR page, Basket API write, re-render), so only e2e exercises it end to end.

## Preconditions

- Scenario `default`; `alice` has an empty basket.

## Steps

1. Sign in as `alice`, add item 99 ("Adventurer GPS Watch") to the bag from its product page and open `/cart`.
2. On the "Adventurer GPS Watch" line choose "Add a gift message".
3. Type `Happy birthday, Sam!` into the message box.
4. Save the message.

## Expected result

- The page is `/cart` and the line "Adventurer GPS Watch" shows the text `"Happy birthday, Sam!"` (with the double quotes) under the product name.
- The line's action reads "Edit"; "Add a gift message" is no longer shown on that line.
- The quantity of the line is still 1.
