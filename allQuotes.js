import puppeteer from 'puppeteer';

const extractQuotesCurrentPage = async (page) => {
  const quotes = await page.evaluate(() => {
    const quotesList = document.querySelectorAll('.quote');

    const quoteArray = Array.from(quotesList).map((quote) => {
      const text = quote.querySelector('.text').textContent;
      const author = quote.querySelector('.author').textContent;
      const authorURL = quote.querySelector('.author + a').href;
      const tagArray = Array.from(quote.querySelectorAll('.tag')).map(
        (tag) => tag.textContent
      );

      return {
        text: text,
        author: author,
        authorURL: authorURL,
        tags: tagArray,
      };
    });

    return quoteArray;
  });

  return quotes;
};

const getQuotes = async () => {
  // Launch Puppeteer and create a new page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the main quotes page
  await page.goto('http://quotes.toscrape.com/', {
    waitUntil: 'domcontentloaded',
  });

  // Array to store all scraped quotes
  let allQuotes = [];

  // Function to navigate to an author's page
  const navigateToAuthorPage = async (url) => {
    try {
      await page.goto(url);
      await page.waitForSelector('.author-born-location');
    } catch (error) {
      // Handle errors when navigating to an author's page
      console.error('Error navigating to author page:', error);
    }
  };

  // Function to scrape additional information from the author's page
  const scrapeAuthorPage = async () => {
    const authorInfo = await page.evaluate(() => {
      const data = document.querySelector('.author-born-location').textContent;
      return data;
    });
    return authorInfo;
  };

  // Main loop to iterate through pages and scrape quotes
  while (true) {
    // Scrape quotes from the current page
    const quotes = await extractQuotesCurrentPage(page);

    // Iterate through each quote and scrape additional information
    for (const quote of quotes) {
      const authorUrl = quote.authorURL;
      await navigateToAuthorPage(authorUrl);

      // Add scraped information from the author's page to the quote object
      const scrapedFromAboutPage = await scrapeAuthorPage();
      quote.authorBornDate = scrapedFromAboutPage;

      // Navigate back to the main quotes page
      await page.goBack();
    }

    // Add the scraped quotes to the overall array
    allQuotes.push(...quotes);

    // Check if there is a "next" button to go to the next page
    const nextButton = await page.evaluate(() => {
      return document.querySelector('ul.pager > li.next > a');
    });

    // If there is no "next" button, exit the loop
    if (nextButton == null) {
      break;
    } else {
      // Click the "next" button to go to the next page
      await page.click('ul.pager > li.next > a');
    }
  }

  // Log the type and JSON representation of allQuotes
  console.log(typeof allQuotes);
  const jsonData = JSON.stringify(allQuotes, null, 2);
  console.log(jsonData);

  // Close the Puppeteer browser
  await browser.close();
};

// Call the main function to start the scraping process
getQuotes();
