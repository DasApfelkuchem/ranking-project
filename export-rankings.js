/**
 * Node.js build script to export rankings as static JSON files for GitHub Pages.
 * Run: node export-rankings.js
 * 
 * This script loads ranking.js, extracts its pre-calculated rankings from globalRowsByGender,
 * and exports them as JSON files for the API to use (without recalculating).
 * 
 * Generated files: /docs/api/rankings/{gender}.json
 */

const fs = require('fs');
const path = require('path');

// Mock browser environment for ranking.js
global.document = null;
global.localStorage = null;
global.window = { matchMedia: () => ({ matches: false }) };

// Variables that ranking.js will populate
let globalRowsByGender = { male: [], female: [], combined: [] };

// Load and execute ranking.js to populate globalRowsByGender
function loadRankingData() {
  try {
    console.log('Loading ranking.js...');
    
    // Create a minimal mock environment
    global.fetch = async (url) => {
      // Return empty response for file fetches
      return { ok: false, text: async () => '' };
    };
    
    // Load and execute ranking.js
    const rankingCode = fs.readFileSync('ranking.js', 'utf8');
    
    // Execute in current scope so globalRowsByGender gets populated
    // eslint-disable-next-line no-eval
    eval(rankingCode);
    
    console.log('✓ ranking.js loaded and executed');
    
    // Return the populated data
    return globalRowsByGender;
    
  } catch (err) {
    console.error('Error loading ranking.js:', err.message);
    throw err;
  }
}

/**
 * Export rankings to JSON files
 */
function exportRankingsToJson(rankingsData) {
  const outputDir = path.join(__dirname, 'docs', 'api', 'rankings');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let totalRiders = 0;
  
  // Export each gender's rankings
  for (const [gender, riders] of Object.entries(rankingsData || {})) {
    if (!riders || riders.length === 0) {
      console.log(`  Skipping ${gender}: no data`);
      continue;
    }
    
    // Convert to format expected by API: [{ name, points }, ...]
    const ranking = riders
      .filter(r => r.rider)  // Only include entries with a rider name
      .map((r, index) => ({
        rank: index + 1,
        name: r.rider,
        points: Math.round(r.points || 0)
      }));
    
    // Save to JSON file
    const filename = `rankings-${gender}.json`;
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(ranking, null, 2), 'utf8');
    console.log(`  ✓ ${filename} (${ranking.length} riders)`);
    
    totalRiders += ranking.length;
  }
  
  return totalRiders;
}

// Main execution
if (require.main === module) {
  console.log('='.repeat(70));
  console.log('Exporting Rankings from ranking.js');
  console.log('='.repeat(70));
  console.log();
  
  try {
    // Load ranking.js and extract globalRowsByGender
    const rankingsData = loadRankingData();
    
    // Check if we got data
    if (!rankingsData || Object.keys(rankingsData).length === 0) {
      console.error('ERROR: No rankings data extracted from ranking.js');
      process.exit(1);
    }
    
    console.log();
    console.log('Exporting to JSON files...');
    const totalRiders = exportRankingsToJson(rankingsData);
    
    console.log();
    console.log('='.repeat(70));
    console.log(`Success! Exported ${totalRiders} rider rankings`);
    console.log('='.repeat(70));
    
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { exportRankingsToJson };

