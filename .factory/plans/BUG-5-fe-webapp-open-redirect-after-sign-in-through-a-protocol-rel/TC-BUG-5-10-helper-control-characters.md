---
id: TC-BUG-5-10
type: sad
sad-path: validation
layer: unit
covers: ["Decisions: return URLs with control characters go to /"]
priority: P1
---

# TC-BUG-5-10: ToLocalOrRoot with a control character returns "/"

## Why

- Control characters (TAB, LF) are stripped by browsers and can turn a slash, TAB, slash, `evil.example` string into `//evil.example`; the story requires them to go to `/`.

## Preconditions

- Unit test project for the WebApp (MSTest, no services); calls the public static method `eShop.WebApp.ReturnUrl.ToLocalOrRoot(string?)`.

## Steps

1. Call `ReturnUrl.ToLocalOrRoot("/\t/evil.example")` (C# string literal: slash, TAB escape `\t`, slash, evil.example).
2. Call `ReturnUrl.ToLocalOrRoot("/item/5\n")` (C# string literal with a trailing LF escape `\n`).

## Expected result

- Step 1 returns the string `/`.
- Step 2 returns the string `/`.
