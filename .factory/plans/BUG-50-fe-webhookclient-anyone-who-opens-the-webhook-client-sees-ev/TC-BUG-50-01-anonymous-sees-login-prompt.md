---
id: TC-BUG-50-01
type: sad
sad-path: auth
layer: e2e
covers: ["Steps to Reproduce 1-2", "Expected: step 2 shows no received message and no token", "Expected: the messages section asks the visitor to log in, as the registered webhooks section does", "Actual: step 2 lists the received message with its data and its token"]
priority: P1
---

# TC-BUG-50-01: Anonymous visitor sees a log-in prompt instead of received messages and tokens

## Why

- This is the bug itself: a visitor who is not signed in could read every received webhook message and its token. It reproduces the ticket's exact steps (deliver a message, open the home page in a fresh, signed-out browser context) and fails if any message data or token reaches the page. It must be e2e because the leak is what an unauthenticated browser sees on the Blazor page; a fresh context stands in for the private window.

## Preconditions

- Test stack running with scenario `default`; webhook client reachable at `http://localhost:${WEBHOOKSCLIENT_HOST_PORT:-28086}`.
- A run-unique order id `N` (for example derived from the current time) and a run-unique token `T` = `bug50-anon-<N>`.

## Steps

1. Deliver a message: `POST http://localhost:<webhookclient port>/webhook-received` with header `X-eshop-whtoken: <T>`, header `Content-Type: application/json` and body `{"when":"2026-11-18T00:50:00Z","payload":"{\"OrderId\":<N>,\"OrderStatus\":\"paid\"}","type":"OrderPaid"}`, with no cookies and no authorization.
2. In a new browser context with no cookies (not signed in), open `http://localhost:<webhookclient port>/` and wait for the page to finish rendering.

## Expected result

- Step 1 returns HTTP 200 (the message is stored, so a leak would be visible if the page still had it).
- The page title is "Order management".
- Under the heading "Webhook messages received (orders paid)", the page shows the text "Log in to view webhook messages received".
- Under the heading "Registered webhooks", the page shows the text "Log in to view or edit webhook registrations" (the reference prompt the messages section now matches).
- The page has no grid (no `table`) under "Webhook messages received (orders paid)" and no column headers "When", "Data" or "Token".
- The page text does not contain the token `<T>`.
- The page text does not contain `"OrderId":<N>` nor the string `OrderStatus`.
- The page does not show "None yet received".
