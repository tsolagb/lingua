import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '@/context/GameContext';
import { useClassicGameResult } from '@/hooks/useClassicGameResult';
import { SENTENCE_PRACTICE_LEVELS } from '@/data/sentence-practice';
import { LANGUAGE_META, getUniqueVocabularyPairs } from '@/data/vocabulary';
import { useSound } from '@/hooks/useSound';
import { useColors } from '@/hooks/useColors';
import { typography } from '@/constants/typography';
import { goBackOr } from '@/lib/navigation';
import {
  buildSentenceTileBank,
  findReviewWordEnglish,
  isSentenceTileOrderCorrect,
  type SentenceTile,
} from '@/lib/sentence-game-utils';
import type { SentencePracticeItem } from '@/lib/sentence-practice-utils';
import { usePreloadSpeech } from '@/components/SpeakerButton';

type PlayQuestion = {
  item: SentencePracticeItem;
  tiles: SentenceTile[];
  reviewWord: string | null;
};
type Phase = 'levels' | 'playing' | 'complete';
const MAX_HEARTS = 5;

function sentenceStars(mistakes: number): number {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

export default function SentencePracticeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    activeLanguage,
    completeLevel,
    getLevelStars,
    isLevelCompleted,
    recordWordAnswer,
    isMuted,
    toggleMute,
  } = useGame();
  const { report: reportClassic } = useClassicGameResult('sentencepractice');
  const { playCorrect, playWrong, speakCorrectAnswer } = useSound();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 24 : insets.bottom;
  const vocabulary = useMemo(() => getUniqueVocabularyPairs(activeLanguage), [activeLanguage]);
  const [phase, setPhase] = useState<Phase>('levels');
  const [levelIndex, setLevelIndex] = useState<number | null>(null);
  const [session, setSession] = useState<PlayQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedTileIds, setSelectedTileIds] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [earnedStars, setEarnedStars] = useState(0);
  const [saving, setSaving] = useState(false);

  const current = session[questionIndex];
  usePreloadSpeech(session.map(question => question.item.translations[activeLanguage]), activeLanguage);
  const selectedTiles = current
    ? selectedTileIds
      .map(id => current.tiles.find(tile => tile.id === id))
      .filter((tile): tile is SentenceTile => Boolean(tile))
    : [];
  const heartsRemaining = Math.max(0, MAX_HEARTS - mistakes);
  const extraMistakes = Math.max(0, mistakes - MAX_HEARTS);

  const startLevel = (index: number) => {
    const level = SENTENCE_PRACTICE_LEVELS[index];
    const nextSession = level.items.map(item => {
      const targetSentence = item.translations[activeLanguage];
      const inSentence = new Set(targetSentence.toLocaleLowerCase().split(/\s+/u));
      const distractors = vocabulary
        .map(pair => pair.translations[activeLanguage])
        .filter(word => word && !inSentence.has(word.toLocaleLowerCase()))
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      return {
        item,
        tiles: buildSentenceTileBank(targetSentence, distractors),
        reviewWord: findReviewWordEnglish(item.english, vocabulary),
      };
    });
    setLevelIndex(index);
    setSession(nextSession);
    setQuestionIndex(0);
    setSelectedTileIds([]);
    setFeedback(null);
    setMistakes(0);
    setEarnedStars(0);
    setPhase('playing');
  };

  const checkAnswer = () => {
    if (!current || feedback || selectedTiles.length === 0) return;
    const isCorrect = isSentenceTileOrderCorrect(
      selectedTiles,
      current.item.translations[activeLanguage],
    );
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) setMistakes(count => count + 1);
    if (current.reviewWord) {
      recordWordAnswer(current.reviewWord, isCorrect, undefined, undefined, activeLanguage);
    }
    speakCorrectAnswer(current.item.translations[activeLanguage], activeLanguage);
    if (isCorrect) {
      playCorrect();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      playWrong();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const continueQuestion = async () => {
    if (!feedback || levelIndex === null) return;
    if (questionIndex < session.length - 1) {
      setQuestionIndex(index => index + 1);
      setSelectedTileIds([]);
      setFeedback(null);
      return;
    }
    const stars = sentenceStars(mistakes);
    setSaving(true);
    try {
      await completeLevel('sentence-practice', levelIndex, stars, activeLanguage);
      reportClassic(stars);
      setEarnedStars(stars);
      setPhase('complete');
    } finally {
      setSaving(false);
    }
  };

  const leaveGame = () => {
    if (phase === 'playing' || phase === 'complete') {
      setPhase('levels');
      setLevelIndex(null);
      return;
    }
    goBackOr('/categories');
  };

  const languageMeta = LANGUAGE_META[activeLanguage];
  const currentLevel = levelIndex === null ? null : SENTENCE_PRACTICE_LEVELS[levelIndex];

  return (
    <View style={[styles.root, { backgroundColor: colors.groupedBackground }]}>
      <View style={[styles.header, { paddingTop: topPad + 7 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={phase === 'levels' ? 'Go back to lessons' : 'Back to sentence levels'}
          onPress={leaveGame}
          activeOpacity={0.75}
          style={[styles.backButton, { backgroundColor: colors.card }]}
        >
          <Ionicons name="arrow-back" size={19} color={colors.foreground} />
        </TouchableOpacity>
        {phase !== 'levels' ? (
          <>
            <View style={styles.progressCopy}>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                {phase === 'complete' ? 'SET COMPLETE' : `${questionIndex + 1} / ${session.length}`}
              </Text>
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
            <View style={[styles.heartPill, { backgroundColor: colors.card }]}>
              <Ionicons name="heart" size={15} color={mistakes > 2 ? colors.destructive : colors.primary} />
              <Text style={[styles.heartText, { color: colors.foreground }]}>{heartsRemaining}</Text>
              {extraMistakes > 0 && (
                <Text style={[styles.extraMistakes, { color: colors.destructive }]}>+{extraMistakes}</Text>
              )}
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
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {phase === 'levels' && (
        <ScrollView
          contentContainerStyle={[styles.levelContent, { paddingBottom: bottomPad + 28 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{languageMeta.label.toUpperCase()} · SENTENCES</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Sentence practice</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Build each translation by tapping the words in order.
          </Text>
          <View style={styles.levelList}>
            {SENTENCE_PRACTICE_LEVELS.map((level, index) => {
              const stars = getLevelStars('sentence-practice', index);
              const completed = isLevelCompleted('sentence-practice', index);
              return (
                <TouchableOpacity
                  key={level.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${level.title}, ${level.items.length} sentences${completed ? `, ${stars} stars earned` : ''}`}
                  testID={`sentence-practice-level-${index + 1}`}
                  onPress={() => startLevel(index)}
                  activeOpacity={0.82}
                  style={[styles.levelCard, { backgroundColor: colors.card }]}
                >
                  <View style={[styles.levelNumber, { backgroundColor: completed ? colors.primary : colors.accent }]}>
                    {completed
                      ? <Ionicons name="checkmark" size={17} color={colors.primaryForeground} />
                      : <Text style={[styles.levelNumberText, { color: colors.primary }]}>{index + 1}</Text>}
                  </View>
                  <View style={styles.levelCopy}>
                    <Text style={[styles.levelTitle, { color: colors.foreground }]}>{level.title}</Text>
                    <Text style={[styles.levelSubtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {level.description} · {level.items.length} sentences
                    </Text>
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
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {phase === 'playing' && current && (
        <>
          <ScrollView
            contentContainerStyle={styles.playContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
              {currentLevel?.title.toUpperCase()} · SET {questionIndex + 1}
            </Text>
            <Text style={[styles.playTitle, { color: colors.foreground }]}>Build the translation</Text>
            <View style={[styles.promptCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.promptLabel, { color: colors.mutedForeground }]}>ENGLISH</Text>
              <Text style={[styles.promptText, { color: colors.foreground }]}>{current.item.english}</Text>
            </View>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{languageMeta.flag} {languageMeta.label.toUpperCase()}</Text>
            <View style={[styles.answerArea, { backgroundColor: colors.card, borderColor: feedback === 'wrong' ? colors.destructive : colors.border }]}>
              {selectedTiles.length === 0 ? (
                <Text style={[styles.answerPlaceholder, { color: colors.mutedForeground }]}>Tap words below to build the sentence</Text>
              ) : (
                <View style={styles.tileWrap}>
                  {selectedTiles.map(tile => (
                    <TouchableOpacity
                      key={tile.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${tile.text} from your sentence`}
                      onPress={() => feedback ? undefined : setSelectedTileIds(ids => ids.filter(id => id !== tile.id))}
                      activeOpacity={feedback ? 1 : 0.8}
                      style={[
                        styles.wordTile,
                        styles.answerTile,
                        { backgroundColor: feedback === 'correct' ? colors.success + '22' : colors.accent, borderColor: feedback === 'wrong' ? colors.destructive : colors.primary },
                      ]}
                    >
                      <Text style={[styles.wordTileText, { color: colors.foreground }]} numberOfLines={2}>{tile.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            {feedback && (
              <View style={[
                styles.feedbackCard,
                { backgroundColor: feedback === 'correct' ? colors.success + '18' : colors.destructive + '15' },
              ]}>
                <Ionicons
                  name={feedback === 'correct' ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={feedback === 'correct' ? colors.success : colors.destructive}
                />
                <View style={styles.feedbackCopy}>
                  <Text style={[
                    styles.feedbackTitle,
                    { color: feedback === 'correct' ? colors.success : colors.destructive },
                  ]}>
                    {feedback === 'correct' ? 'That’s right' : 'Keep practicing'}
                  </Text>
                  <Text style={[styles.feedbackSentence, { color: colors.foreground }]}>
                    {current.item.translations[activeLanguage]}
                  </Text>
                </View>
              </View>
            )}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>WORD BANK</Text>
            <View style={styles.tileWrap}>
              {current.tiles
                .filter(tile => !selectedTileIds.includes(tile.id))
                .map(tile => (
                  <TouchableOpacity
                    key={tile.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${tile.text} to your sentence`}
                    testID={`sentence-word-tile-${tile.id}`}
                    disabled={Boolean(feedback)}
                    onPress={() => setSelectedTileIds(ids => [...ids, tile.id])}
                    activeOpacity={0.8}
                    style={[styles.wordTile, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.wordTileText, { color: colors.foreground }]} numberOfLines={2}>{tile.text}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </ScrollView>
          <View style={[styles.bottomAction, { paddingBottom: Math.max(14, bottomPad + 8), backgroundColor: colors.groupedBackground }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={feedback ? 'Continue to the next sentence' : 'Check sentence'}
              testID="sentence-practice-check"
              disabled={saving || (!feedback && selectedTiles.length === 0)}
              onPress={feedback ? continueQuestion : checkAnswer}
              activeOpacity={0.82}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                (!feedback && selectedTiles.length === 0) && { opacity: 0.52 },
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                {saving ? 'Saving…' : feedback ? (questionIndex === session.length - 1 ? 'Finish level' : 'Continue') : 'Check'}
              </Text>
              <Ionicons name={feedback ? 'arrow-forward' : 'checkmark'} size={19} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {phase === 'complete' && currentLevel && (
        <View style={styles.completeWrap}>
          <View style={[styles.completeCard, { backgroundColor: colors.card }]}>
            <View style={[styles.completeIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="trophy" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.completeTitle, { color: colors.foreground }]}>Sentence set complete</Text>
            <Text style={[styles.completeSubtitle, { color: colors.mutedForeground }]}>
              {currentLevel.title} · {session.length} sentences practiced
            </Text>
            <View style={styles.completeStars}>
              {[0, 1, 2].map(star => (
                <Ionicons
                  key={star}
                  name={star < earnedStars ? 'star' : 'star-outline'}
                  size={25}
                  color={star < earnedStars ? colors.primary : colors.mutedForeground}
                />
              ))}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Choose another sentence level"
              onPress={() => {
                setPhase('levels');
                setLevelIndex(null);
              }}
              activeOpacity={0.82}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Choose another set</Text>
              <Ionicons name="arrow-forward" size={19} color={colors.primaryForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Return to lessons"
              onPress={() => goBackOr('/categories')}
              activeOpacity={0.8}
              style={styles.backToLessons}
            >
              <Text style={[styles.backToLessonsText, { color: colors.primary }]}>Back to lessons</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingBottom: 13 },
  backButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { flex: 1 },
  progressCopy: { flex: 1, gap: 6 },
  progressLabel: { ...typography.micro, fontSize: 10 },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  heartPill: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, borderRadius: 17, paddingHorizontal: 10 },
  heartText: { fontSize: 12, fontWeight: '800' },
  extraMistakes: { fontSize: 9, fontWeight: '800' },
  soundButton: { width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  levelContent: { paddingHorizontal: 20, paddingTop: 4 },
  eyebrow: { ...typography.micro, fontSize: 10, marginBottom: 6 },
  title: { ...typography.largeTitle },
  subtitle: { ...typography.caption, lineHeight: 19, marginTop: 6 },
  levelList: { gap: 10, marginTop: 20 },
  levelCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 1,
  },
  levelNumber: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  levelNumberText: { fontSize: 14, fontWeight: '800' },
  levelCopy: { flex: 1, minWidth: 0, gap: 4 },
  levelTitle: { ...typography.headline },
  levelSubtitle: { fontSize: 10, lineHeight: 14 },
  stars: { flexDirection: 'row', gap: 1 },
  playContent: { paddingHorizontal: 18, paddingTop: 7, paddingBottom: 20 },
  playTitle: { ...typography.title, marginBottom: 15 },
  promptCard: { borderRadius: 18, padding: 15, marginBottom: 16 },
  promptLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.9, marginBottom: 7 },
  promptText: { ...typography.body, fontSize: 18, lineHeight: 25 },
  sectionLabel: { ...typography.micro, fontSize: 10, marginBottom: 7 },
  answerArea: { minHeight: 76, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', padding: 9, justifyContent: 'center', marginBottom: 14 },
  answerPlaceholder: { fontSize: 12, textAlign: 'center', paddingHorizontal: 12 },
  tileWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  wordTile: {
    minHeight: 40,
    maxWidth: '100%',
    borderWidth: 1,
    borderBottomWidth: 3,
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 7,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  answerTile: { minHeight: 36, borderBottomWidth: 1 },
  wordTileText: { ...typography.wordTile, fontSize: 15, lineHeight: 19, textAlign: 'center', flexShrink: 1 },
  feedbackCard: { flexDirection: 'row', gap: 9, borderRadius: 15, padding: 11, marginBottom: 15, alignItems: 'flex-start' },
  feedbackCopy: { flex: 1, gap: 4 },
  feedbackTitle: { ...typography.caption },
  feedbackSentence: { ...typography.caption, lineHeight: 19 },
  bottomAction: { paddingHorizontal: 18, paddingTop: 10 },
  primaryButton: { minHeight: 52, borderRadius: 16, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { ...typography.body },
  completeWrap: { flex: 1, justifyContent: 'center', padding: 22 },
  completeCard: { borderRadius: 24, padding: 22, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
  completeIcon: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  completeTitle: { ...typography.title, textAlign: 'center' },
  completeSubtitle: { fontSize: 13, textAlign: 'center', marginTop: 6 },
  completeStars: { flexDirection: 'row', gap: 8, marginVertical: 18 },
  backToLessons: { minHeight: 42, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  backToLessonsText: { ...typography.caption },
});
