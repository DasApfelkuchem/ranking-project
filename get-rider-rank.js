/**
 * Direct getRiderRank function for Node.js
 * No server required - reads JSON files directly
 * 
 * Usage:
 *   const { getRiderRank } = require('./get-rider-rank.js');
 *   const result = getRiderRank('Jelle Dillen', 'flatland', 'male', 2026);
 *   console.log(result); // { rank: 4, points: 1250, name: 'Jelle Dillen' }
 */

const fs = require('fs');
const path = require('path');

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
 * Get rider rank from local JSON file
 * 
 * @param {string} name - Rider name
 * @param {string} discipline - 'flatland', 'street', 'trial', 'freestyle'
 * @param {string} gender - 'male', 'female', 'combined'
 * @param {number} year - Year (e.g., 2026)
 * @returns {Object|null} { rank, points, name } or null if not found
 */
function getRiderRank(name, discipline, gender, year) {
  if (!name || !discipline || !gender || !year) {
    throw new Error('All parameters required: name, discipline, gender, year');
  }

  // Load JSON file from docs/api/rankings/
  const filePath = path.join(
    __dirname,
    'docs',
    'api',
    'rankings',
    `${discipline}-${gender}-${year}.json`
  );

  if (!fs.existsSync(filePath)) {
    return null; // File doesn't exist
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const rankings = JSON.parse(content);

    if (!Array.isArray(rankings)) {
      throw new Error(`Invalid JSON format in ${filePath}`);
    }

    // Find rider by name (normalized)
    const normalized = normalizeName(name);
    
    for (let i = 0; i < rankings.length; i++) {
      const entry = rankings[i];
      if (normalizeName(entry.name) === normalized) {
        return {
          rank: i + 1,
          points: entry.points || 0,
          name: entry.name,
          discipline,
          gender,
          year
        };
      }
    }

    return null; // Rider not in this ranking
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Get rider rank from multiple disciplines/genders
 * 
 * @param {string} name - Rider name
 * @param {number} year - Year
 * @returns {Array} Array of rankings found
 */
function getRiderRankings(name, year) {
  const disciplines = ['flatland', 'street', 'trial', 'freestyle'];
  const genders = ['male', 'female', 'combined'];
  const results = [];

  for (const discipline of disciplines) {
    for (const gender of genders) {
      const result = getRiderRank(name, discipline, gender, year);
      if (result) {
        results.push(result);
      }
    }
  }

  return results;
}

/**
 * Get all riders in a ranking
 * 
 * @param {string} discipline
 * @param {string} gender
 * @param {number} year
 * @returns {Array} All riders in ranking order
 */
function getRanking(discipline, gender, year) {
  const filePath = path.join(
    __dirname,
    'docs',
    'api',
    'rankings',
    `${discipline}-${gender}-${year}.json`
  );

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Search for riders by partial name
 * 
 * @param {string} query - Partial name
 * @param {string} discipline
 * @param {string} gender
 * @param {number} year
 * @returns {Array} Matching riders
 */
function searchRiders(query, discipline, gender, year) {
  const ranking = getRanking(discipline, gender, year);
  const normalizedQuery = normalizeName(query);

  return ranking
    .filter(entry => normalizeName(entry.name).includes(normalizedQuery))
    .slice(0, 10); // Return top 10 matches
}

// Export functions
module.exports = {
  getRiderRank,
  getRiderRankings,
  getRanking,
  searchRiders
};

// Example usage if run directly
if (require.main === module) {
  console.log('=== Rider Rank Query Examples ===\n');

  // Example 1: Get a single rider's rank
  console.log('Example 1: Get single rider');
  const result = getRiderRank('Jelle Dillen', 'flatland', 'male', 2026);
  if (result) {
    console.log(`  ${result.name} - Rank #${result.rank} (${result.points} points)\n`);
  } else {
    console.log('  Rider not found\n');
  }

  // Example 2: Get all rankings for a rider across disciplines
  console.log('Example 2: Get rankings for a rider across all disciplines');
  const allRankings = getRiderRankings('Jelle Dillen', 2026);
  if (allRankings.length > 0) {
    allRankings.forEach(r => {
      console.log(`  ${r.discipline} (${r.gender}): Rank #${r.rank}`);
    });
    console.log();
  } else {
    console.log('  No rankings found\n');
  }

  // Example 3: Get top 10 riders in a category
  console.log('Example 3: Top 10 riders (flatland, male, 2026)');
  const ranking = getRanking('flatland', 'male', 2026);
  ranking.slice(0, 10).forEach(r => {
    console.log(`  #${ranking.indexOf(r) + 1}: ${r.name} (${r.points} points)`);
  });
  console.log();

  // Example 4: Search for riders
  console.log('Example 4: Search for riders named "Dillen"');
  const matches = searchRiders('Dillen', 'flatland', 'male', 2026);
  if (matches.length > 0) {
    matches.forEach((m, i) => {
      const rank = getRanking('flatland', 'male', 2026).indexOf(m) + 1;
      console.log(`  ${rank}. ${m.name} (${m.points} points)`);
    });
  } else {
    console.log('  No matches found');
  }
}
