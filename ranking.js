// Scoring tunables; overwritten from saved settings by applyScoringSettings().
let seasondecay = 0.9;
let yearDecay = 0.9;
let regionPenalty = 0.8;
let minPlacePoints = 15;
let scalingMode = 'power';
let scalingPower = 5;
let customFormulaText = '100 * ((n - rank + 1) / n) ** 2';
let customFormulaFn = null;

// Compiles a formula in rank and n; only numbers, operators and whitelisted Math functions are allowed.
function compileCustomFormula(text) {
  const source = String(text || '').trim().replace(/\^/g, '**');
  if (!source || source.length > 300) return null;
  const mathNames = ['abs', 'min', 'max', 'pow', 'sqrt', 'exp', 'log', 'log2', 'log10', 'floor', 'ceil', 'round', 'sin', 'cos', 'tan', 'PI', 'E'];
  const stripped = source.replace(/\bMath\.([A-Za-z0-9]+)/g, (m, name) => (mathNames.includes(name) ? ' ' : '#'));
  if (!/^[\s\d.+\-*/%(),]*$/.test(stripped.replace(/\b(rank|n)\b/g, ' ').replace(/\*\*/g, ' '))) return null;
  try {
    const fn = new Function('rank', 'n', `"use strict"; return (${source});`);
    const probe = fn(1, 10);
    return Number.isFinite(probe) ? fn : null;
  } catch (error) {
    return null;
  }
}
let battleWeight = 1;
const currentyear = 26;
const Unicon = 7.5;
const GUC = 6.5;
const EUCS = 7.5;
const NAUCC = 7;
const EUCW = 2.5;
const BUC = 10;
const CFM = 10.5;
const LAUCC = 1;
const ROC = 0.5;
const JUC = 10.3;
const UFO = 0.5;  

const UNICON_WEIGHT = 4;
const STREET_UNICON_WEIGHT = 3;
const National_WEIGHT = 2;  
const Continental_WEIGHT = 3; 
const Local_WEIGHT = 1;

// Map event code -> typical month (decimal allowed, e.g. 7.5)
const EVENT_MONTHS = {
  Unicon: Number(Unicon) || 0,
  GUC: Number(GUC) || 0,
  EUCS: Number(EUCS) || 0,
  NAUCC: Number(NAUCC) || 0,
  EUCW: Number(EUCW) || 0,
  ROC: Number(ROC) || 0,
  BUC: Number(BUC) || 0,
  CFM: Number(CFM) || 0,
  JUC: Number(JUC) || 0,
  LAUCC: Number(LAUCC) || 0,
   UFO: Number(UFO) || 0,
};

// Optional region per event: '' (unknown) or one of EVENT_REGIONS. Fill in region: '' on any event below.
const EVENT_REGIONS = ['NA', 'SA', 'EU', 'AS', 'AF', 'AU'];

const FLATLAND_EVENT_FILES = [
  { name: 'Unicon24', file: 'Flatland/Unicon24.txt', weight: UNICON_WEIGHT, region: 'NA' },
  { name: 'Unicon26', file: 'Flatland/Unicon26.txt', weight: UNICON_WEIGHT, region: 'EU' },
  { name: 'Unicon22', file: 'Flatland/Unicon22.txt', weight: UNICON_WEIGHT, region: 'EU' },
  { name: 'Unicon18', file: 'Flatland/Unicon18.txt', weight: UNICON_WEIGHT, region: 'AS' },
  { name: 'Unicon16', file: 'Flatland/Unicon16.txt', weight: UNICON_WEIGHT, region: 'EU' },
  { name: 'Unicon14', file: 'Flatland/Unicon14.txt', weight: UNICON_WEIGHT, region: 'NA' },
  { name: 'Unicon12', file: 'Flatland/Unicon12.txt', weight: UNICON_WEIGHT, region: 'EU' },
  { name: 'Unicon10', file: 'Flatland/Unicon10.txt', weight: UNICON_WEIGHT, region: 'AU' },
  { name: 'Unicon08', file: 'Flatland/Unicon08.txt', weight: UNICON_WEIGHT, region: 'EU' },


  { name: 'EUCW26', file: 'Flatland/EUCW26.txt', weight: Continental_WEIGHT, region: 'EU' },
  { name: 'EUCW25', file: 'Flatland/EUCW25.txt', weight: Continental_WEIGHT, region: 'EU' },
  { name: 'EUCW24', file: 'Flatland/EUCW24.txt', weight: Continental_WEIGHT, region: 'EU' },
  { name: 'EUCW20', file: 'Flatland/EUCW20.txt', weight: Continental_WEIGHT, region: 'EU' },
  { name: 'EUCW19', file: 'Flatland/EUCW19.txt', weight: Continental_WEIGHT, region: 'EU' },
  { name: 'EUCW18', file: 'Flatland/EUCW18.txt', weight: Continental_WEIGHT, region: 'EU' },
  { name: 'EUCW17', file: 'Flatland/EUCW17.txt', weight: Continental_WEIGHT, region: 'EU' },
  { name: 'EUCW16', file: 'Flatland/EUCW16.txt', weight: Continental_WEIGHT, region: 'EU' },
  { name: 'EUCW14', file: 'Flatland/EUCW14.txt', weight: Continental_WEIGHT, region: 'EU' },
   

  { name: 'EUCS23', file: 'Flatland/EUCS23.txt', weight: Continental_WEIGHT, region: 'EU' },
  { name: 'EUCS25', file: 'Flatland/EUCS25.txt', weight: Continental_WEIGHT, region: 'EU' },
  { name: 'EUCS15', file: 'Flatland/EUCS15.txt', weight: Continental_WEIGHT, region: 'EU ' },

    { name: 'CFM26', file: 'Flatland/CFM26.txt', weight: National_WEIGHT, region: 'EU' },
  { name: 'CFM25', file: 'Flatland/CFM25.txt', weight: National_WEIGHT, region: 'EU' },
  { name: 'CFM24', file: 'Flatland/CFM24.txt', weight: National_WEIGHT, region: 'EU' },

  { name: 'NAUCC26', file: 'Flatland/NAUCC26.txt', weight: Continental_WEIGHT, region: 'NA' },
  { name: 'NAUCC25', file: 'Flatland/NAUCC25.txt', weight: Continental_WEIGHT, region: 'NA' },
  { name: 'NAUCC23', file: 'Flatland/NAUCC23.txt', weight: Continental_WEIGHT, region: 'NA' },
  { name: 'NAUCC22', file: 'Flatland/NAUCC22.txt', weight: Continental_WEIGHT, region: 'NA' },
  { name: 'NAUCC19', file: 'Flatland/NAUCC19.txt', weight: Continental_WEIGHT, region: 'NA' },
  { name: 'NAUCC18', file: 'Flatland/NAUCC18.txt', weight: Continental_WEIGHT, region: 'NA' },
  { name: 'NAUCC17', file: 'Flatland/NAUCC17.txt', weight: Continental_WEIGHT, region: 'NA' },
  { name: 'NAUCC16', file: 'Flatland/NAUCC16.txt', weight: Continental_WEIGHT, region: 'NA' },
  { name: 'NAUCC15', file: 'Flatland/NAUCC15.txt', weight: Continental_WEIGHT, region: 'NA' },
  { name: 'NAUCC14', file: 'Flatland/NAUCC14.txt', weight: Continental_WEIGHT, region: 'NA' },
  { name: 'NAUCC13', file: 'Flatland/NAUCC13.txt', weight: Continental_WEIGHT, region: 'NA' },

  { name: 'LAUCC25', file: 'Flatland/LAUCC25.txt', weight: Continental_WEIGHT, region: 'SA' },

  { name: 'GUC25', file: 'Flatland/GUC25.txt', weight: National_WEIGHT, region: 'EU' },
  { name: 'GUC24', file: 'Flatland/GUC24.txt', weight: National_WEIGHT, region: 'EU' },
  { name: 'GUC23', file: 'Flatland/GUC23.txt', weight: National_WEIGHT, region: 'EU' },
  { name: 'GUC22', file: 'Flatland/GUC22.txt', weight: National_WEIGHT, region: 'EU' },
  { name: 'GUC26', file: 'Flatland/GUC26.txt', weight: National_WEIGHT, region: 'EU' },

  { name: 'ROC18', file: 'Flatland/ROC18.txt', weight: Local_WEIGHT, region: 'EU' },
  { name: 'ROC20', file: 'Flatland/ROC20.txt', weight: Local_WEIGHT, region: 'EU' },
  { name: 'UFO24', file: 'Flatland/UFO24.txt', weight: Local_WEIGHT, region: 'EU' },
  { name: 'UFO25', file: 'Flatland/UFO25.txt', weight: Local_WEIGHT, region: 'EU' },
  { name: 'UFO26', file: 'Flatland/UFO26.txt', weight: Local_WEIGHT, region: 'EU' },



    { name: 'BUC26', file: 'Flatland/BUC26.txt', weight: National_WEIGHT, region: 'EU' },
  { name: 'BUC24', file: 'Flatland/BUC24.txt', weight: National_WEIGHT, region: 'EU' },
  { name: 'BUC25', file: 'Flatland/BUC25.txt', weight: National_WEIGHT, region: 'EU' },
  { name: 'BUC23', file: 'Flatland/BUC23.txt', weight: National_WEIGHT, region: 'EU' },
  { name: 'BUC22', file: 'Flatland/BUC22.txt', weight: National_WEIGHT, region: 'EU' },
   { name: 'BUC21', file: 'Flatland/BUC21.txt', weight: National_WEIGHT, region: 'EU' },

   { name: 'JUC26', file: 'Flatland/JUC26.txt', weight: Continental_WEIGHT, region: 'AS' }
];

const DISCIPLINES = {
  flatland: {
    label: 'Flatland',
    resultsDirectory: 'Results_Disciplines/Urban',
    eventFiles: FLATLAND_EVENT_FILES,
    usesSimpleResults: false,
    supportsBattles: true
  },
  street: {
    label: 'Street',
    resultsDirectory: 'Results_Disciplines/Urban',
    eventFiles: [{ name: 'Unicon26', file: 'Street/Unicon26.txt', weight: 3, region: '' },
      { name: 'Unicon24', file: 'Street/Unicon24.txt', weight: STREET_UNICON_WEIGHT, region: '' },
      { name: 'Unicon22', file: 'Street/Unicon22.txt', weight: STREET_UNICON_WEIGHT, region: '' },
      { name: 'Unicon16', file: 'Street/Unicon16.txt', weight: STREET_UNICON_WEIGHT, region: '' },
      { name: 'Unicon18', file: 'Street/Unicon18.txt', weight: STREET_UNICON_WEIGHT, region: '' },
      { name: 'Unicon14', file: 'Street/Unicon14.txt', weight: STREET_UNICON_WEIGHT, region: '' },
      { name: 'EUCW25', file: 'Street/EUCW25.txt', weight: Continental_WEIGHT, region: '' },
       { name: 'EUCW24', file: 'Street/EUCW24.txt', weight: Continental_WEIGHT, region: '' },
        { name: 'GUC22', file: 'Street/GUC22.txt', weight: National_WEIGHT, region: '' },
           { name: 'GUC23', file: 'Street/GUC23.txt', weight: National_WEIGHT, region: '' },
              { name: 'GUC24', file: 'Street/GUC24.txt', weight: National_WEIGHT, region: '' },
                 { name: 'GUC25', file: 'Street/GUC25.txt', weight: National_WEIGHT, region: '' },
                    { name: 'GUC26', file: 'Street/GUC26.txt', weight: National_WEIGHT, region: '' },
    ],
    usesSimpleResults: true,
    supportsBattles: false
  },
  trial: {
    label: 'Trial',
    resultsDirectory: 'Results_Disciplines/Urban',
    eventFiles: [{ name: 'Unicon26', file: 'Trial/Unicon26.txt', weight: 3, region: '' }],
    usesSimpleResults: true,
    supportsBattles: false
  },
  'x-style': {
    label: 'X-Style',
    resultsDirectory: 'Results_Disciplines/Freestyle/X-Style',
    eventFiles: [
      { name: 'Unicon24', file: 'Unicon24.txt', weight: 3, region: '' },
      { name: 'Unicon22', file: 'Unicon22.txt', weight: 3, region: '' }
    ],
    usesSimpleResults: true,
    supportsBattles: false
  }
};

const requestedDiscipline = new URLSearchParams(window.location.search).get('discipline');
const activeDisciplineKey = Object.prototype.hasOwnProperty.call(DISCIPLINES, requestedDiscipline)
  ? requestedDiscipline
  : 'flatland';
const activeDiscipline = DISCIPLINES[activeDisciplineKey];
const EVENT_FILES = activeDiscipline.eventFiles;
const DEFAULT_EVENT_WEIGHTS = new Map(EVENT_FILES.map((event) => [event.name, event.weight]));
const EVENT_WEIGHT_CLASSES = [
  { key: 'unicon', label: 'Unicon', pattern: /^Unicon/i },
  { key: 'continental', label: 'Continental', pattern: /^(EUCW|EUCS|NAUCC|LAUCC|JUC)/i },
  { key: 'national', label: 'National', pattern: /^(CFM|GUC)/i },
  { key: 'local', label: 'Local', pattern: /^(ROC|BUC)/i }
];

function getEventWeightClass(eventName) {
  return EVENT_WEIGHT_CLASSES.find((weightClass) => weightClass.pattern.test(eventName)) || null;
}

function getDefaultWeightForClass(weightClass) {
  const event = EVENT_FILES.find((item) => getEventWeightClass(item.name)?.key === weightClass.key);
  return event ? DEFAULT_EVENT_WEIGHTS.get(event.name) : 1;
}

const FLATLAND_RESULT_SCORE_CATEGORIES = ['Difficulty', 'Variety', 'Fullness', 'Style'];
const FLATLAND_BATTLE_SCORE_CATEGORIES = ['Difficulty', 'Variety', 'Fullness', 'Style', 'Battling', 'Last trick'];
const DEFAULT_BEST_RESULT_MULTIPLIERS = [1, 0.8, 0.6, 0.4, 0.2];
let BEST_RESULT_MULTIPLIERS = [...DEFAULT_BEST_RESULT_MULTIPLIERS];
// Bonus factors for a rider's three best battle wins, applied to the beaten opponent's event points.
const DEFAULT_BATTLE_BONUS_FACTORS = [0.03, 0.02, 0.01];
let BATTLE_BONUS_FACTORS = [...DEFAULT_BATTLE_BONUS_FACTORS];
const BATTLE_BONUS_ROUNDS = new Set(['Quarter-final', 'Semi-final', 'Third place', 'Final']);
// Without battle data, places 1-4 are assumed to have won this many battles against 100-point riders.
const ASSUMED_BATTLE_WINS = [3, 2, 2, 1];

function exponentialPlacePoints(place, competitorCount, minimum) {
  const exponent = competitorCount > 1 ? Math.log(100 / minimum) / Math.log(competitorCount) : 1;
  return Math.max(minimum, 100 / Math.pow(place, exponent));
}

function getPlacePoints(place, competitorCount) {
  if (scalingMode === 'custom' && customFormulaFn) {
    const value = Number(customFormulaFn(place, competitorCount));
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }
  if (scalingMode === 'linear') {
    if (competitorCount <= 1) return 100;
    const t = Math.min(1, Math.max(0, (place - 1) / (competitorCount - 1)));
    return 100 - t * (100 - minPlacePoints);
  }
  if (scalingMode === 'power') {
    const n = Math.max(1, competitorCount);
    const ratio = Math.min(1, Math.max(0, (n - place + 1) / n));
    return 100 * Math.pow(ratio, scalingPower);
  }
  return exponentialPlacePoints(place, competitorCount, minPlacePoints);
}

function calculateBattleBonus(opponentWins) {
  const details = [...opponentWins]
    .sort((a, b) => b.rankingPoints - a.rankingPoints)
    .slice(0, BATTLE_BONUS_FACTORS.length)
    .map((win, index) => {
      const factor = BATTLE_BONUS_FACTORS[index];
      return {
        ...win,
        factor,
        battleWeight,
        points: win.rankingPoints * factor * battleWeight
      };
    });
  const bonus = details.reduce((sum, detail) => sum + detail.rankingPoints * detail.factor * battleWeight, 0);
  return { bonus, details };
}

// Returns Map(rider -> { bonus, details }) using post-placement, pre-battle ranking points.
function computeBattleBonuses(entries, battles, postEventPointsByRider) {
  const bonuses = new Map();
  const winsByRider = new Map();
  if (battles.length > 0) {
    battles.filter((battle) => BATTLE_BONUS_ROUNDS.has(battle.round)).forEach((battle) => {
      if (!winsByRider.has(battle.winner)) winsByRider.set(battle.winner, []);
      winsByRider.get(battle.winner).push({
        opponent: battle.loser,
        rankingPoints: postEventPointsByRider.get(battle.loser) || 0,
        round: battle.round
      });
    });
  } else {
    entries.forEach((entry) => {
      const wins = ASSUMED_BATTLE_WINS[entry.place - 1] || 0;
      if (wins) {
        winsByRider.set(entry.rider, Array.from({ length: wins }, (_, index) => ({
          opponent: `Assumed opponent ${index + 1}`,
          rankingPoints: 100,
          round: 'Assumed',
          assumed: true
        })));
      }
    });
  }
  winsByRider.forEach((wins, rider) => bonuses.set(rider, calculateBattleBonus(wins)));
  return bonuses;
}

// Given a list of { score, event } contributions, apply the region penalty (within one region the
// best score is untouched, the 2nd is multiplied by regionPenalty, the 3rd by regionPenalty^2, ...),
// then sum the top scores using BEST_RESULT_MULTIPLIERS. Mirrors the detailed rider points page.
function computeRiderPointDetails(scoreEntries, multipliers = BEST_RESULT_MULTIPLIERS, penalty = regionPenalty) {
  const byRegion = new Map();
  const penalizedScores = scoreEntries.map((entry) => {
    const { score, event } = entry;
    const region = String(EVENT_FILES.find((file) => file.name === event)?.region || '').trim().toUpperCase();
    return { ...entry, region, regionMultiplier: 1, penalizedScore: score };
  });
  penalizedScores.forEach((entry) => {
    if (!entry.region) return;
    if (!byRegion.has(entry.region)) byRegion.set(entry.region, []);
    byRegion.get(entry.region).push(entry);
  });
  byRegion.forEach((entries) => {
    entries.sort((a, b) => b.score - a.score).forEach((entry, index) => {
      entry.regionMultiplier = Math.pow(penalty, index);
      entry.penalizedScore = entry.score * entry.regionMultiplier;
    });
  });

  return penalizedScores.sort((a, b) => b.penalizedScore - a.penalizedScore).map((entry, index) => {
    const topMultiplier = multipliers[index] ?? 0;
    return { ...entry, topMultiplier, contribution: entry.penalizedScore * topMultiplier };
  });
}

function computeRiderTotalPoints(scoreEntries) {
  return computeRiderPointDetails(scoreEntries).reduce((total, entry) => total + entry.contribution, 0);
}// 'ranking' (index.html, rider_points.html) or 'results' (results.html); set via <body data-site>.
const IS_RESULTS_SITE = document.body?.dataset?.site === 'results';
const GENDERS = ['male', 'female']; // result sections found in event files
const RANKING_GENDERS = ['male', 'female', 'combined']; // rankings that can be viewed
const COMBINED_FEMALE_DIVISOR = 2.89; // female-category points are divided by this in the combined ranking
const genderLabel = (gender) => gender;
const isRankingGender = (gender) => RANKING_GENDERS.includes(gender);
const isFemaleRider = (name) => Boolean(riderInfoMap.get(name)?.female);
let currentGender = 'combined';
let currentYearComparison = '2026'; // default to 2026
let globalRowsByGender = { male: [], female: [], combined: [] };
let currentSort = { key: 'points', direction: 'desc' };
const riderPointsSort = { key: 'event', direction: 'desc' };
let currentSearch = '';
const eventResults = new Map();
const eventBattles = new Map();
const eventPrelimResults = new Map(); // eventName -> { male: [{place, rider, score}], female: [...] }
const riderStrengthCache = { male: null, female: null, combined: null };
const riderHistoryByGender = { male: new Map(), female: new Map(), combined: new Map() };
const maleBattleHistory = new Map();
// Battles are only recorded for male/open and female results; combined reuses the male/open ones.
const riderBattlesByGender = { male: maleBattleHistory, female: new Map(), combined: maleBattleHistory };
const aliasMap = new Map(); // maps normalized alias -> canonical display name
const riderInfoMap = new Map(); // canonical name -> { female, region } from riders_all.txt

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

function splitRiderAndScores(value) {
  // A ',' explicitly separates the rider name from the scores, e.g. "Jelle, 1 5 3 / 9".
  // Anything after a '#' is a video link and is ignored here.
  const text = String(value || '').split('#')[0];
  const separatorIndex = text.indexOf(',');
  if (separatorIndex !== -1) {
    return {
      rider: text.slice(0, separatorIndex).trim(),
      scores: text.slice(separatorIndex + 1).trim().split(/[\s,]+/).filter(Boolean)
    };
  }

  const parts = text.trim().split(/\s+/).filter(Boolean);
  const scores = [];
  // A lone "/" marks a score that was not given.
  while (parts.length > 0 && /^(?:-?\d+(?:[.,]\d+)?(?:\/\d+(?:[.,]\d+)?)?|\/)$/.test(parts[parts.length - 1])) {
    scores.unshift(parts.pop());
  }
  return { rider: parts.join(' '), scores };
}

// Optional first line of a gender's results listing the score names, e.g. "@scores Total, Difficulty".
const SCORE_NAMES_PREFIX = '@scores';

// Paste your Formspree form URL here, e.g. 'https://formspree.io/f/abcdwxyz'.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/moejkbzp';

function parseScoreNamesLine(line) {
  const match = String(line || '').match(/^@scores\s+(.*)$/i);
  return match ? match[1].split(',').map((name) => name.trim()).filter(Boolean) : null;
}

