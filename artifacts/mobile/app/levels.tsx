import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from '@/components/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CATEGORIES, getCumulativePairs, isCategoryAvailable } from '@/data/vocabulary';
import { getEarlyArmenianReading } from '@/data/armenian-transliteration';
import { useGame } from '@/context/GameContext';
import { trackEvent } from '@/lib/analytics';
import { useSound } from '@/hooks/useSound';
import { goBackOr } from '@/lib/navigation';
import { getLevelRecallProgressPercent } from '@/lib/level-progress';
import {
  countPracticeTypes,
  gradePracticeScores,
  summarizeCategoryPracticeScores,
} from '@/lib/practice-grading';
import { gradeVocabularyTest } from '@/lib/vocabulary-test';
import { EVERYDAY_DIALOGUE_TOPICS } from '@/data/thematic-vocabulary';
import { SpeakerButton } from '@/components/SpeakerButton';

const LEVEL_NAMES = ['Beginner', 'Elementary', 'Intermediate', 'Upper-Inter.', 'Advanced', 'Expert'];
const LEVEL_DESCS = [
  'Perfect place to start',
  'Build your confidence',
  'Step it up a notch',
  'Getting more advanced',
  'Master the vocabulary',
  'Achieve true fluency',
];

export default function LevelsScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    isLevelUnlocked,
    getLevelStars,
    getLevelPracticeScores,
    getVocabularyTestBestScore,
    activeLanguage,
    wordReviews,
  } = useGame();
  const { speak } = useSound();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const category = CATEGORIES.find(c => c.id === categoryId);
  if (!category || !isCategoryAvailable(category, activeLanguage)) return null;
  const categoryGradeSummary = summarizeCategoryPracticeScores(
    category.levels.map((_, index) => getLevelPracticeScores(category.id, index, activeLanguage)),
  );
  const matchingDialogueTopic = EVERYDAY_DIALOGUE_TOPICS.find(topic =>
    topic.categoryIds.includes(category.id),
  );
  const categoryWordCount = new Set(
    category.levels.flatMap(level => level.pairs)
      .map(pair => pair.english.trim().toLocaleLowerCase()),
  ).size;
  const completedLevelCount = category.levels.filter((_, index) => getLevelStars(category.id, index) > 0).length;
  const categoryProgress = category.levels.length
    ? Math.round((completedLevelCount / category.levels.length) * 100)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.groupedBackground }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => goBackOr('/categories')}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.iconCircle, { backgroundColor: category.bgColor }]}>
            <MaterialCommunityIcons
              name={category.icon as any}
              size={26}
              color={category.accentColor}
            />
          </View>
          <Text numberOfLines={2} style={[styles.headerTitle, { color: colors.foreground }]}>
            {category.name}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.categoryProgressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.categoryProgressHeading}>
          <Text style={[styles.categoryProgressLabel, { color: colors.mutedForeground }]}>CATEGORY PROGRESS</Text>
          <Text style={[styles.categoryProgressValue, { color: colors.primary }]}>{completedLevelCount}/{category.levels.length} levels · {categoryProgress}%</Text>
        </View>
        <View style={[styles.categoryProgressTrack, { backgroundColor: colors.muted }]}>
          <View style={[styles.categoryProgressFill, { backgroundColor: colors.primary, width: `${categoryProgress}%` }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          testID="category-overall-grade"
          accessibilityRole="summary"
          accessibilityLabel={`${category.name} ${categoryGradeSummary.complete ? 'overall' : 'current'} grade ${categoryGradeSummary.grade ?? 'not yet available'}. ${categoryGradeSummary.gradedLevels} of ${categoryGradeSummary.totalLevels} levels are graded.`}
          style={[styles.overallGradeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.overallGradeCopy}>
            <Text style={[styles.overallGradeTitle, { color: colors.foreground }]}>
              {categoryGradeSummary.complete ? 'Overall category grade' : 'Current category grade'}
            </Text>
            <Text style={[styles.overallGradeSubtitle, { color: colors.mutedForeground }]}>
              {categoryGradeSummary.average === null
                ? 'Complete 3 different practice types in a level to begin.'
                : `${categoryGradeSummary.gradedLevels}/${categoryGradeSummary.totalLevels} levels graded · ${categoryGradeSummary.average}% average${categoryGradeSummary.complete ? '' : ' so far'}`}
            </Text>
          </View>
          <View style={[styles.overallGradeBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.overallGradeValue, { color: colors.primaryForeground }]}>
              {categoryGradeSummary.grade ?? '—'}
            </Text>
          </View>
        </View>

        {category.translationReviewNotice && (
          <View
            style={[
              styles.translationReviewNotice,
              { backgroundColor: colors.accent, borderColor: colors.border },
            ]}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.translationReviewText, { color: colors.mutedForeground }]}>
              {category.translationReviewNotice}
            </Text>
          </View>
        )}

        {matchingDialogueTopic && (
          <TouchableOpacity
            onPress={() => router.push(`/phrases?topic=${matchingDialogueTopic.id}` as any)}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={`Practice a short conversation: ${matchingDialogueTopic.title}. Always open, regardless of level.`}
            testID={`level-conversation-${matchingDialogueTopic.id}`}
            style={[
              styles.conversationPracticeButton,
              { backgroundColor: colors.accent, borderColor: category.accentColor },
            ]}
          >
            <View style={[styles.verbActivityIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="chatbubbles-outline" size={21} color={category.accentColor} />
            </View>
            <View style={styles.verbActivityCopy}>
              <Text style={[styles.verbActivityTitle, { color: colors.foreground }]}>
                Practice a conversation
              </Text>
              <Text style={[styles.verbActivitySub, { color: colors.mutedForeground }]}>
                {matchingDialogueTopic.title} · always open
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={category.accentColor} />
          </TouchableOpacity>
        )}

        {category.id === 'time' && (
          <TouchableOpacity
            onPress={() => router.push('/time-practice' as any)}
            activeOpacity={0.84}
            accessibilityRole="button"
            accessibilityLabel="Tell the time in your selected language"
            testID="calendar-tell-time-entry"
            style={[
              styles.verbActivity,
              { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <View style={[styles.verbActivityIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Ionicons name="time-outline" size={21} color={colors.primaryForeground} />
            </View>
            <View style={styles.verbActivityCopy}>
              <Text style={[styles.verbActivityTitle, { color: colors.primaryForeground }]}>
                Tell the time
              </Text>
              <Text style={[styles.verbActivitySub, { color: colors.primaryForeground, opacity: 0.86 }]}>
                Read a clock and choose the natural expression
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.primaryForeground} />
          </TouchableOpacity>
        )}

        {category.id === 'verbs' && (
          <View style={styles.verbPracticeGroup}>
            <Text style={[styles.verbPracticeKicker, { color: colors.primary }]}>START HERE · VERBS</Text>
            <TouchableOpacity
              onPress={() => router.push('/verb-sentence-builder')}
              activeOpacity={0.84}
              accessibilityRole="button"
              accessibilityLabel="Build a sentence with verbs"
              style={[styles.verbActivity, { backgroundColor: colors.primary }]}
            >
              <View style={[styles.verbActivityIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Ionicons name="reorder-four-outline" size={21} color={colors.primaryForeground} />
              </View>
              <View style={styles.verbActivityCopy}>
                <Text style={[styles.verbActivityTitle, { color: colors.primaryForeground }]}>Build a sentence</Text>
                <Text style={[styles.verbActivitySub, { color: colors.primaryForeground, opacity: 0.86 }]}>
                  Put the words in the right order
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={colors.primaryForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/verb-fill-in')}
              activeOpacity={0.84}
              accessibilityRole="button"
              accessibilityLabel="Fill in the correct verb tense"
              style={[styles.verbActivity, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            >
              <View style={[styles.verbActivityIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="create-outline" size={21} color={colors.primary} />
              </View>
              <View style={styles.verbActivityCopy}>
                <Text style={[styles.verbActivityTitle, { color: colors.foreground }]}>Fill in the verb</Text>
                <Text style={[styles.verbActivitySub, { color: colors.mutedForeground }]}>
                  Choose the tense that fits the sentence
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/verb-guide')}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Open regular and irregular verb guide"
              style={[
                styles.verbGuideButton,
                { backgroundColor: colors.accent, borderColor: colors.primary + '35' },
              ]}
            >
              <View style={[styles.verbGuideIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="book-outline" size={19} color={colors.primaryForeground} />
              </View>
              <View style={styles.verbGuideCopy}>
                <Text style={[styles.verbGuideTitle, { color: colors.foreground }]}>Verb conjugation guide</Text>
                <Text style={[styles.verbGuideSub, { color: colors.mutedForeground }]}>
                  Essential regular and irregular verbs
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.levelHeading}>
          <View>
            <Text style={[styles.levelsTitle, { color: colors.foreground }]}>Choose a level</Text>
            <Text style={[styles.levelsSubtitle, { color: colors.mutedForeground }]}>
              {category.levels.filter((_, index) => getLevelStars(category.id, index) > 0).length} of {category.levels.length} complete · {categoryWordCount} useful words
            </Text>
          </View>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>YOUR PROGRESS</Text>
        </View>

        {category.levels.map((level, idx) => {
          const unlocked = isLevelUnlocked(category.id, idx);
          const stars = getLevelStars(category.id, idx);
          const completed = stars > 0;
          const practiceScores = getLevelPracticeScores(category.id, idx, activeLanguage);
          const practiceGrade = gradePracticeScores(practiceScores);
          const practiceTypeCount = countPracticeTypes(practiceScores);
          const vocabularyTestBest = getVocabularyTestBestScore(category.id, idx, activeLanguage);
          const current = unlocked && !completed;
          const previewPair = level.pairs[0];
          const previewWord = previewPair?.translations[activeLanguage];
          const previewReading = previewWord
            ? getEarlyArmenianReading(activeLanguage, idx, previewWord)
            : undefined;
          const pairsForProgress = getCumulativePairs(category, idx);
          const cumulativePairCount = pairsForProgress.length;
          const levelDescription = LEVEL_DESCS[idx] ?? 'Grow your vocabulary';
          const levelName = LEVEL_NAMES[idx] ?? `Level ${idx + 1}`;
          const pairCountDescription = category.practicePolicy !== 'cumulative'
            ? `${level.pairs.length} new words`
            : `${cumulativePairCount} pairs`;
          const progressPercent = completed
            ? 100
            : getLevelRecallProgressPercent(pairsForProgress, activeLanguage, wordReviews);

          return (
            <View
              key={idx}
              style={[
                styles.levelCard,
                {
                  backgroundColor: current ? colors.accent : unlocked ? colors.card : colors.muted,
                  borderColor: current ? colors.primary : colors.border,
                  borderRadius: 20,
                  opacity: unlocked ? 1 : 0.7,
                  borderWidth: current ? 1.5 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              {/* Top row: badge + info + lock */}
              <View style={styles.levelTop}>
                {/* Badge */}
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: completed
                        ? colors.primary
                        : unlocked
                          ? current ? colors.card : category.bgColor
                          : colors.muted,
                      borderColor: colors.primary,
                      borderWidth: current ? 2 : 0,
                    },
                  ]}
                >
                  {completed
                    ? <Ionicons name="checkmark" size={19} color={colors.primaryForeground} />
                    : unlocked
                      ? <Text style={[styles.badgeNum, { color: category.accentColor }]}>{idx + 1}</Text>
                    : <Ionicons name="lock-closed" size={18} color={colors.mutedForeground} />}
                </View>

                {/* Info */}
                <View style={styles.info}>
                  <Text style={[styles.levelName, { color: colors.foreground }]}>
                    {levelName}
                  </Text>
                  <Text style={[styles.levelDesc, { color: colors.mutedForeground }]}>
                    {levelDescription} · {pairCountDescription}
                  </Text>
                  <View style={styles.progressHeading}>
                    <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>PROGRESS</Text>
                    <Text style={[styles.progressValue, { color: category.accentColor }]}>{progressPercent}%</Text>
                  </View>
                  <View
                    accessibilityRole="progressbar"
                    accessibilityLabel={`${levelName} progress`}
                    accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
                    testID={`level-progress-${idx}`}
                    style={[styles.progressTrack, { backgroundColor: colors.muted }]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressPercent}%`, backgroundColor: category.accentColor },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.levelStats}>
                  {practiceGrade ? (
                    <View
                      style={[styles.practiceGradeBadge, { backgroundColor: colors.primary }]}
                      accessibilityRole="text"
                      accessibilityLabel={`${levelName} practice grade ${practiceGrade}, based on at least three different game types`}
                      testID={`level-practice-grade-${idx}`}
                    >
                      <Text style={[styles.practiceGradeText, { color: colors.primaryForeground }]}>
                        {practiceGrade}
                      </Text>
                    </View>
                  ) : practiceTypeCount > 0 ? (
                    <Text
                      style={[styles.practiceGradeProgress, { color: colors.mutedForeground }]}
                      accessibilityLabel={`${practiceTypeCount} of 3 different game types completed for a practice grade`}
                    >
                      {practiceTypeCount}/3
                    </Text>
                  ) : null}
                  <View style={styles.starsRow}>
                    {[0, 1, 2].map(i => (
                      <Ionicons key={i}
                        name={i < stars ? 'star' : 'star-outline'}
                        size={14}
                        color={i < stars ? category.accentColor : colors.border}
                      />
                    ))}
                  </View>
                </View>
              </View>

              {previewPair && previewWord && (
                <View style={[styles.previewBtn, { backgroundColor: category.bgColor }]}>
                  <SpeakerButton text={previewWord} language={activeLanguage} accessibilityLabel={`Hear ${previewWord}, meaning ${previewPair.english}`} testID={`level-preview-${idx}`} compact />
                  <View style={styles.previewWords}>
                    <View style={styles.previewMainLine}>
                      <Text style={[styles.previewForeign, { color: category.accentColor }]}>{previewWord}</Text>
                      <Text style={[styles.previewEnglish, { color: colors.mutedForeground }]}>
                        · {previewPair.english}
                      </Text>
                    </View>
                    {previewReading && (
                      <Text style={[styles.previewReading, { color: category.accentColor }]}>
                        Latin reading: {previewReading}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {category.id === 'church' && idx === 5 && (
                <>
                  <TouchableOpacity
                    onPress={() => router.push('/theology-guide' as any)}
                    activeOpacity={0.82}
                    accessibilityRole="button"
                    accessibilityLabel="Explore advanced theology words"
                    testID="theology-word-guide"
                    style={[
                      styles.theologyGuideButton,
                      { backgroundColor: category.bgColor, borderColor: category.accentColor },
                    ]}
                  >
                    <View style={[styles.theologyGuideIcon, { backgroundColor: category.accentColor }]}>
                      <Ionicons name="book-outline" size={19} color="#fff" />
                    </View>
                    <View style={styles.theologyGuideCopy}>
                      <Text style={[styles.theologyGuideTitle, { color: category.accentColor }]}>
                        Explore advanced words
                      </Text>
                      <Text style={[styles.theologyGuideSub, { color: colors.mutedForeground }]}>
                        Simple explanations and examples
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={19} color={category.accentColor} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/theology-practice' as any)}
                    activeOpacity={0.82}
                    accessibilityRole="button"
                    accessibilityLabel="Practice advanced theology words"
                    testID="theology-word-practice"
                    style={[
                      styles.theologyGuideButton,
                      { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <View style={[styles.theologyGuideIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                      <Ionicons name="help-circle-outline" size={19} color={colors.primaryForeground} />
                    </View>
                    <View style={styles.theologyGuideCopy}>
                      <Text style={[styles.theologyGuideTitle, { color: colors.primaryForeground }]}>
                        Practice advanced words
                      </Text>
                      <Text style={[styles.theologyGuideSub, { color: colors.primaryForeground, opacity: 0.86 }]}>
                        Choose the word that fits each situation
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={19} color={colors.primaryForeground} />
                  </TouchableOpacity>
                </>
              )}

              {/* Game mode buttons */}
              <View style={styles.modeGrid}>
                {/* Match — gated by progression */}
                {unlocked && (
                  <TouchableOpacity
                    onPress={() => {
                      trackEvent('game_started', {
                        category: category.id,
                        game: 'match',
                        level: idx + 1,
                      });
                      router.push(`/game?categoryId=${category.id}&levelIndex=${idx}` as any);
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.modeBtn,
                      current && styles.startAction,
                      {
                        backgroundColor: current ? colors.primary : category.accentColor,
                        borderColor: current ? colors.primary : category.accentColor,
                      },
                    ]}
                  >
                    <View style={styles.modeBtnContent}>
                      {current && <Ionicons name="play" size={14} color={colors.primaryForeground} />}
                      <Text style={[styles.modeBtnTxt, { color: current ? colors.primaryForeground : '#fff' }]}>
                        {current ? 'Start' : 'Match'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Extras — always available */}
                {[
                  { label: 'Quiz',         icon: 'help-circle-outline', game: 'quiz',          route: `/quiz?categoryId=${category.id}&levelIndex=${idx}` },
                  { label: 'Spell',        icon: 'create-outline',      game: 'spelling',      route: `/spelling?categoryId=${category.id}&levelIndex=${idx}` },
                  { label: 'Cards',        icon: 'albums-outline',       game: 'flashcards',    route: `/flashcards?categoryId=${category.id}&levelIndex=${idx}` },
                  { label: 'True / False', icon: 'checkmark-circle-outline', game: 'true_or_false', route: `/trueorfalse?categoryId=${category.id}&levelIndex=${idx}` },
                  { label: 'Rapid',        icon: 'flash-outline',        game: 'rapid_fire',    route: `/rapidfire?categoryId=${category.id}&levelIndex=${idx}` },
                  { label: 'Crossword',    icon: 'grid-outline',         game: 'crossword',     route: `/crossword?categoryId=${category.id}&levelIndex=${idx}` },
                ].map(({ label, icon, game, route }) => (
                  <TouchableOpacity
                    key={label}
                    onPress={() => {
                      trackEvent('game_started', {
                        category: category.id,
                        game,
                        level: idx + 1,
                      });
                      router.push(route as any);
                    }}
                    activeOpacity={0.8}
                    style={[styles.modeBtn, { backgroundColor: category.bgColor, borderColor: category.accentColor }]}
                  >
                    <View style={styles.modeBtnContent}>
                      <Ionicons name={icon as any} size={14} color={category.accentColor} />
                      <Text style={[styles.modeBtnTxt, { color: category.accentColor }]}>{label}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {completed && (
                  <TouchableOpacity
                    onPress={() => router.push(
                      `/vocabulary-test?categoryId=${encodeURIComponent(category.id)}&levelIndex=${idx}&language=${activeLanguage}&returnTo=levels` as any,
                    )}
                    activeOpacity={0.82}
                    accessibilityRole="button"
                    accessibilityLabel={vocabularyTestBest
                      ? `Retake word test. Personal best ${gradeVocabularyTest(vocabularyTestBest.score, vocabularyTestBest.total)}`
                      : 'Take optional word test'}
                    testID={`vocabulary-test-level-${idx}`}
                    style={[
                      styles.modeBtn,
                      {
                        backgroundColor: vocabularyTestBest ? colors.accent : category.bgColor,
                        borderColor: vocabularyTestBest ? colors.primary : category.accentColor,
                      },
                    ]}
                  >
                    <View style={styles.modeBtnContent}>
                      <Ionicons name="create-outline" size={14} color={category.accentColor} />
                      <Text style={[styles.modeBtnTxt, { color: category.accentColor }]}>
                        {vocabularyTestBest
                          ? `${gradeVocabularyTest(vocabularyTestBest.score, vocabularyTestBest.total)} · ${vocabularyTestBest.score}/${vocabularyTestBest.total}`
                          : 'Word test'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {/* ── Word Search banner ── */}
        <TouchableOpacity
          onPress={() => {
            trackEvent('game_started', {
              category: category.id,
              game: 'word_search',
              level: 0,
            });
            router.push(`/wordsearch?categoryId=${category.id}`);
          }}
          activeOpacity={0.85}
          style={[styles.wsBtn, { backgroundColor: category.bgColor, borderColor: category.accentColor }]}
        >
          <View style={[styles.wsIcon, { backgroundColor: colors.card }]}><Ionicons name="search" size={22} color={category.accentColor} /></View>
          <View style={styles.wsText}>
            <Text style={[styles.wsTitle, { color: category.accentColor }]}>Word Search</Text>
            <Text style={[styles.wsSub,   { color: category.accentColor + 'AA' }]}>
              Find hidden {category.name.toLowerCase()} words in the grid
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={category.accentColor} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            trackEvent('game_started', {
              category: category.id,
              game: 'general_match',
              level: 0,
            });
            router.push(`/game?categoryId=${category.id}&levelIndex=0&allCategory=1` as any);
          }}
          activeOpacity={0.84}
          accessibilityRole="button"
          accessibilityLabel={`General level: study all ${categoryWordCount} ${category.name} words`}
          testID="category-general-level"
          style={[
            styles.generalReviewCard,
            { backgroundColor: colors.card, borderColor: category.accentColor },
          ]}
        >
          <View style={[styles.generalReviewIcon, { backgroundColor: category.bgColor }]}>
            <Ionicons name="library-outline" size={23} color={category.accentColor} />
          </View>
          <View style={styles.generalReviewCopy}>
            <Text style={[styles.generalReviewKicker, { color: category.accentColor }]}>
              GENERAL LEVEL
            </Text>
            <Text style={[styles.generalReviewTitle, { color: colors.foreground }]}>
              Study all {category.name.toLowerCase()} words
            </Text>
            <Text style={[styles.generalReviewSub, { color: colors.mutedForeground }]}>
              {categoryWordCount} words from every level in this category
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={category.accentColor} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 29,
    fontWeight: '700',
    letterSpacing: -0.6,
    flexShrink: 1,
  },
  categoryProgressCard: {
    marginHorizontal: 20,
    marginBottom: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 7,
  },
  categoryProgressHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  categoryProgressLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  categoryProgressValue: { fontSize: 10, fontWeight: '600' },
  categoryProgressTrack: { height: 5, borderRadius: 99, overflow: 'hidden' },
  categoryProgressFill: { height: '100%', borderRadius: 99 },
  overallGradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  overallGradeCopy: { flex: 1, gap: 3 },
  overallGradeTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  overallGradeSubtitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, lineHeight: 15 },
  overallGradeBadge: {
    minWidth: 50,
    height: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  overallGradeValue: { fontFamily: 'Nunito_800ExtraBold', fontSize: 19 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  levelHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 5, marginBottom: 2 },
  levelsTitle: { fontSize: 21, fontWeight: '700', letterSpacing: -0.3 },
  levelsSubtitle: { fontSize: 12, marginTop: 3 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  translationReviewNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
  },
  translationReviewText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  verbGuideButton: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderRadius: 18,
  },
  verbPracticeGroup: { gap: 10, marginBottom: 18 },
  conversationPracticeButton: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderRadius: 16,
  },
  verbPracticeKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginLeft: 2 },
  verbActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 17,
  },
  verbActivityIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  verbActivityCopy: { flex: 1, gap: 3 },
  verbActivityTitle: { fontSize: 14, fontWeight: '800' },
  verbActivitySub: { fontSize: 12, fontWeight: '500' },
  verbGuideIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verbGuideCopy: { flex: 1, gap: 3 },
  verbGuideTitle: { fontSize: 14, fontWeight: '800' },
  verbGuideSub: { fontSize: 12, fontWeight: '500' },
  levelCard: {
    padding: 15,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.055,
    shadowRadius: 10,
    elevation: 1,
  },
  levelTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  levelStats: {
    alignItems: 'flex-end',
    gap: 5,
    minWidth: 42,
  },
  practiceGradeBadge: {
    minWidth: 38,
    height: 25,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceGradeText: { fontSize: 12, fontWeight: '900' },
  practiceGradeProgress: { fontSize: 10, fontWeight: '800', textAlign: 'right' },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  modeBtn: {
    flexGrow: 1,
    minWidth: '30%',
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startAction: { flexBasis: '100%', paddingVertical: 12, borderRadius: 16 },
  modeBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  modeBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNum: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },
  info: { flex: 1 },
  levelName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  levelDesc: {
    fontSize: 13,
    fontWeight: '400',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
    paddingTop: 3,
  },
  progressHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 7,
  },
  progressLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  progressValue: { fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 5, borderRadius: 99, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', borderRadius: 99 },
  previewBtn: {
    minHeight: 40,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  previewWords: { gap: 1 },
  previewMainLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewForeign: { fontSize: 14, fontWeight: '800' },
  previewEnglish: { fontSize: 13, fontWeight: '600' },
  previewReading: { fontSize: 11, fontWeight: '700' },
  theologyGuideButton: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
  },
  theologyGuideIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  theologyGuideCopy: { flex: 1, gap: 3 },
  theologyGuideTitle: { fontSize: 14, fontWeight: '800' },
  theologyGuideSub: { fontSize: 12, fontWeight: '500' },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Word Search banner ──
  wsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    marginTop: 4,
  },
  wsIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  wsText: { flex: 1 },
  wsTitle: { fontSize: 16, fontWeight: '800' },
  wsSub:   { fontSize: 12, fontWeight: '600', marginTop: 2 },
  generalReviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    marginTop: 4,
    marginBottom: 6,
    borderRadius: 18,
    borderWidth: 2,
  },
  generalReviewIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generalReviewCopy: { flex: 1, gap: 2 },
  generalReviewKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  generalReviewTitle: { fontSize: 15, fontWeight: '800' },
  generalReviewSub: { fontSize: 11, fontWeight: '500' },
});
