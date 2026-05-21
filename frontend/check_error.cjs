const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER ERROR:', msg.text());
      }
    });

    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.toString());
    });

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Check if body is empty (white screen)
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    if (bodyHTML.trim() === '<div id="root"></div>' || bodyHTML.includes('Error')) {
      console.log('White screen or error detected. Body:', bodyHTML);
    } else {
      console.log('Page loaded successfully!');
    }

    await browser.close();
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  }
})();
