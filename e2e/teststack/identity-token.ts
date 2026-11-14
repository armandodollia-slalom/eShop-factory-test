import type { Browser } from '@playwright/test';
import { url } from './ports';

/** An implicit-flow client registered in Identity.API, with the scope to request and its registered redirect URI. */
export type ImplicitClient = {
  clientId: string;
  scope: string;
  redirectUri: string;
  state: string;
};

/**
 * Signs in to identity as a demo user through an implicit-flow client (the swagger UI clients) and returns the
 * access token. The 302 from /connect/authorize/callback carries the token in its Location fragment; the redirect
 * target resolves only inside the compose network, so the token is read from that response, not the page.
 * Returns '' when no token was issued.
 */
export async function getAccessToken(
  browser: Browser,
  client: ImplicitClient,
  username = 'alice',
  password = 'Pass123$',
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
      state: client.state,
    }).toString();
    await page.goto(authorize.toString());
    await page.getByPlaceholder('Username').fill(username);
    await page.getByPlaceholder('Password').fill(password);
    const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
    await page.getByRole('button', { name: 'Login' }).click();
    const location = (await callback).headers()['location'] ?? '';
    return new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
  } finally {
    await context.close();
  }
}
