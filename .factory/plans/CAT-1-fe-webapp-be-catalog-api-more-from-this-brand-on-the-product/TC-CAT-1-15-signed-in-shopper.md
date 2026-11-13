---
id: TC-CAT-1-15
type: happy
layer: e2e
covers: ["AC6: a shopper signed in or not"]
priority: P2
---

# TC-CAT-1-15: Signed-in shopper sees the same section

## Why

- AC6 says signed in or not. The section should not depend on identity; one case with the seeded user alice guards against an authenticated-only or anonymous-only code path.

## Preconditions

- Scenario `brand-mates` loaded; user alice / `Pass123$`.

## Steps

1. Sign in as alice through the WebApp login.
2. Open `/item/203`.

## Expected result

- The heading "More from Mates Co" is shown with the same 4 cards as TC-CAT-1-13: "Alpha Tent", "Bravo Tent", "Delta Tent", "Echo Tent".
