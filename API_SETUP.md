# Rider Ranking Remote API

A simple HTTP API that allows other computers/systems to query rider rankings. This uses **static JSON files** (no database needed), making it easy to host on GitHub Pages or any static web server.

## Quick Start

### Option 1: Run Local API Server (Easiest)

```bash
# 1. Install Node.js if not already installed
# https://nodejs.org/

# 2. Start the API server
node api-server.js

# Server runs on http://localhost:3000
```

Then query from another computer:
```
GET http://your-pc-ip:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026
```

### Option 2: Host on GitHub Pages (Free, Public)

1. Push this repository to GitHub
2. Enable GitHub Pages in repository settings
3. Manually create `docs/api/rankings/*.json` files with your rankings
4. Access from anywhere:
```
https://your-github-username.github.io/ranking-project/api/rider?name=...
```

---

## API Endpoints

### Query a Single Rider

```
GET /api/rider?name={name}&discipline={discipline}&gender={gender}&year={year}
```

**Parameters:**
- `name` (required): Rider name, e.g., `Jelle Dillen`
- `discipline` (required): `flatland`, `street`, `trial`, or `freestyle`
- `gender` (required): `male`, `female`, or `combined`
- `year` (required): Year as number, e.g., `2026`

**Example:**
```bash
curl "http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026"
```

**Response (Success - 200):**
```json
{
  "rank": 4,
  "points": 1250,
  "name": "Jelle Dillen",
  "discipline": "flatland",
  "gender": "male",
  "year": 2026
}
```

**Response (Not Found - 404):**
```json
{
  "error": "Rider not found",
  "query": {
    "name": "Unknown Rider",
    "discipline": "flatland",
    "gender": "male",
    "year": 2026
  }
}
```

### List Available Rankings

```
GET /api/rankings
```

**Response:**
```json
{
  "rankings": [
    "flatland-male-2026",
    "flatland-female-2026",
    "flatland-combined-2026",
    "street-male-2026",
    ...
  ]
}
```

### Health Check

```
GET /health
```

**Response:**
```json
{ "status": "ok" }
```

---

## Setup Instructions

### 1. Generate Rankings JSON Files

**Currently**, you need to manually export rankings from `index.html`. Here's the simplest approach:

**Option A: Browser Console (Manual)**
1. Open `index.html` in your browser
2. Open browser DevTools (F12)
3. Go to Console tab
4. Create the directory structure:
   ```bash
   # In your terminal:
   mkdir -p docs/api/rankings
   ```
5. In browser console, run:
   ```javascript
   const rankings = {
     male: globalRowsByGender.male,
     female: globalRowsByGender.female,
     combined: globalRowsByGender.combined
   };
   console.log(JSON.stringify(rankings.male, null, 2));
   ```
6. Copy the output and save to `docs/api/rankings/flatland-male-2026.json`
7. Repeat for female and combined

**Option B: Automated (Requires Puppeteer)**
```bash
# Install Puppeteer
npm install puppeteer

# Generate JSON files automatically
node generate-rankings-json.js

# Output: docs/api/rankings/flatland-*.json
```

### 2. Start the API Server

```bash
node api-server.js
```

The server will start on `http://localhost:3000`

### 3. Test the API

**Option A: Browser**
- Open `api-test.html` in your browser
- Fill in the form and click "Query Rider"

**Option B: Command Line**
```bash
# Windows
curl "http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026"

# Linux/Mac
curl 'http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026'
```

**Option C: JavaScript (Browser)**
```javascript
const client = new RiderApiClient('http://localhost:3000/api');
const rider = await client.getRider('Jelle Dillen', 'flatland', 'male', 2026);
console.log(rider);
// { rank: 4, points: 1250, name: 'Jelle Dillen', discipline: 'flatland', gender: 'male', year: 2026 }
```

**Option D: JavaScript (Node.js)**
```javascript
const RiderApiClient = require('./rider-api-client.js');
const client = new RiderApiClient('http://localhost:3000/api');
const rider = await client.getRider('Jelle Dillen', 'flatland', 'male', 2026);
console.log(`${rider.name} is ranked #${rider.rank}`);
```

---

## JSON File Format

Each ranking file is a simple JSON array in `docs/api/rankings/{discipline}-{gender}-{year}.json`:

```json
[
  {
    "rank": 1,
    "name": "Rider Name 1",
    "points": 5000
  },
  {
    "rank": 2,
    "name": "Rider Name 2",
    "points": 4500
  },
  ...
]
```

The rank is implicit (array index + 1), so you only need `name` and `points`.

---

## Remote Access (Different PC)

### Same Network (LAN)

Replace `localhost` with your PC's IP address:

```bash
# Find your IP (Windows)
ipconfig

