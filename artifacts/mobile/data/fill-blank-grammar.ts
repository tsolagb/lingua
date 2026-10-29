import { LANGUAGE_FOUNDATIONS } from '@/data/language-foundations';
import { getGrammarCourse } from '@/data/grammar-curriculum';
import type { Language } from '@/data/vocabulary';
import type { FillBlankGrammarPrompt } from '@/lib/fill-blank-game';

function promptFromQuestion(
  question: {
    sentence?: string;
    sentenceTranslation?: string;
    answer: string;
    choices: string[];
    hint?: string;
    explanation?: string;
  },
  id: string,
  categoryId: string,
  categoryName: string,
): FillBlankGrammarPrompt | null {
  if (!question.sentence?.includes('___') || !question.sentenceTranslation || !question.choices.length) {
    return null;
  }
  return {
    id,
    categoryId,
    categoryName,
    sentence: question.sentence,
    sentenceTranslation: question.sentenceTranslation,
    answer: question.answer,
    choices: question.choices,
    hint: question.hint,
    explanation: question.explanation,
  };
}

export function getFillBlankGrammarPrompts(language: Language): FillBlankGrammarPrompt[] {
  const foundation = LANGUAGE_FOUNDATIONS[language];
  const articlePrompts = Object.entries(foundation.articleGroups).flatMap(([groupId, group]) =>
    group.questions
      .map((question, index) =>
        promptFromQuestion(question, `article-${groupId}-${index}`, 'articles', 'Articles'),
      )
      .filter((prompt): prompt is FillBlankGrammarPrompt => Boolean(prompt)),
  );
  const prepositionPrompts = [
    ...foundation.prepositionQuestions.map((question, index) =>
      promptFromQuestion(question, `preposition-${index}`, 'prepositions', 'Prepositions'),
    ),
    ...foundation.prepositionArticleQuestions.map((question, index) =>
      promptFromQuestion(question, `preposition-article-${index}`, 'prepositions', 'Prepositions & articles'),
    ),
  ].filter((prompt): prompt is FillBlankGrammarPrompt => Boolean(prompt));
  const verbPrompts = getGrammarCourse(language).flatMap(section =>
    section.units
      .filter(unit => /verb|tense|mood|subjunctive|imperative|conditional|copula|reflexive|passive/i.test(`${unit.id} ${unit.title}`))
      .flatMap(unit =>
        unit.questions
          .map((question, index) =>
            promptFromQuestion(
              question,
              `grammar-${unit.id}-${index}`,
              'verb-forms',
              'Verb forms',
            ),
          )
          .filter((prompt): prompt is FillBlankGrammarPrompt => Boolean(prompt)),
      ),
  );
  return [...articlePrompts, ...prepositionPrompts, ...verbPrompts];
}
