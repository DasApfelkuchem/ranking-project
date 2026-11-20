# 🚴 Rider Ranking Remote Query System

A lightweight system for remotely querying unicycling rider rankings from a different PC. No database required—just static JSON files and HTTP.

> **Current behavior:** `api-server.js` recalculates the rankings at startup.
> Older API guides and sample scores in this repository may describe earlier
> implementations or mock data; use the instructions below for port 3000.

## 🚀 Get Started in 60 Seconds

### Step 1: Install dependencies
Use Node.js 22.12 or newer. From PowerShell in the project folder:
```powershell
npm.cmd install
```
The export uses installed Google Chrome if available; otherwise Puppeteer uses
its downloaded browser. If neither is available, install Google Chrome or run
`npx.cmd puppeteer browsers install chrome`.

### Step 2: Start the API server
```powershell
node api-server.js
```
Wait until it says `Ranking API server running`: it first loads the website in a
headless browser and writes the rankings into `docs/api/rankings/`. If generation
fails, the server does not start.

The export uses the website's **default calculation settings**, not settings
saved in your personal browser. Each discipline, gender, and year is generated
from the website's corresponding year snapshot. For a year without an event,
the website's most recent earlier snapshot is used. Restart the API after changing
results or calculations. Old sample files that are not generated on startup are
not served by this API.

### Step 3: Query from another PC
```bash
# Replace 'localhost' with your PC's IP if on different computer
curl "http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026"
```

**Example response shape (points and rank will vary):**
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

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[QUICK_START.md](QUICK_START.md)** | Older port 6789 setup |
| **[API_SETUP.md](API_SETUP.md)** | Older setup and configuration guide |
| **[USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)** | Code samples in JavaScript, Python, C#, cURL |

---

## 🎯 Choose Your Integration Method

### Method 1: HTTP API Server (Recommended)
Best for: Cross-PC queries, multiple clients, any programming language

```javascript
// JavaScript
const response = await fetch('http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026');
const rider = await response.json();
```

```python
# Python
import requests
rider = requests.get('http://localhost:3000/api/rider', params={
    'name': 'Jelle Dillen', 'discipline': 'flatland', 'gender': 'male', 'year': 2026
}).json()
```

```bash
# cURL
curl "http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026"
```

**Files:**
- `api-server.js` - Start this
- `api-test.html` - Test in browser
- `rider-api-client.js` - Use this client library

---

### Method 2: Direct Node.js Function (No Server)
Best for: Node.js scripts, automation, local queries

```javascript
const { getRiderRank } = require('./get-rider-rank.js');
const rider = getRiderRank('Jelle Dillen', 'flatland', 'male', 2026);
// { rank: 4, points: 1250, name: 'Jelle Dillen', ... }
```

**Files:**
- `get-rider-rank.js` - Direct function

---

### Method 3: Client Library (Universal)
Best for: Browser + Node.js, single codebase

```javascript
const client = new RiderApiClient('http://localhost:3000/api');
const rider = await client.getRider('Jelle Dillen', 'flatland', 'male', 2026);
```

**Files:**
- `rider-api-client.js` - Use in browser or Node.js

---

## 📡 API Reference

### Get Rider Rank
```
GET /api/rider?name={name}&discipline={discipline}&gender={gender}&year={year}
```

| Parameter | Values | Example |
|-----------|--------|---------|
| `name` | Rider name | `Jelle Dillen` |
| `discipline` | `flatland`, `street`, `trial`, `x-style` (`freestyle` is an alias for `x-style`) | `flatland` |
| `gender` | `male`, `female`, `combined` | `male` |
| `year` | Year number | `2026` |

**Response (200 OK):**
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

**Response (404 Not Found):**
```json
{
  "error": "Rider not found",
  "query": { "name": "Unknown", "discipline": "flatland", "gender": "male", "year": 2026 }
}
```

---

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

---

### Health Check
```
GET /health
```

**Response:**
```json
{ "status": "ok" }
```

---

## 🌐 Remote Access

### Same Network (LAN)
```bash
# Find your PC's IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Use from other PC
http://192.168.1.100:3000/api/rider?name=...
```

The API has no authentication. Only expose it on a trusted network.

### GitHub Pages (Free, Public)
1. Push to GitHub
2. Create ranking JSON files in `docs/api/rankings/`
3. Enable GitHub Pages
4. Access: `https://your-github.github.io/ranking-project/`

