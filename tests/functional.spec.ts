import { test, expect } from '@playwright/test';

test('Functional: Sichtbare interaktive Elemente vorhanden', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const interactive = page.locator('a:visible, button:visible, input:visible');
  await expect(interactive.first()).toBeVisible({ timeout: 15_000 });
  expect(await interactive.count()).toBeGreaterThan(0);
});

test('Functional: Page reagiert nach Render', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('body')).toBeVisible();
  // viewport-resize darf keine Exception werfen
  await page.setViewportSize({ width: 800, height: 600 });
  await expect(page.locator('body')).toBeVisible();
});
