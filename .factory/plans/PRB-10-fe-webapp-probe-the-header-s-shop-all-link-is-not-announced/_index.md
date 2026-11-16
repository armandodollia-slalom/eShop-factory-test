---
story: PRB-10
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/190"
story-sha: 42da23a06c8e
plan-sha: 709ab4b7ada6
verified-score: 9
verified-at: "2026-11-16T16:06:40.855Z"
verified-by: test-planner@d8121b51/67b01306
automation-sha: e1096c2e2709
automation-plan-sha: 709ab4b7ada6
automation-score: 10
automation-verified-at: "2026-11-16T17:04:19.619Z"
---
# Test plan: PRB-10 The header's "Shop all" link is not announced as the current page

Scope: the `aria-current` attribute of the header's "Shop all" link (`header nav[aria-label="Primary"] a`, text "Shop all") in the WebApp. On the catalog page (`/`) it must be `aria-current="page"`; on a product page, the shopping bag and My orders it must have no `aria-current` attribute at all. Its text ("Shop all"), destination (the store root) and look (the `is-current` class on the catalog page only) must be unchanged. The behaviour is rendered markup seen by a browser, so every case runs on the `e2e` layer (Playwright on the test stack, scenario `default`); there is no API or service logic to test at a cheaper layer. The three "no aria-current" cases (03, 04, 05) are the sad side of the rule: they sit just outside the catalog-page boundary and prove the attribute is not announced where the story forbids it.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-PRB-10-01 | "Shop all" has aria-current="page" on the catalog page | happy | e2e | Expected: aria-current="page" on the catalog page; Steps 1-2 |
| TC-PRB-10-02 | "Shop all" keeps its text, destination and is-current look on the catalog page | happy | e2e | Expected: text, destination and look unchanged (catalog page) |
| TC-PRB-10-03 | "Shop all" has no aria-current on a product page | sad | e2e | Expected: no aria-current on a product page; Step 3 |
| TC-PRB-10-04 | "Shop all" has no aria-current on the shopping bag | sad | e2e | Expected: no aria-current on the shopping bag |
| TC-PRB-10-05 | "Shop all" has no aria-current on My orders | sad | e2e | Expected: no aria-current on My orders |
| TC-PRB-10-06 | "Shop all" keeps its text and destination and has no is-current look on a product page | happy | e2e | Expected: text, destination and look unchanged (other pages) |
| TC-PRB-10-07 | aria-current follows in-app navigation from the catalog to a product and back | happy | e2e | Steps 1-3 as a user navigates; Expected on both pages |

## Out of scope

- Any page other than the catalog, a product page, the shopping bag and My orders (checkout, login, logout): the story names only these.
- Visual regression (pixel comparison) of the header: "look unchanged" is checked through the link's CSS classes, which drive its styling.
- Other header links and controls (brand logo, user menu, cart menu).

## Open questions

- The story says "the catalog page" without saying whether filtered or paged catalog URLs (for example `/?brand=2` or `/?page=2`) count. They render the same Catalog page component, so the most literal reading is that they get `aria-current="page"` too, but no case asserts it.
- "On every other page" lists a product page, the shopping bag and My orders as examples; checkout and the login page are not planned (see Out of scope).
