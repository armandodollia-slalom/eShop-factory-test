import { test, expect } from '../demo';
import { implicitFlowToken } from './auth';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-15: POST /api/orders/draft answers 400 problem details instead of 500 when the request has no usable items.
// Scenario `bug-15` (.factory/stack/scenarios/bug-15): the default demo users; the draft endpoint is stateless.
// Cases TC-BUG-15-01 to -05 are implemented in-process in tests/Ordering.FunctionalTests; this spec repeats the main paths on the stack.
test.describe.configure({ mode: 'serial' });

const DRAFT = () => `${url('ordering')}/api/orders/draft?api-version=1.0`;
const REQUEST_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const ITEM_REQUIRED_DETAIL = 'An order draft requires at least one item.';

let token = '';
// The only redirect URI identity registers for this client on the stack (orderingswaggerui); it resolves only inside the compose network.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';

test.beforeAll(() => {
  loadScenario('bug-15');
});

// The "orderingswaggerui" client uses the implicit flow: signing in as alice returns an access token.
test.beforeAll(async ({ browser }) => {
  token = await implicitFlowToken(browser, { clientId: 'orderingswaggerui', scope: 'orders', redirectUri: REDIRECT });
  expect(token).not.toBe('');
});

const headers = () => ({ Authorization: `Bearer ${token}`, 'x-requestid': REQUEST_ID });

test('TC-BUG-15-01 stack: draft request with no body is rejected with 400', async ({ request }) => {
  await test.step('POST /api/orders/draft with no body and no Content-Type', async () => {
    const response = await request.post(DRAFT(), { headers: headers() });
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/problem+json');
    const problem = await response.json();
    expect(problem.detail).toBe(ITEM_REQUIRED_DETAIL);
    expect(problem.status).toBe(400);
    expect(problem.orderItems).toBeUndefined();
    expect(problem.total).toBeUndefined();
  });
});

test('TC-BUG-15-03 stack: body with null items is rejected with 400', async ({ request }) => {
  await test.step('POST /api/orders/draft with {"buyerId":"b1","items":null}', async () => {
    const response = await request.post(DRAFT(), { headers: headers(), data: { buyerId: 'b1', items: null } });
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/problem+json');
    expect((await response.json()).detail).toBe(ITEM_REQUIRED_DETAIL);
  });
});

test('TC-BUG-15-05 stack: draft with exactly one item still returns 200 with the computed draft', async ({ request }) => {
  await test.step('POST /api/orders/draft with one item', async () => {
    const data = {
      buyerId: 'b1',
      items: [{ id: 'i1', productId: 1, productName: 'Test Product 1', unitPrice: 10.2, oldUnitPrice: 9.8, quantity: 2, pictureUrl: 'p1' }],
    };
    const response = await request.post(DRAFT(), { headers: headers(), data });
    expect(response.status()).toBe(200);
    const draft = await response.json();
    expect(draft.orderItems).toHaveLength(1);
    expect(draft.orderItems[0].productId).toBe(1);
    expect(draft.total).toBe(20.4);
  });
});
