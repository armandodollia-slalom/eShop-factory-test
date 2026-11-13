---
id: TC-CAT-1-01
type: happy
layer: functional
covers: ["AC1", "Inputs: count default 4", "Outputs: 200 array, never item id itself, ordered by name", "Inputs: anonymous"]
priority: P1
---

# TC-CAT-1-01: Default call returns the four first other items of the brand, ordered by name, without the item itself

## Why

- AC1 and the core rule of the endpoint (default count 4, self excluded, ordinal name order, only the same brand). It is a functional case because it is an API contract against the real database. The target item "Aardvark Target" sorts first in its brand, so a missing exclusion would show up; the lowercase name "alpha lowercase pack" would sort early under a culture or case-insensitive order, so it also guards the ordinal rule at the cut-off.

## Preconditions

- Scenario `brand-mates` (extends `default`): brand "Brand Alpha" has items 1001 "Aardvark Target", 1002 "Bravo Pack", 1003 "Charlie Pack", 1004 "Delta Pack", 1005 "Echo Pack", 1006 "Foxtrot Pack", 1007 "alpha lowercase pack"; brand "Brand Beta" has 1011 "Aardvark Beta", 1012 "Bravo Beta", 1013 "Charlie Beta".
- No access token.

## Steps

1. `GET /api/catalog/items/1001/brand-mates?api-version=1.0` without an Authorization header.

## Expected result

- Status `200 OK`, JSON array of exactly 4 items.
- The item names in order are: "Bravo Pack", "Charlie Pack", "Delta Pack", "Echo Pack".
- No element has id 1001; no element has a name or id from "Brand Beta"; every element has the brand "Brand Alpha".
