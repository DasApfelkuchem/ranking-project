# Remote Rider Ranking API - Working System

## ✅ Current Status: WORKING

The Remote Rider Ranking API system is **fully functional**. Users on remote computers can query rider information by name, discipline, gender, and year.

## Quick Start

### 1. Start the API Server
```bash
cd "C:\Users\benni\Desktop\unicycling\unicycling\ranking project"
python api-server.py
```

The server runs on `http://localhost:3000`

### 2. Query Rider Information

**Example 1: Get Jelle Dillen's Flatland ranking**
```
http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026
```

Response:
```json
{
  "rank": 92,
  "points": 3909,
  "name": "Jelle Dillen",
  "discipline": "flatland",
  "gender": "male",
  "year": 2026
}
```

**Example 2: Get A.J Kinselle-Johnson's ranking (top rider)**
```
http://localhost:3000/api/rider?name=A.J%20Kinselle-Johnson&discipline=flatland&gender=male&year=2026
```

Response:
```json
{
  "rank": 1,
  "points": 5320,
  "name": "A.J Kinselle-Johnson",
  "discipline": "flatland",
  "gender": "male",
  "year": 2026
}
```

## API Endpoints

### GET /api/rider
Query rider ranking by name, discipline, gender, year

**Parameters:**
- `name` (required): Rider name (must be exact match, case-insensitive)
- `discipline` (required): flatland, freestyle, street, trial, x-style
- `gender` (required): male, female, combined
- `year` (required): 2022, 2023, 2024, 2025, 2026

**Response:**
```json
{
  "rank": <number>,
  "points": <number>,
  "name": "<string>",
  "discipline": "<string>",
  "gender": "<string>",
  "year": <number>
}
```

**Error Response (404):**
```json
{
  "error": "Rider not found",
  "query": {
    "name": "<search query>",
    "discipline": "<discipline>",
    "gender": "<gender>",
    "year": <year>
  }
}
```

### GET /api/rankings
List all available ranking file combinations

**Response:**
```json
{
  "rankings": [
    "flatland-combined-2022",
    "flatland-combined-2023",
    ...
  ]
}
```

### GET /health
Server health check

**Response:**
```json
{
  "status": "ok"
}
```

## Data Available

**Disciplines:** flatland, freestyle, street, trial, x-style
**Genders:** male, female, combined
**Years:** 2022, 2023, 2024, 2025, 2026

### Storage Location
Rankings stored in: `docs/api/rankings/{discipline}-{gender}-{year}.json`

Each ranking file contains a sorted array of rider data with:
- rank (implicit index)
- rider (name)
- points (ranking score)
- events (number of events)
- wins (number of first places)
- podiums (number of podium finishes)

## Remote Access

To query from another PC on the same network:
1. Find your computer's IP address: `ipconfig` (look for IPv4 Address)
2. Use that IP instead of `localhost`:
   ```
   http://<your-ip>:3000/api/rider?name=...&discipline=...&gender=...&year=...
   ```

Example (if your PC's IP is 192.168.1.100):
```
http://192.168.1.100:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026
```

## Implementation Details

- **Backend:** Python HTTP server (api-server.py)
- **Data Format:** JSON files with precomputed rankings
- **Performance:** Results are cached in memory after first query
- **CORS:** Enabled for cross-origin requests

## Browser Interface

Main ranking page: `http://localhost:3000/`

This shows an interactive interface where you can:
- Select discipline from dropdown
- View rankings for each gender
- Filter by year
- Search for specific riders

## Recent Data Updates

Ranking files were created from real competition data with actual rider statistics:
- Points are calculated based on event placements
- Decay is applied for older events
- Different weight multipliers for different event types (Unicon, Continental, National, etc.)

## Next Steps (Future Enhancements)

1. **Auto-extraction**: Create a workflow to automatically extract rankings from ranking.js
   - File: `extract-all-rankings.html` (in progress)
   - Requires browser to load ranking.js and trigger ranking calculations
   - Should POST extracted data to `/api/import-rankings` endpoint

2. **Multi-discipline support**: Currently optimized for flatland; extend to other disciplines

3. **Historical tracking**: Track ranking changes over time for each rider

4. **Filtering**: Add queries for top N riders, podium finishes, etc.

5. **Statistics**: Add endpoint for rider profile with detailed stats

## Troubleshooting

### "Rider not found"
- Check exact rider name spelling
- Name matching is case-insensitive but must match exactly
- Some riders may have alternate names (aliases)

### "Missing parameters"
- Ensure all four required parameters are provided: name, discipline, gender, year
- Year must be 2022-2026

### Connection refused
- Server not running: Start with `python api-server.py`
- Wrong port: Confirm server is running on port 3000

### Slow response
- First query for a discipline/gender/year combination loads from disk
- Subsequent queries use cached data (should be instant)
- Clear cache by restarting server if data is updated

