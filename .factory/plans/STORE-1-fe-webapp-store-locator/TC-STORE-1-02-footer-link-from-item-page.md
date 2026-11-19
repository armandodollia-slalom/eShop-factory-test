---
id: TC-STORE-1-02
type: happy
layer: e2e
covers: ["AC1: Given a shopper on any page", "Outputs: footer link Store locator opens /stores"]
priority: P2
---

# TC-STORE-1-02: Footer link `Store locator` on a catalog item page also opens `/stores`

## Why

- AC1 says "on any page"; the footer href is relative (`stores`), so on a nested route such as `/item/99` a wrong base resolution would land on `/item/stores`. A second starting page catches that. e2e because it depends on the rendered layout and the base href.

## Preconditions

- Test stack with scenario `default`; catalog item 99 `Adventurer GPS Watch` exists; anonymous shopper.

## Steps

1. Open `/item/99`.
2. In the site footer, click the link with the text `Store locator`.

## Expected result

- The page URL path is `/stores`.
- The page has an `h1` with the text `Store locator`.
- The first listed store is `AdventureWorks Seattle` and the last is `AdventureWorks Denver`; four stores are listed.
