---
id: TC-STORE-1-08
type: sad
sad-path: validation
layer: e2e
covers: ["Outputs: No stores in \"<text>\". (with the text as typed, trimmed)"]
priority: P2
---

# TC-STORE-1-08: No-match message shows the typed text trimmed: `Boston` with two spaces before and after gives `No stores in "Boston".`

## Why

- The output rule says the message echoes the text "as typed, trimmed"; an implementation that echoes the raw value would show the spaces inside the quotes. Separate from TC-STORE-1-05 because it checks the trimming of the echoed text, not the empty state itself.

## Preconditions

- Test stack with scenario `default`; anonymous shopper.

## Steps

1. Open `/stores`.
2. Fill the text box labeled `City` with two spaces, then `Boston`, then two spaces (10 characters: space, space, B, o, s, t, o, n, space, space).
3. Click the button labeled `Find stores`.

## Expected result

- The page shows the exact text `No stores in "Boston".`
- The text `No stores in "  Boston` does not appear on the page.
- None of the four store names appears on the page.
