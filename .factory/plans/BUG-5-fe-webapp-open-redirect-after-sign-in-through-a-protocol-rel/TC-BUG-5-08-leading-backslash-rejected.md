---
id: TC-BUG-5-08
type: sad
sad-path: validation
layer: unit
covers: ["Decisions: leading backslash rejected"]
priority: P1
---

# TC-BUG-5-08: `\evil.example` is replaced by `/`

## Why

- Browsers treat a leading backslash as a host separator.

## Preconditions

- No running services. The test calls `LogIn.LocalReturnUrl(string?)` (internal static, `src/WebApp/Components/Pages/User/LogIn.razor`) directly.

## Steps

1. Call `LogIn.LocalReturnUrl("\\evil.example")` (C# regular string literal; the runtime value is one backslash, then `evil.example`, so the leading-backslash rule is exercised, not an escape sequence).

## Expected result

- Returns exactly `"/"`.
