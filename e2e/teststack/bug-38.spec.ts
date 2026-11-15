import { Locator, Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BUG-38: footer entries with no page to open keep their colour and the default cursor on hover; entries that
// navigate ("Shop all", "Shopping bag", "My orders") and "Help center" still turn white.
// Scenario `bug-38` (.factory/stack/scenarios/bug-38): the default stack, browsed signed out at 1280x720.
test.describe.configure({ mode: 'serial' });

// Reference values from src/WebApp/Components/Layout/FooterBar.razor.css.
const COLUMN_REST = 'rgba(255, 255, 255, 0.66)';
const LEGAL_REST = 'rgba(255, 255, 255, 0.55)';
const HIGHLIGHT = 'rgb(255, 255, 255)';
// Longer than the footer's colour transition. Negative hover checks wait this long first: toHaveCSS(rest colour)
// would otherwise pass at once, before a would-be hover transition has even started.
const SETTLE_MS = 500;

const footer = (page: Page) => page.locator('footer.eshop-footer');
const column = (page: Page, label: 'Shop' | 'Support' | 'Company') => footer(page).locator(`nav[aria-label="${label}"]`);
const legal = (page: Page) => footer(page).locator('ul.eshop-footer-legal[aria-label="Legal"]');
const entry = (list: Locator, text: string) => list.locator('a').getByText(text, { exact: true });

async function openFooter(page: Page) {
  await page.goto(BASE_URL);
  await expect(footer(page)).toBeVisible();
  await footer(page).scrollIntoViewIfNeeded();
}

// Moves the mouse to the top-left corner, away from the footer.
const mouseAway = (page: Page) => page.mouse.move(0, 0);

// The recording does not draw the mouse pointer, so captions show the cursor value measured on the element.
const measuredCursor = (el: Locator) => el.evaluate(e => getComputedStyle(e).cursor);

test.beforeAll(() => {
  loadScenario('bug-38');
});

test('TC-BUG-38-01 "Shop all", "Shopping bag" and "My orders" turn white with a pointer cursor on hover', async ({ page, demo }) => {
  const links = [
    { text: 'Shop all', href: '' },
    { text: 'Shopping bag', href: 'cart' },
    { text: 'My orders', href: 'user/orders' },
  ];
  await test.step('open / and scroll the footer into view', async () => {
    await openFooter(page);
  });
  for (const { text, href } of links) {
    const link = entry(column(page, 'Shop'), text);
    await test.step(`read the colour of "${text}" with the mouse away from the footer`, async () => {
      await mouseAway(page);
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveCSS('color', COLUMN_REST);
    });
    await test.step(`hover "${text}"`, async () => {
      await link.hover();
      await expect(link).toHaveCSS('color', HIGHLIGHT);
      await expect(link).toHaveCSS('cursor', 'pointer');
      await demo.highlight(link, `"${text}": white, cursor ${await measuredCursor(link)}`);
    });
  }
});

test('TC-BUG-38-02 "New arrivals" keeps its colour and the default cursor on hover', async ({ page, demo }) => {
  const shopAll = entry(column(page, 'Shop'), 'Shop all');
  const newArrivals = entry(column(page, 'Shop'), 'New arrivals');
  await test.step('open / and scroll the footer into view', async () => {
    await openFooter(page);
  });
  await test.step('hover "Shop all", then hover "New arrivals"', async () => {
    await shopAll.hover();
    await expect(shopAll).toHaveCSS('color', HIGHLIGHT);
    await newArrivals.hover();
  });
  await test.step(`wait ${SETTLE_MS} ms with the mouse still on "New arrivals"`, async () => {
    await page.waitForTimeout(SETTLE_MS);
    await expect(newArrivals).not.toHaveAttribute('href');
    await expect(newArrivals).toHaveCSS('color', COLUMN_REST);
    await expect(newArrivals).toHaveCSS('cursor', 'default');
    await demo.highlight(newArrivals, `"New arrivals": same colour, cursor ${await measuredCursor(newArrivals)}`);
  });
});

test('TC-BUG-38-03 "Privacy" keeps its colour and the default cursor on hover', async ({ page, demo }) => {
  const privacy = entry(legal(page), 'Privacy');
  await test.step('open / and scroll the footer into view', async () => {
    await openFooter(page);
  });
  await test.step('hover "Privacy" in the Legal list', async () => {
    await privacy.hover();
  });
  await test.step(`wait ${SETTLE_MS} ms with the mouse still on "Privacy"`, async () => {
    await page.waitForTimeout(SETTLE_MS);
    await expect(privacy).not.toHaveAttribute('href');
    await expect(privacy).toHaveCSS('color', LEGAL_REST);
    await expect(privacy).toHaveCSS('cursor', 'default');
    await demo.highlight(privacy, `"Privacy": same colour, cursor ${await measuredCursor(privacy)}`);
  });
});

test('TC-BUG-38-04 every other footer entry with no page keeps its colour and the default cursor on hover', async ({ page, demo }) => {
  const entries: { list: (page: Page) => Locator; text: string; rest: string }[] = [
    { list: p => column(p, 'Shop'), text: 'Gift cards', rest: COLUMN_REST },
    { list: p => column(p, 'Support'), text: 'Shipping and returns', rest: COLUMN_REST },
    { list: p => column(p, 'Support'), text: 'Track an order', rest: COLUMN_REST },
    { list: p => column(p, 'Support'), text: 'Size guide', rest: COLUMN_REST },
    { list: p => column(p, 'Support'), text: 'Contact us', rest: COLUMN_REST },
    { list: p => column(p, 'Company'), text: 'Our story', rest: COLUMN_REST },
    { list: p => column(p, 'Company'), text: 'Careers', rest: COLUMN_REST },
    { list: p => column(p, 'Company'), text: 'Sustainability', rest: COLUMN_REST },
    { list: p => column(p, 'Company'), text: 'Store locator', rest: COLUMN_REST },
    { list: p => column(p, 'Company'), text: 'Press', rest: COLUMN_REST },
    { list: legal, text: 'Terms', rest: LEGAL_REST },
    { list: legal, text: 'Cookies', rest: LEGAL_REST },
  ];
  // 12 hovers, each held on screen for the video.
  test.setTimeout(90_000);
  await test.step('open / and scroll the footer into view', async () => {
    await openFooter(page);
  });
  for (const { list, text, rest } of entries) {
    const link = entry(list(page), text);
    await test.step(`hover "${text}", wait ${SETTLE_MS} ms, read its colour and cursor`, async () => {
      await link.hover();
      await page.waitForTimeout(SETTLE_MS);
      await expect(link).not.toHaveAttribute('href');
      await expect(link).toHaveCSS('color', rest);
      await expect(link).toHaveCSS('cursor', 'default');
      // The measured values go in the bottom caption: a label under an entry at the right edge would be clipped.
      await demo.caption(`"${text}" hovered: no href, colour unchanged, cursor: ${await measuredCursor(link)}`);
      await demo.highlight(link, `"${text}"`, 800);
    });
  }
  await demo.caption('');
});

test('TC-BUG-38-05 "Help center" turns white on hover and keeps the default cursor', async ({ page, demo }) => {
  const support = column(page, 'Support');
  const helpCenter = entry(support, 'Help center');
  await test.step('open / and scroll the footer into view', async () => {
    await openFooter(page);
    await expect(support.locator('a').first()).toHaveText('Help center');
  });
  await test.step('read the colour of "Help center" with the mouse away from the footer', async () => {
    await mouseAway(page);
    await expect(helpCenter).toHaveCSS('color', COLUMN_REST);
  });
  await test.step('hover "Help center"', async () => {
    await helpCenter.hover();
    await expect(helpCenter).toHaveCSS('color', HIGHLIGHT);
    await expect(helpCenter).toHaveCSS('cursor', 'default');
    await demo.highlight(helpCenter, `"Help center": white, cursor ${await measuredCursor(helpCenter)}`);
  });
});

test('TC-BUG-38-06 clicking "New arrivals" leaves the page where it is', async ({ page, demo }) => {
  const newArrivals = entry(column(page, 'Shop'), 'New arrivals');
  let startUrl = '';
  await test.step('open / and note the page URL', async () => {
    await page.goto(BASE_URL);
    await expect(footer(page)).toBeVisible();
    startUrl = page.url();
    expect(new URL(startUrl).pathname).toBe('/');
  });
  await test.step('scroll the footer into view and click "New arrivals"', async () => {
    await footer(page).scrollIntoViewIfNeeded();
    await newArrivals.click();
  });
  await test.step('wait 1000 ms', async () => {
    await page.waitForTimeout(1000);
    expect(page.url()).toBe(startUrl);
    expect(page.context().pages()).toHaveLength(1);
    await expect(footer(page)).toBeVisible();
    await expect(newArrivals).not.toHaveAttribute('href');
    await demo.highlight(newArrivals, `"New arrivals" clicked: still on ${new URL(startUrl).pathname}, one tab`);
  });
});

test('TC-BUG-38-07 footer shows the same entries in the same order with the same text and targets', async ({ page, demo }) => {
  const columns = [
    { label: 'Shop', links: ['Shop all', 'Shopping bag', 'My orders', 'New arrivals', 'Gift cards'] },
    { label: 'Support', links: ['Help center', 'Shipping and returns', 'Track an order', 'Size guide', 'Contact us'] },
    { label: 'Company', links: ['Our story', 'Careers', 'Sustainability', 'Store locator', 'Press'] },
  ] as const;
  const legalLinks = ['Privacy', 'Terms', 'Cookies'];
  const expectedHrefs = [
    { text: 'Shop all', href: '' },
    { text: 'Shopping bag', href: 'cart' },
    { text: 'My orders', href: 'user/orders' },
  ];
  await test.step('open / and scroll the footer into view', async () => {
    await openFooter(page);
  });
  await test.step('read the text of every entry in the Shop, Support, Company and Legal lists', async () => {
    for (const { label, links } of columns) {
      const nav = column(page, label);
      await expect(nav.locator('h2')).toHaveText(label);
      await expect(nav.locator('a')).toHaveText([...links]);
      await demo.highlight(nav, `${label}: ${links.length} entries unchanged`, 1000);
    }
    await expect(legal(page).locator('a')).toHaveText(legalLinks);
    await demo.highlight(legal(page), `Legal: ${legalLinks.length} entries unchanged`, 1000);

    const lists = footer(page).locator('nav[aria-label="Shop"], nav[aria-label="Support"], nav[aria-label="Company"], ul[aria-label="Legal"]');
    const anchors = lists.locator('a');
    await expect(anchors).toHaveCount(18);
    const withHref = await anchors.evaluateAll(els =>
      els.filter(a => a.hasAttribute('href')).map(a => ({ text: a.textContent?.trim() ?? '', href: a.getAttribute('href') })));
    expect(withHref).toEqual(expectedHrefs);
  });
});

test('TC-BUG-38-08 social icons keep their hover highlight', async ({ page, demo }) => {
  const social = footer(page).locator('ul.eshop-footer-social');
  const instagram = social.locator('a[aria-label="AdventureWorks on Instagram (opens in a new tab)"]');
  await test.step('open / and scroll the footer into view', async () => {
    await openFooter(page);
    await expect(social.locator('a')).toHaveCount(4);
    const labels = await social.locator('a').evaluateAll(els => els.map(a => a.getAttribute('aria-label')));
    expect(labels).toEqual([
      'AdventureWorks on Instagram (opens in a new tab)',
      'AdventureWorks on Facebook (opens in a new tab)',
      'AdventureWorks on X (opens in a new tab)',
      'AdventureWorks on YouTube (opens in a new tab)',
    ]);
  });
  await test.step('hover the Instagram link', async () => {
    await expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/');
    await expect(instagram).toHaveAttribute('target', '_blank');
    await instagram.hover();
    await expect(instagram).toHaveCSS('background-color', HIGHLIGHT);
    await expect(instagram).toHaveCSS('cursor', 'pointer');
    // The measured values go in the bottom caption: a label under the left-most icon would be clipped.
    await demo.caption(`Instagram hovered: white background, cursor: ${await measuredCursor(instagram)}`);
    await demo.highlight(instagram, 'Instagram');
    await demo.caption('');
  });
});
