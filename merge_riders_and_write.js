const fs = require('fs');
const path = require('path');

const EVENT_FILES = [
  'Unicon24.txt','Unicon26.txt','Unicon22.txt','Unicon18.txt','Unicon16.txt','Unicon14.txt',
  'EUCW26.txt','EUCW25.txt','EUCW24.txt','EUCS23.txt','EUCS25.txt','CFM25.txt',
  'NAUCC26.txt','NAUCC25.txt','LAUCC25.txt','GUC25.txt','GUC24.txt','GUC23.txt',
  'GUC22.txt','BUC24.txt','BUC25.txt','BUC23.txt','BUC22.txt','GUC26.txt'
].map((fn) => path.join('event results', fn));

function normalizeName(name) {
  return String(name || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[.,()"']/g, '').replace(/\s+/g, ' ').trim();
}

function readEventFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

function extractNamesFromText(text) {
  if (!text) return [];
  const parts = text.split('|').map((p) => p.trim()).filter(Boolean);
  const names = new Set();
  parts.forEach((block) => {
    // split off battles section (after the first ';')
    const sem = block.indexOf(';');
    const resultsPart = sem === -1 ? block : block.slice(0, sem);
    resultsPart.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach((line) => {
      // remove explicit place like "1 ", "1.", "1)"
      const m = line.match(/^\s*(\d+)[\.)]?\s*(.+)$/);
      const name = m ? m[2].trim() : line;
      if (name) names.add(name);
    });
  });
  return [...names];
}

// Read existing riders_all.txt lines into a map canonical -> fullLine
function readExistingRiders(filePath) {
  const out = new Map();
  if (!fs.existsSync(filePath)) return out;
  const txt = fs.readFileSync(filePath, 'utf8');
  txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach((line) => {
    const parts = line.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length > 0) out.set(parts[0], line);
  });
  return out;
}

function main() {
  const workspace = process.cwd();
  const collected = new Set();

  for (const f of EVENT_FILES) {
    const p = path.join(workspace, f);
    const txt = readEventFile(p);
    if (!txt) continue;
    extractNamesFromText(txt).forEach((n) => collected.add(n));
  }

  const ridersFile = path.join(workspace, 'riders_all.txt');
  const existing = readExistingRiders(ridersFile);

  // add missing names as single canonical lines
  for (const name of collected) {
    if (!existing.has(name)) existing.set(name, name);
  }

  // sort by canonical name
  const mergedLines = [...existing.keys()].sort((a,b) => a.localeCompare(b)).map(k => existing.get(k));

  fs.writeFileSync(ridersFile, mergedLines.join('\r\n') + '\r\n', 'utf8');
  console.log('Wrote', mergedLines.length, 'entries to', ridersFile);
}

main();
