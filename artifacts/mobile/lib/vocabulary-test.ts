export type VocabularyAnswerCredit = 0 | 0.5 | 1;
export type VocabularyTestGrade = 'A' | 'B' | 'C' | 'D' | 'F';

function normalizeExact(value: string) {
  return value
    .normalize('NFC')
    .trim()
    .toLocaleLowerCase()
    .replace(/[’‘`ʼ՚]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]+$/u, '');
}

function normalizeForTypos(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`ʼ՚]/g, '')
    .replace(/[.,!?;:¡¿"«»“”()\u0589\u055E\u055C\u055D\u055B\u2026-]/g, '')
    .replace(/\s+/g, '')
    .toLocaleLowerCase();
}

function editDistance(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= b.length; column += 1) {
      const old = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (a[row - 1] === b[column - 1] ? 0 : 1),
      );
      diagonal = old;
    }
  }
  return previous[b.length];
}

function hasSingleAdjacentTransposition(a: string, b: string) {
  if (a.length !== b.length) return false;
  const differences: number[] = [];
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) differences.push(index);
    if (differences.length > 2) return false;
  }
  return differences.length === 2 &&
    differences[1] === differences[0] + 1 &&
    a[differences[0]] === b[differences[1]] &&
    a[differences[1]] === b[differences[0]];
}

/** Full credit for the right spelling; a minor typo or missing accent earns half credit. */
export function scoreVocabularyAnswer(input: string, expected: string): VocabularyAnswerCredit {
  const exactInput = normalizeExact(input);
  const exactExpected = normalizeExact(expected);
  if (exactInput && exactInput === exactExpected) return 1;
  if (!exactInput || !exactExpected) return 0;

  const normalizedInput = normalizeForTypos(input);
  const normalizedExpected = normalizeForTypos(expected);
  if (!normalizedInput || !normalizedExpected) return 0;

  const edits = editDistance(normalizedInput, normalizedExpected);
  if (edits === 0) return 0.5;
  if (hasSingleAdjacentTransposition(normalizedInput, normalizedExpected)) return 0.5;
  const allowedEdits = normalizedExpected.length >= 10 ? 2 : normalizedExpected.length >= 3 ? 1 : 0;
  return allowedEdits > 0 && edits <= allowedEdits ? 0.5 : 0;
}

export function gradeVocabularyTest(score: number, total: number): VocabularyTestGrade {
  if (total <= 0) return 'F';
  const percent = (score / total) * 100;
  if (percent >= 90) return 'A';
  if (percent >= 80) return 'B';
  if (percent >= 70) return 'C';
  if (percent >= 60) return 'D';
  return 'F';
}

export function isBetterVocabularyTestScore(
  candidateScore: number,
  candidateTotal: number,
  bestScore?: number,
  bestTotal?: number,
) {
  if (!Number.isFinite(candidateScore) || candidateTotal <= 0) return false;
  if (!Number.isFinite(bestScore) || !Number.isFinite(bestTotal) || (bestTotal ?? 0) <= 0) return true;
  return candidateScore / candidateTotal > bestScore! / bestTotal!;
}
