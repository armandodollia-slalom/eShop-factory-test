import { Locator, Page, TestInfo } from '@playwright/test';
import { captureKeyframe, test as base, expect as baseExpect, withStepKeyframes } from './fixtures';

/**
 * Narration for e2e tests. Every e2e test is already recorded on video (see `video` in playwright.config.ts); use this
 * fixture to make a feature's video read like a demo.
 *
 * In demo mode the fixture narrates by itself, in viewer language, with no work from the spec author: every navigation
 * ("Open the Brands page"), click ("Click the Daybird card"), typing ("Type the gift message"; secret values never
 * shown), choice and tick, and the assertions a viewer can see ("13 cards are shown", "“11 products” is shown"). The
 * wording comes from accessible names, labels and roles, never from selectors or raw URLs. Every video opens with one
 * line on what it demonstrates (the test title and its ticket) and ends with the outcome. A caption the spec writes
 * itself (`demo.caption` right before an action, `demo.click(locator, 'caption')`, a highlight label) takes precedence
 * for its step; add one only where the automatic line would not explain the step to a viewer.
 *
 *   import { test, expect } from '../demo';
 *   test('...', async ({ page, demo }) => {
 *     await demo.chapter('Checkout');
 *     await demo.caption('The shopper opens the bag');          // one caption = one narrated step
 *     await demo.click(page.getByRole('link', { name: 'Bag' }));  // a drawn cursor moves there and clicks
 *     await demo.fill(page.getByLabel('Password'), PASSWORD);     // masked on screen and in the caption
 *   });
 *
 * Demo mode (E2E_DEMO=1, set by the factory when it records a PR's demo video on the machine that runs the pipeline):
 * slower pacing (a delay before each step and a hold after each visible change, E2E_DEMO_PACING), and a step log next
 * to the video (`demo-steps` attachment: each caption with its start and end, the regions covered because they showed
 * a secret, the redacted visible text of each step). The factory narrates the captions, holds each step for its audio,
 * writes the `.vtt` subtitles and re-checks everything for secrets before the video may be published
 * (docs/ai-pipeline/pr-demo-video.md). Outside demo mode the same calls run at test speed.
 *
 * Secrets never show: a value typed into a password, token, key or secret field (by input type, name, id, label,
 * placeholder and autocomplete, or `{ secret: true }`) is covered on screen and shown as dots in the caption; every
 * step's visible text (page text, input values, the URL) is scanned with the factory's secret detector
 * (E2E_REDACT_MODULE, else a built-in subset) and each match is covered for as long as it is visible. Captions are
 * redacted before they are drawn. Use the repository's allow-listed placeholder values in specs.
 */
export interface Demo {
  /** Full-screen title card that narrates the next step. Blocks for its duration. */
  chapter(title: string, description?: string, durationMs?: number): Promise<void>;
  /** A narrated step: the caption at the bottom of the video (one caption per step). Pass '' to clear. */
  caption(text: string): Promise<void>;
  /** Alias of `caption`. */
  step(text: string): Promise<void>;
  /**
   * Bring the element a case asserts into view, outline it with a label and hold it on screen, so the video
   * and the keyframe (`highlight: <label>`) show the state the case proves. Every UI case needs one (or
   * `absent`): feature verification refuses a UI case whose keyframes show none.
   */
  highlight(locator: Locator, label?: string, durationMs?: number): Promise<void>;
  /**
   * For a case that proves something is NOT shown: bring the place where it would be into view (`anchor`,
   * for example the block it would follow), mark it with a dashed outline and the label, and hold it. The
   * keyframe is `absent: <label>`.
   */
  absent(anchor: Locator, label: string, durationMs?: number): Promise<void>;
  /** Move the drawn cursor to the element, show the click, click it, and hold. */
  click(locator: Locator, caption?: string): Promise<void>;
  /** Move the cursor to a field and type the value like a human; secret fields are masked. */
  fill(locator: Locator, value: string, options?: { caption?: string; secret?: boolean }): Promise<void>;
  /** Type like a human, so the input is readable in the video (secret fields are masked). */
  type(locator: Locator, text: string, options?: { secret?: boolean }): Promise<void>;
  /** Let the viewer catch up. */
  pause(ms?: number): Promise<void>;
}

const DEMO = process.env.E2E_DEMO === '1';
const PACING = { stepDelayMs: 700, holdMs: 1500, typeDelayMs: 90, cursorMs: 600, ...(() => { try { return JSON.parse(process.env.E2E_DEMO_PACING ?? '{}'); } catch { return {}; } })() };
const pace = (ms: number) => (DEMO ? ms : 0);

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// ---- secret detection -------------------------------------------------------------------------------------------
// The factory's redaction boundary when the harness names it (E2E_REDACT_MODULE: scripts/pipeline/lib/redact.mjs of the
// factory install), else a built-in subset: common token shapes and `<credential word>[:=]<value>`.
type Detect = (text: string) => { text: string; hits: string[] };
const BUILTIN: [string, RegExp][] = [
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/g],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['slack-token', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g],
  ['api-key', /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{20,}\b/g],
  ['jwt', /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g],
  ['private-key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ['generic-api-key', /\b(?:api[_-]?key|secret|token|password|passwd)\s*[:=]\s*["']?[A-Za-z0-9+/_.~-]{8,}/gi],
];
const builtin: Detect = text => {
  const hits: string[] = [];
  let out = text;
  for (const [rule, re] of BUILTIN) out = out.replace(re, () => (hits.push(rule), `[redacted:${rule}]`));
  return { text: out, hits };
};
let detectorPromise: Promise<Detect> | undefined;
function detector(): Promise<Detect> {
  detectorPromise ??= (async () => {
    const mod = process.env.E2E_REDACT_MODULE;
    if (!mod) return builtin;
    try {
      const m = await import(mod);
      const extra = (process.env.E2E_SECRET_VALUES ?? '').split('\n').filter(v => v.length >= 6);
      return (text: string) => {
        const r = m.redactText(text) as { text: string; hits: string[] };
        let out = r.text;
        const hits = [...r.hits];
        for (const v of extra) {
          if (!out.includes(v)) continue;
          out = out.split(v).join('[redacted:value]');
          hits.push('value');
        }
        const b = builtin(out);
        return { text: b.text, hits: [...hits, ...b.hits] };
      };
    } catch {
      return builtin;
    }
  })();
  return detectorPromise;
}
const SECRET_FIELD = /pass(word|wd|phrase)?|token|secret|api[-_ ]?key|apikey|private[-_ ]?key|credential|client[-_ ]?secret|otp|pin\b/i;

