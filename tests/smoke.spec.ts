import { test, expect } from '@playwright/test';

test('Smoke: Index lädt, Titel ok, keine Asset-404s', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', r => {
    const url = r.url();
    if (r.status() >= 400 && !/favicon|supabase|cdn\.jsdelivr|googleapis|gstatic|fonts|\.(?:jpg|jpeg|png|webp|gif|svg|mp4|mp3|woff2?)(?:\?|$)/i.test(url)) {
      failed.push(`${r.status()} ${url}`);
    }
  });
  await page.goto('/');
  await expect(page).toHaveTitle(/Tangojam/i);
  await page.waitForLoadState('networkidle').catch(() => {});
  expect(failed, failed.join('\n')).toEqual([]);
});
