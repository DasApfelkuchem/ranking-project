# Remote Rider Ranking API - Quick Start Guide

## What's New ✨

Your rankings.js file now **automatically exports rankings** to the API server when you load the rankings page. No manual export needed!

---

## 3-Step Setup

### Step 1: Load the Rankings Page
Open in your browser to calculate and export rankings:
```
http://127.0.0.1:5500/
```

This loads ranking.js which automatically sends the calculated rankings to the API server.

### Step 2: Start the API Server
In your project directory, run:
```bash
node get-rider-rank-api.js
```

You'll see:
```
======================================================================
Rider Ranking API Server
======================================================================
Server running on http://localhost:6789

API Endpoints:
  GET  /api/rider?name=...&year=2026&gender=male
  POST /api/rankings - Upload rankings data
  GET  /health - Health check
======================================================================
```

### Step 3: Test the API
**Option A: Web Test Interface**
Open in your browser:
```
http://localhost:3000/api-test-updated.html
```

**Option B: Direct Query**
```
http://localhost:6789/api/rider?name=Jelle%20Dillen&year=2026&gender=male&discipline=flatland
```

**Option C: cURL**
```bash
curl "http://localhost:6789/api/rider?name=Jelle%20Dillen&year=2026&gender=male&discipline=flatland"
```

---

## How It Works

```
Your Computer:
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌────────────────────────┐                                  │
│  │   index.html (port     │                                  │
│  │   5500)                │  Automatically exports           │
│  │   ranking.js           │  rankings when loaded            │
│  │   calculates rankings  │─────┐                            │
│  └────────────────────────┘     │                            │
│                                  │                            │
│                                  │ POST                       │
│                                  │ /api/rankings              │
│                                  │ (auto, in browser)         │
│                                  │                            │
│                        ┌─────────▼──────────────┐             │
│                        │ get-rider-rank-api.js  │             │
│                        │ API Server (port 6789) │             │
│                        │                        │             │
│                        │ Receives + serves      │             │
│                        │ rider rankings         │             │
│                        └────────────────────────┘             │
│                                 ▲                            │
│                                 │                            │
└─────────────────────────────────┼────────────────────────────┘
                                  │
                        Any client can query:
                        GET /api/rider?name=...
```

---

## API Endpoint

**GET** `/api/rider`

### Parameters
- `name` (required): Rider name, e.g., "Jelle Dillen"
- `year` (optional): "2026", "2024", "2022" (default: "2026")
- `gender` (optional): "male", "female", "combined" (default: "male")
- `discipline` (optional): "flatland", "street", "trial", "x-style" (default: "flatland")

### Response
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

### Error Response
```json
{
  "error": "Rider \"Unknown Person\" not found in flatland male rankings"
}
```

---

## Code Examples

### JavaScript / Node.js
```javascript
async function getRiderRank(name) {
  const response = await fetch(
    `http://localhost:6789/api/rider?name=${encodeURIComponent(name)}&gender=male&discipline=flatland&year=2026`
  );
  const data = await response.json();
  console.log(`${data.name}: Rank #${data.rank}, ${data.points} points`);
}

getRiderRank('Jelle Dillen');
```

### Python
```python
import requests

response = requests.get('http://localhost:6789/api/rider', params={
    'name': 'Jelle Dillen',
    'gender': 'male',
    'discipline': 'flatland',
    'year': '2026'
})

data = response.json()
print(f"Rank: {data['rank']}, Points: {data['points']}")
```

### cURL
```bash
curl -s "http://localhost:6789/api/rider?name=Jelle%20Dillen&gender=male&discipline=flatland&year=2026" | jq
```

### C# / .NET
```csharp
using System.Net.Http;

var client = new HttpClient();
var url = "http://localhost:6789/api/rider?name=Jelle%20Dillen&gender=male&discipline=flatland&year=2026";
var response = await client.GetAsync(url);
var json = await response.Content.ReadAsStringAsync();
Console.WriteLine(json);
```

---

## Remote Access (Different Computer)

### Same WiFi/LAN Network

1. Find your computer's IP address:
   - Windows: Run `ipconfig` → look for "IPv4 Address" (e.g., 192.168.1.100)
   - Mac/Linux: Run `ifconfig` or `ip addr`

2. Modify `get-rider-rank-api.js` - change:
   ```javascript
   server.listen(PORT, () => {
   ```
   to:
   ```javascript
   server.listen(PORT, '0.0.0.0', () => {
   ```

3. Restart the server

4. From another computer on the same network:
   ```
   http://YOUR_IP_ADDRESS:6789/api/rider?name=...&year=...&gender=...&discipline=...
   ```

### Internet Access (Optional)

Use **ngrok** (free):
```bash
# Install from https://ngrok.com/download
ngrok http 6789

# You'll get a URL like:
# https://abc123.ngrok.io/api/rider?name=...
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Rider not found" | Load rankings page first (Step 1), then try again |
| "Connection refused" | Make sure API server is running (Step 2) |
| "Cannot find module" | Install Node.js from https://nodejs.org/ |
| Wrong rider data | Rider names are case-sensitive. Check exact spelling in rankings. |
| Empty results | Reload the rankings page to export fresh data |
| "CORS error" in browser | Should be handled - check console for actual error |

---

## Files Created/Modified

### New Files
- **get-rider-rank-api.js** - HTTP API server (run this)
- **api-test-updated.html** - Browser test interface
- **API_SETUP_GUIDE.md** - Detailed documentation

### Modified Files
- **ranking.js** - Added `exportRankingsData()` and `postRankingsToServer()` functions

---

## What Changed in ranking.js

Added two functions that run automatically:

1. **exportRankingsData()**
   - Formats rankings as JSON
   - Called when rankings finish loading

2. **postRankingsToServer()**
   - POSTs rankings to `http://localhost:6789/api/rankings`
   - Silently fails if server isn't running (doesn't break the UI)
   - Fully automatic - you don't need to do anything

---

## Important Notes

✓ Rankings update each time you load the main page  
✓ No database needed - data stored in memory  
✓ API is read-only (safe)  
✓ Works on local network by default  
✓ Easy to enable remote access  

---

## Next Steps

1. ✓ **Load rankings page:** http://127.0.0.1:5500/
2. ✓ **Start API server:** `node get-rider-rank-api.js`
3. ✓ **Test it:** http://localhost:3000/api-test-updated.html
4. **Integrate into your app** - use code examples above

---

## For More Information

- **Full documentation:** See `API_SETUP_GUIDE.md`
- **Multiple examples:** See `USAGE_EXAMPLES.md` (if exists)
- **API test interface:** Open `api-test-updated.html`

---

**Your API is ready! 🚀**

