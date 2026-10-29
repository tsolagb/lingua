import { EVERYDAY_DIALOGUE_TOPICS } from './thematic-vocabulary';
import { PHRASE_PRACTICE_LEVELS } from './phrase-practice';
import { READING_PRACTICE_PASSAGES } from './reading-practice';
import { buildSentencePracticeLevels, type SentencePracticeItem } from '@/lib/sentence-practice-utils';

function phraseItems(levelId: string): SentencePracticeItem[] {
  const level = PHRASE_PRACTICE_LEVELS.find(item => item.id === levelId);
  return (level?.phrases ?? []).map(phrase => ({
    id: `phrase-${phrase.id}`,
    english: phrase.meaning,
    translations: phrase.translations,
  }));
}

function readingItems(passageId: string): SentencePracticeItem[] {
  const passage = READING_PRACTICE_PASSAGES.find(item => item.id === passageId);
  return (passage?.sentences ?? []).map((sentence, index) => ({
    id: `reading-${passageId}-${index + 1}`,
    english: sentence.english,
    translations: sentence.translations,
  }));
}

const dialogueItems: SentencePracticeItem[] = EVERYDAY_DIALOGUE_TOPICS.flatMap(topic =>
  topic.lines.map((line, index) => ({
    id: `dialogue-${topic.id}-${index + 1}`,
    english: line.english,
    translations: line.translations,
  })),
);

export const SENTENCE_PRACTICE_LEVELS = buildSentencePracticeLevels({
  simplePhrases: phraseItems('simple'),
  morning: readingItems('morning'),
  cafe: readingItems('cafe'),
  station: readingItems('station'),
  sunday: readingItems('sunday'),
  tomorrow: readingItems('tomorrow'),
  casualPhrases: phraseItems('casual'),
  dialogues: dialogueItems,
  nativePhrases: phraseItems('native'),
});
