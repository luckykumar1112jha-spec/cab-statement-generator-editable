import { CONFIG } from './config';
import path from 'path';
import { Browser } from 'puppeteer-core';

// We use dynamic imports for puppeteer/chromium to avoid errors during local builds
let browser: Browser | null = null;

export const initBrowser = async () => {
  if (browser) return browser;

  try {
    const isVercel = !!process.env.VERCEL;
    const isRender = !!process.env.RENDER;

    if (isVercel) {
      // Production (Vercel) configuration
      const puppeteer = await import('puppeteer-core');
      const chromium = await import('@sparticuz/chromium');

      browser = await puppeteer.launch({
        args: chromium.default.args,
        defaultViewport: chromium.default.defaultViewport,
        executablePath: await chromium.default.executablePath(),
        headless: chromium.default.headless as any,
      }) as unknown as Browser;

    } else if (isRender) {
      // Production (Render) configuration
      const puppeteer = await import('puppeteer');
      const profileDir = path.join(
        CONFIG.TEMP_DIR,
        `puppeteer_profile_${Date.now()}`
      );

      browser = await puppeteer.launch({
        headless: true,
        userDataDir: profileDir,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-sync',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-first-run',
          '--disable-default-apps'
        ]
      }) as unknown as Browser;

    } else {
      // Local development configuration
      const puppeteer = await import('puppeteer');
      const profileDir = path.join(
        CONFIG.TEMP_DIR,
        `puppeteer_profile_${Date.now()}`
      );

      browser = await puppeteer.launch({
        headless: true,
        userDataDir: profileDir,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--remote-debugging-port=0'
        ]
      }) as unknown as Browser;
    }

  } catch (error) {
    console.error('Failed to launch puppeteer:', error);
    throw error;
  }

  return browser;
};

export const closeBrowser = async () => {
  if (browser) {
    await browser.close();
    browser = null;
  }
};

export const generatePdf = async (
  html: string,
  fileName: string
): Promise<string> => {

  const b = await initBrowser();
  if (!b) {
    throw new Error('Failed to initialize browser');
  }

  const page = await b.newPage();

  // Increase timeout to 2 minutes
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(120000);

  try {
    await page.setContent(html, {
      waitUntil: 'domcontentloaded'
    });

    // Wait until fonts are loaded
    await page.evaluate(async () => {
      // @ts-ignore
      await document.fonts.ready;
    });

    const pdfPath = path.join(CONFIG.PDF_DIR, fileName);

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });

    return pdfPath;

  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  } finally {
    await page.close();
  }
};