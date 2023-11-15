import puppeteer from 'puppeteer';

// Function to extract qutoes on current page
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

// Function to navigate to an author's page
const navigateToAuthorPage = async (url, page) => {
  try {
    await page.goto(url);
    await page.waitForSelector('.author-born-location');
  } catch (error) {
    // Handle errors when navigating to an author's page
    console.error('Error navigating to author page:', error);
  }
};

// Function to scrape additional information from the author's page
const scrapeAuthorPage = async (page) => {
  const authorInfo = await page.evaluate(() => {
    const data = document.querySelector('.author-born-location').textContent;
    return data;
  });
  return authorInfo;
};

// Function to navigate to author page, scrape data and go back (for every quote)
const processQuotes = async (quotes, page) => {
  // Iterate through each quote and scrape additional information
  for (const quote of quotes) {
    const authorUrl = quote.authorURL;
    await navigateToAuthorPage(authorUrl, page);

    // Add scraped information from the author's page to the quote object
    const scrapedFromAboutPage = await scrapeAuthorPage(page);
    quote.authorBornDate = scrapedFromAboutPage;

    // Navigate back to the main quotes page
    await page.goBack();
  }
};

// Function to check if there is next page
const isNextButtonPresent = async (page) => {
  // Check if there is a "next" button to go to the next page
  const nextButton = await page.evaluate(() => {
    return document.querySelector('ul.pager > li.next > a');
  });

  // If there is no "next" button, exit the loop
  if (nextButton == null) {
    return false;
  } else {
    // Click the "next" button to go to the next page
    await page.click('ul.pager > li.next > a');
    return true;
  }
};

const getQuotes = async () => {
  // Launch Puppeteer and create a new page
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to the main quotes page
  await page.goto('http://quotes.toscrape.com/', {
    waitUntil: 'domcontentloaded',
  });

  // Array to store all scraped quotes
  let allQuotes = [];

  // Main loop to iterate through pages and scrape quotes
  while (true) {
    // Scrape quotes from the current page
    const quotes = await extractQuotesCurrentPage(page);

    await processQuotes(quotes, page);

    // Add the scraped quotes to the overall array
    allQuotes.push(...quotes);

    if (!(await isNextButtonPresent(page))) {
      break;
    }
  }

  // Log the type and JSON representation of allQuotes
  console.log(typeof allQuotes);
  const jsonData = JSON.stringify(allQuotes, null, 2);
  //console.log(jsonData);

  // Convert JSON string to object (array of objects) and then filter
  const data = JSON.parse(jsonData);
  const filteredData = data.filter(
    (item) => item.tags.includes('death') && item.tags.includes('life')
  );
  console.log(typeof filteredData + '\n', filteredData);

  // Close the Puppeteer browser
  await browser.close();
};

// Call the main function to start the scraping process
getQuotes();
