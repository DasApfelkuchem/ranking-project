#!/usr/bin/env node

/**
 * Quick test script to verify the API system is working
 * Run: node test-api.js
 */

const http = require('http');
const { getRiderRank, getRanking } = require('./get-rider-rank.js');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(type, message) {
  const prefix = {
    '✓': `${colors.green}✓${colors.reset}`,
    '✗': `${colors.red}✗${colors.reset}`,
    '→': `${colors.blue}→${colors.reset}`,
    '!': `${colors.yellow}!${colors.reset}`
  }[type] || type;
  
  console.log(`${prefix} ${message}`);
}

async function testDirectFunction() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Direct getRiderRank() function');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const rider = getRiderRank('Jelle Dillen', 'flatland', 'male', 2026);
    
    if (rider) {
      log('✓', 'Function loaded successfully');
      log('✓', `Found rider: ${rider.name}`);
      log('→', `  Rank: #${rider.rank}`);
      log('→', `  Points: ${rider.points}`);
      log('→', `  Discipline: ${rider.discipline}`);
      log('→', `  Gender: ${rider.gender}`);
      log('→', `  Year: ${rider.year}`);
    } else {
      log('!', 'Rider not found - JSON files may not exist yet');
      log('!', 'Run: npm install puppeteer && node generate-rankings-json.js');
      return false;
    }
    return true;
  } catch (error) {
    log('✗', `Error: ${error.message}`);
    return false;
  }
}

async function testApiServer() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: HTTP API server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/health', (res) => {
      if (res.statusCode === 200) {
        log('✓', 'API server is running on http://localhost:3000');
        log('→', 'Health check: OK');
        resolve(true);
      } else {
        log('✗', `API server returned status ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      log('!', 'API server not running');
      log('→', 'Start it with: node api-server.js');
      resolve(false);
    });
    
    req.setTimeout(3000);
  });
}

async function testJsonFiles() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Ranking JSON files');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const ranking = getRanking('flatland', 'male', 2026);
    
    if (ranking && ranking.length > 0) {
      log('✓', `JSON files found and loaded`);
      log('→', `Flatland male 2026: ${ranking.length} riders`);
      
      if (ranking[0]) {
        log('→', `  Top rider: ${ranking[0].name} (${ranking[0].points} points)`);
      }
      return true;
    } else {
      log('!', 'JSON files not found');
      log('→', 'Create them with: node generate-rankings-json.js');
      return false;
    }
  } catch (error) {
    log('✗', `Error: ${error.message}`);
    return false;
  }
}

async function testClientLibrary() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Client library');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Check if rider-api-client.js exists
    const fs = require('fs');
    if (fs.existsSync('./rider-api-client.js')) {
      log('✓', 'rider-api-client.js found');
      log('→', 'Can be used in browser with: const client = new RiderApiClient(url);');
      return true;
    } else {
      log('✗', 'rider-api-client.js not found');
      return false;
    }
  } catch (error) {
    log('✗', `Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   Remote Rider Ranking API - Test Suite          ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  const results = {
    directFunction: await testDirectFunction(),
    jsonFiles: await testJsonFiles(),
    clientLibrary: await testClientLibrary(),
    apiServer: await testApiServer()
  };
  
  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;
  
  log('→', `Passed: ${passed}/${total} tests\n`);
  
  if (results.directFunction && results.jsonFiles) {
    log('✓', 'JSON files and direct function: Ready!');
  }
  
  if (results.apiServer) {
    log('✓', 'HTTP API: Ready!');
  } else {
    log('!', 'HTTP API: Not running (optional)');
    log('→', 'Start with: node api-server.js');
  }
  
  if (results.clientLibrary) {
    log('✓', 'Client library: Ready!');
  }
  
  // Next steps
  if (passed === total) {
    console.log('\n✓ Everything is set up and ready!');
    console.log('\nNext steps:');
    console.log('  1. Start API server: node api-server.js');
    console.log('  2. Test in browser: open api-test.html');
    console.log('  3. Query from another PC: See QUICK_START.md');
  } else {
    console.log('\n⚠ Some components are missing. See messages above.');
  }
  
  console.log('\n📖 Documentation: See QUICK_START.md, API_README.md, or API_SETUP.md\n');
}

// Run tests
runTests().catch(err => {
  log('✗', `Fatal error: ${err.message}`);
  process.exit(1);
});
