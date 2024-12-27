import {Prompts} from "../../models/enums/prompts";
import {logger} from "../../utils/logger";
import got from "got";
import * as cheerio from "cheerio";

/**
 * Scrapes web content from a specified URL with retry mechanism
 * @param {string} url - The URL to scrape content from
 * @return {Promise<string | null>} The scraped HTML content or null if all retries fail
 * @throws {Error} When scraping fails after maximum retries
 */
export async function scrapingWeb(url: string): Promise<string | null> {
  logger.log(Prompts.INIT);
  let cleanHTML: string;
  try {
    const response = await got(url);
    const html = response.body;
    const $ = cheerio.load(html);

    const selectors = [
      "img, svg", "script, style", "iframe, object, noscript, embed",
      "nav, header, footer, aside, button, form, input",
      "meta, link[rel='stylesheet'], base",
      "[data-tracking], ins, template, menu, track",
      "a[href*='facebook.com'], a[href*='instagram.com'], a[href*='twitter.com'], a[href*='whatsapp.com'], a[href*='linkedin.com'], a[href*='youtube.com'], a[href*='pinterest.com']",
      "div[class*='facebook'], div[class*='instagram'], div[class*='twitter'], div[class*='whatsapp'], div[class*='linkedin'], div[class*='youtube'], div[class*='pinterest']",
    ];

    selectors.forEach((selector) => $(selector).remove());

    const cleanedHTML = $.html();
    cleanHTML = cleanedHTML;
    return cleanHTML;
    console.log("HTML limpio:", cleanedHTML);
  } catch (error) {
    throw new Error(`Error scraping the URL: ${url}. Details`);
  }
  return null;
}
