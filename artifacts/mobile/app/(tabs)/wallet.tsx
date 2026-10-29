import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/context/GameContext';
import {
  CATEGORIES,
  isCategoryAvailable,
  LANGUAGE_META,
  SUPPORTED_LANGUAGES,
  type Category,
  type Language,
} from '@/data/vocabulary';
import { useColors } from '@/hooks/useColors';
import {
  countPracticeTypes,
  gradeForPracticeAverage,
  practiceAverage,
  PRACTICE_GRADE_SCALE,
  summarizeCategoryPracticeScores,
} from '@/lib/practice-grading';

type GradeFilter = 'all' | 'graded' | 'needs-work' | 'not-started';
type GradeBand = 'A' | 'B' | 'C' | 'D' | 'F';
type SheetType = 'language' | 'grades' | null;

interface LevelGrade {
  index: number;
  average: number | null;
  grade: string | null;
  practiceTypes: number;
}

interface CategoryGrade {
  category: Category;
  levels: LevelGrade[];
  average: number | null;
  grade: string | null;
  gradedLevels: number;
  totalLevels: number;
  started: boolean;
  needsWork: boolean;
}

const GRADE_FILTERS: { id: GradeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'graded', label: 'Graded' },
  { id: 'needs-work', label: 'Needs work' },
  { id: 'not-started', label: 'Not started' },
];

const BAND_ORDER: GradeBand[] = ['A', 'B', 'C', 'D', 'F'];

function getGradeBand(grade: string | null): GradeBand | null {
  if (!grade) return null;
  const first = grade.charAt(0);
  return BAND_ORDER.includes(first as GradeBand) ? first as GradeBand : null;
}

function gradeTone(grade: string | null, dark: boolean) {
  const band = getGradeBand(grade);
  const palette: Record<GradeBand, { background: string; foreground: string }> = {
    A: { background: dark ? 'rgba(34,197,94,0.18)' : '#E1F5E8', foreground: dark ? '#7EE2A4' : '#167342' },
    B: { background: dark ? 'rgba(59,130,246,0.2)' : '#E5F0FF', foreground: dark ? '#91BBFF' : '#245BC2' },
    C: { background: dark ? 'rgba(245,158,11,0.18)' : '#FFF3D9', foreground: dark ? '#FFD17A' : '#946000' },
    D: { background: dark ? 'rgba(249,115,22,0.18)' : '#FFF0E4', foreground: dark ? '#FFB27D' : '#AD4B0A' },
    F: { background: dark ? 'rgba(239,68,68,0.18)' : '#FDE9E8', foreground: dark ? '#FF9A97' : '#B3261E' },
  };
  return band ? palette[band] : {
    background: dark ? '#343B46' : '#EEF1F5',
    foreground: dark ? '#AEB8C5' : '#657183',
  };
}

function groupForCategory(category: Category) {
  if (category.id === 'verbs') return 'Verbs';
  if (category.section === 'real-life') return 'Everyday life';
  if (category.section === 'vocabulary') return 'Grow your words';
  return 'More topics';
}

function isLanguageStarted(language: Language, progress: ReturnType<typeof useGame>['progress']) {
  return Object.entries(progress).some(([key, levels]) => {
    if (!key.startsWith(`${language}::`)) return false;
    return Object.values(levels).some(level =>
      level.completed ||
      countPracticeTypes(level.practiceScores) > 0 ||
      Object.values(level.stages ?? {}).some(stage =>
        stage.completed || Object.keys(stage.gameScores ?? {}).length > 0,
      ),
    );
  });
}

