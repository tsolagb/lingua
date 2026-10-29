import type { Language } from '@/data/vocabulary';
import { VERB_PERSONS } from '@/data/verb-guide';
import {
  getPracticeVerbForm,
  getVerbLessons,
  VERB_TENSES,
  type VerbCurriculumLesson,
  type VerbTenseOption,
} from '@/data/verb-curriculum';
import { VERB_GAP_EXERCISES, type VerbTenseLabel } from '@/data/verb-exercises';
import { shuffle, normalizeWord } from '@/lib/arcade/voice-utils';

export type SlotQuestion = {
  id: string;
  pronoun: string;
  pronounEnglish: string;
  verb: string;
  verbEnglish: string;
  tense: string;
  answer: string;
  fullForm: string;
  options: string[];
  context?: { before: string; after: string; english: string };
  why: string;
  plural: boolean;
};

const PRESENT_RULE: Record<Language, string> = {
  italian: 'Present endings depend on the person and verb group: -are (parlo, parli, parla), -ere (prendo, prendi, prende), -ire (dormo, dormi, dorme). Irregular verbs have their own forms.',
  french: 'For regular -er verbs: je -e, tu -es, il/elle -e, nous -ons, vous -ez, ils/elles -ent. Other verb groups and irregular verbs follow different patterns.',
  spanish: 'Present endings depend on person and verb group: -o; -as/-es; -a/-e; -amos/-emos/-imos; -áis/-éis/-ís; -an/-en. Irregular verbs may change their stem or endings.',
  armenian: 'Most Western Armenian action verbs use կը before a form conjugated for the subject. The ending depends on the verb group; verbs such as “to be” have special forms.',
};

