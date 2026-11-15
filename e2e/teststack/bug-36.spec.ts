import { test, expect } from '../demo';
import type { APIRequestContext } from '@playwright/test';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-36: listing catalog items with a negative page index or page size answers 400 with a validation problem
// naming the parameter, instead of 500; valid paging keeps returning the requested page.
// Scenario `bug-36` (.factory/stack/scenarios/bug-36): the default catalog, 101 items. Anonymous caller.
// The same cases run in-process on the functional fixture in tests/Catalog.FunctionalTests/Bug36Tests.cs;
// these run them against the Catalog API on the test stack.
test.describe.configure({ mode: 'serial' });

const LIST = (query: string) => `${url('catalog')}/api/catalog/items?${query}`;
const PROBLEM_JSON = 'application/problem+json';
const JSON_TYPE = 'application/json';
const CATALOG_COUNT = 101;

type ValidationProblem = { status: number; errors: Record<string, string[]> };
type CatalogPage = { pageIndex: number; pageSize: number; count: number; data: unknown[] };

const mediaType = (contentType: string | undefined) => (contentType ?? '').split(';')[0].trim();

test.beforeAll(() => {
  loadScenario('bug-36');
});

async function expectValidationProblem(
  request: APIRequestContext,
  query: string,
  named: string[],
  notNamed: string[],
) {
  let problem: ValidationProblem = { status: 0, errors: {} };
  await test.step(`GET /api/catalog/items?${query}`, async () => {
    const response = await request.get(LIST(query));
    expect(response.status()).toBe(400);
    expect(mediaType(response.headers()['content-type'])).toBe(PROBLEM_JSON);
    problem = await response.json();
  });
  await test.step(`the problem has status 400 and errors naming ${named.join(' and ')}`, async () => {
    expect(problem.status).toBe(400);
    for (const key of named) {
      expect(problem.errors).toHaveProperty([key]);
      expect(Array.isArray(problem.errors[key])).toBe(true);
      expect(problem.errors[key].length).toBeGreaterThan(0);
    }
    for (const key of notNamed) {
      expect(problem.errors).not.toHaveProperty([key]);
    }
  });
}

async function expectPage(
  request: APIRequestContext,
  query: string,
  expected: { pageIndex: number; pageSize: number; items: number },
) {
  let page: CatalogPage = { pageIndex: -1, pageSize: -1, count: -1, data: [] };
  await test.step(`GET /api/catalog/items?${query}`, async () => {
    const response = await request.get(LIST(query));
    expect(response.status()).toBe(200);
    expect(mediaType(response.headers()['content-type'])).toBe(JSON_TYPE);
    page = await response.json();
  });
  await test.step(`the page has pageIndex ${expected.pageIndex}, pageSize ${expected.pageSize}, count ${CATALOG_COUNT} and ${expected.items} item`, async () => {
    expect(page.pageIndex).toBe(expected.pageIndex);
    expect(page.pageSize).toBe(expected.pageSize);
    expect(page.count).toBe(CATALOG_COUNT);
    expect(Array.isArray(page.data)).toBe(true);
    expect(page.data).toHaveLength(expected.items);
  });
}

test('TC-BUG-36-01 v1 list with pageIndex=-1 returns 400 naming PageIndex', async ({ request }) => {
  await expectValidationProblem(request, 'api-version=1.0&pageIndex=-1', ['PageIndex'], ['PageSize']);
});

test('TC-BUG-36-02 v1 list with pageSize=-1 returns 400 naming PageSize', async ({ request }) => {
  await expectValidationProblem(request, 'api-version=1.0&pageSize=-1', ['PageSize'], ['PageIndex']);
});

test('TC-BUG-36-03 v2 list with pageIndex=-1 returns 400 naming PageIndex', async ({ request }) => {
  await expectValidationProblem(request, 'api-version=2.0&pageIndex=-1', ['PageIndex'], ['PageSize']);
});

test('TC-BUG-36-04 v2 list with pageSize=-1 returns 400 naming PageSize', async ({ request }) => {
  await expectValidationProblem(request, 'api-version=2.0&pageSize=-1', ['PageSize'], ['PageIndex']);
});

test('TC-BUG-36-05 v1 list with pageIndex=-1 and pageSize=-1 names both parameters', async ({ request }) => {
  await expectValidationProblem(request, 'api-version=1.0&pageIndex=-1&pageSize=-1', ['PageIndex', 'PageSize'], []);
});

test('TC-BUG-36-06 v1 list with pageIndex=0 and pageSize=1 still returns the first page', async ({ request }) => {
  await expectPage(request, 'api-version=1.0&pageIndex=0&pageSize=1', { pageIndex: 0, pageSize: 1, items: 1 });
});

test('TC-BUG-36-07 v2 list with pageIndex=0 and pageSize=1 still returns the first page', async ({ request }) => {
  await expectPage(request, 'api-version=2.0&pageIndex=0&pageSize=1', { pageIndex: 0, pageSize: 1, items: 1 });
});

test('TC-BUG-36-08 v1 list with pageIndex=10 and pageSize=10 returns the last partial page', async ({ request }) => {
  await expectPage(request, 'api-version=1.0&pageIndex=10&pageSize=10', { pageIndex: 10, pageSize: 10, items: 1 });
});
