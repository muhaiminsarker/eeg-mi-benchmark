import { test } from '@playwright/test';

test('capture all pages and states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Visualize — empty state
  await page.goto('http://localhost:3000/visualize');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'screenshot-current-visualize-empty.png', fullPage: false });

  // 2. Visualize — loaded with explain ON
  await page.click('.load-btn');
  await page.waitForTimeout(800);
  try {
    await page.waitForSelector('.skeleton', { state: 'hidden', timeout: 30000 });
  } catch {}
  await page.waitForTimeout(800);
  // Toggle explain on — click the label since checkbox is hidden
  const toggleLabel = await page.$('.toggle');
  if (toggleLabel) await toggleLabel.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'screenshot-current-visualize-explain.png', fullPage: true });

  // 3. Classify page
  await page.goto('http://localhost:3000/classify');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-current-classify.png', fullPage: false });

  // 4. Benchmark page
  await page.goto('http://localhost:3000/benchmark');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-current-benchmark.png', fullPage: false });
});
