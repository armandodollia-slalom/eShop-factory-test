---
id: TC-PRB-1-01
type: happy
layer: e2e
covers: ["Expected: tab title is \"Shopping bag | AdventureWorks\"", "Acceptance Criteria", "Steps to Reproduce 1-2"]
priority: P1
---

# TC-PRB-1-01: Shopping bag tab title reads "Shopping bag | AdventureWorks"

## Why

- This is the bug itself: the `/cart` tab title must be exactly `Shopping bag | AdventureWorks`, with a lower-case "b", matching the page's other wording. Only a real browser on the test stack observes `document.title` set by Blazor's `<PageTitle>`, so the case runs at the e2e layer, repeating the story's Steps to Reproduce.

## Preconditions

- The test stack is running with scenario `default`.
- Seeded user `alice` (password `Pass123$`) exists and her basket is empty.

## Steps

1. Open the WebApp root `/`, follow the sign-in link and sign in on the Identity login page with Username `alice` and Password `Pass123$`.
2. Navigate to `/cart`.
3. Read the page title (`page.title()`).

## Expected result

- The browser is on path `/cart` (not redirected to the Identity login page).
- The page title is exactly `Shopping bag | AdventureWorks` (case-sensitive string equality).
- The page title is not `Shopping Bag | AdventureWorks`.
