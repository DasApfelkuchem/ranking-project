# Usage Examples

## Get Started in 2 Minutes

### Step 1: Start the Server
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

### Step 2: Query a Rider

**From your browser:**
```
http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026
```

**From command line:**
```bash
curl "http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026"
```

**Response:**
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

## JavaScript Examples

### Browser

```html
<!DOCTYPE html>
<html>
<head>
  <script src="rider-api-client.js"></script>
</head>
<body>
  <input id="riderName" placeholder="Rider name" value="Jelle Dillen">
  <button id="searchBtn">Search</button>
  <div id="result"></div>

  <script>
    const client = new RiderApiClient('http://localhost:3000/api');

    document.getElementById('searchBtn').onclick = async () => {
      const name = document.getElementById('riderName').value;
      try {
        const rider = await client.getRider(name, 'flatland', 'male', 2026);
        if (rider) {
          document.getElementById('result').textContent = 
            `${rider.name} is ranked #${rider.rank} with ${rider.points} points`;
        } else {
          document.getElementById('result').textContent = 'Rider not found';
        }
      } catch (error) {
        document.getElementById('result').textContent = `Error: ${error.message}`;
      }
    };
  </script>
</body>
</html>
```

### Node.js

```javascript
const RiderApiClient = require('./rider-api-client.js');

