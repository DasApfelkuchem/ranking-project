/**
 * Client library to query rider rankings from the remote API.
 * 
 * Usage in browser or Node.js:
 * 
 *   const client = new RiderApiClient('https://your-domain.example/api');
 *   const result = await client.getRider('Jelle Dillen', 'flatland', 'male', 2026);
 *   console.log(result); // { rank: 4, points: 1250, name: 'Jelle Dillen', ... }
 */

class RiderApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || '/api';
  }

  /**
   * Query a single rider's rank
   * @param {string} name - Rider name
   * @param {string} discipline - 'flatland', 'street', 'trial', 'freestyle'
   * @param {string} gender - 'male', 'female', 'combined'
   * @param {number} year - Year (e.g., 2026)
   * @returns {Promise<Object|null>} Rider data or null if not found
   */
  async getRider(name, discipline, gender, year) {
    if (!name || !discipline || !gender || !year) {
      throw new Error('All parameters required: name, discipline, gender, year');
    }

    const params = new URLSearchParams({
      name,
      discipline,
      gender,
      year
    });

    try {
      const response = await fetch(`${this.baseUrl}/rider?${params}`);
      
      if (response.status === 404) {
        return null; // Rider not found
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  /**
   * Get list of available ranking files
   * @returns {Promise<string[]>} Array of available ranking file names
   */
  async getAvailableRankings() {
    try {
      const response = await fetch(`${this.baseUrl}/rankings`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return data.rankings || [];
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  /**
   * Check if the API server is accessible
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RiderApiClient;
}

/**
 * Example usage:
 * 
 * Browser:
 *   const client = new RiderApiClient('https://your-domain.com/api');
 *   const rider = await client.getRider('Jelle Dillen', 'flatland', 'male', 2026);
 *   console.log(`${rider.name} is ranked #${rider.rank} with ${rider.points} points`);
 * 
 * Node.js:
 *   const RiderApiClient = require('./rider-api-client.js');
 *   const client = new RiderApiClient('http://localhost:3000/api');
 *   const rider = await client.getRider('Jelle Dillen', 'flatland', 'male', 2026);
 */
