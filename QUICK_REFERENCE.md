# 📋 Remote Rider Ranking API - Quick Reference Card

## Setup (Copy & Paste)

```bash
# Terminal 1: Load rankings (browser)
http://127.0.0.1:5500/

# Terminal 2: Start API server
node get-rider-rank-api.js

# Browser 3: Test the API
http://localhost:6789/api/rider?name=Jelle%20Dillen&year=2026&gender=male&discipline=flatland
```

---

## API Endpoints

### Query Rider
```
GET /api/rider?name=NAME&year=YEAR&gender=GENDER&discipline=DISCIPLINE
```

**Example:**
```
http://localhost:6789/api/rider?name=Jelle%20Dillen&year=2026&gender=male&discipline=flatland
```

**Parameters:**
| Parameter | Required | Values | Default |
|-----------|----------|--------|---------|
| name | Yes | "Jelle Dillen" | - |
| year | No | "2026", "2024", "2022" | "2026" |
| gender | No | "male", "female", "combined" | "male" |
| discipline | No | "flatland", "street", "trial", "x-style" | "flatland" |

**Response:**
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

---

## Common Queries

```
# Default (male, flatland, 2026)
http://localhost:6789/api/rider?name=Jelle%20Dillen

# Female rider
http://localhost:6789/api/rider?name=Sarah&gender=female

# Different year
http://localhost:6789/api/rider?name=Jelle%20Dillen&year=2024

# Combined category
http://localhost:6789/api/rider?name=Jelle%20Dillen&gender=combined

# Street discipline
http://localhost:6789/api/rider?name=Jelle%20Dillen&discipline=street

# Full query
http://localhost:6789/api/rider?name=Jelle%20Dillen&year=2026&gender=male&discipline=flatland
```

---

## Code Snippets

### JavaScript
```javascript
async function getRider(name) {
  const url = new URL('http://localhost:6789/api/rider');
  url.searchParams.set('name', name);
  url.searchParams.set('gender', 'male');
  url.searchParams.set('discipline', 'flatland');
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    console.error(data.error);
  } else {
    console.log(`${data.name}: Rank #${data.rank}, ${data.points} points`);
  }
}

getRider('Jelle Dillen');
```

### Python
```python
import requests
import json

def get_rider(name, gender='male', discipline='flatland', year='2026'):
    url = 'http://localhost:6789/api/rider'
    params = {
        'name': name,
        'gender': gender,
        'discipline': discipline,
        'year': year
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if 'error' in data:
        print(f"Error: {data['error']}")
    else:
        print(f"{data['name']}: Rank #{data['rank']}, {data['points']} points")
    
    return data

# Usage
get_rider('Jelle Dillen')
```

### cURL
```bash
# Simple query
curl "http://localhost:6789/api/rider?name=Jelle%20Dillen"

# With all parameters
curl "http://localhost:6789/api/rider?name=Jelle%20Dillen&year=2026&gender=male&discipline=flatland"

# Pretty print JSON
curl -s "http://localhost:6789/api/rider?name=Jelle%20Dillen" | jq

# Save to file
curl -s "http://localhost:6789/api/rider?name=Jelle%20Dillen" > rider.json
```

### PowerShell
```powershell
# Query
$response = Invoke-WebRequest "http://localhost:6789/api/rider?name=Jelle%20Dillen"
$data = $response.Content | ConvertFrom-Json
Write-Host "Rank: $($data.rank), Points: $($data.points)"
```

### C# / .NET
```csharp
using System;
using System.Net.Http;
using System.Text.Json;

class Program {
    static async Task Main() {
        var client = new HttpClient();
        var url = "http://localhost:6789/api/rider?name=Jelle%20Dillen&gender=male";
        
        var response = await client.GetAsync(url);
        var json = await response.Content.ReadAsStringAsync();
        
        using (JsonDocument doc = JsonDocument.Parse(json)) {
            var root = doc.RootElement;
            Console.WriteLine($"Rank: {root.GetProperty("rank")}");
            Console.WriteLine($"Points: {root.GetProperty("points")}");
        }
    }
}
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Connection refused" | Start API server: `node get-rider-rank-api.js` |
| "Rider not found" | Load rankings page first: http://127.0.0.1:5500/ |
| "Cannot find module" | Install Node.js from nodejs.org |
| Wrong data returned | Reload rankings page and try again |
| CORS error | Ensure API server is running and accessible |

---

## Configuration

### Change API Port
Edit `get-rider-rank-api.js`:
```javascript
const PORT = process.env.PORT || 6789;  // Change 6789
```

### Enable Remote Access
Edit `get-rider-rank-api.js`:
```javascript
server.listen(PORT, '0.0.0.0', () => {  // Change from 'localhost'
```

### Change Export URL
Edit `ranking.js` in `postRankingsToServer()`:
```javascript
const response = await fetch('http://localhost:6789/api/rankings', {  // Change URL
```

---

## Files at a Glance

| File | Purpose | Size |
|------|---------|------|
| `get-rider-rank-api.js` | API Server | 8.2 KB |
| `api-test-updated.html` | Test Interface | 10.4 KB |
| `ranking.js` | Modified (auto-export) | 260 KB |
| `QUICK_START.md` | Setup Guide | 8.5 KB |
| `API_SETUP_GUIDE.md` | Reference | 5.4 KB |
| `README_API.md` | Overview | 9.2 KB |

---

## Ports Used

| Port | Service | URL |
|------|---------|-----|
| 5500 | Rankings (Live Server) | http://127.0.0.1:5500/ |
| 6789 | API Server | http://localhost:6789/ |
| 3000 | Test Interface (optional) | http://localhost:3000/ |

---

## Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Rider found | `{"rank": 2, ...}` |
| 404 | Rider not found | `{"error": "not found"}` |
| 400 | Invalid parameters | `{"error": "missing name"}` |
| 500 | Server error | Check server console |

---

## Health Check

```bash
curl http://localhost:6789/health
```

Response:
```json
{
  "status": "ok",
  "endpoints": [...]
}
```

---

## Common Mistakes to Avoid

❌ Starting API server before loading rankings page  
❌ Querying with wrong discipline/gender  
❌ Using hard-coded port 3000 (should be 6789)  
❌ Forgetting to URL-encode spaces in names  
❌ Case-sensitive discipline names (should be lowercase)  
❌ Not waiting for rankings page to fully load  

---

## Pro Tips

✓ URLs encode spaces as %20: "Jelle Dillen" → "Jelle%20Dillen"  
✓ Names are case-insensitive in queries  
✓ All parameters are optional except 'name'  
✓ Use health endpoint to verify server is running  
✓ Save API responses to file for analysis  
✓ Use jq to format JSON output: `| jq`  

---

## Need More Help?

- **Quick Setup:** See QUICK_START.md
- **Full Guide:** See API_SETUP_GUIDE.md
- **API Details:** See README_API.md
- **Tech Details:** See IMPLEMENTATION_SUMMARY.md
- **Checklist:** See SETUP_CHECKLIST.md

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Production Ready ✓
