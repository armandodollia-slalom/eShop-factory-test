---
id: TC-BUG-38-08
type: happy
layer: e2e
covers: ["Expected: nothing else in the footer changes (social links)"]
priority: P3
---

# TC-BUG-38-08: Social icons keep their hover highlight

## Why

- The fix edits the shared footer stylesheet, including the `a:not([href])` cursor rule that lists the social selector. A too-broad change could strip the social icons' hover. The ticket says nothing else in the footer changes, so one icon is checked as a sample. e2e because hover is browser-only.

## Preconditions

- Test stack running with scenario `bug-38` (extends `default`, adds no data); signed out.
- Browser viewport 1280×720.

## Steps

1. Open `/` and scroll the footer into view.
2. Hover the link with `aria-label="AdventureWorks on Instagram (opens in a new tab)"` in `ul.eshop-footer-social`.

## Expected result

- The link has `href` `https://www.instagram.com/` and `target` `_blank`.
- While hovered, the link has `background-color` `rgb(255, 255, 255)`.
- The link has `cursor` `pointer`.
- The `ul.eshop-footer-social` list contains exactly 4 links (Instagram, Facebook, X, YouTube), in that order.
