// Simple local server to save riders_all.txt from the web UI.
// Run: node save-riders-server.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 6789;
const FILE = path.join(__dirname, 'riders_all.txt');

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/save-riders_all') {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        fs.writeFileSync(FILE, body, 'utf8');
        console.log(`Wrote ${FILE} (${body.length} bytes)`);
        res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
        res.end('ok');
      } catch (err) {
        console.error('Error writing file', err);
        res.writeHead(500, { 'Access-Control-Allow-Origin': '*' });
        res.end(String(err));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`save-riders-server listening on http://localhost:${PORT}`);
});
