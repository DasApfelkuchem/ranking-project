const seasondecay = 0.85;
const currentyear = 26;
const Unicon = 7.5;
const GUC = 6.5;
const EUCS = 7.5;
const NAUCC = 7;
const EUCW = 2.5;
const BUC = 10;
const CFM = 10.5;
const LAUCC = 1;

// Map event code -> typical month (decimal allowed, e.g. 7.5)
const EVENT_MONTHS = {
  Unicon: Number(Unicon) || 0,
  GUC: Number(GUC) || 0,
  EUCS: Number(EUCS) || 0,
  NAUCC: Number(NAUCC) || 0,
  EUCW: Number(EUCW) || 0,
  BUC: Number(BUC) || 0,
  CFM: Number(CFM) || 0
};

const EVENT_FILES = [
  { name: 'Unicon24', file: 'event results/Unicon24.txt', weight: 3 },
  { name: 'Unicon26', file: 'event results/Unicon26.txt', weight: 3 },
  { name: 'Unicon22', file: 'event results/Unicon22.txt', weight: 3 },
  { name: 'Unicon18', file: 'event results/Unicon18.txt', weight: 3 },
  { name: 'Unicon16', file: 'event results/Unicon16.txt', weight: 3},
  { name: 'Unicon14', file: 'event results/Unicon14.txt', weight: 3 },
  { name: 'Unicon12', file: 'event results/Unicon12.txt', weight: 3 },
  { name: 'Unicon10', file: 'event results/Unicon10.txt', weight: 3 },

  { name: 'EUCW26', file: 'event results/EUCW26.txt', weight: 2 },
  { name: 'EUCW25', file: 'event results/EUCW25.txt', weight: 2 },
  { name: 'EUCW24', file: 'event results/EUCW24.txt', weight: 2},
  { name: 'EUCW20', file: 'event results/EUCW20.txt', weight: 2 },
  { name: 'EUCW19', file: 'event results/EUCW19.txt', weight: 2 },
  { name: 'EUCW18', file: 'event results/EUCW18.txt', weight: 2 },
  { name: 'EUCW17', file: 'event results/EUCW17.txt', weight: 2 },
  { name: 'EUCW16', file: 'event results/EUCW16.txt', weight: 2 },
  { name: 'EUCW14', file: 'event results/EUCW14.txt', weight: 2 },


  { name: 'EUCS23', file: 'event results/EUCS23.txt', weight: 2 },
  { name: 'EUCS25', file: 'event results/EUCS25.txt', weight: 2 },
  { name: 'EUCS15', file: 'event results/EUCS15.txt', weight: 2 },
  { name: 'EUCS15', file: 'event results/EUCS15.txt', weight: 2 },


  { name: 'CFM25', file: 'event results/CFM25.txt', weight: 1 },
    { name: 'CFM24', file: 'event results/CFM24.txt', weight: 1 },

  { name: 'NAUCC26', file: 'event results/NAUCC26.txt', weight: 2 },
  { name: 'NAUCC25', file: 'event results/NAUCC25.txt', weight: 2 },
    { name: 'NAUCC23', file: 'event results/NAUCC23.txt', weight: 2 },
      { name: 'NAUCC22', file: 'event results/NAUCC22.txt', weight: 2 },
  { name: 'NAUCC19', file: 'event results/NAUCC19.txt', weight: 2 },
    { name: 'NAUCC18', file: 'event results/NAUCC18.txt', weight: 2 },
      { name: 'NAUCC17', file: 'event results/NAUCC17.txt', weight: 2 },
        { name: 'NAUCC16', file: 'event results/NAUCC16.txt', weight: 2 },
          { name: 'NAUCC15', file: 'event results/NAUCC15.txt', weight: 2 },
  { name: 'NAUCC14', file: 'event results/NAUCC14.txt', weight: 2 },
    { name: 'NAUCC13', file: 'event results/NAUCC13.txt', weight: 2 },
  { name: 'LAUCC25', file: 'event results/LAUCC25.txt', weight: 2 },
  { name: 'GUC25', file: 'event results/GUC25.txt', weight: 1.0 },
  { name: 'GUC24', file: 'event results/GUC24.txt', weight: 1.0},
  { name: 'GUC23', file: 'event results/GUC23.txt', weight: 1.0 },
  { name: 'GUC22', file: 'event results/GUC22.txt', weight: 1.0 },
  { name: 'BUC24', file: 'event results/BUC24.txt', weight: 1.0 },
  { name: 'BUC25', file: 'event results/BUC25.txt', weight: 1.0 },
  { name: 'BUC23', file: 'event results/BUC23.txt', weight: 1.0},
  { name: 'BUC22', file: 'event results/BUC22.txt', weight: 1.0 },
  { name: 'GUC26', file: 'event results/GUC26.txt', weight: 1.0 }
];

const BEST_RESULT_MULTIPLIERS = [1,0.7,0.3,0.2,0.1];
const GENDERS = ['male', 'female'];
let currentGender = 'male';
let currentYearComparison = '2026'; // default to 2026
let globalRowsByGender = { male: [], female: [] };
let currentSort = { key: 'points', direction: 'desc' };
let currentSearch = '';
const eventResults = new Map();
const eventBattles = new Map();
const riderHistoryByGender = { male: new Map(), female: new Map() };
const riderBattlesByGender = { male: new Map(), female: new Map() };
const aliasMap = new Map(); // maps normalized alias -> canonical display name

function normalizeName(name) {
  if (!name) return '';
  // remove diacritics, collapse whitespace, lowercase
  try {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,()"']/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  } catch (e) {
    return String(name).trim().toLowerCase();
  }
}
// Escape text for safe insertion into XML/SVG <title> elements
function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
let currentProfileRider = null;
const profileBattleSort = { key: 'event', direction: 'asc' };
const SETTINGS_STORAGE_KEY = 'ranking-settings-v1';
const RIDER_NOTES_STORAGE_KEY = 'ranking-rider-notes-v1';
const defaultSettings = {
  showPoints: true,
  showWins: true,
  showBattles: true,
  showPodiums: true,
  backgroundColor: '#07111f',
  panelColor: '#091423',
  excludeUnicon: false
};
let settings = loadSettings();
let riderNotes = loadRiderNotes();

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || 'null');
    return { ...defaultSettings, ...(saved || {}) };
  } catch (error) {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function loadRiderNotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(RIDER_NOTES_STORAGE_KEY) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch (error) {
    return {};
  }
}

function saveRiderNotes() {
  try {
    localStorage.setItem(RIDER_NOTES_STORAGE_KEY, JSON.stringify(riderNotes));
  } catch (error) {
    console.error('Could not save rider notes.', error);
  }
}

function applySettingsToDom() {
  const root = document.documentElement;
  root.style.setProperty('--bg', settings.backgroundColor);
  root.style.setProperty('--panel', settings.panelColor);

  const showPointsInput = document.getElementById('show-points');
  const showWinsInput = document.getElementById('show-wins');
  const showBattlesInput = document.getElementById('show-battles');
  const showPodiumsInput = document.getElementById('show-podiums');
  const backgroundInput = document.getElementById('background-color');
  const panelInput = document.getElementById('panel-color');

  if (showPointsInput) showPointsInput.checked = settings.showPoints;
  if (showWinsInput) showWinsInput.checked = settings.showWins;
  if (showBattlesInput) showBattlesInput.checked = settings.showBattles;
  if (showPodiumsInput) showPodiumsInput.checked = settings.showPodiums;
  if (backgroundInput) backgroundInput.value = settings.backgroundColor;
  if (panelInput) panelInput.value = settings.panelColor;
}

function getVisibleWorldColumns() {
  return [
    { key: 'events', label: 'Events', visible: true, sortable: true },
    { key: 'points', label: 'Points', visible: settings.showPoints, sortable: true },
    { key: 'elo', label: 'ELO', visible: true, sortable: true },
    { key: 'wins', label: 'Wins', visible: settings.showWins, sortable: true },
    { key: 'podiums', label: 'Podiums', visible: settings.showPodiums, sortable: true },
    { key: 'battles', label: 'Battles', visible: settings.showBattles, sortable: true }
  ];
}

