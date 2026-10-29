import type { Language } from '@/data/vocabulary';

export type TimeTellingAnswer = {
  expression: string;
  explanation: string;
};

export type TimeTellingExercise = {
  clock: string;
  stage: string;
  englishMeaning: string;
  answers: Record<Language, TimeTellingAnswer>;
};

export const TIME_TELLING_EXERCISES: TimeTellingExercise[] = [
  {
    clock: '1:00',
    stage: 'Whole hours',
    englishMeaning: 'It is one o’clock (1:00).',
    answers: {
      italian: {
        expression: 'È l’una.',
        explanation: 'For one o’clock, Italian uses the singular: è l’una.',
      },
      french: {
        expression: 'Il est une heure.',
        explanation: 'French uses il est followed by une heure in the singular.',
      },
      spanish: {
        expression: 'Es la una.',
        explanation: 'For one o’clock, Spanish uses the singular es la una.',
      },
      armenian: {
        expression: 'Ժամը մէկ է։',
        explanation: 'The Western Armenian phrase «Ժամը մէկ է» means “It is one o’clock.”',
      },
    },
  },
  {
    clock: '3:00',
    stage: 'Whole hours',
    englishMeaning: 'It is three o’clock (3:00).',
    answers: {
      italian: {
        expression: 'Sono le tre.',
        explanation: 'For hours other than one, Italian uses sono le plus the hour.',
      },
      french: {
        expression: 'Il est trois heures.',
        explanation: 'French uses il est followed by the number and heures for plural hours.',
      },
      spanish: {
        expression: 'Son las tres.',
        explanation: 'For hours other than one, Spanish uses son las plus the hour.',
      },
      armenian: {
        expression: 'Ժամը երեքն է։',
        explanation: 'The Western Armenian phrase «Ժամը երեքն է» means “It is three o’clock.”',
      },
    },
  },
  {
    clock: '6:30',
    stage: 'Half and quarter hours',
    englishMeaning: 'It is half past six (6:30).',
    answers: {
      italian: {
        expression: 'Sono le sei e mezza.',
        explanation: 'Italian commonly says e mezza (“and a half”) after the hour.',
      },
      french: {
        expression: 'Il est six heures et demie.',
        explanation: 'French adds et demie (“and a half”) after the hour.',
      },
      spanish: {
        expression: 'Son las seis y media.',
        explanation: 'Spanish adds y media (“and a half”) after the hour.',
      },
      armenian: {
        expression: 'Ժամը վեց ու կէս է։',
        explanation: 'The Western Armenian phrase «Ժամը վեց ու կէս է» means “It is half past six.”',
      },
    },
  },
  {
    clock: '12:15',
    stage: 'Half and quarter hours',
    englishMeaning: 'It is a quarter past twelve (12:15).',
    answers: {
      italian: {
        expression: 'Sono le dodici e un quarto.',
        explanation: 'Italian uses e un quarto (“and a quarter”) for a quarter past.',
      },
      french: {
        expression: 'Il est midi et quart.',
        explanation: 'French commonly uses midi et quart (“quarter past noon”).',
      },
      spanish: {
        expression: 'Son las doce y cuarto.',
        explanation: 'Spanish commonly uses y cuarto (“and a quarter”) for a quarter past.',
      },
      armenian: {
        expression: 'Ժամը տասներկու անց տասնհինգ է։',
        explanation: 'The Western Armenian phrase «Ժամը տասներկու անց տասնհինգ է» means “It is 12:15.”',
      },
    },
  },
  {
    clock: '2:45',
    stage: 'Minutes to the next hour',
    englishMeaning: 'It is a quarter to three (2:45).',
    answers: {
      italian: {
        expression: 'Sono le tre meno un quarto.',
        explanation: 'Italian can count back from the next hour: meno un quarto means “a quarter to.”',
      },
      french: {
        expression: 'Il est trois heures moins le quart.',
        explanation: 'French counts back from the next hour with moins le quart (“a quarter to”).',
      },
      spanish: {
        expression: 'Son las tres menos cuarto.',
        explanation: 'Spanish counts back from the next hour with menos cuarto (“a quarter to”).',
      },
      armenian: {
        expression: 'Ժամը երեքին քառորդ մը պակաս է։',
        explanation: 'The Western Armenian phrase «Ժամը երեքին քառորդ մը պակաս է» means “It is a quarter to three.”',
      },
    },
  },
  {
    clock: '7:28',
    stage: 'Exact minutes',
    englishMeaning: 'It is seven twenty-eight (7:28).',
    answers: {
      italian: {
        expression: 'Sono le sette e ventotto.',
        explanation: 'For exact minutes, Italian says the hour, e (“and”), then the minute.',
      },
      french: {
        expression: 'Il est sept heures vingt-huit.',
        explanation: 'For exact minutes, French says the hour followed by the minutes.',
      },
      spanish: {
        expression: 'Son las siete y veintiocho.',
        explanation: 'For exact minutes, Spanish says the hour, y (“and”), then the minutes.',
      },
      armenian: {
        expression: 'Ժամը եօթն անց քսանութ է։',
        explanation: 'The Western Armenian phrase «Ժամը եօթն անց քսանութ է» means “It is seven twenty-eight.”',
      },
    },
  },
];

export function isTimeTellingAnswerCorrect(
  exercise: TimeTellingExercise | undefined,
  language: Language,
  answer: string,
): boolean {
  return exercise?.answers[language].expression === answer;
}

export function getTimeTellingChoices(
  questionIndex: number,
  language: Language,
  exercises: readonly TimeTellingExercise[] = TIME_TELLING_EXERCISES,
): string[] {
  const exercise = exercises[questionIndex];
  if (!exercise) return [];

  const correctAnswer = exercise.answers[language].expression;
  const alternatives = [...new Set(
    exercises
      .map(item => item.answers[language].expression)
      .filter(expression => expression !== correctAnswer),
  )];
  const firstAlternative = questionIndex % alternatives.length;
  const distractors = [
    alternatives[firstAlternative],
    alternatives[(firstAlternative + 1) % alternatives.length],
  ].filter((choice): choice is string => Boolean(choice));
  const choices = [...distractors, correctAnswer];
  const correctPosition = questionIndex % choices.length;
  [choices[correctPosition], choices[choices.length - 1]] =
    [choices[choices.length - 1], choices[correctPosition]];
  return choices;
}
