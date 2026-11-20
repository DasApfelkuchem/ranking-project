# 🚴 START HERE - Remote Rider Ranking API

## What You Just Got

A complete system to query your rider rankings from any other computer. **No database needed.** Just static JSON files and a simple HTTP server.

---

## ⚡ 3-Step Quick Start (5 minutes)

### Step 1: Create ranking JSON files
Pick ONE method:

**A) Automatic (Recommended)** ✅
```bash
npm install puppeteer
node generate-rankings-json.js
```

**B) Manual from browser**
1. Open `index.html` in browser
2. Press F12 (DevTools)
3. Go to Console tab
4. Paste and run:
   ```javascript
   JSON.stringify(globalRowsByGender.male, null, 2)
   ```
5. Copy the output
6. Create folder: `docs/api/rankings`
7. Create file: `docs/api/rankings/flatland-male-2026.json`
8. Paste the output there
9. Repeat for female and combined

### Step 2: Start the API server
```bash
node api-server.js
```

You'll see:
```
Ranking API server running on http://localhost:3000
```

### Step 3: Test it!
Open in browser:
```
http://localhost:3000/api-test.html
```

Or query from command line:
```bash
curl "http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026"
```

**That's it!** ✅

---

## 🎯 Use It In Your Code

### JavaScript
```javascript
const client = new RiderApiClient('http://localhost:3000/api');
const rider = await client.getRider('Jelle Dillen', 'flatland', 'male', 2026);
console.log(`${rider.name} is ranked #${rider.rank}`);
```

### Python
```python
import requests
rider = requests.get('http://localhost:3000/api/rider', params={
    'name': 'Jelle Dillen', 'discipline': 'flatland', 'gender': 'male', 'year': 2026
}).json()
print(f"{rider['name']} - Rank #{rider['rank']}")
```

### C#
```csharp
var response = await client.GetAsync("http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026");
var json = await response.Content.ReadAsStringAsync();
var rider = JsonConvert.DeserializeObject<dynamic>(json);
```

---

## 📡 Remote Access

### Same WiFi Network
```bash
# Find your PC's IP:
ipconfig    # Windows
ifconfig    # Mac/Linux

# Use from other computer:
http://192.168.1.100:3000/api/rider?name=...
```

### Internet
```bash
# Use ngrok (free): https://ngrok.com/download
ngrok http 3000

# Then use the generated URL:
# https://abc123.ngrok.io/api/rider?name=...
```

---

## 📖 Documentation

| File | Time | Purpose |
|------|------|---------|
| **[QUICK_START.md](QUICK_START.md)** | 2 min | Fast setup overview |
| **[API_README.md](API_README.md)** | 5 min | Complete introduction |
| **[API_SETUP.md](API_SETUP.md)** | 10 min | Full configuration guide |
| **[USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)** | 15 min | Code samples in every language |

---

## 🛠️ Files Created

```
✓ api-server.js              - Start this to run API
✓ rider-api-client.js        - Use this in your code
✓ get-rider-rank.js          - Direct Node.js function
✓ api-test.html              - Test in browser
✓ generate-rankings-json.js  - Create JSON files
✓ test-api.js                - Run: node test-api.js
✓ package.json               - NPM scripts
```

---

## ❓ Common Questions

**Q: I need to query from a different computer on my WiFi?**
> Replace `localhost` with your PC's IP (get it with `ipconfig`)

**Q: I need to access from the internet?**
> Use ngrok: `ngrok http 3000` (free, no installation needed)

**Q: Can I query without starting a server?**
> Yes! Use directly: `const { getRiderRank } = require('./get-rider-rank.js')`

**Q: What if the API server crashes?**
> Just restart it: `node api-server.js`

**Q: Can I add authentication?**
> Yes! Edit `api-server.js` and add an API key check (see API_SETUP.md)

**Q: Does it work with other programming languages?**
> Yes! It's just HTTP - works with any language (Python, C#, Go, PHP, etc.)

---

## 🧪 Test Everything

```bash
# Run the test suite
node test-api.js
```

This checks:
- ✓ JSON files are created
- ✓ Direct function works
- ✓ API server is running
- ✓ Client library is available

---

## 🚀 Next Steps

1. **Create JSON files** (choose A or B from Step 1 above)
2. **Start API server**: `node api-server.js`
3. **Test in browser**: Open `api-test.html`
4. **Integrate into your project**: See USAGE_EXAMPLES.md
5. **Go remote**: Replace localhost with your IP address

---

## 🎓 Learn More

- **Quick setup?** → Read `QUICK_START.md`
- **Need details?** → Read `API_SETUP.md`
- **Want code examples?** → Read `USAGE_EXAMPLES.md`
- **Want overview?** → Read `API_README.md`

---

## 💡 Tips

- The API is **read-only** (safe)
- Rankings are **static** (no live database)
- JSON files update when you manually export
- Server is **lightweight** (Node.js only)
- Runs on any PC with Node.js installed

---

## ✅ You're Ready!

Your rider ranking API is set up and ready to use.

**Start here:**
```bash
npm install puppeteer
node generate-rankings-json.js
node api-server.js
```

Then open: `http://localhost:3000/api-test.html`

---

**Questions?** See any of the documentation files above. 🚴
