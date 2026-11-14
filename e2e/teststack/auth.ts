import type { Browser } from '@playwright/test';
import { url } from './ports';

/** An identity client that uses the implicit flow, as the stack registers it. */
export type ImplicitClient = {
  clientId: string;
  scope: string;
  /** The redirect URI identity registers for the client; it may resolve only inside the compose network. */
  redirectUri: string;
};

/**
 * Signs in as a demo user (alice by default) through the client's implicit flow and returns the access token.
 * The 302 from /connect/authorize/callback carries the token in its Location fragment; the redirect target may be
 * unreachable from the host, so the token is read from that response instead of the final page.
 */
export async function implicitFlowToken(
  browser: Browser,
  client: ImplicitClient,
  user: { username: string; password: string } = { username: 'alice', password: 'Pass123$' },
): Promise<string> {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const authorize = new URL(`${url('identity')}/connect/authorize`);
    authorize.search = new URLSearchParams({
      client_id: client.clientId,
      response_type: 'token',
      scope: client.scope,
      redirect_uri: client.redirectUri,
      state: client.clientId,
    }).toString();
    await page.goto(authorize.toString());
    await page.getByPlaceholder('Username').fill(user.username);
    await page.getByPlaceholder('Password').fill(user.password);
    const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
    await page.getByRole('button', { name: 'Login' }).click();
    const location = (await callback).headers()['location'] ?? '';
    return new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
  } finally {
    await context.close();
  }
}
