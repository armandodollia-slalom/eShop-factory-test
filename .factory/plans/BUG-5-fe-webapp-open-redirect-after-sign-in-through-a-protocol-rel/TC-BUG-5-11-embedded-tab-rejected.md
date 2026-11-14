---
id: TC-BUG-5-11
type: sad
sad-path: validation
layer: unit
covers: ["Decisions: control characters rejected"]
priority: P1
---

# TC-BUG-5-11: Slash, tab, slash, host (`"/\t/evil.example"`) is replaced by `/`

## Why

- Browsers strip tabs, so this becomes `//evil.example`.

## Preconditions

- No running services. The test calls `LogIn.LocalReturnUrl(string?)` (internal static, `src/WebApp/Components/Pages/User/LogIn.razor`) directly.

## Steps

1. Call `LogIn.LocalReturnUrl("/\t/evil.example")` (`\t` is the C# escape for one tab character).

## Expected result

- Returns exactly `"/"`.
