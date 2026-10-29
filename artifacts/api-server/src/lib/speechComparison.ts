/** Text similarity, NOT an acoustic/phoneme-level pronunciation assessment. */
export function normalizeTranscript(text: string) {
  return text.normalize("NFKD").toLocaleLowerCase()
    .replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim().replace(/\s+/gu, " ");
}

export function transcriptSimilarity(expected: string, actual: string) {
  const left = Array.from(normalizeTranscript(expected));
  const right = Array.from(normalizeTranscript(actual));
  if (!left.length || !right.length) return 0;
  let row = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i++) {
    const next = [i];
    for (let j = 1; j <= right.length; j++) {
      next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return Math.max(0, 1 - row[right.length] / Math.max(left.length, right.length));
}
