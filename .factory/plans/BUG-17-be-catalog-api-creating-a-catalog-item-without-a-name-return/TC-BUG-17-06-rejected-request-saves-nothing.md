---
id: TC-BUG-17-06
type: sad
sad-path: validation
layer: functional
covers: ["Implementation Notes: nothing saved, no embedding"]
priority: P1
---

# TC-BUG-17-06: A rejected nameless request leaves the catalog unchanged

## Why

- Notes promise nothing is saved on rejection; a regression could validate after Add and leave a tracked entity. Needs the real database to observe persisted state.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items, brand 1 and type 1 exist); no authentication needed.

## Steps

1. `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=1` and record `count`.
2. `POST /api/catalog/items?api-version=2.0` with body as in TC-BUG-17-01 but `"description":"BUG17-NO-NAME-MARKER"` and no `name`.
3. Repeat step 1.
4. `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=200` and look for an item whose description is `BUG17-NO-NAME-MARKER`.

## Expected result

- Step 2 returns 400.
- The `count` from step 3 equals the one from step 1 (101 on the default scenario).
- No item has description `BUG17-NO-NAME-MARKER`.
