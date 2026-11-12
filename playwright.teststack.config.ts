import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';
import { BASE_URL, STACK } from './e2e/teststack/ports';

/**
 * Runs the e2e suite against the Docker Compose test stack (`factory teststack up`) instead of starting the
 * application itself. Ports and URLs come from the `stack` section of .factory/config.json, for the slot in
 * TESTSTACK_SLOT. Test users and other data come from the scenarios in .factory/stack/scenarios; if the base
 * config reads credentials from the environment, give them their test stack values here.
 */

// A stack URL may use a host name that only resolves inside the containers (host.docker.internal, so the
// browser and the services agree on an issuer URL). The browser maps those names to this machine.
const local = ['localhost', '127.0.0.1', '[::1]'];
const mapped = [...new Set(Object.values(STACK.urls).map((u) => new URL(u).hostname).filter((host) => !local.includes(host)))];
const projects = baseConfig.projects ?? [];

// e2e/login.setup.ts signs in with USERNAME1 / PASSWORD: on the test stack that is the seeded user alice
// (.factory/stack/scenarios/default/scenario.yaml).
process.env.USERNAME1 ??= 'alice';
process.env.PASSWORD ??= 'Pass123$';

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: BASE_URL,
    launchOptions: {
      ...baseConfig.use?.launchOptions,
      args: [...(baseConfig.use?.launchOptions?.args ?? []), ...(mapped.length ? [`--host-resolver-rules=${mapped.map((host) => `MAP ${host} 127.0.0.1`).join(', ')}`] : [])],
    },
  },
  projects: [
    ...projects,
    {
      // Each spec loads its own scenario (e2e/teststack/scenario.ts), so these run only here, after the others.
      name: 'scenarios',
      testMatch: ['**/teststack/*.spec.ts'],
      dependencies: projects.map((project) => project.name!).filter(Boolean),
    },
  ],
  webServer: undefined,
});