function getAvailableYears() {
  // Extract unique years from ranking snapshots, sorted from oldest to newest
  const years = new Set();
  rankingSnapshots.forEach((snapshot) => {
    if (snapshot.snapshotYear) {
      years.add(snapshot.snapshotYear);
    }
  });
  return Array.from(years).sort((a, b) => b - a); // newest first
}

function populateYearSelector() {
  const yearSelect = document.getElementById('year-select');
  if (!yearSelect) return;

  const years = getAvailableYears();
  // Clear existing options and populate with years only
  yearSelect.innerHTML = '';

  years.forEach((year) => {
    const option = document.createElement('option');
    option.value = String(year);
    option.textContent = String(year);
    if (year === 2026) {
      option.selected = true; // Set 2026 as default
    }
    yearSelect.appendChild(option);
  });

  yearSelect.addEventListener('change', (event) => {
    currentYearComparison = event.target.value;
    refreshRankingView();
  });
}

function getRankingsForYear(year, gender) {
  // Find the last snapshot for the given year
  // Snapshots are ordered oldest to newest
  let targetSnapshot = null;
  
  for (let i = rankingSnapshots.length - 1; i >= 0; i--) {
    const snapshot = rankingSnapshots[i];
    if (snapshot.snapshotYear <= year) {
      targetSnapshot = snapshot;
      break;
    }
  }

  if (!targetSnapshot) {
    // No snapshots available for this year, return empty
    return [];
  }

  return targetSnapshot.rowsByGender[gender] || [];
}

function getNextYearRankings(year, gender) {
  // Find rankings for the year before the given year (for comparison)
  // Snapshots are ordered oldest to newest, so we need to find the last snapshot before the given year
  const availableYears = getAvailableYears().sort((a, b) => a - b); // oldest first
  const previousYear = availableYears.reverse().find((y) => y < year);
  if (!previousYear) {
    return null;
  }
  
  // Find the last snapshot with snapshotYear <= previousYear
  let targetSnapshot = null;
  for (let i = rankingSnapshots.length - 1; i >= 0; i--) {
    const snapshot = rankingSnapshots[i];
    if (snapshot.snapshotYear === previousYear) {
      targetSnapshot = snapshot;
      break;
    }
  }
  
  if (!targetSnapshot) {
    return null;
  }

  return targetSnapshot.rowsByGender[gender] || [];
}

function computeRankDifferences(currentYearRankings, previousYearRankings) {
  // Create a map of rider -> rank for previous year
  const previousRankMap = new Map();
  previousYearRankings.forEach((entry, index) => {
    previousRankMap.set(entry.rider, index + 1);
  });

  // Create a map for current year
  const currentRankMap = new Map();
  currentYearRankings.forEach((entry, index) => {
    currentRankMap.set(entry.rider, index + 1);
  });

  // Compute differences
  const differences = new Map();
  currentRankMap.forEach((currentRank, rider) => {
    const previousRank = previousRankMap.get(rider);
    if (previousRank) {
      const diff = previousRank - currentRank; // positive = moved up
      differences.set(rider, diff);
    }
  });

  return differences;
}

function refreshRankingView() {
  const viewSelect = document.getElementById('view-select');
  const activeView = viewSelect ? viewSelect.value : 'world';

  if (activeView === 'world') {
    setRankingHeaders('world');
    renderWorldForYear(Number(currentYearComparison));
  } else {
    setRankingHeaders('event');
    renderEvent(activeView);
  }
}

function updateSettingsFromInputs() {
  const showPointsInput = document.getElementById('show-points');
  const showWinsInput = document.getElementById('show-wins');
  const showBattlesInput = document.getElementById('show-battles');
  const showPodiumsInput = document.getElementById('show-podiums');
  const backgroundInput = document.getElementById('background-color');
  const panelInput = document.getElementById('panel-color');

  settings = {
    ...settings,
    showPoints: showPointsInput ? showPointsInput.checked : settings.showPoints,
    showWins: showWinsInput ? showWinsInput.checked : settings.showWins,
    showBattles: showBattlesInput ? showBattlesInput.checked : settings.showBattles,
    showPodiums: showPodiumsInput ? showPodiumsInput.checked : settings.showPodiums,
    backgroundColor: backgroundInput ? backgroundInput.value : settings.backgroundColor,
    panelColor: panelInput ? panelInput.value : settings.panelColor
  };

  saveSettings();
  applySettingsToDom();
  refreshRankingView();
}

function attachSettingsEvents() {
  const openSettingsButton = document.getElementById('open-settings');
  const closeSettingsButton = document.getElementById('close-settings');
  const settingsPanel = document.getElementById('settings-panel');
   
  if (openSettingsButton && settingsPanel) {
    openSettingsButton.addEventListener('click', () => {
      settingsPanel.classList.remove('hidden');
      settingsPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (closeSettingsButton && settingsPanel) {
    closeSettingsButton.addEventListener('click', () => {
      settingsPanel.classList.add('hidden');
    });
  }

  ['show-points', 'show-wins', 'show-battles', 'show-podiums'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('change', updateSettingsFromInputs);
    }
  });

  ['background-color', 'panel-color'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', updateSettingsFromInputs);
    }
  });

  // Add unknown riders -> riders_all button
  const addUnknownBtn = document.getElementById('add-unknown-riders');
  const addUnknownResult = document.getElementById('add-unknown-result');
  if (addUnknownBtn) {
    addUnknownBtn.addEventListener('click', async () => {
      addUnknownBtn.disabled = true;
      if (addUnknownResult) addUnknownResult.textContent = 'Collecting unknown riders…';
      try {
        const added = await addUnknownRidersToRidersAll();
        if (addUnknownResult) addUnknownResult.textContent = `${added} rider(s) added — downloaded updated riders_all.txt`;
      } catch (e) {
        if (addUnknownResult) addUnknownResult.textContent = `Error: ${e.message || e}`;
      } finally {
        addUnknownBtn.disabled = false;
        setTimeout(() => { if (addUnknownResult) addUnknownResult.textContent = ''; }, 6000);
      }
    });
  }
}

// Collect riders not listed in riders_all.txt and produce a merged riders_all.txt for download.
async function addUnknownRidersToRidersAll() {
  // Collect all riders from in-memory structures
  const allRiders = collectAllRiders(); // canonical names

  // Try to fetch existing riders_all.txt
  let existingText = '';
  try {
    const resp = await fetch('riders_all.txt');
    if (resp.ok) existingText = await resp.text();
  } catch (e) {
    // ignore fetch errors (file may not exist)
  }

  const existingLines = existingText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // Build a map canonical -> full line (preserve alias lists if present)
  const existingMap = new Map();
  existingLines.forEach((line) => {
    const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) existingMap.set(parts[0], line);
  });

  // Find new canonical names that are not present yet
  const toAdd = allRiders.filter((name) => !existingMap.has(name));
  if (toAdd.length === 0) {
    // still ensure file is sorted and alias lines preserved when returned to user
    const sortedKeys = [...existingMap.keys()].sort((a, b) => a.localeCompare(b));
    const merged = sortedKeys.map((k) => existingMap.get(k)).join('\r\n') + (sortedKeys.length ? '\r\n' : '');
    // attempt POST first (server), otherwise download
    try {
      const res = await fetch('http://localhost:6789/save-riders_all', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: merged,
      });
      if (res.ok) return 0;
    } catch (e) {
      // fallthrough to download
    }

    const blob0 = new Blob([merged], { type: 'text/plain;charset=utf-8' });
    const url0 = URL.createObjectURL(blob0);
    const a0 = document.createElement('a');
    a0.style.display = 'none';
    a0.href = url0;
    a0.download = 'riders_all.txt';
    document.body.appendChild(a0);
    a0.click();
    a0.remove();
    URL.revokeObjectURL(url0);

    return 0;
  }

  // Insert missing riders as single-name canonical lines into the map
  toAdd.forEach((canonical) => existingMap.set(canonical, canonical));

  // Produce merged text sorted by canonical name so new riders are interleaved alphabetically
  const sortedKeys = [...existingMap.keys()].sort((a, b) => a.localeCompare(b));
  const merged = sortedKeys.map((k) => existingMap.get(k)).join('\r\n') + '\r\n';

  // Update aliasMap in-memory so new canonical names resolve immediately
  toAdd.forEach((canonical) => {
    aliasMap.set(normalizeName(canonical), canonical);
  });
  // First try to POST to a local helper server (if running) to overwrite the file directly.
  try {
    const res = await fetch('http://localhost:6789/save-riders_all', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: merged,
    });
    if (res.ok) return toAdd.length;
    // fallthrough to download
  } catch (e) {
    // server not running or network error — fall back to download
  }

  // Trigger download of the merged file so user can save/replace the project file
  const blob = new Blob([merged], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'riders_all.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return toAdd.length;
}

