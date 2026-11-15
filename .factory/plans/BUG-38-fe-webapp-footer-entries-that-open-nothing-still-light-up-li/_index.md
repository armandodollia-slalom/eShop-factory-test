---
story: BUG-38
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/144"
story-sha: af9269017bb0
plan-sha: 0d00814cb101
verified-score: 10
verified-at: "2026-11-15T13:01:16.114Z"
verified-by: test-planner@1edb523e/67b01306
automation-sha: 90b20b5a6851
automation-plan-sha: 0d00814cb101
automation-score: 10
automation-verified-at: "2026-11-15T13:09:24.107Z"
---
# Test plan: BUG-38 [FE - WebApp] - Footer entries that open nothing still light up like links on hover

Scope: the WebApp footer (`FooterBar`) on the home page `/` of the test stack, signed out, at the default Playwright viewport 1280×720. Footer entries without a page to open must keep their normal colour and the default arrow cursor on hover; "Shop all", "Shopping bag", "My orders" and "Help center" keep turning white (`rgb(255, 255, 255)`) on hover; clicking "New arrivals" does nothing; the footer's entries, order and text, and the social icons, are unchanged. Hover colour and cursor are only observable in a real browser, so every case is `e2e` (Playwright, `e2e/teststack/`), scenario `default`. Colours are read with Playwright `toHaveCSS` (which retries, so the colour transition has finished when it passes).

Reference values from `FooterBar.razor.css`: column entries rest at `rgba(255, 255, 255, 0.66)`, legal entries rest at `rgba(255, 255, 255, 0.55)`, the hover highlight is `rgb(255, 255, 255)`.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-38-01 | "Shop all", "Shopping bag" and "My orders" turn white with a pointer cursor on hover | happy | e2e | Expected: entries that open a page keep their hover highlight; Repro step 2 ("Shop all") |
| TC-BUG-38-02 | "New arrivals" keeps its colour and the default cursor on hover | sad | e2e | Expected: entry with no page does not change on hover; Repro step 2 ("New arrivals") |
| TC-BUG-38-03 | "Privacy" keeps its colour and the default cursor on hover | sad | e2e | Expected: entry with no page does not change on hover; Repro step 2 ("Privacy") |
| TC-BUG-38-04 | Every other footer entry with no page keeps its colour and the default cursor on hover | sad | e2e | Expected: any footer entry with no page does not change on hover |
| TC-BUG-38-05 | "Help center" turns white on hover and keeps the default cursor | happy | e2e | Expected: "Help center" keeps its hover highlight as today; Repro step 2 ("Help center") |
| TC-BUG-38-06 | Clicking "New arrivals" leaves the page where it is | happy | e2e | Repro step 3; Actual "nothing happens" stays true |
| TC-BUG-38-07 | Footer shows the same entries in the same order with the same text and targets | happy | e2e | Expected: nothing else in the footer changes (entries, order, text) |
| TC-BUG-38-08 | Social icons keep their hover highlight | happy | e2e | Expected: nothing else in the footer changes (social links untouched) |

## Out of scope

- Unit and functional tests: the fix is CSS and markup only; there is no API or server behaviour to test.
- Keyboard focus styling of footer entries: the ticket says nothing about focus; entries without an href are not focusable today.
- Mobile layouts (900px and 560px breakpoints): the ticket reproduces on the default desktop page; the hover rules are not breakpoint-specific.
- Signed-in users: the footer is identical for signed-in and signed-out users; the ticket does not mention identity.

## Open questions

- The ticket says "Help center" keeps its hover highlight "as today" but does not state its cursor. TC-BUG-38-05 asserts the default arrow, matching today's behaviour (the existing `a:not([href])` rule) and the Implementation Notes; confirm this is intended.
- The ticket gives the click outcome only as the Actual ("nothing happens"); it does not ask for the entries to become pages. TC-BUG-38-06 asserts the click keeps doing nothing.
