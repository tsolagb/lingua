export interface SentencePracticeItem {
  id: string;
  english: string;
  translations: Record<'italian' | 'french' | 'spanish' | 'armenian', string>;
}

export interface SentencePracticeLevel {
  id: string;
  title: string;
  description: string;
  items: SentencePracticeItem[];
}

export interface SentencePracticeSources {
  simplePhrases: SentencePracticeItem[];
  morning: SentencePracticeItem[];
  cafe: SentencePracticeItem[];
  station: SentencePracticeItem[];
  sunday: SentencePracticeItem[];
  tomorrow: SentencePracticeItem[];
  casualPhrases: SentencePracticeItem[];
  dialogues: SentencePracticeItem[];
  nativePhrases: SentencePracticeItem[];
}

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index + size <= items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

export function buildSentencePracticeLevels(sources: SentencePracticeSources): SentencePracticeLevel[] {
  const dialogueLevels = chunk(sources.dialogues, 8).map((items, index) => ({
    id: `conversations-${index + 1}`,
    title: `Everyday conversations ${index + 1}`,
    description: 'Build a natural reply from a short conversation.',
    items,
  }));

  return [
    {
      id: 'first-words',
      title: 'First phrases',
      description: 'Start with greetings, requests, and simple replies.',
      items: sources.simplePhrases,
    },
    {
      id: 'daily-routine',
      title: 'Daily routine',
      description: 'Practice simple actions and ordering at a café.',
      items: [...sources.morning, ...sources.cafe],
    },
    {
      id: 'around-town',
      title: 'Around town',
      description: 'Ask for directions and talk about your community.',
      items: [...sources.station, ...sources.sunday],
    },
    {
      id: 'time-and-plans',
      title: 'Time and plans',
      description: 'Use past, future, and casual expressions.',
      items: [...sources.tomorrow, ...sources.casualPhrases.slice(0, 4)],
    },
    ...dialogueLevels,
    {
      id: 'native-expressions',
      title: 'Native expressions',
      description: 'Try natural expressions and idioms in full context.',
      items: sources.nativePhrases,
    },
  ].filter(level => level.items.length >= 8 && level.items.length <= 10);
}
