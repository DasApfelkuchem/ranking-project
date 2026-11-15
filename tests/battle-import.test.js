// Load after ranking.js in a browser to run battle import regression tests.
(() => {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const finalFirst = ['A, B', 'C, D', 'A, C', 'B, D'];
  const lowerRounds = ['A, E', 'B, F'];
  const reversed = [...finalFirst, ...lowerRounds].reverse();
  assert(orderBattleLines(reversed).join('|') === [...finalFirst, ...lowerRounds].join('|'),
    'Reversed battles are displayed final first');
  assert(orderBattleLines(finalFirst).join('|') === finalFirst.join('|'),
    'A four-battle final-first bracket stays in order');
  assert(orderBattleLines(finalFirst.slice().reverse()).join('|') === finalFirst.join('|'),
    'A four-battle reversed bracket is reordered');
  const incomplete = ['A, B', 'C, D', 'A, C', 'B, E', 'F, G'];
  assert(orderBattleLines(incomplete).join('|') === incomplete.join('|'),
    'Battles without four riders at the end stay in order');
  assert(orderBattleLines(['A, B', 'C, D']).join('|') === 'A, B|C, D',
    'Fewer than four battles stay in order');

  const header = 'Winner votes, Winner difficulty, Winner variety, Winner fullness, Winner style, Winner battling, /, Loser votes, Loser difficulty, Loser variety, Loser fullness, Loser style, Loser battling, /';
  const names = parseBattleNames(header);
  const fields = '3, 14.4/24, 12.4/24, 9.6/17, 11.9/17, 6.6/18, /, 0, 9.2/24, 9.6/24, 6.8/17, 6.2/17, 1.2/18, /'.split(',').map((field) => field.trim());
  const detail = parseDetailedBattleFields(fields, names);
  assert(detail && detail.winnerScores.length === 7 && detail.loserScores.length === 7 &&
    detail.winnerScores[0].display === '3' && detail.loserScores[0].display === '0' &&
    detail.winnerScores[6].display === '/', 'Paired winner/loser headers parse the EUCW26 scores');
  assert(parseBattleNames('Votes, Difficulty, Variety, Style').join('|') === 'Votes|Difficulty|Variety|Style',
    'Single-set score headers remain unchanged');
  assert(parseBattleNames('Winner votes, Winner difficulty, Loser votes, Loser style').length === 4,
    'Unmatched score headers are not silently changed');
  console.log('Battle import regression tests passed.');
})();
