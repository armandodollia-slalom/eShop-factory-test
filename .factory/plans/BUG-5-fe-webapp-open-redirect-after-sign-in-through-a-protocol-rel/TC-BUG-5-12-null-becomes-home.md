---
id: TC-BUG-5-12
type: sad
sad-path: boundary
layer: unit
covers: ["Expected: / when return URL is not local"]
priority: P1
---

# TC-BUG-5-12: A null returnUrl is replaced by `/`

## Why

- The query parameter is absent in the common case, so null is the most frequent input.

## Preconditions

- No running services. The test calls `LogIn.LocalReturnUrl(string?)` (internal static, `src/WebApp/Components/Pages/User/LogIn.razor`) directly.

## Steps

1. Call `LogIn.LocalReturnUrl(null)`.

## Expected result

- Returns exactly `"/"`.
