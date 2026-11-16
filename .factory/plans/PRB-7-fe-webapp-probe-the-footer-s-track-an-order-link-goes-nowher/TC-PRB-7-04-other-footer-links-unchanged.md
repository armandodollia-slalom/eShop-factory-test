---
id: TC-PRB-7-04
type: happy
layer: e2e
covers: ["Expected: every other footer link is unchanged"]
priority: P2
---

# TC-PRB-7-04: Every other footer link is unchanged

## Why

- The Expected result requires the fix to touch only "Track an order". The regressions it guards against are giving placeholder links destinations, removing links, or changing existing destinations. The baseline below is the footer as it is on `main` (`src/WebApp/Components/Layout/FooterBar.razor`); it is checked on the rendered page, so e2e.

## Preconditions

- Test stack running with scenario `default`.
- Signed in as `alice` / `Pass123$`.

## Steps

1. Open the WebApp home page (`/`) as signed-in `alice` and scroll to the footer.
2. For every link inside `footer.eshop-footer`, record its text (or `aria-label` when it has no text) and its `href` attribute (or that it has none).

## Expected result

- Brand link (`aria-label` "AdventureWorks home"): `href=""`.
- Social links: Instagram `https://www.instagram.com/`, Facebook `https://www.facebook.com/`, X `https://x.com/`, YouTube `https://www.youtube.com/`, each with `target="_blank"`.
- Shop navigation, in order: "Shop all" `href=""`; "Shopping bag" `href="cart"`; "My orders" `href="user/orders"`; "New arrivals" and "Gift cards" with no `href` attribute.
- Support navigation: "Help center", "Shipping and returns", "Size guide", "Contact us" have no `href` attribute ("Track an order" is covered by TC-PRB-7-01 and TC-PRB-7-02).
- Company navigation: "Our story", "Careers", "Sustainability", "Store locator", "Press" have no `href` attribute.
- Legal list: "Privacy", "Terms", "Cookies" have no `href` attribute.
- The footer contains no links other than the ones listed above plus "Track an order".
