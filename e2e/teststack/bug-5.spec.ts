import { Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BUG-5: /user/login must send the shopper only to local pages after sign-in.
// Scenario `bug-5` (.factory/stack/scenarios/bug-5): the demo users (alice / Pass123$) and the demo catalog (item 99).
test.describe.configure({ mode: 'serial' });

const USERNAME = 'alice';
const PASSWORD = 'Pass123$';
const EVIL_HOST = 'evil.example';

test.beforeAll(() => {
  loadScenario('bug-5');
});

// Records every request the browser makes to the off-site host, so the cases can prove none was made.
function trackEvilRequests(page: Page) {
  const seen: string[] = [];
  page.on('request', (r) => {
    if (new URL(r.url()).hostname === EVIL_HOST) seen.push(r.url());
  });
  return seen;
}

async function signIn(page: Page, returnUrl: string) {
  await page.goto(`${BASE_URL}/user/login?returnUrl=${returnUrl}`);
  await page.getByPlaceholder('Username').fill(USERNAME);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
}

test('TC-BUG-5-01 protocol-relative returnUrl does not leave the site after sign-in', async ({ page, demo }) => {
  const evil = trackEvilRequests(page);
  const locations: string[] = [];
  page.on('response', (r) => {
    const location = r.headers()['location'];
    if (location) locations.push(location);
  });
  await test.step('open /user/login?returnUrl=//evil.example and sign in as alice', () => signIn(page, '//evil.example'));
  await test.step('the browser ends on the WebApp root', async () => {
    await expect(page).toHaveURL(`${BASE_URL}/`);
    const landed = new URL(page.url());
    expect(landed.origin).toBe(new URL(BASE_URL!).origin);
    expect(landed.pathname).toBe('/');
    await demo.highlight(page.getByRole('heading', { name: 'Ready for a new adventure?' }), 'WebApp home after sign-in');
    expect(evil).toEqual([]);
    // A Location may carry the host inside a returnUrl parameter; only a Location whose own host is evil.example is an off-site redirect.
    expect(locations.filter((l) => new URL(l, BASE_URL).hostname === EVIL_HOST)).toEqual([]);
  });
});

test('TC-BUG-5-02 local return URL is still honored after sign-in', async ({ page, demo }) => {
  await test.step('open /user/login?returnUrl=%2Fuser%2Forders and sign in as alice', () => signIn(page, '%2Fuser%2Forders'));
  await test.step('the browser lands on /user/orders', async () => {
    await expect(page).toHaveURL(`${BASE_URL}/user/orders`);
    await expect(page).toHaveTitle('Orders | AdventureWorks');
    await demo.highlight(page.locator('main').first(), 'orders page');
  });
});

test('TC-BUG-5-03 base-relative returnUrl item/99 lands on the item page', async ({ page, demo }) => {
  await test.step('open /user/login?returnUrl=item%2F99 and sign in as alice', () => signIn(page, 'item%2F99'));
  await test.step('the browser lands on /item/99', async () => {
    await expect(page).toHaveURL(`${BASE_URL}/item/99`);
    await demo.highlight(page.getByRole('heading', { name: 'Adventurer GPS Watch' }), 'item 99 page');
  });
});

test('TC-BUG-5-04 returnUrl /\\evil.example does not leave the site', async ({ page, demo }) => {
  const evil = trackEvilRequests(page);
  await test.step('open /user/login?returnUrl=%2F%5Cevil.example and sign in as alice', () => signIn(page, '%2F%5Cevil.example'));
  await test.step('the browser ends on the WebApp root', async () => {
    await expect(page).toHaveURL(`${BASE_URL}/`);
    await demo.highlight(page.getByRole('heading', { name: 'Ready for a new adventure?' }), 'WebApp home after sign-in');
    expect(evil).toEqual([]);
  });
});

test('TC-BUG-5-05 absolute returnUrl https://evil.example/ does not leave the site', async ({ page, demo }) => {
  const evil = trackEvilRequests(page);
  await test.step('open /user/login?returnUrl=https%3A%2F%2Fevil.example%2F and sign in as alice', () => signIn(page, 'https%3A%2F%2Fevil.example%2F'));
  await test.step('the browser ends on the WebApp root', async () => {
    await expect(page).toHaveURL(`${BASE_URL}/`);
    await demo.highlight(page.getByRole('heading', { name: 'Ready for a new adventure?' }), 'WebApp home after sign-in');
    expect(evil).toEqual([]);
  });
});
