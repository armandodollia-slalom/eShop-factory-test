---
id: TC-BUG-5-16
type: happy
layer: unit
covers: ["Technical Notes: single leading slash"]
priority: P2
---

# TC-BUG-5-16: The root path `/` is returned unchanged

## Why

- Boundary of the double-slash rule: one slash is local, two are not.

## Preconditions

- No running services. The test calls `LogIn.LocalReturnUrl(string?)` (internal static, `src/WebApp/Components/Pages/User/LogIn.razor`) directly.

## Steps

1. Call `LogIn.LocalReturnUrl("/")`.

## Expected result

- Returns exactly `"/"`.
