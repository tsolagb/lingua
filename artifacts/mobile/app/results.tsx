import React, { useEffect, useMemo, useRef } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from '@/components/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { CATEGORIES, getCumulativePairs, Language } from '@/data/vocabulary';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { Badge } from '@/data/badges';
import { createLessonReviewRoute } from '@/lib/lessonReviewNavigation';
import { SpeakerButton } from '@/components/SpeakerButton';
import { gradeVocabularyTest } from '@/lib/vocabulary-test';
import { MOTION } from '@/constants/motion';

// ── Per-language food config ──────────────────────────────────────────────────
const FOOD: Record<Language, { emoji: string; singular: string; plural: string; color: string }> = {
  italian: { emoji: '🍨', singular: 'Gelato XP',     plural: 'Gelato XP',     color: '#1F6FEB' },
  french:  { emoji: '🥐', singular: 'Croissant XP', plural: 'Croissant XP', color: '#185AC7' },
  spanish: { emoji: '🌮', singular: 'Taco XP',      plural: 'Taco XP',      color: '#DC2626' },
  armenian: { emoji: '🍑', singular: 'Apricot XP', plural: 'Apricot XP', color: '#1F6FEB' },
};

// ── Animated star ─────────────────────────────────────────────────────────────
function AnimatedStar({ filled, delay, size = 56 }: { filled: boolean; delay: number; size?: number }) {
  const reduced = useReduceMotion();
  const scale  = useSharedValue(0);
  const rotate = useSharedValue(-0.4);
  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      rotate.value = 0;
      return;
    }
    scale.value = withDelay(delay, withSpring(1, { damping: 7, stiffness: 180 }));
    if (filled) rotate.value = withDelay(delay, withSpring(0, { damping: 8, stiffness: 120 }));
  }, [delay, filled, reduced, rotate, scale]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}rad` }],
  }));
  return (
    <Animated.View style={style}>
      <Ionicons
        name={filled ? 'star' : 'star-outline'}
        size={size}
        color={filled ? '#1F6FEB' : 'rgba(255,255,255,0.4)'}
      />
    </Animated.View>
  );
}

// ── Food reward banner ────────────────────────────────────────────────────────
function FoodReward({ earned, language, total }: { earned: number; language: Language; total: number }) {
  const reduced = useReduceMotion();
  const food    = FOOD[language];
  const scale   = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      scale.value = 1;
      return;
    }
    opacity.value = withDelay(160, withTiming(1, { duration: MOTION.transitionMs }));
    scale.value   = withDelay(160, withSpring(1, { damping: 16, stiffness: 240 }));
  }, [opacity, reduced, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (earned === 0) return null;

  return (
    <Animated.View style={[styles.rewardBanner, { borderColor: food.color + '44' }, style]}>
      <Text style={styles.rewardEmoji}>{food.emoji}</Text>
      <View style={styles.rewardText}>
        <Text style={[styles.rewardEarned, { color: food.color }]}>
          +{earned} {earned === 1 ? food.singular : food.plural}
        </Text>
        <Text style={styles.rewardTotal}>
          You now have {total} {food.emoji}
        </Text>
      </View>
    </Animated.View>
  );
}

function BadgeCelebration({ badges, onDismiss }: { badges: Badge[]; onDismiss: () => void }) {
  const reduced = useReduceMotion();
  const badge = badges[0]; // show one at a time; dismiss cycles through
  const scale   = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const rotate  = useSharedValue(-0.15);
  const glow    = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: reduced ? 0 : MOTION.transitionMs });
    scale.value   = reduced ? 1 : withSpring(1, { damping: 16, stiffness: 240 });
    rotate.value  = reduced ? 0 : withSpring(0, { damping: 16, stiffness: 240 });
    glow.value = reduced ? 1 : withSequence(
      withTiming(1.08, { duration: 180 }),
      withSpring(1, { damping: 18, stiffness: 240 }),
    );
  }, [badge.id, glow, opacity, reduced, rotate, scale]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * glow.value }, { rotate: `${rotate.value}rad` }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Modal transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[cel.overlay, containerStyle]}>
        <View style={cel.card}>
          {/* Burst rays */}
          <View style={cel.burst}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={i}
                style={[
                  cel.ray,
                  { transform: [{ rotate: `${i * 45}deg` }] },
                ]}
              />
            ))}
          </View>

          <Text style={cel.newBadge}>✨ New Badge Unlocked!</Text>

          <Animated.Text style={[cel.badgeEmoji, emojiStyle]}>
            {badge.emoji}
          </Animated.Text>

          <Text style={cel.badgeTitle}>{badge.title}</Text>
          <Text style={cel.badgeDesc}>{badge.description}</Text>

          <TouchableOpacity onPress={onDismiss} style={cel.btn} activeOpacity={0.85}>
            <Text style={cel.btnTxt}>
              {badges.length > 1 ? `Awesome! (${badges.length - 1} more…)` : 'Awesome! 🎉'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}
export default function ResultsScreen() {
  const {
    categoryId,
    levelIndex: liStr,
    stars: starsStr,
    mistakes: mistakesStr,
    earned: earnedStr,
    language: languageParam,
    autoAdvance: autoAdvanceParam,
  } = useLocalSearchParams<{
    categoryId: string;
    levelIndex: string;
    stars: string;
    mistakes: string;
    earned: string;
    language: string;
    autoAdvance: string;
  }>();

  const levelIndex = parseInt(liStr    ?? '0', 10);
  const stars      = parseInt(starsStr ?? '1', 10);
  const mistakes   = parseInt(mistakesStr ?? '0', 10);
  const earned     = parseInt(earnedStr   ?? '0', 10);
  const language   = (languageParam ?? 'italian') as Language;

  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { currency, newlyUnlockedBadges, clearNewBadges, getVocabularyTestBestScore } = useGame();
  const { speak } = useSound();

  const [pendingBadges, setPendingBadges] = React.useState<Badge[]>([]);
  const [autoAdvanceCancelled, setAutoAdvanceCancelled] = React.useState(false);
  const [countdown, setCountdown] = React.useState(5);
  const seenRef = useRef(false);

  useEffect(() => {
    if (!seenRef.current && newlyUnlockedBadges.length > 0) {
      seenRef.current = true;
      setPendingBadges(newlyUnlockedBadges);
    }
  }, [newlyUnlockedBadges]);

  const handleDismissBadge = () => {
    setAutoAdvanceCancelled(true);
    setPendingBadges(prev => {
      const next = prev.slice(1);
      if (next.length === 0) clearNewBadges();
      return next;
    });
  };

  const category      = CATEGORIES.find(c => c.id === categoryId);
  const pairs         = useMemo(() => getCumulativePairs(category, levelIndex), [category, levelIndex]);
  const vocabularyTestBest = categoryId
    ? getVocabularyTestBestScore(categoryId, levelIndex, language)
    : null;
  const canTakeVocabularyTest = Boolean(category && categoryId && category.levels[levelIndex] && pairs.length > 0);
  const nextLevelIndex = levelIndex + 1;
  const hasNextLevel   = nextLevelIndex < (category?.levels.length ?? 0);
  const shouldAutoAdvance =
    autoAdvanceParam === '1' &&
    hasNextLevel &&
    !canTakeVocabularyTest &&
    pendingBadges.length === 0 &&
    !autoAdvanceCancelled;

  useEffect(() => {
    if (!shouldAutoAdvance) return;

    setCountdown(5);
    const deadline = Date.now() + 5000;
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) {
        router.push(`/game?categoryId=${categoryId}&levelIndex=${nextLevelIndex}`);
        return;
      }
      timeout = setTimeout(tick, 200);
    };

    timeout = setTimeout(tick, 0);
    return () => clearTimeout(timeout);
  }, [shouldAutoAdvance, categoryId, nextLevelIndex]);

  const cancelAutoAdvance = () => setAutoAdvanceCancelled(true);
  const handleBack = () => {
    cancelAutoAdvance();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(categoryId ? `/levels?categoryId=${categoryId}` : '/categories');
    }
  };

  const gradients: Record<number, [string, string]> = {
    3: ['#2F6BEA', '#1F57D6'],
    2: ['#22C55E', '#16A34A'],
    1: ['#4C8DFF', '#1F6FEB'],
  };

  const titles: Record<number, string> = {
    3: language === 'italian' ? 'Perfetto!' : language === 'french' ? 'Parfait!' : language === 'spanish' ? '¡Perfecto!' : 'Հիանալի՛ է։',
    2: language === 'italian' ? 'Bravissimo!' : language === 'french' ? 'Bravo!' : language === 'spanish' ? '¡Muy bien!' : 'Շատ լաւ է։',
    1: 'Level Done!',
  };

  const subtitles: Record<number, string> = {
    3: 'A perfect score — zero mistakes!',
    2: mistakes <= 2 ? `Just ${mistakes} ${mistakes === 1 ? 'mistake' : 'mistakes'}!` : 'Well done!',
    1: 'Keep practicing — you got this!',
  };

  const grad = gradients[stars] ?? gradients[1];

  return (
    <>
    <LinearGradient
      colors={grad}
      onTouchStart={cancelAutoAdvance}
      style={[styles.container, { paddingTop: topPad }]}
    >
      <TouchableOpacity
        onPress={handleBack}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        testID="results-back"
        style={[styles.backButton, { top: topPad + 8 }]}
      >
        <Ionicons name="arrow-back" size={22} color="white" />
      </TouchableOpacity>

      {/* Stars area */}
      <View style={styles.starsArea}>
        <View style={styles.starRow}>
          <AnimatedStar filled={stars >= 1} delay={150} />
          <AnimatedStar filled={stars >= 2} delay={350} size={68} />
          <AnimatedStar filled={stars >= 3} delay={550} />
        </View>
      </View>

      {/* Result card */}
      <ScrollView
        style={[styles.card, { borderTopLeftRadius: 32, borderTopRightRadius: 32 }]}
        contentContainerStyle={[styles.cardContent, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          {titles[stars] ?? 'Level Done!'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {subtitles[stars] ?? ''}
        </Text>

        {canTakeVocabularyTest && (
          <TouchableOpacity
            onPress={() => {
              cancelAutoAdvance();
              router.push(
                `/vocabulary-test?categoryId=${encodeURIComponent(categoryId!)}&levelIndex=${levelIndex}&language=${language}&returnTo=results` as any,
              );
            }}
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityLabel={vocabularyTestBest
              ? `Improve your vocabulary test. Best grade ${gradeVocabularyTest(vocabularyTestBest.score, vocabularyTestBest.total)}`
              : 'Take the optional vocabulary test for this level'}
            testID="vocabulary-test-cta"
            style={[
              styles.vocabularyTestButton,
              { backgroundColor: colors.card, borderColor: category?.accentColor ?? colors.primary },
            ]}
          >
            <View style={[styles.vocabularyTestIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="create-outline" size={22} color={category?.accentColor ?? colors.primary} />
            </View>
            <View style={styles.vocabularyTestCopy}>
              <Text style={[styles.vocabularyTestTitle, { color: colors.foreground }]}>
                {vocabularyTestBest ? 'Improve your word-test grade' : 'Optional word test'}
              </Text>
              <Text style={[styles.vocabularyTestSubtitle, { color: colors.mutedForeground }]}>
                {vocabularyTestBest
                  ? `Best: ${gradeVocabularyTest(vocabularyTestBest.score, vocabularyTestBest.total)} · ${vocabularyTestBest.score}/${vocabularyTestBest.total} points`
                  : `Type all ${pairs.length} words · small typos earn half credit`}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={19} color={category?.accentColor ?? colors.primary} />
          </TouchableOpacity>
        )}

        {hasNextLevel && (
          <TouchableOpacity
            onPress={() => router.push(`/game?categoryId=${categoryId}&levelIndex=${nextLevelIndex}`)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={shouldAutoAdvance ? `Next Level in ${countdown} seconds` : 'Next Level'}
            testID="next-level"
            style={[
              styles.primaryBtn,
              {
                backgroundColor: category?.accentColor ?? colors.primary,
                borderRadius: 18,
                marginBottom: 16,
              },
            ]}
          >
            <Text style={styles.primaryBtnTxt}>
              {shouldAutoAdvance ? `Next Level in ${countdown}s` : 'Next Level'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        )}

        {category && categoryId && pairs.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              cancelAutoAdvance();
              router.push(createLessonReviewRoute({
                categoryId,
                levelIndex,
                stars,
                mistakes,
                earned,
                language,
              }) as any);
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Review this lesson with flashcards"
            testID="review-this-lesson"
            style={[styles.lessonReviewButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="albums-outline" size={22} color={colors.primaryForeground} />
            <View style={styles.lessonReviewText}>
              <Text style={[styles.lessonReviewTitle, { color: colors.primaryForeground }]}>
                Review this lesson
              </Text>
              <Text style={[styles.lessonReviewSubtitle, { color: colors.primaryForeground }]}>
                Recall each word before flipping the card
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={19} color={colors.primaryForeground} />
          </TouchableOpacity>
        )}

        {autoAdvanceParam === '1' && hasNextLevel && !canTakeVocabularyTest && (
          <View style={[styles.advanceNotice, { backgroundColor: colors.muted }]}>
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.advanceNoticeText, { color: colors.mutedForeground }]}
            >
              {shouldAutoAdvance
                ? `Next level starts in ${countdown} seconds`
                : autoAdvanceCancelled
                  ? 'Auto-advance stopped. Continue when you’re ready.'
                  : 'Celebrate your badge, then choose when to continue.'}
            </Text>
            <TouchableOpacity
              onPress={cancelAutoAdvance}
              activeOpacity={0.7}
              accessibilityRole="button"
              testID="stay-on-results"
              style={styles.stayButton}
            >
              <Text style={[styles.stayButtonText, { color: category?.accentColor ?? colors.primary }]}>
                Stay on results
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Food reward */}
        <FoodReward earned={earned} language={language} total={currency[language]} />

        {/* Stats */}
        <View style={[styles.stats, { backgroundColor: colors.muted, borderRadius: 18 }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: category?.accentColor ?? colors.primary }]}>
              {stars}
            </Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Stars</Text>
          </View>
          <View style={[styles.statSep, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, {
              color: mistakes === 0 ? colors.success : mistakes <= 2 ? colors.primary : colors.destructive,
            }]}>
              {mistakes}
            </Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Mistakes</Text>
          </View>
          <View style={[styles.statSep, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: colors.secondary }]}>
              {pairs.length}
            </Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Words</Text>
          </View>
        </View>

        {/* Tap-to-hear vocabulary review */}
        <View style={styles.reviewSection}>
          <Text style={[styles.reviewTitle, { color: colors.foreground }]}>Tap a word to hear it</Text>
          <View style={styles.reviewList}>
            {pairs.map(pair => {
              const translation = pair.translations[language];
              return (
                <View key={pair.english} style={[styles.wordPair, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <View style={styles.wordText}>
                    <Text style={[styles.foreignWord, { color: category?.accentColor ?? colors.primary }]}>
                      {translation}
                    </Text>
                    <Text style={[styles.englishWord, { color: colors.mutedForeground }]}>
                      {pair.english}
                    </Text>
                  </View>
                  <SpeakerButton text={translation} language={language} accessibilityLabel={`Hear ${translation}, meaning ${pair.english}`} testID={`result-word-${pair.english}`} compact />
                </View>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => router.push(`/game?categoryId=${categoryId}&levelIndex=${levelIndex}`)}
            activeOpacity={0.85}
            style={[styles.secondaryBtn, { borderColor: colors.border, borderRadius: 18 }]}
          >
            <Ionicons name="refresh" size={18} color={colors.foreground} />
            <Text style={[styles.secondaryBtnTxt, { color: colors.foreground }]}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/categories')}
            activeOpacity={0.7}
            style={styles.ghostBtn}
          >
            <Text style={[styles.ghostBtnTxt, { color: colors.mutedForeground }]}>
              All Categories
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
    {pendingBadges.length > 0 && (
      <BadgeCelebration badges={pendingBadges} onDismiss={handleDismissBadge} />
    )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    position: 'absolute',
    left: 18,
    zIndex: 2,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  starsArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  starRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: 'white',
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  lessonReviewButton: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 16,
  },
  lessonReviewText: { flex: 1 },
  lessonReviewTitle: { fontSize: 16, fontWeight: '800' },
  lessonReviewSubtitle: { fontSize: 12, fontWeight: '600', marginTop: 3, opacity: 0.88 },
  vocabularyTestButton: {
    minHeight: 76,
    borderRadius: 19,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    shadowColor: '#172A5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  vocabularyTestIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocabularyTestCopy: { flex: 1, gap: 3 },
  vocabularyTestTitle: { fontSize: 14, fontWeight: '800' },
  vocabularyTestSubtitle: { fontSize: 12, lineHeight: 16 },
  advanceNotice: {
    alignItems: 'center',
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  advanceNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  stayButton: {
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 2,
  },
  stayButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },

  // ── Food reward ──
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  rewardEmoji: { fontSize: 36 },
  rewardText:  { flex: 1 },
  rewardEarned: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  rewardTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  // ── Stats ──
  stats: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal:  { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  statLbl:  { fontSize: 12, fontWeight: '600', marginTop: 2 },
  statSep:  { width: 1 },

  // ── Vocabulary review ──
  reviewSection: { marginBottom: 24 },
  reviewTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  reviewList: { gap: 8 },
  wordPair: {
    minHeight: 54,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordText: { flex: 1 },
  foreignWord: { fontSize: 17, fontWeight: '800' },
  englishWord: { fontSize: 13, fontWeight: '600', marginTop: 1 },

  // ── Actions ──
  actions: { gap: 11 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8,
  },
  primaryBtnTxt: { color: 'white', fontSize: 18, fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderWidth: 2, gap: 8,
  },
  secondaryBtnTxt: { fontSize: 16, fontWeight: '700' },
  ghostBtn: { alignItems: 'center', paddingVertical: 8 },
  ghostBtnTxt: { fontSize: 15, fontWeight: '600' },
});

const cel = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#1F6FEB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  burst: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 1,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: {
    position: 'absolute',
    width: 2,
    height: 160,
    backgroundColor: '#DBEAFE',
    borderRadius: 1,
    top: -80,
  },
  newBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F6FEB',
    letterSpacing: 0.5,
  },
  badgeEmoji: {
    fontSize: 72,
    marginVertical: 8,
  },
  badgeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    marginTop: 10,
    backgroundColor: '#1F6FEB',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  btnTxt: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
