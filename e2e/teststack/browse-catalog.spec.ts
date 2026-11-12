import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// The demo catalog of the `default` scenario (.factory/stack/scenarios/default), browsed as a visitor.
test.beforeAll(() => {
  loadScenario('default');
});

test('a visitor browses the seeded catalog and opens a product', async ({ page, demo }) => {
  await demo.chapter('Browse the catalog', 'The default scenario seeds the demo catalog: 101 products.');
  await page.goto(BASE_URL);
  await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
  await demo.highlight(page.locator('.catalog-product').first(), 'first product of page 1');

  demo.caption('Open a product from the catalog');
  await page.getByRole('link', { name: 'Adventurer GPS Watch' }).click();
  const title = page.getByRole('heading', { name: 'Adventurer GPS Watch' });
  await expect(title).toBeVisible();
  await demo.highlight(title, 'product details');
});