function GradeRing({
  grade,
  average,
}: {
  grade: string | null;
  average: number | null;
}) {
  const circumference = 2 * Math.PI * 32;
  const progress = Math.max(0, Math.min(100, average ?? 0));
  return (
    <View
      style={styles.ringWrap}
      accessibilityRole="progressbar"
      accessibilityLabel={`Overall grade ${grade ?? 'not available'}, ${Math.round(progress)} percent`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
    >
      <Svg width={78} height={78} viewBox="0 0 78 78">
        <Circle cx={39} cy={39} r={32} stroke="rgba(255,255,255,0.25)" strokeWidth={7} fill="none" />
        <Circle
          cx={39}
          cy={39}
          r={32}
          stroke="#FFFFFF"
          strokeWidth={7}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress / 100)}
          strokeLinecap="round"
          fill="none"
          rotation={-90}
          origin="39,39"
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringGrade}>{grade ?? '—'}</Text>
      </View>
    </View>
  );
}

function GradeBadge({
  grade,
  dark,
  compact = false,
}: {
  grade: string | null;
  dark: boolean;
  compact?: boolean;
}) {
  const tone = gradeTone(grade, dark);
  return (
    <View style={[styles.gradeBadge, compact && styles.gradeBadgeCompact, { backgroundColor: tone.background }]}>
      <Text style={[styles.gradeBadgeText, compact && styles.gradeBadgeTextCompact, { color: tone.foreground }]}>
        {grade ?? '—'}
      </Text>
    </View>
  );
}

