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
  { name: 'GUC26', file: 'event results/GUC26.txt', weight: 1.0 },

  { name: 'BUC24', file: 'event results/BUC24.txt', weight: 1.0 },
  { name: 'BUC25', file: 'event results/BUC25.txt', weight: 1.0 },
  { name: 'BUC23', file: 'event results/BUC23.txt', weight: 1.0},
  { name: 'BUC22', file: 'event results/BUC22.txt', weight: 1.0 }
];

const BEST_RESULT_MULTIPLIERS = [1,0.7,0.3,0.2,0.1];

// Given a list of { score, event } contributions, halve scores that aren't a rider's best
// result within the same event type (e.g. multiple GUC results), then sum the top 5
// (by penalized score) using BEST_RESULT_MULTIPLIERS. Mirrors the logic shown on the
// detailed rider points page so totals stay consistent everywhere.
function computeRiderTotalPoints(scoreEntries) {
  const bestByType = new Map();
  scoreEntries.forEach(({ score, event }) => {
    const { prefix } = parseEventNameYearPrefix(event);
    const typeKey = String(prefix || '').toLowerCase();
    if (!typeKey || typeKey === 'unicon') return;
    const currentBest = bestByType.get(typeKey);
    if (currentBest == null || score > currentBest) {
      bestByType.set(typeKey, score);
    }
  });

  const penalizedScores = scoreEntries.map(({ score, event }) => {
    const { prefix } = parseEventNameYearPrefix(event);
    const typeKey = String(prefix || '').toLowerCase();
    if (!typeKey || typeKey === 'unicon') return score;
    const bestForType = bestByType.get(typeKey);
    const penaltyMultiplier = (bestForType != null && score < (bestForType - 1e-9)) ? (2 / 3) : 1;
    return score * penaltyMultiplier;
  });

  const sortedScores = [...penalizedScores].sort((a, b) => b - a);
  return sortedScores.reduce((total, score, index) => total + score * (BEST_RESULT_MULTIPLIERS[index] ?? 0), 0);
}
const GENDERS = ['male', 'female'];
let currentGender = 'male';
let currentYearComparison = '2026'; // default to 2026
let globalRowsByGender = { male: [], female: [] };
let currentSort = { key: 'points', direction: 'desc' };
const riderPointsSort = { key: 'event', direction: 'desc' };
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

// Build a combined lookup of every ranked rider (both genders) for the given year,
// keyed by normalized name, including their overall rank (1 = best) within their gender's list.
function buildRiderRankLookup(year) {
  const lookup = new Map();
  GENDERS.forEach((gender) => {
    const rows = getRankingsForYear(year, gender);
    rows.forEach((entry, index) => {
      lookup.set(normalizeName(entry.rider), {
        name: entry.rider,
        rank: index + 1,
        gender,
        points: entry.points
      });
    });
  });
  return lookup;
}

