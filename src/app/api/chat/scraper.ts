import puppeteer from "puppeteer";
import { load } from "cheerio"; 

export async function scrapeArticle(url: string): Promise<string> {
  try{
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
  
    await page.goto(url, { waitUntil: "networkidle2" });
    const html = await page.content();
  
    const $ = load(html); 
  
    // Extract article content
    const articleContent = $("article p")
      .map((i, el) => $(el).text())
      .get()
      .join("\n");
  
    await browser.close();
    return articleContent;
  }catch{
    return "Error"
  }
}


// Example usage
