---
id: TC-BUG-49-01
type: happy
layer: functional
covers: ["Expected step 1: every product whose name contains Boots, count matching", "Steps to Reproduce 1"]
priority: P1
---

# TC-BUG-49-01: Searching "Boots" lists all three boots with count 3

## Why

- This is the reported bug: a word at the end of a name ("Boots") returned `count: 0` because the filter only matched name prefixes. Functional layer against real Postgres is the cheapest layer that runs the actual SQL translation of the filter; a unit test with in-memory LINQ would not catch a wrong SQL operator.

## Preconditions

- Catalog seeded with the demo catalog (101 items), as in the `default` scenario. Exactly three item names contain "Boots": "Explorer Frost Boots", "SummitRider Snowboard Boots", "Wanderer Black Hiking Boots".

## Steps

1. Anonymous `GET /api/catalog/items?name=Boots&api-version=2.0`.

## Expected result

- Status `200 OK`.
- `count` is `3`.
- `data` contains exactly three items whose `name` values are "Explorer Frost Boots", "SummitRider Snowboard Boots" and "Wanderer Black Hiking Boots" (each once).
- No item without "Boots" in its name is returned (products that only mention boots in the description, such as the Alpine Tech Crampons, are not included).
