---
id: TC-BUG-38-01
type: happy
layer: e2e
covers: ["Expected: footer entries that open a page keep their hover highlight", "Repro step 2: hover Shop all"]
priority: P1
---

# TC-BUG-38-01: "Shop all", "Shopping bag" and "My orders" turn white with a pointer cursor on hover

## Why

- The fix narrows the hover rule to entries with an href; if the selector were too narrow, the entries that do navigate would lose their highlight, which the ticket explicitly forbids. Hover colour and cursor exist only in a rendered browser, so this is e2e.

## Preconditions

- Test stack running with scenario `default`; signed out.
- Browser viewport 1280×720.

## Steps

1. Open `/` and scroll the footer (`footer.eshop-footer`) into view.
2. Read the computed `color` of the link "Shop all" inside `nav[aria-label="Shop"]` while the mouse is away from the footer.
3. Hover "Shop all".
4. Repeat steps 2–3 for "Shopping bag" and "My orders" in `nav[aria-label="Shop"]`.

## Expected result

- Before hover, each of the three links has `color` `rgba(255, 255, 255, 0.66)`.
- While hovered, each link has `color` `rgb(255, 255, 255)`.
- Each link has `cursor` `pointer`.
- The links have `href` attributes `""` ("Shop all"), `cart` ("Shopping bag") and `user/orders` ("My orders").