function stripPronoun(form: string, language: Language, personIdx: number): { pronoun: string; rest: string } {
  if (language === 'french' && /^j['’]/.test(form)) return { pronoun: "j'", rest: form.slice(2).trim() };
  const [pronoun = '', ...rest] = form.trim().split(/\s+/);
  return { pronoun, rest: rest.join(' ').trim() };
}

function pastWhy(language: Language, answer: string): string {
  const a = answer.toLowerCase();
  if (language === 'italian') {
    if (/^(è|sono|sei|siamo|siete) /.test(a)) return 'Passato prossimo with essere: movement verbs like andare use essere, and the participle agrees with the subject (andato/andata/andati).';
    return 'Passato prossimo = avere in the present (ho, hai, ha, abbiamo, avete, hanno) + past participle.';
  }
  if (language === 'french') {
    if (/^(est|suis|es|sommes|êtes|sont) /.test(a)) return 'Passé composé: verbs such as aller take être, and the participle agrees with the subject (allé/allée/allés). Many other verbs use avoir.';
    return 'Passé composé = avoir in the present (ai, as, a, avons, avez, ont) + past participle.';
  }
  if (language === 'spanish') return 'Spanish uses the one-word preterite for finished past actions (comí, hablé, fue, vimos).';
  return 'Western Armenian simple past has no կը particle: the stem takes a past ending (խօսեցայ, կարդաց, կերայ).';
}

function futureWhy(language: Language): string {
  if (language === 'italian') return 'Italian future adds endings to the stem: -ò, -ai, -à, -emo, -ete, -anno (mangerò, andrai, sarà).';
  if (language === 'french') return 'French future uses a future stem + -ai, -as, -a, -ons, -ez, -ont. Regular stems are often the infinitive; irregular stems include ir- (aller) and aur- (avoir).';
  if (language === 'spanish') return 'Spanish future = infinitive + -é, -ás, -á, -emos, -án (hablaré, iremos, tendrán).';
  return 'Western Armenian future uses պիտի before the subjunctive form, with no կը (պիտի խօսիմ, պիտի կարդայ).';
}

function presentQuestion(
  language: Language,
  lesson: VerbCurriculumLesson,
  personIdx: number,
  tense: VerbTenseOption,
): SlotQuestion | null {
  const fullForm = getPracticeVerbForm(lesson, personIdx);
  const { pronoun, rest } = stripPronoun(fullForm, language, personIdx);
  if (!rest) return null;
  const others = lesson.practiceForms
    .map((f, i) => stripPronoun(f, language, i).rest)
    .filter(r => r && normalizeWord(r) !== normalizeWord(rest));
  const distractors = shuffle([...new Set(others)]).slice(0, 3);
  if (distractors.length < 2) return null;
  const personLabel = VERB_PERSONS[language][personIdx];
  const plural = personIdx >= 4;
  const kind = lesson.pattern === 'irregular' ? `${lesson.infinitive} is irregular, so this form must be memorised.` : `${lesson.infinitive} is regular. `;
  return {
    id: `p-${tense.id}-${lesson.infinitive}-${personIdx}`,
    pronoun,
    pronounEnglish: personLabel.split(' · ')[1] ?? '',
    verb: lesson.infinitive,
    verbEnglish: lesson.english,
    tense: tense.label,
    answer: rest,
    fullForm,
    options: shuffle([rest, ...distractors]),
    plural,
    why: `${kind}${tense.id === 'present' && lesson.pattern === 'regular' ? PRESENT_RULE[language] : tense.help} ${plural ? 'This is a plural subject, so it takes the plural form.' : ''} Full form: ${fullForm}.`.replace(/\s+/g, ' ').trim(),
  };
}

export function buildSlotQuestions(language: Language, total = 10): SlotQuestion[] {
  const conjugations: SlotQuestion[] = [];
  const tenseOptions = shuffle(VERB_TENSES[language]);
  for (const tense of tenseOptions) {
    const lessonsByPattern = getVerbLessons(language, tense.id);
    const lessons = [...lessonsByPattern.regular, ...lessonsByPattern.irregular];
    const candidateLessons = shuffle(lessons).slice(0, 8);
    for (const lesson of candidateLessons) {
      const personCount = VERB_PERSONS[language].length;
      const idx = shuffle(Array.from({ length: personCount }, (_, index) => index))[0];
      const q = presentQuestion(language, lesson, idx, tense);
      if (q) conjugations.push(q);
    }
  }
  const gaps: SlotQuestion[] = shuffle(VERB_GAP_EXERCISES[language].filter(g => g.tense !== 'Present')).map((g, i) => {
    const words = g.before.replace(/,/g, ' ').trim().split(/\s+/);
    const known = VERB_PERSONS[language].flatMap(p => p.split(' · ')[0].split(' / ').map(s => s.trim().toLowerCase()));
    const found = words.find(w => known.includes(w.toLowerCase()) || /^j['’]$/i.test(w));
    const pronoun = found ?? (words.length > 1 ? words[1] : words[0]) ?? '';
    return {
      id: `g-${i}-${g.answer}`,
      pronoun,
      pronounEnglish: '',
      verb: words[0] ?? g.tense,
      verbEnglish: g.english,
      tense: g.tense,
      answer: g.answer,
      fullForm: `${g.before}${g.answer}${g.after}`,
      options: shuffle([...g.options]),
      context: { before: g.before, after: g.after, english: g.english },
      plural: false,
      why: g.tense === 'Past' ? pastWhy(language, g.answer) : futureWhy(language),
    };
  });
  const gapCount = Math.min(4, gaps.length);
  return shuffle([...conjugations, ...gaps.slice(0, gapCount)]).slice(0, total);
}

export function slotFillers(language: Language) {
  const firstTense = VERB_TENSES[language][0];
  const lessonsByPattern = getVerbLessons(language, firstTense.id);
  const lessons = [...lessonsByPattern.regular, ...lessonsByPattern.irregular];
  return {
    pronouns: VERB_PERSONS[language].map(p => p.split(' · ')[0].split(' / ')[0]),
    verbs: lessons.map(l => l.infinitive),
    whens: [...new Set(VERB_GAP_EXERCISES[language].map(g => g.before.replace(/,/g, ' ').trim().split(/\s+/)[0]).filter(Boolean))],
    tenses: VERB_TENSES[language].map(tense => tense.label),
  };
}