function removePlacementRiderId(value) {
  return String(value || '').replace(/^\d+\s+/, '');
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
const prelimSort = { key: 'place', direction: 'asc' };
const SETTINGS_STORAGE_KEY = 'ranking-settings-v1';
const RIDER_NOTES_STORAGE_KEY = 'ranking-rider-notes-v1';
const defaultSettings = {
  showPoints: false,
  showWins: true,
  showBattles: true,
  showPodiums: true,
  showRiderStrength: false,
  backgroundColor: '#F0F5FA',
  panelColor: '#ffffff',
  excludeUnicon: false,
  seasonDecay: 0.9,
  onlyCurrentYear: false,
  minPlacePoints: 15,
  scalingMode: 'power',
  scalingPower: 5,
  customFormula: '100 * ((n - rank + 1) / n) ** 2',
  regionPenalty: 0.8,
  topEventMultipliers: '1, 0.8, 0.6, 0.4, 0.2',
  battleWeight: 1,
  battleBonusFactors: [...DEFAULT_BATTLE_BONUS_FACTORS],
  eventWeightClasses: {}
};
let settings = loadSettings();
applyScoringSettings();
applyEventWeights();
let riderNotes = loadRiderNotes();

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || 'null') || {};
    // Drop the old dark-theme defaults so the new light colors apply
    if (String(saved.backgroundColor).toLowerCase() === '#07111f') delete saved.backgroundColor;
    if (String(saved.panelColor).toLowerCase() === '#091423') delete saved.panelColor;
    // One-time reset so a previously saved panel colour no longer overrides the white default.
    if (!saved.panelColorReset) {
      delete saved.panelColor;
      saved.panelColorReset = true;
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(saved));
    }
    return { ...defaultSettings, ...saved };
  } catch (error) {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function parseMultiplierList(text) {
  const values = String(text || '').split(/[\s,;]+/).filter(Boolean).map(Number);
  return values.length > 0 && values.every((v) => Number.isFinite(v) && v >= 0) ? values : null;
}

function applyScoringSettings() {
  const decay = Number(settings.seasonDecay);
  const minPoints = Number(settings.minPlacePoints);
  const weight = Number(settings.battleWeight);
  seasondecay = Number.isFinite(decay) && decay > 0 && decay <= 1 ? decay : defaultSettings.seasonDecay;
  const regionPen = Number(settings.regionPenalty);
  regionPenalty = Number.isFinite(regionPen) && regionPen > 0 && regionPen <= 1 ? regionPen : defaultSettings.regionPenalty;
  yearDecay = settings.onlyCurrentYear ? 0 : seasondecay;
  minPlacePoints = Number.isFinite(minPoints) && minPoints >= 1 && minPoints < 100 ? minPoints : defaultSettings.minPlacePoints;
  battleWeight = Number.isFinite(weight) && weight >= 0 ? weight : defaultSettings.battleWeight;
  scalingMode = ['exponential', 'linear', 'power', 'custom'].includes(settings.scalingMode) ? settings.scalingMode : defaultSettings.scalingMode;
  customFormulaFn = compileCustomFormula(settings.customFormula);
  customFormulaText = customFormulaFn ? String(settings.customFormula).trim() : defaultSettings.customFormula;
  if (scalingMode === 'custom' && !customFormulaFn) scalingMode = defaultSettings.scalingMode;
  const power = Number(settings.scalingPower);
  scalingPower = Number.isFinite(power) && power > 0 ? power : defaultSettings.scalingPower;
  BEST_RESULT_MULTIPLIERS = parseMultiplierList(settings.topEventMultipliers) || [...DEFAULT_BEST_RESULT_MULTIPLIERS];
  const battleFactors = parseMultiplierList(settings.battleBonusFactors);
  BATTLE_BONUS_FACTORS = battleFactors?.length === 3 ? battleFactors : [...DEFAULT_BATTLE_BONUS_FACTORS];
}

function applyEventWeights() {
  const savedWeights = settings.eventWeightClasses?.[activeDisciplineKey] || {};
  EVENT_FILES.forEach((event) => {
    const weightClass = getEventWeightClass(event.name);
    const savedWeight = Number(weightClass ? savedWeights[weightClass.key] : NaN);
    event.weight = Number.isFinite(savedWeight) && savedWeight >= 0
      ? savedWeight
      : DEFAULT_EVENT_WEIGHTS.get(event.name);
  });
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
  const showRiderStrengthInput = document.getElementById('show-rider-strength');
  const backgroundInput = document.getElementById('background-color');
  const panelInput = document.getElementById('panel-color');

  if (showPointsInput) showPointsInput.checked = settings.showPoints;
  if (showWinsInput) showWinsInput.checked = settings.showWins;
  if (showBattlesInput) showBattlesInput.checked = settings.showBattles;
  if (showPodiumsInput) showPodiumsInput.checked = settings.showPodiums;
  if (showRiderStrengthInput) showRiderStrengthInput.checked = settings.showRiderStrength;
  if (backgroundInput) backgroundInput.value = settings.backgroundColor;
  if (panelInput) panelInput.value = settings.panelColor;

  const onlyCurrentYearInput = document.getElementById('only-current-year');
  if (onlyCurrentYearInput) onlyCurrentYearInput.checked = !!settings.onlyCurrentYear;

  const scoringValues = {
    'season-decay': settings.seasonDecay,
    'region-penalty': settings.regionPenalty,
    'min-place-points': settings.minPlacePoints,
    'scaling-mode': settings.scalingMode,
    'scaling-power': settings.scalingPower,
    'custom-formula': settings.customFormula,
    'top-event-multipliers': settings.topEventMultipliers,
    'battle-weight': settings.battleWeight,
    'battle-factors': BATTLE_BONUS_FACTORS.join(', ')
  };
  Object.entries(scoringValues).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input && document.activeElement !== input) input.value = value;
  });
  renderEventWeightSettings();
}

function getVisibleWorldColumns() {
  return [
    { key: 'events', label: 'Events', visible: true, sortable: true },
    { key: 'points', label: 'Points',     visible: true, sortable: true },
    { key: 'wins', label: 'Wins', visible: settings.showWins, sortable: true },
    { key: 'podiums', label: 'Podiums', visible: settings.showPodiums, sortable: true },
    { key: 'battles', label: 'Battles', visible: activeDiscipline.supportsBattles && settings.showBattles, sortable: true }
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

function updateViewDescription(view) {
  const title = document.getElementById('ranking-title');
  const description = document.getElementById('ranking-description');
  if (!title || !description) return;
  const genderText = `${currentGender} `;
  if (view === 'world') {
    title.textContent = 'All';
    description.textContent = `Weighted ${genderText}results from your competition files`;
  } else {
    title.textContent = `${view} results`;
    description.textContent = `Place-by-place ${genderText}results for ${view}`;
  }
}

function refreshRankingView() {
  const viewSelect = document.getElementById('view-select');
  const activeView = viewSelect ? viewSelect.value : 'world';
  updateViewDescription(activeView);
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
  const showRiderStrengthInput = document.getElementById('show-rider-strength');
  const backgroundInput = document.getElementById('background-color');
  const panelInput = document.getElementById('panel-color');

  settings = {
    ...settings,
    showPoints: showPointsInput ? showPointsInput.checked : settings.showPoints,
    showWins: showWinsInput ? showWinsInput.checked : settings.showWins,
    showBattles: showBattlesInput ? showBattlesInput.checked : settings.showBattles,
    showPodiums: showPodiumsInput ? showPodiumsInput.checked : settings.showPodiums,
    showRiderStrength: showRiderStrengthInput ? showRiderStrengthInput.checked : settings.showRiderStrength,
    backgroundColor: backgroundInput ? backgroundInput.value : settings.backgroundColor,
    panelColor: panelInput ? panelInput.value : settings.panelColor
  };

  saveSettings();
  applySettingsToDom();
  refreshRankingView();
  if (currentProfileRider) renderRiderStrength(currentProfileRider);
}

function updateScoringSettingsFromInputs() {
  const read = (id) => document.getElementById(id)?.value;
  const decay = Number(read('season-decay'));
  const minPoints = Number(read('min-place-points'));
  const weight = Number(read('battle-weight'));
  const multipliers = read('top-event-multipliers');
  const battleFactors = parseMultiplierList(read('battle-factors'));
  const next = { ...settings };
  const onlyCurrentYearInput = document.getElementById('only-current-year');
  if (onlyCurrentYearInput) next.onlyCurrentYear = onlyCurrentYearInput.checked;
  if (read('season-decay') !== '' && decay > 0 && decay <= 1) next.seasonDecay = decay;
  const regionPen = Number(read('region-penalty'));
  if (read('region-penalty') !== '' && regionPen > 0 && regionPen <= 1) next.regionPenalty = regionPen;
  if (read('min-place-points') !== '' && minPoints >= 1 && minPoints < 100) next.minPlacePoints = minPoints;
  const mode = read('scaling-mode');
  const power = Number(read('scaling-power'));
  if (['exponential', 'linear', 'power', 'custom'].includes(mode)) next.scalingMode = mode;
  const formula = read('custom-formula');
  const formulaValid = formula != null && compileCustomFormula(formula) !== null;
  if (formulaValid) next.customFormula = formula.trim();
  const formulaError = document.getElementById('custom-formula-error');
  if (formulaError) formulaError.classList.toggle('hidden', formulaValid || !formula);
  if (next.scalingMode === 'custom' && !compileCustomFormula(next.customFormula)) next.scalingMode = settings.scalingMode;
  if (read('scaling-power') !== '' && power > 0) next.scalingPower = power;
  if (read('battle-weight') !== '' && weight >= 0) next.battleWeight = weight;
  if (multipliers != null && parseMultiplierList(multipliers)) next.topEventMultipliers = multipliers;
  if (battleFactors?.length === 3) {
    next.battleBonusFactors = battleFactors;
  }
  settings = next;
  saveSettings();
  applyScoringSettings();
  recalculateRankings();
}

let recalcChain = Promise.resolve();
function recalculateRankings() {
  recalcChain = recalcChain.then(async () => {
    try {
      await loadRanking({ preserveView: true });
      if (document.getElementById('rider-points-body')) {
        renderRiderPointsPage();
      } else {
        refreshRankingView();
      }
    } catch (error) {
      console.error('Could not recalculate rankings.', error);
    }
  });
  return recalcChain;
}

function updateEventWeightClassFromInput(input) {
  const weight = Number(input.value);
  if (input.value === '' || !Number.isFinite(weight) || weight < 0) return;
  const weights = { ...(settings.eventWeightClasses?.[activeDisciplineKey] || {}) };
  weights[input.dataset.eventWeightClass] = weight;
  settings = {
    ...settings,
    eventWeightClasses: { ...settings.eventWeightClasses, [activeDisciplineKey]: weights }
  };
  saveSettings();
  applyEventWeights();
  recalculateRankings();
}

function renderEventWeightSettings() {
  const container = document.getElementById('event-weight-settings');
  if (!container) return;
  container.innerHTML = '';
  const savedWeights = settings.eventWeightClasses?.[activeDisciplineKey] || {};
  const availableClasses = EVENT_WEIGHT_CLASSES.filter((weightClass) =>
    EVENT_FILES.some((event) => getEventWeightClass(event.name)?.key === weightClass.key)
  );
  availableClasses.forEach((weightClass) => {
    const label = document.createElement('label');
    label.className = 'setting-item event-weight-setting';
    const name = document.createElement('span');
    name.textContent = `${weightClass.label} weight`;
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '0.1';
    const savedWeight = Number(savedWeights[weightClass.key]);
    input.value = String(Number.isFinite(savedWeight) && savedWeight >= 0
      ? savedWeight
      : getDefaultWeightForClass(weightClass));
    input.dataset.eventWeightClass = weightClass.key;
    input.setAttribute('aria-label', `${weightClass.label} event weight`);
    input.addEventListener('change', () => updateEventWeightClassFromInput(input));
    label.append(name, input);
    container.appendChild(label);
  });
}

function modelNormalRandom(random) {
  let u = 0;
  let v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function modelRankCorrelation(left, right) {
  if (left.length < 2 || left.length !== right.length) return null;
  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const leftMean = mean(left);
  const rightMean = mean(right);
  let numerator = 0;
  let leftVariance = 0;
  let rightVariance = 0;
  left.forEach((value, index) => {
    const leftDelta = value - leftMean;
    const rightDelta = right[index] - rightMean;
    numerator += leftDelta * rightDelta;
    leftVariance += leftDelta ** 2;
    rightVariance += rightDelta ** 2;
  });
  return leftVariance && rightVariance ? numerator / Math.sqrt(leftVariance * rightVariance) : null;
}

function modelWeightedRankSkillCorrelation(ranking) {
  if (ranking.length < 2) return null;
  const weights = ranking.map((entry, index) => 1 / Math.sqrt(index + 1));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const meanRank = weights.reduce((sum, weight, index) => sum + weight * (index + 1), 0) / totalWeight;
  const meanSkill = ranking.reduce((sum, entry, index) => sum + entry.skill * weights[index], 0) / totalWeight;
  let covariance = 0;
  let rankVariance = 0;
  let skillVariance = 0;
  ranking.forEach((entry, index) => {
    const rank = index + 1;
    const weight = weights[index];
    const rankDelta = rank - meanRank;
    const skillDelta = entry.skill - meanSkill;
    covariance += weight * rankDelta * skillDelta;
    rankVariance += weight * rankDelta ** 2;
    skillVariance += weight * skillDelta ** 2;
  });
  return rankVariance && skillVariance ? covariance / Math.sqrt(rankVariance * skillVariance) : null;
}

function calibrateModelParticipation(skills, rosters, attendance, unicons, random) {
  const riders = [...skills.keys()];
  const count = riders.length;
  const skillSum = riders.reduce((sum, rider) => sum + skills.get(rider), 0);
  const skillVariance = riders.reduce((sum, rider) => sum + skills.get(rider) ** 2, 0) - skillSum ** 2 / count;
  const attendanceSum = riders.reduce((sum, rider) => sum + attendance.get(rider), 0);
  const uniconSets = unicons.map(({ event }) => new Set(rosters.get(event.name)));
  const sortedSkills = [...skills.values()].sort((a, b) => b - a);
  const uniconDenominators = uniconSets.map((set) =>
    Math.sqrt(skillVariance * set.size * (1 - set.size / count)));
  const maxCorrelations = uniconSets.map((set, index) => uniconDenominators[index]
    ? (sortedSkills.slice(0, set.size).reduce((sum, skill) => sum + skill, 0) - skillSum * set.size / count) / uniconDenominators[index]
    : null);
  const uniconTargets = maxCorrelations.map((max) => max == null ? null : Math.min(0.4, max));
  let attendanceSquares = riders.reduce((sum, rider) => sum + attendance.get(rider) ** 2, 0);
  let attendanceSkill = riders.reduce((sum, rider) => sum + attendance.get(rider) * skills.get(rider), 0);
  let uniconSkills = uniconSets.map((set) => [...set].reduce((sum, rider) => sum + skills.get(rider), 0));
  const correlations = (squares, skillTotal, eventSkills) => ({
    attendance: squares > attendanceSum ** 2 / count
      ? (skillTotal - skillSum * attendanceSum / count) / Math.sqrt(skillVariance * (squares - attendanceSum ** 2 / count))
      : null,
    unicons: eventSkills.map((sum, index) => uniconDenominators[index]
      ? (sum - skillSum * uniconSets[index].size / count) / uniconDenominators[index]
      : null)
  });
  const loss = (values) => (values.attendance == null ? 0 : 4 * (values.attendance - 0.5) ** 2) +
    values.unicons.reduce((sum, value, index) =>
      sum + (value == null ? 0 : (value - uniconTargets[index]) ** 2), 0);
  let values = correlations(attendanceSquares, attendanceSkill, uniconSkills);
  let currentLoss = loss(values);
  let bestLoss = currentLoss;
  let bestSkills = new Map(skills);
  let bestRosters = uniconSets.map((set) => new Set(set));
  const iterations = 150000;
  for (let attempt = 0; attempt < iterations; attempt++) {
    let a;
    let b;
    let eventIndex = -1;
    let nextSquares = attendanceSquares;
    let nextAttendanceSkill = attendanceSkill;
    const nextUniconSkills = [...uniconSkills];
    if (uniconSets.length && random() < 0.5) {
      eventIndex = Math.floor(random() * uniconSets.length);
      const roster = rosters.get(unicons[eventIndex].event.name);
      if (!roster.length || roster.length === count) continue;
      a = roster[Math.floor(random() * roster.length)];
      b = riders[Math.floor(random() * count)];
      if (a === b || uniconSets[eventIndex].has(b) || attendance.get(a) <= 1) continue;
      const countA = attendance.get(a);
      const countB = attendance.get(b);
      nextSquares += 2 * (countB - countA + 1);
      nextAttendanceSkill += skills.get(b) - skills.get(a);
      nextUniconSkills[eventIndex] += skills.get(b) - skills.get(a);
    } else {
      a = riders[Math.floor(random() * count)];
      b = riders[Math.floor(random() * count)];
      if (a === b) continue;
      const skillDifference = skills.get(b) - skills.get(a);
      nextAttendanceSkill += skillDifference * (attendance.get(a) - attendance.get(b));
      uniconSets.forEach((set, index) => {
        nextUniconSkills[index] += skillDifference * (Number(set.has(a)) - Number(set.has(b)));
      });
    }
    const nextValues = correlations(nextSquares, nextAttendanceSkill, nextUniconSkills);
    const nextLoss = loss(nextValues);
    const temperature = 0.0005 * (1 - attempt / iterations);
    if (nextLoss > currentLoss && random() >= Math.exp((currentLoss - nextLoss) / temperature)) continue;
    if (eventIndex >= 0) {
      const roster = rosters.get(unicons[eventIndex].event.name);
      roster[roster.indexOf(a)] = b;
      uniconSets[eventIndex].delete(a);
      uniconSets[eventIndex].add(b);
      attendance.set(a, attendance.get(a) - 1);
      attendance.set(b, attendance.get(b) + 1);
    } else {
      const skill = skills.get(a);
      skills.set(a, skills.get(b));
      skills.set(b, skill);
    }
    attendanceSquares = nextSquares;
    attendanceSkill = nextAttendanceSkill;
    uniconSkills = nextUniconSkills;
    values = nextValues;
    currentLoss = nextLoss;
    if (currentLoss < bestLoss) {
      bestLoss = currentLoss;
      bestSkills = new Map(skills);
      bestRosters = uniconSets.map((set) => new Set(set));
    }
  }
  bestSkills.forEach((skill, rider) => skills.set(rider, skill));
  bestRosters.forEach((set, index) => rosters.set(unicons[index].event.name, [...set]));
  riders.forEach((rider) => attendance.set(rider, 0));
  rosters.forEach((roster) => roster.forEach((rider) => attendance.set(rider, attendance.get(rider) + 1)));
  return {
    attendance: modelRankCorrelation(riders.map((rider) => skills.get(rider)), riders.map((rider) => attendance.get(rider))),
    unicons: bestRosters.map((set, index) => ({
      event: unicons[index].event.name,
      correlation: modelRankCorrelation(riders.map((rider) => skills.get(rider)), riders.map((rider) => Number(set.has(rider)))),
      maximum: maxCorrelations[index]
    }))
  };
}

function modelEventMultipliers(count) {
  return Array.from({ length: count }, (_, index) => count === 1 ? 1 : (count - 1 - index) / (count - 1));
}

function modelRandomGenerator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function modelWeightedNormalizedRankError(rank, skillRank, riderCount) {
  return Math.abs(rank - skillRank) / riderCount / Math.sqrt(rank);
}

function modelMaxWeightedNormalizedRankError(ranking, hiddenRank) {
  return ranking.reduce((maximum, entry, index) =>
    Math.max(maximum, modelWeightedNormalizedRankError(index + 1, hiddenRank.get(entry.rider), ranking.length)), 0);
}

const MODEL_K_VALUES = Array.from({ length: 41 }, (_, index) => (index + 10) / 10);
const MODEL_N_VALUES = [3, 4, 5, 6, 7];
const MODEL_SCORINGS = [
  { key: 'power', label: 'Power scoring', axis: 'Scoring exponent k', values: MODEL_K_VALUES, ticks: [1, 2, 3, 4, 5], format: (value) => value.toFixed(1) },
  { key: 'exponential', label: 'Exponential scoring', axis: 'Last-place points', values: Array.from({ length: 30 }, (_, index) => index + 1), ticks: [1, 5, 10, 15, 20, 25, 30], format: (value) => String(value) }
];
const MODEL_TOP_COUNTS = [15, 5, 30];
const MODEL_METRICS = [
  { key: 'maxError', label: 'Maximum rank error', color: '#d34a4a', format: (value) => value.toFixed(2) + ' ranks' },
  { key: 'maxRelativeError', label: 'Maximum relative rank error', color: '#b57800', format: (value) => (100 * value).toFixed(2) + '%' },
  { key: 'maxWeightedError', label: 'Maximum weighted normalized rank error', color: '#9853bc', format: (value) => (100 * value).toFixed(2) + '%' },
  { key: 'correlation', label: 'Rank–skill correlation match', color: '#0075c9', maximize: true, format: (value) => value.toFixed(3) },
  { key: 'weightedCorrelation', label: 'Weighted rank–skill correlation match', color: '#16845a', maximize: true, format: (value) => value.toFixed(3) },
  ...MODEL_TOP_COUNTS.flatMap((count, index) => [
    { key: `top${count}Correlation`, label: `Top ${count} rank–skill correlation match`, color: ['#bd3978', '#376bb5', '#008b8b'][index], maximize: true, format: (value) => value.toFixed(3) },
    { key: `top${count}MaxError`, label: `Top ${count} maximum rank deviation`, color: ['#c15318', '#9c4a60', '#806600'][index], format: (value) => value.toFixed(2) + ' ranks' }
  ])
];

function modelRankingMetrics(ranking, hiddenRank) {
  const ranks = ranking.map((entry, index) => index + 1);
  const correlation = modelRankCorrelation(ranks, ranking.map((entry) => entry.skill));
  const weightedCorrelation = modelWeightedRankSkillCorrelation(ranking);
  if (correlation == null || weightedCorrelation == null) {
    throw new Error('Rank–skill correlation is undefined for this simulation.');
  }
  const metrics = {
    maxError: ranking.reduce((max, entry, index) => Math.max(max, Math.abs(index + 1 - hiddenRank.get(entry.rider))), 0),
    maxRelativeError: ranking.reduce((max, entry, index) =>
      Math.max(max, Math.abs(index + 1 - hiddenRank.get(entry.rider)) / hiddenRank.get(entry.rider)), 0),
    maxWeightedError: modelMaxWeightedNormalizedRankError(ranking, hiddenRank),
    correlation: -correlation,
    weightedCorrelation: -weightedCorrelation
  };
  MODEL_TOP_COUNTS.forEach((count) => {
    const top = ranking.slice(0, count);
    const topCorrelation = modelRankCorrelation(ranks.slice(0, count), top.map((entry) => entry.skill));
    if (topCorrelation == null) throw new Error(`Top ${count} rank–skill correlation is undefined for this simulation.`);
    metrics[`top${count}Correlation`] = -topCorrelation;
    metrics[`top${count}MaxError`] = top.reduce((max, entry, index) =>
      Math.max(max, Math.abs(index + 1 - hiddenRank.get(entry.rider))), 0);
  });
  return metrics;
}

function evaluateModelSimulation(modelEvents, skills, rosters, noise, shift, decayRate, penalty, hiddenRank, visit, selection = null, scoring = MODEL_SCORINGS[0]) {
  const placements = new Map([...skills.keys()].map((rider) => [rider, []]));
  modelEvents.forEach(({ event, year }) => {
    const participants = rosters.get(event.name).map((rider) => ({
      rider,
      performance: skills.get(rider) + shift * Math.abs(skills.get(rider)) * noise.get(event.name).get(rider)
    })).sort((a, b) => b.performance - a.performance || a.rider.localeCompare(b.rider));
    participants.forEach(({ rider }, index) => {
      placements.get(rider).push({
        event: event.name, place: index + 1, competitorCount: participants.length,
        eventWeight: event.weight, decay: Math.pow(decayRate, Math.max(0, 2026 - year))
      });
    });
  });
  for (const parameter of scoring.values) {
    if (selection && selection.parameter !== parameter) continue;
    const riders = [...placements.entries()].map(([rider, entries]) => {
      const scores = entries.map((entry) => {
        const placePoints = scoring.key === 'power'
          ? 100 * Math.pow((entry.competitorCount - entry.place + 1) / entry.competitorCount, parameter)
          : exponentialPlacePoints(entry.place, entry.competitorCount, parameter);
        const rawPoints = placePoints * entry.eventWeight;
        return { ...entry, placePoints, rawPoints, score: rawPoints * entry.decay };
      });
      return { rider, skill: skills.get(rider), scores, penalized: computeRiderPointDetails(scores, [], penalty) };
    });
    for (const n of MODEL_N_VALUES) {
      if (selection && selection.n !== n) continue;
      const multipliers = modelEventMultipliers(n);
      const ranking = riders.map((entry) => ({
        ...entry,
        points: entry.penalized.reduce((sum, detail, index) =>
          sum + detail.penalizedScore * (multipliers[index] ?? 0), 0)
      })).sort((a, b) => b.points - a.points || a.rider.localeCompare(b.rider));
      const metrics = modelRankingMetrics(ranking, hiddenRank);
      visit(parameter, n, metrics, ranking, multipliers);
    }
  }
}

function modelOptimalCurves(totals, runCount, values = MODEL_K_VALUES) {
  return MODEL_METRICS.map((metric) => ({
    ...metric,
    points: totals.map((byN, kIndex) => {
      let best = null;
      byN.forEach((sums, nIndex) => {
        const value = sums[metric.key] / runCount;
        if (!best || (metric.maximize ? value > best.value + 1e-12 : value < best.value - 1e-12)) {
          best = { parameter: values[kIndex], n: MODEL_N_VALUES[nIndex], value };
        }
      });
      return best;
    })
  })).map((metric) => ({
    ...metric,
    best: metric.points.reduce((best, point) =>
      (metric.maximize ? point.value > best.value + 1e-12 : point.value < best.value - 1e-12) ? point : best)
  }));
}

function drawModelCurves(canvas, curves, scoring) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const left = 95;
  const right = width - 25;
  const bandHeight = 105;
  const style = getComputedStyle(document.documentElement);
  const text = style.getPropertyValue('--text').trim() || '#222';
  const muted = style.getPropertyValue('--muted').trim() || '#888';
  ctx.clearRect(0, 0, width, canvas.height);
  ctx.font = '13px sans-serif';
  curves.forEach((metric, index) => {
    const top = 25 + index * bandHeight;
    const bottom = top + 65;
    const values = metric.points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const x = (value) => left + (value - scoring.values[0]) * (right - left) / (scoring.values[scoring.values.length - 1] - scoring.values[0]);
    const y = (value) => max === min ? (top + bottom) / 2 : bottom - (value - min) / (max - min) * (bottom - top);
    ctx.fillStyle = text;
    ctx.textAlign = 'left';
    ctx.fillText(metric.label, left, top - 7);
    ctx.strokeStyle = muted;
    ctx.strokeRect(left, top, right - left, bottom - top);
    ctx.textAlign = 'right';
    ctx.fillStyle = muted;
    ctx.fillText(metric.format(max), left - 6, top + 5);
    ctx.fillText(metric.format(min), left - 6, bottom);
    ctx.strokeStyle = metric.color;
    ctx.fillStyle = metric.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    metric.points.forEach((point, i) => {
      if (i === 0) ctx.moveTo(x(point.parameter), y(point.value));
      else ctx.lineTo(x(point.parameter), y(point.value));
    });
    ctx.stroke();
    metric.points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(x(point.parameter), y(point.value), 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  });
  ctx.fillStyle = text;
  ctx.textAlign = 'center';
  scoring.ticks.forEach((value) => ctx.fillText(String(value), left + (value - scoring.values[0]) * (right - left) / (scoring.values[scoring.values.length - 1] - scoring.values[0]), 25 + (curves.length - 1) * bandHeight + 84));
  ctx.fillText(scoring.axis, (left + right) / 2, canvas.height - 4);
}

function renderModelSimulation(simulation, shift) {
  const container = document.getElementById('model-selected-ranking');
  if (!container) return;
  const correlationText = simulation.participation.attendance == null
    ? 'unavailable (no variation in event counts)'
    : simulation.participation.attendance.toFixed(3);
  const uniconRows = simulation.participation.unicons.map((item) =>
    `<tr><td>${escapeXml(item.event)}</td><td>${item.correlation == null ? 'Unavailable' : item.correlation.toFixed(3)}</td><td>${item.maximum == null ? 'Unavailable' : item.maximum.toFixed(3)}</td></tr>`).join('');
  const uniconReport = uniconRows
    ? `<h4>Unicon participation correlations</h4><p class="settings-card-hint">Target: 0.4. The maximum is the theoretical limit for this event size and skill sample; other constraints can reduce the achievable value further.</p><table><thead><tr><th>Event</th><th>Skill–participation correlation</th><th>Theoretical maximum</th></tr></thead><tbody>${uniconRows}</tbody></table>`
    : '<p class="settings-card-hint">No Unicon events are available in this period.</p>';
  const rankingRows = simulation.ranking.map((entry, index) => {
    const skillRank = simulation.hiddenRank.get(entry.rider);
    const rankError = modelWeightedNormalizedRankError(index + 1, skillRank, simulation.ranking.length);
    const detailRows = entry.details.map((detail) =>
      `<tr><td>${escapeXml(detail.event)}</td><td>${detail.place}/${detail.competitorCount}</td><td>${detail.placePoints.toFixed(2)}</td><td>${detail.eventWeight}</td><td>${detail.rawPoints.toFixed(2)}</td><td>${detail.decay.toFixed(3)}</td><td>${detail.score.toFixed(2)}</td><td>${escapeXml(detail.region || '—')}</td><td>${detail.regionMultiplier.toFixed(3)}</td><td>${detail.topMultiplier.toFixed(3)}</td><td>${detail.contribution.toFixed(2)}</td></tr>`).join('');
    return `<tr><td>${index + 1}</td><td><button type="button" class="ghost-button model-detail-toggle" data-model-detail="${index}" aria-expanded="false" aria-controls="model-detail-${index}">${entry.rider}</button></td><td>${skillRank}</td><td>${(rankError * 100).toFixed(2)}%</td><td>${entry.skill.toFixed(3)}</td><td>${simulation.attendance.get(entry.rider)}</td><td>${entry.points.toFixed(2)}</td></tr><tr id="model-detail-${index}" class="hidden"><td colspan="7"><h4>${entry.rider} points breakdown</h4><div class="table-wrapper"><table><thead><tr><th>Event</th><th>Place / riders</th><th>Place points</th><th>Event weight</th><th>Weighted points</th><th>Year decay</th><th>Decayed points</th><th>Region</th><th>Region multiplier</th><th>Top-event multiplier</th><th>Contribution</th></tr></thead><tbody>${detailRows}</tbody><tfoot><tr><th colspan="10">Total</th><th>${entry.points.toFixed(2)}</th></tr></tfoot></table></div></td></tr>`;
  }).join('');
  container.innerHTML = `<h4>Simulation ${simulation.run}, shift ${shift * 100}% (seed ${simulation.seed}, ${simulation.objective}, ${simulation.scoring.label}, ${simulation.scoring.axis} ${simulation.scoring.format(simulation.parameter)}, n ${simulation.n})</h4><p class="settings-card-hint">Maximum weighted normalized rank error: ${(simulation.metrics.maxWeightedError * 100).toFixed(2)}%. Skill–event count correlation: ${correlationText} (target 0.5).</p>${uniconReport}<h4>Test ranking</h4><table><thead><tr><th>Test rank</th><th>Rider</th><th>Hidden skill rank</th><th>Weighted normalized rank error</th><th>Hidden skill</th><th>Events</th><th>Test points</th></tr></thead><tbody>${rankingRows}</tbody></table>`;
  container.querySelectorAll('.model-detail-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const detailRow = document.getElementById(`model-detail-${button.dataset.modelDetail}`);
      const expanded = button.getAttribute('aria-expanded') === 'true';
      detailRow.classList.toggle('hidden', expanded);
      button.setAttribute('aria-expanded', String(!expanded));
    });
  });
}