function FilterChip({
  id,
  label,
  selected,
  onPress,
  colors,
}: {
  id: GradeFilter;
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} grade categories`}
      testID={id === 'all' ? 'grades-view-all' : `grade-filter-${id}`}
      onPress={onPress}
      activeOpacity={0.78}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[styles.filterText, { color: selected ? colors.primaryForeground : colors.foreground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function GradesScreen() {
  const {
    activeLanguage,
    setLanguage,
    progress,
    getLevelPracticeScores,
  } = useGame();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = colors.colorScheme === 'dark';
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [sheet, setSheet] = useState<SheetType>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [filter, setFilter] = useState<GradeFilter | null>(null);

  useEffect(() => {
    setFilter(null);
    setExpandedCategory(null);
  }, [activeLanguage]);

  const startedLanguages = useMemo(() => {
    const started = SUPPORTED_LANGUAGES.filter(language =>
      language === activeLanguage || isLanguageStarted(language, progress),
    );
    return started.length ? started : [activeLanguage];
  }, [activeLanguage, progress]);

  const categories = useMemo(
    () => CATEGORIES.filter(category => isCategoryAvailable(category, activeLanguage)),
    [activeLanguage],
  );

  const categoryGrades = useMemo<CategoryGrade[]>(
    () => categories.map(category => {
      const scores = category.levels.map((_, index) =>
        getLevelPracticeScores(category.id, index, activeLanguage),
      );
      const levels = scores.map((gameScores, index) => {
        const average = practiceAverage(gameScores);
        return {
          index,
          average,
          grade: gradeForPracticeAverage(average),
          practiceTypes: countPracticeTypes(gameScores),
        };
      });
      const summary = summarizeCategoryPracticeScores(scores);
      return {
        category,
        levels,
        average: summary.average,
        grade: summary.grade,
        gradedLevels: summary.gradedLevels,
        totalLevels: summary.totalLevels,
        started: levels.some(level => level.practiceTypes > 0),
        needsWork: levels.some(level => level.grade === 'D' || level.grade === 'F'),
      };
    }),
    [activeLanguage, categories, getLevelPracticeScores],
  );

  const gradedLevels = categoryGrades.flatMap(row =>
    row.levels.filter(level => level.average !== null).map(level => ({
      category: row.category,
      ...level,
    })),
  );
  const overallAverage = gradedLevels.length
    ? gradedLevels.reduce((sum, level) => sum + (level.average ?? 0), 0) / gradedLevels.length
    : null;
  const overallGrade = gradeForPracticeAverage(overallAverage);
  const bestCategory = [...categoryGrades]
    .filter(row => row.average !== null)
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))[0];
  const aGradeCount = gradedLevels.filter(level => getGradeBand(level.grade) === 'A').length;
  const needsWorkCount = gradedLevels.filter(level => level.grade === 'D' || level.grade === 'F').length;
  const gradedCategoryCount = categoryGrades.filter(row => row.gradedLevels > 0).length;
  const currentFilter = filter ?? (gradedLevels.length > 0 ? 'graded' : 'all');

  const breakdown = useMemo(() => {
    const counts: Record<GradeBand, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const level of gradedLevels) {
      const band = getGradeBand(level.grade);
      if (band) counts[band] += 1;
    }
    return counts;
  }, [gradedLevels]);

  const improvements = [...gradedLevels]
    .sort((a, b) => (a.average ?? 0) - (b.average ?? 0))
    .slice(0, 2);

  const filteredCategories = categoryGrades.filter(row => {
    if (currentFilter === 'graded') return row.gradedLevels > 0;
    if (currentFilter === 'needs-work') return row.needsWork;
    if (currentFilter === 'not-started') return !row.started;
    return true;
  });

  const categoryGroups = ['Verbs', 'Everyday life', 'Grow your words', 'More topics']
    .map(title => ({
      title,
      rows: filteredCategories.filter(row => groupForCategory(row.category) === title),
    }))
    .filter(group => group.rows.length > 0);

  const openLevel = (categoryId: string, levelIndex: number) => {
    router.push(`/game?categoryId=${encodeURIComponent(categoryId)}&levelIndex=${levelIndex}` as any);
  };

  const selectLanguage = (language: Language) => {
    setLanguage(language);
    setFilter(null);
    setExpandedCategory(null);
    setSheet(null);
  };

  const gradeScaleWithRanges = PRACTICE_GRADE_SCALE.map(([minimum, grade], index) => {
    const nextMinimum = PRACTICE_GRADE_SCALE[index + 1]?.[0];
    const range = grade === 'F'
      ? '<60%'
      : index === 0
        ? '99%+'
      : nextMinimum === undefined
        ? `${minimum}%+`
        : `${minimum}–${nextMinimum - 1}%`;
    return { grade, range };
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.groupedBackground }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 12, paddingBottom: bottomPad + 94 },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: colors.foreground }]}>Grades</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Change grade language. Current language: ${LANGUAGE_META[activeLanguage].label}`}
              accessibilityHint="Shows only languages you have started"
              testID="grades-language-picker"
              onPress={() => setSheet('language')}
              activeOpacity={0.78}
              style={[styles.languagePill, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={styles.languageFlag}>{LANGUAGE_META[activeLanguage].flag}</Text>
              <Text style={[styles.languageName, { color: colors.foreground }]}>{LANGUAGE_META[activeLanguage].label}</Text>
              <Ionicons name="chevron-down" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="How grades work"
            testID="grade-scale-toggle"
            onPress={() => setSheet('grades')}
            activeOpacity={0.75}
            style={[styles.infoButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {gradedLevels.length === 0 ? (
          <View style={[styles.emptyReport, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIllustration, { backgroundColor: colors.accent }]}>
              <Ionicons name="ribbon-outline" size={34} color={colors.primary} />
              <Ionicons name="sparkles" size={17} color={colors.primary} style={styles.emptySparkle} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your report card starts here</Text>
            <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              Play 3 different game types in a level to earn your first grade.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Start a lesson"
              testID="grades-start-lesson"
              onPress={() => router.push('/categories' as any)}
              activeOpacity={0.82}
              style={[styles.startLessonButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.startLessonText, { color: colors.primaryForeground }]}>Start a lesson</Text>
              <Ionicons name="arrow-forward" size={17} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <LinearGradient
              colors={[colors.homePrimary, colors.homePrimaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.reportCard}
            >
              <GradeRing grade={overallGrade} average={overallAverage} />
              <View style={styles.reportCopy}>
                <Text style={styles.reportAverage}>{overallAverage?.toFixed(1)}% average</Text>
                <Text style={styles.reportProgress}>
                  {gradedLevels.length} of {categoryGrades.reduce((sum, row) => sum + row.totalLevels, 0)} levels graded
                </Text>
                <Text style={styles.reportBest} numberOfLines={1}>
                  Best category: {bestCategory ? `${bestCategory.category.name} (${bestCategory.grade})` : '—'}
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.statsRow}>
              <View style={[styles.statTile, { backgroundColor: colors.card }]}>
                <View style={[styles.statIcon, { backgroundColor: gradeTone('A', isDark).background }]}>
                  <Ionicons name="ribbon-outline" size={17} color={gradeTone('A', isDark).foreground} />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{aGradeCount}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>A grades</Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: colors.card }]}>
                <View style={[styles.statIcon, { backgroundColor: colors.accent }]}>
                  <Ionicons name="albums-outline" size={17} color={colors.primary} />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {gradedCategoryCount}/{categoryGrades.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Categories graded</Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: colors.card }]}>
                <View style={[styles.statIcon, { backgroundColor: gradeTone('D', isDark).background }]}>
                  <Ionicons name="trending-down-outline" size={17} color={gradeTone('D', isDark).foreground} />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{needsWorkCount}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Needs work</Text>
              </View>
            </View>

            <View style={[styles.panel, { backgroundColor: colors.card }]}>
              <View style={styles.panelHeading}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Grade breakdown</Text>
                <Text style={[styles.panelMeta, { color: colors.mutedForeground }]}>{gradedLevels.length} levels</Text>
              </View>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel="Grade breakdown across graded levels"
                accessibilityValue={{ min: 0, max: gradedLevels.length, now: gradedLevels.length }}
                style={[styles.breakdownBar, { backgroundColor: colors.muted }]}
              >
                {BAND_ORDER.map(band => {
                  const count = breakdown[band];
                  if (!count) return null;
                  const color = gradeTone(band, isDark).foreground;
                  return (
                    <View
                      key={band}
                      style={{ width: `${(count / gradedLevels.length) * 100}%`, height: '100%', backgroundColor: color }}
                    />
                  );
                })}
              </View>
              <View style={styles.legend}>
                {BAND_ORDER.map(band => (
                  <View key={band} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: gradeTone(band, isDark).foreground }]} />
                    <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{band}</Text>
                    <Text style={[styles.legendCount, { color: colors.foreground }]}>{breakdown[band]}</Text>
                  </View>
                ))}
              </View>
            </View>

            {improvements.length > 0 && (
              <View style={[styles.panel, { backgroundColor: colors.card }]}>
                <View style={styles.panelHeading}>
                  <Text style={[styles.panelTitle, { color: colors.foreground }]}>Improve next</Text>
                  <Text style={[styles.panelMeta, { color: colors.mutedForeground }]}>Your lowest graded levels</Text>
                </View>
                <View style={styles.improveList}>
                  {improvements.map((level, index) => (
                    <View
                      key={`${level.category.id}-${level.index}`}
                      style={[
                        styles.improveRow,
                        index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                      ]}
                    >
                      <View style={styles.improveCopy}>
                        <Text numberOfLines={1} style={[styles.improveTitle, { color: colors.foreground }]}>
                          {level.category.name} · Level {level.index + 1}
                        </Text>
                        <Text style={[styles.improveMeta, { color: colors.mutedForeground }]}>
                          {level.average?.toFixed(1)}% average
                        </Text>
                      </View>
                      <GradeBadge grade={level.grade} dark={isDark} compact />
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Replay ${level.category.name}, level ${level.index + 1}`}
                        testID={`grade-replay-${level.category.id}-${level.index}`}
                        onPress={() => openLevel(level.category.id, level.index)}
                        activeOpacity={0.8}
                        style={[styles.replayButton, { backgroundColor: colors.accent }]}
                      >
                        <Text style={[styles.replayText, { color: colors.primary }]}>Replay</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
              accessibilityRole="tablist"
              accessibilityLabel="Filter grade categories"
            >
              {GRADE_FILTERS.map(item => (
                <FilterChip
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  selected={currentFilter === item.id}
                  onPress={() => setFilter(item.id)}
                  colors={colors}
                />
              ))}
            </ScrollView>

        {categoryGroups.length ? categoryGroups.map(group => (
              <View key={group.title} style={styles.categoryGroup}>
                <Text style={[styles.groupHeading, { color: colors.mutedForeground }]}>{group.title.toUpperCase()}</Text>
                <View style={styles.categoryList}>
                  {group.rows.map(row => {
                    const expanded = expandedCategory === row.category.id;
                    const tone = gradeTone(row.grade, isDark);
                    const percent = row.average === null ? null : row.average.toFixed(1);
                    return (
                      <View key={row.category.id} style={styles.categoryRowWrap}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`${row.category.name}, ${row.gradedLevels} of ${row.totalLevels} levels graded, ${row.grade ?? 'not graded'}`}
                          accessibilityHint="Expands to show grades by level"
                          accessibilityState={{ expanded }}
                          testID={`category-grade-${row.category.id}`}
                          onPress={() => setExpandedCategory(expanded ? null : row.category.id)}
                          activeOpacity={0.82}
                          style={[styles.categoryRow, { backgroundColor: colors.card }]}
                        >
                          <View style={[styles.categoryIcon, { backgroundColor: row.category.bgColor }]}>
                            <MaterialCommunityIcons name={row.category.icon as any} size={23} color={row.category.accentColor} />
                          </View>
                          <View style={styles.categoryInfo}>
                            <Text numberOfLines={1} style={[styles.categoryName, { color: colors.foreground }]}>{row.category.name}</Text>
                            <View style={styles.categoryMetaRow}>
                              <Text style={[styles.gradeMeta, { color: colors.mutedForeground }]}>
                                {row.gradedLevels}/{row.totalLevels} levels graded
                              </Text>
                              {percent !== null && (
                                <Text style={[styles.gradeMeta, { color: colors.mutedForeground }]}>{percent}%</Text>
                              )}
                            </View>
                            <View
                              accessibilityRole="progressbar"
                              accessibilityLabel={`${row.category.name} grade progress`}
                              accessibilityValue={{ min: 0, max: row.totalLevels, now: row.gradedLevels }}
                              style={[styles.coverageTrack, { backgroundColor: colors.muted }]}
                            >
                              <View
                                style={[
                                  styles.coverageFill,
                                  {
                                    width: `${row.totalLevels ? (row.gradedLevels / row.totalLevels) * 100 : 0}%`,
                                    backgroundColor: row.category.accentColor,
                                  },
                                ]}
                              />
                            </View>
                          </View>
                          <View style={[styles.rowGradeBadge, { backgroundColor: tone.background }]}>
                            <Text style={[styles.rowGradeText, { color: tone.foreground }]}>{row.grade ?? '—'}</Text>
                          </View>
                          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={17} color={colors.mutedForeground} />
                        </TouchableOpacity>

                        {expanded && (
                          <Animated.View entering={FadeIn.duration(180)} style={[styles.expandedDetails, { backgroundColor: colors.card }]}>
                            <View style={styles.levelChipGrid}>
                              {row.levels.map(level => {
                                const levelTone = gradeTone(level.grade, isDark);
                                return (
                                  <View
                                    key={level.index}
                                    testID={`category-grade-${row.category.id}-level-${level.index}`}
                                    accessibilityLabel={`Level ${level.index + 1}: ${level.grade ?? 'not graded'}`}
                                    style={[styles.levelGradeChip, { backgroundColor: levelTone.background }]}
                                  >
                                    <Text style={[styles.levelChipLabel, { color: colors.mutedForeground }]}>Level {level.index + 1}</Text>
                                    <Text style={[styles.levelChipGrade, { color: levelTone.foreground }]}>{level.grade ?? '—'}</Text>
                                  </View>
                                );
                              })}
                            </View>
                            <TouchableOpacity
                              accessibilityRole="button"
                              accessibilityLabel={`Open ${row.category.name} levels`}
                              testID={`category-grade-open-${row.category.id}`}
                              onPress={() => router.push(`/levels?categoryId=${encodeURIComponent(row.category.id)}` as any)}
                              activeOpacity={0.82}
                              style={styles.openLevelsLink}
                            >
                              <Text style={[styles.openLevelsText, { color: colors.primary }]}>Open levels</Text>
                              <Ionicons name="arrow-forward" size={15} color={colors.primary} />
                            </TouchableOpacity>
                          </Animated.View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
        )) : (
              <View style={[styles.filterEmpty, { backgroundColor: colors.card }]}>
                <Ionicons name="search-outline" size={21} color={colors.mutedForeground} />
                <Text style={[styles.filterEmptyText, { color: colors.mutedForeground }]}>
                  No categories match this filter yet.
                </Text>
              </View>
        )}
      </ScrollView>

      <Modal transparent visible={sheet !== null} animationType="slide" onRequestClose={() => setSheet(null)}>
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close panel"
            onPress={() => setSheet(null)}
            style={styles.modalScrim}
          />
          <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: Math.max(bottomPad, 18) + 16 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            {sheet === 'language' ? (
              <>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Choose a language</Text>
                <Text style={[styles.sheetDescription, { color: colors.mutedForeground }]}>
                  Only languages you’ve started are shown.
                </Text>
                <View style={styles.languageOptions}>
                  {startedLanguages.map(language => (
                    <TouchableOpacity
                      key={language}
                      accessibilityRole="button"
                      accessibilityState={{ selected: language === activeLanguage }}
                      accessibilityLabel={`${LANGUAGE_META[language].label}${language === activeLanguage ? ', selected' : ''}`}
                      testID={`grades-language-${language}`}
                      onPress={() => selectLanguage(language)}
                      activeOpacity={0.8}
                      style={[
                        styles.languageOption,
                        { backgroundColor: colors.groupedBackground, borderColor: language === activeLanguage ? colors.primary : colors.border },
                      ]}
                    >
                      <Text style={styles.languageFlag}>{LANGUAGE_META[language].flag}</Text>
                      <Text style={[styles.languageOptionName, { color: colors.foreground }]}>{LANGUAGE_META[language].label}</Text>
                      {language === activeLanguage && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>How grades work</Text>
                <Text style={[styles.sheetDescription, { color: colors.mutedForeground }]}>
                  Each level is graded from your best score in at least 3 different game types. Replay a game and beat your previous best to raise the grade.
                </Text>
                <View style={styles.scaleGrid}>
                  {gradeScaleWithRanges.map(({ grade, range }) => {
                    const tone = gradeTone(grade, isDark);
                    return (
                      <View key={grade} style={[styles.scaleCell, { backgroundColor: colors.groupedBackground }]}>
                        <View style={[styles.scaleGrade, { backgroundColor: tone.background }]}>
                          <Text style={[styles.scaleGradeText, { color: tone.foreground }]}>{grade}</Text>
                        </View>
                        <Text style={[styles.scaleRange, { color: colors.mutedForeground }]}>{range}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  headerCopy: { flex: 1, gap: 7 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 33, letterSpacing: -0.7, lineHeight: 39 },
  languagePill: { alignSelf: 'flex-start', minHeight: 34, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  languageFlag: { fontSize: 18 },
  languageName: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  infoButton: { width: 42, height: 42, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  reportCard: { minHeight: 128, borderRadius: 24, paddingHorizontal: 17, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  ringWrap: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  ringGrade: { color: '#FFFFFF', fontFamily: 'Nunito_800ExtraBold', fontSize: 21 },
  reportCopy: { flex: 1, minWidth: 0, gap: 4 },
  reportAverage: { color: '#FFFFFF', fontFamily: 'Nunito_800ExtraBold', fontSize: 18, lineHeight: 23 },
  reportProgress: { color: 'rgba(255,255,255,0.92)', fontFamily: 'Nunito_700Bold', fontSize: 12, lineHeight: 17 },
  reportBest: { color: 'rgba(255,255,255,0.86)', fontFamily: 'Nunito_600SemiBold', fontSize: 11, lineHeight: 15, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 9 },
  statTile: { flex: 1, minHeight: 99, borderRadius: 18, padding: 10, justifyContent: 'space-between' },
  statIcon: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: 'Nunito_800ExtraBold', fontSize: 19, lineHeight: 23, fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: 'Nunito_700Bold', fontSize: 10, lineHeight: 13 },
  panel: { borderRadius: 20, padding: 15, gap: 13 },
  panelHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  panelTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  panelMeta: { fontFamily: 'Nunito_600SemiBold', fontSize: 11 },
  breakdownBar: { height: 11, borderRadius: 99, overflow: 'hidden', flexDirection: 'row' },
  legend: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
  legendCount: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, fontVariant: ['tabular-nums'] },
  improveList: { gap: 1 },
  improveRow: { minHeight: 56, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 9 },
  improveCopy: { flex: 1, minWidth: 0, gap: 2 },
  improveTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  improveMeta: { fontFamily: 'Nunito_600SemiBold', fontSize: 11 },
  replayButton: { minHeight: 34, paddingHorizontal: 11, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  replayText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  gradeBadge: { minWidth: 45, height: 45, paddingHorizontal: 7, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  gradeBadgeCompact: { minWidth: 38, height: 34, borderRadius: 12 },
  gradeBadgeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17 },
  gradeBadgeTextCompact: { fontSize: 14 },
  filterRow: { gap: 8, paddingVertical: 1 },
  filterChip: { minHeight: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  categoryGroup: { gap: 9 },
  groupHeading: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 1.1, marginTop: 2 },
  categoryList: { gap: 9 },
  categoryRowWrap: { gap: 0 },
  categoryRow: { minHeight: 87, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  categoryIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  categoryInfo: { flex: 1, minWidth: 0, gap: 4 },
  categoryName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, lineHeight: 18 },
  categoryMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  gradeMeta: { fontFamily: 'Nunito_600SemiBold', fontSize: 10, lineHeight: 13 },
  coverageTrack: { height: 4, borderRadius: 99, overflow: 'hidden' },
  coverageFill: { height: '100%', borderRadius: 99 },
  rowGradeBadge: { minWidth: 39, height: 36, paddingHorizontal: 5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowGradeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  expandedDetails: { marginTop: -4, padding: 12, paddingTop: 15, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  levelChipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  levelGradeChip: { minWidth: 65, minHeight: 47, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6, justifyContent: 'center', gap: 1 },
  levelChipLabel: { fontFamily: 'Nunito_700Bold', fontSize: 9 },
  levelChipGrade: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  openLevelsLink: { minHeight: 40, marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start' },
  openLevelsText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  emptyReport: { minHeight: 330, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 22, alignItems: 'center', justifyContent: 'center', gap: 11 },
  emptyIllustration: { width: 76, height: 76, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  emptySparkle: { position: 'absolute', top: 12, right: 10 },
  emptyTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, textAlign: 'center' },
  emptyDescription: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 290 },
  startLessonButton: { minHeight: 48, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 6 },
  startLessonText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  filterEmpty: { minHeight: 105, borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 18, gap: 6 },
  filterEmptyText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, textAlign: 'center' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,18,32,0.44)' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 21, paddingTop: 11, gap: 11 },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 5 },
  sheetTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 21, lineHeight: 27 },
  sheetDescription: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 19 },
  languageOptions: { gap: 8, marginTop: 4 },
  languageOption: { minHeight: 54, borderRadius: 15, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  languageOptionName: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  scaleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  scaleCell: { width: '48.4%', minHeight: 46, borderRadius: 13, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  scaleGrade: { width: 37, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scaleGradeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  scaleRange: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
});
