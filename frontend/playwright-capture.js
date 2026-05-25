const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('http://localhost:3000/visualize');
  await page.waitForTimeout(1000);
  // Click the load button
  await page.click('.load-btn');
  // Wait for skeleton to appear then disappear (data loaded)
  await page.waitForTimeout(1000);
  // Wait until skeleton is gone (data loaded from backend)
  try {
    await page.waitForSelector('.skeleton', { state: 'visible', timeout: 5000 });
    await page.waitForSelector('.skeleton', { state: 'hidden', timeout: 30000 });
  } catch {}
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-viz-loaded.png', fullPage: true });
  await browser.close();
  console.log('Done');
})();
