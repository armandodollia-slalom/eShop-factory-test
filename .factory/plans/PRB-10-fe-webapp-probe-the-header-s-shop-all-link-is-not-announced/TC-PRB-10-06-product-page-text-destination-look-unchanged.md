---
id: TC-PRB-10-06
type: happy
layer: e2e
covers: ["Expected: its text, destination and look are unchanged (other pages)"]
priority: P2
---

# TC-PRB-10-06: "Shop all" keeps its text and destination and has no is-current look on a product page

## Why

- "Text, destination and look unchanged" applies on every page. On non-catalog pages the link must still lead to the catalog and must not gain the current-page highlight. Clicking it proves the destination end to end rather than only reading the `href`.

## Preconditions

- Test stack running with scenario `default`; item 99 "Adventurer GPS Watch" exists.
- Anonymous browser session.

## Steps

1. Open `/item/99`.
2. Read the "Shop all" link in `header nav[aria-label="Primary"]`: its text, `href` and `class`.
3. Click the link.

## Expected result

- Before the click: text is exactly `Shop all`; `href` attribute is the empty string; `class` contains `eshop-topnav-link` and does not contain `is-current`.
- After the click: the URL path is `/` and the catalog is shown (product cards are listed).
