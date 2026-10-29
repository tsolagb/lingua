import type { Language } from '@/data/vocabulary';

const WESTERN_ARMENIAN_LATIN: Record<string, string> = {
  ա: 'a',
  բ: 'p',
  գ: 'k',
  դ: 't',
  ե: 'e',
  զ: 'z',
  է: 'e',
  ը: 'uh',
  թ: "t'",
  ժ: 'zh',
  ի: 'i',
  լ: 'l',
  խ: 'kh',
  ծ: 'dz',
  կ: 'g',
  հ: 'h',
  ձ: 'ts',
  ղ: 'gh',
  ճ: 'j',
  մ: 'm',
  յ: 'y',
  ն: 'n',
  շ: 'sh',
  ո: 'o',
  չ: "ch'",
  պ: 'b',
  ջ: 'ch',
  ռ: 'r',
  ս: 's',
  վ: 'v',
  տ: 'd',
  ր: 'r',
  ց: "ts'",
  ւ: 'w',
  փ: "p'",
  ք: "k'",
  օ: 'o',
  ֆ: 'f',
  և: 'yev',
};

function transliterateWord(word: string): string {
  const normalized = word.normalize('NFC').toLocaleLowerCase('hy');
  if (normalized === 'ով') return 'ov';

  const letters = Array.from(normalized);
  let result = '';

  for (let index = 0; index < letters.length; index += 1) {
    const letter = letters[index];
    const atStart = !/[a-z]/i.test(result);

    // These traditional two-letter spellings represent single sounds.
    if (letter === 'ո' && letters[index + 1] === 'ւ') {
      result += 'u';
      index += 1;
      continue;
    }
    if (letter === 'ե' && letters[index + 1] === 'ւ') {
      result += atStart ? 'yev' : 'ev';
      index += 1;
      continue;
    }

    if (letter === 'ե' && atStart) {
      result += 'ye';
      continue;
    }
    if (letter === 'ո' && atStart) {
      result += 'vo';
      continue;
    }

    result += WESTERN_ARMENIAN_LATIN[letter] ?? letter;
  }

  return result;
}

/**
 * Gives English-speaking learners an approximate, pronunciation-friendly
 * Latin reading for traditional Western Armenian spelling.
 */
export function transliterateWesternArmenian(text: string): string {
  return text
    .split(/(\s+|-)/)
    .map(segment => (/^(\s+|-)$/.test(segment) ? segment : transliterateWord(segment)))
    .join('');
}

export function getEarlyArmenianReading(
  language: Language,
  levelIndex: number,
  word: string,
): string | undefined {
  if (language !== 'armenian' || levelIndex < 0 || levelIndex > 2 || !word.trim()) {
    return undefined;
  }
  return transliterateWesternArmenian(word);
}
