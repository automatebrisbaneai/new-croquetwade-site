const { test, expect } = require('../../apps/mycroquet/node_modules/@playwright/test');
const path = require('path');

const FILE_URL = 'file://' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');

test.describe('new.croquetwade.com fixes', () => {
  test('page loads at 1440px with correct title', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FILE_URL);
    await expect(page).toHaveTitle(/CroquetWade/);
  });

  test('CTA button visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FILE_URL);
    const cta = page.locator('a.btn').first();
    await expect(cta).toBeVisible();
  });

  test('375px no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(FILE_URL);
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(390);
  });

  test('noscript fallback present in head', async ({ page }) => {
    await page.goto(FILE_URL);
    const noscriptContent = await page.evaluate(() => {
      const ns = document.querySelector('noscript');
      return ns ? ns.innerHTML : '';
    });
    expect(noscriptContent).toContain('opacity:1');
  });

  test('wade-thinking image present in player section', async ({ page }) => {
    await page.goto(FILE_URL);
    const img = page.locator('section.section-player img[src="images/wade-thinking.png"]');
    const count = await img.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('wade-mallet image present in bamford section', async ({ page }) => {
    await page.goto(FILE_URL);
    const img = page.locator('section.section-bamford img[src="images/wade-mallet.png"]');
    const count = await img.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('footer stacks on mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(FILE_URL);
    const flexDir = await page.locator('.footer-inner').evaluate(el => getComputedStyle(el).flexDirection);
    expect(flexDir).toBe('column');
  });

  test('accordion trigger has left border style', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FILE_URL);
    const trigger = page.locator('.expand-trigger').first();
    const borderStyle = await trigger.evaluate(el => {
      const s = getComputedStyle(el);
      return s.borderLeftStyle + ':' + s.borderLeftWidth;
    });
    // Should have a solid border of 3px
    expect(borderStyle).toBe('solid:3px');
  });
});
