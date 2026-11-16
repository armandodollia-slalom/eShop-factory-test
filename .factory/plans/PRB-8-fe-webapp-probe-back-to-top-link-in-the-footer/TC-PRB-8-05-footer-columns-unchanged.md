---
id: TC-PRB-8-05
type: happy
layer: e2e
covers: ["AC3: the footer's other links are unchanged"]
priority: P2
---

# TC-PRB-8-05: Footer link columns, brand and social links are unchanged

## Why

- AC3 forbids side effects on the rest of the footer. Pinning the existing links and their targets catches an accidental edit while adding the new item. It is separate from TC-PRB-8-06 because the columns and the bottom row are different regions that can break independently.

## Preconditions

- Test stack running with scenario `default`; anonymous shopper.

## Steps

1. Open `/`.
2. In `footer.eshop-footer`, read the navigation regions `Shop`, `Support` and `Company`, the brand link and the list `AdventureWorks on social media`.

## Expected result

- `Shop` lists, in order: `Shop all` (href `""`), `Shopping bag` (href `cart`), `My orders` (href `user/orders`), `New arrivals`, `Gift cards` (the last two with no href).
- `Support` lists, in order: `Help center`, `Shipping and returns`, `Track an order`, `Size guide`, `Contact us`, none with an href.
- `Company` lists, in order: `Our story`, `Careers`, `Sustainability`, `Store locator`, `Press`, none with an href.
- The brand link `AdventureWorks home` has href `""`.
- The social list has 4 links, in order `AdventureWorks on Instagram (opens in a new tab)`, `... on Facebook ...`, `... on X ...`, `... on YouTube ...`, each with `target="_blank"`.
- None of these regions contains a link named `Back to top`.