async function loadRanking() {
  // Load aliases from `riders_all.txt` if present in project root.
  await loadAliasesFile();

  const ridersByGender = {
    male: new Map(),
    female: new Map()
  };

  eventResults.clear();
  eventBattles.clear();
  riderHistoryByGender.male.clear();
  riderHistoryByGender.female.clear();
  riderBattlesByGender.male.clear();
  riderBattlesByGender.female.clear();

  for (const event of EVENT_FILES) {
    const response = await fetch(event.file);
    if (!response.ok) {
      throw new Error(`Unable to load ${event.file}`);
    }

    const text = await response.text();
    // Interpret event name year suffix as 20xx (e.g. '24' -> 2024).
    // Decay will be applied later relative to a snapshot or the current year (only to events older than the snapshot year).
    const yearMatch = String(event.name || '').match(/(\d{2})$/);
    const eventYear = yearMatch ? 2000 + Number(yearMatch[1]) : null;
    const genderBlocks = text.split('|').map((part) => part.trim()).filter(Boolean);
    if (genderBlocks.length === 0) {
      throw new Error(`Unable to parse gender sections in ${event.file}`);
    }

    const eventEntriesByGender = { male: [], female: [] };
    const eventBattlesByGenderForEvent = { male: [], female: [] };

    genderBlocks.forEach((block, index) => {
      const gender = GENDERS[index];
      if (!gender) return;

      const sectionDelimiter = block.indexOf(';');
      if (sectionDelimiter === -1) {
        throw new Error(`Unable to parse results and battles in ${event.file} for ${gender} section.`);
      }

      const resultsText = block.slice(0, sectionDelimiter).trim();
      const battleText = block.slice(sectionDelimiter + 1).trim();
      const rawLines = resultsText
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);

      if (rawLines.length === 0) {
        return;
      }

      // Parse optional explicit place numbers at the start of a line.
      // Examples supported: "1 Rider Name", "1. Rider Name", "1) Rider Name".
        const parsed = rawLines.map((line) => {
          const m = line.match(/^\s*(\d+)[\.)]?\s*(.+)$/);
          if (m) {
            return { name: m[2].trim(), explicitPlace: Number(m[1]) };
          }
          return { name: line, explicitPlace: null };
        });

      const competitorCount = parsed.length;
      // Compute exponent so top place -> 100 points and last place -> 15 points
      const exponent = competitorCount > 1 ? Math.log(100 / 15) / Math.log(competitorCount) : 1;
      const eventEntries = parsed.map((item, index) => {
        // Use the explicit place if provided, otherwise fall back to list order.
        const place = item.explicitPlace ?? (index + 1);
        const baseRaw = Math.max(15, 100 / Math.pow(place, exponent)) * event.weight;
        const canonical = aliasMap.get(normalizeName(item.name)) || item.name;
        return {
          place,
          rider: canonical,
          rawPointsBeforeDecay: baseRaw,
          decayMultiplier: null,
          originalName: item.name,
          eventYear
        };
      });

      eventEntriesByGender[gender] = eventEntries;
      const eventRiderSet = new Set(eventEntries.map((e) => e.rider));

      if (battleText) {
        const battleLines = battleText
          .split(/\r?\n/)
          .map((item) => item.trim());

        const battles = [];
        battleLines.forEach((line, index) => {
          if (!line) {
            return; // preserve placeholder position for missing battle rows
          }

          const parts = line.split(/[,;]+/).map((part) => part.trim()).filter(Boolean);
          if (parts.length !== 2) {
            throw new Error(`Invalid battle line in ${event.name}: ${line}`);
          }

          const [rawWinner, rawLoser] = parts;
          const winner = aliasMap.get(normalizeName(rawWinner)) || rawWinner;
          const loser = aliasMap.get(normalizeName(rawLoser)) || rawLoser;
          const missing = [winner, loser].filter((name) => !eventRiderSet.has(name));
          if (missing.length > 0) {
            throw new Error(`Battle results for ${event.name} reference unknown rider(s): ${missing.join(', ')}`);
          }

          const round = getBattleRound(event.name, index);
          addRiderBattle(winner, event.name, round, loser, 'Won', gender);
          addRiderBattle(loser, event.name, round, winner, 'Lost', gender);

          battles.push({
            round,
            winner,
            loser,
            rawWinner,
            rawLoser
          });
        });

        eventBattlesByGenderForEvent[gender] = battles;
      }

      eventEntries.forEach((entry) => {
        const name = entry.rider;
        const place = entry.place;
        const baseRaw = entry.rawPointsBeforeDecay;
        // compute decay relative to current year for the live rankings
        const referenceYear = new Date().getFullYear();
        const yearsOfDecayLocal = entry.eventYear ? Math.max(0, referenceYear - entry.eventYear) : 0;
        const decayMultiplierLocal = Math.pow(seasondecay, yearsOfDecayLocal);
        const rawPoints = (baseRaw || 0) * decayMultiplierLocal;
        if (!ridersByGender[gender].has(name)) {
          ridersByGender[gender].set(name, {
            event_scores: [],
            points: 0,
            events: 0,
            wins: 0,
            podiums: 0,
            battles: 0
          });
        }

        const stats = ridersByGender[gender].get(name);
        const basePoints = Math.max(15, 100 / Math.pow(place, exponent));
        const eventScore = basePoints * event.weight * decayMultiplierLocal;

        stats.event_scores.push(eventScore);
        stats.events += 1;

        if (place === 1) {
          stats.wins += 1;
        }

        if (place <= 3) {
          stats.podiums += 1;
        }

        const riderBattleCount = (riderBattlesByGender[gender].get(name) || []).length;
        stats.battles = riderBattleCount;

        const history = riderHistoryByGender[gender].get(name) || [];
        // Store both decayed and pre-decay raw points plus the decay multiplier so UI can show decay.
        history.push({ event: event.name, place, weight: event.weight, rawPoints, rawPointsBeforeDecay: entry.rawPointsBeforeDecay, decayMultiplier: decayMultiplierLocal, eventYear: entry.eventYear });
        riderHistoryByGender[gender].set(name, history);
      });
    });

    eventResults.set(event.name, eventEntriesByGender);
    eventBattles.set(event.name, eventBattlesByGenderForEvent);
  }

  // Compute Elo-based snapshots (this also sets live globalRowsByGender to the latest snapshot)
  computeRankingSnapshots();

  updateSummaryStats();
  populateViewSelector();
  setView('world');
}

// Holds snapshots: array of { event, dateValue, rowsByGender: { male: [...], female: [...] } }
const rankingSnapshots = [];

