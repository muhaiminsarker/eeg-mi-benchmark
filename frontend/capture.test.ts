import { test } from '@playwright/test';

test('capture loaded visualize', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('http://localhost:3000/visualize');
  await page.waitForTimeout(1500);
  await page.click('.load-btn');
  await page.waitForTimeout(1000);
  try {
    await page.waitForSelector('.skeleton', { state: 'visible', timeout: 5000 });
    await page.waitForSelector('.skeleton', { state: 'hidden', timeout: 60000 });
  } catch {}
  // Wait for epoch strip to appear (labels fetched after main load)
  try {
    await page.waitForSelector('[title^="Epoch"]', { timeout: 15000 });
  } catch {}
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-viz-loaded.png', fullPage: true });

  // Capture the time series card zoomed in
  const tsCard = await page.$('.viz-grid .card:first-child');
  if (tsCard) await tsCard.screenshot({ path: 'screenshot-ts-card.png' });

  // Capture the epoch strip area (header + strip)
  const strip = await page.$('[title^="Epoch"]');
  if (strip) {
    const parent = await strip.evaluateHandle(el => el.parentElement?.parentElement);
    if (parent) {
      const parentEl = parent.asElement();
      if (parentEl) await parentEl.screenshot({ path: 'screenshot-epoch-strip.png' });
    }
  }

  // Capture PSD card
  const cards = await page.$$('.viz-grid .card');
  if (cards[1]) await cards[1].screenshot({ path: 'screenshot-psd-card.png' });
  if (cards[2]) await cards[2].screenshot({ path: 'screenshot-topo-card.png' });
});
