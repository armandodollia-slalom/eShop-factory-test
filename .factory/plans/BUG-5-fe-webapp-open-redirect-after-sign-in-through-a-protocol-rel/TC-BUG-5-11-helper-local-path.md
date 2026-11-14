---
id: TC-BUG-5-11
type: happy
layer: unit
covers: ["Code map: local return URL kept"]
priority: P1
---

# TC-BUG-5-11: ToLocalOrRoot keeps local paths unchanged

## Why

- Public static helper is the whole rule; unit layer is the cheapest that checks it exactly.

## Preconditions

- Unit test project for the WebApp (MSTest, no services); calls the public static method `eShop.WebApp.ReturnUrl.ToLocalOrRoot(string?)`.

## Steps

1. Call `ReturnUrl.ToLocalOrRoot("/user/orders")`.
2. Call `ReturnUrl.ToLocalOrRoot("/")`.

## Expected result

- Step 1 returns `/user/orders`.
- Step 2 returns `/`.