function computeRankingSnapshots() {
  // Build Elo-like point rankings by replaying battles in chronological order.
  // This variant uses a simple points system: everyone starts at 0, a win = +100, a loss = -90 (floor 0),
  // and at each calendar year boundary all rider points decay by 10%.
  rankingSnapshots.length = 0;
  const eventsSortedAsc = [...EVENT_FILES].sort((a, b) => getEventSortValue(a.name) - getEventSortValue(b.name));

  const INITIAL_POINTS = 0;
  const YEAR_DECAY_RATE = 0.10; // 10% per year
  // Tuning: lower K_BASE for smaller swings. Set to 80 for gentler changes.
  const K_BASE = 80; // base K (smaller -> smaller rating swings)
  const LOSER_FACTOR = 0.9; // losers lose slightly less magnitude than winners gain

  // Per-gender state
  const pointsMap = { male: new Map(), female: new Map() };
  const winsMap = { male: new Map(), female: new Map() };
  const podiumMap = { male: new Map(), female: new Map() };
  const eventsCount = { male: new Map(), female: new Map() };

  // Helper to ensure a rider has initial state
  function ensureRider(gender, rider) {
    if (!pointsMap[gender].has(rider)) pointsMap[gender].set(rider, INITIAL_POINTS);
    if (!winsMap[gender].has(rider)) winsMap[gender].set(rider, 0);
    if (!podiumMap[gender].has(rider)) podiumMap[gender].set(rider, 0);
    if (!eventsCount[gender].has(rider)) eventsCount[gender].set(rider, 0);
  }

  // Track previous event year so yearly decay can be applied when crossing into later years.
  let prevYear = null;

  // Process events in chronological order and update points from battles
  eventsSortedAsc.forEach((event) => {
    const snapshotYear = (() => {
      const m = String(event.name || '').match(/(\d{2})$/);
      return m ? 2000 + Number(m[1]) : new Date().getFullYear();
    })();

    // If we've moved forward in calendar years, apply 10% decay once for each year passed
    if (prevYear === null) {
      prevYear = snapshotYear;
    } else if (snapshotYear > prevYear) {
      for (let y = prevYear + 1; y <= snapshotYear; y++) {
        GENDERS.forEach((gender) => {
          for (const [rider, pts] of pointsMap[gender].entries()) {
            const decayed = Math.round(pts * (1 - YEAR_DECAY_RATE));
            pointsMap[gender].set(rider, Math.max(0, decayed));
          }
        });
      }
      prevYear = snapshotYear;
    }

    const entriesByGender = eventResults.get(event.name) || { male: [], female: [] };

    GENDERS.forEach((gender) => {
      const entries = entriesByGender[gender] || [];
      // First, register participants and update event/win/podium counts
      entries.forEach((entry) => {
        const name = entry.rider;
        ensureRider(gender, name);
        eventsCount[gender].set(name, (eventsCount[gender].get(name) || 0) + 1);
        if (entry.place === 1) winsMap[gender].set(name, (winsMap[gender].get(name) || 0) + 1);
        if (entry.place <= 3) podiumMap[gender].set(name, (podiumMap[gender].get(name) || 0) + 1);
      });

      // Then apply simple points updates for battles that happened at this event (if any)
      const battles = (eventBattles.get(event.name) || {})[gender] || [];
      battles.forEach((b) => {
        const winner = b.winner;
        const loser = b.loser;
        ensureRider(gender, winner);
        ensureRider(gender, loser);

        // Compute Elo-style deltas based on opponent strength
        const prevW = pointsMap[gender].get(winner) || 0;
        const prevL = pointsMap[gender].get(loser) || 0;
        // Expected scores
        const Ew = 1 / (1 + Math.pow(10, (prevL - prevW) / 400));
        const El = 1 / (1 + Math.pow(10, (prevW - prevL) / 400));
        // Winner gains, loser loses (loser magnitude slightly reduced)
        const deltaW = Math.round(K_BASE * (1 - Ew));
        const deltaL = -Math.round(K_BASE * (El) * LOSER_FACTOR);

        const newW = prevW + deltaW;
        const newL = Math.max(0, prevL + deltaL);

        pointsMap[gender].set(winner, newW);
        pointsMap[gender].set(loser, newL);

        // Record the point delta (how much 'ELO' changed) back into the rider's battle history entries
        try {
          const winnerHist = riderBattlesByGender[gender].get(winner) || [];
          const wi = winnerHist.findIndex((h) => h.event === event.name && h.round === b.round && h.opponent === loser && h.result === 'Won' && (h.eloDelta === undefined));
          if (wi >= 0) {
            winnerHist[wi].eloDelta = deltaW;
          }
        } catch (e) {
          // ignore if history not found
        }

        try {
          const loserHist = riderBattlesByGender[gender].get(loser) || [];
          const li = loserHist.findIndex((h) => h.event === event.name && h.round === b.round && h.opponent === winner && h.result === 'Lost' && (h.eloDelta === undefined));
          if (li >= 0) {
            loserHist[li].eloDelta = deltaL;
          }
        } catch (e) {
          // ignore
        }
      });
    });

    // After processing this event, capture a snapshot of current points
    const rowsByGender = { male: [], female: [] };
    GENDERS.forEach((gender) => {
      // Ensure we include riders that appear in points map or history
      const riders = new Set([...pointsMap[gender].keys(), ...riderHistoryByGender[gender].keys()]);
      riders.forEach((rider) => {
        ensureRider(gender, rider);
        const pts = pointsMap[gender].get(rider) || INITIAL_POINTS;
        const wins = winsMap[gender].get(rider) || 0;
        const podiums = podiumMap[gender].get(rider) || 0;
        const eventsNum = eventsCount[gender].get(rider) || 0;
        const battles = (riderBattlesByGender[gender].get(rider) || []).length;

        // Compute legacy points from stored rider history (decayed rawPoints gathered during load)
        const history = riderHistoryByGender[gender].get(rider) || [];
        const scores = history.map((h) => (h.rawPoints ?? h.rawPointsBeforeDecay ?? 0)).sort((a, b) => b - a);
        const legacyPoints = scores.reduce((total, score, index) => {
          const mult = BEST_RESULT_MULTIPLIERS[index] ?? 0;
          return total + score * mult;
        }, 0);

        // Keep legacy 'points' for the original metric and store the new points under 'elo'
        rowsByGender[gender].push({ rider, points: legacyPoints, elo: pts, events: eventsNum, wins, podiums, battles });
      });

      rowsByGender[gender].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.podiums !== a.podiums) return b.podiums - a.podiums;
        return a.rider.localeCompare(b.rider);
      });
    });

    rankingSnapshots.push({ event: event.name, dateValue: getEventSortValue(event.name), rowsByGender, snapshotYear });
  });

  // Set live globalRowsByGender to the latest snapshot (if any)
  if (rankingSnapshots.length > 0) {
    const last = rankingSnapshots[rankingSnapshots.length - 1];
    GENDERS.forEach((g) => {
      globalRowsByGender[g] = (last.rowsByGender[g] || []).map((r) => ({ ...r }));
    });
  } else {
    GENDERS.forEach((g) => { globalRowsByGender[g] = []; });
  }
}

function updateSummaryStats() {
  const totalRiders = document.getElementById('total-riders');
  const eventCount = document.getElementById('event-count');
  const battleCount = document.getElementById('battle-count');
  const currentRows = globalRowsByGender[currentGender] || [];

  if (totalRiders) {
    totalRiders.textContent = String(currentRows.length);
  }

  if (eventCount) {
    const eventCountForGender = [...eventResults.values()].filter((entry) =>
      Array.isArray(entry[currentGender]) && entry[currentGender].length > 0
    ).length;
    eventCount.textContent = String(eventCountForGender);
  }

  if (battleCount) {
    const totalBattles = [...eventBattles.values()].reduce((sum, battlesByGender) => {
      const battles = battlesByGender[currentGender] || [];
      return sum + battles.length;
    }, 0);
    battleCount.textContent = String(totalBattles);
  }
}

function populateViewSelector() {
  const select = document.getElementById('view-select');
  if (!select) return;

  select.innerHTML = '<option value="world">All</option>';

  // Sort events by year and month (newest first) when populating the selector.
  const filesSortedByYear = [...EVENT_FILES].sort((a, b) => getEventSortValue(b.name) - getEventSortValue(a.name));
  filesSortedByYear.forEach((event) => {
    const option = document.createElement('option');
    option.value = event.name;
    option.textContent = event.name;
    select.appendChild(option);
  });

  select.addEventListener('change', (event) => {
    setView(event.target.value);
  });
}

function getEventFullYear(eventName) {
  const match = String(eventName || '').match(/(\d{2})$/);
  return match ? 2000 + Number(match[1]) : Number.MIN_SAFE_INTEGER;
}

function parseEventNameYearPrefix(eventName) {
  const m = String(eventName || '').match(/^([A-Za-z]+)(\d{2})$/);
  if (!m) return { prefix: String(eventName || ''), year: null };
  return { prefix: m[1], year: 2000 + Number(m[2]) };
}

