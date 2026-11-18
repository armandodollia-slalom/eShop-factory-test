---
story: SHIP-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/284"
story-sha: 332dfffd1f06
plan-sha: 61cd523c4aea
verified-score: 9
verified-at: "2026-11-18T13:48:13.275Z"
verified-by: test-planner@6ab9e852/council
automation-sha: c46ed2eac43c
automation-plan-sha: 61cd523c4aea
automation-score: 10
automation-verified-at: "2026-11-18T13:57:05.240Z"
---
# Test plan: SHIP-1 [FE - WebApp, BE - Ordering API] Show where each order ships in My orders

Scope: the two new fields `city` and `country` on each item of the Ordering API's order list (`GET /api/orders?api-version=1.0`, the signed-in user's orders), the unchanged existing fields of that list, and the "Ships to" column of My orders (`/user/orders`) in the WebApp, including the empty state and phone width. Orders cannot be saved in the Ordering functional host (see Project context), so every case that needs a placed order runs on the `e2e` layer: API cases call the Ordering API on the test stack with a bearer token for `alice` (as `e2e/teststack/bug-30.spec.ts` does for `bob`), UI cases sign in to the WebApp. Every case starts from scenario `default` (no orders) and places its own orders with `POST /api/orders?api-version=1.0` as `alice`, a fresh `x-requestid` GUID per order, and this body (only the address fields vary; they are given in each case):

`{"userId":"<alice subject id>","userName":"alice","city":"<city>","street":"<street>","state":"<state>","country":"<country>","zipCode":"<zip>","cardNumber":"4012888888881881","cardHolderName":"Alice Smith","cardExpiration":"2030-12-31T00:00:00Z","cardSecurityNumber":"123","cardTypeId":2,"buyer":"alice","items":[{"id":"1","productId":99,"productName":"Adventurer GPS Watch","unitPrice":10.0,"oldUnitPrice":10.0,"quantity":1,"pictureUrl":null}]}`

The order total of that body is 10.00 (one unit at 10.00).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-SHIP-1-01 | The order list returns each order's city and country as entered at checkout | happy | e2e | AC1, AC2, Implementation Notes: city and country added to the list |
| TC-SHIP-1-02 | The order list keeps every existing field with its name and value | happy | e2e | AC4, Implementation Notes: add fields, do not rename or remove |
| TC-SHIP-1-03 | My orders shows a "Ships to" column with the order's city and country | happy | e2e | AC1, Decisions: City, Country between Date and Total |
| TC-SHIP-1-04 | Two orders with different addresses each show their own city and country | happy | e2e | AC2 |
| TC-SHIP-1-05 | A shopper with no orders sees the unchanged empty state | happy | e2e | AC3 |
| TC-SHIP-1-06 | Number, date, total and status columns show the same values as before | happy | e2e | AC4 |
| TC-SHIP-1-07 | At phone width "Ships to" takes its row's full width, short values stay on one line, and the page does not scroll sideways | happy | e2e | AC5 |

## Out of scope

- Placing an order and the order's stored address (`POST /api/orders`, `GET /api/orders/{orderId}`): the story says they are unchanged; they are only used as setup.
- The other WebApp pages and the native client app (`src/ClientApp`): the story changes only My orders.
- Video recording itself: the e2e cases are recorded by the Playwright config as usual.

## No sad path

The story only adds two fields to the order list and one column to My orders. It names no error outcome, adds no input, and changes no existing error: signing in to My orders and the authentication and per-user filtering of `GET /api/orders` are untouched, and the story states no new rule about them. Writing a 401 or cross-user case would test existing behaviour the story does not mention, so no sad case is planned (see Open questions).

## Open questions

- An order whose stored address has no city or no country: the story does not say what "Ships to" shows (the current markup would render a lone comma). Orders are always placed with both fields at checkout, so no case is planned.
- Whether another user's orders (and their addresses) could appear in the list: the list's per-user filter is existing behaviour the story does not restate; no case is planned. A reviewer who wants a privacy regression case should add one that places an order as `bob` and checks `alice`'s list.
- How the date column is formatted is whatever My orders shows today; TC-SHIP-1-06 compares it with the API's `date` rendered by `DateTime.ToString()` in the WebApp's culture (what `@order.Date` produces today) rather than a format the story defines.
