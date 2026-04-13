const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8081';
const OUTPUT_DIR = path.join(__dirname, '..', 'tmp', 'screenshots');

const VIEWPORTS = [
  { name: 'iphone-se', width: 375, height: 812 },
  { name: 'iphone-14', width: 390, height: 844 },
  { name: 'ipad', width: 768, height: 1024 },
];

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Step 1: Navigate to homepage and open login modal
  await page.goto(BASE_URL);
  await delay(2000);

  // Try to find a login button or avatar that triggers auth modal
  // On TicketHall, usually there's a user menu or "Entrar" button
  const loginBtn = page.locator('text=Entrar').first();
  if (await loginBtn.count() > 0) {
    await loginBtn.click();
    await delay(500);
  } else {
    // Try clicking profile/avatar icon
    const avatar = page.locator('[data-testid="avatar"], button:has(.lucide-user), header button').first();
    if (await avatar.count() > 0) await avatar.click();
    await delay(500);
  }

  // Fill login form if visible
  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
    await emailInput.fill('producer-loadtest@ticket.test');
    await passwordInput.fill('test123456');
    await page.locator('button:has-text("Entrar"), button[type="submit"]').first().click();
    await delay(3000);
  }

  // Step 2: Navigate directly to event panel editor
  await page.goto(`${BASE_URL}/producer/events/00000000-0000-0000-0000-000000000002/panel?editorStep=info`);
  await delay(3000);

  // Check if we're authenticated
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  if (!currentUrl.includes('/producer/events')) {
    console.error('Failed to navigate to event panel. URL:', currentUrl);
    // Take screenshot of current state for debugging
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'debug-not-authenticated.png'), fullPage: true });
    await browser.close();
    process.exit(1);
  }

  // Step 3: Take screenshots at each viewport
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await delay(1000);
    // Scroll to top before screenshot
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    const filePath = path.join(OUTPUT_DIR, `pre-refactor-${vp.name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Screenshot saved: ${filePath}`);
  }

  await browser.close();
  console.log('Pre-refactor audit complete.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
