---
id: TC-BUG-40-08
type: happy
layer: e2e
covers: ["Expected: the chosen sort stays selected on every page and after a reload"]
priority: P1
---

# TC-BUG-40-08: The chosen sort stays selected on a later page and after a reload

## Why

- Before the fix the selected label was restored by script; now it is rendered from `?sort`. A reload of a deep page must render the same label, `aria-selected` state and server-sorted cards, or the user sees a mismatch between the control and the order.

## Preconditions

- Scenario `default` loaded. New browser context.

## Steps

1. Open `BASE_URL` (`/`).
2. Click `#catalog-sort-trigger`, then the option named `Price: High to Low`.
3. Click the link with aria-label `Next page`; read `.catalog-sort-value`, the `aria-selected` of option `Price: High to Low`, and the first card.
4. Reload the page (`page.reload()`).
5. Read the URL, `.catalog-sort-value`, the `aria-selected` of option `Price: High to Low` and of option `Name: A to Z`, `.page-status`, and the first card.

## Expected result

- In step 3 the URL query contains `sort=price-desc` and `page=2`, `.catalog-sort-value` reads `Price: High to Low`, option `Price: High to Low` has `aria-selected="true"`, and the first card is Raven Swift Snowboard `$349.00`.
- In step 5 the URL query still contains `sort=price-desc` and `page=2`, `.catalog-sort-value` reads `Price: High to Low`, option `Price: High to Low` has `aria-selected="true"`, option `Name: A to Z` has `aria-selected="false"`, `.page-status` reads `2 / 12`, and the first card is Raven Swift Snowboard `$349.00`.
