---
id: TC-BUG-17-07
type: happy
layer: functional
covers: ["Regression: valid update unchanged"]
priority: P2
---

# TC-BUG-17-07: PUT v2 with a name still updates the item

## Why

- Guards the update path against the new validator rejecting good input.

## Preconditions

- Same fixture and scenario; catalog item 1 exists.

## Steps

1. `GET /api/catalog/items/1?api-version=2.0` and take the body.
2. `PUT /api/catalog/items/1?api-version=2.0` with that body, changing `name` to `BUG-17 Renamed`.
3. `GET /api/catalog/items/1?api-version=2.0`.

## Expected result

- Step 2 returns 201.
- `name` in step 3 is `BUG-17 Renamed`.
