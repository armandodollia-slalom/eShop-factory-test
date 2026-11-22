import path from 'node:path';
import fs from 'node:fs';
/* eslint-disable @typescript-eslint/no-explicit-any -- wraps Playwright's generic test, step and request APIs, whose types are generic over any */
import { test as base, expect, APIRequestContext, APIResponse, Browser, BrowserContext, BrowserContextOptions, Page, TestInfo, TestType, Video } from '@playwright/test';

/**
 * `test` for every e2e spec. Playwright only records video for the built-in `page`/`context` fixtures;
 * this also records contexts a test opens itself with `browser.newContext()` (multi-user flows), using the
 * project's `video` settings, and attaches each page's video as `video` so the video reporter collects it.
 *
 *   import { test, expect } from '../fixtures';
 *
 * Contexts opened in `beforeAll`/`afterAll` are not recorded: they are setup, not part of a test's flow.
 *
 * Agents can't watch a video, so every recorded test also gets keyframes: labelled screenshots taken at
 * the end of each `test.step`, at each `demo` checkpoint (e2e/demo.ts), and of every open page when the
 * test ends (`final`, or `failure` when it failed). They are attached as `keyframe: <label>`, and
 * e2e/video-reporter.ts lists them next to the videos in artifacts/e2e-videos/manifest.json.
 */

type VideoOption = { mode?: string; size?: { width: number; height: number }; show?: { actions?: object } };

// Demo mode (E2E_DEMO=1, the factory's local video step): every page is recorded at E2E_VIDEO_SIZE (default 1280x720,
// the viewport too, so nothing is scaled down), and no spec can shorten its own timeout below E2E_DEMO_TIMEOUT_MS: demo
// pacing makes a test several times slower than at test speed, and a spec's `test.setTimeout` or
// `test.describe.configure({ timeout })` would otherwise cut the recording short.
const DEMO = process.env.E2E_DEMO === '1';
const DEMO_SIZE = (() => {
  const m = /^(\d{3,4})x(\d{3,4})$/.exec(process.env.E2E_VIDEO_SIZE ?? '');
  return m ? { width: Number(m[1]), height: Number(m[2]) } : { width: 1280, height: 720 };
})();
const DEMO_TIMEOUT_MS = Number(process.env.E2E_DEMO_TIMEOUT_MS ?? 0) || 0;
function liftTimeout(testInfo: TestInfo) {
  if (!DEMO || !DEMO_TIMEOUT_MS) return;
  const set = testInfo.setTimeout.bind(testInfo);
  if (testInfo.timeout && testInfo.timeout < DEMO_TIMEOUT_MS) set(DEMO_TIMEOUT_MS);
  // 0 (no timeout) stays; anything shorter is raised to the demo floor.
  testInfo.setTimeout = (ms: number) => set(ms === 0 ? 0 : Math.max(ms, DEMO_TIMEOUT_MS));
}

let current:
  | { testInfo: TestInfo; contexts: BrowserContext[]; videos: (Video | null)[]; pages: Page[]; manualPages: Set<Page>; frames: number }
  | undefined;

function keyframeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'frame';
}

/** Screenshot `pages` (default: every open page of the current test) and attach them as keyframes. Never throws. */
// The URL caption every keyframe carries (evidence by construction: a reviewer never has to ask which page a frame
// shows). Drawn for the screenshot only, in a closed shadow root the test's locators cannot see, then removed.
const URL_CAPTION_ATTR = 'data-factory-url-caption';
async function stampUrl(page: Page) {
  await page
    .evaluate(([attr, url]) => {
      const host = document.createElement('div');
      host.setAttribute(attr, '');
      host.setAttribute('aria-hidden', 'true');
      host.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483647;pointer-events:none;max-width:70vw;';
      const root = host.attachShadow({ mode: 'closed' });
      const bar = document.createElement('div');
      bar.textContent = `URL ${url}`;
      bar.style.cssText = 'font:600 12px/1.5 ui-monospace,Menlo,monospace;background:rgba(15,23,42,.88);color:#fff;padding:2px 8px;border-radius:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      root.appendChild(bar);
      document.documentElement.appendChild(host);
    }, [URL_CAPTION_ATTR, page.url()] as const)
    .catch(() => {});
}
async function unstampUrl(page: Page) {
  await page.evaluate(attr => document.querySelectorAll(`[${attr}]`).forEach(n => n.remove()), URL_CAPTION_ATTR).catch(() => {});
}

