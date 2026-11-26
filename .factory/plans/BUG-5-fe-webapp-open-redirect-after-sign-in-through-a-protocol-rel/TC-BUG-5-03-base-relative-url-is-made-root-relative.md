---
id: TC-BUG-5-03
type: happy
layer: e2e
covers: ["Decisions: LogIn.Url sends base-relative return URLs"]
priority: P1
---

# TC-BUG-5-03: Base-relative returnUrl produced by LogIn.Url (item/99) lands on the item page

## Why

- LogIn.Url (used by UserMenu and ItemPage) emits URLs without a leading slash; the fix must keep them working, and the real caller path needs a browser.

## Preconditions

- Test stack running (`factory teststack up`) with scenario `default`; WebApp at http://localhost:18080.
- User alice (password `Pass123$`) exists; browser is signed out.
- Catalog item 99 ("Adventurer GPS Watch") exists.

## Steps

1. Open `http://localhost:18080/user/login?returnUrl=item%2F99`.
2. Sign in as `alice` / `Pass123$`.

## Expected result

- After sign-in the browser URL is `http://localhost:18080/item/99`.
