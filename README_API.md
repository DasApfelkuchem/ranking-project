# 🏆 Remote Rider Ranking API

**Allow other computers to remotely query unicycling ranking data by rider name, year, gender, and discipline.**

## ✨ What's New

Your `ranking.js` now **automatically exports rankings** to an HTTP API server when you load the rankings page. No manual export needed!

---

## 🚀 Quick Start (3 Steps)

### Step 1️⃣: Load Rankings Page
Opens your browser and triggers the automatic export:
```
http://127.0.0.1:5500/
```

### Step 2️⃣: Start API Server
```bash
node get-rider-rank-api.js
```

### Step 3️⃣: Query Rankings
Test page: `http://localhost:3000/api-test-updated.html`

Or query directly:
```
http://localhost:6789/api/rider?name=Jelle%20Dillen&year=2026&gender=male&discipline=flatland
```

---

## 📋 Documentation

| Document | Purpose |
|----------|---------|
| **QUICK_START.md** | 3-step setup + code examples in 5 languages |
| **API_SETUP_GUIDE.md** | Complete guide with troubleshooting |
| **IMPLEMENTATION_SUMMARY.md** | Technical details of the implementation |
| **This file** | Overview and getting started |

---

## 🎯 How It Works

```
Your Computer:
┌──────────────────────────────────────────────────┐
│                                                   │
│  Browser (Port 5500)      API Server (Port 6789) │
│  ──────────────────       ───────────────────     │
│  index.html               Node.js                 │
│    ↓                      ↑                       │
│  ranking.js               Stores                  │
│  calculates rankings      rankings                │
│    ↓                      ↑                       │
│  Automatically exports    Serves queries          │
│  POST /api/rankings       GET /api/rider          │
│                                                   │
└──────────────────────────────────────────────────┘
                              ↑
                   Remote clients connect here
```

---

## 📡 API Endpoint

### GET `/api/rider`

**Query Parameters:**
- `name` (required): "Jelle Dillen"
- `year` (optional): "2026", "2024", etc. Default: "2026"
- `gender` (optional): "male", "female", "combined". Default: "male"
- `discipline` (optional): "flatland", "street", "trial", "x-style". Default: "flatland"

**Success Response (200):**
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

**Error Response (404):**
```json
{
  "error": "Rider \"Unknown\" not found in flatland male rankings"
}
```

---

## 💻 Code Examples

