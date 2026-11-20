# Remote Rider Ranking API Setup Guide

## Overview
This system allows other computers to remotely query rider ranking information from your unicycling rankings database.

## How It Works
1. **ranking.js** (browser) calculates rankings and automatically exports them to the API server
2. **API Server** (Node.js) receives the rankings and serves them via HTTP endpoints
3. **Remote Clients** can query the API to get rider ranks and points

## Setup Steps

### Step 1: Start the Main Ranking Page
Open your browser and load the main rankings page (this triggers the export):
```
http://127.0.0.1:5500/
```

This loads ranking.js which calculates all the rankings and automatically sends them to the API server.

### Step 2: Start the API Server
You'll need Node.js installed. Run:
```bash
node get-rider-rank-api.js
```

The server will start on `http://localhost:6789`

You'll see output like:
```
======================================================================
Rider Ranking API Server
======================================================================
Server running on http://localhost:6789
```

### Step 3: Test the API
Open the test page in your browser:
```
http://localhost:3000/api-test-updated.html
```

Or use curl from command line:
```bash
curl "http://localhost:6789/api/rider?name=Jelle%20Dillen&year=2026&gender=male&discipline=flatland"
```

## API Endpoints

### Query Rider Rank
**GET** `/api/rider`

Parameters:
- `name` (required): Rider name, e.g., "Jelle Dillen"
- `year` (required): Year, e.g., "2026"
- `gender` (required): "male", "female", or "combined"
- `discipline` (required): "flatland", "street", "trial", or "x-style"

Example:
```
GET http://localhost:6789/api/rider?name=Jelle%20Dillen&year=2026&gender=male&discipline=flatland
```

Response:
```json
{
  "rank": 2,
  "points": 689.02,
  "name": "Jelle Dillen",
  "events": 8,
  "wins": 2,
  "podiums": 5,
  "battles": 15,
  "discipline": "flatland",
  "gender": "male",
  "year": "2026"
}
```

### Upload Rankings (Automatic)
**POST** `/api/rankings`

This endpoint is called automatically by ranking.js when rankings finish loading. Manual use is not required.

### Health Check
**GET** `/health`

Response:
```json
{
  "status": "ok",
  "endpoints": [...]
}
```

## Important Notes

1. **Rankings Export**: When you load the main rankings page (index.html), it automatically exports the calculated rankings to the API server. This happens in the browser.

2. **Data Freshness**: Rankings are updated each time you load the main ranking page. If you update your event result files and want the API to serve new rankings, reload the main page.

3. **Local Network Only**: By default, the API only listens on localhost. To allow remote access from other computers, modify the API server to listen on `0.0.0.0` instead of `localhost`.

4. **Multiple Disciplines**: Each discipline has its own API server instance. The current implementation serves the data it receives. To support multiple disciplines, start multiple API server instances on different ports or modify the server to handle multiple disciplines.

## Troubleshooting

### "Cannot find module 'node'"
Node.js is not installed. Download and install from https://nodejs.org/

### "Rankings not found" error
1. Make sure you've loaded the main ranking page (http://127.0.0.1:5500/) first
2. Check that the API server is running
3. Wait a few seconds - the rankings export is asynchronous

### "Connection refused"
The API server is not running. Run `node get-rider-rank-api.js`

### Wrong rider names or no results
Rider names are case-sensitive. Make sure you're using the exact name as it appears in the rankings. Use the test page to browse available names.

## Remote Access Setup

To allow other computers to access the API server:

1. Find your computer's local IP address:
   - Windows: Run `ipconfig` and look for "IPv4 Address"
   - Mac/Linux: Run `ifconfig` or `ip addr`

2. Modify `get-rider-rank-api.js` to listen on all interfaces:
   ```javascript
   server.listen(PORT, '0.0.0.0', () => {
   ```

3. Restart the server

4. Remote clients can now access:
   ```
   http://YOUR_IP:6789/api/rider?name=...&year=...&gender=...&discipline=...
   ```

## Example Code

### JavaScript/Fetch
```javascript
async function getRiderRank(name, year, gender, discipline) {
  const params = new URLSearchParams({
    name, year, gender, discipline
  });
  const response = await fetch(`http://localhost:6789/api/rider?${params}`);
  const data = await response.json();
  return data;
}
```

### Python
```python
import requests

response = requests.get('http://localhost:6789/api/rider', params={
    'name': 'Jelle Dillen',
    'year': '2026',
    'gender': 'male',
    'discipline': 'flatland'
})
data = response.json()
print(f"Rank: {data['rank']}, Points: {data['points']}")
```

### cURL
```bash
curl -s "http://localhost:6789/api/rider?name=Jelle%20Dillen&year=2026&gender=male&discipline=flatland" | jq
```

## Next Steps

1. Keep the rankings page open or reload it after updating competition results
2. Query the API from your applications using the endpoint format above
3. Set up automated exports if needed (modify ranking.js post export logic)
