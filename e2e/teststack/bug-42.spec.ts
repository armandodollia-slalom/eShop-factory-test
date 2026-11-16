import { execFileSync } from 'child_process';
import { Locator, Page } from '@playwright/test';
import { test, expect, createDemo, Demo } from '../demo';
import { captureKeyframe } from '../fixtures';
import { BASE_URL, SLOT } from './ports';
import { loadScenario } from './scenario';

// BUG-42: the Date column of My orders (/user/orders) shows when each order was placed in the browser's own time zone,
// as MM/dd/yyyy HH:mm:ss, for every order; number, total and status are unchanged.
// TC-BUG-42-01 to -05 use scenario `bug-42` (.factory/stack/scenarios/bug-42): alice's orders 1 to 5 at fixed UTC instants.
// TC-BUG-42-06 replays the bug report on scenario `default`: alice places one order through checkout.
// TC-BUG-42-03 and -05 hold a highlight on each of the five rows, which takes longer than the default 30 s.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

const CHICAGO = 'America/Chicago';
const TOKYO = 'Asia/Tokyo';
const ORDERS_PATH = /\/user\/orders$/;
const DATE_FORMAT = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/;
const DATE_TEXT = /\d{2}\/\d{2}\/\d{4}/;
const UTC_ORDER_1 = '11/16/2026 15:08:50';
const ITEM_ID = 7;
const ITEM_NAME = 'Explorer 45L Backpack';

const FACTORY = process.env.FACTORY_BIN ?? 'factory';

/** Runs `docker compose <args>` against this slot's test stack. */
function compose(...args: string[]) {
  execFileSync(FACTORY, ['teststack', '--slot', String(SLOT), 'compose', ...args], { stdio: 'ignore', windowsHide: true, shell: process.platform === 'win32' });
}

async function signInAsAlice(page: Page) {
  await test.step('sign in as alice / Pass123$', async () => {
    await page.goto(BASE_URL);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill('alice');
    await page.getByPlaceholder('Password').fill('Pass123$');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  });
}

async function openOrders(page: Page, demo: { caption(text: string): Promise<void> }, timeZone: string) {
  await test.step('navigate to /user/orders', async () => {
    await page.goto(`${BASE_URL}/user/orders`);
    await expect(page).toHaveURL(ORDERS_PATH);
    await expect(page.locator('.orders-list')).toBeVisible();
    await demo.caption(`Browser time zone ${timeZone}: opened ${page.url()}`);
  });
}

/** The order row whose `.order-number` is exactly `number`. */
const row = (page: Page, number: number) =>
  page.locator('li.orders-item').filter({ has: page.locator('.order-number', { hasText: new RegExp(`^\\s*${number}\\s*$`) }) });

const dateCell = (page: Page, number: number) => row(page, number).locator('.order-date');

/**
 * Captions `label`, then outlines `locator` with it. `demo.highlight` takes its keyframe before the outline is drawn,
 * so a second keyframe (`outlined: <label>`) is taken while the outline and its label are on screen.
 */
async function mark(page: Page, demo: Demo, locator: Locator, label: string) {
  await demo.caption(label);
  const highlight = demo.highlight(locator, label);
  await page.waitForTimeout(1500);
  await captureKeyframe(`outlined: ${label}`, [page]);
  await highlight;
}

async function expectDate(cell: Locator, expected: string) {
  await expect(cell).toHaveText(expected);
  expect((await cell.innerText()).trim()).toBe(expected);
}