export async function captureKeyframe(label: string, pages?: Page[]) {
  const recording = current;
  if (!recording || !videoSettings(recording.testInfo)) return;
  const open = (pages ?? recording.pages).filter(page => !page.isClosed());
  for (const [i, page] of open.entries()) {
    const name = open.length > 1 ? `${label} [page ${i + 1}]` : label;
    const file = recording.testInfo.outputPath('keyframes', `${String(++recording.frames).padStart(2, '0')}-${keyframeSlug(name)}.png`);
    try {
      await stampUrl(page);
      try {
        await page.screenshot({ path: file, timeout: 5000, animations: 'disabled', caret: 'initial' });
      } finally {
        await unstampUrl(page);
      }
      await recording.testInfo.attach(`keyframe: ${name}`, { path: file, contentType: 'image/png' });
      // The keyframe's URL as text too, for agents and the harness (keyframes/index.jsonl).
      fs.appendFileSync(recording.testInfo.outputPath('keyframes', 'index.jsonl'), `${JSON.stringify({ file: path.basename(file), label: name, url: page.url() })}\n`);
    } catch {
      // A page that is navigating or crashed is not worth failing the test over.
    }
  }
}

/** Makes `test.step` capture a keyframe when each step ends (labelled `failed` if it threw). */
export function withStepKeyframes<T extends TestType<any, any>>(testType: T): T {
  const original = testType.step;
  const step = original.bind(testType);
  const wrapped = ((title: string, body: (...args: any[]) => any, options?: any) =>
    step(title, async (...args: any[]) => {
      try {
        const result = await body(...args);
        await captureKeyframe(`step: ${title}`);
        return result;
      } catch (error) {
        await captureKeyframe(`step failed: ${title}`);
        throw error;
      }
    }, options)) as T['step'];
  Object.assign(wrapped, original);
  testType.step = wrapped;
  return testType;
}

function videoSettings(testInfo: TestInfo): VideoOption | undefined {
  const video = (testInfo.project.use as { video?: string | VideoOption }).video;
  const settings = typeof video === 'string' ? { mode: video } : video;
  if (!settings?.mode || settings.mode === 'off') return undefined;
  if (settings.mode === 'on-first-retry' && testInfo.retry !== 1) return undefined;
  return settings;
}

/**
 * With E2E_API_LOG=1 every call a test makes through the `request` fixture is attached as `api-exchanges`
 * (method, URL, request body, status, response body; secrets redacted, bodies truncated). The video reporter
 * copies them into manifest.json, and scripts/pr-video turns them into the PR's "API changes" section.
 */
const API_LOG = /^(1|true|yes)$/i.test(process.env.E2E_API_LOG ?? '');
const API_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'fetch']);
const API_BODY_LIMIT = 4000;
const SECRET_HEADER = /authorization|cookie|(?<!(?:continuation|page|next|cursor)[-_.]?)token|secret|password|passwd|passphrase|(?:^|[-_.])(?:pass|pwd)(?:$|[-_.])|(?:api|access|private|auth|encryption|signing|subscription|functions?|master|host|client|app)[-_.]?key|client[-_.]?principal|session|credential|signature|(?:^|[-_.])pat$/i;
const SECRET_KEY = /pass(word)?|secret|token|api[-_]?key/i;

export interface ApiExchange {
  method: string;
  /** Where the response came from (after any redirect). */
  url: string;
  /** What the test asked for (before any redirect). */
  requestUrl?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  /** 'as-given': the body is the object or form the test passed, printed as JSON, not the bytes sent. */
  requestBodyForm?: 'as-given';
  status: number;
  responseContentType?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  durationMs?: number;
  /** The label of the `reproduction` block the call was made in. */
  repro?: string;
}

