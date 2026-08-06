const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.toString()));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText));

  console.log('Navigating to https://veerop.github.io/food-on-the-move/ ...');
  try {
    await page.goto('https://veerop.github.io/food-on-the-move/', { waitUntil: 'networkidle0', timeout: 15000 });
  } catch (e) {
    console.log('Goto error:', e.message);
  }

  const title = await page.title();
  const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML || 'ROOT EMPTY');
  console.log('Page Title:', title);
  console.log('Root HTML snippet:', rootHTML.substring(0, 300));

  await browser.close();
})();