function formatEventYearMonth(eventName) {
  const { prefix, year } = parseEventNameYearPrefix(eventName);
  if (!year) return String(eventName || '');
  const monthVal = (EVENT_MONTHS && EVENT_MONTHS[prefix]) ? Number(EVENT_MONTHS[prefix]) : 0;
  const monthInt = monthVal ? Math.max(1, Math.min(12, Math.round(monthVal))) : 0;
  return monthInt ? `${year}-${String(monthInt).padStart(2, '0')}` : `${year}`;
}

function setView(view) {
  const title = document.getElementById('ranking-title');
  const description = document.getElementById('ranking-description');
  const genderText = currentGender === 'female' ? 'female ' : 'male ';

  if (view === 'world') {
    title.textContent = 'All';
    description.textContent = `Weighted ${genderText}results from your competition files`;
    setRankingHeaders('world');
    renderWorldForYear(Number(currentYearComparison));
  } else {
    title.textContent = `${view} results`;
    description.textContent = `Place-by-place ${genderText}results for ${view}`;
    setRankingHeaders('event');
    renderEvent(view);
  }
}

function updateGenderToggleText() {
  const button = document.getElementById('toggle-gender');
  if (!button) return;
  button.textContent = currentGender === 'female' ? 'Show male view' : 'Show female view';
}

function toggleGender() {
  currentGender = currentGender === 'female' ? 'male' : 'female';
  updateGenderToggleText();
  refreshRankingView();
}

function setRankingHeaders(type) {
  const thead = document.getElementById('ranking-thead');
  if (!thead) return;

  if (type === 'world') {
    const columns = getVisibleWorldColumns().filter((column) => column.visible);
    const headerCells = columns
      .map((column) => {
        if (!column.sortable) {
          return `<th>${column.label}</th>`;
        }
        return `<th><button class="sort-button" data-key="${column.key}">${column.label}</button></th>`;
      })
      .join('');

    // Always show "Diff" column since we always compare years now
    const diffHeader = '<th>Diff</th>';

    thead.innerHTML = `
      <tr>
        <th>Rank</th>
        <th>Rider</th>
        ${diffHeader}
        ${headerCells}
      </tr>
    `;
    attachSortButtons();
  } else {
    thead.innerHTML = `
      <tr>
        <th>Rank</th>
        <th>Rider</th>
        <th>Place</th>
        <th>Raw points</th>
        <th>Decay</th>
      </tr>
    `;
  }
}

function attachSortButtons() {
  document.querySelectorAll('.sort-button').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.getAttribute('data-key');
      if (!key) return;

      const column = getVisibleWorldColumns().find((entry) => entry.key === key);
      if (!column || !column.visible) return;

      if (currentSort.key === key && currentSort.direction === 'desc') {
        currentSort.direction = 'asc';
      } else {
        currentSort.key = key;
        currentSort.direction = 'desc';
      }

      sortWorldRows();
      renderWorldForYear(Number(currentYearComparison));
    });
  });
}

function attachProfileSortButtons() {
  document.querySelectorAll('.profile-sort-button').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.getAttribute('data-key');
      if (!key) return;

      if (profileBattleSort.key === key && profileBattleSort.direction === 'asc') {
        profileBattleSort.direction = 'desc';
      } else if (profileBattleSort.key === key && profileBattleSort.direction === 'desc') {
        profileBattleSort.direction = 'asc';
      } else {
        profileBattleSort.key = key;
        profileBattleSort.direction = 'asc';
      }

      if (currentProfileRider) {
        renderProfileBattleHistory(currentProfileRider);
      }
    });
  });
}

function getCurrentGlobalRows() {
  return globalRowsByGender[currentGender] || [];
}

function sortWorldRows() {
  const rows = getCurrentGlobalRows();
  rows.sort((a, b) => {
    let result = 0;

    if (currentSort.key === 'points') {
      result = b.points - a.points;
    } else if (currentSort.key === 'elo') {
      result = (b.elo || 0) - (a.elo || 0);
    } else if (currentSort.key === 'events') {
      result = b.events - a.events;
    } else if (currentSort.key === 'wins') {
      result = b.wins - a.wins;
    } else if (currentSort.key === 'podiums') {
      result = b.podiums - a.podiums;
    } else if (currentSort.key === 'battles') {
      result = b.battles - a.battles;
    }

    if (result === 0) {
      result = a.rider.localeCompare(b.rider);
    }

    return currentSort.direction === 'asc' ? -result : result;
  });
}

function renderWorld() {
  const body = document.getElementById('ranking-body');
  if (!body) return;

  const currentRows = getCurrentGlobalRows();
  const visibleRows = currentSearch
    ? currentRows.filter((entry) => entry.rider.toLowerCase().includes(currentSearch))
    : currentRows;

  body.innerHTML = '';

  const visibleColumns = getVisibleWorldColumns().filter((column) => column.visible);
  const columnCount = 2 + visibleColumns.length;

  if (visibleRows.length === 0) {
    body.innerHTML = `<tr><td colspan="${columnCount}" class="status">No riders match your search.</td></tr>`;
  } else {
    visibleRows.forEach((entry, index) => {
      const rank = currentSort.direction === 'asc' ? visibleRows.length - index : index + 1;
      const row = document.createElement('tr');
      const cells = visibleColumns.map((column) => {
        if (column.key === 'events') {
          return `<td>${entry.events}</td>`;
        }
        if (column.key === 'points') {
          return `<td>${(entry.points || 0).toFixed(2)}</td>`;
        }
        if (column.key === 'elo') {
          return `<td>${(entry.elo || 0).toFixed(0)}</td>`;
        }
        if (column.key === 'wins') {
          return `<td>${entry.wins}</td>`;
        }
        if (column.key === 'podiums') {
          return `<td>${entry.podiums}</td>`;
        }
        if (column.key === 'battles') {
          return `<td>${entry.battles}</td>`;
        }
        return '';
      }).join('');

      row.innerHTML = `
        <td class="rank">${rank}</td>
        <td><button class="rider-link" data-rider="${entry.rider}">${entry.rider}</button></td>
        ${cells}
      `;
      body.appendChild(row);
    });
  }
  attachRiderLinks();

  updateSummaryStats();
}

function renderWorldForYear(year) {
  const body = document.getElementById('ranking-body');
  if (!body) return;

  // Get rankings for the selected year and the previous year (for comparison)
  const currentYearRankings = getRankingsForYear(year, currentGender);
  const previousYearRankings = getNextYearRankings(year, currentGender);
  
  // Compute rank differences (comparing current year to previous year)
  let rankDifferences = new Map();
  if (previousYearRankings) {
    rankDifferences = computeRankDifferences(currentYearRankings, previousYearRankings);
  }

  // Filter by search
  let visibleRows = currentSearch
    ? currentYearRankings.filter((entry) => entry.rider.toLowerCase().includes(currentSearch))
    : [...currentYearRankings];
  
  // Apply sorting
  visibleRows.sort((a, b) => {
    let result = 0;
    
    if (currentSort.key === 'points') {
      result = b.points - a.points;
    } else if (currentSort.key === 'elo') {
      result = (b.elo || 0) - (a.elo || 0);
    } else if (currentSort.key === 'events') {
      result = b.events - a.events;
    } else if (currentSort.key === 'wins') {
      result = b.wins - a.wins;
    } else if (currentSort.key === 'podiums') {
      result = b.podiums - a.podiums;
    } else if (currentSort.key === 'battles') {
      result = b.battles - a.battles;
    }
    
    if (result === 0) {
      result = a.rider.localeCompare(b.rider);
    }
    
    return currentSort.direction === 'asc' ? -result : result;
  });

  body.innerHTML = '';

  const visibleColumns = getVisibleWorldColumns().filter((column) => column.visible);
  const columnCount = 3 + visibleColumns.length; // rank, rider, diff, + columns

  if (visibleRows.length === 0) {
    body.innerHTML = `<tr><td colspan="${columnCount}" class="status">No riders match your search.</td></tr>`;
  } else {
    visibleRows.forEach((entry, index) => {
      const rank = index + 1;
      const row = document.createElement('tr');
      
      // Generate the rank difference indicator
      const diff = rankDifferences.get(entry.rider);
      let diffHtml = '<td>-</td>';
      if (diff !== undefined) {
        const absDiff = Math.abs(diff);
        if (diff > 0) {
          // Moved up in rankings (lower rank number)
          diffHtml = `<td><span class="rank-change up"><span class="rank-change-arrow">▲</span>${absDiff}</span></td>`;
        } else if (diff < 0) {
          // Moved down in rankings (higher rank number)
          diffHtml = `<td><span class="rank-change down"><span class="rank-change-arrow">▼</span>${absDiff}</span></td>`;
        } else {
          // No change
          diffHtml = '<td>-</td>';
        }
      }

      const cells = visibleColumns.map((column) => {
        if (column.key === 'events') {
          return `<td>${entry.events}</td>`;
        }
        if (column.key === 'points') {
          return `<td>${(entry.points || 0).toFixed(2)}</td>`;
        }
        if (column.key === 'elo') {
          return `<td>${(entry.elo || 0).toFixed(0)}</td>`;
        }
        if (column.key === 'wins') {
          return `<td>${entry.wins}</td>`;
        }
        if (column.key === 'podiums') {
          return `<td>${entry.podiums}</td>`;
        }
        if (column.key === 'battles') {
          return `<td>${entry.battles}</td>`;
        }
        return '';
      }).join('');

      row.innerHTML = `
        <td class="rank">${rank}</td>
        <td><button class="rider-link" data-rider="${entry.rider}">${entry.rider}</button></td>
        ${diffHtml}
        ${cells}
      `;
      body.appendChild(row);
    });
  }
  attachRiderLinks();

  updateSummaryStats();
}