/**
 * A backend bug's reproduction: the calls a test makes through the `request` fixture inside `fn` are recorded as the
 * reproduction (`repro: label` on each exchange), and an assertion that fails inside it is recorded as the reproduction
 * check that failed. The factory runs the bug's case on the code the fix starts from (where it must fail here) and on
 * the fix, and posts the recorded requests and responses on the ticket and in the PR (docs/ai-pipeline/pr-demo-video.md).
 *
 *   await reproduction('Place an order with a card type the shop does not know', async () => {
 *     const response = await request.post(url('ordering', '/api/orders'), { data: order, headers });
 *     expect(response.status()).toBe(400);
 *   });
 */
let reproLabel: string | null = null;
let reproTestInfo: TestInfo | undefined;
let reproResponses = 0;
// testInfo.errors.length when the current top-level block recorded its first response: only a soft assertion that fails
// after it counts as the reproduction (one that failed before, a precondition, does not).
let reproErrorsAtFirstResponse: number | null = null;
let reproRecord: { labels: string[]; failed?: { label: string; kind: 'check' | 'error'; matcher?: string; soft?: boolean; responses: number; message: string } } = { labels: [] };

// eslint-disable-next-line no-control-regex
const stripAnsiCodes = (t: string) => t.replace(/\u001b\[[0-9;]*m/g, '');

function formatCheckMessage(raw: unknown): string {
  const lines = stripAnsiCodes(String(raw ?? '')).split('\n').filter(l => l.trim());
  const checkLines = lines.filter(l => /expect|received|expected/i.test(l));
  return (checkLines.length ? checkLines : lines).slice(0, 4).join('\n').slice(0, 600);
}

/**
 * True only for a Playwright `expect(...)` matcher failure (`ExpectError` / `JestAssertionError` carrying a
 * `matcherResult` object with string `name`, boolean `pass`, and `message`).
 */
function isPlaywrightAssertion(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { matcherResult?: unknown; constructor?: { name?: string } };
  const ctor = e.constructor?.name ?? '';
  if (ctor !== 'ExpectError' && ctor !== 'JestAssertionError') return false;
  const mr = e.matcherResult as { name?: unknown; pass?: unknown; message?: unknown } | undefined;
  return Boolean(
    mr && typeof mr === 'object'
    && typeof mr.name === 'string'
    && typeof mr.pass === 'boolean'
    && (typeof mr.message === 'string' || typeof mr.message === 'function'),
  );
}

export async function reproduction<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const prevLabel = reproLabel;
  if (prevLabel === null) {
    reproRecord.failed = undefined;
    reproErrorsAtFirstResponse = null;
  }
  const responsesBefore = reproResponses;
  const errorsBefore = reproTestInfo?.errors.length ?? 0;
  reproLabel = label;
  if (!reproRecord.labels.includes(label)) reproRecord.labels.push(label);
  try {
    const result = await fn();
    const added = reproTestInfo ? reproTestInfo.errors.slice(errorsBefore) : [];
    const afterResponse = reproTestInfo && reproErrorsAtFirstResponse !== null ? reproTestInfo.errors.slice(Math.max(errorsBefore, reproErrorsAtFirstResponse)) : [];
    const responses = reproResponses - responsesBefore;
    if (added.length > 0 && reproRecord.failed?.kind !== 'check') {
      if (responses > 0 && afterResponse.length > 0) {
        reproRecord.failed = { label, kind: 'check', soft: true, responses, message: formatCheckMessage(afterResponse.at(-1)?.message) };
      } else if (prevLabel === null) {
        reproRecord.failed = { label, kind: 'error', responses: 0, message: '' };
      }
    }
    return result;
  } catch (error) {
    const responses = reproResponses - responsesBefore;
    const assertion = isPlaywrightAssertion(error);
    const kind: 'check' | 'error' = assertion && responses > 0 ? 'check' : 'error';
    const mr = (error as { matcherResult?: { name?: unknown } })?.matcherResult;
    const matcher = typeof mr?.name === 'string' ? mr.name : undefined;
    if (reproRecord.failed?.kind !== 'check') {
      reproRecord.failed = { label, kind, ...(kind === 'check' && matcher ? { matcher } : {}), responses, message: kind === 'check' ? formatCheckMessage((error as Error)?.message ?? error) : '' };
    }
    throw error;
  } finally {
    reproLabel = prevLabel;
  }
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SECRET_KEY.test(k) ? '***' : redact(v)]));
  }
  return value;
}

