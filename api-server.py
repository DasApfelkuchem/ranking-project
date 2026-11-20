#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Remote Rider Ranking API Server
Run: python api-server.py
Access: http://localhost:3000
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
from pathlib import Path

PORT = 3000
PROJECT_DIR = Path(__file__).parent
RANKINGS_DIR = PROJECT_DIR / 'docs' / 'api' / 'rankings'

# Cache rankings in memory
rankings_cache = {}

def normalize_name(name):
    """Normalize a rider name for comparison"""
    if not name:
        return ''
    return name.lower().strip()

def load_ranking(discipline, gender, year):
    """Load a ranking from JSON file"""
    cache_key = f"{discipline}-{gender}-{year}"
    
    if cache_key in rankings_cache:
        return rankings_cache[cache_key]
    
    file_path = RANKINGS_DIR / f"{discipline}-{gender}-{year}.json"
    
    if not file_path.exists():
        rankings_cache[cache_key] = None
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            rankings_cache[cache_key] = data
            return data
    except Exception as e:
        print(f"Error loading {cache_key}: {e}")
        rankings_cache[cache_key] = None
        return None

def find_rider_rank(name, discipline, gender, year):
    """Find a rider's rank in a ranking"""
    rankings = load_ranking(discipline, gender, year)
    if not rankings:
        return None
    
    normalized_query = normalize_name(name)
    
    for i, entry in enumerate(rankings):
        if normalize_name(entry.get('name', '')) == normalized_query:
            return {
                'rank': i + 1,
                'points': entry.get('points', 0),
                'name': entry.get('name'),
                'discipline': discipline,
                'gender': gender,
                'year': year
            }
    
    return None

