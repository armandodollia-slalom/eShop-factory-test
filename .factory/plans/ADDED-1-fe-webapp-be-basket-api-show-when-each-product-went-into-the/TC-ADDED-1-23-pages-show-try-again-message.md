---
id: TC-ADDED-1-23
type: sad
sad-path: concurrency
layer: unit
covers: ["FLOW-1-2", "AC1: the shopping bag still opens and shows its lines"]
priority: P1
---

# TC-ADDED-1-23: The shopping bag and product pages show a "Please try again" message instead of the error page when the basket update is still aborted

## Why

- Upheld gap FLOW-1-2: after the bounded retry fails, the shopper must see a non-crashing "please try again" message, not the error UI. The handling lives in `CartPage.razor` (`UpdateQuantityAsync`) and `ItemPage.razor` (`AddToCartAsync`), which catch the `Aborted` `RpcException` that TC-ADDED-1-22 shows `BasketState` raises. The test stack cannot be made to abort twice in a row deterministically, so the pages are rendered at the unit layer with bUnit over a real `BasketState` whose gRPC client is a substitute (both pages inject the concrete `BasketState`); the test project needs the bUnit package and a reference to `src/WebApp`.

## Preconditions

- bUnit `TestContext` with an authenticated user `buyer-1` registered as the `AuthenticationStateProvider` (a `ClaimsPrincipal` with an authenticated identity carrying the `sub` claim `buyer-1` and the `name` claim `buyer-1`); `BasketState` reads the buyer id from it (`BasketState.cs:122`).
- Registered services: the real `BasketState` built as in TC-ADDED-1-20 (real `BasketService` over a substitute `Basket.BasketClient`, the `AuthenticationStateProvider` above), a real `CatalogService` whose `HttpClient` uses a fake handler, a stub `IProductImageUrlProvider`, and a `NullLogger<ItemPage>`.
- The fake catalog handler answers:
  - `GET api/catalog/items/99` and `GET api/catalog/items/by?ids=99` with item 99 ("Adventurer GPS Watch", price 199.99);
  - `GET api/catalog/items/99/brand-mates` with 404 Not Found, which `ItemPage.LoadBrandMatesAsync` catches as an `HttpRequestException` (`ItemPage.razor:155-165`), so the page renders without the brand mates section.
- `ItemPage` gets a cascading `HttpContext` (`ItemPage.razor:128-129`): a `DefaultHttpContext` whose `User` is the same authenticated `ClaimsPrincipal` (`sub` = `buyer-1`), passed when rendering (`.AddCascadingValue<HttpContext>(httpContext)`). Without it `isLoggedIn` is false (`ItemPage.razor:137`) and `AddToCartAsync` navigates to the login page instead of calling the basket (`ItemPage.razor:191-195`).
- `GetBasketAsync` on the gRPC substitute always returns `[{product_id: 99, quantity: 1, added_at: 2026-11-20T10:00:00Z}]`.
- `UpdateBasketAsync` on the gRPC substitute throws `RpcException(new Status(StatusCode.Aborted, "factoryfake concurrent change"))` on every call (so the `BasketState` retry fails too, as in TC-ADDED-1-22).

## Steps

1. Render `CartPage`. bUnit does not bind posted form fields to `[SupplyParameterFromForm]` properties, so set them on the rendered instance first: `cut.Instance.UpdateQuantityId = 99` and `cut.Instance.UpdateQuantityValue = 3` (both are public settable properties, `CartPage.razor:124-128`, and `UpdateQuantityAsync` dereferences them with `!.Value` at `CartPage.razor:147-148`). Then submit the empty `update-cart` form rendered at `CartPage.razor:118` (the last `form` element in the markup, the only one without the `cart-quantity` class) with `.Submit()`.
2. Render `ItemPage` with `ItemId` = 99 and the cascading `HttpContext` above, confirm the button text is "Add to shopping bag" (the logged-in branch, `ItemPage.razor:47-56`), and submit the `form.add-to-cart` element with `.Submit()`.

## Expected result

- `UpdateBasketAsync` on the gRPC substitute was called exactly 2 times in each step.
- Neither render nor submit throws; no unhandled exception reaches the renderer.
- After step 1 the cart markup contains exactly one `p.basket-update-failed[role=alert]` with the text "Your shopping bag was changed at the same time, so this update was not saved. Please try again."; the line for "Adventurer GPS Watch" is still listed with quantity 1 and its "Added on 20 Nov 2026" text.
- After step 2 the item page markup contains exactly one `p.basket-update-failed[role=alert]` with the same text, and the product details for "Adventurer GPS Watch" are still shown.
- Before any failed update, neither page contains `.basket-update-failed`.
- After step 2 the bUnit `NavigationManager.Uri` is unchanged (no navigation to the login page).
