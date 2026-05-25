import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 1100 });
await page.goto('http://localhost:3000/visualize');
await page.waitForTimeout(1000);
await page.click('.load-btn');
await page.waitForTimeout(1000);
try {
  await page.waitForSelector('.skeleton', { state: 'visible', timeout: 5000 });
  await page.waitForSelector('.skeleton', { state: 'hidden', timeout: 45000 });
} catch (e) { console.log('Skeleton timeout:', e.message); }
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshot-viz-loaded.png', fullPage: true });
await browser.close();
console.log('Done');
