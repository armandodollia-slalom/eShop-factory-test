---
id: TC-BUG-5-15
type: happy
layer: unit
covers: ["Decisions: base-relative URLs stay allowed"]
priority: P1
---

# TC-BUG-5-15: Base-relative `item/5` is returned unchanged

## Why

- LogIn.Url(nav) produces values without a leading slash; rejecting them would break the sign-in links.

## Preconditions

- No running services. The test calls `LogIn.LocalReturnUrl(string?)` (internal static, `src/WebApp/Components/Pages/User/LogIn.razor`) directly.

## Steps

1. Call `LogIn.LocalReturnUrl("item/5")`.

## Expected result

- Returns exactly `"item/5"`.
