import puppeteer from 'puppeteer';

async function getQuotes() {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();

  await page.goto('http://quotes.toscrape.com/', {
    waitUntil: 'domcontentloaded',
  });

  let allQuotes = [];

  while (true) {
    const quotes = await page.evaluate(() => {
      const quoteList = document.querySelectorAll('.quote');

      return Array.from(quoteList).map((quote) => {
        const text = quote.querySelector('.text').innerText;
        const author = quote.querySelector('.author').innerText;

        return { text, author };
      });
    });

    allQuotes.push(...quotes);

    const nextButton = await page.evaluate(() => {
      return document.querySelector('ul.pager li.next a');
    });

    if (nextButton == null) {
      break;
    } else await page.click('ul.pager li.next a');
  }

  console.log(allQuotes);

  //await browser.close()
}

getQuotes();
