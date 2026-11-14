---
id: TC-CAT-1-18
type: sad
sad-path: dependency-failure
layer: unit
covers: ["Implementation Notes: a failed brand-mates call (HTTP error, timeout, bad JSON) is logged and the page renders without the section"]
priority: P2
---

# TC-CAT-1-18: CatalogService.GetBrandMates surfaces HTTP errors and bad JSON as the exceptions the page handles

## Why

- The page swallows only HttpRequestException, TaskCanceledException and JsonException from the call. The call is made server-side by the WebApp, so a browser-level route intercept (`page.route`) can never make it fail and an e2e case is not reachable; the observable version is the service contract the page's catch depends on. Unit layer: in-process, stub HttpMessageHandler.

## Preconditions

- Scenario `brand-mates` (`extends: default`) adds brands 14 "Peak Gear", 15 "Solo Gear", 16 "Trail Co" and 17 "Twin Gear" and these `Catalog` rows (CatalogTypeId 1, PictureFileName `<id>.webp`):

| Id | Name | Price | AvailableStock | CatalogBrandId |
| --- | --- | --- | --- | --- |
| 1001 | Charlie Rope | 20.00 | 10 | 14 |
| 1002 | Beta Stove | 30.00 | 10 | 14 |
| 1003 | Delta Lamp | 15.50 | 10 | 14 |
| 1004 | Echo Boots | 45.00 | 0 | 14 |
| 1005 | Foxtrot Mat | 25.00 | 10 | 14 |
| 1006 | Zulu Pack | 60.00 | 10 | 14 |
| 1007 | alpha Tent | 120.00 | 10 | 14 |
| 1008 | Lone Compass | 12.00 | 10 | 15 |
| 1009 | Kilo Stick | 18.00 | 10 | 16 |
| 1010 | Juliet Cup | 9.50 | 10 | 16 |
| 1011 | India Rope | 22.00 | 10 | 16 |
| 1012 | Anchor | 5.00 | 10 | 17 |
| 1013 | Twin Mug | 7.00 | 10 | 17 |
| 1014 | Twin Mug | 8.00 | 10 | 17 |

No item with id 999999 exists.
- No database or stack. `CatalogService` is built over an `HttpClient` with a stub `HttpMessageHandler` and a base address; the `brand-mates` data above is not used.

## Steps

1. Handler returns `500` for `GET .../items/1001/brand-mates`; call `GetBrandMates(1001)`.
2. Handler returns `200` with body `not json`; call `GetBrandMates(1001)`.
3. Handler throws `TaskCanceledException` (timeout); call `GetBrandMates(1001)`.
4. Handler returns `200` with body `[]`; call `GetBrandMates(1001)`.

## Expected result

- Step 1: throws `HttpRequestException` with `StatusCode` 500.
- Step 2: throws `System.Text.Json.JsonException`.
- Step 3: throws `TaskCanceledException`.
- Step 4: returns an empty list.
