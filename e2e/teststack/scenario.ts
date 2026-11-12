import { SLOT, factory } from './ports';

/** Container CLI of the test stack (for example TESTSTACK_DOCKER=podman). */
export const DOCKER = process.env.TESTSTACK_DOCKER ?? 'docker';

export type LoadResult = { ok: boolean; scenario: string; layers: string[]; mode: 'soft' | 'hard'; restarted: string[]; elapsedMs: number };

/**
 * Puts the whole stack into the given scenario (.factory/stack/scenarios/<name>) and returns the loader's JSON
 * result. Call it in `beforeAll`; it clears every store first, so specs that share a stack must run serially.
 */
export function loadScenario(name: string, options: { hard?: boolean } = {}): LoadResult {
  return factory<LoadResult>(['teststack', '--slot', String(SLOT), 'load', name, ...(options.hard ? ['--hard'] : [])]);
}

/** Clears every store and loads only the base scenario. */
export function resetStack(): LoadResult {
  return factory<LoadResult>(['teststack', '--slot', String(SLOT), 'reset']);
}
