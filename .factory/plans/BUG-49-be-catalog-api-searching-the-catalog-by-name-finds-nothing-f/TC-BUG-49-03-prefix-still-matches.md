---
id: TC-BUG-49-03
type: happy
layer: functional
covers: ["Expected step 3: Wanderer still lists Wanderer Black Hiking Boots, as today", "Steps to Reproduce 3"]
priority: P1
---

# TC-BUG-49-03: Searching the name prefix "Wanderer" still lists Wanderer Black Hiking Boots

## Why

- Regression guard: the fix must not break the search that already worked (text at the start of the name). Separate from TC-BUG-49-01/02 because a contains-only bug (for example matching only after a space) would fail here but pass there. Functional layer for the real SQL translation.

## Preconditions

- Demo catalog seeded. Only "Wanderer Black Hiking Boots" contains "Wanderer" in its name.

## Steps

1. Anonymous `GET /api/catalog/items?name=Wanderer&api-version=2.0`.

## Expected result

- Status `200 OK`.
- `count` is `1`.
- `data` has exactly one item, with `name` "Wanderer Black Hiking Boots".
