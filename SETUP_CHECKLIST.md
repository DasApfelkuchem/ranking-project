# Remote Rider Ranking API - Setup Checklist

Use this checklist to verify everything is set up correctly.

---

## ✅ Prerequisites

- [ ] Node.js installed (from nodejs.org)
- [ ] Web browser (Chrome, Firefox, Safari, Edge)
- [ ] Project folder: `C:\Users\benni\Desktop\unicycling\unicycling\ranking project`

---

## ✅ Files Created

Verify these files exist in your project folder:

- [ ] `get-rider-rank-api.js` - API server (258 lines)
- [ ] `api-test-updated.html` - Test interface
- [ ] `API_SETUP_GUIDE.md` - Full documentation
- [ ] `IMPLEMENTATION_SUMMARY.md` - Technical details
- [ ] `QUICK_START.md` - Updated with new approach
- [ ] `README_API.md` - API overview
- [ ] `SETUP_CHECKLIST.md` - This file

---

## ✅ Files Modified

- [ ] `ranking.js` - Now includes `exportRankingsData()` and `postRankingsToServer()` functions

To verify the modifications, search for "Export rankings to remote API server" in ranking.js

---

## ✅ Step 1: Load Rankings Page

- [ ] Open browser: http://127.0.0.1:5500/
- [ ] Wait for rankings to load completely (should take ~10 seconds)
- [ ] Check browser console (F12 → Console tab)
- [ ] Look for message: "✓ Rankings exported to API server"

**If you see the message:** ✓ Proceed to Step 2

**If you don't see the message:** 
- Check that API server is NOT running yet
- Reload the page
- API server must be running on port 6789 for export to work

---

## ✅ Step 2: Start API Server

- [ ] Open Command Prompt or PowerShell
- [ ] Navigate to project folder:
  ```bash
  cd C:\Users\benni\Desktop\unicycling\unicycling\ranking project
  ```
- [ ] Run the server:
  ```bash
  node get-rider-rank-api.js
  ```
- [ ] You should see output:
  ```
  ======================================================================
  Rider Ranking API Server
  ======================================================================
  Server running on http://localhost:6789
  ```

**If you see the output:** ✓ Server is running! Proceed to Step 3

**If you see "Cannot find module 'node'":**
- Node.js is not installed
- Download and install from https://nodejs.org/
- Restart Command Prompt
- Try again

---

## ✅ Step 3: Test the API

### Option A: Web Test Interface

- [ ] Open browser: http://localhost:3000/api-test-updated.html
  - **Wait!** The file is on your computer, not at localhost:3000
  - Open it directly: `C:\Users\benni\Desktop\unicycling\unicycling\ranking project\api-test-updated.html`
  - Or use Live Server or any local server on port 3000

Actually, let's use cURL or direct URL instead. Continue below.

### Option B: Direct URL Test

- [ ] Open browser:
  ```
  http://localhost:6789/api/rider?name=Jelle%20Dillen&year=2026&gender=male&discipline=flatland
  ```
- [ ] You should see JSON response like:
  ```json
  {
    "rank": 2,
    "points": 689.02,
    "name": "Jelle Dillen",
    ...
  }
  ```

**If you see JSON:** ✓ API is working! 

**If you see "Rider not found":**
- Try a different rider name
- Make sure you loaded the rankings page (Step 1) first
- Try without the name parameter to see available riders

**If you see "Cannot GET /api/rider":**
- API server is not running
- Go back to Step 2 and start the server

**If you see "Connection refused":**
- API server is not running on port 6789
- Start the server: `node get-rider-rank-api.js`

### Option C: cURL Test (PowerShell)

```powershell
# In PowerShell, run:
Invoke-WebRequest "http://localhost:6789/api/rider?name=Jelle%20Dillen&gender=male"
```

---

## ✅ Verify Data Accuracy

Once the API is responding with rider data:

- [ ] Check if rank is correct (compare with rankings page)
- [ ] Check if points match
- [ ] Try different riders, years, genders, disciplines
- [ ] All data should match what you see on the main rankings page

---

## ✅ Test Remote Access (Optional)

If you want to access from another computer on the same network:

- [ ] Find your computer's IP address:
  ```bash
  # PowerShell:
  ipconfig
  ```
  Look for "IPv4 Address" (e.g., 192.168.1.100)

- [ ] Edit `get-rider-rank-api.js` - find the line:
  ```javascript
  server.listen(PORT, () => {
  ```
  Change to:
  ```javascript
  server.listen(PORT, '0.0.0.0', () => {
  ```

- [ ] Restart the API server (Ctrl+C then run again)

