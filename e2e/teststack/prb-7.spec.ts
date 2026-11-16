import { Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// PRB-7: the footer's Support -> "Track an order" link opens My orders (/user/orders), the same destination as
// Shop -> "My orders", while its text, its place and every other footer link stay as they were.
// Scenario `prb-7` (.factory/stack/scenarios/prb-7): the seeded user alice (Pass123$) with no orders.
test.describe.configure({ mode: 'serial' });

const TRACK = 'Track an order';
const MY_ORDERS = 'My orders';
const TITLE = 'My orders | AdventureWorks';
const ORDERS_PATH = '/user/orders';

test.beforeAll(() => {
  loadScenario('prb-7');
});

const footer = (page: Page) => page.locator('footer.eshop-footer');
const footerNav = (page: Page, name: string) => footer(page).getByRole('navigation', { name, exact: true });
/** Footer anchors are matched with `a` because placeholders have no href and therefore no link role. */
const navLink = (page: Page, nav: string, text: string) =>
  footerNav(page, nav).locator('a').filter({ hasText: new RegExp(`^${text}$`) });
const headerTitle = (page: Page) => page.locator('.eshop-hero-intro h1');

/**
 * Narration drawn into the page itself, so the step and highlight keyframes (page screenshots, which do not
 * include `demo.caption` overlays) show the URL or measured value the case asserts, as does the video.
 */
async function note(page: Page, text: string) {
  await page.evaluate(t => {
    let el = document.getElementById('e2e-note');
    if (!el) {
      el = document.createElement('div');
      el.id = 'e2e-note';
      el.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);max-width:90%;'
        + 'padding:10px 18px;border-radius:10px;background:rgba(15,23,42,.9);color:#fff;'
        + 'font:500 17px/1.4 system-ui,sans-serif;text-align:center;z-index:2147483647;pointer-events:none;';
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
}

async function signInAsAlice(page: Page) {
  await test.step('open the home page and sign in as alice', async () => {
    await page.goto(BASE_URL);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill('alice');
    await page.getByPlaceholder('Password').fill('Pass123$');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  });
}

async function scrollToFooter(page: Page) {
  await test.step('scroll to the footer', async () => {
    await footer(page).scrollIntoViewIfNeeded();
    await expect(footer(page)).toBeVisible();
  });
}

test('TC-PRB-7-01 signed-in shopper clicking footer "Track an order" lands on My orders', async ({ page, demo }) => {
  await signInAsAlice(page);
  await scrollToFooter(page);
  const homeUrl = page.url();
  await test.step('click "Track an order" in the footer\'s Support navigation', async () => {
    const link = navLink(page, 'Support', TRACK);
    await expect(link).toHaveCount(1);
    await demo.highlight(link, 'Support -> Track an order');
    await link.click();
  });
  await test.step('the browser is on /user/orders, titled "My orders | AdventureWorks", still signed in', async () => {
    await expect.poll(() => new URL(page.url()).pathname).toBe(ORDERS_PATH);
    expect(page.url()).not.toBe(homeUrl);
    await expect(page).toHaveTitle(TITLE);
    await expect(headerTitle(page)).toHaveText(MY_ORDERS);
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Login', exact: true })).toHaveCount(0);
    await expect(page.getByPlaceholder('Password')).toHaveCount(0);
    await expect(page.locator('#blazor-error-ui')).toBeHidden();
    await expect(page.getByRole('heading', { name: /error/i })).toHaveCount(0);
    await note(page, `Clicked "Track an order" on ${homeUrl} -> now at ${page.url()}`);
    await demo.highlight(headerTitle(page), `Landed on My orders (title: ${await page.title()})`);
  });
});

test('TC-PRB-7-02 "Track an order" and "My orders" footer links resolve to the same destination', async ({ page, demo }) => {
  await signInAsAlice(page);
  await scrollToFooter(page);
  let myOrdersHref = '';
  let trackHref = '';
  await test.step('read the resolved href of Shop -> "My orders"', async () => {
    const link = navLink(page, 'Shop', MY_ORDERS);
    await expect(link).toHaveCount(1);
    myOrdersHref = await link.evaluate(a => (a as HTMLAnchorElement).href);
    expect(myOrdersHref).not.toBe('');
    await demo.highlight(link, `My orders -> ${myOrdersHref}`);
  });
  await test.step('read the resolved href of Support -> "Track an order"', async () => {
    const link = navLink(page, 'Support', TRACK);
    await expect(link).toHaveCount(1);
    trackHref = await link.evaluate(a => (a as HTMLAnchorElement).href);
    expect(trackHref).not.toBe('');
    await demo.highlight(link, `Track an order -> ${trackHref}`);
  });
  await test.step('both hrefs are identical with path /user/orders', async () => {
    expect(trackHref).toBe(myOrdersHref);
    expect(new URL(trackHref).pathname).toBe(ORDERS_PATH);
    await note(page, `My orders -> ${myOrdersHref} | Track an order -> ${trackHref}`);
    await demo.highlight(footer(page).locator('.eshop-footer-main'), 'Same destination: /user/orders');
  });
});

test('TC-PRB-7-03 "Track an order" keeps its text and third place in the Support column', async ({ page, demo }) => {
  await signInAsAlice(page);
  await scrollToFooter(page);
  await test.step('collect the Support navigation links in order', async () => {
    const support = footerNav(page, 'Support');
    await expect(support.getByRole('heading', { name: 'Support', exact: true })).toBeVisible();
    await expect(support.locator('a')).toHaveText(['Help center', 'Shipping and returns', TRACK, 'Size guide', 'Contact us']);
    await demo.highlight(support, 'Support: Help center, Shipping and returns, Track an order, Size guide, Contact us');
  });
  await test.step('"Track an order" appears once in the footer, only under Support', async () => {
    const all = footer(page).locator('a').filter({ hasText: new RegExp(`^${TRACK}$`) });
    await expect(all).toHaveCount(1);
    await expect(navLink(page, 'Support', TRACK)).toHaveCount(1);
    await expect(navLink(page, 'Shop', TRACK)).toHaveCount(0);
    await expect(navLink(page, 'Company', TRACK)).toHaveCount(0);
    await demo.highlight(navLink(page, 'Support', TRACK), 'Only "Track an order" in the footer');
    await demo.absent(footerNav(page, 'Shop'), 'No "Track an order" under Shop');
    await demo.absent(footerNav(page, 'Company'), 'No "Track an order" under Company');
  });
});

test('TC-PRB-7-04 every other footer link is unchanged', async ({ page, demo }) => {
  await signInAsAlice(page);
  await scrollToFooter(page);
  const f = footer(page);
  await test.step('brand and social links', async () => {
    const brand = f.getByLabel('AdventureWorks home', { exact: true });
    await expect(brand).toHaveAttribute('href', '');
    const social: [string, string][] = [
      ['Instagram', 'https://www.instagram.com/'],
      ['Facebook', 'https://www.facebook.com/'],
      ['X', 'https://x.com/'],
      ['YouTube', 'https://www.youtube.com/'],
    ];
    const socialList = f.locator('.eshop-footer-social');
    await expect(socialList.locator('a')).toHaveCount(social.length);
    for (const [name, href] of social) {
      const link = socialList.getByLabel(`AdventureWorks on ${name} (opens in a new tab)`, { exact: true });
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveAttribute('target', '_blank');
    }
    await note(page, `Brand href="${await brand.getAttribute('href')}" | social: ${social.map(([n, h]) => `${n}=${h}`).join(', ')}`);
    await demo.highlight(f.locator('.eshop-footer-brand-col'), 'Brand href="" and 4 social links (target=_blank)');
  });
  const showHref = (h: string | null) => (h === null ? 'no href' : `"${h}"`);
  const expectHrefs = async (nav: string, links: [string, string | null][]) => {
    const anchors = footerNav(page, nav).locator('a');
    await expect(anchors).toHaveText(links.map(([text]) => text));
    const measured: string[] = [];
    for (let i = 0; i < links.length; i++) {
      const href = await anchors.nth(i).getAttribute('href');
      expect(href, `${nav} -> ${links[i][0]}`).toBe(links[i][1]);
      measured.push(`${links[i][0]}=${showHref(href)}`);
    }
    await note(page, `${nav} hrefs: ${measured.join(', ')}`);
  };
  await test.step('Shop navigation links and hrefs', async () => {
    await expectHrefs('Shop', [
      ['Shop all', ''],
      ['Shopping bag', 'cart'],
      [MY_ORDERS, 'user/orders'],
      ['New arrivals', null],
      ['Gift cards', null],
    ]);
    await demo.highlight(footerNav(page, 'Shop'), 'Shop: "", cart, user/orders, no href, no href');
  });
  await test.step('Support navigation: all but "Track an order" have no href', async () => {
    const anchors = footerNav(page, 'Support').locator('a');
    await expect(anchors).toHaveCount(5);
    const measured: string[] = [];
    for (const text of ['Help center', 'Shipping and returns', 'Size guide', 'Contact us']) {
      const href = await navLink(page, 'Support', text).getAttribute('href');
      expect(href, `Support -> ${text}`).toBeNull();
      measured.push(`${text}=${showHref(href)}`);
    }
    await note(page, `Support hrefs: ${measured.join(', ')}`);
    await demo.highlight(footerNav(page, 'Support'), 'Support: only Track an order has an href');
  });
  await test.step('Company navigation links have no href', async () => {
    await expectHrefs('Company', [
      ['Our story', null],
      ['Careers', null],
      ['Sustainability', null],
      ['Store locator', null],
      ['Press', null],
    ]);
    await demo.highlight(footerNav(page, 'Company'), 'Company: no hrefs');
  });
  await test.step('Legal links have no href and the footer has no other links', async () => {
    const legal = f.getByRole('list', { name: 'Legal', exact: true });
    const anchors = legal.locator('a');
    await expect(anchors).toHaveText(['Privacy', 'Terms', 'Cookies']);
    const measured: string[] = [];
    for (let i = 0; i < 3; i++) {
      const href = await anchors.nth(i).getAttribute('href');
      expect(href).toBeNull();
      measured.push(`${await anchors.nth(i).textContent()}=${showHref(href)}`);
    }
    // 1 brand + 4 social + 5 Shop + 5 Support + 5 Company + 3 Legal.
    await expect(f.locator('a')).toHaveCount(23);
    await note(page, `Legal hrefs: ${measured.join(', ')} | footer links in total: ${await f.locator('a').count()}`);
    await demo.highlight(legal, 'Legal: Privacy, Terms, Cookies with no href; 23 footer links in total');
  });
});

test('TC-PRB-7-05 anonymous click on "Track an order" is sent to sign-in exactly like "My orders"', async ({ page, demo }) => {
  const originAndPath = (u: string) => {
    const url = new URL(u);
    return `${url.origin}${url.pathname}`;
  };
  let myOrdersTarget = '';
  await test.step('open the home page without signing in and scroll to the footer', async () => {
    await page.context().clearCookies();
    await page.goto(BASE_URL);
    await expect(page.getByLabel('Sign in')).toBeVisible();
    await footer(page).scrollIntoViewIfNeeded();
  });
  await test.step('click Shop -> "My orders" and record where it lands', async () => {
    const homeUrl = page.url();
    await demo.highlight(navLink(page, 'Shop', MY_ORDERS), 'Anonymous: Shop -> My orders');
    await navLink(page, 'Shop', MY_ORDERS).click();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    expect(page.url()).not.toBe(homeUrl);
    myOrdersTarget = originAndPath(page.url());
    await note(page, `Anonymous "My orders" -> ${myOrdersTarget}`);
    await demo.highlight(page.getByRole('heading', { name: 'Login', exact: true }), 'My orders -> Login');
  });
  let homeUrl = '';
  await test.step('open the home page again in the same anonymous context and scroll to the footer', async () => {
    await page.goto(BASE_URL);
    await expect(page.getByLabel('Sign in')).toBeVisible();
    homeUrl = page.url();
    await footer(page).scrollIntoViewIfNeeded();
  });
  await test.step('click Support -> "Track an order": same sign-in page, no orders', async () => {
    await demo.highlight(navLink(page, 'Support', TRACK), 'Anonymous: Support -> Track an order');
    await navLink(page, 'Support', TRACK).click();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    expect(page.url()).not.toBe(homeUrl);
    expect(originAndPath(page.url())).toBe(myOrdersTarget);
    await expect(page).not.toHaveTitle(TITLE);
    await expect(page.locator('.orders-list')).toHaveCount(0);
    await expect(page.locator('.order-number')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: MY_ORDERS, exact: true })).toHaveCount(0);
    const login = page.getByRole('heading', { name: 'Login', exact: true });
    await note(page, `Anonymous "Track an order" -> ${originAndPath(page.url())} (same as My orders)`);
    await demo.highlight(page.getByPlaceholder('Password').locator('xpath=ancestor::form'), 'Sign-in form: user name and password');
    await demo.absent(login, 'No My orders page or orders list');
  });
});
