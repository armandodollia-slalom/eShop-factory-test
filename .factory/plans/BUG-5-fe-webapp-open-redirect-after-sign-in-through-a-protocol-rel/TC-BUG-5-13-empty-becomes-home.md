---
id: TC-BUG-5-13
type: sad
sad-path: boundary
layer: unit
covers: ["Decisions: empty values rejected"]
priority: P2
---

# TC-BUG-5-13: An empty returnUrl is replaced by `/`

## Why

- The empty string (`?returnUrl=`) is a distinct input from null.

## Preconditions

- No running services. The test calls `LogIn.LocalReturnUrl(string?)` (internal static, `src/WebApp/Components/Pages/User/LogIn.razor`) directly.

## Steps

1. Call `LogIn.LocalReturnUrl("")`.

## Expected result

- Returns exactly `"/"`.
