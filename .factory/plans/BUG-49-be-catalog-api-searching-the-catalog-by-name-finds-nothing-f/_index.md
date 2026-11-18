---
story: BUG-49
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/253"
story-sha: 74642b38cb82
plan-sha: 498b1d64ea89
verified-score: 10
verified-at: "2026-11-18T02:25:32.848Z"
verified-by: test-planner@6ab9e852/council
automation-sha: 1b654f3c7441
automation-plan-sha: 498b1d64ea89
automation-score: 10
automation-verified-at: "2026-11-18T02:32:19.916Z"
---
# Test plan: BUG-49 Searching the catalog by name finds nothing for a word inside a product's name

Scope: the Catalog API name filter on `GET /api/catalog/items?name=...&api-version=2.0` must match the search text anywhere in a product's name (not only at the start), keep finding prefix matches, and keep its current case sensitivity. All cases run at the `functional` layer (`tests/Catalog.FunctionalTests`): the API in-process against a real Postgres seeded from the same demo catalog as the `default` test stack scenario. The real database matters because the bug lives in the SQL the name filter is translated to; no UI is involved.

Demo data used (names only; descriptions are not searched): exactly three names contain "Boots": "Explorer Frost Boots", "SummitRider Snowboard Boots", "Wanderer Black Hiking Boots". No name contains lowercase "boots". Only "Wanderer Black Hiking Boots" contains "Wanderer" or "Hiking Boots".

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-49-01 | Searching "Boots" lists all three boots with count 3 | happy | functional | Expected step 1 |
| TC-BUG-49-02 | Searching "Hiking Boots" lists Wanderer Black Hiking Boots | happy | functional | Expected step 2 |
| TC-BUG-49-03 | Searching the name prefix "Wanderer" still lists Wanderer Black Hiking Boots | happy | functional | Expected step 3 |
| TC-BUG-49-04 | Searching lowercase "boots" stays case-sensitive and finds nothing | happy | functional | Expected: letter case behaves as today |

## Out of scope

- Case-insensitive search: the story says it is tracked separately; only "case behaves as today" is checked (TC-BUG-49-04).
- The WebApp catalog UI: the bug is reported and fixed at the API; no browser flow changes.
- API versions other than 2.0 in the reproduction steps.

## No sad path

The story names no error outcome and changes none: it only widens which names a search matches. The one constraint it keeps (case sensitivity) is a happy-path check of preserved behaviour (TC-BUG-49-04), not an error.

## Open questions

- The v1 route `GET /api/catalog/items/by/{name}` shares the handler (Implementation Notes), but the ticket does not name it; no case asserts its contains-matching.
- Special characters in the search text (`%`, `_`, `\`) are not addressed by the story; whether they match literally is undefined.
- Pagination and ordering of search results beyond the default page are unchanged and not restated by the story.
