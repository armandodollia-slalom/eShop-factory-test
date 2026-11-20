---
id: TC-ADDED-1-19
type: happy
layer: e2e
covers: ["AC4: a basket stored before this change still loads; its lines show no date", "Implementation Notes: nothing for a line without a date"]
priority: P1
---

# TC-ADDED-1-19: A shopping bag line stored before the change shows no "Added on" text

## Why

- AC4 says old lines "show no date". The API cases (TC-ADDED-1-10, TC-ADDED-1-12) prove `added_at` is absent, but cannot detect the WebApp rendering a default date (for example `Added on 1 Jan 0001`) or an empty "Added on" label. Only the e2e layer checks what the shopper sees. The scenarios seed Postgres only, so the spec writes the legacy Redis value itself.

## Preconditions

- Test stack running scenario `default`; Redis reachable on the stack's `redis` port, authenticated with the stack's `REDIS_PASSWORD` setting.
- Before the browser opens the bag, the spec writes key `/basket/50ddac7e-9b69-4d68-a91b-25100ef2e403` (alice's user id from the scenario) with the pre-change JSON `{"BuyerId":"50ddac7e-9b69-4d68-a91b-25100ef2e403","Items":[{"Id":"1","ProductId":99,"ProductName":"Adventurer GPS Watch","UnitPrice":0,"OldUnitPrice":0,"Quantity":1,"PictureUrl":""}]}` (no `AddedAt`), and deletes the key after the test.

## Steps

1. Sign in to the WebApp as `alice`.
2. Open the shopping bag page (`/cart`).

## Expected result

- The page loads with no error message and shows exactly one line, "Adventurer GPS Watch", quantity 1.
- That line contains no element with class `added-on` and no text "Added on".
- The page body contains no text "Added on".