async function main() {
  const client = new RiderApiClient('http://localhost:3000/api');
  
  try {
    const rider = await client.getRider('Jelle Dillen', 'flatland', 'male', 2026);
    
    if (rider) {
      console.log(`✓ ${rider.name}`);
      console.log(`  Rank: #${rider.rank}`);
      console.log(`  Points: ${rider.points}`);
      console.log(`  Discipline: ${rider.discipline}`);
      console.log(`  Gender: ${rider.gender}`);
      console.log(`  Year: ${rider.year}`);
    } else {
      console.log('✗ Rider not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

---

## Python Examples

### Simple Query

```python
import requests

API = 'http://localhost:3000/api'

def get_rider(name, discipline, gender, year):
    response = requests.get(f'{API}/rider', params={
        'name': name,
        'discipline': discipline,
        'gender': gender,
        'year': year
    })
    
    if response.status_code == 200:
        return response.json()
    elif response.status_code == 404:
        return None
    else:
        raise Exception(f"HTTP {response.status_code}")

# Usage
rider = get_rider('Jelle Dillen', 'flatland', 'male', 2026)
if rider:
    print(f"{rider['name']} - Rank #{rider['rank']} ({rider['points']} points)")
else:
    print("Rider not found")
```

### Batch Query

```python
import requests
import csv

API = 'http://localhost:3000/api'

def get_riders(names, discipline, gender, year):
    results = []
    for name in names:
        response = requests.get(f'{API}/rider', params={
            'name': name,
            'discipline': discipline,
            'gender': gender,
            'year': year
        })
        
        if response.status_code == 200:
            results.append(response.json())
        else:
            results.append({'name': name, 'error': 'Not found'})
    
    return results

# Usage
riders = ['Jelle Dillen', 'Ben Niediek', 'Karel Dyselinck']
results = get_riders(riders, 'flatland', 'male', 2026)

for rider in results:
    if 'error' in rider:
        print(f"{rider['name']}: {rider['error']}")
    else:
        print(f"{rider['name']}: Rank #{rider['rank']} ({rider['points']} points)")

# Export to CSV
with open('rankings.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['name', 'rank', 'points'])
    writer.writeheader()
    for rider in results:
        if 'rank' in rider:
            writer.writerow({
                'name': rider['name'],
                'rank': rider['rank'],
                'points': rider['points']
            })
```

---

## C# / .NET Examples

### Basic Query

```csharp
using System;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

class Program
{
    static HttpClient client = new HttpClient();
    const string API = "http://localhost:3000/api";

    class Rider
    {
        [JsonProperty("rank")]
        public int Rank { get; set; }
        
        [JsonProperty("points")]
        public int Points { get; set; }
        
        [JsonProperty("name")]
        public string Name { get; set; }
    }

    static async Task Main()
    {
        try
        {
            var rider = await GetRider("Jelle Dillen", "flatland", "male", 2026);
            if (rider != null)
            {
                Console.WriteLine($"{rider.Name} - Rank #{rider.Rank} ({rider.Points} points)");
            }
            else
            {
                Console.WriteLine("Rider not found");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }

    static async Task<Rider> GetRider(string name, string discipline, string gender, int year)
    {
        var url = $"{API}/rider?name={Uri.EscapeDataString(name)}&discipline={discipline}&gender={gender}&year={year}";
        var response = await client.GetAsync(url);
        
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            return null;
        
        var json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<Rider>(json);
    }
}
```

---

## PowerShell Examples

### Simple Query

```powershell
$rider = "Jelle Dillen"
$discipline = "flatland"
$gender = "male"
$year = 2026

$uri = "http://localhost:3000/api/rider?name=$([System.Web.HttpUtility]::UrlEncode($rider))&discipline=$discipline&gender=$gender&year=$year"

try {
    $response = Invoke-RestMethod -Uri $uri -Method Get
    Write-Host "$($response.name) - Rank #$($response.rank) ($($response.points) points)"
} catch {
    Write-Host "Error: $_"
}
```

---

## cURL Examples

### Basic Query
```bash
curl "http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026"
```

### Pretty-printed JSON
```bash
curl -s "http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026" | jq .
```

### Save to file
```bash
curl "http://localhost:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026" > rider.json
```

### List all available rankings
```bash
curl "http://localhost:3000/api/rankings" | jq .
```

### Check API health
```bash
curl "http://localhost:3000/health"
```

---

## Remote Access (Different PC)

### Find your PC's IP address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your network adapter.

**Linux/Mac:**
```bash
ifconfig
```
Look for "inet" address.

### Access from another computer on same network

Replace `localhost` with your PC's IP:

```bash
# Example with IP 192.168.1.100
curl "http://192.168.1.100:3000/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026"
```

### Access from internet using ngrok

```bash
# Install ngrok from https://ngrok.com/download
ngrok http 3000

# ngrok will show you a URL like:
# https://abc123.ngrok.io

# Use this URL from anywhere:
curl "https://abc123.ngrok.io/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026"
```

---

## Testing

### Open the test UI in your browser

```bash
# Start the API server
node api-server.js

# Then open in browser
# file:///path/to/api-test.html
# or if hosting locally:
# http://localhost:8000/api-test.html (with a simple HTTP server)
```

### Automated testing with Jest

```javascript
// test.js
const RiderApiClient = require('./rider-api-client.js');

describe('RiderApiClient', () => {
  const client = new RiderApiClient('http://localhost:3000/api');

  test('should find a rider', async () => {
    const rider = await client.getRider('Jelle Dillen', 'flatland', 'male', 2026);
    expect(rider).toBeDefined();
    expect(rider.name).toBe('Jelle Dillen');
    expect(rider.rank).toBeGreaterThan(0);
  });

  test('should return null for unknown rider', async () => {
    const rider = await client.getRider('Unknown Name', 'flatland', 'male', 2026);
    expect(rider).toBeNull();
  });

  test('should check API health', async () => {
    const health = await client.isHealthy();
    expect(health).toBe(true);
  });
});
```

---

## Tips & Tricks

### Cache results to avoid repeated queries
```javascript
const riderCache = new Map();

async function getCachedRider(name, discipline, gender, year) {
  const key = `${name}-${discipline}-${gender}-${year}`;
  
  if (riderCache.has(key)) {
    return riderCache.get(key);
  }
  
  const rider = await client.getRider(name, discipline, gender, year);
  if (rider) {
    riderCache.set(key, rider);
  }
  
  return rider;
}
```

### Create a lookup table
```python
def build_ranking_table(discipline, gender, year):
    response = requests.get(f'{API}/rankings')
    rankings_list = response.json()['rankings']
    
    # Find the file for this discipline/gender/year
    file = f"{discipline}-{gender}-{year}"
    
    # Load and build lookup table
    table = {}
    for ranking in rankings_list:
        if ranking == file:
            # Load this file and build lookup
            # (would need to fetch the JSON file directly)
            break
    
    return table
```

### Monitor API availability
```python
import requests
import time

API = 'http://localhost:3000'

while True:
    try:
        response = requests.get(f'{API}/health', timeout=5)
        if response.status_code == 200:
            print("✓ API is up")
        else:
            print(f"✗ API returned status {response.status_code}")
    except requests.ConnectionError:
        print("✗ API is down")
    
    time.sleep(60)  # Check every minute
```
