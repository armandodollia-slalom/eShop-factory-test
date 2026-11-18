---
id: TC-BUG-49-02
type: happy
layer: functional
covers: ["Expected step 2: Hiking Boots lists Wanderer Black Hiking Boots", "Steps to Reproduce 2"]
priority: P1
---

# TC-BUG-49-02: Searching "Hiking Boots" lists Wanderer Black Hiking Boots

## Why

- Step 2 of the bug: a multi-word phrase (with an encoded space) from the middle/end of a name returned nothing. It is a separate case from TC-BUG-49-01 because it checks that the whole phrase is matched as one substring, including the space, not word by word. Functional layer for the real SQL translation.

## Preconditions

- Demo catalog seeded. Only "Wanderer Black Hiking Boots" contains the substring "Hiking Boots" in its name.

## Steps

1. Anonymous `GET /api/catalog/items?name=Hiking%20Boots&api-version=2.0`.

## Expected result

- Status `200 OK`.
- `count` is `1`.
- `data` has exactly one item, with `name` "Wanderer Black Hiking Boots".