class RequestHandler(BaseHTTPRequestHandler):
    """HTTP request handler"""
    
    def do_GET(self):
        """Handle GET requests"""
        # Parse URL
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query_params = parse_qs(parsed_url.query)
        
        # Debug output
        import sys
        print(f"DEBUG: Received request path={path}", file=sys.stderr)
        sys.stderr.flush()
        
        # Extract query parameters
        def get_param(key):
            vals = query_params.get(key, [])
            return vals[0] if vals else None
        
        def send_json(status_code, response):
            """Helper to send JSON response with proper headers"""
            self.send_response(status_code)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
        
        def send_file(file_path, content_type='text/html'):
            """Helper to send file response"""
            if not os.path.exists(file_path):
                send_json(404, {'error': 'File not found'})
                return
            
            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', f'{content_type}; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                send_json(500, {'error': str(e)})
        
        # Route handlers
        # Serve main index page
        if path == '/' or path == '/index.html':
            html_file = PROJECT_DIR / 'index.html'
            send_file(str(html_file), 'text/html')
            return
        
        # Serve static files (CSS, JS, images, etc)
        if path.endswith('.css'):
            css_file = PROJECT_DIR / path.lstrip('/')
            send_file(str(css_file), 'text/css')
            return
        
        if path.endswith('.js'):
            js_file = PROJECT_DIR / path.lstrip('/')
            send_file(str(js_file), 'application/javascript')
            return
        
        if path.endswith('.png') or path.endswith('.jpg') or path.endswith('.jpeg'):
            img_file = PROJECT_DIR / path.lstrip('/')
            send_file(str(img_file), 'image/png' if path.endswith('.png') else 'image/jpeg')
            return
        
        if path.endswith('.txt'):
            txt_file = PROJECT_DIR / path.lstrip('/')
            send_file(str(txt_file), 'text/plain')
            return
        
        # Serve HTML test page
        if path == '/api-test.html':
            html_file = PROJECT_DIR / 'api-test.html'
            send_file(str(html_file), 'text/html')
            return
        
        # Serve extraction page
        if path == '/extract-rankings.html':
            html_file = PROJECT_DIR / 'extract-rankings-browser.html'
            send_file(str(html_file), 'text/html')
            return
        
        # Serve localStorage extraction page
        if path == '/extract-from-localStorage.html':
            html_file = PROJECT_DIR / 'extract-from-localStorage.html'
            send_file(str(html_file), 'text/html')
            return
        
        # Serve auto-extraction page
        if path == '/auto-extract-all-disciplines.html':
            html_file = PROJECT_DIR / 'auto-extract-all-disciplines.html'
            send_file(str(html_file), 'text/html')
            return
        
        # Serve data extraction page  
        if path == '/extract-data.html':
            html_file = PROJECT_DIR / 'extract-data.html'
            send_file(str(html_file), 'text/html')
            return
        
        # Serve all-rankings extraction page
        if path == '/extract-all-rankings.html':
            html_file = PROJECT_DIR / 'extract-all-rankings.html'
            send_file(str(html_file), 'text/html')
            return
        
        # Serve JavaScript files
        if path == '/rider-api-client.js':
            js_file = PROJECT_DIR / 'rider-api-client.js'
            send_file(str(js_file), 'application/javascript')
            return
        
        if path == '/health':
            send_json(200, {'status': 'ok'})
            return
        
        if path == '/api/rider':
            name = get_param('name')
            discipline = get_param('discipline')
            gender = get_param('gender')
            year = get_param('year')
            
            if not all([name, discipline, gender, year]):
                send_json(400, {
                    'error': 'Missing parameters',
                    'required': ['name', 'discipline', 'gender', 'year'],
                    'example': '/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026'
                })
                return
            
            try:
                year = int(year)
                result = find_rider_rank(name, discipline, gender, year)
                
                if result:
                    send_json(200, result)
                else:
                    send_json(404, {
                        'error': 'Rider not found',
                        'query': {
                            'name': name,
                            'discipline': discipline,
                            'gender': gender,
                            'year': year
                        }
                    })
            except Exception as e:
                send_json(500, {'error': str(e)})
            return
        
        if path == '/api/rankings':
            try:
                files = [f.stem for f in RANKINGS_DIR.glob('*.json')]
                send_json(200, {'rankings': sorted(files)})
            except Exception as e:
                send_json(500, {'error': str(e)})
            return
        
        # Catch-all for HTML files
        if path.endswith('.html'):
            html_file = PROJECT_DIR / path.lstrip('/')
            # Debug: print path info
            import sys
            print(f"DEBUG: Requested path={path}, full_path={str(html_file)}, exists={os.path.exists(str(html_file))}", file=sys.stderr)
            sys.stderr.flush()
            send_file(str(html_file), 'text/html')
            return
        
        # 404
        send_json(404, {'error': 'Not found'})
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        """Handle POST requests for importing data"""
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        def send_json(status_code, response):
            """Helper to send JSON response with proper headers"""
            self.send_response(status_code)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
        
        # Import rankings endpoint
        if path == '/api/import-rankings':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                payload = json.loads(body.decode('utf-8'))
                
                discipline = payload.get('discipline')
                data = payload.get('data', {})
                
                if not discipline or not data:
                    send_json(400, {'error': 'Missing discipline or data'})
                    return
                
                # Create rankings dir if needed
                RANKINGS_DIR.mkdir(parents=True, exist_ok=True)
                
                # Save each year/gender combination
                saved_count = 0
                for year, year_data in data.items():
                    for gender, rankings in year_data.items():
                        # Convert year to int if needed
                        try:
                            year_int = int(year)
                        except:
                            year_int = year
                        
                        file_path = RANKINGS_DIR / f"{discipline}-{gender}-{year_int}.json"
                        
                        # Save ranking data
                        with open(file_path, 'w', encoding='utf-8') as f:
                            json.dump(rankings, f, ensure_ascii=False, indent=2)
                        
                        saved_count += 1
                        # Clear cache for this entry
                        cache_key = f"{discipline}-{gender}-{year_int}"
                        rankings_cache.pop(cache_key, None)
                
                send_json(200, {
                    'success': True,
                    'discipline': discipline,
                    'filesCreated': saved_count,
                    'years': list(data.keys())
                })
                return
                
            except Exception as e:
                send_json(500, {'error': str(e)})
                return
        
        # Default 404
        send_json(404, {'error': 'Not found'})

    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

# Start server
if __name__ == '__main__':
    server_address = ('localhost', PORT)
    httpd = HTTPServer(server_address, RequestHandler)
    
    print("\n" + "="*70)
    print("Rider Ranking API Server")
    print("="*70)
    print(f"\nServer running on http://localhost:{PORT}")
    print(f"\nEndpoints:")
    print(f"  GET http://localhost:{PORT}/api/rider?name=Jelle%20Dillen&discipline=flatland&gender=male&year=2026")
    print(f"  GET http://localhost:{PORT}/api/rankings")
    print(f"  GET http://localhost:{PORT}/health")
    print(f"\nPress Ctrl+C to stop\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
        httpd.server_close()
