---
id: TC-BUG-38-06
type: happy
layer: e2e
covers: ["Repro step 3: click New arrivals", "Expected: nothing else in the footer changes"]
priority: P2
---

# TC-BUG-38-06: Clicking "New arrivals" leaves the page where it is

## Why

- Step 3 of the repro must still match Expected after the fix; removing the hover cue must not be done by turning the entry into a link to a missing page. Asserting the URL stays put guards against a broken navigation. e2e because it is a browser click.

## Preconditions

- Test stack running with scenario `default`; signed out.
- Browser viewport 1280×720.

## Steps

1. Open `/` and note the page URL.
2. Scroll the footer into view and click "New arrivals" in `nav[aria-label="Shop"]`.
3. Wait 1000 ms.

## Expected result

- The page URL is identical to the URL noted in step 1 (path `/`).
- No new page or tab opened (the browser context still has exactly one page).
- The footer is still visible and "New arrivals" still has no `href` attribute.
