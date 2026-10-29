/** Normalize crossword answers while preserving Latin, Armenian, and Greek letters. */
export function normalizeCrosswordWord(value: string): string {
  return value.toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z\u0531-\u0556\u0391-\u03A9]/g, '');
}
