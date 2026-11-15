---
id: TC-BUG-40-04
type: happy
layer: e2e
covers: ["Expected: Name: A to Z stays as it is today"]
priority: P1
---

# TC-BUG-40-04: Name: A to Z stays the default order with no sort in the URL

## Why

- The ticket requires the default order to stay as it is. The fix moves sorting into the URL, so switching back to "Name: A to Z" must return to the plain catalog URL and today's page 1; a regression here would change the landing page for every visitor.

## Preconditions

- Scenario `default` loaded. New browser context.

## Steps

1. Open `BASE_URL` (`/`); read `.catalog-sort-value` and the 9 card names.
2. Click `#catalog-sort-trigger`, then the option named `Price: Low to High`; wait for the URL query `sort=price-asc`.
3. Click `#catalog-sort-trigger`, then the option named `Name: A to Z`.
4. Read the URL, `.catalog-sort-value` and the 9 card names.

## Expected result

- In step 1, `.catalog-sort-value` reads `Name: A to Z` and page 1 shows, in order: Adventurer GPS Watch, AeroLite Cycling Helmet, Alpine AlpinePack Backpack, Alpine Fusion Goggles, Alpine Peak Down Jacket, Alpine Tech Crampons, Apex Climbing Harness (`$89.99`), Apex Climbing Harness (`$99.99`), Arctic Shield Insulated Jacket.
- After step 3 the URL is `BASE_URL` + `/` with no `sort` and no `page` query parameter.
- In step 4, `.catalog-sort-value` reads `Name: A to Z`, the option `Name: A to Z` has `aria-selected="true"`, and the 9 card names are exactly the list from step 1 in the same order.
