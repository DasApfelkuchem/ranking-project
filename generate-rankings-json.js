/**
 * Export the rankings calculated by the website, using its default settings.
 * Run directly with: node generate-rankings-json.js
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = __dirname;
const DEFAULT_OUTPUT_DIR = path.join(ROOT, 'docs', 'api', 'rankings');
const DISCIPLINES = ['flatland', 'street', 'trial', 'x-style'];
const GENDERS = ['male', 'female', 'combined'];
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function createSiteServer() {
  return http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch (error) {
      res.writeHead(400).end('Invalid URL');
      return;
    }

    const allowed = ['/index.html', '/ranking.js', '/discipline-menu.js', '/styles.css', '/riders_all.txt'];
    if (req.method !== 'GET' || (!allowed.includes(pathname) &&
      !pathname.startsWith('/Results_Disciplines/') &&
      !pathname.startsWith('/detailed event PDF/') &&
      !pathname.startsWith('/assets/'))) {
      res.writeHead(404).end('Not found');
      return;
    }
    const file = path.resolve(ROOT, `.${pathname}`);
    const relative = path.relative(ROOT, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    fs.readFile(file, (error, data) => {
      if (error) {
        res.writeHead(error.code === 'ENOENT' ? 404 : 500).end(error.message);
        return;
      }
      res.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

async function generateRankingsJson(outputDir = DEFAULT_OUTPUT_DIR) {
  fs.accessSync(path.join(ROOT, 'riders_all.txt'), fs.constants.R_OK);
  const site = createSiteServer();
  let browser;
  await new Promise((resolve, reject) => {
    site.once('error', reject);
    site.listen(0, '127.0.0.1', resolve);
  });

  try {
    const origin = `http://127.0.0.1:${site.address().port}`;
    const launchOptions = { headless: true };
    if (fs.existsSync(await puppeteer.executablePath('chrome'))) launchOptions.channel = 'chrome';
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().startsWith(`${origin}/`) && request.method() === 'GET') {
        request.continue();
      } else {
        request.abort();
      }
    });

    const allRankings = new Map();
    for (const discipline of DISCIPLINES) {
      console.log(`Calculating ${discipline} rankings...`);
      await page.goto(`${origin}/index.html?discipline=${encodeURIComponent(discipline)}`, {
        waitUntil: 'load'
      });
      try {
        await page.waitForFunction(
          () => document.querySelectorAll('#year-select option').length > 0,
          { timeout: 60000 }
        );
      } catch (error) {
        const status = await page.$eval('#ranking-body', (body) => body.textContent.trim());
        throw new Error(`Could not load ${discipline} rankings: ${status || error.message}`);
      }

      const rankings = await page.evaluate((genders) => {
        const years = getAvailableYears();
        if (!years.length) throw new Error('No ranking snapshots found');
        const firstYear = Math.min(...years);
        const lastYear = Math.max(new Date().getFullYear(), ...years);
        const result = {};
        for (let year = firstYear; year <= lastYear; year++) {
          for (const gender of genders) {
            const rows = [...getRankingsForYear(year, gender)];
            rows.sort((a, b) => b.points - a.points || a.rider.localeCompare(b.rider));
            result[`${gender}-${year}`] = rows.map((row) => ({
              name: row.rider,
              points: row.points
            }));
          }
        }
        return result;
      }, GENDERS);

      for (const [suffix, rows] of Object.entries(rankings)) {
        allRankings.set(`${discipline}-${suffix}`, rows);
      }
    }

    fs.mkdirSync(outputDir, { recursive: true });
    for (const [key, rows] of allRankings) {
      fs.writeFileSync(path.join(outputDir, `${key}.json`), JSON.stringify(rows, null, 2), 'utf8');
    }
    console.log(`Generated ${allRankings.size} ranking files in ${outputDir}`);
    return allRankings;
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve, reject) => site.close((error) => error ? reject(error) : resolve()));
  }
}

if (require.main === module) {
  generateRankingsJson().catch((error) => {
    console.error('Failed to generate rankings:', error);
    process.exitCode = 1;
  });
}

module.exports = { generateRankingsJson, createSiteServer };
