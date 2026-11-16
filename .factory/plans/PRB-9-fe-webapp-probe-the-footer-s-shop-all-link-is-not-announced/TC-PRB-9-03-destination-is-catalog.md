---
id: TC-PRB-9-03
type: happy
layer: e2e
covers: ["Expected: its destination (the catalog) is unchanged"]
priority: P1
---

# TC-PRB-9-03: Footer "Shop all" link still opens the catalog

## Why

- The story requires the link's destination to stay the catalog (the WebApp's root page `/`). Starting from a different page proves the click actually navigates to the catalog rather than merely staying on it. Navigation is only observable in the browser, so e2e.

## Preconditions

- Test stack running (`factory teststack up`) with scenario `default` (item 99 is "Adventurer GPS Watch").
- Anonymous visitor (no sign-in).

## Steps

1. Open the item page `/item/99` and wait until the heading "Adventurer GPS Watch" is visible.
2. In the footer navigation landmark named "Shop", click the link with accessible name "Shop all products".

## Expected result

- The page URL path becomes `/` (the WebApp base URL, no further path segment).
- The catalog page is shown: its product grid renders at least one catalog item card linking to an `/item/<id>` page.
- The item page heading "Adventurer GPS Watch" is no longer displayed as the page's main heading.
