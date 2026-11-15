---
story: STORE-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/128"
story-sha: afbc01b1c21e
plan-sha: 059b74267717
verified-score: 10
verified-at: "2026-11-15T09:59:28.837Z"
verified-by: test-planner@1edb523e/67b01306
automation-sha: 6def87b4cca3
automation-plan-sha: 059b74267717
automation-score: 10
automation-verified-at: "2026-11-15T10:09:17.178Z"
---
# Test plan: STORE-1 [FE - WebApp] - Store locator

Scope: the footer link `Store locator`, the `/stores` page (heading and the fixed list of four stores with exact name, street address, city and opening hours, in order), and the `City` filter (case-insensitive, trimmed, city-prefix match) submitted with `Find stores` and carried in the URL as `?city=<text>`, including the exact no-match message. The stores are a fixed list in the WebApp with no backend, so every case runs at the `e2e` layer through the WebApp on the test stack (there is no WebApp unit test project and no API to test at the functional layer). All cases use scenario `default` and an anonymous shopper.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-STORE-1-01 | Footer link `Store locator` opens the store locator with the heading and all four stores in order | happy | e2e | Outputs: footer link Store locator opens /stores; Outputs: heading Store locator; Outputs: store table (order, name, address, city, hours); AC1 |
| TC-STORE-1-02 | Footer link `Store locator` on a catalog item page also opens `/stores` | happy | e2e | AC1: Given a shopper on any page; Outputs: footer link Store locator opens /stores |
| TC-STORE-1-03 | Typing `red` in City and pressing Find stores lists only AdventureWorks Redmond and puts `city=red` in the URL | happy | e2e | AC2; Inputs: City prefix filter, case-insensitive; Outputs: Find stores puts `?city=<text>` in URL |
| TC-STORE-1-04 | Opening `/stores?city=PORT` directly lists only AdventureWorks Portland | happy | e2e | AC3; Inputs: City kept in URL as `?city=<text>`; Inputs: ignoring letter case; Outputs: opening that URL shows the same filtered list |
| TC-STORE-1-05 | Searching for `Boston` shows `No stores in "Boston".` and no store | sad | e2e | AC4; Outputs: `No stores in "<text>".` and no store |
| TC-STORE-1-06 | Clearing City on `/stores?city=red` and pressing Find stores lists all four stores again | happy | e2e | AC5; Inputs: Empty shows every store |
| TC-STORE-1-07 | City text with surrounding spaces (`den` with two spaces before and after) lists only AdventureWorks Denver | happy | e2e | Inputs: ignoring surrounding spaces |
| TC-STORE-1-08 | No-match message shows the typed text trimmed: `Boston` with two spaces before and after gives `No stores in "Boston".` | sad | e2e | Outputs: `No stores in "<text>".` (with the text as typed, trimmed) |
| TC-STORE-1-09 | A text that occurs inside a city but not at its start (`land`) matches no store | sad | e2e | Inputs: city starts with the text |
| TC-STORE-1-10 | The whole city name `Seattle` (longest matching prefix) lists only AdventureWorks Seattle | happy | e2e | Inputs: city starts with the text (boundary: whole city name) |
| TC-STORE-1-11 | The text `Seattles` (one character past the city name) matches no store | sad | e2e | Inputs: city starts with the text (boundary: text longer than city) |
| TC-STORE-1-12 | Opening `/stores?city=` lists all four stores | happy | e2e | Inputs: Empty shows every store; Inputs: Kept in the page URL as `?city=<text>` |

## Out of scope

- Backend, API or persistence of stores: the story fixes the list in the page (no service), so there are no functional or unit cases.
- Authentication: the page is public; the story states no rule that limits who may view it.
- Visual styling, layout and responsiveness beyond the stated texts and order (left to the PR check design review).

## Open questions

- Whether the `City` text box is pre-filled with the `city` query value on load (for example `red` on `/stores?city=red`). The story implies it (AC5 says "clear City") but does not state it; TC-STORE-1-06 fills the box with an empty string so it passes either way, and no case asserts the pre-filled value.
- Whether the URL written by `Find stores` keeps the raw typed text (`?city=++den++`) or the trimmed text. The story says only that the URL carries `?city=<text>`; TC-STORE-1-07 and TC-STORE-1-08 assert the list and message, not the URL.
- Characters that need URL encoding or HTML escaping in the no-match message (for example `<b>` or `"`), and very long input: the story sets no maximum length and no escaping rule.
- Whether whitespace-only input (`   `) is treated as empty (all stores) or as a search: trimming implies all stores, but the story does not say what the message would be, so no case is written.
- The accessible role of each store entry (list item, table row, card) is not specified; cases assert visible texts and their order only.