async function runHiddenSkillModel() {
  const summary = document.getElementById('model-summary');
  const results = document.getElementById('model-results');
  const button = document.getElementById('model-run-button');
  const seedInput = document.getElementById('model-seed');
  if (!summary || !results || !button || !seedInput) return;
  const seedValue = Number(seedInput.value);
  if (seedInput.value.trim() === '' || !Number.isSafeInteger(seedValue) || seedValue < 0 || seedValue > 4294967196) {
    summary.textContent = 'Enter an integer seed between 0 and 4294967196.';
    results.innerHTML = '';
    return;
  }
  if (!eventResults.size) {
    summary.textContent = 'Event data is still loading. Try again when the rankings are visible.';
    results.innerHTML = '';
    return;
  }

  const modelEvents = EVENT_FILES.map((event) => {
    const yearMatch = String(event.name).match(/(\d{2})$/);
    const year = yearMatch ? 2000 + Number(yearMatch[1]) : null;
    return { event: { ...event }, year, entries: eventResults.get(event.name)?.male || [] };
  }).filter((item) => item.year >= 2022 && item.year <= 2026 && item.entries.length > 0);
  const realRiders = [];
  const riderKeys = new Set();
  modelEvents.forEach(({ entries }) => {
    entries.forEach((entry) => {
      const key = normalizeName(entry.rider);
      if (key && !riderKeys.has(key)) {
        riderKeys.add(key);
        realRiders.push(entry.rider);
      }
    });
  });
  if (realRiders.length < 2 || !modelEvents.length) {
    summary.textContent = 'There are not enough 2022–2026 male/open event results to run the model.';
    results.innerHTML = '';
    return;
  }

  const dummyByRider = new Map(realRiders.map((rider, index) => [normalizeName(rider), `Rider${index + 1}`]));
  const shifts = [0.05, 0.1, 0.2, 0.3];
  const runCount = 100;
  const simulations = shifts.map(() => ({
    first: null,
    scorings: MODEL_SCORINGS.map((scoring) => ({
      totals: scoring.values.map(() => MODEL_N_VALUES.map(() =>
        Object.fromEntries(MODEL_METRICS.map((metric) => [metric.key, 0]))))
    }))
  }));
  const decayRate = yearDecay;
  const penalty = regionPenalty;
  button.disabled = true;
  results.innerHTML = '';
  try {
    for (let run = 0; run < runCount; run++) {
      summary.textContent = `Running simulation ${run + 1} of ${runCount}…`;
      await new Promise((resolve) => setTimeout(resolve, 0));
      const random = modelRandomGenerator(seedValue + run);
      const skills = new Map(realRiders.map((rider) => [dummyByRider.get(normalizeName(rider)), modelNormalRandom(random)]));
      const rosters = new Map();
      const attendance = new Map([...skills.keys()].map((rider) => [rider, 0]));
      modelEvents.forEach(({ event, entries }) => {
        const riders = [...new Set(entries.map((entry) => dummyByRider.get(normalizeName(entry.rider))).filter(Boolean))];
        rosters.set(event.name, riders);
        riders.forEach((rider) => attendance.set(rider, attendance.get(rider) + 1));
      });
      const unicons = modelEvents.filter(({ event }) => /^unicon/i.test(event.name));
      const participation = calibrateModelParticipation(skills, rosters, attendance, unicons, random);
      const hiddenOrder = [...skills.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([rider]) => rider);
      const hiddenRank = new Map(hiddenOrder.map((rider, index) => [rider, index + 1]));
      const noise = new Map();
      rosters.forEach((riders, event) => noise.set(event, new Map(riders.map((rider) => [rider, 2 * random() - 1]))));
      shifts.forEach((shift, index) => {
        const aggregate = simulations[index];
        MODEL_SCORINGS.forEach((scoring, scoringIndex) => {
          const totals = aggregate.scorings[scoringIndex].totals;
          evaluateModelSimulation(modelEvents, skills, rosters, noise, shift, decayRate, penalty, hiddenRank, (parameter, n, metrics) => {
            const parameterIndex = scoring.key === 'power' ? Math.round(parameter * 10) - 10 : parameter - 1;
            MODEL_METRICS.forEach((metric) => { totals[parameterIndex][n - MODEL_N_VALUES[0]][metric.key] += metrics[metric.key]; });
          }, null, scoring);
        });
        if (run === 0) aggregate.first = { skills, rosters, noise, participation, attendance, hiddenRank };
      });
    }
    summary.textContent = `${realRiders.length} dummy riders across ${modelEvents.length} male/open events. ${runCount} simulations per shift, each with a separate seed; simulations with the same number share riders, skills, rosters and event noise across shifts.`;
    simulations.forEach((aggregate) => aggregate.scorings.forEach((result, index) => {
      result.curves = modelOptimalCurves(result.totals, runCount, MODEL_SCORINGS[index].values);
    }));
    results.innerHTML = simulations.map((aggregate, index) => {
      const plots = aggregate.scorings.map((result, scoringIndex) => {
        const scoring = MODEL_SCORINGS[scoringIndex];
        return `<div style="flex:1 0 600px;min-width:0"><h4>${scoring.label}</h4><canvas id="model-plot-${index}-${scoringIndex}" width="900" height="${25 + result.curves.length * 105}" style="width:100%;height:auto;display:block" role="img" aria-label="${result.curves.length} optimized metrics over ${scoring.axis} for shift ${shifts[index] * 100} percent; values and optimal n are in the tables below"></canvas></div>`;
      }).join('');
      const tables = aggregate.scorings.map((result, scoringIndex) => {
        const scoring = MODEL_SCORINGS[scoringIndex];
        const rows = result.curves.map((metric, metricIndex) =>
          `<tr><td>${metric.label}</td><td>${scoring.format(metric.best.parameter)}</td><td>${metric.best.n}</td><td>${metric.format(metric.best.value)}</td><td><button type="button" class="ghost-button model-run-detail" data-shift="${index}" data-scoring="${scoringIndex}" data-metric="${metricIndex}">View first ranking</button></td></tr>`).join('');
        const detailRows = scoring.values.map((parameter, parameterIndex) =>
          `<tr><td>${scoring.format(parameter)}</td>${result.curves.map((metric) => `<td>${metric.format(metric.points[parameterIndex].value)} (n=${metric.points[parameterIndex].n})</td>`).join('')}</tr>`).join('');
        return `<h4>${scoring.label} optimal settings</h4><table><thead><tr><th>Objective</th><th>Optimal ${scoring.axis}</th><th>Optimal n</th><th>Average value</th><th>Details</th></tr></thead><tbody>${rows}</tbody></table><details><summary>Values and optimal n for each ${scoring.axis}</summary><table><thead><tr><th>${scoring.axis}</th>${result.curves.map((metric) => `<th>${metric.label}</th>`).join('')}</tr></thead><tbody>${detailRows}</tbody></table></details>`;
      }).join('');
      return `<section><h4>Shift ±${shifts[index] * 100}%</h4><div style="display:flex;gap:16px;overflow-x:auto">${plots}</div>${tables}</section>`;
    }).join('') + '<div id="model-selected-ranking"></div>';
    simulations.forEach((aggregate, index) => aggregate.scorings.forEach((result, scoringIndex) =>
      drawModelCurves(document.getElementById(`model-plot-${index}-${scoringIndex}`), result.curves, MODEL_SCORINGS[scoringIndex])));
    results.querySelectorAll('.model-run-detail').forEach((runButton) => {
      runButton.addEventListener('click', () => {
        const shiftIndex = Number(runButton.dataset.shift);
        const aggregate = simulations[shiftIndex];
        const scoringIndex = Number(runButton.dataset.scoring);
        const scoring = MODEL_SCORINGS[scoringIndex];
        const metric = aggregate.scorings[scoringIndex].curves[Number(runButton.dataset.metric)];
        const first = aggregate.first;
        evaluateModelSimulation(modelEvents, first.skills, first.rosters, first.noise, shifts[shiftIndex], decayRate, penalty, first.hiddenRank,
          (parameter, n, metrics, ranking, multipliers) => {
            const detailedRanking = ranking.map((entry) => ({
              rider: entry.rider, skill: entry.skill, points: entry.points,
              details: computeRiderPointDetails(entry.scores, multipliers, penalty)
            }));
            renderModelSimulation({ ...first, run: 1, seed: seedValue, parameter, n, metrics, ranking: detailedRanking, objective: metric.label, scoring }, shifts[shiftIndex]);
          }, metric.best, scoring);
        document.getElementById('model-selected-ranking').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  } catch (error) {
    console.error('Could not run the model.', error);
    summary.textContent = `Could not run the model: ${error.message}`;
    results.innerHTML = '';
  } finally {
    button.disabled = false;
  }
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
  // Admins see everything; hosts only see the results generator and the rider sorter.
  const SETTINGS_ACCOUNTS = [
    { username: 'admin1', password: 'test', role: 'admin' },
    { username: 'BUC_Host', password: 'bCvLujmKYHhp', role: 'host' },
    { username: 'Wout', password: 'yy42rXxzdmwS', role: 'host' },
    { username: 'EUC_Host', password: 'FCRLALDDwPVs', role: 'host' }
  ];
  let settingsRole = sessionStorage.getItem('settingsRole');
  if (settingsRole !== 'admin' && settingsRole !== 'host') settingsRole = null;

  function applySettingsRole() {
    const isHost = settingsRole === 'host';
    document.querySelectorAll('[data-admin-only]').forEach((element) => {
      element.classList.toggle('hidden', isHost);
    });
    if (isHost) {
      const eventStrength = document.getElementById('event-strength-wrapper');
      if (eventStrength) eventStrength.classList.add('hidden');
    }
  }

  let pendingTab = null;
  function canAccessTab(tab) {
    if (tab === 'tools') return settingsRole === 'admin' || settingsRole === 'host';
    if (tab === 'calculation' || tab === 'model' || tab === 'overview') return settingsRole === 'admin';
    return true;
  }
  function activateTab(targetTab) {
    document.querySelectorAll('.settings-tab-button').forEach((btn) => {
      const isActive = btn.getAttribute('data-tab') === targetTab;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    document.querySelectorAll('.settings-tab-panel').forEach((panel) => {
      panel.classList.toggle('hidden', panel.getAttribute('data-tab-panel') !== targetTab);
    });
    if (targetTab === 'overview') renderDataOverview();
  }

  function openSettingsPanel() {
    if (!settingsPanel) return;
    applySettingsRole();
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
    openSettingsButton.addEventListener('click', openSettingsPanel);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = loginUsernameInput ? loginUsernameInput.value.trim() : '';
      const password = loginPasswordInput ? loginPasswordInput.value : '';
      const account = SETTINGS_ACCOUNTS.find((item) => item.username === username && item.password === password);
      if (account) {
        settingsRole = account.role;
        sessionStorage.setItem('settingsRole', account.role);
        sessionStorage.setItem('settingsUser', account.username);
        hideLoginModal();
        openSettingsPanel();
        if (pendingTab && canAccessTab(pendingTab)) activateTab(pendingTab);
        pendingTab = null;
      } else if (loginError) {
        loginError.classList.remove('hidden');
      }
    });
  }

  if (loginCancelButton) {
    loginCancelButton.addEventListener('click', () => { pendingTab = null; hideLoginModal(); });
  }

  if (loginOverlay) {
    loginOverlay.addEventListener('click', (e) => {
      if (e.target === loginOverlay) { pendingTab = null; hideLoginModal(); }
    });
  }

  if (closeSettingsButton && settingsPanel) {
    closeSettingsButton.addEventListener('click', () => {
      settingsPanel.classList.add('hidden');
    });
  }

  ['show-points', 'show-wins', 'show-battles', 'show-podiums', 'show-rider-strength'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('change', updateSettingsFromInputs);
    }
  });

  ['only-current-year', 'season-decay', 'region-penalty', 'min-place-points', 'scaling-mode', 'scaling-power', 'custom-formula', 'top-event-multipliers', 'battle-weight', 'battle-factors'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', updateScoringSettingsFromInputs);
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

  // Graph points: plot place points for the selected scaling function
  const correlationButton = document.getElementById('correlation-run-button');
  if (correlationButton) {
    correlationButton.addEventListener('click', renderCorrelationAnalysis);
  }

  const modelButton = document.getElementById('model-run-button');
  if (modelButton) modelButton.addEventListener('click', runHiddenSkillModel);

  const graphButton = document.getElementById('graph-points-button');
  const graphCanvas = document.getElementById('graph-points-canvas');
  if (graphButton && graphCanvas) {
    const graphList = document.getElementById('graph-points-list');
    const graphTooltip = document.getElementById('graph-points-tooltip');
    const COLORS = ['#4da3ff', '#ff8a4d', '#4dd08a', '#e05fd0', '#f2d34d', '#4dd6e0', '#ff5f6d', '#a58bff'];
    const plots = [];
    let nextPlotId = 1;
    const pad = { l: 48, r: 16, t: 16, b: 40 };

    const describePlot = (n) => {
      const mode = scalingMode === 'power'
        ? `Power k=${scalingPower}`
        : scalingMode === 'custom'
          ? `Custom: ${customFormulaText}`
          : `${scalingMode === 'linear' ? 'Linear' : 'Exponential'}, last ${minPlacePoints}`;
      return `${mode}, ${n} riders`;
    };

    const geometry = () => {
      const maxN = Math.max(2, ...plots.map((p) => p.n));
      const pw = graphCanvas.width - pad.l - pad.r;
      const ph = graphCanvas.height - pad.t - pad.b;
      return {
        maxN,
        x: (place) => pad.l + ((place - 1) / (maxN - 1)) * pw,
        y: (value) => pad.t + ph - (Math.max(0, Math.min(100, value)) / 100) * ph
      };
    };

    const drawPlots = () => {
      const ctx = graphCanvas.getContext('2d');
      const w = graphCanvas.width;
      const h = graphCanvas.height;
      const { maxN, x, y } = geometry();
      ctx.clearRect(0, 0, w, h);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = 'rgba(30,41,59,0.15)';
      ctx.lineWidth = 1;
      for (let v = 0; v <= 100; v += 20) {
        ctx.beginPath(); ctx.moveTo(pad.l, y(v)); ctx.lineTo(w - pad.r, y(v)); ctx.stroke();
        ctx.fillText(String(v), 14, y(v) + 5);
      }
      ctx.fillText('1', x(1) - 4, h - 20);
      ctx.fillText(String(maxN), x(maxN) - 10, h - 20);
      ctx.fillText('Place', pad.l + (w - pad.l - pad.r) / 2 - 18, h - 3);
      plots.forEach((plot) => {
        ctx.strokeStyle = plot.color;
        ctx.fillStyle = plot.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        plot.points.forEach((value, i) => (i === 0 ? ctx.moveTo(x(1), y(value)) : ctx.lineTo(x(i + 1), y(value))));
        ctx.stroke();
        if (plot.n <= 60) plot.points.forEach((value, i) => { ctx.beginPath(); ctx.arc(x(i + 1), y(value), 3.5, 0, Math.PI * 2); ctx.fill(); });
      });
    };

    const renderPlotList = () => {
      if (!graphList) return;
      graphList.innerHTML = '';
      plots.forEach((plot) => {
        const item = document.createElement('li');
        item.style.cssText = 'display:flex;align-items:center;gap:8px;margin:4px 0';
        const swatch = document.createElement('span');
        swatch.style.cssText = `width:12px;height:12px;border-radius:50%;background:${plot.color};flex:none`;
        const label = document.createElement('span');
        label.textContent = plot.name;
        label.style.flex = '1';
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'ghost-button';
        del.title = 'Delete plot';
        del.setAttribute('aria-label', `Delete plot ${plot.name}`);
        del.textContent = '🗑';
        del.addEventListener('click', () => {
          plots.splice(plots.indexOf(plot), 1);
          renderPlotList();
          drawPlots();
        });
        item.append(swatch, label, del);
        graphList.appendChild(item);
      });
    };

    graphButton.addEventListener('click', () => {
      const n = Math.max(1, Math.floor(Number(document.getElementById('graph-rider-count')?.value) || 0));
      const usedColors = new Set(plots.map((p) => p.color));
      const color = COLORS.find((c) => !usedColors.has(c)) || COLORS[nextPlotId % COLORS.length];
      plots.push({
        id: nextPlotId++,
        n,
        color,
        name: describePlot(n),
        points: Array.from({ length: n }, (_, i) => getPlacePoints(i + 1, n))
      });
      renderPlotList();
      drawPlots();
    });

    graphCanvas.addEventListener('mousemove', (event) => {
      if (!graphTooltip) return;
      const rect = graphCanvas.getBoundingClientRect();
      const scale = graphCanvas.width / rect.width;
      const mx = (event.clientX - rect.left) * scale;
      const my = (event.clientY - rect.top) * scale;
      const { x, y } = geometry();
      let best = null;
      plots.forEach((plot) => plot.points.forEach((value, i) => {
        const dist = Math.hypot(x(i + 1) - mx, y(value) - my);
        if (dist <= 12 && (!best || dist < best.dist)) best = { dist, plot, place: i + 1, value };
      }));
      if (!best) {
        graphTooltip.classList.add('hidden');
        return;
      }
      graphTooltip.textContent = `${best.plot.name} - place ${best.place}: ${best.value.toFixed(2)} pts`;
      graphTooltip.classList.remove('hidden');
      const px = x(best.place) / scale;
      const py = y(best.value) / scale;
      graphTooltip.style.left = `${Math.min(px + 10, rect.width - graphTooltip.offsetWidth - 4)}px`;
      graphTooltip.style.top = `${Math.max(py - 30, 0)}px`;
    });
    graphCanvas.addEventListener('mouseleave', () => graphTooltip?.classList.add('hidden'));
    drawPlots();
  }

  // Settings tabs (General / Calculation / Tools)
  document.querySelectorAll('.settings-tab-button').forEach((button) => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      if (canAccessTab(targetTab)) {
        activateTab(targetTab);
      } else {
        pendingTab = targetTab;
        showLoginModal();
      }
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

  setupResultsTextBuilder();
}

function setupResultsTextBuilder() {
  const eventCodeInput = document.getElementById('results-event-code');
  const eventYearInput = document.getElementById('results-event-year');
  const knownEventCodes = document.getElementById('known-event-codes');
  const preview = document.getElementById('results-text-preview');
  const generateButton = document.getElementById('generate-results-text');
  const status = document.getElementById('results-builder-status');
  if (!eventCodeInput || !eventYearInput || !knownEventCodes || !preview || !generateButton) return;
  const scoreFormatHint = document.getElementById('results-builder-score-format');
  const scoreNameLists = {};
  const scoreNamesStorageKey = `results-builder-score-names-${activeDisciplineKey}`;
  if (scoreFormatHint) {
    if (activeDisciplineKey === 'flatland') {
      const hint = document.getElementById('results-builder-hint');
      if (hint) hint.innerHTML = 'Step 1: enter an <strong>event code</strong> and <strong>year</strong>. Step 2: fill in the <strong>Final rider ranking</strong> and, optionally, the <strong>Prelim</strong> tab for each gender. Step 3: on the <strong>Battles</strong> tab add the battle results. Then generate the file.';
      scoreFormatHint.innerHTML = '<strong>Final rider ranking:</strong> only the final order, one rider per line, like <code>1. Rider Name</code>, <code>2. Rider Name</code>, … (no scores), or <strong>Import CSV</strong> with no header, one rider per row as <code>placement, rider</code>. <strong>Prelim:</strong> choose the score names yourself (Difficulty, Variety, Fullness and Style are the defaults; use <strong>Add Total</strong> if the prelim has a total score, it then goes first) and enter <code>1. Rider Name, score1 score2…</code> in the same order, or import a CSV with a header row. Use <code>/</code> for a score that was not given.';
      const battleHint = document.getElementById('results-builder-battle-hint');
      if (battleHint) battleHint.innerHTML = 'For each gender first choose the battle scores, either <strong>Import CSV</strong> (score names are read from the CSV header) or <strong>Add score</strong> / <strong>Add default scores</strong> (Votes, Difficulty, Variety, Fullness, Style, Battling, Final Trick). Then enter one battle per line as <code>Winning Rider, Losing Rider, winner scores, loser scores</code>. Scores are separated by spaces, in the same order as the score names above, for example <code>Ben Niediek, Jelle Dillen, 3 16.8/21 14.4/21, 0 14.5/21 18.2/21</code>. Use <code>/</code> for a missing score. <strong>CSV layout:</strong> header <code>Winner, Loser, Votes, Difficulty, …, Votes, Difficulty, …</code> — the winner’s scores first, then the loser’s scores with the same names; one battle per row.';
    } else if (activeDisciplineKey === 'x-style') {
      scoreFormatHint.textContent = 'For lower X-Style rounds, enter each rider’s place within that round. Matching places are tied and converted to overall event places after the riders in later rounds.';
    } else {
      scoreFormatHint.textContent = 'Optional scores are displayed in the order entered.';
    }
  }

  const eventCodes = [...new Set(FLATLAND_EVENT_FILES.map((event) => parseEventNameYearPrefix(event.name).prefix))]
    .sort((left, right) => left.localeCompare(right));
  eventCodes.forEach((eventCode) => {
    const option = document.createElement('option');
    option.value = eventCode;
    knownEventCodes.appendChild(option);
  });

  const builderTabButtons = Array.from(document.querySelectorAll('[data-results-builder-tab]'));
  const builderTabPanels = Array.from(document.querySelectorAll('[data-results-builder-panel]'));
  builderTabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedTab = button.getAttribute('data-results-builder-tab');
      builderTabButtons.forEach((tabButton) => {
        const isActive = tabButton === button;
        tabButton.classList.toggle('active', isActive);
        tabButton.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      builderTabPanels.forEach((panel) => {
        panel.classList.toggle('hidden', panel.getAttribute('data-results-builder-panel') !== selectedTab);
      });
    });
  });

  const roundsByGender = { male: [], female: [] };

  const prelimByGender = {};

  // CSV layout: header row names the scores; then [rank,] rider, score columns.
  function parseCsvRows(text) {
    const source = String(text || '').replace(/^\uFEFF/, '');
    const firstLine = source.split(/\r?\n/, 1)[0];
    const delimiter = [';', '\t', ','].reduce((best, candidate) =>
      firstLine.split(candidate).length > firstLine.split(best).length ? candidate : best, ',');
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < source.length; i++) {
      const char = source[i];
      if (inQuotes) {
        if (char === '"' && source[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          cell += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        row.push(cell);
        cell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && source[i + 1] === '\n') i++;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
    row.push(cell);
    rows.push(row);
    return rows
      .map((cells) => cells.map((value) => value.trim()))
      .filter((cells) => cells.some(Boolean));
  }

  function parseCsvResults(text) {
    const rows = parseCsvRows(text);
    if (rows.length < 2) throw new Error('The CSV needs a header row and at least one rider row.');
    const header = rows[0];
    const dataRows = rows.slice(1);
    const hasRank = dataRows.every((cells) => !cells[0] || /^\d+\.?$/.test(cells[0]));
    const nameColumn = hasRank ? 1 : 0;
    const firstScoreColumn = nameColumn + 1;

    let lastScoreColumn = firstScoreColumn - 1;
    [header, ...dataRows].forEach((cells) => {
      for (let i = cells.length - 1; i > lastScoreColumn; i--) {
        if (cells[i]) {
          lastScoreColumn = i;
          break;
        }
      }
    });

    const scoreNames = [];
    for (let i = firstScoreColumn; i <= lastScoreColumn; i++) scoreNames.push(header[i] || '');

    const entries = dataRows.map((cells, index) => {
      const rider = (cells[nameColumn] || '').replace(/[,;|#]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!rider) return null;
      const scores = scoreNames.map((_, i) => {
        const value = (cells[firstScoreColumn + i] || '').replace(/\s+/g, '').replace(/(\d),(\d)/g, '$1.$2');
        return value || '/';
      });
      const place = hasRank && cells[0] ? Number(cells[0].replace('.', '')) : index + 1;
      return { place, rider, scores };
    }).filter(Boolean);
    return { scoreNames, entries };
  }

  function setScoreNames(gender, names) {
    scoreNameLists[gender].innerHTML = '';
    names.forEach((name) => addScoreNameInput(gender, name));
    saveScoreNames(gender);
  }

  // Final rider ranking CSV: no header, one rider per row as "placement, rider" (or "rider, placement").
  function parseRankingCsv(text) {
    const isPlace = (value) => /^\d+\.?$/.test(String(value || '').trim());
    const cleanName = (value) => String(value || '').replace(/[,;|#]/g, ' ').replace(/\s+/g, ' ').trim();
    return parseCsvRows(text).map((cells, index) => {
      let place = index + 1;
      let rider = cells[0];
      if (isPlace(cells[0]) && cells.length > 1) {
        place = Number(cells[0].replace('.', ''));
        rider = cells[1];
      } else if (isPlace(cells[1])) {
        place = Number(cells[1].replace('.', ''));
      }
      rider = cleanName(rider);
      return rider ? { place, rider } : null;
    }).filter(Boolean);
  }

  async function importCsvIntoRound(gender, round, file, isPrelim, isRanking = false) {
    try {
      const buffer = await file.arrayBuffer();
      let text = new TextDecoder('utf-8').decode(buffer);
      if (text.includes('\uFFFD')) text = new TextDecoder('windows-1252').decode(buffer);
      if (isRanking) {
        const ranking = parseRankingCsv(text);
        if (!ranking.length) throw new Error('No riders found in the CSV.');
        round.textarea.value = ranking.map((entry) => `${entry.place}. ${entry.rider}`).join('\n');
        showStatus(`Imported ${ranking.length} rider(s) from ${file.name} into ${genderLabel(gender)} ${round.button.textContent}.`);
        return;
      }
      const { scoreNames, entries } = parseCsvResults(text);
      if (!entries.length) throw new Error('No riders found in the CSV.');
      round.textarea.value = entries
        .map((entry) => `${entry.place}. ${entry.rider}${entry.scores.length ? `, ${entry.scores.join(' ')}` : ''}`)
        .join('\n');
      if (isPrelim) {
        round.namesInput.value = scoreNames.map((name) => name || '?').join(', ');
      } else {
        setScoreNames(gender, scoreNames);
      }
      showStatus(`Imported ${entries.length} rider(s) from ${file.name} into ${genderLabel(gender)} ${round.button.textContent}.`);
    } catch (error) {
      showStatus(`CSV import failed: ${error.message}`, true);
    }
  }

  function createCsvImportControl(gender, round, isPrelim, isRanking = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'rider-sort-actions';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ghost-button';
    button.textContent = 'Import CSV';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.tsv,.txt,text/csv';
    fileInput.className = 'hidden';
    button.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const [file] = fileInput.files;
      fileInput.value = '';
      if (file) await importCsvIntoRound(gender, round, file, isPrelim, isRanking);
    });
    wrapper.append(button, fileInput);
    return wrapper;
  }

  function activateRound(gender, activeRound) {
    [...roundsByGender[gender], prelimByGender[gender]].filter(Boolean).forEach((round) => {
      const isActive = round === activeRound;
      round.button.classList.toggle('active', isActive);
      round.button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      round.panel.classList.toggle('hidden', !isActive);
    });
  }

  // Prelim results are written to the separate "<Event>_D.txt" detail file, which the
  // results page shows above the battles.
  function addPrelimRound(gender) {
    const tabs = document.getElementById(`${gender}-round-tabs`);
    const panels = document.getElementById(`${gender}-round-panels`);
    if (!tabs || !panels) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'round-tab-button';
    button.textContent = 'Prelim';
    button.setAttribute('role', 'tab');

    const panel = document.createElement('div');
    panel.className = 'round-panel hidden';
    panel.setAttribute('role', 'tabpanel');

    const namesBar = document.createElement('div');
    namesBar.className = 'score-names-builder';
    const namesCaption = document.createElement('strong');
    namesCaption.textContent = 'Prelim scores';
    const namesList = document.createElement('div');
    namesList.className = 'score-names-list';
    const addNameRow = (value = '') => {
      const row = document.createElement('div');
      row.className = 'score-name-row';
      const input = document.createElement('input');
      input.type = 'text';
      input.value = value;
      input.placeholder = 'Score name';
      input.setAttribute('aria-label', `${gender} prelim score name`);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'ghost-button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', 'Remove score');
      remove.addEventListener('click', () => row.remove());
      row.append(input, remove);
      namesList.appendChild(row);
    };
    const setNames = (names) => {
      namesList.innerHTML = '';
      names.forEach((name) => addNameRow(name));
    };
    const makeNamesButton = (text, onClick) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ghost-button';
      btn.textContent = text;
      btn.addEventListener('click', onClick);
      return btn;
    };
    const defaultNames = () => (activeDisciplineKey === 'flatland' ? [...PRELIM_SCORE_CATEGORIES] : ['Total']);
    setNames(defaultNames());
    // "Total" is an ordinary score; when present it must be first (the results page shows it as the main score).
    const addTotal = () => {
      const hasTotal = Array.from(namesList.querySelectorAll('input')).some((input) => /^total/i.test(input.value.trim()));
      if (!hasTotal) setNames(['Total', ...namesInput.names]);
    };
    namesBar.append(
      namesCaption,
      namesList,
      makeNamesButton('Add score', () => addNameRow()),
      makeNamesButton('Add Total', addTotal),
      makeNamesButton('Reset to defaults', () => setNames(defaultNames()))
    );
    // Score names as written to the "@prelim" header, in the order the scores are entered.
    const namesInput = {
      get names() {
        return Array.from(namesList.querySelectorAll('input'))
          .map((input) => input.value.replace(/[,;|#]/g, ' ').replace(/\s+/g, ' ').trim())
          .filter(Boolean);
      },
      get value() {
        return this.names.join(', ');
      },
      set value(text) {
        setNames(String(text).split(',').map((name) => name.trim()).filter(Boolean));
      }
    };

    const textarea = document.createElement('textarea');
    textarea.rows = 10;
    textarea.placeholder = '1. Ben Niediek, 24.5/30 24/30 18.7/20 16.7/20\n2. Marvin Henke, 20/30 19/30 14/20 13/20\n3. Rider Name, / 17/30 12/20 10/20';
    textarea.setAttribute('aria-label', `${gender} prelim results`);
    panel.append(namesBar, textarea);

    const prelim = { button, panel, textarea, namesInput };
    panel.insertBefore(createCsvImportControl(gender, prelim, true), textarea);
    prelimByGender[gender] = prelim;
    tabs.appendChild(button);
    panels.appendChild(panel);
    button.addEventListener('click', () => activateRound(gender, prelim));
  }

  function addRound(gender) {
    const index = roundsByGender[gender].length;
    const isFlatland = activeDisciplineKey === 'flatland';
    const roundName = isFlatland ? 'Final rider ranking' : (index === 0 ? 'Final' : `Lower round ${index}`);
    const tabs = document.getElementById(`${gender}-round-tabs`);
    const panels = document.getElementById(`${gender}-round-panels`);
    if (!tabs || !panels) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'round-tab-button';
    button.textContent = roundName;
    button.setAttribute('role', 'tab');

    const panel = document.createElement('div');
    panel.className = 'round-panel';
    panel.setAttribute('role', 'tabpanel');

    const textarea = document.createElement('textarea');
    textarea.rows = 10;
    textarea.placeholder = isFlatland
      ? '1. Rider Name\n2. Rider Name\n3. Rider Name'
      : '1. Rider Name 95.5 24 18\nRider Name 83 21';
    textarea.setAttribute('aria-label', `${gender} ${roundName} results`);
    panel.appendChild(textarea);

    const round = { button, panel, textarea };
    panel.insertBefore(createCsvImportControl(gender, round, false, isFlatland), textarea);
    roundsByGender[gender].push(round);
    tabs.insertBefore(button, prelimByGender[gender]?.button || null);
    panels.appendChild(panel);
    button.addEventListener('click', () => activateRound(gender, round));
    activateRound(gender, round);
  }

  function parseRound(text) {
    return text.split(/\r?\n/).map((rawLine, index) => {
      const line = rawLine.trim();
      if (!line || line === '-') return null;

      const placementMatch = line.match(/^(\d+)[.)]?\s+(.+)$/);
      const explicitPlace = placementMatch ? Number(placementMatch[1]) : null;
      const riderAndScores = placementMatch
        ? removePlacementRiderId(placementMatch[2].trim())
        : line;
      const { rider, scores } = splitRiderAndScores(riderAndScores);
      if (!rider) return null;

      return {
        rider,
        place: explicitPlace ?? (index + 1),
        scores
      };
    }).filter(Boolean);
  }

  function buildGenderResults(gender) {
    const includedRiders = new Set();
    const rounds = roundsByGender[gender].map((round) => {
      const entries = parseRound(round.textarea.value).filter((entry) => {
        const riderKey = normalizeName(entry.rider);
        if (includedRiders.has(riderKey)) return false;
        includedRiders.add(riderKey);
        return true;
      });
      return entries;
    }).filter((entries) => entries.length > 0);

    if (activeDisciplineKey === 'x-style' && rounds.length > 1) {
      let nextOverallPlace = rounds[0].length + 1;
      for (let roundIndex = 1; roundIndex < rounds.length; roundIndex++) {
        const entries = rounds[roundIndex];
        const placeGroups = new Map();
        entries.forEach((entry) => {
          if (!placeGroups.has(entry.place)) placeGroups.set(entry.place, []);
          placeGroups.get(entry.place).push(entry);
        });

        let place = nextOverallPlace;
        const overallPlaceByEntry = new Map();
        [...placeGroups.keys()].sort((a, b) => a - b).forEach((roundPlace) => {
          const tiedEntries = placeGroups.get(roundPlace);
          tiedEntries.forEach((entry) => {
            overallPlaceByEntry.set(entry, place);
          });
          place += tiedEntries.length;
        });
        nextOverallPlace += entries.length;
        rounds[roundIndex] = entries
          .map((entry) => ({ ...entry, place: overallPlaceByEntry.get(entry) }))
          .sort((a, b) => a.place - b.place);
      }
    }

    const body = rounds
      .map((entries) => entries.map((entry) => `${entry.place}. ${entry.rider}${entry.scores.length ? `, ${entry.scores.join(' ')}` : ''}`).join('\r\n'))
      .join('\r\n-\r\n');
    const names = getScoreNames(gender);
    return body && names.length ? `${SCORE_NAMES_PREFIX} ${names.join(', ')}\r\n${body}` : body;
  }

  function getScoreNames(gender) {
    if (!scoreNameLists[gender]) return [];
    return Array.from(scoreNameLists[gender].querySelectorAll('input'))
      .map((input) => input.value.replace(/[,;|#]/g, ' ').trim())
      .map((name) => name || '?');
  }

  function saveScoreNames(gender) {
    try {
      localStorage.setItem(`${scoreNamesStorageKey}-${gender}`, JSON.stringify(Array.from(scoreNameLists[gender].querySelectorAll('input')).map((i) => i.value)));
    } catch (e) {
      // storage unavailable; names are still written to the generated file
    }
  }

  function addScoreNameInput(gender, value = '') {
    const list = scoreNameLists[gender];
    const row = document.createElement('div');
    row.className = 'score-name-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.placeholder = `Score ${list.children.length + 1} name`;
    input.setAttribute('aria-label', `${gender} score name`);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'ghost-button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', 'Remove score');
    remove.addEventListener('click', () => {
      row.remove();
      saveScoreNames(gender);
    });
    input.addEventListener('input', () => saveScoreNames(gender));
    row.append(input, remove);
    list.appendChild(row);
  }

  // Builds the score-name row between the round tabs and the input boxes of one gender.
  function setupScoreNames(gender) {
    const panels = document.getElementById(`${gender}-round-panels`);
    if (!panels || activeDisciplineKey === 'flatland') return;
    const bar = document.createElement('div');
    bar.className = 'score-names-builder';
    const label = document.createElement('strong');
    label.textContent = 'Score names';
    const list = document.createElement('div');
    list.className = 'score-names-list';
    scoreNameLists[gender] = list;
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'ghost-button';
    add.textContent = 'Add score';
    add.addEventListener('click', () => {
      addScoreNameInput(gender);
      saveScoreNames(gender);
    });
    bar.append(label, list, add);
    panels.parentNode.insertBefore(bar, panels);

    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(`${scoreNamesStorageKey}-${gender}`) || 'null');
    } catch (e) {
      saved = null;
    }
    const defaults = [];
    (Array.isArray(saved) ? saved : defaults).forEach((name) => addScoreNameInput(gender, String(name)));
  }

  setupScoreNames('male');
  setupScoreNames('female');

  // Flatland battles: the user chooses the score names (CSV header, single scores, or the defaults)
  // and every battle line must then hold exactly one value per name for each rider.
  const battleNameLists = {};
  const battleNamesStorageKey = `results-builder-battle-score-names-${activeDisciplineKey}`;

  function getBattleNames(gender) {
    if (!battleNameLists[gender]) return [];
    return Array.from(battleNameLists[gender].querySelectorAll('input'))
      .map((input) => input.value.replace(/[,;|#]/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  function saveBattleNames(gender) {
    try {
      localStorage.setItem(`${battleNamesStorageKey}-${gender}`, JSON.stringify(Array.from(battleNameLists[gender].querySelectorAll('input')).map((i) => i.value)));
    } catch (e) {
      // storage unavailable; names are still written to the generated file
    }
  }

  function addBattleNameInput(gender, value = '') {
    const list = battleNameLists[gender];
    const row = document.createElement('div');
    row.className = 'score-name-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.placeholder = 'Score name';
    input.setAttribute('list', 'battle-score-suggestions');
    input.setAttribute('aria-label', `${gender} battle score name`);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'ghost-button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', 'Remove score');
    remove.addEventListener('click', () => {
      row.remove();
      saveBattleNames(gender);
    });
    input.addEventListener('input', () => saveBattleNames(gender));
    row.append(input, remove);
    list.appendChild(row);
  }

  function setBattleNames(gender, names) {
    battleNameLists[gender].innerHTML = '';
    names.forEach((name) => addBattleNameInput(gender, name));
    saveBattleNames(gender);
  }

  // CSV layout: "Winner, Loser, <names>, <names>"; the first group holds the winner's scores,
  // the second group the loser's. The score names are taken from the first group.
  function parseBattleCsv(text) {
    const rows = parseCsvRows(text);
    if (rows.length < 2) throw new Error('The CSV needs a header row and at least one battle row.');
    const header = rows[0].slice();
    while (header.length && !header[header.length - 1]) header.pop();
    const scoreColumns = header.length - 2;
    if (scoreColumns < 2 || scoreColumns % 2 !== 0) {
      throw new Error('The header must be: Winner, Loser, then the score names for the winner followed by the same score names for the loser.');
    }
    const count = scoreColumns / 2;
    const names = header.slice(2, 2 + count).map((name, i) => name || header[2 + count + i] || '');
    if (names.some((name) => !name)) throw new Error('Every score column in the CSV header needs a name.');
    const cleanScore = (value) => {
      const score = String(value || '').replace(/\s+/g, '').replace(/(\d),(\d)/g, '$1.$2');
      return !score || /^noscore$/i.test(score) ? '/' : score;
    };
    const cleanName = (value) => String(value || '').replace(/[,;|#]/g, ' ').replace(/\s+/g, ' ').trim();
    let skipped = 0;
    const lines = rows.slice(1).map((cells) => {
      const winner = cleanName(cells[0]);
      const loser = cleanName(cells[1]);
      if (!winner || !loser) {
        skipped++;
        return null;
      }
      const winnerScores = names.map((_, i) => cleanScore(cells[2 + i]));
      const loserScores = names.map((_, i) => cleanScore(cells[2 + count + i]));
      return `${winner}, ${loser}, ${winnerScores.join(' ')}, ${loserScores.join(' ')}`;
    }).filter(Boolean);
    return { names, lines, skipped };
  }

  async function importBattleCsv(gender, file) {
    try {
      const buffer = await file.arrayBuffer();
      let text = new TextDecoder('utf-8').decode(buffer);
      if (text.includes('\uFFFD')) text = new TextDecoder('windows-1252').decode(buffer);
      const { names, lines, skipped } = parseBattleCsv(text);
      if (!lines.length) throw new Error('No battles found in the CSV.');
      setBattleNames(gender, names);
      document.getElementById(`${gender}-battles-input`).value = lines.join('\n');
      showStatus(`Imported ${lines.length} battle(s) from ${file.name} into ${genderLabel(gender)} battles with scores: ${names.join(', ')}.${skipped ? ` Skipped ${skipped} row(s) missing a winner or loser.` : ''}`, skipped > 0);
    } catch (error) {
      showStatus(`CSV import failed: ${error.message}`, true);
    }
  }

  function setupBattleTools(gender) {
    const container = document.getElementById(`${gender}-battle-tools`);
    if (!container || activeDisciplineKey !== 'flatland') return;
    const bar = document.createElement('div');
    bar.className = 'score-names-builder';
    const label = document.createElement('strong');
    label.textContent = 'Battle scores';
    const list = document.createElement('div');
    list.className = 'score-names-list';
    battleNameLists[gender] = list;

    const makeButton = (text, onClick) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ghost-button';
      button.textContent = text;
      button.addEventListener('click', onClick);
      return button;
    };
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.tsv,.txt,text/csv';
    fileInput.className = 'hidden';
    fileInput.addEventListener('change', async () => {
      const [file] = fileInput.files;
      fileInput.value = '';
      if (file) await importBattleCsv(gender, file);
    });

    if (!document.getElementById('battle-score-suggestions')) {
      const suggestions = document.createElement('datalist');
      suggestions.id = 'battle-score-suggestions';
      BATTLE_DEFAULT_SCORE_NAMES.forEach((name) => {
        const option = document.createElement('option');
        option.value = name;
        suggestions.appendChild(option);
      });
      container.appendChild(suggestions);
    }

    bar.append(
      label,
      list,
      makeButton('Add score', () => {
        addBattleNameInput(gender);
        saveBattleNames(gender);
      }),
      makeButton('Add default scores', () => setBattleNames(gender, BATTLE_DEFAULT_SCORE_NAMES)),
      makeButton('Import CSV', () => fileInput.click()),
      fileInput
    );
    container.appendChild(bar);

    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(`${battleNamesStorageKey}-${gender}`) || 'null');
    } catch (e) {
      saved = null;
    }
    if (Array.isArray(saved)) saved.forEach((name) => addBattleNameInput(gender, String(name)));
  }

  setupBattleTools('male');
  setupBattleTools('female');

  function buildBattleResults(gender) {
    if (!activeDiscipline.supportsBattles) return '';
    const input = document.getElementById(`${gender}-battles-input`);
    if (!input) return '';
    const names = getBattleNames(gender);

    const lines = input.value.split(/\r?\n/).map((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) return null;
      const parts = line.split(',').map((part) => part.trim());
      if (parts.length !== 4 || parts.some((part) => !part)) {
        throw new Error(`${genderLabel(gender)} battle line ${index + 1} must contain winner, loser, winner scores, and loser scores.`);
      }
      const [winner, loser, winnerScores, loserScores] = parts;
      if (!names.length) return `${winner},${loser},${winnerScores},${loserScores}`;

      const winnerValues = winnerScores.split(/\s+/);
      const loserValues = loserScores.split(/\s+/);
      if (winnerValues.length !== names.length || loserValues.length !== names.length) {
        throw new Error(`${genderLabel(gender)} battle line ${index + 1} needs ${names.length} score(s) per rider (${names.join(', ')}), separated by spaces. Use / for a missing score.`);
      }
      return `${winner}, ${loser}, ${winnerValues.join(', ')}, ${loserValues.join(', ')}`;
    }).filter(Boolean);

    if (!lines.length) return '';
    return `${names.length ? `@battle ${names.join(', ')}\r\n` : ''}${lines.join('\r\n')}`;
  }

  function showStatus(message, warning = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.remove('hidden');
    status.classList.toggle('has-warnings', warning);
  }

  addRound('male');
  addRound('female');
  addPrelimRound('male');
  addPrelimRound('female');

  function buildPrelimResults(gender) {
    const prelim = prelimByGender[gender];
    if (!prelim) return '';
    const entries = parseRound(prelim.textarea.value);
    if (!entries.length) return '';
    const names = prelim.namesInput.names;
    if (!names.length) throw new Error(`Add at least one ${genderLabel(gender)} prelim score (or clear the prelim results).`);
    const lines = entries.map((entry) => `${entry.place}. ${entry.rider}${entry.scores.length ? `, ${entry.scores.join(', ')}` : ''}`);
    return `@prelim ${names.join(', ')}\r\n${lines.join('\r\n')}`;
  }

  ['male', 'female'].forEach((gender) => {
    const addRoundButton = document.getElementById(`add-${gender}-round`);
    if (addRoundButton && activeDisciplineKey === 'flatland') addRoundButton.classList.add('hidden');
    if (addRoundButton) {
      addRoundButton.addEventListener('click', () => addRound(gender));
    }
  });

  const sendButton = document.getElementById('send-results-text');
  let lastGenerated = null;
  if (sendButton) {
    sendButton.addEventListener('click', async () => {
      if (!lastGenerated) {
        showStatus('Generate the results text file first, then send it.', true);
        return;
      }
      if (!FORMSPREE_ENDPOINT) {
        showStatus('Sending is not configured yet.', true);
        return;
      }
      sendButton.disabled = true;
      try {
        const response = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: `[${sessionStorage.getItem('settingsUser') || 'unknown'}] New results file: ${lastGenerated.filename} (${activeDisciplineKey})`,
            login: sessionStorage.getItem('settingsUser') || 'unknown',
            filename: lastGenerated.filename,
            discipline: activeDisciplineKey,
            content: lastGenerated.text
          })
        });
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        showStatus(`Sent ${lastGenerated.filename} to the maintainer. Thank you!`);
      } catch (error) {
        showStatus(`Could not send the file: ${error.message}`, true);
      } finally {
        sendButton.disabled = false;
      }
    });
  }

  generateButton.addEventListener('click', () => {
    const eventCode = eventCodeInput.value.trim();
    const year = eventYearInput.value.trim();
    if (!/^[A-Za-z]+$/.test(eventCode)) {
      showStatus('Enter an event code containing letters only.', true);
      return;
    }
    if (!/^\d{4}$/.test(year)) {
      showStatus('Enter a four-digit year.', true);
      return;
    }

    try {
      const maleResults = buildGenderResults('male');
      const femaleResults = buildGenderResults('female');
      if (!maleResults && !femaleResults) {
        showStatus('Enter at least one rider result before generating the file.', true);
        return;
      }

      const maleBattles = [buildPrelimResults('male'), buildBattleResults('male')].filter(Boolean).join('\r\n');
      const femaleBattles = [buildPrelimResults('female'), buildBattleResults('female')].filter(Boolean).join('\r\n');
      const maleSection = `${maleResults};${maleBattles ? `\r\n${maleBattles}` : ''}`;
      const femaleSection = `${femaleResults};${femaleBattles ? `\r\n${femaleBattles}` : ''}`;
      const text = `${maleSection}\r\n|\r\n${femaleSection}\r\n`;
      const filename = `${eventCode}${year.slice(-2)}.txt`;
      preview.value = text;
      lastGenerated = { filename, text };

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const download = document.createElement('a');
      download.href = url;
      download.download = filename;
      document.body.appendChild(download);
      download.click();
      download.remove();
      URL.revokeObjectURL(url);
      showStatus(`Downloaded ${filename}.`);
    } catch (error) {
      showStatus(error.message, true);
    }
  });
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
    const parts = line.split('#')[0].split(',').map((p) => p.trim()).filter(Boolean);
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

const eventTextCache = new Map();
const eventDetailTextCache = new Map();

async function getCachedEventDetailText(eventName) {
  if (!eventDetailTextCache.has(eventName)) {
    eventDetailTextCache.set(eventName, await loadEventDetailText(eventName));
  }
  return eventDetailTextCache.get(eventName);
}

async function loadRanking({ preserveView = false } = {}) {
  // Load aliases from `riders_all.txt` if present in project root.
  await loadAliasesFile();

  const ridersByGender = {
    male: new Map(),
    female: new Map(),
    combined: new Map()
  };

  eventResults.clear();
  eventBattles.clear();
  eventPrelimResults.clear();
  RANKING_GENDERS.forEach((gender) => {
    riderStrengthCache[gender] = null;
    riderHistoryByGender[gender].clear();
    riderBattlesByGender[gender].clear();
  });

  for (const event of EVENT_FILES) {
    const eventFile = `${activeDiscipline.resultsDirectory}/${event.file}`;
    let text = eventTextCache.get(eventFile);
    if (text === undefined) {
      const response = await fetch(eventFile);
      if (!response.ok) {
        throw new Error(`Unable to load ${eventFile}`);
      }
      text = await response.text();
      eventTextCache.set(eventFile, text);
    }
    // Interpret event name year suffix as 20xx (e.g. '24' -> 2024).
    // Decay will be applied later relative to a snapshot or the current year (only to events older than the snapshot year).
    const yearMatch = String(event.name || '').match(/(\d{2})$/);
    const eventYear = yearMatch ? 2000 + Number(yearMatch[1]) : null;
    const usesSimpleResults = activeDiscipline.usesSimpleResults && !text.includes('|');
    const genderBlocks = usesSimpleResults
      ? [text.trim()]
      : text.split('|').map((part) => part.trim()).filter(Boolean);
    if (genderBlocks.length === 0) {
      throw new Error(`Unable to parse gender sections in ${eventFile}`);
    }

    const eventEntriesByGender = { male: [], female: [] };
    const eventBattlesByGenderForEvent = { male: [], female: [] };
    const eventPrelimByGender = { male: [], female: [] };

    genderBlocks.forEach((block, index) => {
      const gender = GENDERS[index];
      if (!gender) return;

      let resultsText = block;
      let battleText = '';
      if (!usesSimpleResults) {
        const sectionDelimiter = block.indexOf(';');
        if (sectionDelimiter === -1) {
          throw new Error(`Unable to parse results and battles in ${eventFile} for ${gender} section.`);
        }
        resultsText = block.slice(0, sectionDelimiter).trim();
        battleText = block.slice(sectionDelimiter + 1).trim();
      }
      let roundBreakBefore = false;
      let scoreNames = [];
      const rawLines = resultsText
        .split(/\r?\n/)
        .map((item) => item.trim())
        .reduce((lines, line) => {
          if (!line) return lines;
          const names = parseScoreNamesLine(line);
          if (names) {
            scoreNames = names;
            return lines;
          }
          if (line === '-') {
            roundBreakBefore = true;
            return lines;
          }
          lines.push({ line, roundBreakBefore });
          roundBreakBefore = false;
          return lines;
        }, []);

      if (rawLines.length === 0) {
        return;
      }

      // Parse optional explicit places and trailing scores. Scores are retained in
      // generated result files for display, but do not affect ranking points.
      const parsed = rawLines.map(({ line, roundBreakBefore: startsNewRound }) => {
        const placeMatch = line.match(/^\s*(\d+)[\.)]?\s*(.+)$/);
        const explicitPlace = placeMatch ? Number(placeMatch[1]) : null;
        const riderAndScores = placeMatch
          ? removePlacementRiderId(placeMatch[2].trim())
          : line;
        const { rider, scores } = splitRiderAndScores(riderAndScores);
        return {
          name: rider,
          explicitPlace,
          scores,
          startsNewRound
        };
      });

      const competitorCount = parsed.length;
      const eventEntries = parsed.map((item, index) => {
        // Use the explicit place if provided, otherwise fall back to list order.
        const place = item.explicitPlace ?? (index + 1);
        const basePointsBeforeWeight = getPlacePoints(place, competitorCount);
        const canonical = aliasMap.get(normalizeName(item.name)) || item.name;
        return {
          place,
          rider: canonical,
          basePointsBeforeWeight,
          rawPointsBeforeDecay: basePointsBeforeWeight * event.weight,
          decayMultiplier: null,
          originalName: item.name,
          eventYear,
          startsNewRound: item.startsNewRound,
          scores: item.scores,
          scoreNames
        };
      });

      eventEntriesByGender[gender] = eventEntries;
      const eventRiderSet = new Set(eventEntries.map((e) => e.rider));

      if (battleText) {
        // The battle section may also hold "@prelim Total, A, B" + prelim lines (starting with a
        // place) and an "@battle A, B, ..." line naming the per-battle score categories.
        let prelimNames = null;
        let battleNames = BATTLE_DETAIL_CATEGORIES;
        const inlinePrelim = [];
        const battleLines = [];
        battleText.split(/\r?\n/).map((item) => item.trim()).forEach((line) => {
          const prelimHeader = line.match(/^@prelim\s+(.*)$/i);
          const battleHeader = line.match(/^@battle\s+(.*)$/i);
          if (prelimHeader) {
            prelimNames = prelimHeader[1].split(',').map((name) => name.trim()).filter(Boolean);
          } else if (battleHeader) {
            battleNames = battleHeader[1].split(',').map((name) => name.trim()).filter(Boolean);
          } else if (isPrelimLine(line)) {
            const prelimEntry = parsePrelimLine(line, prelimNames);
            if (prelimEntry) inlinePrelim.push(prelimEntry);
          } else if (activeDiscipline.supportsBattles) {
            battleLines.push(line);
          }
        });
        if (inlinePrelim.length) eventPrelimByGender[gender] = inlinePrelim;

        const battles = [];
        battleLines.forEach((line, index) => {
          if (!line) {
            return; // preserve placeholder position for missing battle rows
          }

          // Optional video link after '#', e.g. "Winner,Loser #https://youtu.be/..."
          const hashIndex = line.indexOf('#');
          const videoUrl = hashIndex === -1 ? null : extractVideoUrl(line.slice(hashIndex + 1));
          const dataLine = hashIndex === -1 ? line : line.slice(0, hashIndex);

          const parts = dataLine.split(/[,;]+/).map((part) => part.trim()).filter(Boolean);
          const detailedFields = parseDetailedBattleFields(parts.slice(2), battleNames);
          if (parts.length !== 2 && parts.length !== 4 && !detailedFields) {
            throw new Error(`Invalid battle line in ${event.name}: ${line}`);
          }

          const isDetailed = Boolean(detailedFields) && parts.length !== 4;
          const [rawWinner, rawLoser, rawWinnerScores = '', rawLoserScores = ''] = parts;
          const winner = aliasMap.get(normalizeName(rawWinner)) || rawWinner;
          const loser = aliasMap.get(normalizeName(rawLoser)) || rawLoser;
          const missing = [winner, loser].filter((name) => !eventRiderSet.has(name));
          if (missing.length > 0) {
            throw new Error(`Battle results for ${event.name} reference unknown rider(s): ${missing.join(', ')}`);
          }

          const round = getBattleRound(event.name, index);
          const battle = {
            round,
            winner,
            loser,
            rawWinner,
            rawLoser,
            winnerScores: !isDetailed && rawWinnerScores ? rawWinnerScores.split(/\s+/) : [],
            loserScores: !isDetailed && rawLoserScores ? rawLoserScores.split(/\s+/) : [],
            videoUrl
          };
          if (isDetailed) {
            battle.detail = {
              winner,
              loser,
              winnerScores: detailedFields.winnerScores,
              loserScores: detailedFields.loserScores,
              videoUrl
            };
          }
          addRiderBattle(winner, event.name, round, loser, 'Won', gender, battle);
          addRiderBattle(loser, event.name, round, winner, 'Lost', gender, battle);

          battles.push(battle);
        });

        eventBattlesByGenderForEvent[gender] = battles;
      }

    });

    eventResults.set(event.name, eventEntriesByGender);
    eventBattles.set(event.name, eventBattlesByGenderForEvent);
    if (eventPrelimByGender.male.length || eventPrelimByGender.female.length) {
      eventPrelimResults.set(event.name, eventPrelimByGender);
    }

    // Optionally enrich with per-battle vote/score breakdowns and preliminary results,
    // loaded from an event-specific "detailed event PDF/<Event>_D.txt" file when present.
    const detailText = activeDiscipline.supportsBattles
      ? await getCachedEventDetailText(event.name)
      : null;
    if (detailText) {
      try {
        const parsedDetail = parseEventDetailText(detailText);
        if (!eventPrelimResults.has(event.name)) {
          eventPrelimResults.set(event.name, {
            male: parsedDetail.male.prelim,
            female: parsedDetail.female.prelim
          });
        }
        GENDERS.forEach((gender) => {
          const battles = eventBattlesByGenderForEvent[gender] || [];
          const battleMap = parsedDetail[gender] ? parsedDetail[gender].battles : null;
          if (!battleMap || battleMap.size === 0) return;
          battles.forEach((battle) => {
            const detail = battleMap.get(`${battle.winner}|||${battle.loser}`);
            if (detail) {
              battle.detail = detail;
            }
          });
        });
      } catch (err) {
        console.warn(`Unable to parse detailed results for ${event.name}:`, err);
      }
    }
  }

  computeRankingSnapshots();

  EVENT_FILES.forEach((event) => {
    const entriesByGender = eventResults.get(event.name) || { male: [], female: [], combined: [] };
    RANKING_GENDERS.forEach((gender) => {
      (entriesByGender[gender] || []).forEach((entry) => {
        const name = entry.rider;
        // The male ranking only contains male riders; female riders' open results count in combined.
        if (gender === 'male' && isFemaleRider(name)) return;
        const yearsOfDecay = entry.eventYear ? Math.max(0, new Date().getFullYear() - entry.eventYear) : 0;
        const decayMultiplier = Math.pow(yearDecay, yearsOfDecay);
        const rawPoints = entry.rawPointsBeforeDecay * decayMultiplier;
        if (!ridersByGender[gender].has(name)) {
          ridersByGender[gender].set(name, { event_scores: [], events: 0, wins: 0, podiums: 0, battles: 0 });
        }
        const stats = ridersByGender[gender].get(name);
        stats.event_scores.push({ score: rawPoints, event: event.name });
        stats.events += 1;
        if (entry.place === 1) stats.wins += 1;
        if (entry.place <= 3) stats.podiums += 1;
        stats.battles = (riderBattlesByGender[gender].get(name) || []).length;

        const history = riderHistoryByGender[gender].get(name) || [];
        history.push({ event: event.name, place: entry.place, weight: event.weight, basePointsBeforeWeight: entry.basePointsBeforeWeight, rawPoints, rawPointsBeforeDecay: entry.rawPointsBeforeDecay, battlePointsBeforeDecay: entry.battlePointsBeforeDecay, battlePointDetails: entry.battlePointDetails || [], decayMultiplier, eventYear: entry.eventYear });
        riderHistoryByGender[gender].set(name, history);
      });
    });
  });

  RANKING_GENDERS.forEach((gender) => {
    globalRowsByGender[gender] = [...ridersByGender[gender].entries()].map(([rider, stats]) => ({
      rider,
      ...stats,
      points: computeRiderTotalPoints(stats.event_scores)
    }));
    globalRowsByGender[gender].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.podiums !== a.podiums) return b.podiums - a.podiums;
      return a.rider.localeCompare(b.rider);
    });
  });

  updateSummaryStats();
  updateFemaleOpenSummary();
  if (preserveView) return;
  populateViewSelector();
  setView('world');
}

