import { chromium, expect, test } from '@playwright/test';

test('capture stable product views for the README', async ({ baseURL }) => {
  test.setTimeout(60_000);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.grantPermissions(['camera', 'microphone'], { origin: baseURL! });
  const page = await context.newPage();

  await page.goto(`${baseURL}/platform`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /start live interview/i })).toBeVisible();
  await page.screenshot({ path: 'public/readme-dashboard.png' });

  await page.getByRole('button', { name: /start live interview/i }).click();
  await expect(page.getByText('Session context')).toBeVisible();
  await page.screenshot({ path: 'public/readme-presession.png' });

  await page.goto(`${baseURL}/dev/results`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Interview Review')).toBeVisible();
  await page.screenshot({ path: 'public/readme-results.png' });

  await context.close();
  await browser.close();
});
