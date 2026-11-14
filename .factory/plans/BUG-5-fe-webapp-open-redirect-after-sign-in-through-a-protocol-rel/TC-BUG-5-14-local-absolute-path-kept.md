---
id: TC-BUG-5-14
type: happy
layer: unit
covers: ["Decisions: local paths stay allowed"]
priority: P1
---

# TC-BUG-5-14: Local path `/item/5` is returned unchanged

## Why

- Regression guard: the fix must not reject legitimate local paths.

## Preconditions

- No running services. The test calls `LogIn.LocalReturnUrl(string?)` (internal static, `src/WebApp/Components/Pages/User/LogIn.razor`) directly.

## Steps

1. Call `LogIn.LocalReturnUrl("/item/5")`.

## Expected result

- Returns exactly `"/item/5"`.
