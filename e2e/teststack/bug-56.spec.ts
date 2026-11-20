import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-56: POST /api/orders/draft answers 400 problem details for a line with a quantity below 1 or a negative unit price,
// and still 200 for a valid draft. Scenario `bug-56` (.factory/stack/scenarios/bug-56): the demo user alice (Pass123$), no orders.
// The boundary and multi-line cases (TC-BUG-56-04, -06 to -09) are in tests/Ordering.FunctionalTests/OrderDraftLineValidationTests.cs.
test.describe.configure({ mode: 'serial' });

const DRAFT = () => `${url('ordering')}/api/orders/draft?api-version=1.0`;
const PROBLEM_JSON = 'application/problem+json';
const BUYER_ID = '9e3163b9-1ae6-4652-9dc6-7898ab7b7a00';
const QUANTITY_DETAIL = 'The quantity of each item must be at least 1.';
const PRICE_DETAIL = 'The unit price of an item cannot be negative.';
// The only redirect URI identity registers for this client on the stack (OrderingApiClient); it resolves only inside the compose network.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';

let token = '';

test.beforeAll(() => {
  loadScenario('bug-56');
});

// Step 1 of the ticket: sign in as alice and get an access token for the Ordering API (scope `orders`).
// The "orderingswaggerui" client uses the implicit flow: signing in returns the access token in the redirect fragment.
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const authorize = new URL(`${url('identity')}/connect/authorize`);
  authorize.search = new URLSearchParams({
    client_id: 'orderingswaggerui',
    response_type: 'token',
    scope: 'orders',
    redirect_uri: REDIRECT,
    state: 'bug56',
  }).toString();
  await page.goto(authorize.toString());
  await page.getByPlaceholder('Username').fill('alice');
  await page.getByPlaceholder('Password').fill('Pass123$');
  const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
  await page.getByRole('button', { name: 'Login' }).click();
  const location = (await callback).headers()['location'] ?? '';
  token = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
  await context.close();
  expect(token).not.toBe('');
});

const headers = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

const line = (unitPrice: number, quantity: number) => ({
  id: '1',
  productId: 99,
  productName: 'Adventurer GPS Watch',
  unitPrice,
  oldUnitPrice: unitPrice,
  quantity,
  pictureUrl: '',
});

async function postDraft(request: import('@playwright/test').APIRequestContext, unitPrice: number, quantity: number) {
  return request.post(DRAFT(), { headers: headers(), data: { buyerId: BUYER_ID, items: [line(unitPrice, quantity)] } });
}

async function expectProblem(response: import('@playwright/test').APIResponse, detail: string) {
  expect(response.status()).toBe(400);
  expect(response.headers()['content-type']?.split(';')[0].trim()).toBe(PROBLEM_JSON);
  const text = await response.text();
  expect(text.trim()).not.toBe('');
  const problem = JSON.parse(text);
  expect(problem.status).toBe(400);
  expect(problem.detail).toBe(detail);
  expect(problem).not.toHaveProperty('orderItems');
  expect(problem).not.toHaveProperty('total');
}

test('TC-BUG-56-01 a valid draft is answered with 200 and the computed draft', async ({ request }) => {
  await test.step('POST /api/orders/draft for product 99, quantity 2, unit price 10', async () => {
    const response = await postDraft(request, 10, 2);
    expect(response.status()).toBe(200);
    const draft = await response.json();
    expect(draft.orderItems).toHaveLength(1);
    expect(draft.orderItems[0].productId).toBe(99);
    expect(draft.orderItems[0].productName).toBe('Adventurer GPS Watch');
    expect(draft.orderItems[0].units).toBe(2);
    expect(draft.orderItems[0].unitPrice).toBe(10);
    expect(draft.total).toBe(20);
  });
});

test('TC-BUG-56-02 a draft line with quantity 0 is answered with 400 problem details naming the quantity', async ({ request }) => {
  await test.step('POST /api/orders/draft for product 99, quantity 0, unit price 10', async () => {
    await expectProblem(await postDraft(request, 10, 0), QUANTITY_DETAIL);
  });
});

test('TC-BUG-56-03 a draft line with quantity -2 is answered with 400 problem details naming the quantity', async ({ request }) => {
  await test.step('POST /api/orders/draft for product 99, quantity -2, unit price 10', async () => {
    await expectProblem(await postDraft(request, 10, -2), QUANTITY_DETAIL);
  });
});

test('TC-BUG-56-05 a draft line with unit price -5 and quantity 1 is answered with 400 problem details naming the price', async ({ request }) => {
  await test.step('POST /api/orders/draft for product 99, quantity 1, unit price -5', async () => {
    await expectProblem(await postDraft(request, -5, 1), PRICE_DETAIL);
  });
});
