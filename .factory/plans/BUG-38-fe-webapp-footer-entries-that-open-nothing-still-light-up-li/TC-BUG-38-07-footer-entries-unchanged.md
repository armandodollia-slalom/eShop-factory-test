---
id: TC-BUG-38-07
type: happy
layer: e2e
covers: ["Expected: nothing else in the footer changes: same entries, same order, same text"]
priority: P1
---

# TC-BUG-38-07: Footer shows the same entries in the same order with the same text and targets

## Why

- The ticket constrains the fix to styling: the footer content must be identical. A fix that removed placeholder entries or turned them into spans with different text would hide the hover while breaking this rule. Checked through the rendered page so it reflects what users see.

## Preconditions

- Test stack running with scenario `bug-38` (extends `default`, adds no data); signed out.
- Browser viewport 1280×720.

## Steps

1. Open `/` and scroll the footer into view.
2. Read the text of every `a` element, in document order, inside `nav[aria-label="Shop"]`, `nav[aria-label="Support"]`, `nav[aria-label="Company"]` and `ul[aria-label="Legal"]`.

## Expected result

- `nav[aria-label="Shop"]` heading is `Shop` and its links are exactly `Shop all`, `Shopping bag`, `My orders`, `New arrivals`, `Gift cards`.
- `nav[aria-label="Support"]` heading is `Support` and its links are exactly `Help center`, `Shipping and returns`, `Track an order`, `Size guide`, `Contact us`.
- `nav[aria-label="Company"]` heading is `Company` and its links are exactly `Our story`, `Careers`, `Sustainability`, `Store locator`, `Press`.
- `ul[aria-label="Legal"]` links are exactly `Privacy`, `Terms`, `Cookies`.
- Only "Shop all" (`href=""`), "Shopping bag" (`href="cart"`) and "My orders" (`href="user/orders"`) carry an `href` among these 18 entries.
