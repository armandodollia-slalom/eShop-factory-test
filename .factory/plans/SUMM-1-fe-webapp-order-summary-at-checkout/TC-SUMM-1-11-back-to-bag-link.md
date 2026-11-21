---
id: TC-SUMM-1-11
type: happy
layer: e2e
covers: ["AC5: the \"Back to the shopping bag\" link is unchanged"]
priority: P3
---

# TC-SUMM-1-11: "Back to the shopping bag" link still returns to /cart

## Why

- AC5 names the back link as unchanged. Moving markup to fit the summary could drop or retarget it. A single click on the rendered page is the cheapest proof.

## Preconditions

- Scenario `default`; alice's basket is empty.
- Signed in as alice (`alice` / `Pass123$`).
- On `/item/2` alice presses **Add to shopping bag** once.

## Steps

1. As alice, navigate to `/checkout`.
2. Click the link with text `Back to the shopping bag`.

## Expected result

- The URL path is `/cart`.
- The bag page lists 1 `.cart-item` whose `.name` is `Summit Pro Harness`.
