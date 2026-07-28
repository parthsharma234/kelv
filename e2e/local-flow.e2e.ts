import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('opens the platform without a remote account or access gate', async ({ page }) => {
  await page.goto('/platform');
  await expect(page.getByRole('heading', { name: /Train the weak point/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Start live interview/i })).toBeVisible();
});

test('routes homepage navigation and local sign-in into the platform', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Platform' }).click();
  await expect(page).toHaveURL(/\/platform$/);

  await page.goto('/login');
  await page.getByLabel('Email').fill('candidate@kelv.local');
  await page.getByLabel('Password').fill('local-only');
  await page.locator('form').getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/platform$/);
});

test('dashboard launch control opens the local pre-session surface', async ({ page }) => {
  await page.goto('/platform');
  await page.getByRole('button', { name: /Start live interview/i }).click();
  await expect(page.getByRole('heading', { name: 'Session context' })).toBeVisible();
  await expect(page.getByText('Job description')).toBeVisible();
  await expect(page.getByText('Resume', { exact: true })).toBeVisible();
});
