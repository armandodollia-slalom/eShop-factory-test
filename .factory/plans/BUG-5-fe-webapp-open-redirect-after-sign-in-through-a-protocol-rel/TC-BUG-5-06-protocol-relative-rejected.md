---
id: TC-BUG-5-06
type: sad
sad-path: validation
layer: unit
covers: ["Technical Notes: reject leading //"]
priority: P0
---

# TC-BUG-5-06: Protocol-relative `//evil.example` is replaced by `/`

## Why

- Core of the fix; unit is the cheapest layer because the helper is pure.

## Preconditions

- No running services. The test calls `LogIn.LocalReturnUrl(string?)` (internal static, `src/WebApp/Components/Pages/User/LogIn.razor`) directly.

## Steps

1. Call `LogIn.LocalReturnUrl("//evil.example")`.

## Expected result

- Returns exactly `"/"`.
