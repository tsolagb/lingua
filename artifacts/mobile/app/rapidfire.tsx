import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CATEGORIES, isCategoryAvailable, LANGUAGE_META } from '@/data/vocabulary';
import { getEarlyArmenianReading } from '@/data/armenian-transliteration';
import { useGame } from '@/context/GameContext';
import { useClassicGameResult } from '@/hooks/useClassicGameResult';
import { useColors } from '@/hooks/useColors';
import { useSound } from '@/hooks/useSound';
import { AutoSpeakToggle } from '@/components/AutoSpeakToggle';
import { goBackOr } from '@/lib/navigation';
import {
  completeGeneralVocabularyStage,
  getGeneralVocabularyReturnPath,
  resolveGeneralVocabularySession,
} from '@/lib/general-vocabulary-session';
import { usePreloadSpeech } from '@/components/SpeakerButton';

const ROUND_SECONDS = 30;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Option button ─────────────────────────────────────────────────────────────
function RFOption({
  label,
  readingHint,
  flash,
  onPress,
  accentColor,
  bgColor,
}: {
  label: string;
  readingHint?: string;
  flash: 'none' | 'correct' | 'wrong';
  onPress: () => void;
  accentColor: string;
  bgColor: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg     = flash === 'correct' ? '#D1FAE5' : flash === 'wrong' ? '#FEE2E2' : bgColor;
  const border = flash === 'correct' ? '#10B981'  : flash === 'wrong' ? '#EF4444'  : accentColor + '66';
  const color  = flash === 'correct' ? '#065F46'  : flash === 'wrong' ? '#991B1B'  : accentColor;

  const handle = () => {
    scale.value = withSequence(withSpring(0.92), withSpring(1));
    onPress();
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity onPress={handle} activeOpacity={0.75}
        style={[rfStyles.option, { backgroundColor: bg, borderColor: border }]}>
        <View style={rfStyles.optionCopy}>
          <Text style={[rfStyles.optionTxt, { color }]}>{label}</Text>
          {!!readingHint && (
            <Text style={[rfStyles.optionReading, { color }]}>{readingHint}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const rfStyles = StyleSheet.create({
  option: {
    paddingVertical: 16, paddingHorizontal: 12, borderRadius: 16, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  optionTxt: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  optionCopy: { alignItems: 'center', gap: 2 },
  optionReading: { fontSize: 13, fontWeight: '700', opacity: 0.74 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function RapidFireScreen() {
  const {
    categoryId,
    levelIndex: liStr,
    generalStage: generalStageParam,
    allWords: allWordsParam,
    randomBatch: randomBatchParam,
    batchIndices,
    stageIndex: stageIndexParam,
    returnTo,
  } = useLocalSearchParams<{
    categoryId?: string; levelIndex?: string; generalStage?: string;
    allWords?: string; randomBatch?: string; batchIndices?: string;
    stageIndex?: string; returnTo?: string;
  }>();
  const levelIndex = parseInt(liStr ?? '0', 10);
  const stageIndex = Number.parseInt(stageIndexParam ?? '', 10);
  const isGeneralStage = generalStageParam === '1';
  const isRandomBatch = allWordsParam === '1' && randomBatchParam === '1';
  const isGeneralSession = isGeneralStage || isRandomBatch;
  const insets     = useSafeAreaInsets();
  const {
    activeLanguage,
    completeLevel,
    getPracticePairs,
    recordWordAnswer,
    isMuted,
    toggleMute,
  } = useGame();
  const { report: reportClassic } = useClassicGameResult('rapidfire');
  const { playCorrect, playWrong, speakCorrectAnswer } = useSound();
  const colors     = useColors();
  const topPad     = Platform.OS === 'web' ? 67 : insets.top;
  const botPad     = Platform.OS === 'web' ? 34 : insets.bottom;

  const category = CATEGORIES.find(c => c.id === categoryId) ??
    (isGeneralSession
      ? ({ name: 'General vocabulary', emoji: '📚', accentColor: colors.primary, bgColor: colors.accent } as any)
      : undefined);
  const [pairs]  = useState(() => isGeneralSession
    ? resolveGeneralVocabularySession({
        generalStage: generalStageParam,
        allWords: allWordsParam,
        randomBatch: randomBatchParam,
        batchIndices,
        levelIndex: liStr,
        stageIndex: stageIndexParam,
      }, activeLanguage)?.pairs ?? []
    : getPracticePairs(categoryId ?? '', levelIndex));
  usePreloadSpeech(pairs.map(pair => pair.translations[activeLanguage]), activeLanguage);
  const reviewWordCount = pairs.filter(pair => pair.isReview).length;
  const langMeta = LANGUAGE_META[activeLanguage];

  // Pool of distractors
  const distractorPool = useMemo(() => {
    if (isGeneralSession) {
      return shuffle([...new Set(pairs.map(pair => pair.translations[activeLanguage]))]);
    }
    const seen = new Set(pairs.map(p => p.translations[activeLanguage]));
    const pool: string[] = [];
    CATEGORIES.forEach(cat => {
      if (!isCategoryAvailable(cat, activeLanguage)) return;
      cat.levels.forEach(lv =>
        lv.pairs.forEach(p => {
          const t = p.translations[activeLanguage];
          if (!seen.has(t)) { pool.push(t); seen.add(t); }
        })
      );
    });
    return shuffle(pool);
  }, [activeLanguage, pairs, isGeneralSession]);

  // Infinite question stream: cycle pairs endlessly
  const allPairs   = useMemo(() => shuffle([...pairs]), [pairs]);
  const qStream    = useRef(0);

  const makeQ = useCallback(() => {
    const pair   = allPairs[qStream.current % allPairs.length];
    qStream.current++;
    const correct   = pair.translations[activeLanguage];
    const distractors = distractorPool
      .filter(d => d !== correct)
      .slice(0, 2);
    const options = shuffle([correct, ...distractors]);
    return { english: pair.english, correct, options };
  }, [allPairs, distractorPool, activeLanguage]);

  const [phase,       setPhase]       = useState<'ready' | 'playing' | 'done'>('ready');
  const [timeLeft,    setTimeLeft]    = useState(ROUND_SECONDS);
  const [score,       setScore]       = useState(0);
  const [missed,      setMissed]      = useState(0);
  const [currentQ,   setCurrentQ]    = useState(() => makeQ());
  const [flash,       setFlash]       = useState<Record<string, 'none' | 'correct' | 'wrong'>>({});

  // Timer progress bar
  const timerProgress = useSharedValue(1);
  const timerStyle    = useAnimatedStyle(() => ({ flex: timerProgress.value }));

  // Timer pulse when < 10s
  const timerScale    = useSharedValue(1);
  const timerScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: timerScale.value }] }));

  useEffect(() => {
    if (phase !== 'playing') return;

    timerProgress.value = withTiming(0, { duration: ROUND_SECONDS * 1000, easing: Easing.linear });

    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          setPhase('done');
          return 0;
        }
        if (t <= 10) {
          timerScale.value = withSequence(
            withTiming(1.15, { duration: 120 }),
            withTiming(1,    { duration: 120 }),
          );
          Haptics.selectionAsync();
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [phase]);

  const handleAnswer = useCallback((opt: string) => {
    if (phase !== 'playing') return;
    const isCorrect = opt === currentQ.correct;
    recordWordAnswer(
      currentQ.english,
      isCorrect,
      isGeneralSession ? undefined : categoryId,
      isGeneralSession ? undefined : levelIndex,
      activeLanguage,
    );

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playCorrect();
      speakCorrectAnswer(currentQ.correct, activeLanguage);
      setScore(s => s + 1);
      setFlash({ [opt]: 'correct' });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      playWrong();
      setMissed(m => m + 1);
      setFlash({ [opt]: 'wrong', [currentQ.correct]: 'correct' });
    }

    setTimeout(() => {
      setFlash({});
      setCurrentQ(makeQ());
    }, isCorrect ? 350 : 700);
  }, [
    phase,
    currentQ,
    makeQ,
    playCorrect,
    playWrong,
    speakCorrectAnswer,
    recordWordAnswer,
    categoryId,
    levelIndex,
    activeLanguage,
    isGeneralSession,
  ]);

  if (!category) return null;

  // ── Ready screen ──
  if (phase === 'ready') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: category.accentColor }]}>
          <TouchableOpacity onPress={() => goBackOr(isGeneralSession
            ? getGeneralVocabularyReturnPath(returnTo, levelIndex) as any
            : `/levels?categoryId=${categoryId}` as any)} style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚡  Rapid Fire</Text>
          <AutoSpeakToggle />
          <TouchableOpacity onPress={toggleMute} style={styles.muteBtn}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        <View style={[styles.centerWrap, { paddingBottom: botPad }]}>
          <Text style={styles.readyEmoji}>⚡</Text>
          <Text style={[styles.readyTitle, { color: category.accentColor }]}>Rapid Fire!</Text>
          <Text style={[styles.readySub, { color: colors.mutedForeground }]}>
            {ROUND_SECONDS} seconds · answer as many as you can!{'\n'}
            {isGeneralStage
              ? `Stage ${stageIndex + 1} · ${pairs.length} selected words in ${langMeta.label}`
              : isRandomBatch
                ? `${pairs.length} random words from every category in ${langMeta.label}`
                : `${category.name} vocabulary in ${langMeta.label}`}
            {reviewWordCount > 0 ? ` · ${reviewWordCount} earlier words are mixed in` : ''}
          </Text>

          <View style={[styles.readyCard, { backgroundColor: category.bgColor, borderColor: category.accentColor + '44' }]}>
            <View style={styles.readyRule}>
              <Ionicons name="flash" size={22} color={category.accentColor} />
              <Text style={[styles.readyRuleTxt, { color: colors.foreground }]}>Tap the correct translation</Text>
            </View>
            <View style={styles.readyRule}>
              <Ionicons name="timer-outline" size={22} color={category.accentColor} />
              <Text style={[styles.readyRuleTxt, { color: colors.foreground }]}>Beat the 30-second clock</Text>
            </View>
            <View style={styles.readyRule}>
              <Ionicons name="star" size={22} color={category.accentColor} />
              <Text style={[styles.readyRuleTxt, { color: colors.foreground }]}>More correct = more stars</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setPhase('playing')}
            style={[styles.startBtn, { backgroundColor: category.accentColor }]}
          >
            <Ionicons name="flash" size={22} color="#fff" />
            <Text style={styles.startBtnTxt}>Start!</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Done screen ──
  if (phase === 'done') {
    const total    = score + missed;
    const pct      = total > 0 ? Math.round((score / total) * 100) : 0;
    const earned   = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: category.accentColor }]}>
          <TouchableOpacity onPress={() => goBackOr(isGeneralSession
            ? getGeneralVocabularyReturnPath(returnTo, levelIndex) as any
            : `/levels?categoryId=${categoryId}` as any)} style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚡  Rapid Fire</Text>
          <AutoSpeakToggle />
          <TouchableOpacity onPress={toggleMute} style={styles.muteBtn}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        <View style={[styles.centerWrap, { paddingBottom: botPad }]}>
          <Text style={styles.readyEmoji}>{pct >= 80 ? '🏆' : pct >= 50 ? '🎉' : '💪'}</Text>
          <Text style={[styles.readyTitle, { color: category.accentColor }]}>Time's up!</Text>

          <View style={[styles.doneScore, { backgroundColor: category.accentColor }]}>
            <Text style={styles.doneScoreNum}>{score}</Text>
            <Text style={styles.doneScoreLbl}>correct answers</Text>
          </View>

          <View style={[styles.readyCard, { backgroundColor: category.bgColor, borderColor: category.accentColor + '44' }]}>
            <View style={styles.readyRule}>
              <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              <Text style={[styles.readyRuleTxt, { color: '#10B981' }]}>{score} correct</Text>
            </View>
            <View style={styles.readyRule}>
              <Ionicons name="close-circle" size={22} color="#EF4444" />
              <Text style={[styles.readyRuleTxt, { color: '#EF4444' }]}>{missed} missed</Text>
            </View>
            <View style={styles.readyRule}>
              <Ionicons name="star" size={22} color={colors.primary} />
              <Text style={[styles.readyRuleTxt, { color: colors.foreground }]}>
                {'⭐'.repeat(earned)} earned
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              if (isGeneralSession) {
                if (isGeneralStage) {
                  void reportClassic(earned, completeGeneralVocabularyStage(
                    completeLevel,
                    levelIndex,
                    stageIndex,
                    earned,
                    activeLanguage,
                    'rapidfire',
                  ));
                } else {
                  reportClassic(earned);
                }
                router.replace(getGeneralVocabularyReturnPath(returnTo, levelIndex) as any);
                return;
              }
              reportClassic(earned, completeLevel(categoryId!, levelIndex, earned, activeLanguage));
              router.replace({
                pathname: '/results',
                params: { categoryId, levelIndex: String(levelIndex), earned: String(earned), language: activeLanguage },
              });
            }}
            style={[styles.startBtn, { backgroundColor: category.accentColor }]}
          >
            <Text style={styles.startBtnTxt}>
              {isGeneralSession ? isGeneralStage ? 'Complete stage' : 'Back to words' : 'See Results'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              qStream.current = 0;
              setPhase('ready');
              setTimeLeft(ROUND_SECONDS);
              setScore(0);
              setMissed(0);
              setFlash({});
              timerProgress.value = 1;
            }}
            style={[styles.replayBtn, { borderColor: category.accentColor }]}
          >
            <Ionicons name="refresh" size={18} color={category.accentColor} />
            <Text style={[styles.replayTxt, { color: category.accentColor }]}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Playing ──
  const timerColor = timeLeft <= 5 ? '#EF4444' : timeLeft <= 10 ? colors.primary : category.accentColor;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: category.accentColor }]}>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>⚡  Rapid Fire  ·  {category.name}</Text>
        </View>
        <AutoSpeakToggle />
        <TouchableOpacity onPress={toggleMute} style={styles.muteBtn}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={20} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Animated.View style={[styles.timerBadge, { backgroundColor: timerColor }, timerScaleStyle]}>
          <Text style={styles.timerNum}>{timeLeft}</Text>
        </Animated.View>
      </View>

      {/* Timer bar */}
      <View style={[styles.timerTrack, { backgroundColor: colors.muted }]}>
        <Animated.View style={[styles.timerFill, { backgroundColor: timerColor }, timerStyle]} />
        <View style={{ flex: 1 - (timeLeft / ROUND_SECONDS) }} />
      </View>

      <View style={styles.playContent}>
        {/* Score */}
        <View style={styles.playScoreRow}>
          <View style={[styles.playScoreBadge, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={[styles.playScoreNum, { color: '#10B981' }]}>{score}</Text>
          </View>
          <View style={[styles.playScoreBadge, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="close-circle" size={18} color="#EF4444" />
            <Text style={[styles.playScoreNum, { color: '#EF4444' }]}>{missed}</Text>
          </View>
        </View>

        {/* Question */}
        <View style={[styles.questionCard, { backgroundColor: category.bgColor, borderColor: category.accentColor + '44' }]}>
          <Text style={[styles.questionLabel, { color: colors.mutedForeground }]}>
            {langMeta.flag} in {langMeta.label}?
          </Text>
          <Text style={[styles.questionWord, { color: category.accentColor }]}>
            {currentQ.english}
          </Text>
        </View>

        {/* 3 options */}
        <View style={styles.options}>
          {currentQ.options.map(opt => (
            <RFOption
              key={opt}
              label={opt}
              readingHint={getEarlyArmenianReading(activeLanguage, levelIndex, opt)}
              flash={flash[opt] ?? 'none'}
              onPress={() => handleAnswer(opt)}
              accentColor={category.accentColor}
              bgColor={category.bgColor}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14, gap: 10,
  },
  backCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  muteBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerMid:   { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  timerBadge: {
    minWidth: 50, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 14, alignItems: 'center',
  },
  timerNum: { fontSize: 20, fontWeight: '800', color: '#fff' },
  timerTrack: { height: 8, flexDirection: 'row' },
  timerFill:  { height: 8 },
  playContent: { flex: 1, padding: 20, gap: 18, justifyContent: 'center' },
  playScoreRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  playScoreBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  playScoreNum: { fontSize: 20, fontWeight: '800' },
  questionCard: {
    borderRadius: 22, padding: 26, alignItems: 'center', gap: 8, borderWidth: 2,
  },
  questionLabel: { fontSize: 14, fontWeight: '700' },
  questionWord:  { fontSize: 38, fontWeight: '800' },
  options: { gap: 12 },
  // Ready / done shared
  centerWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 20,
  },
  readyEmoji: { fontSize: 64 },
  readyTitle: { fontSize: 32, fontWeight: '800' },
  readySub:   { fontSize: 15, fontWeight: '600', color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  readyCard: {
    width: '100%', borderRadius: 20, padding: 20, gap: 14, borderWidth: 2,
  },
  readyRule:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  readyRuleTxt: { fontSize: 15, fontWeight: '600' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 18,
  },
  startBtnTxt: { fontSize: 19, fontWeight: '800', color: '#fff' },
  doneScore: {
    alignItems: 'center', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 40,
  },
  doneScoreNum: { fontSize: 64, fontWeight: '800', color: '#fff' },
  doneScoreLbl: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  replayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14, borderWidth: 2,
  },
  replayTxt: { fontSize: 15, fontWeight: '700' },
});
