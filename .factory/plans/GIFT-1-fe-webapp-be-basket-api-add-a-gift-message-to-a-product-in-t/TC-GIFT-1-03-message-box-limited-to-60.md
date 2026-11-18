---
id: TC-GIFT-1-03
type: sad
sad-path: boundary
layer: e2e
covers: ["AC6: the box does not let me type more than 60 characters", "AC2: message of up to 60 characters"]
priority: P1
---

# TC-GIFT-1-03: The message box stops at 60 characters and a 60-character message is saved whole

## Why

- AC6 is the only stated limit and it is a property of the box in the browser; the boundary is checked just outside (61 typed) and exactly at the limit (60 kept and saved), so a shopper's longest allowed message is not truncated or refused. Only a real browser enforces typing limits, so e2e.

## Preconditions

- Scenario `default`; `alice` has an empty basket.
- Text A (61 characters): `ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ12345678` (60 characters) followed by `X`.

## Steps

1. Sign in as `alice`, add item 99 ("Adventurer GPS Watch") to the bag and open `/cart`.
2. On the line choose "Add a gift message".
3. Type text A key by key into the message box.
4. Save the message.

## Expected result

- After step 3 the message box contains exactly `ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ12345678` (60 characters); the 61st character `X` was not entered.
- After step 4 the line shows `"ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ12345678"` under the product name, with all 60 characters, and an "Edit" action.
- No error message is shown.
