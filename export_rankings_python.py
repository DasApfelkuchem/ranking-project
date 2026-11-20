#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract pre-calculated rankings from ranking.js using browser automation.
Loads ranking.js, waits for rankings to calculate, extracts globalRowsByGender, 
and saves to JSON files for the API.

Requires: Selenium + ChromeDriver or use browser directly
"""

import json
import time
import sys
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

PROJECT_DIR = Path(__file__).parent
OUTPUT_DIR = PROJECT_DIR / 'docs' / 'api' / 'rankings'

def create_extraction_server():
    """
    Create a simple HTTP server that serves index.html and extracts rankings.
    When a browser visits /extract-data, it loads ranking.js and returns the data.
    """
    
    extraction_html = '''<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Extract Rankings</title>
</head>
<body>
  <h1>Extracting rankings...</h1>
  <pre id="output">Loading ranking.js...</pre>
  
  <script src="ranking.js"></script>
  <script>
    async function checkAndExtract() {
      // Poll for globalRowsByGender to be populated by ranking.js
      for (let i = 0; i < 120; i++) {
        if (window.globalRowsByGender && Object.keys(window.globalRowsByGender).length > 0) {
          // Send data to server via fetch
          try {
            const response = await fetch('/save-rankings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(window.globalRowsByGender)
            });
            document.getElementById('output').textContent = await response.text();
            return;
          } catch (e) {
            document.getElementById('output').textContent = 'Error sending data: ' + e.message;
            return;
          }
        }
        await new Promise(r => setTimeout(r, 500));
      }
      document.getElementById('output').textContent = 'Timeout: Rankings did not calculate';
    }
    checkAndExtract();
  </script>
</body>
</html>'''
    
    extracted_data = {}
    
    class ExtractionHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/':
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(extraction_html.encode())
            else:
                self.send_response(404)
                self.end_headers()
        
        def do_POST(self):
            if self.path == '/save-rankings':
                content_length = int(self.headers.get('Content-Length', 0))
                data = self.rfile.read(content_length)
                
                nonlocal extracted_data
                extracted_data = json.loads(data.decode())
                
                # Save to files
                save_rankings(extracted_data)
                
                response = "✓ Rankings extracted and saved!\n"
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain; charset=utf-8')
                self.send_header('Content-Length', len(response))
                self.end_headers()
                self.wfile.write(response.encode())
            else:
                self.send_response(404)
                self.end_headers()
        
        def log_message(self, format, *args):
            pass  # Suppress logging
    
    return ExtractionHandler

def save_rankings(rankings_data):
    """Save extracted rankings to JSON files"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    total_riders = 0
    
    for gender, riders in (rankings_data or {}).items():
        if not riders or not isinstance(riders, list):
            print(f"  Skipping {gender}: no data")
            continue
        
        # Convert to format for API: [{ rank, name, points }, ...]
        ranking = [
            {
                'rank': idx + 1,
                'name': r.get('rider', ''),
                'points': int(r.get('points', 0))
            }
            for idx, r in enumerate(riders)
            if r.get('rider')
        ]
        
        filename = f'rankings-{gender}.json'
        filepath = OUTPUT_DIR / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(ranking, f, ensure_ascii=False, indent=2)
        
        print(f"  ✓ {filename} ({len(ranking)} riders)")
        total_riders += len(ranking)
    
    return total_riders

def main():
    print("="*70)
    print("Extract Rankings from ranking.js (Python Version)")
    print("="*70)
    print()
    print("This will start a local server and extract rankings from ranking.js")
    print("Please open in your browser: http://localhost:8888")
    print()
    
    try:
        # Create handler
        handler_class = create_extraction_server()
        
        # Start server
        server = HTTPServer(('localhost', 8888), handler_class)
        
        print("Server running on http://localhost:8888")
        print("Press Ctrl+C to stop")
        print()
        
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\n\nStopped.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
