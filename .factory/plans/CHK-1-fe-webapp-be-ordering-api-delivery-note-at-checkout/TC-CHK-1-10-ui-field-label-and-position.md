---
id: TC-CHK-1-10
type: happy
layer: e2e
covers: ["Outputs: checkout page field, label and position"]
priority: P2
---

# TC-CHK-1-10: Checkout shows a multi-line field labeled Delivery note (optional) between the address fields and Place order

## Why

- The output fixes the exact label, multi-line type and position; only a browser run can verify the rendered layout.

## Preconditions

- Scenario `chk-1` (extends `default`, see `_index.md`): alice has item 99 "Adventurer GPS Watch" quantity 1 in her basket; no orders exist.
- Browser signed in as alice (password `Pass123$`).

## Steps

1. Open the WebApp cart and press the checkout link so the browser is on the checkout page.

## Expected result

- A `textarea` is labeled exactly `Delivery note (optional)`.
- In document order the textarea comes after the address fields (the Address, City, State, Country and Zip code inputs) and before the `Place order` button.
- The textarea is empty.
