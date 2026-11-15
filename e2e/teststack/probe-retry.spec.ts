import { test, expect } from '../demo';
import { BASE_URL } from './ports';

// [PROBE] Council C8 live proof of the CI delivery decision on a feature PR: this spec fails on its first attempt by
// design and passes on Playwright's retry, so CI is green only with a retry. The PR is closed unmerged after the proof.
test('TC-PRB-4-01 probe: the catalog opens (fails on its first attempt by design)', async ({ page }, testInfo) => {
  if (testInfo.retry === 0) throw new Error('probe: this spec fails on its first attempt by design');
  await page.goto(BASE_URL);
  await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
});
