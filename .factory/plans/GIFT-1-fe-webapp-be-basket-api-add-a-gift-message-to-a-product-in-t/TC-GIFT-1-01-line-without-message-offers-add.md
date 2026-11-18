---
id: TC-GIFT-1-01
type: happy
layer: e2e
covers: ["AC1: line has an \"Add a gift message\" action", "AC1: a line without a message otherwise looks as today"]
priority: P1
---

# TC-GIFT-1-01: A bag line without a message offers "Add a gift message" and shows no message

## Why

- AC1 is the entry point of the feature and promises that a line without a message is otherwise unchanged; if the action is missing nothing else can be reached, and a stray quoted text or "Edit" on an empty line would be a visible regression. Only the rendered `/cart` page proves this, so e2e.

## Preconditions

- Scenario `default`; `alice` (password `Pass123$`) has an empty basket.

## Steps

1. Sign in as `alice`.
2. Open the product page of catalog item 99 ("Adventurer GPS Watch") and add it to the bag.
3. Open `/cart`.

## Expected result

- The bag shows exactly one line, "Adventurer GPS Watch", with quantity 1.
- That line shows an "Add a gift message" action.
- The line shows no quoted gift message text (no element with class `gift-message`) and no "Edit" action.
- The line still shows the product name, unit price, quantity input and line total as before this story.
