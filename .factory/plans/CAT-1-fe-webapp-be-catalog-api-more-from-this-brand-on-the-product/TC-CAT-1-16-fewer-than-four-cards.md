---
id: TC-CAT-1-16
type: happy
layer: e2e
covers: ["Outputs: up to four product cards (fewer than four available)"]
priority: P3
---

# TC-CAT-1-16: Brand with fewer than four other items shows only those cards

## Why

- "Up to four": the page must render a short list without placeholders or errors. Cheap because it reuses the page flow with the Duo brand.

## Preconditions

- Scenario `brand-mates` loaded; brand 22 has items 220 and 221.

## Steps

1. Open `/item/220`.

## Expected result

- Heading "More from Duo Brand" is shown.
- Exactly 1 card is shown: "Duo Two".
