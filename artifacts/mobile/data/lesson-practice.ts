export type AnswerFeedback = 'correct' | 'try-again' | null;

export function canAdvanceAfterAnswer(feedback: AnswerFeedback): boolean {
  return feedback === 'correct';
}

export function getPracticeStars(correctAnswers: number, totalQuestions: number): 1 | 2 | 3 {
  if (totalQuestions <= 0) return 1;
  if (correctAnswers >= Math.ceil(totalQuestions * 0.9)) return 3;
  if (correctAnswers >= Math.ceil(totalQuestions * 0.6)) return 2;
  return 1;
}
