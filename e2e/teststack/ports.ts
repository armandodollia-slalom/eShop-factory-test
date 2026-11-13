import { execFileSync } from 'child_process';

/**
 * The test stack slot the specs run against, as the factory describes it: host ports and URLs come from the
 * `stack` section of .factory/app.json (`stack.ports`, `stack.urls`), shifted for the slot in
 * TESTSTACK_SLOT (0 unless a run leased an isolated copy). Specs that build their URLs from here run on any
 * slot, so several stories can be verified in parallel; a spec with a literal slot-0 port stays on slot 0.
 */
export type StackInfo = {
  slot: number;
  project: string;
  baseUrl: string | null;
  urls: Record<string, string>;
  ports: Record<string, number>;
};

/** How the factory CLI is started: `factory` on PATH, or the command in FACTORY_BIN. */
const FACTORY = process.env.FACTORY_BIN ?? 'factory';

export const SLOT = Number.parseInt(process.env.TESTSTACK_SLOT ?? '0', 10) || 0;

/** Runs `factory <args>` and returns the JSON line it prints (its logs go to this process's stderr). */
export function factory<T = Record<string, unknown>>(args: string[]): T {
  let stdout: string;
  try {
    stdout = execFileSync(FACTORY, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], windowsHide: true, shell: process.platform === 'win32' });
  } catch (error) {
    // A failed command still prints its JSON result ({"ok":false,"error":...}) before it exits.
    stdout = (error as { stdout?: string }).stdout ?? '';
    if (!stdout.trim()) throw error;
  }
  const result = JSON.parse(stdout.trim().split('\n').pop()!);
  if (!result.ok) throw new Error(`factory ${args.join(' ')} failed: ${result.error}`);
  return result as T;
}

// Asked once: Playwright's workers inherit the answer through the environment.
function stackInfo(): StackInfo {
  const key = `TESTSTACK_INFO_${SLOT}`;
  process.env[key] ??= JSON.stringify(factory<StackInfo>(['stack', 'info', '--slot', String(SLOT)]));
  return JSON.parse(process.env[key]!);
}

export const STACK = stackInfo();

/** Host port of a `stack.ports` entry on this slot. */
export function port(name: string): number {
  const value = STACK.ports[name];
  if (value === undefined) throw new Error(`unknown test stack port "${name}" (stack.ports has: ${Object.keys(STACK.ports).join(', ')})`);
  return value;
}

/** A `stack.urls` entry on this slot. */
export function url(name: string): string {
  const value = STACK.urls[name];
  if (value === undefined) throw new Error(`unknown test stack URL "${name}" (stack.urls has: ${Object.keys(STACK.urls).join(', ')})`);
  return value;
}

/** Where the browser starts: TESTSTACK_URL, else the stack's base URL (`stack.baseUrl`, or the first of `stack.urls`). */
export const BASE_URL = process.env.TESTSTACK_URL ?? STACK.baseUrl ?? undefined;
