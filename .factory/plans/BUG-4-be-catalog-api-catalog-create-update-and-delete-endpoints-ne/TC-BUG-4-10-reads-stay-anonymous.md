---
id: TC-BUG-4-10
type: happy
layer: e2e
covers: ["Implementation code map: reads unchanged and anonymous", "Project context: Catalog reads are anonymous"]
priority: P1
---

# TC-BUG-4-10: Catalog reads stay anonymous after the fix

## Why

- Adding authentication to Catalog.API risks a global fallback policy that would also lock the storefront out of browsing. Only writes may require a token; the WebApp reads the catalog anonymously. Runs on the deployed stack where the authentication middleware is real.

## Preconditions

- Test stack up with scenario `default`; item 99 is "Adventurer GPS Watch".

## Steps

1. With no `Authorization` header, `GET {catalog}/api/catalog/items/99?api-version=2.0`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items?api-version=2.0&pageSize=10&pageIndex=0`.

## Expected result

- Step 1 returns `200` with `name` `"Adventurer GPS Watch"`.
- Step 2 returns `200` with `pageSize` `10` and a `data` array of 10 items.
