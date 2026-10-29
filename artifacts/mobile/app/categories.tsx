import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from '@/components/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORIES, getUniqueVocabularyPairs, isCategoryAvailable, LANGUAGE_META } from '@/data/vocabulary';
import {
  GUIDED_CATEGORY_ID,
  GUIDED_LEVELS_PER_MILESTONE,
  getGuidedCurrentLevelIndex,
  getGuidedLevelCount,
} from '@/data/guided-curriculum';
import { LANGUAGE_FOUNDATIONS } from '@/data/language-foundations';
import { getGrammarCourse } from '@/data/grammar-curriculum';
import { READING_PRACTICE_PASSAGES } from '@/data/reading-practice';
import { SENTENCE_PRACTICE_LEVELS } from '@/data/sentence-practice';
import { PHRASE_PRACTICE_LEVELS } from '@/data/phrase-practice';
import { EVERYDAY_DIALOGUE_TOPICS } from '@/data/thematic-vocabulary';
import { useGame } from '@/context/GameContext';
import { trackEvent } from '@/lib/analytics';
import { goBackOr } from '@/lib/navigation';
import { useColors } from '@/hooks/useColors';
import {
  GENERAL_VOCABULARY_GAME_MODES,
  buildGeneralVocabularyGameHref,
  createRandomGeneralVocabularyBatch,
} from '@/lib/general-vocabulary-session';
import { FILL_BLANK_LEVEL_COUNT } from '@/lib/fill-blank-game';
import { LinearGradient } from 'expo-linear-gradient';
import { typography } from '@/constants/typography';
import { ARCADE_GAMES, ARCADE_GROUPS } from '@/lib/arcade/catalog';
import { arcadeBestScore } from '@/lib/arcade-progress';
import { classicBestStars } from '@/lib/classic-game-progress';
import { DailyChallengeCard } from '@/components/arcade/DailyChallengeCard';
import { MOTION, MOTION_SPRING } from '@/constants/motion';
import * as Haptics from 'expo-haptics';

