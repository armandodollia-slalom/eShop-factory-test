---
id: TC-BUG-34-06
type: happy
layer: e2e
covers: ["Expected: signing in with a return URL on Identity.API itself behaves as it does today (authorization request)"]
priority: P1
---

# TC-BUG-34-06: Sign-in from an authorization request still returns to the authorize callback

## Why

- Every client of the shop signs in through an OIDC authorization request whose return URL is Identity.API's own `/connect/authorize/callback`; the ticket requires such return URLs to keep working. Breaking this branch would break sign-in for the WebApp and every API token. It uses the `orderingswaggerui` implicit client that the existing stack specs already sign in with, and runs at e2e because the authorization context only exists on the running identity server.

## Preconditions

- Test stack up with scenario `default`; user `alice` with password `Pass123$` exists.
- Client `orderingswaggerui` is registered with redirect URI `http://ordering-api:8080/swagger/oauth2-redirect.html` (as on the stack).
- A fresh browser context with no Identity.API cookies.

## Steps

1. Open `${identity}/connect/authorize?client_id=orderingswaggerui&response_type=token&scope=orders&redirect_uri=http%3A%2F%2Fordering-api%3A8080%2Fswagger%2Foauth2-redirect.html&state=bug34`; the browser lands on `${identity}/Account/Login` with a `ReturnUrl` that starts with `/connect/authorize/callback`.
2. Fill `Username` with `alice` and `Password` with `Pass123$`.
3. Click `Login` and capture the response to `POST ${identity}/Account/Login` and the response to `GET ${identity}/connect/authorize/callback`.

## Expected result

- The `POST /Account/Login` response has status `302` and its `Location` header starts with `/connect/authorize/callback?`.
- The `GET /connect/authorize/callback` response has status `302` and its `Location` header starts with `http://ordering-api:8080/swagger/oauth2-redirect.html#` and contains a non-empty `access_token` parameter and `state=bug34`.
