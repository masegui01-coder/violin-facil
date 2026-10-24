// Compara lo que has tocado con la partitura (alineación de secuencias, como un corrector de textos).

const MATCH = 0;
const GAP = 1;
const SUBSTITUTE = 1;

// expected y played son listas de notas MIDI. Devuelve el estado de cada nota esperada y las notas de más.
export function compareNotes(expected, played) {
  const n = expected.length, m = played.length;
  const cost = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const diag = cost[i - 1][j - 1] + (expected[i - 1] === played[j - 1] ? MATCH : SUBSTITUTE);
      cost[i][j] = Math.min(diag, cost[i - 1][j] + GAP, cost[i][j - 1] + GAP);
    }
  }
  const states = new Array(n).fill('miss');
  let extra = 0;
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && cost[i][j] === cost[i - 1][j - 1] + (expected[i - 1] === played[j - 1] ? MATCH : SUBSTITUTE)) {
      states[i - 1] = expected[i - 1] === played[j - 1] ? 'ok' : 'wrong';
      i--; j--;
    } else if (i > 0 && cost[i][j] === cost[i - 1][j] + GAP) {
      i--;
    } else {
      extra++;
      j--;
    }
  }
  const correct = states.filter(s => s === 'ok').length;
  return { states, correct, extra, accuracy: n ? correct / n : 0 };
}

export function starsFor(accuracy) {
  return accuracy >= 0.9 ? 3 : accuracy >= 0.75 ? 2 : accuracy >= 0.5 ? 1 : 0;
}