// A `"key": value` pair of a JSON text whose value is a string, number or literal (an object or list under a secret-named
// key is left whole for the harness, which masks it by its span); every part length-bounded (linear time on any body).
const JSON_PAIR = /("(?:[^"\\\n]|\\.){1,128}")(\s*:\s*)("(?:[^"\\\n]|\\.){0,4096}"|-?\d[\d.eE+-]{0,64}|true|false|null)(?=\s*[,}\]\n]|$)/g;

function bodyText(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  let text: string;
  if (Buffer.isBuffer(value)) {
    text = `<${value.length} bytes>`;
  } else if (typeof value === 'string') {
    // A text body is kept as it was sent or received, never parsed and printed again (that rounds integers above 2^53
    // and drops duplicate keys); values under secret-named keys are masked in place.
    text = value.replace(JSON_PAIR, (pair, key, sep) => (SECRET_KEY.test(key) ? `${key}${sep}"***"` : pair));
  } else {
    text = JSON.stringify(redact(value), null, 2);
  }
  return text.length > API_BODY_LIMIT ? `${text.slice(0, API_BODY_LIMIT)}\n… (${text.length - API_BODY_LIMIT} more characters)` : text;
}

async function toExchange(name: string, target: any, options: any, response: APIResponse): Promise<ApiExchange> {
  const isRequest = target && typeof target === 'object' && typeof target.url === 'function';
  const method = (name === 'fetch' ? options?.method ?? (isRequest ? target.method() : 'GET') : name).toUpperCase();
  const headers = Object.entries((options?.headers ?? {}) as Record<string, string>)
    .map(([k, v]) => [k, SECRET_HEADER.test(k) ? '***' : String(v)]);
  const form = options?.form ?? (options?.multipart ? Object.fromEntries(Object.keys(options.multipart).map(k => [k, '<part>'])) : undefined);
  // An object, form or multipart body is the test's own value, printed: not the bytes Playwright sent.
  const given = options?.data !== undefined ? typeof options.data !== 'string' && !Buffer.isBuffer(options.data) : Boolean(form);
  const requested = typeof target === 'string' ? target : isRequest ? target.url() : undefined;
  const contentType = response.headers()['content-type'];
  const responseHeaders = Object.fromEntries(Object.entries(response.headers()).map(([k, v]) => [k, SECRET_HEADER.test(k) ? '***' : String(v)]));
  const raw = await response.body().catch(() => undefined);
  return {
    method,
    url: response.url(),
    ...(requested ? { requestUrl: requested } : {}),
    ...(headers.length ? { requestHeaders: Object.fromEntries(headers) } : {}),
    ...(options?.data !== undefined || form ? { requestBody: bodyText(options?.data ?? form), ...(given ? { requestBodyForm: 'as-given' as const } : {}) } : {}),
    status: response.status(),
    ...(contentType ? { responseContentType: contentType } : {}),
    responseHeaders,
    ...(raw?.length ? { responseBody: /json|text|xml|problem/i.test(contentType ?? '') ? bodyText(raw.toString('utf8')) : `<${raw.length} bytes>` } : {}),
  };
}

function recordApiCalls(context: APIRequestContext, log: ApiExchange[]): APIRequestContext {
  return new Proxy(context, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      if (typeof prop !== 'string' || !API_METHODS.has(prop)) return value.bind(target);
      return async (urlOrRequest: any, options?: any) => {
        const repro = reproLabel;
        const started = Date.now();
        const response: APIResponse = await value.call(target, urlOrRequest, options);
        const durationMs = Date.now() - started;
        const exchange: ApiExchange = await toExchange(prop, urlOrRequest, options, response).catch(() => ({ method: prop.toUpperCase(), url: response.url(), status: response.status() }));
        log.push({ ...exchange, durationMs, ...(repro ? { repro } : {}) });
        if (repro) {
          if (reproErrorsAtFirstResponse === null) reproErrorsAtFirstResponse = reproTestInfo?.errors.length ?? 0;
          reproResponses++;
        }
        return response;
      };
    },
  });
}

