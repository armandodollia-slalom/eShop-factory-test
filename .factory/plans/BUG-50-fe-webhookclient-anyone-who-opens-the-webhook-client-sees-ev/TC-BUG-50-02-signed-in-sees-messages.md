---
id: TC-BUG-50-02
type: happy
layer: e2e
covers: ["Expected: signed in, the webhook client shows the received messages exactly as today"]
priority: P1
---

# TC-BUG-50-02: Signed-in user sees received messages with When, Data and Token as before

## Why

- The fix gates the messages list behind sign-in; this guards the other half of the contract, that a signed-in user still sees each received message with its When, Data and Token exactly as before. Without it, a fix that hid the list from everyone would pass TC-BUG-50-01. It must be e2e because it needs a real OIDC sign-in through Identity on the test stack.

## Preconditions

- Test stack running with scenario `default`; seeded user `alice` with password `Pass123$`.
- A run-unique order id `N` and a run-unique token `T` = `bug50-auth-<N>`.

## Steps

1. Deliver a message: `POST http://localhost:<webhookclient port>/webhook-received` with header `X-eshop-whtoken: <T>`, header `Content-Type: application/json` and body `{"when":"2026-11-18T00:50:00Z","payload":"{\"OrderId\":<N>,\"OrderStatus\":\"paid\"}","type":"OrderPaid"}`.
2. In a new browser context, open `http://localhost:<webhookclient port>/`, follow the webhook client's log-in link, and sign in on the Identity page as `alice` / `Pass123$`.
3. Back on the webhook client, open `http://localhost:<webhookclient port>/` and wait for the page to finish rendering.

## Expected result

- Step 1 returns HTTP 200.
- The page does not show "Log in to view webhook messages received".
- Under the heading "Webhook messages received (orders paid)" there is a grid with the column headers "When", "Data" and "Token", in that order.
- The grid has a row whose Data cell is exactly `{"OrderId":<N>,"OrderStatus":"paid"}` and whose Token cell is exactly `<T>`.
- That row's When cell shows the delivered timestamp 2026-11-18 00:50:00 UTC (as the grid formats a `DateTime`).
