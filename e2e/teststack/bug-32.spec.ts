import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-32: Ordering.API's OpenAPI document lists the 400 application/problem+json response of POST /api/orders/draft,
// matching what the endpoint returns for a draft with no items.
// Scenario `bug-32` (.factory/stack/scenarios/bug-32): the demo users alice and bob (Pass123$), no orders.
// TC-BUG-32-02, -03 and -05 run in-process in tests/Ordering.FunctionalTests/OrderDraftContractTests.cs.
test.describe.configure({ mode: 'serial' });

const OPENAPI = () => `${url('ordering')}/openapi/v1.json`;
const DRAFT = () => `${url('ordering')}/api/orders/draft?api-version=1.0`;
const DRAFT_PATH = '/api/orders/draft';
const PROBLEM_JSON = 'application/problem+json';
const BUYER_ID = '9e3163b9-1ae6-4652-9dc6-7898ab7b7a00';
const EMPTY_DRAFT_DETAIL = 'The order draft must contain at least one item.';
// The only redirect URI identity registers for this client on the stack (OrderingApiClient); it resolves only inside the compose network.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';

let token = '';

test.beforeAll(() => {
  loadScenario('bug-32');
});

// The "orderingswaggerui" client uses the implicit flow: signing in as alice returns an access token in the redirect fragment.
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const authorize = new URL(`${url('identity')}/connect/authorize`);
  authorize.search = new URLSearchParams({
    client_id: 'orderingswaggerui',
    response_type: 'token',
    scope: 'orders',
    redirect_uri: REDIRECT,
    state: 'bug32',
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

const auth = () => ({ Authorization: `Bearer ${token}` });

test('TC-BUG-32-01 OpenAPI document lists a 400 application/problem+json response for POST /api/orders/draft', async ({ request }) => {
  let document: { paths?: Record<string, { post?: { responses?: Record<string, { content?: Record<string, unknown> }> } }> } = {};
  await test.step('GET /openapi/v1.json without an api-version query string', async () => {
    const response = await request.get(OPENAPI());
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    document = await response.json();
  });
  await test.step('read paths["/api/orders/draft"].post.responses', async () => {
    expect(document.paths).toHaveProperty([DRAFT_PATH]);
    const post = document.paths![DRAFT_PATH].post;
    expect(post).toBeDefined();
    expect(post!.responses).toHaveProperty(['400']);
    expect(post!.responses!['400'].content).toHaveProperty([PROBLEM_JSON]);
  });
});

test('TC-BUG-32-04 draft with no items still returns 400 application/problem+json', async ({ request }) => {
  await test.step('POST /api/orders/draft?api-version=1.0 with items []', async () => {
    const response = await request.post(DRAFT(), {
      headers: { ...auth(), 'Content-Type': 'application/json' },
      data: { buyerId: BUYER_ID, items: [] },
    });
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type'].split(';')[0].trim()).toBe(PROBLEM_JSON);
    const problem = await response.json();
    expect(problem.status).toBe(400);
    expect(problem.detail).toBe(EMPTY_DRAFT_DETAIL);
    expect(typeof problem.title).toBe('string');
    expect(problem.title.trim()).not.toBe('');
  });
});