---

## 📋 JSON File Format

Ranking files stored in `docs/api/rankings/{discipline}-{gender}-{year}.json`:

```json
[
  { "rank": 1, "name": "Jelle Dillen", "points": 5000 },
  { "rank": 2, "name": "Ben Niediek", "points": 4500 },
  { "rank": 3, "name": "Karel Dyselinck", "points": 4200 },
  ...
]
```

The rank is implicit (array index + 1).

---

## 📦 Project Structure

```
├── api-server.js              # 🚀 Main HTTP API server
├── get-rider-rank.js          # Direct function (no server)
├── rider-api-client.js        # Universal client library
├── api-test.html              # 🧪 Web UI to test API
├── generate-rankings-json.js  # Auto-generate JSON from browser
├── package.json               # NPM configuration
├── QUICK_START.md             # ⚡ Fast setup guide
├── API_SETUP.md               # 📖 Full documentation
├── USAGE_EXAMPLES.md          # 💡 Code samples
└── docs/api/rankings/         # 📊 Ranking JSON files
    ├── flatland-male-2026.json
    ├── flatland-female-2026.json
    ├── flatland-combined-2026.json
    └── ... (other disciplines/years)
```

---

## ⚙️ Installation

### Node.js (Required)
```bash
# Download from https://nodejs.org/
# Or use a package manager:
brew install node       # Mac
choco install nodejs    # Windows
apt install nodejs      # Linux
```

### Dependencies
```powershell
npm.cmd install
```

---

## ▶️ Running

### Start the API
```bash
node api-server.js
```

Output:
```
Ranking API server running on http://localhost:3000

Examples:
  GET http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026
  GET http://localhost:3000/api/rankings
  GET http://localhost:3000/health
```

### Generate Rankings Without Starting the API
```powershell
node generate-rankings-json.js
```

### Test in Browser
```bash
# Start a simple HTTP server in the project directory
python -m http.server 8000

# Then open in browser:
http://localhost:8000/api-test.html
```

---

## 🔍 Examples

### JavaScript (Browser)
```html
<script src="rider-api-client.js"></script>
<script>
  const client = new RiderApiClient('http://localhost:3000/api');
  client.getRider('Jelle Dillen', 'flatland', 'male', 2026)
    .then(rider => console.log(`Rank #${rider.rank}`));
</script>
```

### JavaScript (Node.js)
```javascript
const { getRiderRank } = require('./get-rider-rank.js');
const rider = getRiderRank('Jelle Dillen', 'flatland', 'male', 2026);
console.log(`Rank #${rider.rank}`);
```

### Python
```python
import requests
response = requests.get('http://localhost:3000/api/rider', params={
    'name': 'Jelle Dillen',
    'discipline': 'flatland',
    'gender': 'male',
    'year': 2026
})
rider = response.json()
print(f"Rank #{rider['rank']}")
```

### C# / .NET
```csharp
using System.Net.Http;
var client = new HttpClient();
var response = await client.GetAsync("http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026");
var json = await response.Content.ReadAsStringAsync();
Console.WriteLine(json);
```

### cURL
```bash
curl "http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026"
```

---

## ✅ Verification Checklist

- [ ] JSON files exist in `docs/api/rankings/`
- [ ] API server starts with `node api-server.js`
- [ ] Browser can access `http://localhost:3000/health`
- [ ] `api-test.html` returns rider data
- [ ] Remote PC can ping your IP
- [ ] Remote PC can query the API

---

## 🆘 Troubleshooting

**"Cannot find module"**
```powershell
npm.cmd install
```

**"Connection refused"**
- Ensure `node api-server.js` is running
- Check IP address and port number
- Verify firewall isn't blocking port 3000

**"Rider not found"**
- Verify rider name spelling (case-insensitive)
- Confirm discipline/gender/year parameters
- Check `/api/rankings` for generated combinations. Old sample files are not used.

**"CORS error" in browser**
- API server already has CORS enabled
- Clear browser cache and try again

---

## 📝 License

Same as main ranking project.

---

## 📞 Support

For detailed setup and examples, see:
- **[QUICK_START.md](QUICK_START.md)** - Fast setup
- **[API_SETUP.md](API_SETUP.md)** - Full documentation
- **[USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)** - Code samples

---

**Happy querying! 🚴**