export const test = withStepKeyframes(base.extend<{ _recordManualContexts: void }, { browser: Browser }>({
  ...(DEMO
    ? {
        // Playwright requires the fixtures argument to be destructured, even when no fixture is used.
        // eslint-disable-next-line no-empty-pattern
        viewport: async ({}, use: (v: { width: number; height: number }) => Promise<void>) => use(DEMO_SIZE),
        video: [async ({ video }: { video: any }, use: (v: any) => Promise<void>) => {
          const mode = typeof video === 'string' ? video : video?.mode ?? 'off';
          await use(mode === 'off' ? video : { ...(typeof video === 'object' ? video : {}), mode, size: DEMO_SIZE });
        }, { scope: 'worker' }],
      } as any
    : {}),
  request: async ({ request }, use, testInfo) => {
    if (!API_LOG) return use(request);
    const log: ApiExchange[] = [];
    reproTestInfo = testInfo;
    reproResponses = 0;
    reproErrorsAtFirstResponse = null;
    reproRecord = { labels: [] };
    try {
      await use(recordApiCalls(request, log));
    } finally {
      reproTestInfo = undefined;
    }
    if (log.length) await testInfo.attach('api-exchanges', { body: JSON.stringify(log), contentType: 'application/json' });
    if (reproRecord.labels.length) await testInfo.attach('api-reproduction', { body: JSON.stringify(reproRecord), contentType: 'application/json' });
  },

  page: async ({ page }, use, testInfo) => {
    current?.pages.push(page);
    await use(page);
    await captureKeyframe(testInfo.status === testInfo.expectedStatus ? 'final' : 'failure', [page]);
  },

  browser: [
    async ({ browser }, use) => {
      const newContext = browser.newContext.bind(browser);
      browser.newContext = async (options: BrowserContextOptions = {}) => {
        const settings = current && !options.recordVideo ? videoSettings(current.testInfo) : undefined;
        if (!current || !settings) return newContext(options);
        const context = await newContext({
          ...options,
          recordVideo: {
            dir: current.testInfo.outputPath('videos'),
            size: DEMO ? DEMO_SIZE : settings.size ?? { width: 1280, height: 720 },
            ...(settings.show?.actions ? { showActions: settings.show.actions } : {}),
          },
        });
        const recording = current;
        recording.contexts.push(context);
        context.on('page', page => {
          recording.videos.push(page.video());
          recording.pages.push(page);
          recording.manualPages.add(page);
        });
        return context;
      };
      await use(browser);
      browser.newContext = newContext;
    },
    { scope: 'worker' },
  ],

  _recordManualContexts: [
    // Playwright requires the fixtures argument to be destructured, even when no fixture is used.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, testInfo) => {
      const contexts: BrowserContext[] = [];
      const videos: (Video | null)[] = [];
      current = { testInfo, contexts, videos, pages: [], manualPages: new Set(), frames: 0 };
      liftTimeout(testInfo);
      await use();
      await captureKeyframe(testInfo.status === testInfo.expectedStatus ? 'final' : 'failure', [...current.manualPages]);
      current = undefined;

      // Videos are only written once their context closes.
      await Promise.all(contexts.map(context => context.close().catch(() => {})));
      const passed = testInfo.status === testInfo.expectedStatus;
      const mode = videoSettings(testInfo)?.mode;
      if (passed && (mode === 'retain-on-failure' || mode === 'retain-on-first-failure')) return;
      for (const video of videos) {
        const path = await video?.path().catch(() => undefined);
        if (path) await testInfo.attach('video', { path, contentType: 'video/webm' });
      }
    },
    { auto: true },
  ],
}));

export { expect };
