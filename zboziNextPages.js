import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const getZbozi = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://www.akcniceny.cz/zbozi/billa/', {
    waitUntil: 'domcontentloaded',
  });

  let allProducts = [];

  while (true) {
    const products = await page.$$eval(
      "div[itemtype='http://schema.org/Product']",
      (products) => {
        let productArr = [];
        for (let product of products) {
          const name = product.querySelector('h2').textContent;
          const price = product.querySelector('p').textContent;

          productArr.push({ name, price });
        }
        return productArr;
      }
    );

    allProducts.push(...products);

    const nextBtn = await page.$("ul.pagination > li > a[title='Následující']");

    // const nextBtn = await page.evaluate(async () => {
    //   return document.querySelector(
    //     "ul.pagination > li > a[title='Následující']"
    //   );
    // });

    if (nextBtn == null) {
      console.log('Není button');
      break;
    } else {
      console.log('Clicking Next button.');
      await page.evaluate(() => {
        return document
          .querySelector("ul.pagination > li > a[title='Následující']")
          .click();
      });

      await page.waitForNavigation();
    }
  }

  console.log(allProducts);

  fs.writeFileSync(
    'scrapedDataBilla.json',
    JSON.stringify(allProducts, null, 2)
  );
  console.log('Data saved to "scrapedDataBilla.json"');

  //await browser.close();
};

getZbozi();