# Find your IP (Linux/Mac)
ifconfig

# Then access from other computer
curl "http://192.168.1.100:3000/api/rider?name=Jelle%20Dillen&..."
```

### Internet (WAN / Outside Network)

1. **Port forwarding**: Configure your router to forward port 3000 to your PC
2. **Or use ngrok** (easier):
   ```bash
   # Install: https://ngrok.com/download
   ngrok http 3000
   
   # Share the generated URL with other systems
   # https://abc123.ngrok.io/api/rider?name=...
   ```

### GitHub Pages (Recommended for Public Access)

1. Push to GitHub
2. Create ranking JSON files in `docs/api/rankings/`
3. Enable GitHub Pages in repo settings
4. Access anywhere via:
   ```
   https://yourusername.github.io/ranking-project/api-test.html
   ```

---

## Client Libraries

### JavaScript (Browser & Node.js)

```javascript
const client = new RiderApiClient('http://localhost:3000/api');

// Get a rider
const rider = await client.getRider('Jelle Dillen', 'flatland', 'male', 2026);

// Check if API is available
const isUp = await client.isHealthy();

// List available rankings
const rankings = await client.getAvailableRankings();
```

### Python

```python
import requests

API_URL = 'http://localhost:3000/api'

def get_rider(name, discipline, gender, year):
    params = {
        'name': name,
        'discipline': discipline,
        'gender': gender,
        'year': year
    }
    response = requests.get(f'{API_URL}/rider', params=params)
    if response.status_code == 200:
        return response.json()
    elif response.status_code == 404:
        return None
    else:
        raise Exception(f"API error: {response.status_code}")

# Usage
rider = get_rider('Jelle Dillen', 'flatland', 'male', 2026)
if rider:
    print(f"{rider['name']} is ranked #{rider['rank']} with {rider['points']} points")
```

### C# / .NET

```csharp
using System;
using System.Net.Http;
using System.Threading.Tasks;

class RiderApiClient
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    public RiderApiClient(string baseUrl)
    {
        _baseUrl = baseUrl;
        _client = new HttpClient();
    }

    public async Task<dynamic> GetRider(string name, string discipline, string gender, int year)
    {
        var query = $"?name={Uri.EscapeDataString(name)}&discipline={discipline}&gender={gender}&year={year}";
        var response = await _client.GetAsync($"{_baseUrl}/rider{query}");
        
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            return null;
            
        return await response.Content.ReadAsAsync<dynamic>();
    }
}

// Usage
var client = new RiderApiClient("http://localhost:3000/api");
var rider = await client.GetRider("Jelle Dillen", "flatland", "male", 2026);
Console.WriteLine($"{rider.name} - Rank #{rider.rank}");
```

---

## Troubleshooting

### "Cannot find module 'puppeteer'"
```bash
npm install puppeteer
```

### API server won't start
- Check if port 3000 is already in use
- Try a different port: `PORT=8000 node api-server.js`

### "Rider not found" on correct name
- Rider names must match exactly (but case-insensitive)
- Check if the JSON file exists in `docs/api/rankings/`
- Verify the discipline/gender/year parameters are correct

### CORS errors in browser
- The API server already includes CORS headers
- If self-hosting, make sure to allow requests from your domain
- For testing locally, use the same origin or enable CORS

---

## Files Included

| File | Purpose |
|------|---------|
| `api-server.js` | Main HTTP server for the API |
| `rider-api-client.js` | JavaScript client library |
| `api-test.html` | Web UI to test the API |
| `generate-rankings-json.js` | Auto-generate rankings JSON files (requires Puppeteer) |
| `export-rankings.js` | Export function for Node.js usage |
| `docs/api/rankings/` | Directory for JSON ranking files |

---

## Updating Rankings

Whenever you update rankings in `index.html`, regenerate the JSON files:

```bash
# Option 1: Manual (Browser Console)
# Open index.html, copy rankings from console

# Option 2: Automated
node generate-rankings-json.js

# Then restart the API server
node api-server.js
```

---

## Security Notes

- **API is read-only**: Only GET requests are allowed
- **No authentication**: Currently public (you can add authentication if needed)
- **CORS enabled**: Can be called from any domain
- **Sensitive data**: Don't expose data you want to keep private

If you need to restrict access, modify `api-server.js` to add authentication:

```javascript
// Add at top of request handler
if (req.headers.authorization !== `Bearer ${process.env.API_KEY}`) {
  res.writeHead(401);
  res.end(JSON.stringify({ error: 'Unauthorized' }));
  return;
}
```

---

## License

Same as the main ranking project.