// Holds snapshots: array of { event, dateValue, rowsByGender: { male: [...], female: [...] } }
const rankingSnapshots = [];

function computeRankingSnapshots() {
  rankingSnapshots.length = 0;
  // Sort events oldest -> newest
  const eventsSortedAsc = [...EVENT_FILES].sort((a, b) => getEventSortValue(a.name) - getEventSortValue(b.name));
  // We'll accumulate raw contributions per rider (no decay applied yet) so snapshots can apply decay relative to the snapshot year.
  const contributions = { male: new Map(), female: new Map(), combined: new Map() };

  eventsSortedAsc.forEach((event) => {
    const snapshotYear = (() => {
      const m = String(event.name || '').match(/(\d{2})$/);
      return m ? 2000 + Number(m[1]) : new Date().getFullYear();
    })();
    const eventSortValue = getEventSortValue(event.name);

    const entriesByGender = eventResults.get(event.name) || { male: [], female: [] };

    // Compute pre-event rankings from strictly earlier event contributions.
    // Compare using month-aware sort values so events earlier in the same calendar year are
    // correctly treated as "before" (year-only comparison would wrongly exclude them).
    const preEventPointsByGender = { male: new Map(), female: new Map() };
    const postEventPointsByGender = { male: new Map(), female: new Map() };
    GENDERS.forEach((gender) => {
      const currentEntries = entriesByGender[gender] || [];
      const currentEntryByRider = new Map(currentEntries.map((entry) => [entry.rider, entry]));
      const ridersForPostEventPoints = new Set([
        ...contributions[gender].keys(),
        ...currentEntryByRider.keys()
      ]);
      contributions[gender].forEach((contribs, rider) => {
        const decayedScores = contribs.map((c) => {
          const years = Math.max(0, snapshotYear - c.eventYear);
          const mult = Math.pow(yearDecay, years);
          return { score: c.valueBase * mult, eventYear: c.eventYear, eventName: c.eventName, eventSortValue: getEventSortValue(c.eventName) };
        });
        const visible = decayedScores.filter((d) => d.eventSortValue < eventSortValue);
        if (visible.length === 0) return;
        const points = computeRiderTotalPoints(visible.map((d) => ({ score: d.score, event: d.eventName })));
        preEventPointsByGender[gender].set(rider, points);
      });
      ridersForPostEventPoints.forEach((rider) => {
        const earlierScores = (contributions[gender].get(rider) || [])
          .filter((contribution) => getEventSortValue(contribution.eventName) < eventSortValue)
          .map((contribution) => ({
            score: contribution.valueBase * Math.pow(yearDecay, Math.max(0, snapshotYear - contribution.eventYear)),
            event: contribution.eventName
          }));
        const currentEntry = currentEntryByRider.get(rider);
        if (currentEntry) {
          earlierScores.push({
            score: currentEntry.basePointsBeforeWeight * event.weight,
            event: event.name
          });
        }
        if (earlierScores.length) {
          postEventPointsByGender[gender].set(rider, computeRiderTotalPoints(earlierScores));
        }
      });
    });

    GENDERS.forEach((gender) => {
      const entries = entriesByGender[gender] || [];
      const eventBattlesByGender = eventBattles.get(event.name) || { male: [], female: [] };
      const battleBonuses = computeBattleBonuses(
        entries,
        eventBattlesByGender[gender] || [],
        postEventPointsByGender[gender]
      );
      entries.forEach((entry) => {
        const name = entry.rider;
        const place = entry.place;
        const battleBonus = battleBonuses.get(name) || { bonus: 0, details: [] };
        entry.battleBonus = battleBonus.bonus;
        entry.battlePointDetails = battleBonus.details;
        entry.battlePointsBeforeDecay = entry.battleBonus;
        entry.rawPointsBeforeDecay = entry.basePointsBeforeWeight * event.weight + entry.battleBonus;
        const valueBase = entry.rawPointsBeforeDecay;
        if (!contributions[gender].has(name)) contributions[gender].set(name, []);
        contributions[gender].get(name).push({ valueBase, eventYear: entry.eventYear || snapshotYear, place, eventName: event.name });
      });
    });

    // Combined: open results count normally, female results are divided by COMBINED_FEMALE_DIVISOR.
    // A rider appearing in both sections of one event keeps only the better of the two.
    const combinedByRider = new Map();
    GENDERS.forEach((gender) => {
      const scale = gender === 'female' ? 1 / COMBINED_FEMALE_DIVISOR : 1;
      (entriesByGender[gender] || []).forEach((entry) => {
        const scaled = {
          ...entry,
          basePointsBeforeWeight: entry.basePointsBeforeWeight * scale,
          rawPointsBeforeDecay: entry.rawPointsBeforeDecay * scale,
          battleBonus: (entry.battleBonus || 0) * scale,
          battlePointsBeforeDecay: (entry.battlePointsBeforeDecay || 0) * scale
        };
        const existing = combinedByRider.get(entry.rider);
        if (!existing || scaled.rawPointsBeforeDecay > existing.rawPointsBeforeDecay) {
          combinedByRider.set(entry.rider, scaled);
        }
      });
    });
    entriesByGender.combined = [...combinedByRider.values()];
    entriesByGender.combined.forEach((entry) => {
      if (!contributions.combined.has(entry.rider)) contributions.combined.set(entry.rider, []);
      contributions.combined.get(entry.rider).push({
        valueBase: entry.rawPointsBeforeDecay,
        eventYear: entry.eventYear || snapshotYear,
        place: entry.place,
        eventName: event.name
      });
    });

    // Build snapshot for this event: apply decay only to contributions where eventYear < snapshotYear
    const rowsByGender = { male: [], female: [], combined: [] };
    RANKING_GENDERS.forEach((gender) => {
      contributions[gender].forEach((contribs, rider) => {
        if (gender === 'male' && isFemaleRider(rider)) return;
        // compute decayed scores for contribs up to current snapshot
        const decayedScores = contribs.map((c) => {
          const applyDecay = c.eventYear < snapshotYear;
          const years = applyDecay ? (snapshotYear - c.eventYear) : 0;
          const mult = applyDecay ? Math.pow(yearDecay, years) : 1;
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
    if (!activeDiscipline.supportsBattles) {
      battleCount.closest('[data-battle-only]')?.classList.add('hidden');
      return;
    }
    const totalBattles = [...eventBattles.values()].reduce((sum, battlesByGender) => {
      const battles = battlesByGender[currentGender] || [];
      return sum + battles.length;
    }, 0);
    battleCount.textContent = String(totalBattles);
  }

}

function applyDisciplineUi() {
  if (activeDiscipline.supportsBattles) return;
  document.querySelectorAll('[data-battle-only]').forEach((element) => {
    element.classList.add('hidden');
  });
  const profileDescription = document.getElementById('profile-description');
  if (profileDescription) {
    profileDescription.textContent = 'Event results.';
  }
}

function populateViewSelector() {
  const select = document.getElementById('view-select');
  if (!select) return;

  select.innerHTML = IS_RESULTS_SITE ? '' : '<option value="world">All</option>';

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

function pearsonCorrelation(xs, ys) {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null;
}

function averageRanks(values) {
  const order = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const ranks = new Array(values.length);
  for (let i = 0; i < order.length;) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const rank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[order[k][1]] = rank;
    i = j + 1;
  }
  return ranks;
}

function spearmanCorrelation(xs, ys) {
  if (xs.length < 3) return null;
  return pearsonCorrelation(averageRanks(xs), averageRanks(ys));
}

// Positive correlations always mean "better result goes with better standing". Every event is
// compared with the ranking right after it ("after": how well the system judges the performance)
// and with the ranking right before it ("before": how well the system predicts the outcome).
const CORRELATION_METRICS = ['placeRankAfter', 'placeRankBefore', 'countRankAfter', 'countRankBefore', 'countPlaceAfter', 'countPlaceBefore'];

function computeCorrelationAnalysis(gender) {
  const history = riderHistoryByGender[gender];
  const placesByEvent = new Map();
  history.forEach((entries, rider) => entries.forEach((e) => {
    if (!e.place) return;
    if (!placesByEvent.has(e.event)) placesByEvent.set(e.event, []);
    placesByEvent.get(e.event).push({ rider, place: e.place });
  }));

  // Correlations between an event's results and one ranking snapshot's rows.
  const evaluate = (rows, results) => {
    const total = rows.length;
    if (total < 3 || results.length < 5) return null;
    const rowByRider = new Map(rows.map((row, index) => [row.rider, { rank: index + 1, events: row.events }]));
    const pairs = results
      .map((r) => ({ ...r, placePct: (r.place - 1) / Math.max(1, results.length - 1), ...rowByRider.get(r.rider) }))
      .filter((p) => p.rank != null);
    if (pairs.length < 5) return null;
    const rankPct = (rank) => (rank - 1) / Math.max(1, total - 1);
    const maxEvents = Math.max(1, ...rows.map((r) => r.events));
    const top3 = pairs.filter((p) => p.place <= 3);
    return {
      n: pairs.length,
      top3Rank: top3.length ? top3.reduce((sum, p) => sum + p.rank, 0) / top3.length : null,
      placeRank: {
        corr: spearmanCorrelation(pairs.map((p) => p.placePct), pairs.map((p) => rankPct(p.rank))),
        points: pairs.map((p) => ({ label: p.rider, x: p.place, y: p.rank, xn: p.placePct, yn: rankPct(p.rank) }))
      },
      countRank: {
        corr: spearmanCorrelation(rows.map((r) => r.events), rows.map((_, i) => -(i + 1))),
        points: rows.map((r, i) => ({ label: r.rider, x: r.events, y: i + 1, xn: r.events / maxEvents, yn: rankPct(i + 1) }))
      },
      countPlace: {
        corr: spearmanCorrelation(pairs.map((p) => p.events), pairs.map((p) => -p.placePct)),
        points: pairs.map((p) => ({ label: p.rider, x: p.events, y: p.place, xn: p.events / maxEvents, yn: p.placePct }))
      }
    };
  };

  const snapshots = rankingSnapshots.slice().sort((a, b) => a.dateValue - b.dateValue);
  const editions = [];
  snapshots.forEach((snapshot, index) => {
    const results = placesByEvent.get(snapshot.event) || [];
    const variants = {
      After: evaluate(snapshot.rowsByGender[gender] || [], results),
      Before: index > 0 ? evaluate(snapshots[index - 1].rowsByGender[gender] || [], results) : null
    };
    if (!variants.After && !variants.Before) return;
    const edition = {
      name: snapshot.event,
      year: parseEventNameYearPrefix(snapshot.event).year,
      isUnicon: String(parseEventNameYearPrefix(snapshot.event).prefix).toLowerCase() === 'unicon',
      n: { After: variants.After?.n ?? null, Before: variants.Before?.n ?? null },
      top3Rank: { After: variants.After?.top3Rank ?? null, Before: variants.Before?.top3Rank ?? null },
      corr: {},
      scatter: {}
    };
    ['placeRank', 'countRank', 'countPlace'].forEach((base) => {
      ['After', 'Before'].forEach((when) => {
        edition.corr[base + when] = variants[when]?.[base].corr ?? null;
        edition.scatter[base + when] = variants[when]?.[base].points ?? null;
      });
    });
    editions.push(edition);
  });

  // metrics: which columns the average row reports (event-count columns are not split by Unicon).
  const average = (name, list, metrics) => {
    const mean = (values) => {
      const present = values.filter((v) => v != null);
      return present.length ? present.reduce((a, b) => a + b, 0) / present.length : null;
    };
    const sum = (key) => list.reduce((total, g) => total + (g.n[key] || 0), 0) || null;
    const avg = {
      name: `${name} (average of ${list.length})`,
      pooled: true,
      n: { After: sum('After'), Before: sum('Before') },
      top3Rank: {
        After: metrics === 'place' ? mean(list.map((g) => g.top3Rank.After)) : null,
        Before: metrics === 'place' ? mean(list.map((g) => g.top3Rank.Before)) : null
      },
      corr: {},
      scatter: {}
    };
    CORRELATION_METRICS.forEach((metric) => {
      const wanted = metrics === 'place' ? metric.startsWith('placeRank') : !metric.startsWith('placeRank');
      if (!wanted) return;
      avg.corr[metric] = mean(list.map((g) => g.corr[metric]));
      avg.scatter[metric] = list.flatMap((g) => (g.scatter[metric] || []).map((p) => ({ ...p, label: `${p.label} (${g.name})` })));
    });
    return avg;
  };
  const yearlyByYear = new Map();
  editions.forEach((g) => {
    if (!g.year) return;
    if (!yearlyByYear.has(g.year)) yearlyByYear.set(g.year, []);
    yearlyByYear.get(g.year).push(g);
  });
  const yearly = [...yearlyByYear.entries()].sort((a, b) => a[0] - b[0]).map(([year, list]) => {
    const values = {};
    const count = {};
    CORRELATION_METRICS.forEach((metric) => {
      const present = list.map((g) => g.corr[metric]).filter((v) => v != null);
      values[metric] = present.length ? present.reduce((a, b) => a + b, 0) / present.length : null;
      count[metric] = present.length;
    });
    return { year, values, count };
  });
  return {
    editions,
    yearly,
    averages: [
      average('All events', editions, 'count'),
      average('All Unicons', editions.filter((g) => g.isUnicon), 'place'),
      average('All non-Unicon events', editions.filter((g) => !g.isUnicon), 'place')
    ].filter((g) => g.name.indexOf('average of 0') === -1)
  };
}

function renderCorrelationAnalysis() {
  const output = document.getElementById('correlation-result');
  if (!output) return;
  const analysis = computeCorrelationAnalysis(currentGender);
  if (!analysis.editions.length) {
    output.textContent = 'Not enough ranking data loaded yet.';
    return;
  }
  const fmt = (v) => (v == null ? '—' : v.toFixed(2));
  const label = (v) => {
    if (v == null) return '';
    const a = Math.abs(v);
    return a >= 0.7 ? 'strong' : a >= 0.4 ? 'moderate' : a >= 0.2 ? 'weak' : 'none';
  };
  const plotRows = [];
  const cell = (g, metric) => {
    if (!g.scatter[metric]?.length) return '<td>—</td>';
    const v = g.corr[metric];
    return `<td>${fmt(v)} <small>${label(v)}</small> <button class="ghost-button correlation-plot-button" type="button" data-row="${plotRows.indexOf(g)}" data-metric="${metric}">Plot</button></td>`;
  };
  const row = (g, bold) => {
    plotRows.push(g);
    const results = g.n.After == null && g.n.Before == null ? '—' : `${g.n.After ?? '—'} / ${g.n.Before ?? '—'}`;
    const top3 = (when) => `<td>${g.top3Rank[when] == null ? '—' : g.top3Rank[when].toFixed(1)}</td>`;
    const tr = `<td>${escapeXml(g.name)}</td><td>${results}</td>`
      + `${cell(g, 'placeRankAfter')}${cell(g, 'placeRankBefore')}${top3('After')}${top3('Before')}`
      + `${cell(g, 'countRankAfter')}${cell(g, 'countRankBefore')}${cell(g, 'countPlaceAfter')}${cell(g, 'countPlaceBefore')}`;
    return bold ? `<tr style="font-weight:700">${tr}</tr>` : `<tr>${tr}</tr>`;
  };
  const bodyRows = [...analysis.averages.map((g) => row(g, true)), ...analysis.editions.slice().reverse().map((g) => row(g, false))].join('');
  output.innerHTML = `
    <table>
      <thead>
        <tr><th rowspan="2">Event</th><th rowspan="2">Results (after / before)</th><th colspan="2">Place vs rank (Spearman)</th><th colspan="2">Avg rank of top 3</th><th colspan="2">Event count vs rank, all riders (Spearman)</th><th colspan="2">Event count vs place in event (Spearman)</th></tr>
        <tr><th>After event (judging)</th><th>Before event (predicting)</th><th>After</th><th>Before</th><th>After</th><th>Before</th><th>After</th><th>Before</th></tr>
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
    <div id="correlation-plot" class="hidden" style="position:relative;margin-top:12px">
      <strong id="correlation-plot-title"></strong>
      <canvas id="correlation-plot-canvas" width="900" height="520" style="width:100%;height:auto;display:block"></canvas>
      <div id="correlation-plot-tooltip" class="hidden" style="position:absolute;pointer-events:none;background:#000c;color:#fff;padding:4px 8px;border-radius:6px;font-size:12px;white-space:nowrap"></div>
    </div>
    <div style="position:relative;margin-top:16px">
      <strong>Average event correlation per year (Unicon and non-Unicon combined)</strong>
      <canvas id="correlation-year-canvas" width="900" height="460" style="width:100%;height:auto;display:block"></canvas>
      <div id="correlation-year-tooltip" class="hidden" style="position:absolute;pointer-events:none;background:#000c;color:#fff;padding:4px 8px;border-radius:6px;font-size:12px;white-space:pre"></div>
    </div>
    <p class="settings-card-hint">${genderLabel(currentGender)}. "After" uses the ranking right after the event (including it) and shows how well the system judges the performance; it is inflated because the event is part of that ranking. "Before" uses the ranking right before the event and shows how well the system predicts the outcome; only riders already ranked are included, and the first event has no "before". Events with fewer than 5 ranked results are hidden. Positive = a better result goes with a better standing; 1 = perfect, 0 = unrelated. Placement is normalised per event (0 = winner, 1 = last). Averages are plain means of the per-event correlations. Scatter plots are oriented so up/right is better on both axes (a rising line = positive correlation); the dashed line is the least-squares fit. Average rows plot all editions together on normalised axes (0 = best).</p>`;
  output.querySelectorAll('.correlation-plot-button').forEach((button) => {
    button.addEventListener('click', () => {
      const g = plotRows[Number(button.dataset.row)];
      if (g) drawCorrelationScatter(g, button.dataset.metric);
    });
  });
  drawYearlyCorrelation(analysis.yearly);
}

const YEARLY_CORRELATION_SERIES = [
  { metric: 'placeRankAfter', label: 'Place vs rank (after)', color: '#4da3ff' },
  { metric: 'placeRankBefore', label: 'Place vs rank (before)', color: '#4da3ff', dashed: true },
  { metric: 'countRankAfter', label: 'Event count vs rank (after)', color: '#4dd08a' },
  { metric: 'countRankBefore', label: 'Event count vs rank (before)', color: '#4dd08a', dashed: true },
  { metric: 'countPlaceAfter', label: 'Event count vs place (after)', color: '#e05fd0' },
  { metric: 'countPlaceBefore', label: 'Event count vs place (before)', color: '#e05fd0', dashed: true }
];

function drawYearlyCorrelation(yearly) {
  const canvas = document.getElementById('correlation-year-canvas');
  const tooltip = document.getElementById('correlation-year-tooltip');
  if (!canvas || !yearly?.length) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const pad = { l: 56, r: 20, t: 44, b: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const years = yearly.map((y) => y.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const px = (year) => pad.l + (maxYear === minYear ? 0.5 : (year - minYear) / (maxYear - minYear)) * plotW;
  const py = (v) => pad.t + (1 - v) / 2 * plotH;

  const style = getComputedStyle(document.documentElement);
  const textColor = style.getPropertyValue('--text').trim() || '#222';
  const mutedColor = style.getPropertyValue('--muted').trim() || '#888';
  ctx.clearRect(0, 0, W, H);
  ctx.font = '13px sans-serif';
  ctx.lineWidth = 1;
  ctx.strokeStyle = mutedColor;
  ctx.fillStyle = textColor;
  ctx.strokeRect(pad.l, pad.t, plotW, plotH);
  ctx.textAlign = 'right';
  [-1, -0.5, 0, 0.5, 1].forEach((v) => {
    ctx.globalAlpha = v === 0 ? 0.8 : 0.25;
    ctx.beginPath();
    ctx.moveTo(pad.l, py(v));
    ctx.lineTo(pad.l + plotW, py(v));
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(v.toFixed(1), pad.l - 6, py(v) + 4);
  });
  ctx.textAlign = 'center';
  years.forEach((year) => ctx.fillText(String(year), px(year), H - pad.b + 18));

  const hits = [];
  YEARLY_CORRELATION_SERIES.forEach((series) => {
    const points = yearly.filter((y) => y.values[series.metric] != null);
    if (!points.length) return;
    ctx.strokeStyle = series.color;
    ctx.fillStyle = series.color;
    ctx.lineWidth = 2;
    ctx.setLineDash(series.dashed ? [6, 4] : []);
    ctx.beginPath();
    points.forEach((y, i) => {
      const x = px(y.year);
      const yy = py(y.values[series.metric]);
      if (i === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    points.forEach((y) => {
      const x = px(y.year);
      const yy = py(y.values[series.metric]);
      ctx.beginPath();
      ctx.arc(x, yy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      hits.push({ sx: x, sy: yy, series, year: y.year, value: y.values[series.metric], count: y.count });
    });
  });

  ctx.lineWidth = 2;
  ctx.textAlign = 'left';
  let legendX = pad.l;
  let legendY = 14;
  YEARLY_CORRELATION_SERIES.forEach((series) => {
    const width = ctx.measureText(series.label).width + 44;
    if (legendX + width > W - pad.r) {
      legendX = pad.l;
      legendY += 16;
    }
    ctx.strokeStyle = series.color;
    ctx.setLineDash(series.dashed ? [5, 3] : []);
    ctx.beginPath();
    ctx.moveTo(legendX, legendY - 4);
    ctx.lineTo(legendX + 22, legendY - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = textColor;
    ctx.fillText(series.label, legendX + 28, legendY);
    legendX += width + 8;
  });

  canvas.onmousemove = (event) => {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const cx = (event.clientX - rect.left) * scale;
    const cy = (event.clientY - rect.top) * scale;
    let best = null;
    let bestDist = 144;
    hits.forEach((h) => {
      const d = (h.sx - cx) ** 2 + (h.sy - cy) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = h;
      }
    });
    if (!best) {
      tooltip.classList.add('hidden');
      return;
    }
    tooltip.textContent = [String(best.year), best.series.label, `Correlation: ${best.value.toFixed(2)}`, `Events averaged: ${best.count[best.series.metric]}`].join('\n');
    tooltip.classList.remove('hidden');
    const pointX = best.sx / scale;
    const pointY = best.sy / scale + canvas.offsetTop;
    const maxLeft = canvas.offsetLeft + rect.width - tooltip.offsetWidth - 4;
    const maxTop = canvas.offsetTop + rect.height - tooltip.offsetHeight - 4;
    let left = pointX + 12;
    if (left > maxLeft) left = pointX - tooltip.offsetWidth - 12;
    tooltip.style.left = `${Math.max(canvas.offsetLeft + 4, left)}px`;
    tooltip.style.top = `${Math.max(canvas.offsetTop + 4, Math.min(pointY + 12, maxTop))}px`;
  };
  canvas.onmouseleave = () => tooltip.classList.add('hidden');
}

const CORRELATION_PLOT_META = {};
[['After', 'after event'], ['Before', 'before event']].forEach(([when, text]) => {
  CORRELATION_PLOT_META['placeRank' + when] = { title: `Place in event vs rank ${text}`, xLabel: 'Place in event', yLabel: `Rank ${text}`, flipX: true };
  CORRELATION_PLOT_META['countRank' + when] = { title: `Event count vs rank ${text} (all riders)`, xLabel: `Event count ${text}`, yLabel: `Rank ${text}`, flipX: false };
  CORRELATION_PLOT_META['countPlace' + when] = { title: `Event count ${text} vs place in event`, xLabel: `Event count ${text}`, yLabel: 'Place in event', flipX: false };
});

    function drawCorrelationScatter(group, metric) {
      const meta = CORRELATION_PLOT_META[metric];
      const container = document.getElementById('correlation-plot');
      const canvas = document.getElementById('correlation-plot-canvas');
      const tooltip = document.getElementById('correlation-plot-tooltip');
      const title = document.getElementById('correlation-plot-title');
      const points = group.scatter?.[metric];
      if (!meta || !container || !canvas || !points?.length) return;
      const normalised = !!group.pooled;
      const xKey = normalised ? 'xn' : 'x';
      const yKey = normalised ? 'yn' : 'y';
      container.classList.remove('hidden');
      title.textContent = `${meta.title} — ${group.name}`;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      const pad = { l: 64, r: 20, t: 16, b: 52 };
      const xs = points.map((p) => p[xKey]);
      const ys = points.map((p) => p[yKey]);
      const range = (values) => {
        const lo = Math.min(...values);
        const hi = Math.max(...values);
        const margin = (hi - lo || 1) * 0.05;
        return [lo - margin, hi + margin];
      };
      const [x0, x1] = range(xs);
      const [y0, y1] = range(ys);
      const plotW = W - pad.l - pad.r;
      const plotH = H - pad.t - pad.b;
      // Rank/place axes are inverted (1 = best at the top) so that up/right is always "better"
      const px = (v) => (meta.flipX ? pad.l + (x1 - v) / (x1 - x0) * plotW : pad.l + (v - x0) / (x1 - x0) * plotW);
      const py = (v) => pad.t + (v - y0) / (y1 - y0) * plotH;

      const style = getComputedStyle(document.documentElement);
      const textColor = style.getPropertyValue('--text').trim() || '#222';
      const mutedColor = style.getPropertyValue('--muted').trim() || '#888';
      ctx.clearRect(0, 0, W, H);
      ctx.font = '13px sans-serif';
      ctx.strokeStyle = mutedColor;
      ctx.fillStyle = textColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(pad.l, pad.t, plotW, plotH);

      const formatTick = (v) => (normalised ? v.toFixed(2) : String(Math.round(v)));
      for (let i = 0; i <= 5; i++) {
        const xv = x0 + (x1 - x0) * i / 5;
        ctx.textAlign = 'center';
        ctx.fillText(formatTick(xv), px(xv), H - pad.b + 18);
        const yv = y0 + (y1 - y0) * i / 5;
        ctx.textAlign = 'right';
        ctx.fillText(formatTick(yv), pad.l - 6, py(yv) + 4);
      }
      ctx.textAlign = 'center';
      ctx.fillText(normalised ? `${meta.xLabel} (normalised)` : meta.xLabel, pad.l + plotW / 2, H - 10);
      ctx.save();
      ctx.translate(16, pad.t + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(normalised ? `${meta.yLabel} (normalised)` : meta.yLabel, 0, 0);
      ctx.restore();

      const n = xs.length;
      const mx = xs.reduce((a, b) => a + b, 0) / n;
      const my = ys.reduce((a, b) => a + b, 0) / n;
      const sxx = xs.reduce((a, v) => a + (v - mx) ** 2, 0);
      if (sxx > 0) {
        const slope = xs.reduce((a, v, i) => a + (v - mx) * (ys[i] - my), 0) / sxx;
        const fit = (v) => my + slope * (v - mx);
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#ff8a4d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px(x0), py(fit(x0)));
        ctx.lineTo(px(x1), py(fit(x1)));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = 'rgba(77, 163, 255, 0.55)';
      const screenPoints = points.map((p) => ({ p, sx: px(p[xKey]), sy: py(p[yKey]) }));
      screenPoints.forEach(({ sx, sy }) => {
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      canvas.onmousemove = (event) => {
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / rect.width;
        const cx = (event.clientX - rect.left) * scale;
        const cy = (event.clientY - rect.top) * scale;
        let best = null;
        let bestDist = 144;
        screenPoints.forEach((s) => {
          const d = (s.sx - cx) ** 2 + (s.sy - cy) ** 2;
          if (d < bestDist) {
            bestDist = d;
            best = s;
          }
        });
        if (!best) {
          tooltip.classList.add('hidden');
          return;
        }
        const labelMatch = String(best.p.label).match(/^(.*?)( \([^()]*\))?$/);
        const lines = [labelMatch[1]];
        if (labelMatch[2]) lines.push(labelMatch[2].trim().slice(1, -1));
        lines.push(`${meta.xLabel}: ${best.p.x}`, `${meta.yLabel}: ${best.p.y}`);
        tooltip.textContent = lines.join('\n');
        tooltip.style.whiteSpace = 'pre';
        tooltip.classList.remove('hidden');
        // Keep the tooltip inside the plot: flip to the other side of the point near the edges
        const pointX = best.sx / scale;
        const pointY = best.sy / scale + canvas.offsetTop;
        const maxLeft = canvas.offsetLeft + rect.width - tooltip.offsetWidth - 4;
        const maxTop = canvas.offsetTop + rect.height - tooltip.offsetHeight - 4;
        let left = pointX + 12;
        if (left > maxLeft) left = pointX - tooltip.offsetWidth - 12;
        tooltip.style.left = `${Math.max(canvas.offsetLeft + 4, left)}px`;
        tooltip.style.top = `${Math.max(canvas.offsetTop + 4, Math.min(pointY + 12, maxTop))}px`;
      };
      canvas.onmouseleave = () => tooltip.classList.add('hidden');
      container.scrollIntoView({ block: 'nearest' });
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

  if (route && isRankingGender(route.gender)) {
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
  if (IS_RESULTS_SITE) {
    // The results site always shows an event; default to the most recent one.
    const latest = [...EVENT_FILES].sort((a, b) => getEventSortValue(b.name) - getEventSortValue(a.name))[0];
    view = eventParam && isKnownEvent(eventParam) ? eventParam : (latest ? latest.name : 'world');
  } else {
    view = 'world';
  }

  return {
    view,
    rider: riderParam ? riderParam.trim() : '',
    gender: isRankingGender(genderParam) ? genderParam : null,
    year: yearParam && /^\d{4}$/.test(yearParam) ? yearParam : null
  };
}

function buildRouteUrl(route) {
  const url = new URL(window.location.href);
  applyRouteQueryParams(url.searchParams, route);

  return url.toString();
}

function applyCurrentDiscipline(url) {
  if (activeDisciplineKey !== 'flatland') {
    url.searchParams.set('discipline', activeDisciplineKey);
  }
}

function buildIndexRouteUrl(route) {
  const url = new URL('index.html', window.location.href);
  applyCurrentDiscipline(url);
  applyRouteQueryParams(url.searchParams, route);
  return url.toString();
}

function buildRiderPointsUrl(rider, route) {
  const url = new URL('rider_points.html', window.location.href);
  applyCurrentDiscipline(url);
  if (rider) {
    url.searchParams.set('rider', rider);
  }

  if (route && isRankingGender(route.gender)) {
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

function buildResultsEventUrl(eventName) {
  const url = new URL('results.html', window.location.href);
  applyCurrentDiscipline(url);
  url.searchParams.set('view', 'event');
  url.searchParams.set('event', eventName);
  if (isRankingGender(currentGender)) {
    url.searchParams.set('gender', currentGender);
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
    body.innerHTML = '<tr><td colspan="11" class="status">Open a rider profile first, then click "Detailed ranking points".</td></tr>';
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
    body.innerHTML = '<tr><td colspan="12" class="status">No event history available.</td></tr>';
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
    const decayMultiplier = Math.pow(yearDecay, yearsOfDecay);
    const decayedPoints = rawPointsBeforeDecay * decayMultiplier;
    const battlePoints = Number(entry.battlePointsBeforeDecay || 0);
    return {
      ...entry,
      sourceIndex,
      points: rawPointsBeforeDecay - battlePoints,
      battlePoints,
      rawPoints: rawPointsBeforeDecay,
      decayedPoints,
      decay: decayMultiplier
    };
  });

  // Region penalty: within one region, the best event is untouched, the 2nd gets one extra decay step, the 3rd two, etc.
  const entriesByRegion = new Map();
  detailedEntries.forEach((entry) => {
    const eventFile = EVENT_FILES.find((file) => file.name === entry.event);
    const region = String(eventFile?.region || '').trim().toUpperCase();
    entry.regionPenaltyMultiplier = 1;
    if (!region) return;
    if (!entriesByRegion.has(region)) entriesByRegion.set(region, []);
    entriesByRegion.get(region).push(entry);
  });
  entriesByRegion.forEach((entries) => {
    entries
      .sort((a, b) => b.decayedPoints - a.decayedPoints)
      .forEach((entry, index) => {
        entry.regionPenaltyMultiplier = Math.pow(regionPenalty, index);
      });
  });

  detailedEntries.forEach((entry) => {
    entry.penalizedDecayedPoints = entry.decayedPoints * entry.regionPenaltyMultiplier;
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
    const battleCalculation = entry.battlePointDetails.length
      ? entry.battlePointDetails.map((detail) => {
        return `<div>${escapeXml(detail.opponent)}: ${detail.rankingPoints.toFixed(2)} pts → +${detail.points.toFixed(2)} pts</div>`;
      }).join('')
      : '—';
    row.innerHTML = `
      <td><button class="rider-link rider-points-event-link" data-event="${entry.event}">${entry.event}</button></td>
      <td>${entry.place}</td>
      <td>${entry.points.toFixed(2)}</td>
      <td>${entry.battlePoints.toFixed(2)}</td>
      <td>${battleCalculation}</td>
      <td>${entry.rawPoints.toFixed(2)}</td>
      <td>×${entry.decay.toFixed(2)}</td>
      <td>×${entry.regionPenaltyMultiplier.toFixed(2)}</td>
      <td>${entry.penalizedDecayedPoints.toFixed(2)}</td>
      <td>×${entry.bestFiveMultiplier.toFixed(2)}</td>
      <td>${entry.countedPoints.toFixed(2)}</td>
    `;
    body.appendChild(row);
  });

  summary.textContent = `${visibleHistory.length} events. Weighted total with region penalty: ${totalCounted.toFixed(2)} points (${currentGender} view, ${currentYearComparison}).`;

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
  updateViewDescription(view);

  if (view === 'world') {
    setRankingHeaders('world');
    renderWorldForYear(Number(currentYearComparison));
  } else {
    setRankingHeaders('event');
    renderEvent(view);
  }
}

function updateGenderToggleText() {
  document.querySelectorAll('.gender-switch [data-gender]').forEach((button) => {
    const active = button.dataset.gender === currentGender;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setRankingGender(gender) {
  if (!isRankingGender(gender) || gender === currentGender) return;
  currentGender = gender;
  updateGenderToggleText();
  refreshRankingView();
}

// For each open-event appearance of a female rider, the expected points are the average
// ranking points of the male riders who finished at the same place in that event.
// Ratio = the rider's female ranking points / that expected value (averaged per rider).
function computeFemaleOpenStats() {
  const femalePoints = new Map((globalRowsByGender.female || []).map((row) => [row.rider, row.points || 0]));
  const malePoints = new Map((globalRowsByGender.male || []).map((row) => [row.rider, row.points || 0]));
  const rows = [];
  EVENT_FILES.forEach((event) => {
    const entries = eventResults.get(event.name)?.male || [];
    entries.forEach((entry) => {
      if (!riderInfoMap.get(entry.rider)?.female) return;
      const peers = entries.filter((e) => e.place === entry.place && !riderInfoMap.get(e.rider)?.female);
      if (peers.length === 0) return;
      const expected = peers.reduce((a, e) => a + (malePoints.get(e.rider) || 0), 0) / peers.length;
      rows.push({ rider: entry.rider, event: event.name, place: entry.place, total: entries.length, expected });
    });
  });
  rows.sort((a, b) => a.rider.localeCompare(b.rider) || a.event.localeCompare(b.event));

  const byRider = new Map();
  rows.forEach((r) => {
    if (!byRider.has(r.rider)) byRider.set(r.rider, []);
    byRider.get(r.rider).push(r.expected);
  });
  const riderStats = [...byRider.entries()]
    .map(([rider, list]) => {
      const expected = list.reduce((a, b) => a + b, 0) / list.length;
      const points = femalePoints.get(rider) || 0;
      return { rider, points, expected, ratio: expected > 0 ? points / expected : null };
    })
    .filter((s) => s.ratio !== null && s.points > 0);
  const ratio = riderStats.length ? riderStats.reduce((a, s) => a + s.ratio, 0) / riderStats.length : null;
  return { rows, riderStats, ratio };
}

function updateFemaleOpenSummary() {
  const el = document.getElementById('female-open-summary');
  if (!el) return;
  const stats = computeFemaleOpenStats();
  if (stats.ratio === null) {
    el.textContent = 'No female results in open events to compare.';
    return;
  }
  el.textContent = `Female points / expected male points for the same open placing: ${stats.ratio.toFixed(2)} (avg of ${stats.riderStats.length} riders).`;
}

function showFemaleOpenAppearances() {
  const overlay = document.getElementById('female-open-overlay');
  const body = document.getElementById('female-open-body');
  if (!overlay || !body) return;
  const { rows, riderStats, ratio } = computeFemaleOpenStats();
  const riderTable = riderStats.length
    ? `<h3>Per rider</h3><table><thead><tr><th>Rider</th><th>Female points</th><th>Expected male points</th><th>Ratio</th></tr></thead><tbody>${riderStats
        .map((s) => `<tr><td>${escapeXml(s.rider)}</td><td>${s.points.toFixed(1)}</td><td>${s.expected.toFixed(1)}</td><td>${s.ratio.toFixed(2)}</td></tr>`)
        .join('')}</tbody></table>`
    : '';
  body.innerHTML = rows.length
    ? `<p>${rows.length} appearance(s) in ${escapeXml(activeDiscipline.label)}${ratio !== null ? `, average ratio ${ratio.toFixed(2)}` : ''}.</p>${riderTable}<h3>Appearances</h3><table><thead><tr><th>Rider</th><th>Event</th><th>Place</th><th>Expected male points</th></tr></thead><tbody>${rows
        .map((r) => `<tr><td>${escapeXml(r.rider)}</td><td>${escapeXml(r.event)}</td><td>${r.place} / ${r.total}</td><td>${r.expected.toFixed(1)}</td></tr>`)
        .join('')}</tbody></table>`
    : `<p>No female riders competed in the open category in ${escapeXml(activeDiscipline.label)}.</p>`;
  overlay.classList.remove('hidden');
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
        <th>Place</th>
        <th>Rider</th>
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

function getEventScoreLabels(entries) {
  const scoreCount = Math.max(0, ...entries.map((entry) => entry.scores?.length || 0));
  if (scoreCount === 0) return [];
  const fileNames = entries.find((entry) => entry.scoreNames?.length)?.scoreNames;
  if (fileNames) {
    return Array.from({ length: Math.max(scoreCount, fileNames.length) }, (_, index) => fileNames[index] || `Score ${index + 1}`);
  }
  if (activeDisciplineKey !== 'flatland') return ['Scores'];

  const labels = scoreCount >= 5
    ? ['Total', ...FLATLAND_RESULT_SCORE_CATEGORIES]
    : FLATLAND_RESULT_SCORE_CATEGORIES;
  return Array.from({ length: scoreCount }, (_, index) => labels[index] || `Score ${index + 1}`);
}

function formatBattleScores(scores) {
  return scores.map((score, index) => {
    const label = activeDisciplineKey === 'flatland'
      ? (FLATLAND_BATTLE_SCORE_CATEGORIES[index] || `Score ${index + 1}`)
      : `Score ${index + 1}`;
    return `${label}: ${score}`;
  }).join(' · ');
}

function renderEvent(eventName) {
  const body = document.getElementById('ranking-body');
  const prelimWrapper = document.getElementById('event-prelim-wrapper');
  const prelimBody = document.getElementById('event-prelim-body');
  const battleWrapper = document.getElementById('event-battle-wrapper');
  const battleBody = document.getElementById('event-battle-body');
  if (!body || !battleWrapper || !battleBody) return;

  const eventSection = currentGender === 'combined' ? 'male' : currentGender; // combined shows the raw open results
  const eventEntries = eventResults.get(eventName)?.[eventSection] || [];
  const visibleEntries = currentSearch
    ? eventEntries.filter((entry) => entry.rider.toLowerCase().includes(currentSearch))
    : eventEntries;

  body.innerHTML = '';

  if (visibleEntries.length === 0) {
    body.innerHTML = '<tr><td colspan="2" class="status">No riders match your search.</td></tr>';
  } else {
    // Split into side-by-side Place/Rider blocks to use the horizontal space.
    const hasRoundSeparators = visibleEntries.some((entry) => entry.startsNewRound);
    const scoreLabels = getEventScoreLabels(visibleEntries);
    const colCount = IS_RESULTS_SITE && !hasRoundSeparators && scoreLabels.length <= 1
      ? (visibleEntries.length >= 30 ? 3 : visibleEntries.length >= 12 ? 2 : 1)
      : 1;
    const thead = document.getElementById('ranking-thead');
    if (thead) {
      const scoreHeaders = scoreLabels.map((label) => `<th>${label}</th>`).join('');
      const pointsHeader = settings.showPoints ? '<th>Points</th>' : '';
      thead.innerHTML = `<tr>${Array.from({ length: colCount }, (_, i) => `<th class="${i > 0 ? 'col-sep' : ''}">Place</th><th>Rider</th>${pointsHeader}${scoreHeaders}`).join('')}</tr>`;
    }
    const rowsPerCol = Math.ceil(visibleEntries.length / colCount);
    for (let r = 0; r < rowsPerCol; r++) {
      const row = document.createElement('tr');
      for (let c = 0; c < colCount; c++) {
        const entry = visibleEntries[c * rowsPerCol + r];
        if (!entry) {
          const pointsCell = settings.showPoints ? '<td></td>' : '';
          row.innerHTML += `<td class="${c > 0 ? 'col-sep' : ''}"></td><td></td>${pointsCell}${scoreLabels.map(() => '<td></td>').join('')}`;
          continue;
        }
        const placeClass = entry.place === 1
          ? 'podium-gold'
          : entry.place === 2
            ? 'podium-silver'
            : entry.place === 3
              ? 'podium-bronze'
              : '';
        const roundSeparatorClass = entry.startsNewRound ? 'round-separator' : '';
        const scoreCells = scoreLabels.length === 1 && scoreLabels[0] === 'Scores'
          ? `<td class="${roundSeparatorClass}">${entry.scores?.join(' · ') || ''}</td>`
          : scoreLabels.map((_, index) => {
            const score = entry.scores?.[index];
            return `<td class="${roundSeparatorClass}">${score === '/' ? '—' : (score || '')}</td>`;
          }).join('');
        const pointsCell = settings.showPoints
          ? `<td class="${roundSeparatorClass}">${Number(entry.rawPointsBeforeDecay || 0).toFixed(2)}</td>`
          : '';
        row.innerHTML += `
          <td class="rank ${placeClass} ${roundSeparatorClass} ${c > 0 ? 'col-sep' : ''}">${entry.place}</td>
          <td class="${roundSeparatorClass}"><button class="rider-link" data-rider="${entry.rider}">${entry.rider}</button></td>
          ${pointsCell}
          ${scoreCells}
        `;
      }
      body.appendChild(row);
    }
  }

  const battles = eventBattles.get(eventName)?.[eventSection] || [];

  if (prelimWrapper && prelimBody) {
    const prelimEntries = [...(eventPrelimResults.get(eventName)?.[eventSection] || [])];
    const prelimHeadRow = document.getElementById('event-prelim-head-row');
    // Not every event's preliminary results include a per-category score breakdown
    // (e.g. Difficulty/Variety/Fullness/Style); only add those columns when present.
    const categoryLabels = prelimEntries.find((entry) => entry.categoryScores?.length)?.categoryScores.map((c) => c.label) || [];
    const hasPrelimTotal = prelimEntries.some((entry) => Number.isFinite(entry.score));
    const hasPrelimVideos = prelimEntries.some((entry) => entry.videoUrl);

    const sortKey = prelimSort.key;
    const sortValue = (entry) => {
      if (sortKey === 'place') return entry.place;
      if (sortKey === 'score') return Number.isFinite(entry.score) ? entry.score : null;
      const v = entry.categoryScores?.[Number(sortKey.slice(4))]?.value;
      return Number.isFinite(v) ? v : null;
    };
    prelimEntries.sort((a, b) => {
      const va = sortValue(a);
      const vb = sortValue(b);
      if (va == null && vb == null) return a.place - b.place;
      if (va == null) return 1;
      if (vb == null) return -1;
      const diff = prelimSort.direction === 'asc' ? va - vb : vb - va;
      return diff !== 0 ? diff : a.place - b.place;
    });

    if (prelimHeadRow) {
      const sortHeader = (key, label) => {
        const arrow = prelimSort.key === key ? (prelimSort.direction === 'asc' ? ' ▲' : ' ▼') : '';
        return `<th><button class="sort-button prelim-sort-button" data-key="${key}">${label}${arrow}</button></th>`;
      };
      const categoryHeaders = categoryLabels.map((label, i) => sortHeader(`cat-${i}`, label)).join('');
      prelimHeadRow.innerHTML = `${sortHeader('place', 'Place')}<th>Rider</th>${hasPrelimTotal ? sortHeader('score', 'Score') : ''}${categoryHeaders}${hasPrelimVideos ? '<th>Video</th>' : ''}`;
      if (!prelimHeadRow.dataset.sortBound) {
        prelimHeadRow.dataset.sortBound = 'true';
        prelimHeadRow.addEventListener('click', (e) => {
          const button = e.target.closest('.prelim-sort-button');
          if (!button) return;
          const key = button.getAttribute('data-key');
          if (prelimSort.key === key) {
            prelimSort.direction = prelimSort.direction === 'desc' ? 'asc' : 'desc';
          } else {
            prelimSort.key = key;
            prelimSort.direction = key === 'place' ? 'asc' : 'desc';
          }
          renderEvent(getCurrentViewSelection());
        });
      }
    }
    if (prelimEntries.length > 0) {
      prelimBody.innerHTML = '';
      prelimEntries.forEach((entry) => {
        const row = document.createElement('tr');
        const categoryCells = categoryLabels
          .map((_, i) => `<td>${entry.categoryScores?.[i]?.display ?? '—'}</td>`)
          .join('');
        row.innerHTML = `
          <td class="rank">${entry.place}</td>
          <td><button class="rider-link" data-rider="${entry.rider}">${entry.rider}</button></td>
          ${hasPrelimTotal ? `<td>${Number.isFinite(entry.score) ? entry.score.toFixed(1) : '—'}</td>` : ''}
          ${categoryCells}
          ${hasPrelimVideos ? `<td>${entry.videoUrl ? `<a class="battle-video-link" href="${escapeXml(entry.videoUrl)}" target="_blank" rel="noopener noreferrer" title="Watch run video">🎥</a>` : ''}</td>` : ''}
        `;
        prelimBody.appendChild(row);
      });
      prelimWrapper.classList.remove('hidden');
    } else {
      prelimBody.innerHTML = `<tr><td colspan="${2 + (hasPrelimTotal ? 1 : 0) + categoryLabels.length + (hasPrelimVideos ? 1 : 0)}" class="status">No preliminary results available.</td></tr>`;
      prelimWrapper.classList.add('hidden');
    }
  }

  if (battles.length > 0) {
    battleBody.innerHTML = '';
    battles.forEach((battle, index) => {
      const row = document.createElement('tr');
      const detailButtonHtml = battle.detail
        ? `<button type="button" class="battle-detail-button" data-battle-index="${index}">View</button>`
        : '<span class="status">—</span>';
      const videoUrl = battle.videoUrl || battle.detail?.videoUrl;
      const videoLinkHtml = videoUrl
        ? `<a class="battle-video-link" href="${escapeXml(videoUrl)}" target="_blank" rel="noopener noreferrer" title="Watch battle video">🎥</a>`
        : '';
      row.innerHTML = `
        <td>${battle.round}</td>
        <td><button class="rider-link" data-rider="${battle.winner}">${battle.winner}</button></td>
        <td>${formatBattleScores(battle.winnerScores || [])}</td>
        <td><button class="rider-link" data-rider="${battle.loser}">${battle.loser}</button></td>
        <td>${formatBattleScores(battle.loserScores || [])}</td>
        <td>${detailButtonHtml}${videoLinkHtml}</td>
      `;
      battleBody.appendChild(row);
    });
    battleWrapper.classList.remove('hidden');
    attachBattleDetailButtons(battles);
  } else {
    battleBody.innerHTML = `<tr><td colspan="6" class="status">No battle details available.</td></tr>`;
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

function attachBattleDetailButtons(battles) {
  document.querySelectorAll('.battle-detail-button').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.getAttribute('data-battle-index'));
      const battle = battles[index];
      if (battle && battle.detail) {
        openBattleDetailModal(battle);
      }
    });
  });
}

function renderBattleDetailScoreRows(winnerScores, loserScores) {
  return winnerScores.map((winnerCell, i) => {
    const loserCell = loserScores[i] || {};
    const label = winnerCell.label;
    const cellClass = /^votes?$/i.test(label) ? ' class="battle-detail-votes"' : '';
    return `
      <tr>
        <td${cellClass}>${label}</td>
        <td>${winnerCell.display ?? '—'}</td>
        <td>${loserCell.display ?? '—'}</td>
      </tr>
    `;
  }).join('');
}

function openBattleDetailModal(battle) {
  const overlay = document.getElementById('battle-detail-overlay');
  const subtitle = document.getElementById('battle-detail-subtitle');
  const winnerHeader = document.getElementById('battle-detail-winner-header');
  const loserHeader = document.getElementById('battle-detail-loser-header');
  const detailBody = document.getElementById('battle-detail-body');
  if (!overlay || !detailBody) return;

  const detail = battle.detail;
  if (subtitle) {
    subtitle.textContent = `${battle.round} — ${battle.winner} def. ${battle.loser}`;
  }
  if (winnerHeader) winnerHeader.textContent = battle.winner;
  if (loserHeader) loserHeader.textContent = battle.loser;

  detailBody.innerHTML = renderBattleDetailScoreRows(detail.winnerScores, detail.loserScores);

  overlay.classList.remove('hidden');
}

function closeBattleDetailModal() {
  const overlay = document.getElementById('battle-detail-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function attachBattleDetailModalEvents() {
  const overlay = document.getElementById('battle-detail-overlay');
  const closeButton = document.getElementById('battle-detail-close');

  if (closeButton) {
    closeButton.addEventListener('click', closeBattleDetailModal);
  }

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeBattleDetailModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBattleDetailModal();
  });
}

// ---- Data overview (settings tab): which data exists for every event of every discipline ----
const DATA_OVERVIEW_COLUMNS = [
  { key: 'female', label: 'Has Female Results' },
  { key: 'battles', label: 'Has Battling Results' },
  { key: 'scores', label: 'Has Scores' },
  { key: 'prelim', label: 'Has Prelim Results' },
  { key: 'videos', label: 'Has Videos' }
];
// Battling results count as available once more than this many battles are recorded for male/open.
const DATA_OVERVIEW_MIN_BATTLES = 2;
let dataOverviewRows = null;
let dataOverviewLoading = false;

// Reads a raw results file the same way loadRanking() does, only checking what data it contains.
function analyzeEventData(text, discipline) {
  const info = { female: false, battles: false, scores: false, prelim: false, videos: false };
  info.videos = /#[^\r\n]*https?:\/\//i.test(text);

  const hasGenderSplit = text.includes('|');
  const blocks = hasGenderSplit
    ? text.split('|').map((part) => part.trim()).filter(Boolean)
    : [text.trim()];
  const splitsSections = hasGenderSplit || !discipline.usesSimpleResults;

  blocks.slice(0, GENDERS.length).forEach((block, index) => {
    const sectionDelimiter = splitsSections ? block.indexOf(';') : -1;
    const resultsText = sectionDelimiter === -1 ? block : block.slice(0, sectionDelimiter);
    const extraText = sectionDelimiter === -1 ? '' : block.slice(sectionDelimiter + 1);

    const resultLines = resultsText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && line !== '-' && !parseScoreNamesLine(line));
    if (index === 1 && resultLines.length > 0) info.female = true;
    if (resultLines.some((line) => {
      const placeMatch = line.match(/^\s*(\d+)[\.)]?\s*(.+)$/);
      const riderAndScores = placeMatch ? removePlacementRiderId(placeMatch[2].trim()) : line;
      return splitRiderAndScores(riderAndScores).scores.length > 0;
    })) {
      info.scores = true;
    }

    let prelimNames = null;
    let battleCount = 0;
    extraText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
      const prelimHeader = line.match(/^@prelim\s+(.*)$/i);
      if (prelimHeader) {
        prelimNames = prelimHeader[1].split(',').map((name) => name.trim()).filter(Boolean);
      } else if (/^@battle\s/i.test(line)) {
        // Only names the battle score columns.
      } else if (isPrelimLine(line)) {
        const entry = parsePrelimLine(line, prelimNames);
        if (!entry) return;
        info.prelim = true;
        if (Number.isFinite(entry.score) || entry.categoryScores.length > 0) info.scores = true;
      } else if (discipline.supportsBattles) {
        const hashIndex = line.indexOf('#');
        const dataLine = hashIndex === -1 ? line : line.slice(0, hashIndex);
        const parts = dataLine.split(/[,;]+/).map((part) => part.trim()).filter(Boolean);
        if (parts.length === 0) return;
        if (index === 0) battleCount++;
        if (parts.length > 2) info.scores = true;
      }
    });
    if (index === 0 && battleCount > DATA_OVERVIEW_MIN_BATTLES) info.battles = true;
  });
  return info;
}

async function loadDataOverviewRows() {
  const discipline = activeDiscipline;
  const jobs = discipline.eventFiles.map(async (event) => {
    const type = event.name.replace(/\d+$/, '');
    const year = Number(event.name.slice(type.length)) || 0;
    const row = { event: event.name, type, year, error: false };
    try {
      const path = `${discipline.resultsDirectory}/${event.file}`;
      let text = eventTextCache.get(path);
      if (text === undefined) {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Unable to load ${path}`);
        text = await response.text();
        eventTextCache.set(path, text);
      }
      Object.assign(row, analyzeEventData(text, discipline));

      // Optional "detailed event PDF/<Event>_D.txt" adds prelim results and battle scores.
      const detailText = discipline.supportsBattles ? await getCachedEventDetailText(event.name) : null;
      if (detailText) {
        const detail = parseEventDetailText(detailText);
        GENDERS.forEach((gender) => {
          if (detail[gender].prelim.length) {
            row.prelim = true;
            if (detail[gender].prelim.some((entry) => Number.isFinite(entry.score) || entry.categoryScores.length)) row.scores = true;
          }
          if (detail[gender].battles.size) row.scores = true;
        });
      }
    } catch (error) {
      console.warn(`Data overview: ${event.name} (${discipline.label})`, error);
      row.error = true;
    }
    return row;
  });
  const rows = await Promise.all(jobs);
  rows.sort((a, b) => a.type.localeCompare(b.type, undefined, { sensitivity: 'base' }) || a.year - b.year);
  return rows;
}

function renderDataOverviewTable(container, rows) {
  const counts = DATA_OVERVIEW_COLUMNS.map((column) => rows.filter((row) => row[column.key]).length);
  const headCells = DATA_OVERVIEW_COLUMNS.map((column, i) =>
    `<th><span class="data-overview-count">${counts[i]} <span>/ ${rows.length}</span></span>${escapeXml(column.label)}</th>`).join('');
  const bodyRows = rows.map((row) => {
    const label = row.year ? `${row.type} ${String(row.year).padStart(2, '0')}` : row.event;
    const cells = row.error
      ? `<td class="data-no" colspan="${DATA_OVERVIEW_COLUMNS.length}">Unable to load results file</td>`
      : DATA_OVERVIEW_COLUMNS.map((column) => row[column.key]
        ? '<td class="data-yes" title="Available" aria-label="Available">✔</td>'
        : '<td class="data-no" title="Not available" aria-label="Not available">✘</td>').join('');
    return `<tr><th scope="row">${escapeXml(label)}</th>${cells}</tr>`;
  }).join('');
  container.innerHTML = `
    <table class="data-overview-table">
      <thead>
        <tr><th>Event</th>${headCells}</tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>`;
}

async function renderDataOverview() {
  const container = document.getElementById('data-overview');
  if (!container || dataOverviewLoading) return;
  if (dataOverviewRows) return;
  dataOverviewLoading = true;
  try {
    dataOverviewRows = await loadDataOverviewRows();
    renderDataOverviewTable(container, dataOverviewRows);
  } catch (error) {
    container.innerHTML = `<p class="settings-card-hint">Unable to load the data overview: ${escapeXml(error.message || error)}</p>`;
  } finally {
    dataOverviewLoading = false;
  }
}

// Pulls an absolute http(s) URL out of the text after a '#', tolerating stray '#' or spaces
// (e.g. "# #https://..."); a non-absolute value would otherwise resolve to this site.
function extractVideoUrl(text) {
  const match = String(text || '').match(/https?:\/\/[^\s;]+/i);
  return match ? match[0] : null;
}

function getBattleRound(eventName, index) {
  if (index === 0) return 'Final';
  if (index === 1) return 'Third place';
  if (index <= 3) return 'Semi-final';
  if (index <= 7) return 'Quarter-final';
  return 'Lower-Rounds';
}

function addRiderBattle(rider, eventName, round, opponent, result, gender = 'male', battle = null) {
  const history = riderBattlesByGender[gender].get(rider) || [];
  history.push({ event: eventName, round, opponent, result, battle });
  riderBattlesByGender[gender].set(rider, history);
}

// Categories expected (in file order) for each side of a detailed battle line.
const BATTLE_DETAIL_CATEGORIES = ['Difficulty', 'Variety', 'Fullness', 'Style', 'Battling', 'Last trick'];
// Default score names offered by the results builder for battles.
const BATTLE_DEFAULT_SCORE_NAMES = ['Votes', 'Difficulty', 'Variety', 'Fullness', 'Style', 'Battling', 'Final Trick'];

// Splits the fields after "winner, loser" of a detailed battle line into per-side scores.
// Current layout: the winner's scores (one per name), then the loser's scores. Older files
// listed the two vote counts first and had no "Votes" name; those are converted to the
// current layout with a leading "Votes" score. Returns null if the field count fits neither.
function parseDetailedBattleFields(fields, names) {
  const count = names.length;
  let labels = names;
  let winnerRaw;
  let loserRaw;
  if (count && fields.length === count * 2) {
    winnerRaw = fields.slice(0, count);
    loserRaw = fields.slice(count);
  } else if (count && fields.length === count * 2 + 2) {
    labels = ['Votes', ...names];
    winnerRaw = [fields[0], ...fields.slice(2, 2 + count)];
    loserRaw = [fields[1], ...fields.slice(2 + count)];
  } else {
    return null;
  }
  return {
    winnerScores: labels.map((label, i) => ({ label, ...parseBattleScoreField(winnerRaw[i]) })),
    loserScores: labels.map((label, i) => ({ label, ...parseBattleScoreField(loserRaw[i]) }))
  };
}

// Attempts to fetch a detailed-results file for an event (e.g. "detailed event PDF/GUC26_D.txt").
// Returns the raw text, or null if no such file exists / it couldn't be loaded.
async function loadEventDetailText(eventName) {
  const path = `detailed event PDF/${eventName}_D.txt`;
  try {
    const response = await fetch(encodeURI(path));
    if (!response.ok) return null;
    return await response.text();
  } catch (e) {
    return null;
  }
}

// Parses one score cell such as "16.8/21" or "no score" into a display string plus numeric value/max.
function parseBattleScoreField(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed || trimmed === '/' || /no\s*score/i.test(trimmed)) {
    return { display: trimmed || '—', value: null, max: null };
  }
  const m = trimmed.match(/^([\d.]+)\s*\/\s*([\d.]+)$/);
  if (!m) {
    return { display: trimmed, value: null, max: null };
  }
  return { display: trimmed, value: Number(m[1]), max: Number(m[2]) };
}

// Categories for the optional per-category breakdown in preliminary results
// (no Battling/Last trick, since those only apply to head-to-head battles).
const PRELIM_SCORE_CATEGORIES = ['Difficulty', 'Variety', 'Fullness', 'Style'];

// A preliminary-ranking line always starts with "<place>" optionally followed by a
// period, e.g. "1 Ben Niediek 84.7" or "1. August Agerskov, 83.83, 24.5/30, ...".
// Battle-detail lines always start with a rider's name instead.
function isPrelimLine(line) {
  return /^\d+\.?\s/.test(line.trim());
}

// Parses one preliminary-ranking line. Supports two formats:
// - Simple: "<place> <name> <score>" (space-separated, no per-category breakdown).
// - Detailed: "<place>. <name>, <score>, <category1>, <category2>, ..." (comma-separated,
//   with a per-category score breakdown using PRELIM_SCORE_CATEGORIES order).
// `names` is the "@prelim" header: if its first name starts with "Total" the first value is the
// total score; otherwise every value is a plain named score and the line has no total.
function parsePrelimLine(rawLine, names = null) {
  const hasTotal = !names || !names.length || /^total/i.test(names[0]);
  const categoryNames = names && names.length ? (hasTotal ? names.slice(1) : names) : PRELIM_SCORE_CATEGORIES;
  // Optional video link after '#', e.g. "1 Name 84.7#https://youtu.be/..."
  const hashIndex = rawLine.indexOf('#');
  const videoUrl = hashIndex === -1 ? null : extractVideoUrl(rawLine.slice(hashIndex + 1));
  const line = (hashIndex === -1 ? rawLine : rawLine.slice(0, hashIndex)).replace(/;\s*$/, '').trim();
  if (!line) return null;

  if (line.includes(',')) {
    const parts = line.split(',').map((part) => part.trim());
    const firstPartMatch = parts[0].match(/^(\d+)\.?\s*(.+)$/);
    if (!firstPartMatch || parts.length < 2) return null;
    const canonical = aliasMap.get(normalizeName(firstPartMatch[2])) || firstPartMatch[2];
    const categoryScores = parts.slice(hasTotal ? 2 : 1).map((raw, i) => ({
      label: categoryNames[i] || `Score ${i + 1}`,
      ...parseBattleScoreField(raw)
    }));
    return {
      place: Number(firstPartMatch[1]),
      rider: canonical,
      score: hasTotal ? Number(parts[1]) : null,
      categoryScores,
      videoUrl
    };
  }

  const m = line.match(/^(\d+)\s+(.+?)\s+([\d.]+)$/);
  if (!m) return null;
  const canonical = aliasMap.get(normalizeName(m[2])) || m[2];
  return { place: Number(m[1]), rider: canonical, score: Number(m[3]), categoryScores: [], videoUrl };
}

// Parses the full contents of a "<Event>_D.txt" detailed-results file.
// Format mirrors the main event results file: gender sections separated by '|',
// each with a preliminary ranking (place, name, score, optional per-category breakdown)
// followed by one battle-detail line per battle (winner, loser, votesWinner, votesLoser,
// then 6 score categories for the winner and 6 for the loser). A ';' delimiter between
// the two sections is supported but not required; lines are otherwise told apart because
// preliminary lines always start with a place number (see isPrelimLine).
function parseEventDetailText(text) {
  const genderBlocks = String(text || '').split('|').map((part) => part.trim()).filter(Boolean);
  const result = {
    male: { prelim: [], battles: new Map() },
    female: { prelim: [], battles: new Map() }
  };

  genderBlocks.forEach((block, index) => {
    const gender = GENDERS[index];
    if (!gender) return;

    // Preliminary ranking lines always precede battle-detail lines and always start with
    // a place number (optionally followed by a ';' delimiter on the last one), while battle
    // lines always start with a rider's name — so split on the first line that isn't a
    // preliminary-ranking line rather than relying on a specific delimiter being present.
    const allLines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    // An optional "@scores Total, A, B" line names the prelim score columns (first is the total).
    const prelimNames = allLines.length ? parseScoreNamesLine(allLines[0]) : null;
    const lines = prelimNames ? allLines.slice(1) : allLines;
    const firstBattleIndex = lines.findIndex((line) => !isPrelimLine(line));
    const prelimLines = firstBattleIndex === -1 ? lines : lines.slice(0, firstBattleIndex);
    let detailBattleNames = BATTLE_DETAIL_CATEGORIES;
    const battleLines = (firstBattleIndex === -1 ? [] : lines.slice(firstBattleIndex)).filter((line) => {
      const header = line.match(/^@battle\s+(.*)$/i);
      if (header) detailBattleNames = header[1].split(',').map((name) => name.trim()).filter(Boolean);
      return !header;
    });

    const prelim = prelimLines
      .map((line) => parsePrelimLine(line, prelimNames))
      .filter(Boolean);

    const battleMap = new Map();
    battleLines
      .forEach((line) => {
        // An optional video link may be appended to the end of the line, separated by '#'
        // (e.g. "...0/14#https://www.youtube.com/watch?v=...").
        const hashIndex = line.indexOf('#');
        const videoUrl = hashIndex === -1 ? null : extractVideoUrl(line.slice(hashIndex + 1));
        const dataLine = hashIndex === -1 ? line : line.slice(0, hashIndex);

        const parts = dataLine.split(',').map((part) => part.trim());
        const fields = parseDetailedBattleFields(parts.slice(2), detailBattleNames);
        if (!fields) return;

        const winner = aliasMap.get(normalizeName(parts[0])) || parts[0];
        const loser = aliasMap.get(normalizeName(parts[1])) || parts[1];

        battleMap.set(`${winner}|||${loser}`, {
          winner,
          loser,
          winnerScores: fields.winnerScores,
          loserScores: fields.loserScores,
          videoUrl
        });
      });

    result[gender] = { prelim, battles: battleMap };
  });

  return result;
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

// ---- Rider strength: 1-5 star ratings per score category, built from the per-event scores ----
const STRENGTH_CATEGORIES = [
  { key: 'difficulty', label: 'Difficulty', pattern: /difficult/i },
  { key: 'variety', label: 'Variety', pattern: /variet/i },
  { key: 'fullness', label: 'Fullness / Consistency', pattern: /fullness|consisten/i },
  { key: 'style', label: 'Style / Flow', pattern: /style|flow/i },
  { key: 'lastTrick', label: 'Last Trick', pattern: /(last|final)\s*trick/i },
  { key: 'battling', label: 'Battling', pattern: /battling/i }
];

function getStrengthCategoryKey(label) {
  return STRENGTH_CATEGORIES.find((category) => category.pattern.test(String(label || '')))?.key || null;
}

// A score as a 0-1 share of its maximum, so "15/20" and "15/16" are comparable; null if unusable.
function getScoreRatio(score) {
  const value = Number(score?.value);
  const max = Number(score?.max);
  return score && score.value != null && Number.isFinite(value) && Number.isFinite(max) && max > 0 ? value / max : null;
}

// Per event and category: each rider's best ratio is ranked (best = 5 stars, worst = 1 star, ties share
// the average position, in-between ranks scale linearly), then ratings are averaged over events weighted by event weight.
function computeRiderStrength(gender) {
  const totals = new Map(); // rider -> categoryKey -> { weighted, weight, events }

  EVENT_FILES.forEach((event) => {
    const weight = Number(event.weight);
    if (!(weight > 0)) return;

    const best = new Map(); // categoryKey -> rider -> best ratio
    const record = (rider, label, score) => {
      const key = getStrengthCategoryKey(label);
      const ratio = getScoreRatio(score);
      if (!rider || !key || ratio === null) return;
      if (!best.has(key)) best.set(key, new Map());
      const riders = best.get(key);
      if (!riders.has(rider) || ratio > riders.get(rider)) riders.set(rider, ratio);
    };

    (eventPrelimResults.get(event.name)?.[gender] || []).forEach((entry) => {
      (entry.categoryScores || []).forEach((score) => record(entry.rider, score.label, score));
    });
    (eventBattles.get(event.name)?.[gender] || []).forEach((battle) => {
      (battle.detail?.winnerScores || []).forEach((score) => record(battle.winner, score.label, score));
      (battle.detail?.loserScores || []).forEach((score) => record(battle.loser, score.label, score));
    });
    (eventResults.get(event.name)?.[gender] || []).forEach((entry) => {
      (entry.scoreNames || []).forEach((name, index) => {
        if (entry.scores?.[index] !== undefined) record(entry.rider, name, parseBattleScoreField(entry.scores[index]));
      });
    });

    best.forEach((riders, key) => {
      if (riders.size < 2) return;
      const sorted = [...riders.entries()].sort((a, b) => b[1] - a[1]);
      let start = 0;
      while (start < sorted.length) {
        let end = start;
        while (end + 1 < sorted.length && Math.abs(sorted[end + 1][1] - sorted[start][1]) < 1e-9) end++;
        const averagePosition = (start + end) / 2; // 0 = best
        const stars = 5 - 4 * (averagePosition / (sorted.length - 1));
        for (let i = start; i <= end; i++) {
          const rider = sorted[i][0];
          if (!totals.has(rider)) totals.set(rider, new Map());
          const categoryTotals = totals.get(rider);
          const current = categoryTotals.get(key) || { weighted: 0, weight: 0, events: 0 };
          current.weighted += stars * weight;
          current.weight += weight;
          current.events += 1;
          categoryTotals.set(key, current);
        }
        start = end + 1;
      }
    });
  });

  const ratings = new Map();
  totals.forEach((categoryTotals, rider) => {
    const byCategory = new Map();
    categoryTotals.forEach((total, key) => byCategory.set(key, { stars: total.weighted / total.weight, events: total.events }));
    ratings.set(rider, byCategory);
  });
  return ratings;
}

function getRiderStrength(gender) {
  if (!riderStrengthCache[gender]) riderStrengthCache[gender] = computeRiderStrength(gender);
  return riderStrengthCache[gender];
}

// Stars partly filled in proportion to the rating (e.g. 3.5 fills three and a half stars).
function buildStarsHtml(stars) {
  const percent = Math.max(0, Math.min(5, stars)) / 5 * 100;
  const text = `${stars.toFixed(1)} out of 5`;
  return `<span class="stars" role="img" aria-label="${text}" title="${text}"><span class="stars-empty" aria-hidden="true">★★★★★</span><span class="stars-fill" aria-hidden="true" style="width:${percent.toFixed(1)}%">★★★★★</span></span>`;
}

function renderRiderStrength(rider) {
  const container = document.getElementById('profile-strength');
  if (!container) return;
  container.classList.toggle('hidden', !settings.showRiderStrength);
  if (!settings.showRiderStrength) {
    container.innerHTML = '';
    return;
  }

  const ratings = getRiderStrength(currentGender).get(rider);
  if (!ratings || ratings.size === 0) {
    container.innerHTML = '<h3>Rider strength</h3><p class="settings-card-hint">No score data available for this rider.</p>';
    return;
  }

  const rows = STRENGTH_CATEGORIES.map((category) => {
    const rating = ratings.get(category.key);
    const ratingHtml = rating
      ? `${buildStarsHtml(rating.stars)}<span class="strength-value">${rating.stars.toFixed(1)}</span><span class="strength-events">${rating.events} event${rating.events === 1 ? '' : 's'}</span>`
      : '<span class="strength-events">No data</span>';
    return `<div class="strength-row"><span class="strength-label">${category.label}</span>${ratingHtml}</div>`;
  }).join('');
  container.innerHTML = `<h3>Rider strength</h3>${rows}`;
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

  sortedBattles.forEach((entry) => {
    const row = document.createElement('tr');
    const resultClass = entry.result === 'Won'
      ? 'battle-result-won'
      : entry.result === 'Lost'
        ? 'battle-result-lost'
        : '';
    const videoUrl = entry.battle?.videoUrl || entry.battle?.detail?.videoUrl;
    const videoHtml = videoUrl
      ? `<a class="battle-video-link" href="${escapeXml(videoUrl)}" target="_blank" rel="noopener noreferrer" title="Watch battle video">🎥</a>`
      : '';

    row.innerHTML = `
      <td>${entry.event}</td>
      <td>${entry.round}</td>
      <td>${entry.opponent}</td>
      <td class="${resultClass}">${entry.result}</td>
      <td>${videoHtml}</td>
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
    detailedPointsLink.classList.toggle('hidden', !settings.showPoints);
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
        if (!IS_RESULTS_SITE) {
          window.location.href = buildResultsEventUrl(eventName);
          return;
        }
        navigateToRoute({
          view: eventName,
          gender: currentGender,
          year: currentYearComparison
        });
      });
    });
  }

  currentProfileRider = resolvedRider;
  renderRiderStrength(resolvedRider);
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
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(30,41,59,0.12)" stroke-width="1"/>`;
      svg += `<text x="8" y="${y + 4}" fill="#1e293b" font-size="11">${lbl}</text>`;
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
      svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#046bd2" stroke-width="2" stroke-linecap="round"/>`;
    }
  }

  // Draw markers and labels
  pts.forEach((pt) => {
    const { x, y, p } = pt;
    if (y != null) {
      // include a <title> inside the circle for native SVG hover tooltip showing the event
      // add data-event and classes so we can style and attach click handlers after insertion
      svg += `<circle class="chart-point present" data-event="${escapeXml(p.event || '')}" data-rank="${p.rank ?? ''}" cx="${x}" cy="${y}" r="4" fill="#fff" stroke="#045cb4" stroke-width="2"><title>${escapeXml(p.event || '')}</title></circle>`;
      svg += `<text x="${x}" y="${y - 8}" fill="#1e293b" font-size="10" text-anchor="middle">${p.rank}</text>`;
    } else {
      // show a distinct, small hollow circle for missing rank (did not compete)
      const gy = padding.top + innerH / 2;
      const titleText = `Did not compete — ${escapeXml(p.event || '')}`;
      svg += `<g class="chart-point missing" data-event="${escapeXml(p.event || '')}" transform="translate(${x},${gy})">`;
      svg += `<title>${titleText}</title>`;
      svg += `<circle cx="0" cy="0" r="3" fill="none" stroke="#64748b" stroke-width="1.25"/>`;
      svg += `</g>`;
    }
  });

  // x-axis month labels (one per snapshot)
  points.forEach((pt, i) => {
    const x = padding.left + i * xStep;
    const label = pt.monthInt ? monthNames[pt.monthInt - 1] : '';
    svg += `<text x="${x}" y="${height - 8}" fill="#475569" font-size="11" text-anchor="middle">${label}</text>`;
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
    svg += `<line x1="${marker.x}" y1="${padding.top}" x2="${marker.x}" y2="${height - padding.bottom}" stroke="rgba(30,41,59,0.15)" stroke-width="1"/>`;
    const shortYear = String(marker.year).slice(-2);
    svg += `<text x="${marker.x}" y="14" fill="#1e293b" font-size="${computedYearFontSize.toFixed(1)}" font-weight="600" text-anchor="middle">${shortYear}</text>`;
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
// ranking points held by each competing rider immediately BEFORE that event, plus the
// equivalent sum for the three strongest competitors. Points are decayed relative to the
// event's own year using only strictly earlier contributions (see
// preEventPointsByGender in computeRankingSnapshots), not the live/current-year totals.
function computeEventStrengthSeries(gender) {
  const snaps = rankingSnapshots.slice().sort((a, b) => a.dateValue - b.dateValue);
  return snaps.map((snap) => {
    const priorPointsByRider = snap.preEventPointsByGender ? snap.preEventPointsByGender[gender] : new Map();

    const entriesByGender = eventResults.get(snap.event) || { male: [], female: [] };
    const entries = entriesByGender[gender] || [];
    const competitorStrengths = entries.map((entry) => priorPointsByRider.get(entry.rider) || 0);
    const strength = competitorStrengths.reduce((total, points) => total + points, 0);
    const topThreeStrength = competitorStrengths
      .sort((a, b) => b - a)
      .slice(0, 3)
      .reduce((total, points) => total + points, 0);

    const parsed = parseEventNameYearPrefix(snap.event);
    const prefix = parsed.prefix || '';
    const year = parsed.year || snap.snapshotYear || null;
    const monthVal = (EVENT_MONTHS && EVENT_MONTHS[prefix]) ? Number(EVENT_MONTHS[prefix]) : 0;
    const monthInt = monthVal ? Math.max(1, Math.min(12, Math.round(monthVal))) : 0;

    return {
      event: snap.event,
      dateValue: snap.dateValue,
      year,
      monthInt,
      strength,
      topThreeStrength,
      competitorCount: entries.length
    };
  });
}

// Types that use a trailing average of the last 2 events instead of the last 3.
const TRAILING_AVERAGE_WINDOW_OVERRIDES = { unicon: 2, eucs: 2 };

// Group the per-event strength series by event type (prefix) and year, compute trailing
// averages of total and top-three strength over the last N events of that type (N=2 for
// Unicon/EUCS, N=3 otherwise), keeping each type's events sorted chronologically.
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
        const topThreeTrailingAverage = windowEntries.reduce((total, e) => total + e.topThreeStrength, 0) / windowEntries.length;
        return { ...entry, trailingAverage, topThreeTrailingAverage };
      });

      return {
        type: typeKey,
        entries: withTrailingAverage
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

  let html = '<table class="event-strength-table"><thead><tr><th>Event type</th><th>Year</th><th>Strength (sum)</th><th>Top 3 strength (sum)</th><th>Strength (avg)</th><th>Riders</th><th>Trailing avg</th><th>Top 3 trailing avg</th></tr></thead><tbody>';
  groups.forEach((group) => {
    group.entries.forEach((entry, i) => {
      const average = entry.competitorCount > 0 ? entry.strength / entry.competitorCount : 0;
      html += `<tr>`;
      html += i === 0 ? `<td rowspan="${group.entries.length}">${escapeXml(group.type)}</td>` : '';
      html += `<td>${entry.year || ''}</td>`;
      html += `<td>${entry.strength.toFixed(1)}</td>`;
      html += `<td>${entry.topThreeStrength.toFixed(1)}</td>`;
      html += `<td>${average.toFixed(1)}</td>`;
      html += `<td>${entry.competitorCount}</td>`;
      html += `<td>${entry.trailingAverage.toFixed(1)}</td>`;
      html += `<td>${entry.topThreeTrailingAverage.toFixed(1)}</td>`;
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
    return {
      type: group.type,
      trailingAverage: mostRecent ? mostRecent.trailingAverage : 0,
      topThreeTrailingAverage: mostRecent ? mostRecent.topThreeTrailingAverage : 0,
      latestEvent: mostRecent ? mostRecent.event : ''
    };
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

  let html = '<table class="event-strength-table"><thead><tr><th>Event type</th><th>Latest event</th><th>Trailing avg</th><th>Top 3 trailing avg</th></tr></thead><tbody>';
  averages.forEach((entry) => {
    html += `<tr>`;
    html += `<td>${escapeXml(entry.type)}</td>`;
    html += `<td>${escapeXml(entry.latestEvent)}</td>`;
    html += `<td>${entry.trailingAverage.toFixed(1)}</td>`;
    html += `<td>${entry.topThreeTrailingAverage.toFixed(1)}</td>`;
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
  applyDisciplineUi();
  applySettingsToDom();
  attachSettingsEvents();
  attachRiderNotesEvents();
  attachBattleDetailModalEvents();

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

      if (currentSearch && IS_RESULTS_SITE) {
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

  document.querySelectorAll('.gender-switch [data-gender]').forEach((button) => {
    button.addEventListener('click', () => setRankingGender(button.dataset.gender));
  });

  updateGenderToggleText();

  const femaleOpenButton = document.getElementById('show-female-open');
  if (femaleOpenButton) femaleOpenButton.addEventListener('click', showFemaleOpenAppearances);
  const femaleOpenClose = document.getElementById('female-open-close');
  if (femaleOpenClose) {
    femaleOpenClose.addEventListener('click', () => {
      document.getElementById('female-open-overlay')?.classList.add('hidden');
    });
  }

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
      // Line format: "Name,Alias #F #EU" - optional gender flag and region after '#'.
      const [namePart, genderPart = '', regionPart = ''] = line.split('#');
      const parts = namePart.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length === 0) return;
      const canonical = parts[0];
      riderInfoMap.set(canonical, { female: genderPart.trim().toUpperCase() === 'F', region: regionPart.trim() });
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
