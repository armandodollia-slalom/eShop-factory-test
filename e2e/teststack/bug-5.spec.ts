import { Page } from '@playwright/test';
import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-5: after sign-in through /user/login?returnUrl=... the WebApp follows only local return URLs, otherwise it goes to `/`.
// Scenario `bug-5` (.factory/stack/scenarios/bug-5): the demo user alice (Pass123$) and the default catalog (item 5 exists).
test.describe.configure({ mode: 'serial' });

const WEBAPP = () => url('webapp');
const EVIL_HOST = 'evil.example';

test.beforeAll(() => {
  loadScenario('bug-5');
});

// Records every request the page makes so a case can prove the browser never went to the foreign host.
function watchRequests(page: Page) {
  const urls: string[] = [];
  page.on('request', (request) => urls.push(request.url()));
  return urls;
}

async function signIn(page: Page, loginUrl: string) {
  await page.goto(loginUrl);
  await page.getByPlaceholder('Username').fill('alice');
  await page.getByPlaceholder('Password').fill('Pass123$');
  await page.getByRole('button', { name: 'Login' }).click();
}

test('TC-BUG-5-01 protocol-relative returnUrl lands on the WebApp home page, not off-site', async ({ page, demo }) => {
  const requests = watchRequests(page);
  await test.step('open /user/login?returnUrl=//evil.example and sign in as alice', async () => {
    await signIn(page, `${WEBAPP()}/user/login?returnUrl=//${EVIL_HOST}`);
  });
  await test.step('the final URL is the WebApp origin with path /', async () => {
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    const final = new URL(page.url());
    expect(final.origin).toBe(new URL(WEBAPP()).origin);
    expect(final.pathname).toBe('/');
    await demo.highlight(page.getByRole('heading', { name: 'Ready for a new adventure?' }), 'WebApp home, not evil.example');
  });
  await test.step('no request went to evil.example and the catalog list is visible', async () => {
    expect(requests.filter((u) => new URL(u).hostname === EVIL_HOST)).toEqual([]);
    await expect(page.locator('.catalog-items')).toBeVisible();
    await demo.highlight(page.locator('.catalog-items'), 'catalog item list');
  });
});

test('TC-BUG-5-02 /\\evil.example returnUrl lands on the WebApp home page', async ({ page, demo }) => {
  const requests = watchRequests(page);
  await test.step('open /user/login?returnUrl=%2F%5Cevil.example and sign in as alice', async () => {
    await signIn(page, `${WEBAPP()}/user/login?returnUrl=%2F%5C${EVIL_HOST}`);
  });
  await test.step('the final URL is the WebApp origin with path /', async () => {
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    const final = new URL(page.url());
    expect(final.origin).toBe(new URL(WEBAPP()).origin);
    expect(final.pathname).toBe('/');
    await demo.highlight(page.getByRole('heading', { name: 'Ready for a new adventure?' }), 'WebApp home, not evil.example');
  });
  await test.step('no request went to evil.example', async () => {
    expect(requests.filter((u) => new URL(u).hostname === EVIL_HOST)).toEqual([]);
  });
});

test('TC-BUG-5-03 local returnUrl /item/5 returns the user to that page', async ({ page, demo }) => {
  await test.step('open /user/login?returnUrl=%2Fitem%2F5 and sign in as alice', async () => {
    await signIn(page, `${WEBAPP()}/user/login?returnUrl=%2Fitem%2F5`);
  });
  await test.step('the final URL is <webapp>/item/5', async () => {
    await expect(page).toHaveURL(`${WEBAPP()}/item/5`);
    await demo.highlight(page.locator('.item-details'), 'item 5 page');
  });
});

test('TC-BUG-5-04 base-relative returnUrl item/5 returns the user to the item page', async ({ page, demo }) => {
  await test.step('open /user/login?returnUrl=item%2F5 and sign in as alice', async () => {
    await signIn(page, `${WEBAPP()}/user/login?returnUrl=item%2F5`);
  });
  await test.step('the final URL is <webapp>/item/5', async () => {
    await expect(page).toHaveURL(`${WEBAPP()}/item/5`);
    await demo.highlight(page.locator('.item-details'), 'item 5 page');
  });
});

test('TC-BUG-5-05 sign-in without a returnUrl lands on the WebApp home page', async ({ page, demo }) => {
  await test.step('open /user/login with no query string and sign in as alice', async () => {
    await signIn(page, `${WEBAPP()}/user/login`);
  });
  await test.step('the final URL is the WebApp origin with path /', async () => {
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    const final = new URL(page.url());
    expect(final.origin).toBe(new URL(WEBAPP()).origin);
    expect(final.pathname).toBe('/');
    await demo.highlight(page.getByRole('heading', { name: 'Ready for a new adventure?' }), 'WebApp home');
  });
});
