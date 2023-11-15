import puppeteer from 'puppeteer';

const getQuotes = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://quotes.toscrape.com/', {
    waitUntil: 'domcontentloaded',
  });

  const allQuotes = [];

  async function navigateToAuthorPage(authorLink) {
    await page.goto('http://quotes.toscrape.com' + authorLink);
    await page.waitForSelector('.author-title');
  }

  async function scrapeAuthorPage() {
    return page.evaluate(() => {
      return document.querySelector('h3.author-title').textContent;
    });
  }

  while (true) {
    const quotes = await page.evaluate(() => {
      const quotesList = document.querySelectorAll('.quote');
      const quoteArray = [];

      quotesList.forEach((quote) => {
        const text = quote.querySelector('.text').textContent;
        const authorLinkElement = quote.querySelector('.author + a');

        if (authorLinkElement) {
          const authorLink = authorLinkElement.getAttribute('href');
          const author = quote.querySelector('.author').textContent;
          const tagArray = Array.from(quote.querySelectorAll('.tag')).map(
            (tag) => tag.textContent
          );

          quoteArray.push({ text, author, authorLink, tags: tagArray });
        }
      });

      return quoteArray;
    });

    for (const quote of quotes) {
      await navigateToAuthorPage(quote.authorLink);
      const scrapedFromAboutPage = await scrapeAuthorPage();
      quote.authorInfo = scrapedFromAboutPage;
      await page.goBack();
    }

    allQuotes.push(...quotes);

    const nextButton = await page.$('li.next a');
    if (!nextButton) {
      break;
    }

    await nextButton.click();
    await page.waitForNavigation(); // Add a delay for page load
  }

  console.log(JSON.stringify(allQuotes, null, 2));
  await browser.close();
};

getQuotes();
