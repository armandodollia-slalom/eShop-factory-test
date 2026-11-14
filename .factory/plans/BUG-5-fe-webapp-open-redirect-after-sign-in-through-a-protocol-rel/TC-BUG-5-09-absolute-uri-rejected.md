---
id: TC-BUG-5-09
type: sad
sad-path: validation
layer: unit
covers: ["Decisions: absolute URIs of any scheme rejected"]
priority: P0
---

# TC-BUG-5-09: Absolute URI `https://evil.example/` is replaced by `/`

## Why

- The original absolute-URI protection must still hold after the rewrite.

## Preconditions

- No running services. The test calls `LogIn.LocalReturnUrl(string?)` (internal static, `src/WebApp/Components/Pages/User/LogIn.razor`) directly.

## Steps

1. Call `LogIn.LocalReturnUrl("https://evil.example/")`.

## Expected result

- Returns exactly `"/"`.