### JavaScript
```javascript
const response = await fetch(
  'http://localhost:6789/api/rider?name=Jelle%20Dillen&gender=male'
);
const data = await response.json();
console.log(`Rank: #${data.rank}, Points: ${data.points}`);
```

### Python
```python
import requests
r = requests.get('http://localhost:6789/api/rider', params={
    'name': 'Jelle Dillen',
    'gender': 'male'
})
print(r.json())
```

### cURL
```bash
curl "http://localhost:6789/api/rider?name=Jelle%20Dillen&gender=male&discipline=flatland"
```

### C# / .NET
```csharp
var client = new HttpClient();
var url = "http://localhost:6789/api/rider?name=Jelle%20Dillen&gender=male";
var response = await client.GetAsync(url);
var json = await response.Content.ReadAsStringAsync();
```

---

## 📁 Files Created/Modified

### New Files
- **`get-rider-rank-api.js`** - HTTP API server (run this)
- **`api-test-updated.html`** - Web interface for testing
- **`API_SETUP_GUIDE.md`** - Detailed documentation
- **`IMPLEMENTATION_SUMMARY.md`** - Technical summary
- **`QUICK_START.md`** - Updated with new approach

### Modified Files
- **`ranking.js`** - Added automatic export functions

---

## 🔧 Installation Requirements

- **Node.js** - [Download from nodejs.org](https://nodejs.org/)
- **Web Browser** - For the test interface
- **That's it!** - No other dependencies

---

## ⚙️ Configuration

### Change API Server Port
Edit `get-rider-rank-api.js`:
```javascript
const PORT = process.env.PORT || 6789;  // Change 6789 to your port
```

### Enable Remote Access
Edit `get-rider-rank-api.js`:
```javascript
// Change this:
server.listen(PORT, () => {

// To this:
server.listen(PORT, '0.0.0.0', () => {
```

### Change API Server URL in ranking.js
Edit `ranking.js`, function `postRankingsToServer()`:
```javascript
const response = await fetch('http://localhost:6789/api/rankings', {
  // Change 'localhost:6789' to your server
```

---

## 🌐 Remote Access

### Same WiFi/LAN Network
1. Find your computer's IP:
   - Windows: `ipconfig` → IPv4 Address
   - Mac/Linux: `ifconfig` or `ip addr`

2. Enable remote listening (see Configuration)

3. Access from other computer:
   ```
   http://YOUR_IP:6789/api/rider?name=...
   ```

### Internet Access
Use **ngrok** (free):
```bash
# Install from https://ngrok.com/download
ngrok http 6789

# Access via:
# https://abc123.ngrok.io/api/rider?name=...
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Rider not found" | Load rankings page first (Step 1) |
| "Connection refused" | Make sure API server is running (Step 2) |
| "Cannot find module" | Install Node.js from nodejs.org |
| Wrong data returned | Make sure rankings page was loaded recently |
| CORS error | Check API server is running and accessible |
| Empty results | Reload rankings page to export fresh data |

**More help:** See `API_SETUP_GUIDE.md`

---

## ✅ Features

- ✓ **Automatic Export** - No manual steps needed
- ✓ **Easy to Use** - Just 3 steps
- ✓ **Fast Queries** - In-memory storage
- ✓ **No Database** - Lightweight
- ✓ **CORS Enabled** - Works from browser
- ✓ **Case-Insensitive** - Finds riders easily
- ✓ **Error Handling** - Helpful error messages
- ✓ **Multiple Disciplines** - Flatland, Street, Trial, X-Style

---

## 🎓 How the Export Works

When you load the rankings page:

1. **ranking.js loads** (browser)
2. **Rankings calculate** (browser)
3. **exportRankingsData()** formats the data
4. **postRankingsToServer()** sends to API
5. **API stores in memory** and serves queries

```javascript
// In ranking.js, after rankings finish loading:
await postRankingsToServer();
```

---

## 📊 Data Flow

```
1. User loads http://127.0.0.1:5500/
         ↓
2. ranking.js runs in browser
         ↓
3. Loads event result files
         ↓
4. Calculates rankings
         ↓
5. Stores in globalRowsByGender
         ↓
6. exportRankingsData() formats it
         ↓
7. postRankingsToServer() sends POST
         ↓
8. API server receives and stores
         ↓
9. Remote clients can now query via GET
```

---

## 🔐 Security Notes

- **Read-Only API** - Only GET requests for queries
- **No Sensitive Data** - Only contains ranking info
- **CORS Enabled** - Intentionally allows cross-origin access
- **No Authentication** - Add if hosting publicly
- **Local by Default** - Secure until you enable remote access

---

## 🎯 Use Cases

- **Local Network** - Query rankings from other PCs on your WiFi
- **Team Scripts** - Automated ranking checks
- **Dashboard** - Display live rankings on screens
- **Mobile App** - Query rankings from your phone
- **Third-Party Tools** - Integrate with other applications
- **Data Analysis** - Export and analyze ranking data

---

## 📈 What's Next?

1. **Now:** Follow the 3-step Quick Start above
2. **Then:** Use the test page to verify it works
3. **Later:** Integrate into your application using code examples
4. **Optional:** Enable remote access for different network

---

## 📚 More Information

- **Full Setup Guide:** `API_SETUP_GUIDE.md`
- **Quick Reference:** `QUICK_START.md`
- **Technical Details:** `IMPLEMENTATION_SUMMARY.md`
- **Code Examples:** See QUICK_START.md
- **API Test Page:** `api-test-updated.html`

---

## 🤝 Contributing

Found an issue? Have suggestions?

The API server is intentionally simple and focused. Future enhancements might include:
- Persistent storage (SQLite)
- Authentication (API keys)
- Rate limiting
- Multi-discipline support
- Caching/expiration
- Docker deployment

---

## 📝 License

This project is part of the DasApfelkuchem/ranking-project repository.

---

## ✨ Summary

Your ranking data is now accessible remotely through a simple HTTP API. Load the rankings page, start the server, and query from anywhere on your network!

**Get started:** See **QUICK_START.md**

---

**Happy ranking! 🎉**