// ---- viewer wording ---------------------------------------------------------------------------------------------
// Ticket titles by key (E2E_DEMO_TICKETS, set by the factory's local video step from the ticket cache).
const TICKETS: Record<string, string> = (() => { try { return JSON.parse(process.env.E2E_DEMO_TICKETS ?? '{}'); } catch { return {}; } })();
const clean = (t: string | null | undefined) => (t ?? '').replace(/\s+/g, ' ').trim();
const upperFirst = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const lowerFirst = (t: string) => (/^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);
const humanize = (t: string) => { let v = t; try { v = decodeURIComponent(t); } catch { /* as is */ } return clean(v.replace(/[-_+]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')); };
const plural = (noun: string, n: number) => (n === 1 ? noun : noun.endsWith('x') ? `${noun}es` : `${noun}s`);
const norm = (t: string) => t.toLowerCase().replace(/^(now|then|next)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** A page as a viewer names it: "the Brands page", "the home page, with sort count". Query values that look like keys are left out. */
export function pageName(href: string): string {
  let url: URL;
  try { url = new URL(href); } catch { return 'the page'; }
  // A value that could be a credential (a redacted one, or a long run of letters and digits) is never read out.
  const hidden = (v: string) => /redacted/i.test(v) || (/^[\w\-+/=.~%]{20,}$/.test(v) && /\d/.test(v) && /[a-z]/i.test(v));
  const segs = url.pathname.split('/').filter(Boolean).filter(x => !/^\d+$/.test(x) && !/^[0-9a-f-]{16,}$/i.test(x) && !hidden(x));
  const last = segs.at(-1);
  const base = last ? `the ${upperFirst(humanize(last))} page` : 'the home page';
  const query = [...url.searchParams.entries()].filter(([k]) => !/token|key|secret|code|state|session|pass|auth|sig/i.test(k)).slice(0, 3).map(([k, v]) => `${humanize(k)} ${hidden(v) ? 'a hidden value' : humanize(v)}`);
  return query.length ? `${base}, with ${query.join(' and ')}` : base;
}
/** Raw paths in a caption the spec wrote ("Opened /brands?sort=count") read as page names ("Opened the Brands page, with sort count"). */
export function viewerText(text: string, origin = 'http://localhost'): string {
  const bareRoot = /^(opened|now at|now on|at|on|back at|back on|reloaded)\b/i.test(text.trim());
  return text.replace(/(^|[\s(])(https?:\/\/[^\s)]+|\/(?:[\w\-.~%?=&+]+\/?)+|\/(?=$|[\s),.;:]))/g, (m, pre: string, raw: string) => {
    if (raw === '/' && !bareRoot) return m;
    try { return `${pre}${pageName(new URL(raw.replace(/[.,;:]+$/, ''), origin).href)}`; } catch { return m; }
  });
}
/** The name a selector gives an element when the element is gone (`getByRole('link', { name: 'Brands' })`). */
function nameFromSelector(selector: string) {
  const m = /name:\s*['"]([^'"]+)['"]|getBy(?:Text|Label|Placeholder|Title|AltText)\(['"]([^'"]+)['"]|internal:(?:text|label|attr)=\[?[^"]*"([^"]+)"/.exec(selector);
  return m ? clean(m[1] ?? m[2] ?? m[3]) : '';
}
interface Subject { name: string; noun: string; selected?: string }
/** What a viewer calls an element: its accessible name (label, aria-label, heading, text) and a noun from its role. */
async function subjectOf(locator: Locator): Promise<Subject> {
  const fallback = { name: nameFromSelector(String(locator)), noun: '' };
  const s = await locator.first().evaluate((el: Element) => {
    const c = (t: string | null | undefined) => (t ?? '').replace(/\s+/g, ' ').trim();
    const e = el as HTMLInputElement;
    const tag = e.tagName.toLowerCase();
    const type = (e.getAttribute('type') ?? '').toLowerCase();
    const explicit = e.getAttribute('role');
    const role = explicit ?? (tag === 'a' && e.hasAttribute('href') ? 'link'
      : tag === 'button' || (tag === 'input' && ['button', 'submit', 'reset'].includes(type)) ? 'button'
      : tag === 'select' ? 'list'
      : type === 'checkbox' ? 'checkbox' : type === 'radio' ? 'option'
      : tag === 'textarea' || tag === 'input' ? 'field'
      : /^h[1-6]$/.test(tag) ? 'heading' : tag === 'img' ? 'image' : tag === 'li' ? 'item' : '');
    const byIds = (ids: string | null) => (ids ?? '').split(/\s+/).map(id => document.getElementById(id)?.textContent ?? '').join(' ');
    const label = c(e.getAttribute('aria-label')) || c(byIds(e.getAttribute('aria-labelledby'))) || c(e.labels?.[0]?.textContent) || c(e.getAttribute('placeholder')) || c(e.getAttribute('alt')) || c(e.getAttribute('title'));
    const heading = c(e.querySelector?.('h1,h2,h3,h4,h5,h6')?.textContent);
    const cardLike = tag === 'article' || /(^|[\s_-])card($|[\s_-])/i.test(String(e.className ?? '')) || Boolean(heading && e.closest('article'));
    const nouns: Record<string, string> = { link: 'link', button: 'button', list: 'list', combobox: 'list', listbox: 'list', checkbox: 'checkbox', option: 'option', radio: 'option', field: 'field', textbox: 'field', searchbox: 'field', heading: 'heading', image: 'image', img: 'image', item: 'item', listitem: 'item', tab: 'tab', menuitem: 'menu item', switch: 'switch' };
    const noun = cardLike && heading ? 'card' : nouns[role] ?? '';
    const text = c((e as HTMLElement).innerText ?? e.textContent).split(' ').slice(0, 8).join(' ');
    const name = (noun === 'card' ? heading : '') || label || heading || (noun === 'field' || noun === 'list' ? '' : text);
    const selected = tag === 'select' ? c((e as unknown as HTMLSelectElement).selectedOptions?.[0]?.textContent) : undefined;
    return { name, noun, selected };
  }, undefined, { timeout: 1500 }).catch(() => null);
  if (!s) return fallback;
  return { ...s, name: s.name.length > 60 ? `${s.name.slice(0, 57)}...` : s.name || fallback.name };
}
const the = (s: Subject) => (s.noun ? `the ${s.name ? `${s.name} ` : ''}${s.noun}` : s.name ? `“${s.name}”` : 'the highlighted element');

// ---- the step log -----------------------------------------------------------------------------------------------
interface Box { x: number; y: number; w: number; h: number }
interface PageState { page: string; heading: string }
interface StepLog {
  version: 1;
  demo: boolean;
  startedAt: number;
  viewport: { width: number; height: number } | null;
  pacing: typeof PACING;
  steps: { i: number; kind: string; caption: string; t0: number; t1: number; auto?: boolean }[];
  /**
   * Every user action (navigation, click, typing, choice) and the step whose line narrates it: when the cursor set off
   * (`t`), when the action happened (`at`), when its result had settled (`end`), its target in viewer words, and the
   * page and heading before and after. The factory's narrator reads these, and the renderer times the video by them.
   */
  actions: { t: number; kind: string; step: number; at?: number; end?: number; target?: { name: string; role: string }; value?: string; before?: PageState; after?: PageState }[];
  /** Every visible assertion that passed, in viewer words, and the step whose line says it. */
  checks: { t: number; step: number; line: string; matcher: string }[];
  /**
   * Where the test failed, when it did: an assertion (`check`, with the line it expected, what the screen showed instead
   * and the page), or an action or navigation. A bug's "before the fix" recording is used only when it failed at the
   * check its "after" recording passes, after the same actions (the factory verifies this).
   */
  failed?: { t: number; kind: 'check' | 'action' | 'navigation'; matcher?: string; line?: string; observed?: string; actionsBefore: number; page?: PageState; what?: string };
  outcome?: string;
  masks: (Box & { t0: number; t1: number; why: string })[];
  visible: { t: number; step: number; text: string }[];
  unmasked: { t: number; step: number; where: string; rules: string[] }[];
}

// Scroll the element into view and let entrance animations (scroll-reveal, fades) finish, so the keyframe
// shows the element as a viewer sees it rather than mid-animation or still hidden.
async function bringIntoView(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator
    .evaluate(el => Promise.race([
      Promise.all([el, ...Array.from(el.querySelectorAll('*'))].flatMap(n => n.getAnimations()).map(a => a.finished)),
      new Promise(resolve => setTimeout(resolve, 1500)),
    ]))
    .catch(() => {});
  await locator.page().waitForTimeout(300);
}

// Everything visible on the page with its box: text runs (by element), input values, and the URL.
async function visibleItems(page: Page) {
  return page
    .evaluate(() => {
      const out: { text: string; box: { x: number; y: number; w: number; h: number } | null; where: string }[] = [];
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const onScreen = (r: DOMRect) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
      const walker = document.createTreeWalker(document.body ?? document.documentElement, NodeFilter.SHOW_TEXT);
      const byParent = new Map<Element, string>();
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement;
        const t = n.textContent ?? '';
        if (!el || !t.trim() || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
        byParent.set(el, `${byParent.get(el) ?? ''}${t}`);
      }
      for (const [el, text] of byParent) {
        const style = getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') continue;
        const r = el.getBoundingClientRect();
        out.push({ text, box: onScreen(r) ? { x: r.x, y: r.y, w: r.width, h: r.height } : null, where: el.tagName.toLowerCase() });
      }
      for (const el of Array.from(document.querySelectorAll('input, textarea, select')) as HTMLInputElement[]) {
        if (!el.value) continue;
        const r = el.getBoundingClientRect();
        out.push({ text: el.value, box: onScreen(r) ? { x: r.x, y: r.y, w: r.width, h: r.height } : null, where: `${el.tagName.toLowerCase()} value` });
      }
      return { items: out, url: location.href, viewport: { width: vw, height: vh } };
    })
    .catch(() => ({ items: [], url: page.url(), viewport: null }));
}

const isLocator = (x: unknown): x is Locator => Boolean(x && typeof (x as Locator).boundingBox === 'function' && typeof (x as Locator).page === 'function');
const isPage = (x: unknown): x is Page => Boolean(x && typeof (x as Page).goto === 'function' && typeof (x as Page).mainFrame === 'function');
const quoted = (v: unknown) => (typeof v === 'string' ? `“${clean(v)}”` : v instanceof RegExp ? '' : `“${String(v)}”`);
const STATE_WORDS = /\b(active|selected|current|disabled|open|expanded|checked|highlighted)\b/i;

/** An assertion that passed, as a viewer would say what the screen shows; null when a viewer would not see it. */
async function assertionLine(matcher: string, subject: Locator | Page, args: unknown[], negated: boolean, detect: Detect): Promise<string | null> {
  if (isPage(subject)) {
    if (matcher === 'toHaveURL' && !negated) return `Now on ${pageName(detect(subject.url()).text)}`;
    if (matcher === 'toHaveTitle' && !negated && typeof args[0] === 'string') return `The page title is ${quoted(args[0])}`;
    return null;
  }
  const expected = args[0];
  const gone = negated && ['toBeVisible', 'toHaveCount', 'toBeAttached'].includes(matcher);
  const s = matcher === 'toBeHidden' || gone || (matcher === 'toHaveCount' && expected === 0) ? { name: nameFromSelector(String(subject)), noun: '' } : await subjectOf(subject);
  switch (matcher) {
    case 'toHaveText':
    case 'toContainText': {
      if (negated) return null;
      if (Array.isArray(expected)) {
        const items = expected.filter(x => typeof x === 'string').map(x => clean(x as string));
        if (!items.length) return null;
        return `${items.length} ${plural(s.noun && s.noun !== 'card' ? s.noun : 'item', items.length)} are shown${items.length > 1 ? `, in this order: ${items.slice(0, 4).join(', ')}${items.length > 4 ? ', and more' : ''}` : `: ${items[0]}`}`;
      }
      const shown = typeof expected === 'string' ? clean(expected) : clean(await subject.first().innerText({ timeout: 1000 }).catch(() => '')).slice(0, 60);
      if (!shown) return null;
      return s.noun && s.name && norm(s.name) !== norm(shown) ? `${upperFirst(the(s))} shows “${shown}”` : `“${shown}” is shown`;
    }
    case 'toHaveCount': {
      const n = Number(expected);
      if (negated || !Number.isFinite(n)) return null;
      const noun = s.noun || 'item';
      return n === 0 ? `No ${s.name ? `${s.name} ` : ''}${noun} is shown` : `${n} ${plural(noun, n)} ${n === 1 ? 'is' : 'are'} shown`;
    }
    case 'toBeVisible':
      return negated ? `${upperFirst(the(s))} is not shown` : `${upperFirst(the(s))} is shown`;
    case 'toBeHidden':
      return `${upperFirst(the(s))} is not shown`;
    case 'toHaveValue':
      if (negated || typeof expected !== 'string' || SECRET_FIELD.test(s.name)) return null;
      return `${upperFirst(s.name ? `the ${s.name} ${s.noun || 'field'}` : 'the field')} holds “${clean(expected)}”`;
    case 'toBeChecked':
      return `${upperFirst(the(s))} is ${negated ? 'not ' : ''}ticked`;
    case 'toBeDisabled':
    case 'toBeEnabled':
      return `${upperFirst(the(s))} is ${(matcher === 'toBeDisabled') !== negated ? 'disabled' : 'enabled'}`;
    case 'toHaveClass': {
      const word = STATE_WORDS.exec(expected instanceof RegExp ? expected.source : String(expected ?? ''))?.[1];
      return word ? `${upperFirst(the(s))} is ${negated ? 'not ' : ''}marked ${word.toLowerCase()}` : null;
    }
    default:
      return null;
  }
}

interface DemoInternals {
  intro(line: string): Promise<void>;
  outcome(line: string): Promise<void>;
  narrated(kind: string, locator: Locator, args: unknown[], run: () => Promise<unknown>): Promise<unknown>;
  navigated(kind: string, run: () => Promise<unknown>): Promise<unknown>;
  checked(matcher: string, subject: Locator | Page, args: unknown[], negated: boolean): Promise<void>;
  failedCheck(matcher: string, subject: Locator | Page, args: unknown[], negated: boolean, error: unknown): Promise<void>;
  readonly busy: boolean;
  dispose(): Promise<void>;
}

export function createDemo(page: Page, testInfo?: TestInfo): Demo & DemoInternals {
  const t0 = Date.now();
  const now = () => Date.now() - t0;
  const log: StepLog = { version: 1, demo: DEMO, startedAt: t0, viewport: page.viewportSize(), pacing: PACING, steps: [], actions: [], checks: [], masks: [], visible: [], unmasked: [] };
  let currentCaption: { dispose(): Promise<void> | void } | undefined;
  let currentChapter = '';
  let cursor = { x: 24, y: 24 };
  let cursorOverlay: { dispose(): Promise<void> | void } | undefined;
  // Live covers (video-only overlays) of what the last scan found; the step log keeps their time windows, and the
  // factory's renderer draws the same boxes over the recorded frames, so no frame shows a secret.
  let covers: { dispose(): Promise<void> | void }[] = [];
  let open: (Box & { t0: number; why: string })[] = [];
  const secretFields = new Set<Locator>();

  const step = (kind: string, caption: string, auto = false) => {
    const last = log.steps.at(-1);
    if (last && last.t1 < 0) last.t1 = now();
    log.steps.push({ i: log.steps.length, kind, caption, t0: now(), t1: -1, ...(auto ? { auto: true } : {}) });
  };
  // Automatic narration state: `busy` while the fixture itself drives the page (its own clicks are not narrated twice),
  // `authored` while a caption the spec wrote waits for the action it introduces, and the assertion lines waiting for
  // the next step (said together, or dropped when the spec narrates the check itself with a highlight).
  let busy = 0;
  let authored = false;
  let checks: { line: string; t: number; matcher: string }[] = [];

  // Scan what is visible now; cover each match (and every secret field), and log the redacted text of the step.
  const scan = async () => {
    const detect = await detector();
    const { items, url, viewport } = await visibleItems(page);
    if (viewport) log.viewport = viewport;
    const boxes: (Box & { why: string })[] = [];
    const texts: string[] = [];
    const stepNo = Math.max(0, log.steps.length - 1);
    for (const it of [...items, { text: url, box: null, where: 'url' }]) {
      const r = detect(it.text);
      texts.push(r.text.slice(0, 400));
      if (!r.hits.length) continue;
      // The URL is shown only in the factory's own URL caption, which is redacted before it is drawn.
      if (it.where === 'url') continue;
      if (it.box) boxes.push({ ...it.box, why: `detected: ${[...new Set(r.hits)].join(', ')}` });
      else log.unmasked.push({ t: now(), step: stepNo, where: it.where, rules: [...new Set(r.hits)] });
    }
    for (const f of secretFields) {
      // A field of an earlier page is gone: never wait for it to come back.
      const b = (await f.count().catch(() => 0)) ? await f.boundingBox({ timeout: 500 }).catch(() => null) : null;
      if (b) boxes.push({ x: b.x, y: b.y, w: b.width, h: b.height, why: 'secret field' });
    }
    log.visible.push({ t: now(), step: stepNo, text: texts.join(' | ').slice(0, 4000) });
    // Close the previous windows and open the new ones.
    const t = now();
    for (const o of open) log.masks.push({ x: o.x, y: o.y, w: o.w, h: o.h, why: o.why, t0: o.t0, t1: t });
    open = boxes.map(b => ({ ...b, t0: Math.max(0, t - 400) }));
    await Promise.all(covers.map(c => c.dispose()));
    covers = [];
    for (const b of boxes) {
      const c = await page.screencast
        .showOverlay(`<div style="position:absolute; left:${b.x - 3}px; top:${b.y - 3}px; width:${b.w + 6}px; height:${b.h + 6}px; background:#111; border-radius:4px;"></div>`)
        .catch(() => undefined);
      if (c) covers.push(c);
    }
  };

  // The URL caption the fixture draws itself (top left of the video, updated on every navigation), redacted, so the
  // video shows which page each step is on without a test having to caption it. Keyframes get it from captureKeyframe.
  let urlCaption: { dispose(): Promise<void> | void } | undefined;
  const showUrl = async () => {
    await urlCaption?.dispose();
    const url = (await detector())(page.url()).text;
    urlCaption = await page.screencast
      .showOverlay(`<div style="position:absolute; left:8px; top:8px; max-width:70%; padding:2px 8px; border-radius:6px;
        background:rgba(15,23,42,.88); color:#fff; font:600 12px/1.5 ui-monospace, Menlo, monospace; white-space:nowrap;
        overflow:hidden; text-overflow:ellipsis;">URL ${escapeHtml(url)}</div>`)
      .catch(() => undefined);
  };
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) void showUrl().then(() => (DEMO ? scan() : undefined)).catch(() => {});
  });
  const clearCaption = async () => {
    await currentCaption?.dispose();
    currentCaption = undefined;
  };
  // In demo mode the factory's renderer draws the subtitles itself, timed to the spoken line (a caption drawn into the
  // recording would follow the recording's timing, not the narration's). At test speed the caption is drawn here.
  const drawCaption = async (text: string) => {
    await clearCaption();
    if (!text || DEMO) return;
    currentCaption = await page.screencast.showOverlay(`
        <div style="position:absolute; left:50%; bottom:28px; transform:translateX(-50%);
          max-width:80%; padding:10px 18px; border-radius:10px; background:rgba(15,23,42,.85);
          color:#fff; font:500 18px/1.4 system-ui, sans-serif; text-align:center;
          box-shadow:0 4px 18px rgba(0,0,0,.35);">${escapeHtml(text)}</div>`);
  };
  const say = async (text: string, kind = 'caption', auto = false) => {
    const safe = text ? (await detector())(text).text : '';
    if (safe) step(kind, safe, auto);
    await drawCaption(safe);
    await page.waitForTimeout(pace(PACING.stepDelayMs));
    if (DEMO) await scan();
  };
  // The waiting assertion lines become one step (at most three sentences) before the next thing happens.
  const flushChecks = async (drop = false) => {
    const lines = checks;
    checks = [];
    if (!lines.length) return;
    // A dropped line still belongs to the step that shows it (a highlight), for the renderer and the narrator.
    const at = log.steps.length;
    for (const c of lines) log.checks.push({ t: c.t, step: at, line: c.line, matcher: c.matcher });
    if (drop) return;
    await say(lines.slice(0, 3).map(c => (/[.!?]$/.test(c.line) ? c.line : `${c.line}.`)).join(' '), 'check', true);
    authored = false;
  };
  // A caption the spec wrote. Raw paths read as page names. Right after an automatic line for the same thing (no other
  // step between), it replaces that line: the spec's wording wins for its step. Otherwise it is its own step, and the
  // next action is narrated by it instead of an automatic line.
  const caption = async (text: string, kind = 'caption') => {
    // Secrets are found on the spec's own text first (humanizing could break a token's shape), then paths read as pages.
    const human = text ? viewerText((await detector())(text).text, page.url()) : '';
    // One step, one line: an assertion line waiting to be said that says what this caption says is replaced by it.
    if (human) {
      const same = checks.filter(c => similarTo(c.line, human) || similarTo(human, c.line));
      checks = checks.filter(c => !same.includes(c));
      for (const c of same) log.checks.push({ t: c.t, step: log.steps.length, line: c.line, matcher: c.matcher });
    }
    await flushChecks();
    const lastAction = log.actions.at(-1);
    const target = lastAction ? log.steps[lastAction.step] : undefined;
    const authorSince = log.steps.slice((lastAction?.step ?? -1) + 1).some(x => !x.auto);
    if (DEMO && human && target?.auto && target.kind.startsWith('auto:') && !authorSince && similarTo(target.caption, human)) {
      target.caption = (await detector())(human).text;
      target.auto = false;
      await drawCaption(target.caption);
      return;
    }
    await say(human, kind);
    authored = Boolean(human);
  };
  const similarTo = (auto: string, mine: string) => {
    const a = norm(auto).split(' ').filter(w => w.length > 2 && !['the', 'page', 'open', 'opened', 'click', 'with'].includes(w));
    const b = ` ${norm(mine)} `;
    return a.length > 0 && a.every(w => b.includes(` ${w}`));
  };
  // An automatic line for an action, unless the spec captioned it: a caption right before it, or a highlight that
  // already says to do this to the same element ("Click the Daybird card").
  const autoLine = async (line: string, kind: string, name = '') => {
    await flushChecks();
    const last = log.steps.at(-1);
    const words = norm(name).split(' ').filter(w => w.length > 1);
    const said = last && last.kind === 'highlight' && /\b(click|select|choose|tap|tick|type|open|press)\b/.test(norm(last.caption)) && words.length > 0 && words.every(w => ` ${norm(last.caption)} `.includes(` ${w} `));
    if (authored || (last && norm(last.caption) === norm(line)) || said) {
      authored = false;
      return;
    }
    await say(line, `auto:${kind}`, true);
  };
  // The page as a viewer names it, and its main heading (both through the detector).
  const pageState = async (): Promise<PageState> => {
    const detect = await detector();
    const heading = await page.evaluate(() => (document.querySelector('h1')?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)).catch(() => '');
    return { page: pageName(detect(page.url()).text), heading: detect(heading).text };
  };
  type Action = StepLog['actions'][number];
  const action = async (kind: string, extra: Partial<Action> = {}): Promise<Action> => {
    const entry: Action = { t: now(), kind, step: log.steps.length - 1, ...extra };
    if (DEMO && !entry.before) entry.before = await pageState();
    log.actions.push(entry);
    return entry;
  };
  // The action happened (`at`) and its result has settled (`end`), with the page it left the viewer on.
  const settled = async (entry: Action) => {
    entry.end = now();
    if (DEMO) entry.after = await pageState();
  };
  const targetOf = (s: Subject) => ({ name: s.name, role: s.noun });

  // The drawn cursor: an arrow that glides to the target's centre, and a ripple where it clicks (video-only overlays).
  const drawCursor = async (x: number, y: number, ripple = false) => {
    await cursorOverlay?.dispose();
    cursorOverlay = await page.screencast
      .showOverlay(`<svg style="position:absolute; left:${x}px; top:${y}px; overflow:visible" width="22" height="28" viewBox="0 0 22 28">
        <path d="M1 1 L1 22 L7 16 L11 26 L15 24 L11 15 L19 15 Z" fill="#fff" stroke="#111" stroke-width="2" stroke-linejoin="round"/></svg>
        ${ripple ? `<div style="position:absolute; left:${x - 18}px; top:${y - 18}px; width:36px; height:36px; border-radius:50%; border:3px solid #f59e0b; background:rgba(245,158,11,.25);"></div>` : ''}`)
      .catch(() => undefined);
  };
  const moveTo = async (locator: Locator) => {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    const b = await locator.boundingBox({ timeout: 5000 }).catch(() => null);
    if (!b) return;
    const to = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    const frames = DEMO ? 8 : 1;
    for (let i = 1; i <= frames; i++) {
      await drawCursor(cursor.x + ((to.x - cursor.x) * i) / frames, cursor.y + ((to.y - cursor.y) * i) / frames);
      if (DEMO) await page.waitForTimeout(PACING.cursorMs / frames);
    }
    cursor = to;
  };
  const isSecretField = async (locator: Locator, explicit?: boolean) => {
    if (explicit) return true;
    const attrs = await locator
      .evaluate(el => {
        const e = el as HTMLInputElement;
        const label = (e.labels && e.labels[0]?.textContent) || e.getAttribute('aria-label') || '';
        return [e.type, e.name, e.id, e.getAttribute('autocomplete') ?? '', e.placeholder ?? '', label].join(' ');
      })
      .catch(() => '');
    return /\bpassword\b/i.test(attrs) || SECRET_FIELD.test(attrs);
  };
  const typeInto = async (locator: Locator, text: string, secret?: boolean) => {
    const masked = await isSecretField(locator, secret);
    if (masked) {
      secretFields.add(locator);
      // Cover the field before the first character appears.
      if (DEMO || covers.length === 0) await scan();
    }
    busy++;
    try {
      await locator.click();
      await locator.pressSequentially(text, { delay: DEMO ? PACING.typeDelayMs : 20 });
    } finally {
      busy--;
    }
    return masked;
  };
  const clickVisibly = async (locator: Locator, run: () => Promise<unknown>, entry?: Action) => {
    await moveTo(locator);
    await drawCursor(cursor.x, cursor.y, true);
    if (entry) entry.at = now();
    const r = await run();
    await page.waitForTimeout(pace(250));
    await drawCursor(cursor.x, cursor.y);
    await page.waitForTimeout(pace(PACING.holdMs));
    if (DEMO) await scan();
    if (entry) await settled(entry);
    return r;
  };
  // One user action the spec called on a locator (raw Playwright or the fixture's own): narrated, paced, drawn, masked.
  // The actions that completed (their result settled) before something failed.
  const doneActions = () => log.actions.filter(a => a.end != null).length;
  // The action under way: a test that times out in it is torn down before the action itself fails, so the step log
  // (written at teardown) names it then.
  let pending: { kind: 'action' | 'navigation'; what: string } | undefined;
  const failedStep = (kind: 'action' | 'navigation', what: string) => {
    if (!log.failed) log.failed = { t: now(), kind, actionsBefore: doneActions(), what };
  };
  const narrated = async (kind: string, locator: Locator, args: unknown[], run: () => Promise<unknown>) => {
    busy++;
    pending = { kind: 'action', what: kind };
    try {
      return await narratedInner(kind, locator, args, run);
    } catch (error) {
      failedStep('action', kind);
      throw error;
    } finally {
      pending = undefined;
      busy--;
    }
  };
  const narratedInner = async (kind: string, locator: Locator, args: unknown[], run: () => Promise<unknown>) => {
      const s = await subjectOf(locator);
      if (['click', 'dblclick', 'tap'].includes(kind)) {
        await autoLine(`${kind === 'dblclick' ? 'Double-click' : kind === 'tap' ? 'Tap' : 'Click'} ${the(s)}`, kind, s.name);
        const entry = await action(kind, { target: targetOf(s) });
        return await clickVisibly(locator, run, entry);
      }
      if (['fill', 'type', 'pressSequentially'].includes(kind)) {
        const value = String(args[0] ?? '');
        const masked = await isSecretField(locator);
        if (masked) {
          secretFields.add(locator);
          await scan();
        }
        const field = s.name ? `the ${s.name} ${s.noun || 'field'}` : 'the field';
        const line = !value ? `Clear ${field}` : masked ? `Type the ${s.name || 'secret value'} (hidden)` : value.length <= 30 && !/\n/.test(value) ? `Type “${value}” into ${field}` : `Type the ${s.name || 'text'}`;
        await autoLine(line, 'type', s.name);
        const entry = await action(kind, { target: targetOf(s), ...(!masked && value.length <= 30 && !/\n/.test(value) ? { value: (await detector())(value).text } : {}) });
        await moveTo(locator);
        entry.at = now();
        const r = await run();
        await page.waitForTimeout(pace(PACING.holdMs));
        if (DEMO) await scan();
        await settled(entry);
        return r;
      }
      if (kind === 'selectOption') {
        const start = now();
        const before = DEMO ? await pageState() : undefined;
        await moveTo(locator);
        const at = now();
        const r = await run();
        const after = await subjectOf(locator);
        await autoLine(`Choose ${after.selected ? `“${after.selected}”` : 'an option'} in ${the(after)}`, 'select', after.name);
        const entry = await action(kind, { t: start, at, before, target: targetOf(after), ...(after.selected ? { value: (await detector())(after.selected).text } : {}) });
        await page.waitForTimeout(pace(PACING.holdMs));
        if (DEMO) await scan();
        await settled(entry);
        return r;
      }
      if (['check', 'uncheck', 'setChecked'].includes(kind)) {
        const on = kind === 'check' || (kind === 'setChecked' && Boolean(args[0]));
        await autoLine(`${on ? 'Tick' : 'Untick'} ${the(s)}`, 'check', s.name);
        const entry = await action(kind, { target: targetOf(s) });
        return await clickVisibly(locator, run, entry);
      }
      if (kind === 'press') {
        await autoLine(`Press ${String(args[0] ?? 'a key')}${s.name ? ` in ${the(s)}` : ''}`, 'press');
        const entry = await action(kind, { target: targetOf(s), value: String(args[0] ?? '') });
        entry.at = now();
        const r = await run();
        await page.waitForTimeout(pace(PACING.holdMs));
        if (DEMO) await scan();
        await settled(entry);
        return r;
      }
      return await run();
  };
  // Navigation the spec called on the page: narrated once the page is there ("Open the Brands page").
  const navigated = async (kind: string, run: () => Promise<unknown>) => {
    busy++;
    pending = { kind: 'navigation', what: kind };
    try {
      const start = now();
      const before = DEMO ? await pageState() : undefined;
      const r = await run();
      const where = pageName((await detector())(page.url()).text);
      const line = kind === 'reload' ? `Reload ${where}` : kind === 'goBack' ? `Go back to ${where}` : kind === 'goForward' ? `Go forward to ${where}` : `Open ${where}`;
      await autoLine(upperFirst(line), kind);
      const entry = await action(kind, { t: start, at: start, before });
      await page.waitForTimeout(pace(PACING.holdMs));
      await settled(entry);
      return r;
    } catch (error) {
      failedStep('navigation', kind);
      throw error;
    } finally {
      pending = undefined;
      busy--;
    }
  };
  // An assertion that passed, in viewer words; said with the next step.
  const checked = async (matcher: string, subject: Locator | Page, args: unknown[], negated: boolean) => {
    const detect = await detector();
    const line = await assertionLine(matcher, subject, args, negated, detect);
    if (!line) return;
    const safe = detect(viewerText(detect(line).text, page.url())).text;
    if (!checks.some(c => norm(c.line) === norm(safe)) && norm(log.steps.at(-1)?.caption ?? '') !== norm(safe)) checks.push({ line: safe, t: now(), matcher });
  };
  // An assertion that failed: the line it expected (as the passing run says it), what the screen showed instead (from
  // Playwright's "Received" line, redacted), and the page. Said as the step where things go wrong.
  const failedCheck = async (matcher: string, subject: Locator | Page, args: unknown[], negated: boolean, error: unknown) => {
    if (log.failed) return;
    const detect = await detector();
    const expected = await assertionLine(matcher, subject, args, negated, detect).catch(() => null);
    const line = expected ? detect(viewerText(detect(expected).text, page.url())).text : '';
    // eslint-disable-next-line no-control-regex
    const message = String((error as Error)?.message ?? error).replace(/\u001b\[[0-9;]*m/g, '');
    const received = /Received(?: string| value| array)?:\s*(.+)/.exec(message)?.[1]?.trim() ?? '';
    const observed = detect(clean(received.replace(/^"(.*)"$/, '$1')).slice(0, 120)).text;
    await flushChecks();
    log.failed = { t: now(), kind: 'check', matcher, line, observed, actionsBefore: doneActions(), page: await pageState() };
    step('failure', observed && !/not found|<element/.test(observed) ? `Instead, the screen shows “${observed}”.` : 'This is where it goes wrong.');
  };

  return {
    chapter: async (title, description, durationMs = 2500) => {
      await flushChecks();
      // Keyframe for agents: how the previous chapter ended, before the title card covers it.
      if (currentChapter) await captureKeyframe(`end of: ${currentChapter}`, [page]);
      currentChapter = title;
      const detect = await detector();
      step('chapter', [title, description].filter(Boolean).map(t => detect(t!).text).join('. '));
      await page.screencast.showChapter(detect(title).text, { description: description ? detect(description).text : undefined, duration: durationMs });
    },
    caption: text => caption(text),
    step: text => caption(text),
    highlight: async (locator, label, durationMs = 2000) => {
      await bringIntoView(locator);
      const box = await locator.boundingBox();
      if (!box) throw new Error(`demo.highlight: ${locator} is not visible`);
      // The label narrates the check the spec shows: it takes the place of the automatic lines waiting for this step.
      if (label) {
        await flushChecks(true);
        step('highlight', (await detector())(viewerText((await detector())(label).text, page.url())).text);
        authored = false;
      }
      if (DEMO) await scan();
      // Keyframe for agents: the element this step proves, before the overlay is drawn.
      await captureKeyframe(`${currentChapter ? `${currentChapter} - ` : ''}highlight: ${label ?? String(locator)}`, [page]);
      const safeLabel = label ? (await detector())(label).text : '';
      const labelHtml = safeLabel
        ? `<div style="position:absolute; top:${box.y + box.height + 8}px; left:${box.x + box.width / 2}px;
            transform:translateX(-50%); padding:6px 12px; border-radius:8px; background:#16a34a; color:#fff;
            font:600 15px/1.3 system-ui, sans-serif; white-space:nowrap;">${escapeHtml(safeLabel)}</div>`
        : '';
      await page.screencast.showOverlay(`
        <div style="position:absolute; top:${box.y - 4}px; left:${box.x - 4}px; width:${box.width + 8}px;
          height:${box.height + 8}px; border:3px solid #16a34a; border-radius:8px;
          box-shadow:0 0 0 9999px rgba(0,0,0,.15);"></div>${labelHtml}`, { duration: durationMs + pace(PACING.holdMs) });
      // The overlay does not block: hold, so the video shows the element long enough to see it.
      await page.waitForTimeout(durationMs + pace(PACING.holdMs));
    },
    absent: async (anchor, label, durationMs = 2000) => {
      await bringIntoView(anchor);
      const box = await anchor.boundingBox();
      if (!box) throw new Error(`demo.absent: the anchor ${anchor} is not visible`);
      await flushChecks(true);
      step('highlight', (await detector())(viewerText((await detector())(label).text, page.url())).text);
      authored = false;
      if (DEMO) await scan();
      await captureKeyframe(`${currentChapter ? `${currentChapter} - ` : ''}absent: ${label}`, [page]);
      const safe = (await detector())(label).text;
      await page.screencast.showOverlay(`
        <div style="position:absolute; top:${box.y - 4}px; left:${box.x - 4}px; width:${box.width + 8}px;
          height:${box.height + 8}px; border:3px dashed #dc2626; border-radius:8px;"></div>
        <div style="position:absolute; top:${box.y + box.height + 8}px; left:${box.x + box.width / 2}px;
          transform:translateX(-50%); padding:6px 12px; border-radius:8px; background:#dc2626; color:#fff;
          font:600 15px/1.3 system-ui, sans-serif; white-space:nowrap;">${escapeHtml(safe)}</div>`, { duration: durationMs + pace(PACING.holdMs) });
      await page.waitForTimeout(durationMs + pace(PACING.holdMs));
    },
    click: async (locator, text) => {
      if (text) await caption(text, 'click');
      await narrated('click', locator, [], () => locator.click());
    },
    fill: async (locator, value, options = {}) => {
      const masked = await isSecretField(locator, options.secret);
      if (options.caption) await caption(masked ? options.caption.split(value).join('••••••') : options.caption, 'fill');
      const s = await subjectOf(locator);
      const field = s.name ? `the ${s.name} field` : 'the field';
      await autoLine(masked ? `Type the ${s.name || 'secret value'} (hidden)` : value.length <= 30 && !/\n/.test(value) ? `Type “${value}” into ${field}` : `Type the ${s.name || 'text'}`, 'type');
      const entry = await action('fill', { target: targetOf(s), ...(!masked && value.length <= 30 && !/\n/.test(value) ? { value: (await detector())(value).text } : {}) });
      await moveTo(locator);
      entry.at = now();
      await typeInto(locator, value, masked);
      await page.waitForTimeout(pace(PACING.holdMs));
      if (DEMO) await scan();
      await settled(entry);
    },
    type: async (locator, text, options = {}) => {
      const masked = await isSecretField(locator, options.secret);
      const s = await subjectOf(locator);
      await autoLine(masked ? `Type the ${s.name || 'secret value'} (hidden)` : `Type into the ${s.name ? `${s.name} ` : ''}field`, 'type');
      const entry = await action('type', { target: targetOf(s) });
      entry.at = now();
      await typeInto(locator, text, masked);
      if (DEMO) await scan();
      await settled(entry);
    },
    pause: ms => page.waitForTimeout(ms ?? 1000),
    intro: async (line: string) => {
      const safe = (await detector())(line).text;
      step('intro', safe);
      // In demo mode the renderer shows and speaks the opening over the first page; nothing is drawn into the recording.
      if (!DEMO) await page.screencast.showChapter(safe, { duration: 1 }).catch(() => drawCaption(safe));
    },
    outcome: async (line: string) => {
      await flushChecks();
      log.outcome = line;
      await say(line, 'outcome');
      await page.waitForTimeout(pace(PACING.holdMs));
    },
    narrated,
    navigated,
    checked,
    failedCheck,
    get busy() {
      return busy > 0;
    },
    dispose: async () => {
      if (pending) failedStep(pending.kind, pending.what);
      await flushChecks().catch(() => {});
      if (DEMO) await scan().catch(() => {});
      const end = now();
      for (const o of open) log.masks.push({ x: o.x, y: o.y, w: o.w, h: o.h, why: o.why, t0: o.t0, t1: end + 1000 });
      open = [];
      const last = log.steps.at(-1);
      if (last && last.t1 < 0) last.t1 = end;
      await clearCaption();
      await urlCaption?.dispose();
      await cursorOverlay?.dispose();
      await Promise.all(covers.map(c => c.dispose()));
      if (testInfo && (log.steps.length || log.masks.length)) await testInfo.attach('demo-steps', { body: JSON.stringify(log), contentType: 'application/json' }).catch(() => {});
    },
  };
}

// ---- automatic narration hooks ----------------------------------------------------------------------------------
// The demo of each page; the locator and page methods below narrate through it while it is active (demo mode only).
const ACTIVE = new WeakMap<Page, Demo & DemoInternals>();
const LOCATOR_ACTIONS = ['click', 'dblclick', 'tap', 'fill', 'type', 'pressSequentially', 'selectOption', 'check', 'uncheck', 'setChecked', 'press'];
const PAGE_ACTIONS = ['goto', 'reload', 'goBack', 'goForward'];
const NARRATED_MATCHERS = new Set(['toHaveText', 'toContainText', 'toHaveCount', 'toBeVisible', 'toBeHidden', 'toHaveURL', 'toHaveTitle', 'toHaveValue', 'toBeChecked', 'toBeDisabled', 'toBeEnabled', 'toHaveClass']);

// Once per worker: every Locator's user actions go through the active demo of its page (Locators share one prototype).
function hookLocators(page: Page) {
  const proto = Object.getPrototypeOf(page.locator('body')) as Record<string, unknown> & { __demoHooked?: boolean };
  if (proto.__demoHooked) return;
  Object.defineProperty(proto, '__demoHooked', { value: true });
  for (const name of LOCATOR_ACTIONS) {
    const original = proto[name];
    if (typeof original !== 'function') continue;
    proto[name] = function (this: Locator, ...args: unknown[]) {
      const demo = ACTIVE.get(this.page());
      if (!demo || demo.busy) return (original as (...a: unknown[]) => unknown).apply(this, args);
      return demo.narrated(name, this, args, () => (original as (...a: unknown[]) => Promise<unknown>).apply(this, args));
    };
  }
}
function hookPage(page: Page, demo: Demo & DemoInternals) {
  const p = page as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
  for (const name of PAGE_ACTIONS) {
    const original = p[name].bind(page);
    p[name] = (...args: unknown[]) => (ACTIVE.get(page) === demo && !demo.busy ? demo.navigated(name, () => original(...args)) : original(...args));
  }
}

/** `expect` that narrates, in demo mode, the assertions a viewer can see; otherwise Playwright's own. */
function narratedMatchers(matchers: Record<string, unknown>, subject: unknown, negated: boolean): unknown {
  return new Proxy(matchers, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === 'not' && value && typeof value === 'object') return narratedMatchers(value as Record<string, unknown>, subject, !negated);
      if (typeof prop !== 'string' || typeof value !== 'function' || !NARRATED_MATCHERS.has(prop)) return value;
      return async (...args: unknown[]) => {
        const page = isLocator(subject) ? subject.page() : isPage(subject) ? subject : null;
        const demo = page ? ACTIVE.get(page) : undefined;
        let result: unknown;
        try {
          result = await (value as (...a: unknown[]) => Promise<unknown>).apply(target, args);
        } catch (error) {
          if (demo && !demo.busy) await demo.failedCheck(prop, subject as Locator | Page, args, negated, error).catch(() => {});
          throw error;
        }
        if (demo && !demo.busy) await demo.checked(prop, subject as Locator | Page, args, negated).catch(() => {});
        return result;
      };
    },
  });
}
export const expect = (DEMO
  ? new Proxy(baseExpect, {
    apply(target, thisArg, args: unknown[]) {
      const matchers = Reflect.apply(target as unknown as (...a: unknown[]) => unknown, thisArg, args) as Record<string, unknown>;
      return isLocator(args[0]) || isPage(args[0]) ? narratedMatchers(matchers, args[0], false) : matchers;
    },
  })
  : baseExpect) as typeof baseExpect;

/** The opening line: what the video demonstrates, from the test title and its ticket. */
export function openingLine(title: string, tickets: Record<string, string> = TICKETS): string {
  const what = clean(title.replace(/^TC-[A-Z0-9]+(?:-[A-Z0-9]+)*\s+/i, '')) || clean(title);
  const keys = Object.keys(tickets).filter(k => title.toUpperCase().startsWith(`TC-${k.toUpperCase()}-`)).sort((x, y) => y.length - x.length);
  const key = keys[0] ?? /^TC-(.+)-\d+\b/i.exec(title)?.[1]?.toUpperCase() ?? '';
  const ticket = clean((tickets[key] ?? '').replace(/^(\[[^\]]*\]\s*-?\s*)+/, ''));
  return `This video shows ${lowerFirst(viewerText(what))}.${key ? ` Ticket ${key}${ticket ? `: ${ticket}` : ''}.` : ''}`;
}
/** The closing line: the outcome. */
export function outcomeLine(title: string, passed: boolean): string {
  const what = clean(title.replace(/^TC-[A-Z0-9]+(?:-[A-Z0-9]+)*\s+/i, '')) || clean(title);
  return passed ? `Result: ${lowerFirst(viewerText(what))}, as expected.` : 'Result: the test failed; this recording is evidence, not a demo.';
}

/** `test` with a `demo` fixture that narrates the test's video. */
export const test = withStepKeyframes(base.extend<{ demo: Demo }>({
  demo: async ({ page }, use, testInfo) => {
    const demo = createDemo(page, testInfo);
    if (DEMO) {
      hookLocators(page);
      hookPage(page, demo);
      ACTIVE.set(page, demo);
      await demo.intro(openingLine(testInfo.title)).catch(() => {});
    }
    await use(demo);
    if (DEMO) {
      await demo.outcome(outcomeLine(testInfo.title, testInfo.status === testInfo.expectedStatus)).catch(() => {});
      ACTIVE.delete(page);
    }
    // Hold the last frame so the end state is visible in the video.
    await page.waitForTimeout(500 + pace(PACING.holdMs)).catch(() => {});
    await demo.dispose().catch(() => {});
  },
}));