function CategoryCard({
  category,
  index,
}: {
  category: (typeof CATEGORIES)[0];
  index: number;
}) {
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const { isLevelCompleted, getLevelStars } = useGame();
  const completedLevels = category.levels.filter((_, levelIndex) =>
    isLevelCompleted(category.id, levelIndex),
  ).length;
  const progress = category.levels.length ? completedLevels / category.levels.length : 0;
  const isComplete = completedLevels === category.levels.length;
  const stars = category.levels.reduce(
    (sum, _, levelIndex) => sum + getLevelStars(category.id, levelIndex),
    0,
  );

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);
  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const delay = Math.min(index * 12, 120);
    opacity.value = withDelay(delay, withTiming(1, { duration: MOTION.transitionMs }));
    translateY.value = withDelay(delay, withSpring(0, MOTION_SPRING));
  }, [index, opacity, reduceMotion, translateY]);
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.cardSlot, entranceStyle]}>
      <Animated.View style={[styles.cardPressShell, pressStyle]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${category.name}, ${completedLevels} of ${category.levels.length} levels complete`}
          onPress={() => {
            trackEvent('category_selected', { category: category.id });
            router.push(`/levels?categoryId=${category.id}`);
          }}
          onPressIn={() => {
            if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
            scale.value = reduceMotion ? 1 : withTiming(0.96, { duration: MOTION.pressInMs });
          }}
          onPressOut={() => { scale.value = reduceMotion ? 1 : withSpring(1, MOTION_SPRING); }}
          activeOpacity={1}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.categoryTop}>
            <View style={[styles.categoryIcon, { backgroundColor: category.bgColor }]}>
              <MaterialCommunityIcons name={category.icon as any} size={30} color={category.accentColor} />
            </View>
            {isComplete ? (
              <View style={[styles.completeMark, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={12} color={colors.primaryForeground} />
              </View>
            ) : stars > 0 ? (
              <View style={styles.starBadge}>
                <Ionicons name="star" size={12} color={category.accentColor} />
                <Text style={[styles.starCount, { color: colors.mutedForeground }]}>{stars}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={2}>{category.name}</Text>
          <View style={styles.categoryProgressRow}>
            <Text style={[styles.cardProgressLabel, { color: colors.mutedForeground }]}>
              {completedLevels}/{category.levels.length}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              {progress > 0 && <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: category.accentColor }]} />}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const LESSON_TABS = [
  { id: 'vocabulary', label: 'Vocabulary', description: 'Learn words by topic', icon: 'book-outline' },
  { id: 'grammar', label: 'Grammar', description: 'How the language fits together', icon: 'create-outline' },
  { id: 'sentences', label: 'Sentences', description: 'Put words into real sentences', icon: 'chatbubbles-outline' },
  { id: 'games', label: 'Practice', description: 'Quick ways to practice', icon: 'game-controller-outline' },
] as const;
type LessonsTab = (typeof LESSON_TABS)[number]['id'];
type LessonsSection = LessonsTab | 'review';

const GAME_MODE_COPY = {
  game: { label: 'Word match', description: 'Pair words across languages', icon: 'git-compare-outline' },
  flashcards: { label: 'Flashcards', description: 'Recall words at your pace', icon: 'albums-outline' },
  quiz: { label: 'Quiz', description: 'Choose the right translation', icon: 'help-circle-outline' },
  spelling: { label: 'Spelling', description: 'Type the word from memory', icon: 'create-outline' },
  trueorfalse: { label: 'True or false', description: 'Check each translation', icon: 'checkmark-circle-outline' },
  rapidfire: { label: 'Rapid fire', description: 'Answer as many as you can', icon: 'flash-outline' },
  wordsearch: { label: 'Word search', description: 'Find words in the grid', icon: 'grid-outline' },
  crossword: { label: 'Crossword', description: 'Solve clues with hints', icon: 'book-outline' },
} as const;

function LessonListRow({
  title,
  subtitle,
  icon,
  testID,
  accessibilityLabel,
  onPress,
  accentIndex = 0,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  testID: string;
  accessibilityLabel: string;
  onPress: () => void;
  accentIndex?: number;
}) {
  const colors = useColors();
  const accent = colors.lessonAccents[accentIndex % colors.lessonAccents.length];
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      activeOpacity={0.82}
      style={styles.listRow}
    >
      <View style={[styles.listIcon, { backgroundColor: accent.background }]}>
        <Ionicons name={icon} size={19} color={accent.foreground} />
      </View>
      <View style={styles.listCopy}>
        <Text style={[styles.listTitle, { color: colors.foreground }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.listSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function ExploreCard({
  title,
  subtitle,
  progress,
  icon,
  testID,
  badge,
  accentIndex = 0,
  onPress,
}: {
  title: string;
  subtitle: string;
  progress: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  testID: string;
  badge?: string;
  accentIndex?: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const accent = colors.lessonAccents[accentIndex % colors.lessonAccents.length];
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}. ${progress}`}
      testID={testID}
      onPress={onPress}
      activeOpacity={0.88}
      style={[styles.exploreCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
        <View style={[styles.exploreIcon, { backgroundColor: accent.background }]}>
          <Ionicons name={icon} size={23} color={accent.foreground} />
        </View>
        <View style={styles.exploreCopy}>
          <Text style={[styles.exploreTitle, { color: colors.foreground }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.exploreSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>{subtitle}</Text>
          <Text style={[styles.exploreProgress, { color: colors.primary }]} numberOfLines={1}>{progress}</Text>
        </View>
        {badge ? <View style={[styles.exploreBadge, { backgroundColor: colors.primary }]}><Text style={[styles.exploreBadgeText, { color: colors.primaryForeground }]}>{badge}</Text></View> : null}
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function CategoriesScreen() {
  const { section: requestedSection, tab: requestedTab } = useLocalSearchParams<{ section?: string; tab?: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const {
    isLevelCompleted,
    getLevelStars,
    activeLanguage,
    dueReviewPairs,
    dueGuidedSentences,
    progress,
  } = useGame();
  const rawSection = (Array.isArray(requestedSection) ? requestedSection[0] : requestedSection)
    ?? (Array.isArray(requestedTab) ? requestedTab[0] : requestedTab);
  const validSections: readonly LessonsSection[] = ['vocabulary', 'grammar', 'sentences', 'games', 'review'];
  const selectedSection = validSections.includes(rawSection as LessonsSection)
    ? rawSection as LessonsSection
    : null;
  const isHub = selectedSection === null;
  const activeTab: LessonsSection = selectedSection ?? 'vocabulary';
  const screenTitle = activeTab === 'games'
    ? 'Practice'
    : activeTab === 'review'
      ? 'Review'
      : LESSON_TABS.find(tab => tab.id === activeTab)?.label ?? 'Lessons';
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[] | null>(null);
  const availableCategories = useMemo(
    () => CATEGORIES.filter(category => isCategoryAvailable(category, activeLanguage)),
    [activeLanguage],
  );
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const allVocabularyCount = useMemo(
    () => getUniqueVocabularyPairs(activeLanguage).length,
    [activeLanguage],
  );
  const vocabularyTotal = availableCategories.reduce((sum, category) => sum + category.levels.length, 0);
  const vocabularyCompleted = availableCategories.reduce(
    (sum, category) => sum + category.levels.filter((_, index) => isLevelCompleted(category.id, index)).length,
    0,
  );
  const grammarUnits = getGrammarCourse(activeLanguage).flatMap(group => group.units);
  const grammarCompleted = grammarUnits.filter((_, index) => getLevelStars('grammar-course', index) > 0).length;
  const sentenceCompleted = SENTENCE_PRACTICE_LEVELS.filter((_, index) =>
    getLevelStars('sentence-practice', index) > 0,
  ).length;
  const categorySections = [
    { title: 'Verbs', testID: 'topic-jump-verbs', categories: availableCategories.filter(category => category.id === 'verbs') },
    {
      title: 'Everyday life',
      testID: 'topic-jump-everyday',
      categories: availableCategories.filter(category => category.id !== 'verbs' && category.section === 'real-life'),
    },
    {
      title: 'Build your vocabulary',
      testID: 'topic-jump-vocabulary',
      categories: availableCategories.filter(category => category.id !== 'verbs' && category.section === 'vocabulary'),
    },
    {
      title: 'More topics',
      testID: 'topic-jump-more',
      categories: availableCategories.filter(category =>
        category.id !== 'verbs' &&
        category.section !== 'real-life' &&
        category.section !== 'vocabulary',
      ),
    },
  ].map(section => ({
    ...section,
    categories: section.categories.filter(category =>
      category.name.toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase()),
    ),
  })).filter(section => section.categories.length > 0);
  const currentGuidedLevel = getGuidedCurrentLevelIndex(isLevelCompleted);
  const guidedPosition = currentGuidedLevel >= getGuidedLevelCount()
    ? 'Climb complete · all Milestones and Levels'
    : currentGuidedLevel === 0
      ? 'Milestone 1 · Level 1'
      : `Milestone ${Math.floor(currentGuidedLevel / GUIDED_LEVELS_PER_MILESTONE) + 1} · Level ${currentGuidedLevel % GUIDED_LEVELS_PER_MILESTONE + 1}`;
  const headerOpacity = useSharedValue(0);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: MOTION.screenMs });
  }, [headerOpacity]);
  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const tabOpacity = useSharedValue(1);
  useEffect(() => {
    tabOpacity.value = 0;
    tabOpacity.value = withTiming(1, { duration: 190 });
  }, [activeTab, tabOpacity]);
  const tabContentStyle = useAnimatedStyle(() => ({ opacity: tabOpacity.value }));
  const languageName = LANGUAGE_META[activeLanguage].label;

  const startVocabularyGame = (mode: (typeof GENERAL_VOCABULARY_GAME_MODES)[number]['id']) => {
    const batch = createRandomGeneralVocabularyBatch(activeLanguage);
    router.push(buildGeneralVocabularyGameHref(mode, {
      kind: 'random',
      batchIndices: batch.indices,
      returnTo: 'random-practice',
    }) as any);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.groupedBackground }]}>
      {isHub ? (
        <>
          <View style={[styles.header, { paddingTop: topPad + 8 }]}>
            <Animated.View style={[styles.hubHeading, headerStyle]}>
              <Text style={[styles.title, { color: colors.foreground }]}>Lessons</Text>
              <View style={[styles.languageSubtitle, { backgroundColor: colors.card }]}>
                <Text style={styles.languageFlag}>{LANGUAGE_META[activeLanguage].flag}</Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{languageName}</Text>
              </View>
            </Animated.View>
          </View>
          <ScrollView
            contentContainerStyle={[styles.hubContent, { paddingBottom: bottomPad + 28 }]}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Guided lessons. ${guidedPosition}. ${currentGuidedLevel > 0 ? 'Continue' : 'Start'}`}
              testID="guided-lessons-entry"
              activeOpacity={0.88}
              onPress={() => router.push('/guided-path' as any)}
              style={[styles.guidedEntryWrap, { shadowColor: colors.primary }]}
            >
              <LinearGradient
                colors={[colors.homePrimary, colors.homePrimaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.guidedEntry}
              >
                <View style={[styles.guidedIcon, { backgroundColor: colors.onAccent + '20' }]}>
                  <Ionicons name="navigate-outline" size={23} color={colors.onAccent} />
                </View>
                <View style={styles.guidedCopy}>
                  <Text style={[styles.guidedTitle, { color: colors.onAccent }]}>Guided lessons</Text>
                  <Text style={[styles.guidedSubtitle, { color: colors.onAccentMuted }]}>{guidedPosition}</Text>
                </View>
                <View style={styles.guidedAction}>
                  <Text style={[styles.guidedActionText, { color: colors.primary }]}>{currentGuidedLevel > 0 ? 'Continue' : 'Start'}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.exploreHeading, { color: colors.foreground }]}>Explore</Text>
            <View style={styles.exploreList}>
              <ExploreCard
                title="Vocabulary"
                subtitle="Learn words by topic"
                progress={`${vocabularyCompleted}/${vocabularyTotal} levels`}
                icon="book-outline"
                accentIndex={0}
                testID="lessons-tab-vocabulary"
                onPress={() => router.push('/categories?section=vocabulary' as any)}
              />
              <ExploreCard
                title="Grammar"
                subtitle="How the language fits together"
                progress={`${grammarCompleted}/${grammarUnits.length} topics`}
                icon="create-outline"
                accentIndex={1}
                testID="lessons-tab-grammar"
                onPress={() => router.push('/categories?section=grammar' as any)}
              />
              <ExploreCard
                title="Sentences"
                subtitle="Phrases, reading & sentence practice"
                progress={`${sentenceCompleted}/${SENTENCE_PRACTICE_LEVELS.length} levels`}
                icon="chatbubbles-outline"
                accentIndex={2}
                testID="lessons-tab-sentences"
                onPress={() => router.push('/categories?section=sentences' as any)}
              />
              <ExploreCard
                title="Review"
                subtitle="Fix your mistakes & practice all words"
                progress={dueReviewPairs.length + dueGuidedSentences.length > 0
                  ? `${dueReviewPairs.length + dueGuidedSentences.length} ready to review`
                  : `${allVocabularyCount.toLocaleString()} words available`}
                icon="refresh-outline"
                accentIndex={3}
                badge={dueReviewPairs.length + dueGuidedSentences.length > 0
                  ? String(Math.min(dueReviewPairs.length + dueGuidedSentences.length, 99))
                  : undefined}
                testID="lessons-tab-review"
                onPress={() => router.push('/categories?section=review' as any)}
              />
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Looking for games? Go to Practice"
              testID="lessons-games-link"
              onPress={() => router.push('/categories?section=games' as any)}
              activeOpacity={0.76}
              style={styles.gamesLink}
            >
              <Text style={[styles.gamesLinkText, { color: colors.mutedForeground }]}>Looking for games? </Text>
              <Text style={[styles.gamesLinkAction, { color: colors.primary }]}>Go to Practice</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </ScrollView>
        </>
      ) : (
        <>
          <View style={[styles.header, styles.detailHeader, { paddingTop: topPad + 8 }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go back to Lessons"
              testID="lesson-section-back"
              onPress={() => goBackOr('/categories')}
              activeOpacity={0.75}
              style={[styles.backButton, { backgroundColor: colors.muted }]}
            >
              <Ionicons name="arrow-back" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Animated.View style={[styles.detailHeading, headerStyle]}>
              <Text style={[styles.title, { color: colors.foreground }]}>{screenTitle}</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {LANGUAGE_META[activeLanguage].flag} {languageName}
              </Text>
            </Animated.View>
          </View>
          <Animated.ScrollView
            style={tabContentStyle}
            contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 28 }]}
            showsVerticalScrollIndicator={false}
          >
        {activeTab === 'vocabulary' && (
          <>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
              <TextInput
                accessibilityLabel="Search vocabulary topics"
                testID="vocabulary-topic-search"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search topics"
                placeholderTextColor={colors.mutedForeground}
                returnKeyType="search"
                style={[styles.searchInput, { color: colors.foreground }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Clear topic search"
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearch}
                >
                  <Ionicons name="close-circle" size={19} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
            {categorySections.map((section, sectionIndex) => {
              const initiallyExpanded = expandedGroups === null
                ? sectionIndex === 0
                : expandedGroups.includes(section.title);
              const expanded = searchQuery.trim().length > 0 || initiallyExpanded;
              return (
                <View key={section.title} style={styles.categorySection} testID={section.testID}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    accessibilityLabel={`${section.title}, ${section.categories.length} topics`}
                    testID={`${section.testID}-toggle`}
                    onPress={() => setExpandedGroups(current => {
                      const openGroups = current ?? (categorySections[0] ? [categorySections[0].title] : []);
                      return openGroups.includes(section.title)
                        ? openGroups.filter(title => title !== section.title)
                        : [...openGroups, section.title];
                    })}
                    activeOpacity={0.75}
                    style={styles.collapsibleHeading}
                  >
                    <View>
                      <Text style={[styles.categorySectionTitle, { color: colors.foreground }]}>{section.title}</Text>
                      <Text style={[styles.categorySectionCount, { color: colors.mutedForeground }]}>
                        {section.categories.length} topics
                      </Text>
                    </View>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={19} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  {expanded && (
                    <Animated.View entering={FadeIn.duration(160)} style={styles.gridRows}>
                      {section.categories.map((category, index) => (
                        <CategoryCard
                          key={category.id}
                          category={category}
                          index={sectionIndex * 3 + index}
                        />
                      ))}
                    </Animated.View>
                  )}
                </View>
              );
            })}
            {categorySections.length === 0 && (
              <View style={[styles.emptySearch, { backgroundColor: colors.card }]}>
                <Text style={[styles.emptySearchText, { color: colors.mutedForeground }]}>No topics match that search.</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'grammar' && (
          <>
            <View style={styles.sectionGroup} testID="topic-jump-grammar">
              <View testID="grammar-foundations-entry">
                <LessonListRow
                  title="Grammar foundations"
                  subtitle="Rules, examples & total practice"
                  icon="library-outline"
                  accentIndex={0}
                  testID="grammar-practice-entry"
                  accessibilityLabel={activeLanguage === 'armenian'
                    ? 'Open Western Armenian grammar foundations, total grammar practice, and topic-by-topic lessons'
                    : `Open ${LANGUAGE_FOUNDATIONS[activeLanguage].languageName} grammar foundations, total grammar practice, and topic-by-topic lessons`}
                  onPress={() => router.push('/grammar-practice' as any)}
                />
              </View>
            </View>
            <View style={styles.sectionGroup}>
              <Text style={[styles.categorySectionTitle, { color: colors.mutedForeground }]}>MORE GRAMMAR TOOLS</Text>
              <View style={[styles.listGroup, { backgroundColor: colors.card }]}>
                <LessonListRow
                  title="Build a translation"
                  subtitle="Arrange or type the target-language sentence"
                  icon="chatbox-ellipses-outline"
                  accentIndex={1}
                  testID="grammar-translation-entry"
                  accessibilityLabel={`Build English-to-${languageName} translations at three difficulty levels`}
                  onPress={() => router.push('/grammar-translation' as any)}
                />
                <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                <LessonListRow
                  title="Verb guide"
                  subtitle="Review common and irregular forms"
                  icon="book-outline"
                  accentIndex={0}
                  testID="verb-guide-entry"
                  accessibilityLabel="Open the verb guide"
                  onPress={() => router.push('/verb-guide' as any)}
                />
                <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                <LessonListRow
                  title="Verb fill-in"
                  subtitle="Choose the right form in context"
                  icon="create-outline"
                  accentIndex={1}
                  testID="verb-fill-in-entry"
                  accessibilityLabel="Open verb fill-in practice"
                  onPress={() => router.push('/verb-fill-in' as any)}
                />
                <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                <LessonListRow
                  title="Verb sentence builder"
                  subtitle="Construct complete sentences"
                  icon="construct-outline"
                  accentIndex={2}
                  testID="verb-sentence-builder-entry"
                  accessibilityLabel="Open verb sentence builder"
                  onPress={() => router.push('/verb-sentence-builder' as any)}
                />
                <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                <LessonListRow
                  title="Time practice"
                  subtitle="Learn to say the time naturally"
                  icon="time-outline"
                  accentIndex={3}
                  testID="time-practice-entry"
                  accessibilityLabel="Open time practice"
                  onPress={() => router.push('/time-practice' as any)}
                />
                {activeLanguage === 'armenian' && (
                  <>
                    <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                    <LessonListRow
                      title="Armenian alphabet"
                      subtitle="Read letters with Latin transliteration"
                      icon="text-outline"
                      accentIndex={4}
                      testID="armenian-alphabet-entry"
                      accessibilityLabel="Learn to read Armenian with an optional alphabet lesson"
                      onPress={() => router.push({ pathname: '/language-foundations', params: { area: 'alphabet' } } as any)}
                    />
                  </>
                )}
              </View>
            </View>
          </>
        )}

        {activeTab === 'sentences' && (
          <>
            <View style={styles.sectionGroup} testID="topic-jump-general">
              <Text style={[styles.categorySectionTitle, { color: colors.mutedForeground }]}>PRACTICE IN SENTENCES</Text>
              <View style={[styles.listGroup, { backgroundColor: colors.card }]}>
                <LessonListRow
                  title="Sentence practice"
                  subtitle="Build real translations one word at a time"
                  icon="chatbox-ellipses-outline"
                  accentIndex={0}
                  testID="sentence-practice-entry"
                  accessibilityLabel={`Sentence practice in ${languageName}. ${SENTENCE_PRACTICE_LEVELS.length} levels of translation practice`}
                  onPress={() => router.push('/sentence-practice' as any)}
                />
                <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                <View testID="topic-jump-reading">
                  <LessonListRow
                    title="Reading practice"
                    subtitle={`${READING_PRACTICE_PASSAGES.length} readings · ${languageName} + English`}
                    icon="book-outline"
                    accentIndex={0}
                    testID="reading-practice-entry"
                    accessibilityLabel={`Reading practice in ${languageName}, with English translations and ${READING_PRACTICE_PASSAGES.length} short readings`}
                    onPress={() => router.push('/reading-practice' as any)}
                  />
                </View>
                <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                <View testID="topic-jump-phrases">
                  <LessonListRow
                    title="Phrases & conversations"
                    subtitle={`${PHRASE_PRACTICE_LEVELS.length} phrase levels · ${EVERYDAY_DIALOGUE_TOPICS.length} conversations`}
                    icon="chatbubbles-outline"
                    accentIndex={1}
                    testID="phrase-practice-entry"
                    accessibilityLabel={`Open phrase and conversation practice. ${PHRASE_PRACTICE_LEVELS.length} phrase levels and ${EVERYDAY_DIALOGUE_TOPICS.length} short conversations are always available in ${languageName}.`}
                    onPress={() => router.push('/phrases' as any)}
                  />
                </View>
                <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                <LessonListRow
                  title="Chat simulator"
                  subtitle="Choose natural replies in everyday chats"
                  icon="chatbubbles-outline"
                  accentIndex={2}
                  testID="sentence-chat-simulator-entry"
                  accessibilityLabel={`Open Chat Simulator in ${languageName}`}
                  onPress={() => router.push('/play-game?game=chat-simulator' as any)}
                />
                <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                <LessonListRow
                  title="Choose your path"
                  subtitle="Read short stories and make choices"
                  icon="map-outline"
                  accentIndex={3}
                  testID="sentence-stories-entry"
                  accessibilityLabel={`Open Choose Your Path stories in ${languageName}`}
                  onPress={() => router.push('/play-game?game=path-stories' as any)}
                />
              </View>
            </View>
          </>
        )}

        {activeTab === 'review' && (
          <>
            <View style={styles.sectionGroup}>
              <Text style={[styles.categorySectionTitle, { color: colors.mutedForeground }]}>REVIEW YOUR LEARNING</Text>
              <View style={[styles.listGroup, { backgroundColor: colors.card }]}>
                <LessonListRow
                  title="Fix your mistakes"
                  subtitle={dueReviewPairs.length + dueGuidedSentences.length > 0
                    ? `${dueReviewPairs.length} words · ${dueGuidedSentences.length} sentences to revisit`
                    : 'Missed words and sentences appear here'}
                  icon="refresh-outline"
                  accentIndex={0}
                  testID="general-vocabulary-mistakes-entry"
                  accessibilityLabel={`Fix your mistakes. ${dueReviewPairs.length} words and ${dueGuidedSentences.length} sentences are in the review queue`}
                  onPress={() => router.push('/mistake-review' as any)}
                />
                <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                <LessonListRow
                  title="Practice all words"
                  subtitle={`${allVocabularyCount.toLocaleString()} words across every topic`}
                  icon="library-outline"
                  accentIndex={1}
                  testID="general-vocabulary-entry"
                  accessibilityLabel={`Practice all ${allVocabularyCount} vocabulary words from every topic`}
                  onPress={() => router.push('/general-vocabulary-levels' as any)}
                />
              </View>
            </View>
            <View style={styles.sectionGroup}>
              <Text style={[styles.categorySectionTitle, { color: colors.mutedForeground }]}>A LITTLE EVERY DAY</Text>
              <DailyChallengeCard testID="daily-challenge-card" />
            </View>
          </>
        )}

        {activeTab === 'games' && (
          <>
            <DailyChallengeCard testID="daily-challenge-card" />
            {ARCADE_GROUPS.map(group => (
              <View key={group.id} style={styles.sectionGroup} testID={`arcade-group-${group.id}`}>
                <Text style={[styles.categorySectionTitle, { color: colors.mutedForeground }]}>{group.title.toUpperCase()}</Text>
                <View style={styles.gameGrid}>
                  {ARCADE_GAMES.filter(game => game.group === group.id).map(game => {
                    const best = arcadeBestScore(progress, activeLanguage, game.id);
                    return (
                      <TouchableOpacity
                        key={game.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${game.name}. ${game.description}. Best score ${best}`}
                        testID={`arcade-game-${game.id}`}
                        onPress={() => {
                          trackEvent('category_selected', { category: `arcade-${game.id}` });
                          router.push(`/play-game?game=${game.id}` as any);
                        }}
                        activeOpacity={0.82}
                        style={[styles.gameCard, styles.arcadeCard, { backgroundColor: colors.card, borderColor: colors.border, borderBottomColor: game.darkColor }]}
                      >
                        <View style={[styles.arcadeIconLip, { backgroundColor: game.darkColor }]}>
                          <View style={[styles.gameIcon, { backgroundColor: game.color }]}>
                            <Ionicons name={game.icon as any} size={20} color="#FFFFFF" />
                          </View>
                        </View>
                        <Text style={[styles.arcadeTitle, { color: colors.foreground }]} numberOfLines={2}>{game.name}</Text>
                        <View style={styles.bestRow}>
                          <Ionicons name="trophy-outline" size={12} color={colors.mutedForeground} />
                          <Text style={[styles.bestText, { color: colors.mutedForeground }]}>Best {best}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            <View style={styles.sectionGroup} testID="arcade-group-classic">
              <Text style={[styles.categorySectionTitle, { color: colors.mutedForeground }]}>CLASSIC GAMES</Text>
              <View style={styles.gameGrid}>
                {GENERAL_VOCABULARY_GAME_MODES.map((mode, index) => {
                  const copy = GAME_MODE_COPY[mode.id];
                  const accent = colors.lessonAccents[index % colors.lessonAccents.length];
                  const bestStars = classicBestStars(progress, activeLanguage, mode.id);
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${copy.label}. ${copy.description}. Starts with 25 random words from every category. ${bestStars === undefined ? 'No best yet' : `Best ${bestStars} stars`}`}
                      testID={`lesson-game-${mode.id}`}
                      onPress={() => startVocabularyGame(mode.id)}
                      activeOpacity={0.82}
                      style={[styles.gameCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={[styles.gameIcon, { backgroundColor: accent.background }]}>
                        <Ionicons name={copy.icon as any} size={20} color={accent.foreground} />
                      </View>
                      <Text style={[styles.arcadeTitle, { color: colors.foreground }]} numberOfLines={2}>{copy.label}</Text>
                      <View style={styles.bestRow}>
                        <Ionicons name={bestStars === undefined ? 'trophy-outline' : 'star'} size={12} color={colors.mutedForeground} />
                        <Text style={[styles.bestText, { color: colors.mutedForeground }]}>{bestStars === undefined ? 'No best yet' : `Best ${bestStars} ★`}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {[
                  { id: 'sentencepractice', label: 'Sentence practice', description: 'Build real translations', icon: 'chatbox-ellipses-outline', href: '/sentence-practice', testID: 'lesson-game-sentencepractice', a11y: `Sentence practice in ${languageName}. ${SENTENCE_PRACTICE_LEVELS.length} levels of translation practice` },
                  { id: 'fillblank', label: 'Fill in the blank', description: 'Recall a word in a sentence', icon: 'text-outline', href: '/fill-in-the-blank', testID: 'fill-in-the-blank-entry', a11y: `Fill in the blank. ${FILL_BLANK_LEVEL_COUNT} open levels using vocabulary from every category` },
                ].map((item, i) => {
                  const accent = colors.lessonAccents[(GENERAL_VOCABULARY_GAME_MODES.length + i) % colors.lessonAccents.length];
                  const bestStars = classicBestStars(progress, activeLanguage, item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.a11y}. ${bestStars === undefined ? 'No best yet' : `Best ${bestStars} stars`}`}
                      testID={item.testID}
                      onPress={() => router.push(item.href as any)}
                      activeOpacity={0.82}
                      style={[styles.gameCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={[styles.gameIcon, { backgroundColor: accent.background }]}>
                        <Ionicons name={item.icon as any} size={20} color={accent.foreground} />
                      </View>
                      <Text style={[styles.arcadeTitle, { color: colors.foreground }]} numberOfLines={2}>{item.label}</Text>
                      <View style={styles.bestRow}>
                        <Ionicons name={bestStars === undefined ? 'trophy-outline' : 'star'} size={12} color={colors.mutedForeground} />
                        <Text style={[styles.bestText, { color: colors.mutedForeground }]}>{bestStars === undefined ? 'No best yet' : `Best ${bestStars} ★`}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}
          </Animated.ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 10 },
  hubHeading: { gap: 2 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  detailHeading: { flex: 1, minWidth: 0 },
  languageSubtitle: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 4 },
  languageFlag: { fontSize: 15 },
  backButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.largeTitle },
  subtitle: { ...typography.caption, marginTop: 1 },
  hubContent: { paddingHorizontal: 20, paddingTop: 7, gap: 12 },
  exploreHeading: { ...typography.title, marginTop: 3, marginBottom: -2 },
  exploreList: { gap: 11 },
  exploreCard: { minHeight: 92, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  exploreIcon: { width: 50, height: 50, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  exploreCopy: { flex: 1, minWidth: 0, gap: 2 },
  exploreTitle: { ...typography.headline, fontSize: 16 },
  exploreSubtitle: { ...typography.caption, fontSize: 12, lineHeight: 15 },
  exploreProgress: { ...typography.caption, fontSize: 11, lineHeight: 14, marginTop: 1 },
  exploreBadge: { minWidth: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  exploreBadgeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10 },
  gamesLink: { minHeight: 45, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  gamesLinkText: { ...typography.caption, fontSize: 12 },
  gamesLinkAction: { ...typography.caption, fontSize: 12 },
  content: { paddingHorizontal: 20, paddingTop: 5 },
  categorySection: { marginBottom: 16 },
  searchBox: { minHeight: 48, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 5 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, fontFamily: 'Nunito_600SemiBold', fontSize: 15 },
  clearSearch: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  collapsibleHeading: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  categorySectionCount: { ...typography.caption, fontSize: 11, marginTop: 1 },
  emptySearch: { minHeight: 78, borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 16 },
  emptySearchText: { ...typography.body, fontSize: 13, textAlign: 'center' },
  sectionGroup: { marginBottom: 18 },
  listGroup: {
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', minHeight: 72, gap: 12, paddingVertical: 10 },
  listIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  listCopy: { flex: 1, minWidth: 0, gap: 3 },
  listTitle: { ...typography.body, fontSize: 15, lineHeight: 20 },
  listSubtitle: { ...typography.caption, fontSize: 12, lineHeight: 16 },
  rowDivider: { height: StyleSheet.hairlineWidth, marginLeft: 51 },
  guidedEntryWrap: { marginHorizontal: 0, marginBottom: 4, borderRadius: 22, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 10, elevation: 3 },
  guidedEntry: { minHeight: 94, borderRadius: 22, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  guidedIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  guidedCopy: { flex: 1, minWidth: 0 },
  guidedTitle: { ...typography.headline },
  guidedSubtitle: { ...typography.caption, fontSize: 12, lineHeight: 17, marginTop: 3 },
  guidedAction: { minHeight: 40, paddingHorizontal: 13, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  guidedActionText: { ...typography.caption },
  gameGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 9 },
  gameCard: {
    width: '48.3%',
    minHeight: 112,
    borderRadius: 20,
    padding: 13,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 7,
  },
  arcadeCard: { borderBottomWidth: 4 },
  arcadeIconLip: { borderRadius: 21, paddingBottom: 3, alignSelf: 'flex-start' },
  arcadeDescription: { ...typography.caption, fontSize: 12, lineHeight: 16 },
  gameIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  gameTitle: { ...typography.caption, fontSize: 14 },
  arcadeTitle: { ...typography.headline, fontSize: 16, lineHeight: 20 },
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bestText: { ...typography.caption, fontSize: 12, fontVariant: ['tabular-nums'] },
  gameDescription: { display: 'none' },
  categorySectionTitle: { ...typography.micro, marginBottom: 10 },
  gridRows: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 11 },
  cardSlot: { width: '48.5%', minHeight: 146, height: 146 },
  cardPressShell: {
    flex: 1,
    borderRadius: 22,
    shadowColor: '#16233A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.055,
    shadowRadius: 12,
    elevation: 2,
  },
  card: { flex: 1, borderRadius: 22, padding: 13, justifyContent: 'space-between' },
  categoryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  categoryIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  categoryProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingTop: 3 },
  starCount: { ...typography.micro, fontSize: 9, letterSpacing: 0 },
  completeMark: { width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardName: { ...typography.body, fontSize: 15, lineHeight: 19, minHeight: 38, marginTop: 4 },
  cardProgressLabel: { ...typography.micro, fontSize: 9, letterSpacing: 0.1 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
});
