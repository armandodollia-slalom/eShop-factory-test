---
id: TC-STORE-1-01
type: happy
layer: e2e
covers: ["Outputs: footer link Store locator opens /stores", "Outputs: heading Store locator", "Outputs: store table (order, name, address, city, hours)", "AC1"]
priority: P1
---

# TC-STORE-1-01: Footer link `Store locator` opens the store locator with the heading and all four stores in order

## Why

- AC1 is the entry point of the whole feature: the footer link, the `/stores` route, the heading and the fixed store list with exact text and order. A wrong href, a reordered array or a typo in an address or in the en-dash hours would all break it. It needs the real layout (footer) and routing, so it is an e2e case on the test stack.

## Preconditions

- Test stack with scenario `default`; anonymous shopper (not signed in).

## Steps

1. Open `/` (the catalog home page).
2. In the site footer, click the link with the text `Store locator`.

## Expected result

- The page URL path is `/stores` (no `city` query parameter).
- The page has an `h1` with the text `Store locator`.
- Exactly four stores are listed, in this order, each showing these exact texts:
  1. `AdventureWorks Seattle`, `1200 Pine St`, `Seattle`, `Mon–Sat 9:00–20:00`
  2. `AdventureWorks Redmond`, `15700 NE 61st Ct`, `Redmond`, `Mon–Fri 10:00–19:00`
  3. `AdventureWorks Portland`, `800 SW Broadway`, `Portland`, `Mon–Sun 10:00–18:00`
  4. `AdventureWorks Denver`, `1600 16th St`, `Denver`, `Tue–Sun 9:00–17:00`
- The text `No stores in` does not appear on the page.
