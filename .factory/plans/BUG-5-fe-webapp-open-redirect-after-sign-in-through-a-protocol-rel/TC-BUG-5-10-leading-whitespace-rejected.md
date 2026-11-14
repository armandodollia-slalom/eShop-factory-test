---
id: TC-BUG-5-10
type: sad
sad-path: validation
layer: unit
covers: ["Decisions: whitespace rejected"]
priority: P1
---

# TC-BUG-5-10: Leading-space `" //evil.example"` is replaced by `/`

## Why

- Browsers and Uri strip leading whitespace, which would re-create the protocol-relative form.

## Preconditions

- No running services. The test calls `LogIn.LocalReturnUrl(string?)` (internal static, `src/WebApp/Components/Pages/User/LogIn.razor`) directly.

## Steps

1. Call `LogIn.LocalReturnUrl(" //evil.example")`.

## Expected result

- Returns exactly `"/"`.
