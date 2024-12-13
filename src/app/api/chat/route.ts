// TODO: Implement the chat API with Groq and web scraping with Cheerio and Puppeteer
// Refer to the Next.js Docs on how to read the Request body: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// Refer to the Groq SDK here on how to use an LLM: https://www.npmjs.com/package/groq-sdk
// Refer to the Cheerio docs here on how to parse HTML: https://cheerio.js.org/docs/basics/loading
// Refer to Puppeteer docs here: https://pptr.dev/guides/what-is-puppeteer

import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import puppeteer from "puppeteer";
import { load } from "cheerio";
import { scrapeArticle } from "./scraper";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function extractURL(prompt: string): string | null {
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = prompt.match(urlRegex);

  // Return the first match, or null if no URL is found
  return matches ? matches[0] : null;
}

export async function getGroqChatCompletion(message: string) {
  const userURL = extractURL(message);
  let scrapedContent = "";
  if (userURL) {
    scrapedContent = await scrapeWebsite(userURL);
  }
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
          You are a helpful assistant specializing in analyzing and summarizing large amounts of data, including [specific types, if applicable, e.g., text documents, numerical data, or reports]. 
          When responding, always:
          - Break down complex information into clear, concise points.
          - Provide step-by-step explanations for any analysis or summarization.
          - Avoid assumptions and clarify ambiguous queries by asking for more details.
          - Use examples to support explanations when appropriate.
        `,
      },
      {
        role: "user",
        content: `
          ${message.trim()}
          Content from url: \n\n
          ${scrapedContent}
        `.trim(),
      },
    ],
    model: "llama3-8b-8192",
  });
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();

    // Validate the request data
    if (!body.message) {
      return NextResponse.json(
        { error: "Message field is required." },
        { status: 400 }
      );
    }

    // Simulated processing of the message (replace with your actual logic)
    const chatCompletion = await getGroqChatCompletion(body.message);
    const responseMessage = chatCompletion.choices[0]?.message?.content || "";
    console.log(responseMessage);
    // Return the processed response
    return NextResponse.json({ reply: responseMessage });
  } catch (error) {
    console.error("Error processing request:", error);

    // Handle errors and return a 500 response
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function scrapeWebsite(url: string): Promise<string> {
  try {
    if (!url) {
      throw new Error("URL is required");
    }

    console.log("Scraping URL:", url);

    // Launch Puppeteer and scrape the page
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Get the page content as HTML
    const html = await page.content();
    console.log("HTML content length:", html.length);

    await browser.close();

    // Parse the HTML with Cheerio
    const $ = load(html);

    // Extract all paragraph text and header tags
    const articleContent = $("p, h1, h2, h3, h4, h5, h6")
      .map((i, el) => $(el).text())
      .get()
      .join("\n");

    console.log("Extracted article content:", articleContent);

    return articleContent;
  } catch (error) {
    console.error("Error in scraper function:", error);
    throw new Error("Failed to scrape the website");
  }
}
