---
id: TC-HINT-1-13
type: happy
layer: e2e
covers: ["AC4: Token column shows \"None\" when the webhook has no token", "AC4: seeded rows show hints, never whole tokens"]
priority: P1
---

# TC-HINT-1-13: The home page Token column shows "None" for a webhook without a token and hints for the others

## Why

- AC4's "None" branch can't be produced through `/add-webhook` (it requires a token), so it is seeded; seeding also lets one view prove every row shows a hint (long and short tokens), not just the one just registered.

## Preconditions

- Test stack up with scenario `hint-1` (see `_index.md`), whose `webhooksdb.sql` gives alice three subscriptions: destination `http://receiver.test/long` token `fake-token-3c4d`; destination `http://receiver.test/short` token `wxyz`; destination `http://receiver.test/none` token NULL.

## Steps

1. Sign in to the webhooks client as `alice` (`Pass123$`) and open the home page.
2. Read the Token cell of each row of the **Registered webhooks** grid.

## Expected result

- Row `http://receiver.test/long`: Token `…3c4d`.
- Row `http://receiver.test/short`: Token `…`.
- Row `http://receiver.test/none`: Token `None`.
- The page text contains neither `fake-token-3c4d` nor `wxyz`.
