---
id: TC-ORDD-1-08
type: sad
sad-path: auth
layer: e2e
covers: ["Outputs: visitor not signed in is sent to the sign-in page, as for My orders", "AC5"]
priority: P1
---

# TC-ORDD-1-08: Visitor not signed in is sent to the sign-in page

## Why

- AC5: the details page must require sign-in like My orders. Without it an anonymous visitor would reach the page (and the API call would fail or leak). e2e because the redirect goes through the WebApp's OIDC challenge to Identity.

## Preconditions

- Scenario `ordd-1`: bob owns order 1.
- A fresh browser context with no cookies (not signed in).

## Steps

1. Navigate to `/user/orders/1`.

## Expected result

- The browser ends on the Identity sign-in page: its URL is on the Identity.API host with path `/Account/Login`, and the page shows the username and password fields.
- No `Order details` header and none of order 1's content (`Wanderer Black Hiking Boots`, `15703 NE 61st Ct`) is shown.