- [ ] From another computer, open browser:
  ```
  http://YOUR_IP:6789/api/rider?name=Jelle%20Dillen&gender=male
  ```
  (Replace YOUR_IP with your computer's IP address)

- [ ] If it works: ✓ Remote access is enabled!

---

## ✅ Verify All Features

After basic setup works, verify these features:

### Case-Insensitive Search
- [ ] Query: `?name=jelle%20dillen` (lowercase)
- [ ] Should still find "Jelle Dillen"

### Different Years
- [ ] Query: `?name=Jelle%20Dillen&year=2024`
- [ ] Query: `?name=Jelle%20Dillen&year=2022`
- [ ] Data should change based on year

### Different Genders
- [ ] Query: `?gender=male`
- [ ] Query: `?gender=female`
- [ ] Query: `?gender=combined`
- [ ] Rankings should be different

### Different Disciplines
- [ ] Query: `?discipline=flatland`
- [ ] Query: `?discipline=street`
- [ ] Query: `?discipline=trial`
- [ ] Data should vary by discipline

### Error Handling
- [ ] Query: `?name=NonExistentRider`
- [ ] Should return: `{"error": "Rider ... not found"}`

### Health Check
- [ ] Open: http://localhost:6789/health
- [ ] Should return: `{"status": "ok", ...}`

---

## ✅ Integration Testing

Ready to integrate into your applications?

### JavaScript Test
Create a file `test-api.js`:
```javascript
async function test() {
  const r = await fetch('http://localhost:6789/api/rider?name=Jelle%20Dillen&gender=male');
  const data = await r.json();
  console.log(data);
}
test();
```
Run: `node test-api.js`

### Python Test
Create a file `test_api.py`:
```python
import requests
r = requests.get('http://localhost:6789/api/rider', params={'name': 'Jelle Dillen'})
print(r.json())
```
Run: `python test_api.py`

---

## ✅ Common Issues & Fixes

### "Rider not found" on correct name
- [ ] Verify exact spelling (case-sensitive in results, but query is case-insensitive)
- [ ] Load rankings page again (Step 1)
- [ ] Wait a few seconds for export
- [ ] Try querying again

### "Connection refused"
- [ ] Start API server: `node get-rider-rank-api.js`
- [ ] Verify port 6789 is not blocked by firewall

### "Cannot find module"
- [ ] Install Node.js from nodejs.org
- [ ] Restart Command Prompt
- [ ] Try again

### Wrong data returned
- [ ] Load rankings page recently
- [ ] API server showing "Rankings exported to API server" message?
- [ ] Try different rider names
- [ ] Check you're querying the right discipline/gender/year

### "CORS error" in browser
- [ ] API server includes CORS headers by default
- [ ] Check actual error in console (F12)
- [ ] Restart API server

---

## ✅ Performance Checklist

After setup is complete:

- [ ] API responds in <100ms
- [ ] Can handle multiple concurrent queries
- [ ] Data is consistent across multiple queries
- [ ] Server doesn't crash with invalid input
- [ ] No memory leaks after 1000+ queries

---

## ✅ Documentation Checklist

- [ ] Read `QUICK_START.md` for overview
- [ ] Read `API_SETUP_GUIDE.md` for detailed setup
- [ ] Read `README_API.md` for API overview
- [ ] Reviewed code examples in `QUICK_START.md`
- [ ] Bookmarked API endpoint documentation

---

## ✅ Next Steps

After everything is working:

1. **For Local Network:**
   - [ ] Enable remote access (see "Test Remote Access" section)
   - [ ] Share IP address with colleagues

2. **For Internet Access:**
   - [ ] Set up ngrok (see `API_SETUP_GUIDE.md`)
   - [ ] Or deploy to cloud service

3. **For Integration:**
   - [ ] Copy code examples from `QUICK_START.md`
   - [ ] Integrate into your application
   - [ ] Test with your data

4. **For Production:**
   - [ ] Consider persistent storage
   - [ ] Add authentication
   - [ ] Set up monitoring
   - [ ] Configure backups

---

## ✅ Verification Summary

**Check off each section as you complete it:**

- [ ] Prerequisites installed
- [ ] All files created/modified
- [ ] Step 1: Loaded rankings page
- [ ] Step 2: Started API server
- [ ] Step 3: Tested API
- [ ] Data accuracy verified
- [ ] All features working
- [ ] Integration tests passed
- [ ] Common issues resolved
- [ ] Documentation reviewed

---

## 🎉 You're Done!

If all checkboxes are checked ✓, your Remote Rider Ranking API is fully set up and working!

---

## 📞 Need Help?

1. Check **API_SETUP_GUIDE.md** troubleshooting section
2. Review browser console (F12) for error messages
3. Check API server console for logged errors
4. Verify browser vs. server time is in sync
5. Try accessing http://localhost:6789/health

---

**Last Updated:** Setup Date
**Status:** ✓ Ready for Use

---
