---
id: TC-PRB-7-02
type: happy
layer: e2e
covers: ["Expected: the same page as the footer's \"My orders\" link"]
priority: P2
---

# TC-PRB-7-02: "Track an order" and "My orders" footer links resolve to the same destination

## Why

- The Expected result ties the fix to the existing "My orders" footer link, not just to a path string. Comparing the resolved `href` of both rendered anchors guards against a near-miss (absolute vs relative path, typo, extra query) that would still differ from "My orders". It is e2e because only the rendered page resolves the relative `href` against the app's base URL.

## Preconditions

- Test stack running with scenario `default`.
- Signed in as `alice` / `Pass123$`.

## Steps

1. Open the WebApp home page (`/`) as signed-in `alice` and scroll to the footer.
2. Read the resolved `href` property (absolute URL) of the link with exact text "My orders" in the footer navigation named "Shop".
3. Read the resolved `href` property of the link with exact text "Track an order" in the footer navigation named "Support".

## Expected result

- Both `href` values are non-empty.
- The two `href` values are identical, and their path is `/user/orders`.
