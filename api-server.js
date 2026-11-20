/**
 * Simple HTTP API server for rider rankings.
 * Run: node api-server.js
 * 
 * Exposes endpoints:
 *   GET /api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026
 *   Returns: { rank, points, name, discipline, gender, year } or { error: "Not found" }
 */

const http = require('http');
const { generateRankingsJson } = require('./generate-rankings-json');

const PORT = process.env.PORT || 3000;

// Only serve rankings generated during this startup, not leftover sample files.
let rankingsCache = new Map();

/**
 * Normalize a rider name for comparison
 */
function normalizeName(name) {
  if (!name) return '';
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get a ranking generated from the website at startup.
 */
function loadRankingFile(discipline, gender, year) {
  const key = `${discipline === 'freestyle' ? 'x-style' : discipline}-${gender}-${year}`;
  return rankingsCache.get(key) || null;
}

/**
 * Find a rider in the ranking list and return their rank + points
 */
function findRiderRank(name, discipline, gender, year) {
  const rankings = loadRankingFile(discipline, gender, year);
  if (!rankings || rankings.length === 0) {
    return null;
  }
  
  const normalized = normalizeName(name);
  
  for (let i = 0; i < rankings.length; i++) {
    const entry = rankings[i];
    const entryName = entry.rider || entry.name;
    if (normalizeName(entryName) === normalized) {
      return {
        rank: i + 1,
        points: entry.points || 0,
        name: entryName,
        discipline,
        gender,
        year
      };
    }
  }
  
  return null;
}

/**
 * HTTP request handler
 */
const server = http.createServer((req, res) => {
  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, 'http://localhost');
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Invalid request URL' }));
    return;
  }
  const pathname = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Health check
  if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  
  // Main API endpoint: /api/rider
  if (pathname === '/api/rider' && req.method === 'GET') {
    const { name, discipline, gender, year } = query;
    
    if (!name || !discipline || !gender || !year) {
      res.writeHead(400);
      res.end(JSON.stringify({
        error: 'Missing parameters',
        required: ['name', 'discipline', 'gender', 'year'],
        example: '/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026'
      }));
      return;
    }
    
    try {
      const result = findRiderRank(name, discipline, gender, year);
      if (result) {
        res.writeHead(200);
        res.end(JSON.stringify(result));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({
          error: 'Rider not found',
          query: { name, discipline, gender, year }
        }));
      }
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
  
  // List available rankings
  if (pathname === '/api/rankings' && req.method === 'GET') {
    try {
      res.writeHead(200);
      res.end(JSON.stringify({ rankings: Array.from(rankingsCache.keys()) }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
  
  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

async function startServer(port = PORT, outputDir) {
  rankingsCache = await generateRankingsJson(outputDir);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, resolve);
  });
  const actualPort = server.address().port;
  console.log(`\nRanking API server running on http://localhost:${actualPort}`);
  console.log('\nExamples:');
  console.log(`  GET http://localhost:${actualPort}/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026`);
  console.log(`  GET http://localhost:${actualPort}/api/rankings`);
  console.log(`  GET http://localhost:${actualPort}/health`);
  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start ranking API:', error);
    process.exitCode = 1;
  });
}

module.exports = { startServer };
