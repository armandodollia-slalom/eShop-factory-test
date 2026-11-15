---
id: TC-PRB-6-01
type: happy
layer: e2e
covers: ["Expected: accessible name 'Remove Wanderer Black Hiking Boots from your shopping bag'", "Steps to Reproduce 1-3", "Acceptance Criteria"]
priority: P1
---

# TC-PRB-6-01: Remove button is named "Remove Wanderer Black Hiking Boots from your shopping bag"

## Why

- This is the bug's acceptance criterion verbatim: repeating the reproduction steps must yield the accessible name "Remove Wanderer Black Hiking Boots from your shopping bag" instead of "… from your bag". The name is set in Razor markup and computed by the browser's accessibility tree, so only an e2e test through the WebApp observes it; it also asserts the old name is gone so a regression back to "bag" fails.

## Preconditions

- Test stack running with scenario `default`: user `alice` (password `Pass123$`) with an empty basket; catalog item 1 is "Wanderer Black Hiking Boots" ($109.99).

## Steps

1. Open the WebApp, sign in as `alice` / `Pass123$`.
2. Open the product page of item 1 ("Wanderer Black Hiking Boots", `/item/1`) and click "Add to shopping bag".
3. Navigate to `/cart`.
4. Locate the line for "Wanderer Black Hiking Boots" and read the accessible name of its remove button (`getByRole('button', { name: 'Remove Wanderer Black Hiking Boots from your shopping bag', exact: true })`).

## Expected result

- The `/cart` page shows exactly one line, "Wanderer Black Hiking Boots".
- Exactly one button with the exact accessible name "Remove Wanderer Black Hiking Boots from your shopping bag" is present and visible.
- No button with the accessible name "Remove Wanderer Black Hiking Boots from your bag" exists on the page (`getByRole('button', { name: 'Remove Wanderer Black Hiking Boots from your bag', exact: true })` has count 0).
