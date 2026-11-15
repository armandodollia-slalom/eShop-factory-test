import { Locator, Page } from '@playwright/test';
import { captureKeyframe, test as base, expect, withStepKeyframes } from './fixtures';

/**
 * Optional narration for e2e tests. Every e2e test is already recorded on video (see `video` in
 * playwright.config.ts); use this fixture to make a feature's video read like a demo.
 *
 *   import { test, expect } from '../demo';
 *   test('...', async ({ page, demo }) => { await demo.chapter('Checkout'); ... });
 */
export interface Demo {
  /** Full-screen title card that narrates the next step. Blocks for its duration. */
  chapter(title: string, description?: string, durationMs?: number): Promise<void>;
  /** Sticky caption at the bottom of the video. Replaces the previous caption; pass '' to clear. */
  caption(text: string): Promise<void>;
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
  /** Type like a human, so the input is readable in the video. */
  type(locator: Locator, text: string): Promise<void>;
  /** Let the viewer catch up. */
  pause(ms?: number): Promise<void>;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
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

export function createDemo(page: Page): Demo & { dispose(): Promise<void> } {
  let currentCaption: { dispose(): Promise<void> | void } | undefined;
  let currentChapter = '';
  const clearCaption = async () => {
    await currentCaption?.dispose();
    currentCaption = undefined;
  };

  return {
    chapter: async (title, description, durationMs = 2500) => {
      // Keyframe for agents: how the previous chapter ended, before the title card covers it.
      if (currentChapter) await captureKeyframe(`end of: ${currentChapter}`, [page]);
      currentChapter = title;
      await page.screencast.showChapter(title, { description, duration: durationMs });
    },
    caption: async text => {
      await clearCaption();
      if (!text) return;
      currentCaption = await page.screencast.showOverlay(`
        <div style="position:absolute; left:50%; bottom:28px; transform:translateX(-50%);
          max-width:80%; padding:10px 18px; border-radius:10px; background:rgba(15,23,42,.85);
          color:#fff; font:500 18px/1.4 system-ui, sans-serif; text-align:center;
          box-shadow:0 4px 18px rgba(0,0,0,.35);">${escapeHtml(text)}</div>`);
    },
    highlight: async (locator, label, durationMs = 2000) => {
      await bringIntoView(locator);
      const box = await locator.boundingBox();
      if (!box) throw new Error(`demo.highlight: ${locator} is not visible`);
      // Keyframe for agents: the element this step proves, before the overlay is drawn.
      await captureKeyframe(`${currentChapter ? `${currentChapter} - ` : ''}highlight: ${label ?? String(locator)}`, [page]);
      const labelHtml = label
        ? `<div style="position:absolute; top:${box.y + box.height + 8}px; left:${box.x + box.width / 2}px;
            transform:translateX(-50%); padding:6px 12px; border-radius:8px; background:#16a34a; color:#fff;
            font:600 15px/1.3 system-ui, sans-serif; white-space:nowrap;">${escapeHtml(label)}</div>`
        : '';
      await page.screencast.showOverlay(`
        <div style="position:absolute; top:${box.y - 4}px; left:${box.x - 4}px; width:${box.width + 8}px;
          height:${box.height + 8}px; border:3px solid #16a34a; border-radius:8px;
          box-shadow:0 0 0 9999px rgba(0,0,0,.15);"></div>${labelHtml}`, { duration: durationMs });
      // The overlay does not block: hold, so the video shows the element long enough to see it.
      await page.waitForTimeout(durationMs);
    },
    absent: async (anchor, label, durationMs = 2000) => {
      await bringIntoView(anchor);
      const box = await anchor.boundingBox();
      if (!box) throw new Error(`demo.absent: the anchor ${anchor} is not visible`);
      await captureKeyframe(`${currentChapter ? `${currentChapter} - ` : ''}absent: ${label}`, [page]);
      await page.screencast.showOverlay(`
        <div style="position:absolute; top:${box.y - 4}px; left:${box.x - 4}px; width:${box.width + 8}px;
          height:${box.height + 8}px; border:3px dashed #dc2626; border-radius:8px;"></div>
        <div style="position:absolute; top:${box.y + box.height + 8}px; left:${box.x + box.width / 2}px;
          transform:translateX(-50%); padding:6px 12px; border-radius:8px; background:#dc2626; color:#fff;
          font:600 15px/1.3 system-ui, sans-serif; white-space:nowrap;">${escapeHtml(label)}</div>`, { duration: durationMs });
      await page.waitForTimeout(durationMs);
    },
    type: async (locator, text) => {
      await locator.click();
      await locator.pressSequentially(text, { delay: 60 });
    },
    pause: ms => page.waitForTimeout(ms ?? 1000),
    dispose: clearCaption,
  };
}

/** `test` with a `demo` fixture that narrates the test's video. */
export const test = withStepKeyframes(base.extend<{ demo: Demo }>({
  demo: async ({ page }, use) => {
    const demo = createDemo(page);
    await use(demo);
    // Hold the last frame so the end state is visible in the video.
    await page.waitForTimeout(500).catch(() => {});
    await demo.dispose().catch(() => {});
  },
}));

export { expect };
