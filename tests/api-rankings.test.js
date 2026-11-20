const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const puppeteer = require('puppeteer');
const { startServer } = require('../api-server');
const { createSiteServer } = require('../generate-rankings-json');

test('API startup exports website rankings instead of serving old sample files', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ranking-api-test-'));
  fs.writeFileSync(path.join(outputDir, 'flatland-male-1900.json'), '[{"name":"Sample","points":9999}]');
  let api;
  let site;
  let browser;

  try {
    api = await startServer(0, outputDir);
    const apiUrl = `http://127.0.0.1:${api.address().port}`;
    site = createSiteServer();
    await new Promise((resolve) => site.listen(0, '127.0.0.1', resolve));
    const siteUrl = `http://127.0.0.1:${site.address().port}`;
    const options = { headless: true };
    if (fs.existsSync(await puppeteer.executablePath('chrome'))) options.channel = 'chrome';
    browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().startsWith(`${siteUrl}/`) && request.method() === 'GET') request.continue();
      else request.abort();
    });

    for (const [discipline, year, gender] of [
      ['flatland', 2026, 'male'],
      ['flatland', 2025, 'female'],
      ['street', 2026, 'combined'],
      ['x-style', 2024, 'male'],
      ['x-style', 2026, 'male']
    ]) {
      await page.goto(`${siteUrl}/index.html?discipline=${discipline}`, { waitUntil: 'load' });
      await page.waitForFunction(() => document.querySelectorAll('#year-select option').length > 0);
      const expected = await page.evaluate(({ year, gender }) => {
        const rows = [...getRankingsForYear(year, gender)];
        rows.sort((a, b) => b.points - a.points || a.rider.localeCompare(b.rider));
        return rows.map((row) => ({ name: row.rider, points: row.points }));
      }, { year, gender });
      assert.ok(expected.length, `website has ${discipline} ${gender} ${year} data`);

      const params = new URLSearchParams({ name: expected[0].name, discipline, gender, year });
      const response = await fetch(`${apiUrl}/api/rider?${params}`);
      assert.equal(response.status, 200);
      const rider = await response.json();
      assert.equal(rider.rank, 1);
      assert.equal(rider.name, expected[0].name);
      assert.equal(rider.points, expected[0].points);
      const file = JSON.parse(fs.readFileSync(path.join(outputDir, `${discipline}-${gender}-${year}.json`), 'utf8'));
      assert.deepEqual(file, expected);

      if (discipline === 'flatland' && year === 2026) {
        await page.select('#year-select', String(year));
        await page.click('[data-gender="male"]');
        const firstRow = await page.$eval('#ranking-body tr', (row) => row.textContent);
        assert.ok(firstRow.includes(expected[0].name), 'API leader matches the visible ranking');
      }
      if (discipline === 'x-style') {
        params.set('discipline', 'freestyle');
        const alias = await fetch(`${apiUrl}/api/rider?${params}`);
        assert.equal((await alias.json()).points, expected[0].points);
      }
    }

    const list = await (await fetch(`${apiUrl}/api/rankings`)).json();
    assert.ok(list.rankings.includes('x-style-male-2024'));
    assert.ok(!list.rankings.includes('flatland-male-1900'));
    const stale = await fetch(`${apiUrl}/api/rider?name=Sample&discipline=flatland&gender=male&year=1900`);
    assert.equal(stale.status, 404);
    assert.equal((await fetch(`${apiUrl}/api/rider?name=Sample`)).status, 400);
  } finally {
    if (browser) await browser.close();
    if (site) await new Promise((resolve) => site.close(resolve));
    if (api) await new Promise((resolve) => api.close(resolve));
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});
