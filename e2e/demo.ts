import { Locator, Page, TestInfo } from '@playwright/test';
import { captureKeyframe, test as base, expect, withStepKeyframes } from './fixtures';

/**
 * Narration for e2e tests. Every e2e test is already recorded on video (see `video` in playwright.config.ts); use this
 * fixture to make a feature's video read like a demo.
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

// ---- the step log -----------------------------------------------------------------------------------------------
interface Box { x: number; y: number; w: number; h: number }
interface StepLog {
  version: 1;
  demo: boolean;
  startedAt: number;
  viewport: { width: number; height: number } | null;
  pacing: typeof PACING;
  steps: { i: number; kind: string; caption: string; t0: number; t1: number }[];
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

export function createDemo(page: Page, testInfo?: TestInfo): Demo & { dispose(): Promise<void> } {
  const t0 = Date.now();
  const now = () => Date.now() - t0;
  const log: StepLog = { version: 1, demo: DEMO, startedAt: t0, viewport: page.viewportSize(), pacing: PACING, steps: [], masks: [], visible: [], unmasked: [] };
  let currentCaption: { dispose(): Promise<void> | void } | undefined;
  let currentChapter = '';
  let cursor = { x: 24, y: 24 };
  let cursorOverlay: { dispose(): Promise<void> | void } | undefined;
  // Live covers (video-only overlays) of what the last scan found; the step log keeps their time windows, and the
  // factory's renderer draws the same boxes over the recorded frames, so no frame shows a secret.
  let covers: { dispose(): Promise<void> | void }[] = [];
  let open: (Box & { t0: number; why: string })[] = [];
  const secretFields = new Set<Locator>();

  const step = (kind: string, caption: string) => {
    const last = log.steps.at(-1);
    if (last && last.t1 < 0) last.t1 = now();
    log.steps.push({ i: log.steps.length, kind, caption, t0: now(), t1: -1 });
  };

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
  const drawCaption = async (text: string) => {
    await clearCaption();
    if (!text) return;
    currentCaption = await page.screencast.showOverlay(`
        <div style="position:absolute; left:50%; bottom:28px; transform:translateX(-50%);
          max-width:80%; padding:10px 18px; border-radius:10px; background:rgba(15,23,42,.85);
          color:#fff; font:500 18px/1.4 system-ui, sans-serif; text-align:center;
          box-shadow:0 4px 18px rgba(0,0,0,.35);">${escapeHtml(text)}</div>`);
  };
  const caption = async (text: string, kind = 'caption') => {
    const safe = text ? (await detector())(text).text : '';
    if (safe) step(kind, safe);
    await drawCaption(safe);
    await page.waitForTimeout(pace(PACING.stepDelayMs));
    if (DEMO) await scan();
  };

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
    await locator.click();
    await locator.pressSequentially(text, { delay: DEMO ? PACING.typeDelayMs : 20 });
    return masked;
  };

  return {
    chapter: async (title, description, durationMs = 2500) => {
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
      await moveTo(locator);
      await drawCursor(cursor.x, cursor.y, true);
      await locator.click();
      await page.waitForTimeout(pace(250));
      await drawCursor(cursor.x, cursor.y);
      await page.waitForTimeout(pace(PACING.holdMs));
      if (DEMO) await scan();
    },
    fill: async (locator, value, options = {}) => {
      const masked = await isSecretField(locator, options.secret);
      if (options.caption) await caption(masked ? options.caption.split(value).join('••••••') : options.caption, 'fill');
      await moveTo(locator);
      await typeInto(locator, value, masked);
      await page.waitForTimeout(pace(PACING.holdMs));
      if (DEMO) await scan();
    },
    type: async (locator, text, options = {}) => {
      await typeInto(locator, text, options.secret);
      if (DEMO) await scan();
    },
    pause: ms => page.waitForTimeout(ms ?? 1000),
    dispose: async () => {
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

/** `test` with a `demo` fixture that narrates the test's video. */
export const test = withStepKeyframes(base.extend<{ demo: Demo }>({
  demo: async ({ page }, use, testInfo) => {
    const demo = createDemo(page, testInfo);
    await use(demo);
    // Hold the last frame so the end state is visible in the video.
    await page.waitForTimeout(500 + pace(PACING.holdMs)).catch(() => {});
    await demo.dispose().catch(() => {});
  },
}));

export { expect };
