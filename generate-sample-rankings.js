/**
 * Generate sample ranking JSON files from riders_all.txt
 * This is a quick way to create mock rankings for testing.
 * Run: node generate-sample-rankings.js
 */

const fs = require('fs');
const path = require('path');

// Read riders_all.txt
const ridersFile = path.join(__dirname, 'riders_all.txt');
let riders = [];

try {
  const content = fs.readFileSync(ridersFile, 'utf8');
  riders = content
    .split('\n')
    .filter(line => line.trim())
    .map((line, idx) => {
      const name = line.split('#')[0].trim();
      const isF = line.includes('#F');
      return { name, female: isF };
    })
    .filter(r => r.name);
  
  console.log(`✓ Loaded ${riders.length} riders from riders_all.txt`);
} catch (err) {
  console.error('Error reading riders_all.txt:', err.message);
  process.exit(1);
}

// Generate mock rankings with pseudo-random points
function generateRanking(riders, gender, seed = 2026) {
  // Filter by gender
  let filtered = riders.filter(r => {
    if (gender === 'female') return r.female;
    if (gender === 'male') return !r.female;
    return true; // combined
  });

  // Simple seeded random for consistent results
  const seededRandom = (s) => {
    const x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };

  // Sort with pseudo-random scoring based on name hash
  filtered = filtered.map((r, i) => {
    let hash = 0;
    for (let j = 0; j < r.name.length; j++) {
      hash = ((hash << 5) - hash) + r.name.charCodeAt(j);
      hash = hash & hash; // Convert to 32-bit int
    }
    const rnd = Math.abs(hash) % 1000;
    const basePoints = 5000 - i * 20 + rnd * 5;
    const points = Math.max(100, Math.round(basePoints));
    return { name: r.name, points };
  }).sort((a, b) => b.points - a.points);

  return filtered;
}

// Create rankings
const disciplines = ['flatland', 'street', 'trial', 'freestyle'];
const genders = ['male', 'female', 'combined'];
const years = [2026, 2025, 2024, 2023, 2022];
const rankingsDir = path.join(__dirname, 'docs', 'api', 'rankings');

// Ensure directory exists
if (!fs.existsSync(rankingsDir)) {
  fs.mkdirSync(rankingsDir, { recursive: true });
}

let totalFiles = 0;

disciplines.forEach(discipline => {
  genders.forEach(gender => {
    years.forEach(year => {
      const ranking = generateRanking(riders, gender, year * 1000);
      const filename = `${discipline}-${gender}-${year}.json`;
      const filepath = path.join(rankingsDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(ranking, null, 2));
      console.log(`✓ Generated ${filename} (${ranking.length} riders)`);
      totalFiles++;
    });
  });
});

console.log(`\n✓✓ SUCCESS! Generated ${totalFiles} ranking files`);
console.log(`\nFiles saved to: ${rankingsDir}`);
console.log('\nNext step: node api-server.js');
