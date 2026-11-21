import { BrowserContext, Page, Response } from '@playwright/test';
import { Demo, test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-34: signing in to Identity.API with a return URL to another site redirects to Identity.API's home page (`/`)
// with a signed-in session instead of answering 500; local, empty and authorization-request return URLs behave as before.
// Scenario `bug-34` (.factory/stack/scenarios/bug-34): the seeded user alice (Pass123$), nothing else.
// Identity.API runs as Production on the stack, so `GET /` itself answers an empty 404 (see the plan's open question):
// the cases assert the redirect target and the absence of a 500, not what `/` renders.
test.describe.configure({ mode: 'serial' });

const USERNAME = 'alice';
const PASSWORD = 'Pass123$';
const FOREIGN_HOST = 'example.com';
const FOREIGN_RETURN_URL = 'https%3A%2F%2Fexample.com%2Flanding';
const PROTOCOL_RELATIVE_RETURN_URL = '%2F%2Fexample.com%2Flanding';
const LOCAL_RETURN_URL = '%2Fgrants';
const GRANTS_HEADING = 'Client Application Permissions';
// The only redirect URI identity registers for the "orderingswaggerui" client on the stack; it resolves only inside the compose network.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';
const STATE = 'bug34';

const identity = () => url('identity');
const identityHome = () => `${identity()}/`;

test.beforeAll(() => {
  loadScenario('bug-34');
});

/** Every host the context's pages request, so a case can prove the other site was never contacted. */
function recordHosts(context: BrowserContext): string[] {
  const hosts: string[] = [];
  context.on('request', (request) => hosts.push(new URL(request.url()).hostname));
  return hosts;
}

const isLoginPost = (response: Response) =>
  response.request().method() === 'POST' && new URL(response.url()).pathname === '/Account/Login';

/** Fills alice's credentials (marking the form for the video) and clicks Login; returns the POST /Account/Login response. */
async function signIn(page: Page, demo: Demo) {
  await page.getByPlaceholder('Username').fill(USERNAME);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await demo.highlight(page.locator('form.login-form'), 'alice signs in with her correct password');
  const post = page.waitForResponse(isLoginPost);
  await page.getByRole('button', { name: 'Login' }).click();
  return post;
}

/** Opens the sign-in page with `returnUrl`, signs alice in and checks the 302 lands on Identity.API's `/` without contacting the other site. */
async function expectRedirectedHome(page: Page, context: BrowserContext, demo: Demo, returnUrl: string, absentLabel: string) {
  const hosts = recordHosts(context);
  const loginUrl = `${identity()}/Account/Login?ReturnUrl=${returnUrl}`;

  await test.step(`open ${loginUrl}`, async () => {
    await page.goto(loginUrl);
    await expect(page.getByPlaceholder('Username')).toBeVisible();
  });
  let response!: Response;
  await test.step('fill alice / Pass123$ and click Login, capturing POST /Account/Login', async () => {
    response = await signIn(page, demo);
  });
  await test.step('wait for the navigation that follows and check the redirect', async () => {
    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toBe('/');
    await page.waitForURL(identityHome());
    expect(page.url()).toBe(identityHome());
    expect(hosts).not.toContain(FOREIGN_HOST);
    await demo.caption(`POST /Account/Login answered ${response.status()} Location: ${response.headers()['location']}; now at ${page.url()}`);
    await demo.absent(page.locator('html'), absentLabel);
  });
}

test('TC-BUG-34-01 sign-in with a return URL to another site redirects to the home page instead of returning 500', async ({ page, context, demo }) => {
  await expectRedirectedHome(page, context, demo, FOREIGN_RETURN_URL, `302 to / on Identity.API, no 500 and no request to ${FOREIGN_HOST}`);
});

test('TC-BUG-34-02 sign-in with a return URL to another site leaves alice signed in', async ({ page, demo }) => {
  await test.step('open the sign-in page with ReturnUrl=https://example.com/landing', async () => {
    await page.goto(`${identity()}/Account/Login?ReturnUrl=${FOREIGN_RETURN_URL}`);
    await expect(page.getByPlaceholder('Username')).toBeVisible();
  });
  await test.step('fill alice / Pass123$, click Login and wait for POST /Account/Login', async () => {
    const response = await signIn(page, demo);
    expect(response.status()).toBe(302);
  });
  await test.step('open /grants in the same browser context', async () => {
    const grants = await page.goto(`${identity()}/grants`);
    expect(grants!.status()).toBe(200);
    expect(page.url()).toBe(`${identity()}/grants`);
    const heading = page.getByRole('heading', { name: GRANTS_HEADING });
    await expect(heading).toBeVisible();
    await demo.highlight(heading, 'alice is signed in: /grants renders without a redirect to the login page');
  });
});

test('TC-BUG-34-03 sign-in with a protocol-relative return URL to another site redirects to the home page', async ({ page, context, demo }) => {
  await expectRedirectedHome(page, context, demo, PROTOCOL_RELATIVE_RETURN_URL, `302 to / on Identity.API, //${FOREIGN_HOST} never followed`);
});

test('TC-BUG-34-04 sign-in with a local return URL still redirects to that Identity.API page', async ({ page, demo }) => {
  await test.step('open the sign-in page with ReturnUrl=/grants', async () => {
    await page.goto(`${identity()}/Account/Login?ReturnUrl=${LOCAL_RETURN_URL}`);
    await expect(page.getByPlaceholder('Username')).toBeVisible();
  });
  let response!: Response;
  await test.step('fill alice / Pass123$ and click Login, capturing POST /Account/Login', async () => {
    response = await signIn(page, demo);
  });
  await test.step('wait for the navigation to /grants', async () => {
    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toBe('/grants');
    await page.waitForURL(`${identity()}/grants`);
    expect(page.url()).toBe(`${identity()}/grants`);
    const heading = page.getByRole('heading', { name: GRANTS_HEADING });
    await expect(heading).toBeVisible();
    await demo.highlight(heading, 'redirected to the local return URL /grants');
  });
});

test('TC-BUG-34-05 sign-in with no return URL still redirects to the home page', async ({ page, demo }) => {
  await test.step('open /Account/Login with no query string', async () => {
    await page.goto(`${identity()}/Account/Login`);
    await expect(page.getByPlaceholder('Username')).toBeVisible();
  });
  await test.step('fill alice / Pass123$ and click Login, capturing POST /Account/Login', async () => {
    const response = await signIn(page, demo);
    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toBe('/');
  });
  await test.step('open /grants in the same browser context', async () => {
    const grants = await page.goto(`${identity()}/grants`);
    expect(grants!.status()).toBe(200);
    const heading = page.getByRole('heading', { name: GRANTS_HEADING });
    await expect(heading).toBeVisible();
    await demo.highlight(heading, 'signed in after a redirect to /');
  });
});

test('TC-BUG-34-06 sign-in from an authorization request still returns to the authorize callback', async ({ page, demo }) => {
  await test.step('open /connect/authorize for orderingswaggerui and land on /Account/Login', async () => {
    const authorize = new URL(`${identity()}/connect/authorize`);
    authorize.search = new URLSearchParams({
      client_id: 'orderingswaggerui',
      response_type: 'token',
      scope: 'orders',
      redirect_uri: REDIRECT,
      state: STATE,
    }).toString();
    await page.goto(authorize.toString());
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    const landed = new URL(page.url());
    expect(landed.pathname).toBe('/Account/Login');
    expect(landed.searchParams.get('ReturnUrl') ?? '').toMatch(/^\/connect\/authorize\/callback/);
  });
  let post!: Response;
  let callback!: Response;
  await test.step('fill alice / Pass123$ and click Login, capturing POST /Account/Login and GET /connect/authorize/callback', async () => {
    const callbackResponse = page.waitForResponse((r) =>
      r.request().method() === 'GET' && new URL(r.url()).pathname === '/connect/authorize/callback');
    post = await signIn(page, demo);
    callback = await callbackResponse;
  });
  await test.step('check both redirects', async () => {
    expect(post.status()).toBe(302);
    expect(post.headers()['location']).toMatch(/^\/connect\/authorize\/callback\?/);
    expect(callback.status()).toBe(302);
    const location = callback.headers()['location'] ?? '';
    expect(location.startsWith(`${REDIRECT}#`)).toBe(true);
    const fragment = new URLSearchParams(location.split('#')[1] ?? '');
    expect(fragment.get('access_token') ?? '').not.toBe('');
    expect(fragment.get('state')).toBe(STATE);
    // The browser now follows the Location to ordering-api:8080, which resolves only inside the compose network,
    // so it shows nothing; show the redirect identity actually answered (token elided) as this case's result.
    await page.setContent(`<h1>Test evidence: GET /connect/authorize/callback answered ${callback.status()}</h1>
      <p id="callback-location">Location: ${location.split('#')[0]}#access_token=&lt;${fragment.get('access_token')!.length} chars&gt;&amp;state=${fragment.get('state')}</p>`);
    await demo.highlight(page.locator('#callback-location'), 'identity returned alice to the client with an access token and state=bug34');
  });
});