// Parse a free-text block of pasted rider names (newline or comma separated) into a clean list.
function parseRiderNameList(text) {
  return String(text || '')
    .split(/[\r\n,]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

// Given a list of rider names, look up their current ranking and sort them
// lowest ranked (worst/highest rank number) first, highest ranked (rank 1) last.
// Unmatched names are returned separately so the caller can warn about them.
function sortRiderNamesByRanking(names, year) {
  const lookup = buildRiderRankLookup(year);
  const matched = [];
  const unmatched = [];

  names.forEach((rawName) => {
    const canonical = aliasMap.get(normalizeName(rawName)) || rawName;
    const entry = lookup.get(normalizeName(canonical));
    if (entry) {
      matched.push({ inputName: rawName, ...entry });
    } else {
      unmatched.push(rawName);
    }
  });

  matched.sort((a, b) => b.rank - a.rank);

  return { matched, unmatched };
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
  const loginOverlay = document.getElementById('login-overlay');
  const loginForm = document.getElementById('login-form');
  const loginUsernameInput = document.getElementById('login-username');
  const loginPasswordInput = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const loginCancelButton = document.getElementById('login-cancel');

  // Casual client-side gate only — credentials live in this file, so this is not real security.
  const SETTINGS_USERNAME = 'admin1';
  const SETTINGS_PASSWORD = 'test';
  let settingsAuthenticated = sessionStorage.getItem('settingsAuthenticated') === 'true';

  function openSettingsPanel() {
    if (!settingsPanel) return;
    settingsPanel.classList.remove('hidden');
    settingsPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showLoginModal() {
    if (!loginOverlay) return;
    loginOverlay.classList.remove('hidden');
    if (loginError) loginError.classList.add('hidden');
    if (loginUsernameInput) loginUsernameInput.value = '';
    if (loginPasswordInput) loginPasswordInput.value = '';
    if (loginUsernameInput) loginUsernameInput.focus();
  }

  function hideLoginModal() {
    if (loginOverlay) loginOverlay.classList.add('hidden');
  }

  if (openSettingsButton && settingsPanel) {
    openSettingsButton.addEventListener('click', () => {
      if (settingsAuthenticated) {
        openSettingsPanel();
      } else {
        showLoginModal();
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = loginUsernameInput ? loginUsernameInput.value.trim() : '';
      const password = loginPasswordInput ? loginPasswordInput.value : '';
      if (username === SETTINGS_USERNAME && password === SETTINGS_PASSWORD) {
        settingsAuthenticated = true;
        sessionStorage.setItem('settingsAuthenticated', 'true');
        hideLoginModal();
        openSettingsPanel();
      } else if (loginError) {
        loginError.classList.remove('hidden');
      }
    });
  }

  if (loginCancelButton) {
    loginCancelButton.addEventListener('click', hideLoginModal);
  }

  if (loginOverlay) {
    loginOverlay.addEventListener('click', (e) => {
      if (e.target === loginOverlay) hideLoginModal();
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

  // Show average event strength button
  const showEventStrengthBtn = document.getElementById('show-event-strength');
  const eventStrengthWrapper = document.getElementById('event-strength-wrapper');
  if (showEventStrengthBtn && eventStrengthWrapper) {
    showEventStrengthBtn.addEventListener('click', () => {
      const isHidden = eventStrengthWrapper.classList.contains('hidden');
      if (isHidden) {
        eventStrengthWrapper.classList.remove('hidden');
        renderEventStrengthList('male', 'event-strength-chart-male');
        renderEventStrengthList('female', 'event-strength-chart-female');
        renderEventStrengthSummary('male', 'event-strength-summary-male');
        renderEventStrengthSummary('female', 'event-strength-summary-female');
        showEventStrengthBtn.textContent = 'Hide average event strength';
      } else {
        eventStrengthWrapper.classList.add('hidden');
        showEventStrengthBtn.textContent = 'Show average event strength';
      }
    });
  }

  // Settings tabs (General / Tools)
  const tabButtons = Array.from(document.querySelectorAll('.settings-tab-button'));
  const tabPanels = Array.from(document.querySelectorAll('.settings-tab-panel'));
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      tabButtons.forEach((btn) => {
        const isActive = btn === button;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      tabPanels.forEach((panel) => {
        panel.classList.toggle('hidden', panel.getAttribute('data-tab-panel') !== targetTab);
      });
    });
  });

  // Rider list sorter: paste names, sort by current world ranking (lowest ranked first, highest last)
  const riderSortButton = document.getElementById('rider-sort-button');
  const riderSortInput = document.getElementById('rider-sort-input');
  const riderSortOutput = document.getElementById('rider-sort-output');
  const riderSortNote = document.getElementById('rider-sort-note');
  if (riderSortButton && riderSortInput && riderSortOutput) {
    riderSortButton.addEventListener('click', () => {
      const names = parseRiderNameList(riderSortInput.value);
      if (riderSortNote) {
        riderSortNote.classList.add('hidden');
        riderSortNote.textContent = '';
        riderSortNote.classList.remove('has-warnings');
      }
      if (names.length === 0) {
        riderSortOutput.value = '';
        if (riderSortNote) {
          riderSortNote.textContent = 'Paste at least one rider name first.';
          riderSortNote.classList.remove('hidden');
        }
        return;
      }

      const { matched, unmatched } = sortRiderNamesByRanking(names, Number(currentYearComparison));
      riderSortOutput.value = matched.map((entry) => entry.name).join('\n');

      if (unmatched.length > 0 && riderSortNote) {
        riderSortNote.textContent = `Not found in current rankings: ${unmatched.join(', ')}`;
        riderSortNote.classList.remove('hidden');
        riderSortNote.classList.add('has-warnings');
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

        stats.event_scores.push({ score: eventScore, event: event.name });
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

  GENDERS.forEach((gender) => {
    globalRowsByGender[gender] = [...ridersByGender[gender].entries()].map(([rider, stats]) => {
      const points = computeRiderTotalPoints(stats.event_scores);
      return { rider, ...stats, points };
    });

    globalRowsByGender[gender].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.podiums !== a.podiums) return b.podiums - a.podiums;
      return a.rider.localeCompare(b.rider);
    });
  });

  updateSummaryStats();
  populateViewSelector();
  setView('world');

  // After parsing all events, compute ranking snapshots (rankings after each past event)
  computeRankingSnapshots();
}

// Holds snapshots: array of { event, dateValue, rowsByGender: { male: [...], female: [...] } }
const rankingSnapshots = [];

function computeRankingSnapshots() {
  rankingSnapshots.length = 0;
  // Sort events oldest -> newest
  const eventsSortedAsc = [...EVENT_FILES].sort((a, b) => getEventSortValue(a.name) - getEventSortValue(b.name));
  // We'll accumulate raw contributions per rider (no decay applied yet) so snapshots can apply decay relative to the snapshot year.
  const contributions = { male: new Map(), female: new Map() };

  eventsSortedAsc.forEach((event) => {
    const snapshotYear = (() => {
      const m = String(event.name || '').match(/(\d{2})$/);
      return m ? 2000 + Number(m[1]) : new Date().getFullYear();
    })();
    const eventSortValue = getEventSortValue(event.name);

    const entriesByGender = eventResults.get(event.name) || { male: [], female: [] };

    // Compute each rider's points as of just BEFORE this event (using only strictly earlier
    // contributions, decayed relative to this event's year). Used for event strength stats.
    // Compare using month-aware sort values so events earlier in the same calendar year are
    // correctly treated as "before" (year-only comparison would wrongly exclude them).
    const preEventPointsByGender = { male: new Map(), female: new Map() };
    GENDERS.forEach((gender) => {
      contributions[gender].forEach((contribs, rider) => {
        const decayedScores = contribs.map((c) => {
          const years = Math.max(0, snapshotYear - c.eventYear);
          const mult = Math.pow(seasondecay, years);
          return { score: c.valueBase * mult, eventYear: c.eventYear, eventName: c.eventName, eventSortValue: getEventSortValue(c.eventName) };
        });
        const visible = decayedScores.filter((d) => d.eventSortValue < eventSortValue);
        if (visible.length === 0) return;
        const points = computeRiderTotalPoints(visible.map((d) => ({ score: d.score, event: d.eventName })));
        preEventPointsByGender[gender].set(rider, points);
      });
    });

    GENDERS.forEach((gender) => {
      const entries = entriesByGender[gender] || [];
      const competitorCount = entries.length;
      // Compute exponent so top place -> 100 points and last place -> 15 points
      const exponent = competitorCount > 1 ? Math.log(100 / 15) / Math.log(competitorCount) : 1;

      entries.forEach((entry) => {
        const name = entry.rider;
        const place = entry.place;
        const basePoints = Math.max(15, 100 / Math.pow(place, exponent));
        const valueBase = basePoints * event.weight; // pre-decay value
        if (!contributions[gender].has(name)) contributions[gender].set(name, []);
        contributions[gender].get(name).push({ valueBase, eventYear: entry.eventYear || snapshotYear, place, eventName: event.name });
      });
    });

    // Build snapshot for this event: apply decay only to contributions where eventYear < snapshotYear
    const rowsByGender = { male: [], female: [] };
    GENDERS.forEach((gender) => {
      contributions[gender].forEach((contribs, rider) => {
        // compute decayed scores for contribs up to current snapshot
        const decayedScores = contribs.map((c) => {
          const applyDecay = c.eventYear < snapshotYear;
          const years = applyDecay ? (snapshotYear - c.eventYear) : 0;
          const mult = applyDecay ? Math.pow(seasondecay, years) : 1;
          return { score: c.valueBase * mult, place: c.place, eventYear: c.eventYear, eventName: c.eventName };
        });

        // only include contributions that occurred at or before this snapshot event (eventYear <= snapshotYear)
        const visible = decayedScores.filter((d) => d.eventYear <= snapshotYear);
        if (visible.length === 0) return; // skip riders with no data yet

        const points = computeRiderTotalPoints(visible.map((d) => ({ score: d.score, event: d.eventName })));

        const wins = visible.filter((d) => d.place === 1).length;
        const podiums = visible.filter((d) => d.place <= 3).length;
        const battles = (riderBattlesByGender[gender].get(rider) || []).filter((b) => {
          // include battles that occurred at or before this snapshot: we don't store battle year, so approximate by event index inclusion
          return true;
        }).length;

        rowsByGender[gender].push({ rider, points, events: visible.length, wins, podiums, battles });
      });

      rowsByGender[gender].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.podiums !== a.podiums) return b.podiums - a.podiums;
        return a.rider.localeCompare(b.rider);
      });
    });

    rankingSnapshots.push({ event: event.name, dateValue: getEventSortValue(event.name), rowsByGender, snapshotYear, preEventPointsByGender });
  });
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
    const nextView = event.target.value;
    navigateToRoute({
      view: nextView,
      gender: currentGender,
      year: currentYearComparison
    });
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

function isKnownEvent(eventName) {
  return EVENT_FILES.some((entry) => entry.name === eventName);
}

function applyRouteQueryParams(params, route) {
  const requestedView = route && route.view ? route.view : 'world';

  if (requestedView === 'world') {
    params.set('view', 'world');
    params.delete('event');
  } else {
    params.set('view', 'event');
    params.set('event', requestedView);
  }

  if (route && route.rider) {
    params.set('rider', route.rider);
  } else {
    params.delete('rider');
  }

  if (route && (route.gender === 'male' || route.gender === 'female')) {
    params.set('gender', route.gender);
  } else {
    params.delete('gender');
  }

  if (route && route.year && /^\d{4}$/.test(String(route.year))) {
    params.set('year', String(route.year));
  } else {
    params.delete('year');
  }
}

function getCurrentViewSelection() {
  const viewSelect = document.getElementById('view-select');
  return viewSelect ? viewSelect.value : 'world';
}

function readRouteFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const eventParam = params.get('event');
  const viewParam = params.get('view');
  const riderParam = params.get('rider');
  const genderParam = params.get('gender');
  const yearParam = params.get('year');

  let view = 'world';
  if (viewParam === 'event' && eventParam && isKnownEvent(eventParam)) {
    view = eventParam;
  } else if (viewParam !== 'world' && eventParam && isKnownEvent(eventParam)) {
    view = eventParam;
  }

  return {
    view,
    rider: riderParam ? riderParam.trim() : '',
    gender: (genderParam === 'male' || genderParam === 'female') ? genderParam : null,
    year: yearParam && /^\d{4}$/.test(yearParam) ? yearParam : null
  };
}

function buildRouteUrl(route) {
  const url = new URL(window.location.href);
  applyRouteQueryParams(url.searchParams, route);

  return url.toString();
}

function buildIndexRouteUrl(route) {
  const url = new URL('index.html', window.location.href);
  applyRouteQueryParams(url.searchParams, route);
  return url.toString();
}

function buildRiderPointsUrl(rider, route) {
  const url = new URL('rider_points.html', window.location.href);
  if (rider) {
    url.searchParams.set('rider', rider);
  }

  if (route && (route.gender === 'male' || route.gender === 'female')) {
    url.searchParams.set('gender', route.gender);
  }
  if (route && route.year && /^\d{4}$/.test(String(route.year))) {
    url.searchParams.set('year', String(route.year));
  }
  if (route && route.view) {
    if (route.view === 'world') {
      url.searchParams.set('view', 'world');
      url.searchParams.delete('event');
    } else {
      url.searchParams.set('view', 'event');
      url.searchParams.set('event', route.view);
    }
  }

  return url.toString();
}

function navigateToRoute(route) {
  window.location.href = buildRouteUrl(route);
}

function applyRouteFromUrl() {
  const route = readRouteFromUrl();
  const availableYears = getAvailableYears().map((year) => String(year));

  if (route.gender) {
    currentGender = route.gender;
  }

  if (route.year && availableYears.includes(route.year)) {
    currentYearComparison = route.year;
  }

  updateGenderToggleText();

  const yearSelect = document.getElementById('year-select');
  if (yearSelect && availableYears.includes(currentYearComparison)) {
    yearSelect.value = currentYearComparison;
  }

  const viewSelect = document.getElementById('view-select');
  if (viewSelect) {
    viewSelect.value = route.view;
  }

  setView(route.view);

  if (route.rider) {
    showRiderProfile(route.rider);
  } else {
    setRankingPanelVisibility(true);
  }
}

function setRankingPanelVisibility(isVisible) {
  const rankingPanel = document.getElementById('ranking-panel');
  if (!rankingPanel) return;
  rankingPanel.classList.toggle('hidden', !isVisible);
}

function resolveRiderNameForGender(name, gender) {
  if (!name) return '';
  const direct = riderHistoryByGender[gender].get(name);
  if (direct) return name;

  const canonical = aliasMap.get(normalizeName(name));
  if (canonical && riderHistoryByGender[gender].has(canonical)) {
    return canonical;
  }

  const normalizedTarget = normalizeName(name);
  for (const riderName of riderHistoryByGender[gender].keys()) {
    if (normalizeName(riderName) === normalizedTarget) {
      return riderName;
    }
  }

  return name;
}

function compareRiderPointsEntries(a, b, key) {
  if (key === 'event') {
    const sortByEvent = getEventSortValue(a.event) - getEventSortValue(b.event);
    if (sortByEvent !== 0) return sortByEvent;
    return String(a.event || '').localeCompare(String(b.event || ''));
  }

  const numericDiff = Number(a[key] || 0) - Number(b[key] || 0);
  if (numericDiff !== 0) return numericDiff;

  const tieBreakEvent = getEventSortValue(a.event) - getEventSortValue(b.event);
  if (tieBreakEvent !== 0) return tieBreakEvent;
  return String(a.event || '').localeCompare(String(b.event || ''));
}

function renderRiderPointsPage() {
  const title = document.getElementById('rider-points-title');
  const summary = document.getElementById('rider-points-summary');
  const body = document.getElementById('rider-points-body');
  const backLink = document.getElementById('rider-points-back-link');
  if (!title || !summary || !body || !backLink) return;

  const route = readRouteFromUrl();
  const availableYears = getAvailableYears().map((year) => String(year));

  if (route.gender) {
    currentGender = route.gender;
  }
  if (route.year && availableYears.includes(route.year)) {
    currentYearComparison = route.year;
  }

  const rider = resolveRiderNameForGender(route.rider, currentGender);
  backLink.href = buildIndexRouteUrl({
    view: route.view,
    rider,
    gender: currentGender,
    year: currentYearComparison
  });

  if (!rider) {
    title.textContent = 'Rider points details';
    summary.textContent = 'No rider selected.';
    body.innerHTML = '<tr><td colspan="9" class="status">Open a rider profile first, then click "Detailed ranking points".</td></tr>';
    return;
  }

  const history = riderHistoryByGender[currentGender].get(rider) || [];
  title.textContent = `${rider} — detailed ranking points`;

  let timeCutoff = null;
  if (route.view && route.view !== 'world' && isKnownEvent(route.view)) {
    timeCutoff = getEventSortValue(route.view);
  } else if (route.year && /^\d{4}$/.test(route.year)) {
    timeCutoff = Number(route.year) * 12 + 12;
  }

  const visibleHistory = timeCutoff == null
    ? history
    : history.filter((entry) => getEventSortValue(entry.event) <= timeCutoff);

  if (visibleHistory.length === 0) {
    summary.textContent = 'No event history available.';
    body.innerHTML = '<tr><td colspan="9" class="status">No event history available.</td></tr>';
    return;
  }

  // Decay should be relative to the year being viewed (not the real current year), so that
  // looking at a past snapshot only decays events that were already older than that snapshot.
  const referenceYear = route.year && /^\d{4}$/.test(route.year)
    ? Number(route.year)
    : (timeCutoff == null ? new Date().getFullYear() : getEventFullYear(route.view));

  const detailedEntries = visibleHistory.map((entry, sourceIndex) => {
    const rawPointsBeforeDecay = Number(entry.rawPointsBeforeDecay ?? 0);
    const eventYear = entry.eventYear;
    const yearsOfDecay = eventYear ? Math.max(0, referenceYear - eventYear) : 0;
    const decayMultiplier = Math.pow(seasondecay, yearsOfDecay);
    const decayedPoints = rawPointsBeforeDecay * decayMultiplier;
    return {
      ...entry,
      sourceIndex,
      points: Number(entry.weight) > 0 ? rawPointsBeforeDecay / Number(entry.weight) : rawPointsBeforeDecay,
      rawPoints: rawPointsBeforeDecay,
      decayedPoints,
      decay: decayMultiplier
    };
  });

  const bestDecayedByType = new Map();
  detailedEntries.forEach((entry) => {
    const { prefix } = parseEventNameYearPrefix(entry.event);
    const typeKey = String(prefix || '').toLowerCase();
    if (!typeKey || typeKey === 'unicon') return;
    const currentBest = bestDecayedByType.get(typeKey);
    if (currentBest == null || entry.decayedPoints > currentBest) {
      bestDecayedByType.set(typeKey, entry.decayedPoints);
    }
  });

  detailedEntries.forEach((entry) => {
    const { prefix } = parseEventNameYearPrefix(entry.event);
    const typeKey = String(prefix || '').toLowerCase();
    if (!typeKey || typeKey === 'unicon') {
      entry.typePenaltyMultiplier = 1;
    } else {
      const bestForType = bestDecayedByType.get(typeKey);
      entry.typePenaltyMultiplier = (bestForType != null && entry.decayedPoints < (bestForType - 1e-9)) ? (2 / 3) : 1;
    }
    entry.penalizedDecayedPoints = entry.decayedPoints * entry.typePenaltyMultiplier;
  });

  const scoreOrder = detailedEntries
    .map((entry) => ({ sourceIndex: entry.sourceIndex, score: entry.penalizedDecayedPoints }))
    .sort((a, b) => b.score - a.score);
  const multiplierBySourceIndex = new Map();
  scoreOrder.forEach((entry, index) => {
    multiplierBySourceIndex.set(entry.sourceIndex, BEST_RESULT_MULTIPLIERS[index] ?? 0);
  });

  detailedEntries.forEach((entry) => {
    const multiplier = multiplierBySourceIndex.get(entry.sourceIndex) ?? 0;
    entry.bestFiveMultiplier = multiplier;
    entry.countedPoints = entry.penalizedDecayedPoints * multiplier;
  });

  const sortedEntries = [...detailedEntries].sort((a, b) => {
    const result = compareRiderPointsEntries(a, b, riderPointsSort.key);
    return riderPointsSort.direction === 'asc' ? result : -result;
  });

  body.innerHTML = '';
  let totalCounted = 0;
  sortedEntries.forEach((entry) => {
    totalCounted += entry.countedPoints;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><button class="rider-link rider-points-event-link" data-event="${entry.event}">${entry.event}</button></td>
      <td>${entry.place}</td>
      <td>${entry.points.toFixed(2)}</td>
      <td>${entry.rawPoints.toFixed(2)}</td>
      <td>×${entry.decay.toFixed(2)}</td>
      <td>${entry.decayedPoints.toFixed(2)}</td>
      <td>×${entry.typePenaltyMultiplier.toFixed(2)}</td>
      <td>×${entry.bestFiveMultiplier.toFixed(2)}</td>
      <td>${entry.countedPoints.toFixed(2)}</td>
    `;
    body.appendChild(row);
  });

  summary.textContent = `${visibleHistory.length} events. Weighted total with type penalty: ${totalCounted.toFixed(2)} points (${currentGender} view, ${currentYearComparison}).`;

  document.querySelectorAll('.rider-points-event-link').forEach((button) => {
    button.addEventListener('click', () => {
      const eventName = button.getAttribute('data-event');
      if (!eventName) return;
      window.location.href = buildIndexRouteUrl({
        view: eventName,
        gender: currentGender,
        year: currentYearComparison
      });
    });
  });

  document.querySelectorAll('.rider-points-sort-button').forEach((button) => {
    if (button.dataset.bound === '1') return;
    button.dataset.bound = '1';
    button.addEventListener('click', () => {
      const key = button.getAttribute('data-key');
      if (!key) return;
      if (riderPointsSort.key === key) {
        riderPointsSort.direction = riderPointsSort.direction === 'desc' ? 'asc' : 'desc';
      } else {
        riderPointsSort.key = key;
        riderPointsSort.direction = 'desc';
      }
      renderRiderPointsPage();
    });
  });
}

function setView(view) {
  const title = document.getElementById('ranking-title');
  const description = document.getElementById('ranking-description');
  if (!title || !description) return;
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
          return `<td>${entry.points.toFixed(2)}</td>`;
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
          return `<td>${entry.points.toFixed(2)}</td>`;
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
        navigateToRoute({
          view: getCurrentViewSelection(),
          rider,
          gender: currentGender,
          year: currentYearComparison
        });
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
    profileBattleBody.innerHTML = `<tr><td colspan="4" class="status">No battle history available.</td></tr>`;
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

    row.innerHTML = `
      <td>${battle.event}</td>
      <td>${battle.round}</td>
      <td>${battle.opponent}</td>
      <td class="${resultClass}">${battle.result}</td>
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

function getProfileEventColumnCount(eventCount) {
  if (eventCount >= 24) return 3;
  if (eventCount >= 12) return 2;
  return 1;
}

function showRiderProfile(rider) {
  const profilePanel = document.getElementById('profile-panel');
  const profileName = document.getElementById('profile-name');
  const profileSummary = document.getElementById('profile-summary');
  const profileBody = document.getElementById('profile-body');
  const profileHeader = document.querySelector('#profile-body')?.closest('table')?.querySelector('thead');
  const profileEventsTable = document.getElementById('profile-events-table');
  const notesInput = document.getElementById('rider-notes-input');

  if (!profilePanel || !profileName || !profileSummary || !profileBody || !profileHeader) return;

  const resolvedRider = resolveRiderNameForGender(rider, currentGender);
  const history = riderHistoryByGender[currentGender].get(resolvedRider) || [];
  // Sort rider event history by event year and month (newest first)
  const sortedHistory = [...history].sort((a, b) => {
    const v = getEventSortValue(b.event) - getEventSortValue(a.event);
    if (v !== 0) return v;
    return (a.event || '').localeCompare(b.event || '');
  });

  profileName.textContent = resolvedRider;
  profileSummary.textContent = `${history.length} event${history.length === 1 ? '' : 's'} competed`;
  profileBody.innerHTML = '';

  const detailedPointsLink = document.getElementById('profile-points-link');
  if (detailedPointsLink) {
    detailedPointsLink.href = buildRiderPointsUrl(resolvedRider, {
      view: getCurrentViewSelection(),
      gender: currentGender,
      year: currentYearComparison
    });
  }

  if (notesInput) {
    notesInput.value = riderNotes[resolvedRider] || '';
    notesInput.placeholder = `Write notes for ${resolvedRider}...`;
  }

  const eventColumnCount = getProfileEventColumnCount(sortedHistory.length);
  if (profileEventsTable) {
    profileEventsTable.style.setProperty('--profile-total-columns', String(eventColumnCount * 2));
  }
  const headerCells = [];
  for (let i = 0; i < eventColumnCount; i++) {
    headerCells.push('<th>Event</th><th class="profile-place-header">Place</th>');
  }
  profileHeader.innerHTML = `<tr>${headerCells.join('')}</tr>`;

  if (sortedHistory.length === 0) {
    profileBody.innerHTML = `<tr><td colspan="${eventColumnCount * 2}" class="status">No event history available.</td></tr>`;
  } else {
    const rowsPerColumn = Math.ceil(sortedHistory.length / eventColumnCount);
    for (let rowIndex = 0; rowIndex < rowsPerColumn; rowIndex++) {
      const row = document.createElement('tr');
      for (let col = 0; col < eventColumnCount; col++) {
        const entryIndex = col * rowsPerColumn + rowIndex;
        const entry = sortedHistory[entryIndex];
        if (!entry) {
          row.innerHTML += '<td class="profile-empty-cell"></td><td class="profile-empty-cell"></td>';
          continue;
        }
        const placeClass = entry.place === 1
          ? 'podium-gold'
          : entry.place === 2
            ? 'podium-silver'
            : entry.place === 3
              ? 'podium-bronze'
              : '';
        row.innerHTML += `
          <td><button class="rider-link profile-event-link" data-event="${entry.event}">${entry.event}</button></td>
          <td class="profile-place-cell ${placeClass}">${entry.place}</td>
        `;
      }
      profileBody.appendChild(row);
    }

    document.querySelectorAll('.profile-event-link').forEach((button) => {
      button.addEventListener('click', () => {
        const eventName = button.getAttribute('data-event');
        if (!eventName) return;
        navigateToRoute({
          view: eventName,
          gender: currentGender,
          year: currentYearComparison
        });
      });
    });
  }

  currentProfileRider = resolvedRider;
  renderProfileBattleHistory(resolvedRider);
  setRankingPanelVisibility(false);

  profilePanel.classList.remove('hidden');
  profilePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    renderProfilePlacementChart(resolvedRider);
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
    const idx = rows.findIndex((r) => r.rider === rider);
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

  // Year markers: draw all labels; scale text down when years are dense.
  const yearsSeen = new Set();
  const yearMarkers = [];
  points.forEach((pt, i) => {
    const year = pt.year;
    if (!year) return;
    if (yearsSeen.has(year)) return;
    yearsSeen.add(year);
    const x = padding.left + i * xStep;
    yearMarkers.push({ year, x });
  });

  let minYearGap = Number.POSITIVE_INFINITY;
  for (let i = 1; i < yearMarkers.length; i++) {
    const gap = yearMarkers[i].x - yearMarkers[i - 1].x;
    if (gap < minYearGap) minYearGap = gap;
  }
  const computedYearFontSize = Number.isFinite(minYearGap)
    ? Math.max(6, Math.min(12, (minYearGap - 4) / 1.25))
    : 12;

  yearMarkers.forEach((marker) => {
    // vertical marker
    svg += `<line x1="${marker.x}" y1="${padding.top}" x2="${marker.x}" y2="${height - padding.bottom}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
    const shortYear = String(marker.year).slice(-2);
    svg += `<text x="${marker.x}" y="14" fill="#cfeeff" font-size="${computedYearFontSize.toFixed(1)}" font-weight="600" text-anchor="middle">${shortYear}</text>`;
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
          viewSelect.value = evName;
        }
        navigateToRoute({
          view: evName,
          gender: currentGender,
          year: currentYearComparison
        });
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

// Compute, for every event (oldest -> newest) and a given gender, the sum of the world
// ranking points held by each competing rider immediately BEFORE that event. Points are
// decayed relative to the event's own year using only strictly earlier contributions
// (see preEventPointsByGender in computeRankingSnapshots), not the live/current-year totals.
function computeEventStrengthSeries(gender) {
  const snaps = rankingSnapshots.slice().sort((a, b) => a.dateValue - b.dateValue);
  return snaps.map((snap) => {
    const priorPointsByRider = snap.preEventPointsByGender ? snap.preEventPointsByGender[gender] : new Map();

    const entriesByGender = eventResults.get(snap.event) || { male: [], female: [] };
    const entries = entriesByGender[gender] || [];
    const strength = entries.reduce((total, entry) => total + (priorPointsByRider.get(entry.rider) || 0), 0);

    const parsed = parseEventNameYearPrefix(snap.event);
    const prefix = parsed.prefix || '';
    const year = parsed.year || snap.snapshotYear || null;
    const monthVal = (EVENT_MONTHS && EVENT_MONTHS[prefix]) ? Number(EVENT_MONTHS[prefix]) : 0;
    const monthInt = monthVal ? Math.max(1, Math.min(12, Math.round(monthVal))) : 0;

    return { event: snap.event, dateValue: snap.dateValue, year, monthInt, strength, competitorCount: entries.length };
  });
}

// Types that use a trailing average of the last 2 events instead of the last 3.
const TRAILING_AVERAGE_WINDOW_OVERRIDES = { unicon: 2, eucs: 2 };

// Group the per-event strength series by event type (prefix) and year, compute a trailing
// average of summed strength over the last N events of that type (N=2 for Unicon/EUCS,
// N=3 otherwise), then sort each type's events by that trailing average (descending).
function computeEventStrengthByType(gender) {
  const series = computeEventStrengthSeries(gender);
  const byType = new Map();
  series.forEach((entry) => {
    const parsed = parseEventNameYearPrefix(entry.event);
    const typeKey = parsed.prefix || entry.event;
    if (!byType.has(typeKey)) byType.set(typeKey, []);
    byType.get(typeKey).push(entry);
  });

  return [...byType.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([typeKey, entries]) => {
      // Chronological order is required to compute a meaningful trailing average.
      const chronological = entries.slice().sort((a, b) => a.dateValue - b.dateValue);
      const windowSize = TRAILING_AVERAGE_WINDOW_OVERRIDES[typeKey.toLowerCase()] ?? 3;

      const withTrailingAverage = chronological.map((entry, index) => {
        const windowEntries = chronological.slice(Math.max(0, index - windowSize + 1), index + 1);
        const trailingAverage = windowEntries.reduce((total, e) => total + e.strength, 0) / windowEntries.length;
        return { ...entry, trailingAverage };
      });

      return {
        type: typeKey,
        entries: withTrailingAverage.slice().sort((a, b) => b.trailingAverage - a.trailingAverage)
      };
    });
}

function renderEventStrengthList(gender, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const groups = computeEventStrengthByType(gender);
  if (groups.length === 0) {
    container.innerHTML = '<div class="status">No snapshot data available.</div>';
    return;
  }

  let html = '<table class="event-strength-table"><thead><tr><th>Event type</th><th>Year</th><th>Strength (sum)</th><th>Strength (avg)</th><th>Riders</th><th>Trailing avg</th></tr></thead><tbody>';
  groups.forEach((group) => {
    group.entries.forEach((entry, i) => {
      const average = entry.competitorCount > 0 ? entry.strength / entry.competitorCount : 0;
      html += `<tr>`;
      html += i === 0 ? `<td rowspan="${group.entries.length}">${escapeXml(group.type)}</td>` : '';
      html += `<td>${entry.year || ''}</td>`;
      html += `<td>${entry.strength.toFixed(1)}</td>`;
      html += `<td>${average.toFixed(1)}</td>`;
      html += `<td>${entry.competitorCount}</td>`;
      html += `<td>${entry.trailingAverage.toFixed(1)}</td>`;
      html += `</tr>`;
    });
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

// For each event type, find the trailing average as of the most recent event of that type.
function computeCurrentTrailingAverages(gender) {
  const groups = computeEventStrengthByType(gender);
  return groups.map((group) => {
    const mostRecent = group.entries.reduce((latest, e) => (latest == null || e.dateValue > latest.dateValue ? e : latest), null);
    return { type: group.type, trailingAverage: mostRecent ? mostRecent.trailingAverage : 0, latestEvent: mostRecent ? mostRecent.event : '' };
  });
}

function renderEventStrengthSummary(gender, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const averages = computeCurrentTrailingAverages(gender).sort((a, b) => b.trailingAverage - a.trailingAverage);

  if (averages.length === 0) {
    container.innerHTML = '<div class="status">No snapshot data available.</div>';
    return;
  }

  let html = '<table class="event-strength-table"><thead><tr><th>Event type</th><th>Latest event</th><th>Trailing avg</th></tr></thead><tbody>';
  averages.forEach((entry) => {
    html += `<tr>`;
    html += `<td>${escapeXml(entry.type)}</td>`;
    html += `<td>${escapeXml(entry.latestEvent)}</td>`;
    html += `<td>${entry.trailingAverage.toFixed(1)}</td>`;
    html += `</tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
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
    if (document.getElementById('rider-points-body')) {
      renderRiderPointsPage();
      return;
    }

    populateYearSelector();
    applyRouteFromUrl();
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
          navigateToRoute({
            view: matchingEvent.name,
            gender: currentGender,
            year: currentYearComparison
          });
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
      const route = readRouteFromUrl();
      if (route.rider) {
        navigateToRoute({
          view: getCurrentViewSelection(),
          gender: currentGender,
          year: currentYearComparison
        });
      } else {
        const profilePanel = document.getElementById('profile-panel');
        if (profilePanel) {
          profilePanel.classList.add('hidden');
        }
        setRankingPanelVisibility(true);
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
