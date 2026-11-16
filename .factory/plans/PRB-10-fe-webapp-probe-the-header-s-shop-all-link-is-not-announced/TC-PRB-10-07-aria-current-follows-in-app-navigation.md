---
id: TC-PRB-10-07
type: happy
layer: e2e
covers: ["Steps to Reproduce 1-3 as a user navigates", "Expected: aria-current=\"page\" on the catalog only"]
priority: P1
---

# TC-PRB-10-07: aria-current follows in-app navigation from the catalog to a product and back

## Why

- The reproduction steps move from the catalog to a product page. The WebApp uses Blazor enhanced navigation, which patches the existing DOM instead of reloading it, so a stale `aria-current="page"` could survive on the product page (or fail to come back) even when direct loads (TC-01, TC-03) are right. Only a browser driving real clicks exercises this.

## Preconditions

- Test stack running with scenario `default`; item 99 "Adventurer GPS Watch" is listed on the catalog's first page or reachable through it.
- Anonymous browser session.

## Steps

1. Open `/`.
2. Check the "Shop all" link in `header nav[aria-label="Primary"]`.
3. Click a product card's link on the catalog to open its product page (in-app navigation, no `page.goto`).
4. Check the "Shop all" link again.
5. Click the "Shop all" link.
6. Check the "Shop all" link again.

## Expected result

- Step 2: `aria-current` is `page`.
- Step 4: the URL path matches `/item/<id>`; the link has no `aria-current` attribute (`getAttribute('aria-current')` returns `null`) and its class does not contain `is-current`.
- Step 6: the URL path is `/`; `aria-current` is `page` again and the class contains `is-current`.