function renderEvent(eventName) {
  const body = document.getElementById('ranking-body');
  const battleWrapper = document.getElementById('event-battle-wrapper');
  const battleBody = document.getElementById('event-battle-body');
  if (!body || !battleWrapper || !battleBody) return;

  const eventEntries = eventResults.get(eventName)?.[currentGender] || [];
  // If a rider profile is open, compute their top-5 events so we can highlight their row in this event view
  let profileTop5 = new Set();
  if (currentProfileRider) {
    const history = riderHistoryByGender[currentGender].get(currentProfileRider) || [];
    // Use decayed rawPoints (displayed points) when ranking top-5
    const scores = history.map((e) => ({ event: e.event, score: e.rawPoints ?? e.rawPointsBeforeDecay ?? 0 }));
    scores.sort((a, b) => b.score - a.score);
    profileTop5 = new Set(scores.slice(0, 5).map((x) => x.event));
  }
  const visibleEntries = currentSearch
    ? eventEntries.filter((entry) => entry.rider.toLowerCase().includes(currentSearch))
    : eventEntries;

  body.innerHTML = '';

  if (visibleEntries.length === 0) {
    body.innerHTML = '<tr><td colspan="5" class="status">No riders match your search.</td></tr>';
  } else {
    visibleEntries.forEach((entry) => {
      const isTopForProfile = currentProfileRider && entry.rider === currentProfileRider && profileTop5.has(eventName);
      const row = document.createElement('tr');
      const placeClass = entry.place === 1
        ? 'podium-gold'
        : entry.place === 2
          ? 'podium-silver'
          : entry.place === 3
            ? 'podium-bronze'
            : '';

      // Compute display decay relative to the current year (live view)
      const referenceYear = new Date().getFullYear();
      const entryYear = entry.eventYear || null;
      const decayMultiplierDisplay = entryYear && entryYear < referenceYear ? Math.pow(seasondecay, referenceYear - entryYear) : 1;
      const rawPointsDisplay = (entry.rawPointsBeforeDecay || 0) * decayMultiplierDisplay;

      row.innerHTML = `
        <td class="rank">${entry.place}</td>
        <td><button class="rider-link" data-rider="${entry.rider}">${entry.rider}</button></td>
        <td class="${placeClass}">${entry.place}</td>
        <td>${rawPointsDisplay.toFixed(2)}</td>
        <td>×${decayMultiplierDisplay.toFixed(2)}</td>
      `;
      if (isTopForProfile) {
        row.classList.add('profile-top-five');
      }
      body.appendChild(row);
    });
  }

  const battles = eventBattles.get(eventName)?.[currentGender] || [];
  if (battles.length > 0) {
    battleBody.innerHTML = '';
    battles.forEach((battle) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${battle.round}</td>
        <td><button class="rider-link" data-rider="${battle.winner}">${battle.winner}</button></td>
        <td><button class="rider-link" data-rider="${battle.loser}">${battle.loser}</button></td>
      `;
      battleBody.appendChild(row);
    });
    battleWrapper.classList.remove('hidden');
  } else {
    battleBody.innerHTML = `<tr><td colspan="3" class="status">No battle details available.</td></tr>`;
    battleWrapper.classList.add('hidden');
  }

  attachRiderLinks();

  updateSummaryStats();
}

function attachRiderLinks() {
  document.querySelectorAll('.rider-link').forEach((button) => {
    button.addEventListener('click', () => {
      const rider = button.getAttribute('data-rider');
      if (rider) {
        showRiderProfile(rider);
      }
    });
  });
}

function getBattleRound(eventName, index) {
  if (index === 0) return 'Final';
  if (index === 1) return 'Third place';
  if (index <= 3) return 'Semi-final';
  if (index <= 7) return 'Quarter-final';
  return 'Lower-Rounds';
}

function addRiderBattle(rider, eventName, round, opponent, result, gender = 'male') {
  const history = riderBattlesByGender[gender].get(rider) || [];
  history.push({ event: eventName, round, opponent, result });
  riderBattlesByGender[gender].set(rider, history);
}

function getEventSortValue(eventName) {
  // Return a sortable numeric value combining year and month.
  // Example: 2024 * 12 + 7.5 => allows ordering by month within a year.
  const match = String(eventName || '').match(/^([A-Za-z]+)(\d{2})$/);
  if (!match) return Number.MIN_SAFE_INTEGER;
  const prefix = match[1];
  const year = 2000 + Number(match[2]);
  const month = (EVENT_MONTHS && EVENT_MONTHS[prefix]) ? Number(EVENT_MONTHS[prefix]) : 0;
  return year * 12 + (isFinite(month) ? month : 0);
}

function compareBattles(a, b, key) {
  if (key === 'round') {
    const roundOrder = {
      'Final': 0,
      'Third place': 1,
      'Semi-final': 2,
      'Quarter-final': 3,
      'Lower-Rounds': 4
    };

    const left = roundOrder[a.round] ?? 99;
    const right = roundOrder[b.round] ?? 99;
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }

  if (key === 'event') {
    const leftValue = getEventSortValue(a.event);
    const rightValue = getEventSortValue(b.event);

    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }
  }

  const left = String(a[key] || '').toLowerCase();
  const right = String(b[key] || '').toLowerCase();

  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function renderProfileBattleHistory(rider) {
  const battleHistory = riderBattlesByGender[currentGender].get(rider) || [];
  const profileBattleBody = document.getElementById('profile-battle-body');
  const profileBattleSummary = document.getElementById('profile-battle-summary');

  if (!profileBattleBody || !profileBattleSummary) return;

  const sortedBattles = [...battleHistory].sort((a, b) => {
    const result = compareBattles(a, b, profileBattleSort.key);
    return profileBattleSort.direction === 'asc' ? result : -result;
  });

  profileBattleBody.innerHTML = '';

  if (sortedBattles.length === 0) {
    profileBattleBody.innerHTML = `<tr><td colspan="5" class="status">No battle history available.</td></tr>`;
    profileBattleSummary.textContent = 'No battles recorded.';
    return;
  }

  sortedBattles.forEach((battle) => {
    const row = document.createElement('tr');
    const resultClass = battle.result === 'Won'
      ? 'battle-result-won'
      : battle.result === 'Lost'
        ? 'battle-result-lost'
        : '';

    const delta = (typeof battle.eloDelta === 'number') ? (battle.eloDelta > 0 ? `+${battle.eloDelta}` : `${battle.eloDelta}`) : '';
    const deltaClass = (typeof battle.eloDelta === 'number') ? (battle.eloDelta > 0 ? 'elo-delta-up' : (battle.eloDelta < 0 ? 'elo-delta-down' : '')) : '';
    row.innerHTML = `
      <td>${battle.event}</td>
      <td>${battle.round}</td>
      <td>${battle.opponent}</td>
      <td class="${resultClass}">${battle.result}</td>
      <td class="${deltaClass}">${delta}</td>
    `;
    profileBattleBody.appendChild(row);
  });

  profileBattleSummary.textContent = `${sortedBattles.length} battle${sortedBattles.length === 1 ? '' : 's'} recorded.`;
}

function attachRiderNotesEvents() {
  const notesInput = document.getElementById('rider-notes-input');
  if (!notesInput) return;

  notesInput.addEventListener('input', () => {
    if (!currentProfileRider) return;
    riderNotes[currentProfileRider] = notesInput.value;
    saveRiderNotes();
  });
}

function showRiderProfile(rider) {
  const profilePanel = document.getElementById('profile-panel');
  const profileName = document.getElementById('profile-name');
  const profileSummary = document.getElementById('profile-summary');
  const profileBody = document.getElementById('profile-body');
  const profileHeader = document.querySelector('#profile-body')?.closest('table')?.querySelector('thead');
  const notesInput = document.getElementById('rider-notes-input');

  if (!profilePanel || !profileName || !profileSummary || !profileBody || !profileHeader) return;

  const history = riderHistoryByGender[currentGender].get(rider) || [];
  // Sort rider event history by event year and month (newest first)
  const sortedHistory = [...history].sort((a, b) => {
    const v = getEventSortValue(b.event) - getEventSortValue(a.event);
    if (v !== 0) return v;
    return (a.event || '').localeCompare(b.event || '');
  });

  // Identify top-5 results by the decayed raw points (use the displayed `rawPoints` first)
  const scoreIndices = sortedHistory.map((e, i) => ({ i, score: (e.rawPoints ?? e.rawPointsBeforeDecay ?? 0) }));
  scoreIndices.sort((a, b) => b.score - a.score);
  const topN = 5;
  const topRankMap = Object.create(null); // index -> rank (1..topN)
  for (let j = 0; j < Math.min(topN, scoreIndices.length); j++) {
    topRankMap[scoreIndices[j].i] = j + 1;
  }
  profileName.textContent = rider;
  // Compute current Elo and rank from latest snapshot
  let eloText = '';
  try {
    const latestRows = globalRowsByGender[currentGender] || [];
    const sortedByElo = latestRows.slice().sort((a, b) => {
      const diff = (b.elo || 0) - (a.elo || 0);
      if (diff !== 0) return diff;
      return a.rider.localeCompare(b.rider);
    });
    const idx = sortedByElo.findIndex((r) => r.rider === rider);
    const rankText = idx >= 0 ? `#${idx + 1}` : '—';
    const eloVal = (latestRows.find((r) => r.rider === rider) || {}).elo ?? 0;
    eloText = ` — ELO: ${Math.round(eloVal)} (${rankText})`;
  } catch (e) {
    eloText = '';
  }
  profileSummary.textContent = `${history.length} event${history.length === 1 ? '' : 's'} competed${eloText}`;
  profileBody.innerHTML = '';

  if (notesInput) {
    notesInput.value = riderNotes[rider] || '';
    notesInput.placeholder = `Write notes for ${rider}...`;
  }

  const showRawPoints = settings.showPoints;
  profileHeader.innerHTML = `
    <tr>
      <th>Event</th>
      <th>Place</th>
      ${showRawPoints ? '<th>Raw points</th><th>Decay</th>' : ''}
    </tr>
  `;

  if (sortedHistory.length === 0) {
    const colspan = showRawPoints ? 4 : 2;
    profileBody.innerHTML = `<tr><td colspan="${colspan}" class="status">No event history available.</td></tr>`;
  } else {
    sortedHistory.forEach((entry, idx) => {
      const row = document.createElement('tr');
      const rawPointsCell = showRawPoints ? `<td>${(entry.rawPoints ?? 0).toFixed(2)}</td>` : '';
      const decayCell = showRawPoints ? `<td>×${((entry.decayMultiplier ?? 1)).toFixed(2)}</td>` : '';
      const rank = topRankMap[idx] || 0;
      // Highlight top-5 with a single red tint
      let bg = '';
      if (rank >= 1 && rank <= 5) bg = 'rgba(255,80,80,0.08)';
      const styleAttr = bg ? ` style="background:${bg};"` : '';
      row.innerHTML = `
        <td${styleAttr}>${entry.event}</td>
        <td${styleAttr}>${entry.place}</td>
        ${rawPointsCell}
        ${decayCell}
      `;
      profileBody.appendChild(row);
    });
  }

  currentProfileRider = rider;
  renderProfileBattleHistory(rider);

  profilePanel.classList.remove('hidden');
  profilePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Render placement evolution chart for this rider
  try {
    renderProfilePlacementChart(rider);
  } catch (e) {
    console.error('Error rendering profile chart', e);
  }
}

function renderProfilePlacementChart(rider) {
  const container = document.getElementById('profile-chart');
  if (!container) return;

  // Use precomputed rankingSnapshots (one per event, oldest->newest)
  const snaps = rankingSnapshots.slice().sort((a, b) => a.dateValue - b.dateValue);
  if (snaps.length === 0) {
    container.innerHTML = '<div class="status">No snapshot data available.</div>';
    return;
  }

  // For each snapshot, compute rider's world rank (1-based) or null if absent
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const points = snaps.map((s) => {
    const rows = s.rowsByGender[currentGender] || [];
    // Determine rank based on current 'elo' ordering (descending) rather than legacy points.
    const sortedByElo = rows.slice().sort((a, b) => {
      const diff = (b.elo || 0) - (a.elo || 0);
      if (diff !== 0) return diff;
      return a.rider.localeCompare(b.rider);
    });
    const idx = sortedByElo.findIndex((r) => r.rider === rider);
    const parsed = parseEventNameYearPrefix(s.event);
    const prefix = parsed.prefix || '';
    const year = parsed.year || s.snapshotYear || null;
    const monthVal = (EVENT_MONTHS && EVENT_MONTHS[prefix]) ? Number(EVENT_MONTHS[prefix]) : 0;
    const monthInt = monthVal ? Math.max(1, Math.min(12, Math.round(monthVal))) : 0;
    return { event: s.event, rank: idx >= 0 ? idx + 1 : null, dateValue: s.dateValue, year, monthInt };
  });

  const width = Math.max(300, container.clientWidth || 600);
  // increase height/top padding so year labels don't get cut off or overlap datapoints
  const height = 240;
  const padding = { top: 56, right: 18, bottom: 34, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const ranks = points.map((p) => p.rank).filter((v) => v != null);
  const maxRank = ranks.length > 0 ? Math.max(...ranks, 10) : 10;

  const xStep = points.length > 1 ? innerW / (points.length - 1) : innerW / 2;
  const yForRank = (rank) => {
    if (rank == null) return null;
    // rank 1 -> top (padding.top), rank maxRank -> bottom (padding.top+innerH)
    const t = (rank - 1) / (maxRank - 1 || 1);
    return padding.top + t * innerH;
  };

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="transparent"/>`;

  // grid lines y (1, mid, maxRank)
  const yLabels = [1, Math.ceil((maxRank + 1) / 2), maxRank];
  yLabels.forEach((lbl) => {
    const y = yForRank(lbl);
    if (y != null) {
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
      svg += `<text x="8" y="${y + 4}" fill="#cfeeff" font-size="11">${lbl}</text>`;
    }
  });

  // Build points with coordinates
  const pts = points.map((p, i) => {
    const x = padding.left + i * xStep;
    const y = yForRank(p.rank);
    return { x, y, p };
  });

  // Draw connecting lines for consecutive defined ranks
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (a.y != null && b.y != null) {
      svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#62c8ff" stroke-width="2" stroke-linecap="round"/>`;
    }
  }

  // Draw markers and labels
  pts.forEach((pt) => {
    const { x, y, p } = pt;
    if (y != null) {
      // include a <title> inside the circle for native SVG hover tooltip showing the event
      // add data-event and classes so we can style and attach click handlers after insertion
      svg += `<circle class="chart-point present" data-event="${escapeXml(p.event || '')}" data-rank="${p.rank ?? ''}" cx="${x}" cy="${y}" r="4" fill="#fff" stroke="#2b8cff" stroke-width="2"><title>${escapeXml(p.event || '')}</title></circle>`;
      svg += `<text x="${x}" y="${y - 8}" fill="#cfeeff" font-size="10" text-anchor="middle">${p.rank}</text>`;
    } else {
      // show a distinct, small hollow circle for missing rank (did not compete)
      const gy = padding.top + innerH / 2;
      const titleText = `Did not compete — ${escapeXml(p.event || '')}`;
      svg += `<g class="chart-point missing" data-event="${escapeXml(p.event || '')}" transform="translate(${x},${gy})">`;
      svg += `<title>${titleText}</title>`;
      svg += `<circle cx="0" cy="0" r="3" fill="none" stroke="#9aa6b3" stroke-width="1.25"/>`;
      svg += `</g>`;
    }
  });

  // x-axis month labels (one per snapshot)
  points.forEach((pt, i) => {
    const x = padding.left + i * xStep;
    const label = pt.monthInt ? monthNames[pt.monthInt - 1] : '';
    svg += `<text x="${x}" y="${height - 8}" fill="#95a7c7" font-size="11" text-anchor="middle">${label}</text>`;
  });

  // Year markers: draw a vertical line and year label once per year at the first snapshot for that year
  const yearsSeen = new Set();
  points.forEach((pt, i) => {
    const year = pt.year;
    if (!year) return;
    if (yearsSeen.has(year)) return;
    yearsSeen.add(year);
    const x = padding.left + i * xStep;
    // vertical marker
    svg += `<line x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
    // year label above chart (fixed higher to avoid colliding with rank-1 markers)
    svg += `<text x="${x}" y="14" fill="#cfeeff" font-size="12" font-weight="600" text-anchor="middle">${year}</text>`;
  });

  svg += `</svg>`;
  container.innerHTML = svg;

  // Attach click handlers to chart points so clicking opens the event view
  try {
    const pointsEls = container.querySelectorAll('.chart-point');
    pointsEls.forEach((el) => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', (ev) => {
        const evName = el.getAttribute('data-event');
        if (!evName) return;
        // close the rider profile panel if it's open
        try {
          const profilePanel = document.getElementById('profile-panel');
          if (profilePanel && !profilePanel.classList.contains('hidden')) {
            profilePanel.classList.add('hidden');
          }
        } catch (e) {
          // ignore
        }

        const viewSelect = document.getElementById('view-select');
        if (viewSelect) {
          // set the selector and render the event view
          viewSelect.value = evName;
        }
        try { setView(evName); } catch (e) { console.error('Error opening event from chart', e); }
      });
    });
  } catch (e) {
    // non-fatal: continue
  }

  // Create a floating tooltip element (one per chart container)
  try {
    let tooltip = container.querySelector('.profile-chart-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'profile-chart-tooltip';
      tooltip.style.display = 'none';
      container.appendChild(tooltip);
    }

    pointsEls.forEach((el) => {
      el.addEventListener('mouseenter', (ev) => {
        const evName = el.getAttribute('data-event') || '';
        const rank = el.getAttribute('data-rank');
        const isMissing = el.classList.contains('missing');
        tooltip.textContent = isMissing ? `Did not compete — ${evName}` : `${evName} — Rank ${rank || '?'} `;
        tooltip.style.display = 'block';
      });

      el.addEventListener('mousemove', (ev) => {
        const rect = container.getBoundingClientRect();
        // position tooltip slightly above cursor, constrained inside container
        const x = Math.min(rect.width - 160, Math.max(8, ev.clientX - rect.left + 8));
        const y = Math.max(8, ev.clientY - rect.top - 36);
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
      });

      el.addEventListener('mouseleave', () => {
        const tooltip = container.querySelector('.profile-chart-tooltip');
        if (tooltip) tooltip.style.display = 'none';
      });
    });
  } catch (e) {
    // ignore tooltip failures
  }
}

// Collect all rider names from in-memory data structures and rider notes.
function collectAllRiders() {
  const set = new Set();

  // From parsed event results
  for (const entriesByGender of eventResults.values()) {
    if (!entriesByGender) continue;
    for (const g of GENDERS) {
      const arr = entriesByGender[g] || [];
      arr.forEach((e) => e && e.rider && set.add(e.rider));
    }
  }

  // From rider history maps (covers any rider seen during scoring)
  for (const g of GENDERS) {
    for (const name of riderHistoryByGender[g].keys()) {
      set.add(name);
    }
  }

  // From rider notes
  Object.keys(riderNotes || {}).forEach((n) => set.add(n));

  return [...set].sort((a, b) => a.localeCompare(b));
}

// Create and download a text file listing all riders (one per line).
function exportRidersFile() {
  const names = collectAllRiders();
  const content = names.join('\r\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'riders_all.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Expose to console for convenience
window.exportRidersFile = exportRidersFile;

window.addEventListener('DOMContentLoaded', () => {
  applySettingsToDom();
  attachSettingsEvents();
  attachRiderNotesEvents();

  loadRanking().then(() => {
    populateYearSelector();
    // Refresh the view with the default year (2026) to show rank comparisons
    refreshRankingView();
  }).catch((error) => {
    const body = document.getElementById('ranking-body');
    if (body) {
      body.innerHTML = `<tr><td colspan="6" class="status">${error.message}</td></tr>`;
    }
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentSearch = searchInput.value.trim().toLowerCase();
      const viewSelect = document.getElementById('view-select');
      const activeView = viewSelect ? viewSelect.value : 'world';

      if (currentSearch) {
        const matchingEvent = EVENT_FILES.find((event) => event.name.toLowerCase().includes(currentSearch));
        if (matchingEvent && activeView !== matchingEvent.name) {
          if (viewSelect) {
            viewSelect.value = matchingEvent.name;
          }
          setView(matchingEvent.name);
          return;
        }
      }

      if (activeView === 'world') {
        renderWorldForYear(Number(currentYearComparison));
      } else {
        renderEvent(activeView);
      }
    });
  }

  const genderButton = document.getElementById('toggle-gender');
  if (genderButton) {
    genderButton.addEventListener('click', toggleGender);
  }

  updateGenderToggleText();

  const closeButton = document.getElementById('close-profile');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      const profilePanel = document.getElementById('profile-panel');
      if (profilePanel) {
        profilePanel.classList.add('hidden');
      }
    });
  }

  attachProfileSortButtons();
});

  // Global error handlers to surface runtime errors into the ranking table for debugging.
  window.addEventListener('error', (ev) => {
    try {
      const body = document.getElementById('ranking-body');
      if (body) {
        body.innerHTML = `<tr><td colspan="6" class="status">Runtime error: ${String(ev.error?.message || ev.message || ev.toString())}</td></tr>`;
      }
    } catch (e) {
      // ignore
    }
  });

  window.addEventListener('unhandledrejection', (ev) => {
    try {
      const body = document.getElementById('ranking-body');
      if (body) {
        body.innerHTML = `<tr><td colspan="6" class="status">Unhandled rejection: ${String(ev.reason?.message || ev.reason || ev.toString())}</td></tr>`;
      }
    } catch (e) {}
  });

// Try to load aliases from a file named `riders_all.txt` in project root.
async function loadAliasesFile() {
  try {
    const resp = await fetch('riders_all.txt');
    if (!resp.ok) return;
    const text = await resp.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    lines.forEach((line) => {
      // If a line contains comma-separated names, first name is canonical, others are aliases.
      const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length === 0) return;
      const canonical = parts[0];
      const normCanonical = normalizeName(canonical);
      // Map normalized canonical to canonical display name
      aliasMap.set(normCanonical, canonical);
      for (let i = 1; i < parts.length; i++) {
        aliasMap.set(normalizeName(parts[i]), canonical);
      }
    });
  } catch (e) {
    // ignore missing file or fetch errors
  }
}
