---
id: TC-ACCT-1-04
type: happy
layer: e2e
covers: ["AC2: name \"Alice Smith\"", "AC2: email \"AliceSmith@email.com\"", "AC2: address \"15703 NE 61st Ct, Redmond, WA 98052, U.S.\""]
priority: P1
---

# TC-ACCT-1-04: Account page shows alice's name, email and shipping address

## Why

- The core value of the story: the shopper sees the details orders are placed with. It checks the name join (first + last), the email claim and the exact address format ("street, city, state zip, country"), which is the same address checkout fills in. Values come from the identity claims of a real sign-in, so e2e.

## Preconditions

- Scenario `default`: alice has Name "Alice", LastName "Smith", Email "AliceSmith@email.com", Street "15703 NE 61st Ct", City "Redmond", State "WA", ZipCode "98052", Country "U.S.".
- `alice` signed in on the WebApp.

## Steps

1. Navigate to `/user/account`.

## Expected result

- The page shows the text "Alice Smith".
- The page shows the text "AliceSmith@email.com".
- The page shows the text "15703 NE 61st Ct, Redmond, WA 98052, U.S." exactly (single string, in this order and punctuation).
