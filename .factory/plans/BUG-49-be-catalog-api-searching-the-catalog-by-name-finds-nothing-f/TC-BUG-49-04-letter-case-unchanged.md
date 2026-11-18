---
id: TC-BUG-49-04
type: happy
layer: functional
covers: ["Expected: the letter case of the search text behaves exactly as today"]
priority: P2
---

# TC-BUG-49-04: Searching lowercase "boots" stays case-sensitive and finds nothing

## Why

- The story requires case handling to stay exactly as today (case-sensitive; case-insensitive search is tracked separately). A fix using `ToLower`/`ILIKE` would make "boots" return the three boots, silently changing behaviour; this case catches that. Today "boots" returns no items, and with contains-matching it must still return none because no name contains lowercase "boots". Functional layer because case sensitivity depends on the SQL the database runs.

## Preconditions

- Demo catalog seeded. No item name contains the lowercase substring "boots" (the three names contain "Boots"; lowercase "boots" appears only in descriptions, which are not searched).

## Steps

1. Anonymous `GET /api/catalog/items?name=boots&api-version=2.0`.

## Expected result

- Status `200 OK`.
- `count` is `0`.
- `data` is an empty array; in particular "Explorer Frost Boots", "SummitRider Snowboard Boots" and "Wanderer Black Hiking Boots" are not returned.
