import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from '@/components/native';
import { KeyboardAvoidingView as NativeKeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { useClassicGameResult } from '@/hooks/useClassicGameResult';
import { useSound } from '@/hooks/useSound';
import { useColors } from '@/hooks/useColors';
import { LANGUAGE_META, getUniqueVocabularyPairs } from '@/data/vocabulary';
import { SENTENCE_PRACTICE_LEVELS } from '@/data/sentence-practice';
import type { SentencePracticeItem } from '@/lib/sentence-practice-utils';
import {
  buildSentenceTileBank,
  findReviewWordEnglish,
  isSentenceTileOrderCorrect,
  type SentenceTile,
} from '@/lib/sentence-game-utils';
import { evaluateTypedTranslation, type TranslationTypo } from '@/lib/translation-answer';
import { goBackOr } from '@/lib/navigation';
import { usePreloadSpeech } from '@/components/SpeakerButton';

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'choose' | 'playing' | 'complete';
type Feedback = 'correct' | 'accepted-typo' | 'wrong' | null;
type TranslationQuestion = {
  item: SentencePracticeItem;
  tiles: SentenceTile[];
  reviewWord: string | null;
  levelTitle: string;
};

const DIFFICULTIES: { id: Difficulty; title: string; detail: string }[] = [
  { id: 'easy', title: 'Easy', detail: 'Word bank with English meaning' },
  { id: 'medium', title: 'Medium', detail: 'Word bank, no extra translation hint' },
  { id: 'hard', title: 'Hard', detail: 'Type the full translation' },
];
const DIFFICULTY_INDEX: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const QUESTIONS_PER_ROUND = 8;

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function starsForMistakes(mistakes: number): 1 | 2 | 3 {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

export default function GrammarTranslationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    activeLanguage,
    completeLevel,
    getLevelStars,
    recordWordAnswer,
    isMuted,
    toggleMute,
  } = useGame();
  const { report: reportClassic, beginRound } = useClassicGameResult('grammar-translation');
  const { playCorrect, playWrong, speakCorrectAnswer } = useSound();
  const meta = LANGUAGE_META[activeLanguage];
  const vocabulary = useMemo(() => getUniqueVocabularyPairs(activeLanguage), [activeLanguage]);
  const [phase, setPhase] = useState<Phase>('choose');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [session, setSession] = useState<TranslationQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedTileIds, setSelectedTileIds] = useState<number[]>([]);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [feedbackTypos, setFeedbackTypos] = useState<TranslationTypo[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [earnedStars, setEarnedStars] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const current = session[questionIndex];
  const targetSentence = current?.item.translations[activeLanguage] ?? '';
  const selectedTiles = current
    ? selectedTileIds
      .map(id => current.tiles.find(tile => tile.id === id))
      .filter((tile): tile is SentenceTile => Boolean(tile))
    : [];
  usePreloadSpeech(session.map(question => question.item.translations[activeLanguage]), activeLanguage);

  const startPractice = (chosenDifficulty: Difficulty) => {
    const levelCount = SENTENCE_PRACTICE_LEVELS.length;
    const third = Math.ceil(levelCount / 3);
    const start = chosenDifficulty === 'easy' ? 0 : chosenDifficulty === 'medium' ? third : third * 2;
    const end = chosenDifficulty === 'easy'
      ? third
      : chosenDifficulty === 'medium'
        ? Math.min(third * 2, levelCount)
        : levelCount;
    const matchingLevels = SENTENCE_PRACTICE_LEVELS.slice(start, Math.max(end, start + 1));
    let sourceItems = matchingLevels.flatMap(level =>
      level.items.map(item => ({ item, levelTitle: level.title })),
    );
    if (sourceItems.length < 3) {
      sourceItems = SENTENCE_PRACTICE_LEVELS.flatMap(level =>
        level.items.map(item => ({ item, levelTitle: level.title })),
      );
    }
    const selected = shuffle(sourceItems).slice(0, Math.min(QUESTIONS_PER_ROUND, sourceItems.length));
    const nextSession = selected.map(({ item, levelTitle }) => {
      const translated = item.translations[activeLanguage];
      const sentenceWords = new Set(translated.toLocaleLowerCase().split(/\s+/u));
      const distractors = shuffle(vocabulary
        .map(pair => pair.translations[activeLanguage])
        .filter(word => word && !sentenceWords.has(word.toLocaleLowerCase())));
      return {
        item,
        levelTitle,
        tiles: buildSentenceTileBank(translated, distractors),
        reviewWord: findReviewWordEnglish(item.english, vocabulary),
      };
    });
    beginRound();
    setDifficulty(chosenDifficulty);
    setSession(nextSession);
    setQuestionIndex(0);
    setSelectedTileIds([]);
    setTypedAnswer('');
    setFeedback(null);
    setFeedbackTypos([]);
    setMistakes(0);
    setSaveFailed(false);
    setPhase('playing');
  };

  const checkAnswer = () => {
    if (!current || feedback) return;
    let correct = false;
    let typos: TranslationTypo[] = [];
    if (difficulty === 'hard') {
      const result = evaluateTypedTranslation(typedAnswer, targetSentence);
      correct = result.correct;
      typos = result.typos;
    } else {
      correct = isSentenceTileOrderCorrect(selectedTiles, targetSentence);
    }
    const nextFeedback: Feedback = correct
      ? typos.length > 0 ? 'accepted-typo' : 'correct'
      : 'wrong';
    setFeedback(nextFeedback);
    setFeedbackTypos(typos);
    if (current.reviewWord) {
      recordWordAnswer(current.reviewWord, correct, undefined, undefined, activeLanguage);
    }
    speakCorrectAnswer(targetSentence, activeLanguage);
    if (correct) {
      playCorrect();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      setMistakes(count => count + 1);
      playWrong();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const continueQuestion = async () => {
    if (!feedback) return;
    if (questionIndex < session.length - 1) {
      setQuestionIndex(index => index + 1);
      setSelectedTileIds([]);
      setTypedAnswer('');
      setFeedback(null);
      setFeedbackTypos([]);
      return;
    }
    const stars = starsForMistakes(mistakes);
    const difficultyIndex = DIFFICULTY_INDEX[difficulty];
    setEarnedStars(stars);
    setSaving(true);
    setSaveFailed(false);
    const completion = completeLevel('grammar-translation', difficultyIndex, stars, activeLanguage);
    try {
      await completion;
      reportClassic(stars, completion);
      setEarnedStars(stars);
      setPhase('complete');
    } catch {
      setSaveFailed(true);
      setPhase('complete');
    } finally {
      setSaving(false);
    }
  };

  const retrySave = async () => {
    setSaving(true);
    setSaveFailed(false);
    const completion = completeLevel(
      'grammar-translation',
      DIFFICULTY_INDEX[difficulty],
      earnedStars,
      activeLanguage,
    );
    try {
      await completion;
      reportClassic(earnedStars, completion);
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const finishAndReturn = () => {
    setPhase('choose');
    setSession([]);
    setQuestionIndex(0);
    setFeedback(null);
  };

  const back = () => {
    if (phase !== 'choose') {
      finishAndReturn();
      return;
    }
    goBackOr('/categories');
  };

  const hearts = Math.max(0, 5 - mistakes);
  const easyOrMedium = difficulty !== 'hard';
  const headerProgress = phase === 'choose'
    ? 'CHOOSE A LEVEL'
    : phase === 'complete'
      ? 'ROUND COMPLETE'
      : `${questionIndex + 1} OF ${session.length}`;

  return (
    <View style={[styles.root, { backgroundColor: colors.groupedBackground }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 67 : insets.top + 7 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={phase === 'choose' ? 'Back to grammar lessons' : 'Back to difficulty selection'}
          onPress={back}
          activeOpacity={0.75}
          style={[styles.backButton, { backgroundColor: colors.card }]}
        >
          <Ionicons name="arrow-back" size={19} color={colors.foreground} />
        </TouchableOpacity>
        {phase !== 'choose' && (
          <View style={styles.progressCopy}>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>{headerProgress}</Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${phase === 'complete' ? 100 : ((questionIndex + (feedback ? 1 : 0)) / Math.max(session.length, 1)) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}
        {phase === 'playing' && (
          <>
            <View style={[styles.heartPill, { backgroundColor: colors.card }]}>
              <Ionicons name="heart" size={15} color={mistakes > 2 ? colors.destructive : colors.primary} />
              <Text style={[styles.heartText, { color: colors.foreground }]}>{hearts}</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={isMuted ? 'Turn sound on' : 'Turn sound off'}
              onPress={toggleMute}
              activeOpacity={0.75}
              style={[styles.soundButton, { backgroundColor: colors.card }]}
            >
              <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={17} color={colors.foreground} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {phase === 'choose' && (
        <ScrollView contentContainerStyle={[styles.chooseContent, { paddingBottom: insets.bottom + 26 }]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{meta.flag} {meta.label.toUpperCase()} · GRAMMAR</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Build a translation</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Translate complete English sentences into {meta.label}. Your word bank or typing mode changes with difficulty.
          </Text>
          <View style={styles.difficultyList}>
            {DIFFICULTIES.map((option, index) => {
              const selected = difficulty === option.id;
              const stars = getLevelStars('grammar-translation', index);
              return (
                <TouchableOpacity
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${option.title} translation level, ${stars} stars earned. ${option.detail}`}
                  testID={`grammar-translation-level-${option.id}`}
                  onPress={() => setDifficulty(option.id)}
                  activeOpacity={0.82}
                  style={[
                    styles.difficultyCard,
                    {
                      backgroundColor: selected ? colors.accent : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.difficultyIcon, { backgroundColor: selected ? colors.primary : colors.muted }]}>
                    <Text style={[styles.difficultyLetter, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>
                      {option.title.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.difficultyCopy}>
                    <Text style={[styles.difficultyTitle, { color: colors.foreground }]}>{option.title}</Text>
                    <Text style={[styles.difficultyDetail, { color: colors.mutedForeground }]}>{option.detail}</Text>
                  </View>
                  <View style={styles.stars}>
                    {[0, 1, 2].map(star => (
                      <Ionicons
                        key={star}
                        name={star < stars ? 'star' : 'star-outline'}
                        size={13}
                        color={star < stars ? colors.primary : colors.mutedForeground}
                      />
                    ))}
                  </View>
                  <Ionicons name={selected ? 'checkmark-circle' : 'chevron-forward'} size={18} color={selected ? colors.primary : colors.mutedForeground} />
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.modeNote, { backgroundColor: colors.card }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.modeNoteText, { color: colors.mutedForeground }]}>
              Easy and Medium use word tiles. Hard asks you to type; one small spelling mistake can still count as correct and will be shown.
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Start ${difficulty} translation practice`}
            testID="grammar-translation-start"
            onPress={() => startPractice(difficulty)}
            activeOpacity={0.82}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Start {difficulty}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
        </ScrollView>
      )}

      {phase === 'playing' && current && (
        <NativeKeyboardAvoidingView
          style={styles.playingArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={[styles.playContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
              {current.levelTitle.toUpperCase()} · {difficulty.toUpperCase()}
            </Text>
            <Text style={[styles.playTitle, { color: colors.foreground }]}>Translate into {meta.label}</Text>
            <View style={[styles.promptCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.promptLabel, { color: colors.mutedForeground }]}>
                {difficulty === 'easy' ? 'ENGLISH MEANING' : 'ENGLISH PROMPT'}
              </Text>
              <Text style={[styles.promptText, { color: colors.foreground }]}>{current.item.english}</Text>
            </View>

            {easyOrMedium ? (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{meta.flag} {meta.label.toUpperCase()}</Text>
                <View
                  style={[
                    styles.answerArea,
                    { backgroundColor: colors.card, borderColor: feedback === 'wrong' ? colors.destructive : colors.border },
                  ]}
                >
                  {selectedTiles.length === 0 ? (
                    <Text style={[styles.answerPlaceholder, { color: colors.mutedForeground }]}>Tap words below to build the translation</Text>
                  ) : (
                    <View style={styles.tileWrap}>
                      {selectedTiles.map(tile => (
                        <TouchableOpacity
                          key={tile.id}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${tile.text} from your translation`}
                          disabled={Boolean(feedback)}
                          onPress={() => setSelectedTileIds(ids => ids.filter(id => id !== tile.id))}
                          activeOpacity={0.8}
                          style={[
                            styles.wordTile,
                            { backgroundColor: feedback === 'correct' ? colors.success + '22' : colors.accent, borderColor: feedback === 'wrong' ? colors.destructive : colors.primary },
                          ]}
                        >
                          <Text style={[styles.wordTileText, { color: colors.foreground }]}>{tile.text}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>WORD BANK</Text>
                <View style={styles.tileWrap}>
                  {current.tiles.filter(tile => !selectedTileIds.includes(tile.id)).map(tile => (
                    <TouchableOpacity
                      key={tile.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${tile.text} to your translation`}
                      testID={`grammar-translation-tile-${tile.id}`}
                      disabled={Boolean(feedback)}
                      onPress={() => setSelectedTileIds(ids => [...ids, tile.id])}
                      activeOpacity={0.8}
                      style={[styles.wordTile, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Text style={[styles.wordTileText, { color: colors.foreground }]}>{tile.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{meta.flag} TYPE IN {meta.label.toUpperCase()}</Text>
                <TextInput
                  accessibilityLabel={`Type the ${meta.label} translation`}
                  testID="grammar-translation-answer-input"
                  value={typedAnswer}
                  onChangeText={setTypedAnswer}
                  editable={!feedback}
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={checkAnswer}
                  placeholder="Write the full sentence"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.typedInput, { backgroundColor: colors.card, borderColor: feedback === 'wrong' ? colors.destructive : colors.border, color: colors.foreground }]}
                />
              </>
            )}

            {feedback && (
              <View style={[
                styles.feedbackCard,
                { backgroundColor: feedback === 'wrong' ? colors.destructive + '15' : colors.success + '18' },
              ]}>
                <Ionicons
                  name={feedback === 'wrong' ? 'close-circle' : feedback === 'accepted-typo' ? 'alert-circle' : 'checkmark-circle'}
                  size={20}
                  color={feedback === 'wrong' ? colors.destructive : colors.success}
                />
                <View style={styles.feedbackCopy}>
                  <Text style={[styles.feedbackTitle, { color: feedback === 'wrong' ? colors.destructive : colors.success }]}>
                    {feedback === 'wrong'
                      ? 'Not quite'
                      : feedback === 'accepted-typo'
                        ? 'Accepted — spelling noted'
                        : 'That’s right'}
                  </Text>
                  {feedback === 'accepted-typo' && feedbackTypos.length > 0 && (
                    <Text style={[styles.feedbackSentence, { color: colors.mutedForeground }]}>
                      {feedbackTypos.map(typo => `“${typo.typed}” → “${typo.expected}”`).join(' · ')}. Counted as correct.
                    </Text>
                  )}
                  <Text style={[styles.feedbackSentence, { color: colors.foreground }]}>{targetSentence}</Text>
                </View>
              </View>
            )}
          </ScrollView>
          <View style={[styles.bottomAction, { paddingBottom: Math.max(14, insets.bottom + 8), backgroundColor: colors.groupedBackground }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={feedback ? 'Continue to the next translation' : 'Check translation'}
              testID="grammar-translation-check"
              disabled={saving || (!feedback && (difficulty === 'hard' ? typedAnswer.trim().length === 0 : selectedTiles.length === 0))}
              onPress={feedback ? continueQuestion : checkAnswer}
              activeOpacity={0.82}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                (!feedback && (difficulty === 'hard' ? typedAnswer.trim().length === 0 : selectedTiles.length === 0)) && { opacity: 0.52 },
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                {saving ? 'Saving…' : feedback ? questionIndex + 1 === session.length ? 'Finish round' : 'Continue' : 'Check'}
              </Text>
              <Ionicons name={feedback && questionIndex + 1 === session.length ? 'checkmark' : 'arrow-forward'} size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </NativeKeyboardAvoidingView>
      )}

      {phase === 'complete' && (
        <ScrollView contentContainerStyle={[styles.completeContent, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.completeIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name={saveFailed ? 'cloud-offline-outline' : 'checkmark-done'} size={29} color={saveFailed ? colors.destructive : colors.primary} />
          </View>
          <Text style={[styles.completeTitle, { color: colors.foreground }]}>
            {saveFailed ? 'Progress not saved' : 'Translation round complete'}
          </Text>
          <Text style={[styles.completeSubtitle, { color: colors.mutedForeground }]}>
            {saveFailed
              ? 'Your round is finished, but progress could not be saved yet.'
              : `${session.length - mistakes} of ${session.length} accepted · ${mistakes} missed`}
          </Text>
          {saveFailed && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: saving }}
              testID="grammar-translation-retry-save"
              disabled={saving}
              onPress={retrySave}
              activeOpacity={0.82}
              style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
                {saving ? 'Saving…' : 'Retry saving progress'}
              </Text>
            </TouchableOpacity>
          )}
          {!saveFailed && (
            <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
              <View style={styles.stars}>
                {[0, 1, 2].map(star => (
                  <Ionicons key={star} name={star < earnedStars ? 'star' : 'star-outline'} size={22} color={star < earnedStars ? colors.primary : colors.mutedForeground} />
                ))}
              </View>
              <Text style={[styles.resultText, { color: colors.foreground }]}>{earnedStars} stars earned</Text>
            </View>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            testID="grammar-translation-again"
            onPress={() => startPractice(difficulty)}
            activeOpacity={0.82}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Play again</Text>
            <Ionicons name="refresh" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            testID="grammar-translation-done"
            onPress={finishAndReturn}
            activeOpacity={0.82}
            style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 58 },
  backButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  progressCopy: { flex: 1, gap: 6 },
  progressLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.55 },
  progressTrack: { height: 5, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 5 },
  heartPill: { height: 34, minWidth: 48, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 9 },
  heartText: { fontSize: 13, fontWeight: '800' },
  soundButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  chooseContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 18, gap: 13 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 0.65 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 3 },
  difficultyList: { gap: 9 },
  difficultyCard: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 17, padding: 11 },
  difficultyIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  difficultyLetter: { fontSize: 16, fontWeight: '900' },
  difficultyCopy: { flex: 1, gap: 3 },
  difficultyTitle: { fontSize: 14, fontWeight: '800' },
  difficultyDetail: { fontSize: 11, lineHeight: 15 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  modeNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 14, padding: 12 },
  modeNoteText: { flex: 1, fontSize: 11, lineHeight: 16 },
  primaryButton: { minHeight: 52, borderRadius: 17, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 3 },
  primaryButtonText: { fontSize: 14, fontWeight: '800', textTransform: 'capitalize' },
  playingArea: { flex: 1 },
  playContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, gap: 12 },
  playTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  promptCard: { borderRadius: 19, padding: 16, gap: 8 },
  promptLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  promptText: { fontSize: 19, lineHeight: 27, fontWeight: '700' },
  sectionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.65, marginTop: 2 },
  answerArea: { minHeight: 84, borderWidth: 1, borderRadius: 17, padding: 11, justifyContent: 'center' },
  answerPlaceholder: { fontSize: 12, textAlign: 'center', lineHeight: 17 },
  tileWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  wordTile: { minHeight: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center' },
  wordTileText: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  typedInput: { minHeight: 58, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, fontWeight: '700' },
  feedbackCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 15, padding: 12 },
  feedbackCopy: { flex: 1, gap: 4 },
  feedbackTitle: { fontSize: 13, fontWeight: '800' },
  feedbackSentence: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  bottomAction: { paddingHorizontal: 20, paddingTop: 8 },
  completeContent: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 42, gap: 14 },
  completeIcon: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  completeTitle: { fontSize: 23, fontWeight: '800', textAlign: 'center' },
  completeSubtitle: { fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 320 },
  resultCard: { width: '100%', alignItems: 'center', gap: 7, borderRadius: 17, padding: 17 },
  resultText: { fontSize: 14, fontWeight: '800' },
  secondaryButton: { width: '100%', minHeight: 48, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontSize: 13, fontWeight: '800' },
});
