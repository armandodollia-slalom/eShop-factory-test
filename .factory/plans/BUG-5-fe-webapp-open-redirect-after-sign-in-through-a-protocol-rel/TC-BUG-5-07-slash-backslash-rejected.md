---
id: TC-BUG-5-07
type: sad
sad-path: validation
layer: unit
covers: ["Technical Notes: / followed by backslash"]
priority: P0
---

# TC-BUG-5-07: `/\evil.example` is replaced by `/`

## Why

- Browsers normalise a backslash to a slash, so this is the same open redirect.

## Preconditions

- No running services. The test calls `LogIn.LocalReturnUrl(string?)` (internal static, `src/WebApp/Components/Pages/User/LogIn.razor`) directly.

## Steps

1. Call `LogIn.LocalReturnUrl("/\\evil.example")` (C# regular string literal; the runtime value is a slash, one backslash, then `evil.example`).

## Expected result

- Returns exactly `"/"`.
