// Load after ranking.js in a browser to run the model regression tests.
(() => {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const close = (actual, expected) => Math.abs(actual - expected) < 1e-12;
  const ranking = [{ rider: 'B', skill: 2 }, { rider: 'A', skill: 3 }, { rider: 'C', skill: 1 }];
  const hiddenRank = new Map([['A', 1], ['B', 2], ['C', 3]]);
  const metrics = modelRankingMetrics(ranking, hiddenRank);
  assert(metrics.maxError === 1, 'Absolute maximum rank error');
  assert(metrics.maxRelativeError === 1, 'Relative error uses hidden rank');
  assert(close(metrics.maxWeightedError, 1 / 3), 'Weighted normalized error');
  assert(close(metrics.correlation, 0.5), 'Unweighted correlation match');
  assert(close(metrics.weightedCorrelation, 0.3999093500138246), 'Weighted correlation match');
  assert(close(metrics.top15Correlation, metrics.correlation), 'Top 15 uses all riders when there are fewer than 15');
  assert(metrics.top15MaxError === 1, 'Top 15 maximum deviation includes all riders when fewer than 15');
  [5, 30].forEach((count) => {
    assert(close(metrics[`top${count}Correlation`], metrics.correlation), `Top ${count} uses all riders when fewer are available`);
    assert(metrics[`top${count}MaxError`] === metrics.maxError, `Top ${count} deviation uses all riders when fewer are available`);
  });
  const topRanking = Array.from({ length: 16 }, (_, index) => ({
    rider: String(index),
    skill: index === 15 ? 1000 : 15 - index
  }));
  const topHiddenRank = new Map(topRanking.map((entry, index) => [entry.rider, index + 1]));
  const topMetrics = modelRankingMetrics(topRanking, topHiddenRank);
  assert(close(topMetrics.top15Correlation, 1) && topMetrics.correlation < 1,
    'Top 15 correlation excludes riders outside the test top 15');
  const hiddenRanks = Array.from({ length: 17 }, (_, index) =>
    index === 14 ? 16 : index === 15 ? 17 : index === 16 ? 15 : index + 1);
  const boundaryRanking = hiddenRanks.map((rank, index) => ({ rider: String(index), skill: 18 - rank }));
  const boundaryMetrics = modelRankingMetrics(boundaryRanking,
    new Map(hiddenRanks.map((rank, index) => [String(index), rank])));
  assert(boundaryMetrics.top15MaxError === 1 && boundaryMetrics.maxError === 2,
    'Top 15 maximum includes test rank 15 and excludes larger deviations below it');
  [5, 30].forEach((count) => {
    const ranks = Array.from({ length: count + 2 }, (_, index) =>
      index === count - 1 ? count + 1 : index === count ? count + 2 : index === count + 1 ? count : index + 1);
    const entries = ranks.map((rank, index) => ({ rider: String(index), skill: count + 3 - rank }));
    const result = modelRankingMetrics(entries, new Map(ranks.map((rank, index) => [String(index), rank])));
    assert(result[`top${count}MaxError`] === 1 && result.maxError === 2, `Top ${count} deviation respects the boundary`);
    const excluded = entries.map((entry, index) => ({ ...entry, skill: index === count ? 1000 : count + 2 - index }));
    const correlation = modelRankingMetrics(excluded, new Map(ranks.map((rank, index) => [String(index), rank])));
    assert(close(correlation[`top${count}Correlation`], 1) && correlation.correlation < 1,
      `Top ${count} correlation excludes riders outside the test top ${count}`);
  });

  const totals = MODEL_K_VALUES.map((_, k) => MODEL_N_VALUES.map((n) => ({
    maxError: (k - 2) ** 2 + (n - 4) ** 2,
    maxRelativeError: (k - 2) ** 2 + (n - 4) ** 2,
    maxWeightedError: (k - 2) ** 2 + (n - 4) ** 2,
    correlation: -((k - 4) ** 2 + (n - 6) ** 2),
    weightedCorrelation: -((k - 4) ** 2 + (n - 6) ** 2),
    top15Correlation: -((k - 7) ** 2 + (n - 9) ** 2),
    top15MaxError: (k - 9) ** 2 + (n - 2) ** 2,
    top5Correlation: -((k - 11) ** 2 + (n - 3) ** 2),
    top5MaxError: (k - 13) ** 2 + (n - 5) ** 2,
    top30Correlation: -((k - 15) ** 2 + (n - 7) ** 2),
    top30MaxError: (k - 17) ** 2 + (n - 8) ** 2
  })));
  const curves = modelOptimalCurves(totals, 2);
  const expected = [[1.2, 4], [1.2, 4], [1.2, 4], [1.4, 6], [1.4, 6], [1.7, 7], [1.9, 3], [2.1, 3], [2.3, 5], [2.5, 7], [2.7, 7]];
  assert(curves.every((curve, index) =>
    curve.best.parameter === expected[index][0] && curve.best.n === expected[index][1]),
  'Each objective selects its own optimal k and n');
  assert(curves[0].points[0].n === 4 && curves[0].points[0].value === 2, 'Curves use average values at each k');
  const ties = modelOptimalCurves(totals.map((byN) => byN.map(() =>
    Object.fromEntries(MODEL_METRICS.map((metric) => [metric.key, 1])))), 1);
  assert(ties.every((curve) => curve.best.parameter === 1 && curve.best.n === 3), 'Ties choose the lowest k and n');

  const events = [{ event: { name: 'Unicon26', weight: 1 }, year: 2026 }];
  const skills = new Map([['A', 3], ['B', 2], ['C', 1]]);
  const rosters = new Map([['Unicon26', ['A', 'B', 'C']]]);
  const noise = new Map([['Unicon26', new Map([['A', -1], ['B', 1], ['C', 0]])]]);
  const evaluated = [];
  evaluateModelSimulation(events, skills, rosters, noise, 0, 1, 1, hiddenRank,
    (k, n, values) => evaluated.push({ k, n, values }));
  assert(evaluated.length === 205, 'All 41 k values and 5 n values are evaluated');
  assert([...new Set(evaluated.map((entry) => entry.k))].every((k, index) => k === (index + 10) / 10),
    'k runs from 1.0 to 5.0 in steps of 0.1');
  assert(evaluated.every((entry) => entry.n >= 3 && entry.n <= 7) &&
    [3, 4, 5, 6, 7].every((n) => evaluated.filter((entry) => entry.n === n).length === 41),
  'Every k tests exactly n = 3 through 7');
  assert(evaluated.every((entry) => entry.values.maxError === 0 && close(entry.values.correlation, 1)),
    'No-noise rankings match the skills');
  const selected = [];
  evaluateModelSimulation(events, skills, rosters, noise, 0.3, 1, 1, hiddenRank,
    (k, n, values) => selected.push({ k, n, values }), { parameter: 3.7, n: 4 });
  assert(selected.length === 1 && selected[0].k === 3.7 && selected[0].n === 4, 'Detail selection evaluates only its fractional k/n pair');
  assert(selected[0].values.maxError === 1, 'Performance shift can change the ranking');
  const exponential = MODEL_SCORINGS[1];
  assert(exponential.values.length === 30 && exponential.values.every((value, index) => value === index + 1),
    'Exponential scoring tests minimum points 1 through 30');
  exponential.values.forEach((minimum) => {
    assert(close(exponentialPlacePoints(1, 10, minimum), 100), 'Exponential winner scores 100');
    assert(close(exponentialPlacePoints(10, 10, minimum), minimum), 'Exponential last place scores minimum');
    assert(close(exponentialPlacePoints(1, 1, minimum), 100), 'Single rider scores 100');
  });
  const evaluatedExponential = [];
  evaluateModelSimulation(events, skills, rosters, noise, 0, 1, 1, hiddenRank,
    (parameter, n, values, ranking) => evaluatedExponential.push({ parameter, n, values, ranking }), null, exponential);
  assert(evaluatedExponential.length === 150 && exponential.values.every((value) =>
    evaluatedExponential.filter((entry) => entry.parameter === value).length === 5), 'All exponential parameter/n combinations are evaluated');
  assert(evaluatedExponential.every((entry) => entry.values.maxError === 0), 'Exponential zero-noise rankings match skills');
  const selectedExponential = [];
  evaluateModelSimulation(events, skills, rosters, noise, 0, 1, 1, hiddenRank,
    (parameter, n, values, ranking) => selectedExponential.push({ parameter, n, ranking }), { parameter: 17, n: 5 }, exponential);
  assert(selectedExponential.length === 1 && selectedExponential[0].parameter === 17 &&
    selectedExponential[0].n === 5 && close(selectedExponential[0].ranking[2].scores[0].placePoints, 17),
  'Exponential detail selection uses the selected minimum points');
  const expTotals = exponential.values.map((value) => MODEL_N_VALUES.map((n) =>
    Object.fromEntries(MODEL_METRICS.map((metric) => [metric.key,
      (metric.maximize ? -1 : 1) * ((value - 17) ** 2 + (n - 6) ** 2)]))));
  assert(modelOptimalCurves(expTotals, 1, exponential.values).every((curve) =>
    curve.best.parameter === 17 && curve.best.n === 6), 'Exponential objectives optimize minimum points and n');
  console.log('Model regression tests passed.');
})();