/** `date` in `timeZone` as yyyy-MM-dd HH:mm:ss (sortable) and as MM/dd/yyyy HH:mm:ss (the page's format). */
function inZone(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return {
    sortable: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`,
    shown: `${parts.month}/${parts.day}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

/** MM/dd/yyyy HH:mm:ss as yyyy-MM-dd HH:mm:ss. */
function sortable(shown: string) {
  const [, mm, dd, yyyy, time] = shown.match(/^(\d{2})\/(\d{2})\/(\d{4}) (.+)$/)!;
  return `${yyyy}-${mm}-${dd} ${time}`;
}

test.describe('seeded orders (scenario bug-42)', () => {
  // OrderProcessor moves Submitted orders older than one minute on to Paid, checking at start-up and then every 30 s.
  // Restarting it just before the load and pausing it right after keeps orders 1 and 5 Submitted, as the scenario seeds them.
  test.beforeAll(() => {
    compose('restart', 'order-processor');
    loadScenario('bug-42');
    compose('pause', 'order-processor');
  });

  test.afterAll(() => {
    compose('unpause', 'order-processor');
  });

  test.describe(CHICAGO, () => {
    test.use({ timezoneId: CHICAGO });

    test('TC-BUG-42-01 in America/Chicago the order placed at 15:08:50 UTC shows 11/16/2026 09:08:50', async ({ page, demo }) => {
      await signInAsAlice(page);
      await openOrders(page, demo, CHICAGO);
      await test.step('read the Date cell of order 1', async () => {
        const cell = dateCell(page, 1);
        await expectDate(cell, '11/16/2026 09:08:50');
        await expect(cell).not.toHaveText(UTC_ORDER_1);
        await mark(page, demo,cell, `Order 1 (15:08:50 UTC) in ${CHICAGO}: 11/16/2026 09:08:50`);
      });
    });

    test('TC-BUG-42-03 in America/Chicago every order shows its local date and time, across DST and a previous-day rollover', async ({ page, demo }) => {
      const expected: [number, string, string][] = [
        [1, '11/16/2026 09:08:50', '15:08:50 UTC, CST'],
        [2, '07/04/2026 16:05:07', '21:05:07 UTC, CDT'],
        [3, '03/01/2026 23:59:59', '03/02 05:59:59 UTC, previous day'],
        [4, '11/16/2026 08:59:59', '14:59:59 UTC'],
        [5, '11/16/2026 09:00:00', '15:00:00 UTC'],
      ];
      await signInAsAlice(page);
      await openOrders(page, demo, CHICAGO);
      await test.step('read the number and Date of every order row', async () => {
        const rows = page.locator('li.orders-item').filter({ has: page.locator('.order-number') });
        await expect(rows).toHaveCount(5);
        for (const [number, date, utc] of expected) {
          const cell = dateCell(page, number);
          await expectDate(cell, date);
          expect((await cell.innerText()).trim()).toMatch(DATE_FORMAT);
          await mark(page, demo,cell, `Order ${number} (${utc}): ${date}`);
        }
        const texts = (await rows.locator('.order-date').allInnerTexts()).map((t) => t.trim());
        expect(texts).toHaveLength(5);
        for (const text of texts) expect(text).toMatch(DATE_FORMAT);
        await mark(page, demo,page.locator('.orders-list'), '5 orders, each in Chicago time, MM/dd/yyyy HH:mm:ss (24-hour)');
      });
    });
  });

  test.describe(TOKYO, () => {
    test.use({ timezoneId: TOKYO });

    test('TC-BUG-42-02 in Asia/Tokyo the same order shows the next day, 11/17/2026 00:08:50', async ({ page, demo }) => {
      await signInAsAlice(page);
      await openOrders(page, demo, TOKYO);
      await test.step('read the Date cell of order 1', async () => {
        const cell = dateCell(page, 1);
        await expectDate(cell, '11/17/2026 00:08:50');
        await expect(cell).not.toHaveText(UTC_ORDER_1);
        await mark(page, demo,cell, `Order 1 (11/16 15:08:50 UTC) in ${TOKYO}: 11/17/2026 00:08:50`);
      });
    });

    test('TC-BUG-42-04 in Asia/Tokyo orders one second either side of local midnight show different dates', async ({ page, demo }) => {
      await signInAsAlice(page);
      await openOrders(page, demo, TOKYO);
      await test.step('read the Date cells of orders 4 and 5', async () => {
        const four = dateCell(page, 4);
        const five = dateCell(page, 5);
        await expectDate(four, '11/16/2026 23:59:59');
        await expectDate(five, '11/17/2026 00:00:00');
        await mark(page, demo,four, 'Order 4 (14:59:59 UTC): 11/16/2026 23:59:59');
        await mark(page, demo,five, 'Order 5 (15:00:00 UTC): 11/17/2026 00:00:00');
      });
    });

    test('TC-BUG-42-05 order number, total and status are unchanged by the date conversion', async ({ page, demo }) => {
      const expected: [number, string, string, string][] = [
        [1, '$149.99', 'Submitted', '11/17/2026 00:08:50'],
        [2, '$399.98', 'Paid', '07/05/2026 06:05:07'],
        [3, '$349.98', 'Shipped', '03/02/2026 14:59:59'],
        [4, '$199.99', 'Cancelled', '11/16/2026 23:59:59'],
        [5, '$149.99', 'Submitted', '11/17/2026 00:00:00'],
      ];
      await signInAsAlice(page);
      await openOrders(page, demo, TOKYO);
      await test.step('the header row reads Number, Date, Total, Status', async () => {
        const header = page.locator('.orders-header > div');
        await expect(header).toHaveText(['Number', 'Date', 'Total', 'Status']);
        await mark(page, demo,page.locator('.orders-header'), 'Header: Number, Date, Total, Status');
      });
      await test.step('read the number, total and status of every order row', async () => {
        await expect(page.locator('li.orders-item').filter({ has: page.locator('.order-number') })).toHaveCount(5);
        for (const [number, total, status, date] of expected) {
          const r = row(page, number);
          await expectDate(r.locator('.order-date'), date);
          const numberText = (await r.locator('.order-number').innerText()).trim();
          const totalText = (await r.locator('.order-total').innerText()).trim();
          const statusText = (await r.locator('.order-status').innerText()).trim();
          expect(numberText).toBe(String(number));
          expect(totalText).toBe(total);
          expect(statusText).toBe(status);
          for (const text of [numberText, totalText, statusText]) expect(text).not.toMatch(DATE_TEXT);
          await mark(page, demo,r, `Order ${number}: ${total}, ${status}; Date ${date}`);
        }
      });
    });
  });
});

test.describe('bug report replay (scenario default)', () => {
  test.use({ timezoneId: CHICAGO });

  test.beforeAll(() => {
    loadScenario('default');
  });

  test('TC-BUG-42-06 an order placed through the UI in America/Chicago shows the browser clock\'s time on My orders', async ({ page, demo, browser }) => {
    let before = 0;
    let after = 0;
    let instant = new Date(0);
    let chicagoShown = '';
    await signInAsAlice(page);
    await test.step(`open item ${ITEM_ID} "${ITEM_NAME}" and click "Add to shopping bag"`, async () => {
      await page.goto(`${BASE_URL}/item/${ITEM_ID}`);
      await expect(page.getByRole('heading', { name: ITEM_NAME })).toBeVisible();
      await page.getByRole('button', { name: 'Add to shopping bag' }).click();
      await expect(page.locator('.in-cart').getByRole('link', { name: 'shopping bag' })).toBeVisible();
      await demo.caption(`Added ${ITEM_NAME} to the shopping bag`);
      await demo.pause(2500);
    });
    await test.step('open /checkout, keep the prefilled address and record "before"', async () => {
      await page.goto(`${BASE_URL}/checkout`);
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
      await expect(page.getByLabel('Address')).not.toHaveValue('');
      before = Math.floor(Date.now() / 1000) * 1000;
      await demo.caption(`Browser time zone ${CHICAGO}: before = ${inZone(new Date(before), CHICAGO).shown}`);
      await demo.pause(2500);
    });
    await test.step('click "Place order", wait to leave checkout and record "after"', async () => {
      await page.getByRole('button', { name: 'Place order' }).click();
      await expect(page).not.toHaveURL(/\/checkout$/);
      after = Date.now();
      // Blazor's enhanced navigation patches the DOM in place and drops the recording's caption overlay;
      // reload the order confirmation page into a fresh document so this caption shows in the video.
      await page.reload();
      await demo.caption(`Order placed; after = ${inZone(new Date(after), CHICAGO).shown} (${CHICAGO})`);
      await demo.pause(2500);
    });
    await test.step('open My orders from the user menu', async () => {
      await page.getByRole('button', { name: 'Account' }).hover();
      const link = page.locator('.user-menu-panel').getByRole('link', { name: 'My orders', exact: true });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(ORDERS_PATH);
    });
    let utc = '';
    await test.step('read the Date of the only order row', async () => {
      const rows = page.locator('li.orders-item').filter({ has: page.locator('.order-number') });
      await expect(rows).toHaveCount(1);
      const cell = rows.locator('.order-date');
      await expect(cell).toHaveText(DATE_FORMAT);
      // The <time datetime> attribute carries the UTC instant; wait until the script has rewritten the text from it.
      instant = new Date((await cell.locator('time').getAttribute('datetime'))!);
      await expect(cell).toHaveText(inZone(instant, CHICAGO).shown);
      const shown = (await cell.innerText()).trim();
      expect(shown).toMatch(DATE_FORMAT);
      expect(sortable(shown) >= inZone(new Date(before), CHICAGO).sortable).toBe(true);
      expect(sortable(shown) <= inZone(new Date(after), CHICAGO).sortable).toBe(true);
      utc = inZone(instant, 'UTC').shown;
      expect(shown).not.toBe(utc);
      chicagoShown = shown;
    });
    await test.step('reload My orders to show the asserted Date on video (enhanced navigation removed the overlays)', async () => {
      // The assertions above ran on the page reached by enhanced navigation. Blazor's DOM patch removes the
      // recording's overlay layer, so the outline and captions below need a freshly loaded document.
      await page.reload();
      const cell = page.locator('li.orders-item').filter({ has: page.locator('.order-number') }).locator('.order-date');
      await expectDate(cell, chicagoShown);
      await demo.caption(`Window ${inZone(new Date(before), CHICAGO).shown} .. ${inZone(new Date(after), CHICAGO).shown}; UTC ${utc}`);
      await demo.pause(2500);
      await mark(page, demo, cell, `Placed order shows ${chicagoShown} (${CHICAGO}), not ${utc} UTC`);
    });
    await test.step(`open My orders again in ${TOKYO} and read the Date of the same order`, async () => {
      const context = await browser.newContext({ timezoneId: TOKYO });
      try {
        const tokyo = await context.newPage();
        const tokyoDemo = createDemo(tokyo);
        await signInAsAlice(tokyo);
        await openOrders(tokyo, tokyoDemo, TOKYO);
        const rows = tokyo.locator('li.orders-item').filter({ has: tokyo.locator('.order-number') });
        await expect(rows).toHaveCount(1);
        const cell = rows.locator('.order-date');
        // In November Chicago is CST (UTC-6) and Tokyo is UTC+9, so the same instant reads 15 hours later.
        const [, mm, dd, yyyy, hh, mi, ss] = chicagoShown.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/)!;
        const expected = inZone(new Date(Date.UTC(+yyyy, +mm - 1, +dd, +hh + 15, +mi, +ss)), 'UTC').shown;
        expect(expected).toBe(inZone(instant, TOKYO).shown);
        await expectDate(cell, expected);
        await mark(tokyo, tokyoDemo, cell, `Same order in ${TOKYO}: ${expected} (${CHICAGO} ${chicagoShown} + 15 h)`);
        await tokyoDemo.dispose();
      } finally {
        await context.close();
      }
    });
  });
});
