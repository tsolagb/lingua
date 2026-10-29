import React, { useEffect, useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { StarHistory, useGame } from '@/context/GameContext';
import { CATEGORIES, isCategoryAvailable, Language, LANGUAGE_META, SUPPORTED_LANGUAGES } from '@/data/vocabulary';
import { useColors } from '@/hooks/useColors';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { MOTION } from '@/constants/motion';

// ── helpers ────────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns the last `count` day strings ending today, newest last */
function lastNDays(count: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    result.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
  }
  return result;
}

/** Day-of-month number from "YYYY-MM-DD" */
function dayNum(dateStr: string) {
  return parseInt(dateStr.split('-')[2], 10);
}

/** Short weekday label (S M T W T F S) */
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function weekdayOf(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').getDay(); // 0=Sun
}

interface WeeklyStars {
  startDate: string;
  label: string;
  stars: number;
  isCurrent: boolean;
}

function localDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  result.setHours(12, 0, 0, 0);
  return result;
}

function getWeeklyStars(history: StarHistory): WeeklyStars[] {
  const currentWeek = startOfWeek(new Date());
  return Array.from({ length: 8 }, (_, index) => {
    const weekStart = new Date(currentWeek);
    weekStart.setDate(currentWeek.getDate() - (7 * (7 - index)));
    const nextWeek = new Date(weekStart);
    nextWeek.setDate(weekStart.getDate() + 7);
    const startDate = localDateStr(weekStart);
    const nextStartDate = localDateStr(nextWeek);
    const stars = Object.entries(history).reduce(
      (sum, [date, count]) => date >= startDate && date < nextStartDate ? sum + count : sum,
      0,
    );
    return {
      startDate,
      label: weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      stars,
      isCurrent: index === 7,
    };
  });
}

// ── sub-components ─────────────────────────────────────────────────────────────

function WeeklyStarChart({ history }: { history: StarHistory }) {
  const weeks = useMemo(() => getWeeklyStars(history), [history]);
  const maxStars = Math.max(3, ...weeks.map(week => week.stars));

  return (
    <View style={chart.card}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={chart.scroll}
      >
        {weeks.map(week => {
          const barHeight = week.stars === 0 ? 4 : Math.max(14, (week.stars / maxStars) * 112);
          return (
            <View key={week.startDate} style={chart.week}>
              <Text style={[chart.value, week.isCurrent && chart.currentText]}>{week.stars}</Text>
              <View style={chart.barArea}>
                <View
                  style={[
                    chart.bar,
                    { height: barHeight },
                    week.isCurrent && chart.currentBar,
                    week.stars === 0 && chart.emptyBar,
                  ]}
                />
              </View>
              <Text style={[chart.label, week.isCurrent && chart.currentText]}>{week.label}</Text>
            </View>
          );
        })}
      </ScrollView>
      <Text style={chart.hint}>⭐ Stars earned each week</Text>
    </View>
  );
}

const chart = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
    elevation: 2,
    gap: 10,
  },
  scroll: { paddingHorizontal: 14, gap: 10 },
  week: { width: 48, alignItems: 'center', gap: 5 },
  value: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  barArea: { height: 112, justifyContent: 'flex-end' },
  bar: { width: 30, borderRadius: 8, backgroundColor: '#4C8DFF' },
  currentBar: { backgroundColor: '#1F6FEB' },
  emptyBar: { backgroundColor: '#E5E7EB' },
  label: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  currentText: { color: '#185AC7' },
  hint: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', paddingHorizontal: 16 },
});

function StreakCalendar({ playedSet }: { playedSet: Set<string> }) {
  // Show 5 full weeks ending on today's weekday
  const today = todayStr();
  const todayWD = weekdayOf(today);
  // Pad so we start on Sunday
  const daysToShow = 35;
  const allDays = lastNDays(daysToShow);

  // Split into rows of 7
  const weeks: string[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  return (
    <View style={cal.container}>
      {/* Day-of-week header */}
      <View style={cal.row}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={cal.dayLabel}>{d}</Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={cal.row}>
          {week.map((date, di) => {
            const played  = playedSet.has(date);
            const isToday = date === today;
            const future  = date > today;
            return (
              <View
                key={di}
                style={[
                  cal.cell,
                  played  && cal.played,
                  isToday && !played && cal.todayCell,
                  future  && cal.future,
                ]}
              >
                <Text
                  style={[
                    cal.cellText,
                    played  && cal.playedText,
                    isToday && !played && cal.todayText,
                    future  && cal.futureText,
                  ]}
                >
                  {dayNum(date)}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const cal = StyleSheet.create({
  container: { gap: 4 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  dayLabel:   { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginBottom: 2 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  played:     { backgroundColor: '#1F6FEB' },
  todayCell:  { backgroundColor: '#EAF2FF', borderWidth: 1.5, borderColor: '#1F6FEB' },
  future:     { backgroundColor: '#FAFAFA' },
  cellText:   { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  playedText: { color: '#FFFFFF', fontWeight: '800' },
  todayText:  { color: '#185AC7', fontWeight: '800' },
  futureText: { color: '#D1D5DB' },
});

// ── Category mini-card ─────────────────────────────────────────────────────────

function CategoryRow({ category, language }: { category: typeof CATEGORIES[0]; language: Language }) {
  const { getLevelStars, isLevelCompleted } = useGame();
  const totalLevels    = category.levels.length;
  const completedCount = category.levels.filter((_, i) => isLevelCompleted(category.id, i)).length;
  const totalStars     = category.levels.reduce((s, _, i) => s + getLevelStars(category.id, i), 0);
  const maxStars       = totalLevels * 3;
  const pct            = totalLevels > 0 ? completedCount / totalLevels : 0;

  const filledStars = maxStars > 0 ? Math.round((totalStars / maxStars) * 3) : 0;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/levels?categoryId=${category.id}`)}
      activeOpacity={0.8}
      style={cRow.card}
    >
      <View style={[cRow.emojiBox, { backgroundColor: category.bgColor }]}>
        <Text style={cRow.emoji}>{category.emoji}</Text>
      </View>
      <View style={cRow.info}>
        <View style={cRow.topRow}>
          <Text style={cRow.name}>{category.name}</Text>
          <Text style={[cRow.levels, { color: category.accentColor }]}>
            {completedCount}/{totalLevels}
          </Text>
        </View>
        <View style={cRow.barTrack}>
          <View
            style={[
              cRow.barFill,
              {
                width: `${Math.round(pct * 100)}%` as any,
                backgroundColor: pct === 1 ? '#1F6FEB' : category.accentColor,
              },
            ]}
          />
        </View>
      </View>
      <View style={cRow.starsCol}>
        {[0, 1, 2].map(i => (
          <Ionicons
            key={i}
            name={i < filledStars ? 'star' : 'star-outline'}
            size={12}
            color={i < filledStars ? '#1F6FEB' : '#D1D5DB'}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const cRow = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emojiBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 20 },
  info:  { flex: 1, gap: 5 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:   { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  levels: { fontSize: 11, fontWeight: '700' },
  barTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3, minWidth: 4 },
  starsCol: { gap: 2, alignItems: 'center' },
});

// ── Language XP card ───────────────────────────────────────────────────────────

const LANG_CONFIG: Record<Language, { emoji: string; bgColor: string; accentColor: string; xpName: string }> = {
  italian: { emoji: '🍨', bgColor: '#EAF2FF', accentColor: '#1F6FEB', xpName: 'Gelato XP' },
  french:  { emoji: '🥐', bgColor: '#EAF2FF', accentColor: '#1F6FEB', xpName: 'Croissant XP' },
  spanish: { emoji: '🌮', bgColor: '#FFF1F2', accentColor: '#E11D48', xpName: 'Taco XP' },
  armenian: { emoji: '🍑', bgColor: '#EAF2FF', accentColor: '#1F6FEB', xpName: 'Apricot XP' },
};

function LangXPCard({
  lang,
  stars,
  xp,
  isActive,
}: {
  lang: Language;
  stars: number;
  xp: number;
  isActive: boolean;
}) {
  const cfg  = LANG_CONFIG[lang];
  const meta = LANGUAGE_META[lang];
  return (
    <View style={[xpCard.card, isActive && xpCard.active, { borderColor: isActive ? '#1F6FEB' : cfg.accentColor + '33' }]}>
      <View style={[xpCard.top, { backgroundColor: cfg.bgColor }]}>
        <Text style={xpCard.emoji}>{cfg.emoji}</Text>
        <View style={xpCard.flag}>
          <Text style={xpCard.flagText}>{meta.flag}</Text>
        </View>
      </View>
      <View style={xpCard.body}>
        <Text style={xpCard.lang}>{meta.label}</Text>
        <View style={xpCard.statRow}>
          <Text style={xpCard.statNum}>{stars}</Text>
          <Text style={xpCard.statIcon}> ⭐</Text>
        </View>
        <View style={xpCard.statRow}>
          <Text style={[xpCard.xp, { color: cfg.accentColor }]}>{xp}</Text>
          <Text style={[xpCard.xpLabel, { color: cfg.accentColor + 'AA' }]}> {cfg.xpName}</Text>
        </View>
      </View>
      {isActive && (
        <View style={xpCard.activePill}>
          <Text style={xpCard.activePillTxt}>active</Text>
        </View>
      )}
    </View>
  );
}

const xpCard = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 2px 6px rgba(0,0,0,0.06)',
    elevation: 2,
  },
  active: { borderColor: '#1F6FEB' },
  top: {
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  emoji: { fontSize: 28 },
  flag: {
    position: 'absolute',
    top: 4,
    right: 6,
  },
  flagText: { fontSize: 14 },
  body: { padding: 10, gap: 2 },
  lang: { fontSize: 11, fontWeight: '700', color: '#374151' },
  statRow: { flexDirection: 'row', alignItems: 'baseline' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  statIcon: { fontSize: 14 },
  xp: { fontSize: 15, fontWeight: '800' },
  xpLabel: { fontSize: 9, fontWeight: '600' },
  activePill: {
    position: 'absolute',
    top: 4,
    left: 6,
    backgroundColor: '#1F6FEB',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  activePillTxt: { fontSize: 8, fontWeight: '800', color: '#FFF' },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const insets    = useSafeAreaInsets();
  const colors    = useColors();
  const reduceMotion = useReduceMotion();
  const topPad    = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const {
    progress,
    currency,
    streak,
    starHistory,
    activeLanguage,
    getLevelStars,
    isLevelCompleted,
    dailyGoal,
    setDailyGoal,
    consumeDailyGoalCelebration,
    cloudSyncStatus,
    isAccountSignedIn,
  } = useGame();

  useEffect(() => {
    if (!dailyGoal.celebrationPending) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    const timer = setTimeout(
      consumeDailyGoalCelebration,
      reduceMotion ? MOTION.transitionMs : MOTION.celebrationMs,
    );
    return () => clearTimeout(timer);
  }, [dailyGoal.celebrationPending, consumeDailyGoalCelebration, reduceMotion]);

  // Played dates set for calendar
  const playedSet = useMemo(
    () => new Set(streak.playedDates ?? []),
    [streak.playedDates],
  );

  // Per-language stats
  const languages = SUPPORTED_LANGUAGES;
  const langStats = useMemo(() => {
    return languages.map(lang => {
      const prefix = `${lang}::`;
      let stars = 0;
      Object.entries(progress).forEach(([key, levels]) => {
        if (key.startsWith(prefix)) {
          Object.values(levels).forEach(lvl => { stars += lvl.stars; });
        }
      });
      return { lang, stars, xp: currency[lang] };
    });
  }, [progress, currency]);

  // Overall totals
  const totalStars     = langStats.reduce((s, l) => s + l.stars, 0);

  // Category mastery % (active language)
  const availableCategories = CATEGORIES.filter(cat => isCategoryAvailable(cat, activeLanguage));
  const masteredCats = availableCategories.filter(cat =>
    cat.levels.every((_, i) => isLevelCompleted(cat.id, i)),
  ).length;

  const daysPlayed = playedSet.size;

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#2F6BEA', '#1F57D6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: topPad + 8 }]}
      >
        <Text style={s.headerTitle}>📊  My Progress</Text>
        <Text style={s.headerSub}>Your learning journey at a glance</Text>

        {/* Hero stats strip */}
        <View style={s.heroStrip}>
          <View style={s.heroStat}>
            <Text style={s.heroNum}>{totalStars}</Text>
            <Text style={s.heroLbl}>Stars ⭐</Text>
          </View>
          <View style={s.heroDivider} />
          <View style={s.heroStat}>
            <Text style={s.heroNum}>
              {Math.min(dailyGoal.completed, dailyGoal.goal)}/{dailyGoal.goal}
            </Text>
            <Text style={s.heroLbl}>Levels today</Text>
          </View>
          <View style={s.heroDivider} />
          <View style={s.heroStat}>
            <Text style={s.heroNum}>{daysPlayed}</Text>
            <Text style={s.heroLbl}>Days played</Text>
          </View>
          <View style={s.heroDivider} />
          <View style={s.heroStat}>
            <Text style={s.heroNum}>{streak.current}</Text>
            <Text style={s.heroLbl}>🔥 Streak</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: bottomPad + 80 }]}
      >
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => router.push('/account' as unknown as Href)}
          accessibilityRole="button"
          accessibilityLabel={isAccountSignedIn ? 'Open learner account and sync status' : 'Sign in to sync your progress'}
          style={[
            s.accountSyncCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[s.accountSyncIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name={isAccountSignedIn ? 'cloud-done-outline' : 'cloud-upload-outline'} size={21} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.accountSyncTitle, { color: colors.foreground }]}>
              {isAccountSignedIn ? 'Learner account' : 'Sync your progress'}
            </Text>
            <Text style={[s.accountSyncSub, { color: colors.mutedForeground }]}>
              {isAccountSignedIn
                ? cloudSyncStatus === 'synced'
                  ? 'Progress is synced across devices'
                  : cloudSyncStatus === 'syncing'
                    ? 'Syncing your learning…'
                    : cloudSyncStatus === 'error'
                      ? 'Saved on this device; sync will retry'
                      : 'Account progress'
                : 'Sign in to keep your learning across devices'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {dailyGoal.celebrationPending && (
          <Animated.View
            entering={reduceMotion ? FadeIn.duration(MOTION.transitionMs) : ZoomIn.duration(MOTION.transitionMs)}
            exiting={reduceMotion ? FadeOut.duration(120) : ZoomOut.duration(MOTION.transitionMs)}
            style={s.celebration}
            pointerEvents="none"
          >
            <Text style={s.celebrationIcon}>★</Text>
            <View style={s.celebrationCopy}>
              <Text style={s.celebrationTitle}>Daily goal complete!</Text>
              <Text style={s.celebrationText}>Fantastic practice today!</Text>
            </View>
            <Text style={s.celebrationSpark}>✦</Text>
          </Animated.View>
        )}

        {/* ── Daily goal ── */}
        <Animated.View entering={FadeInDown.duration(MOTION.transitionMs)} style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Daily goal</Text>
            <Text style={s.goalCount}>
              {dailyGoal.completed}/{dailyGoal.goal} levels today
            </Text>
          </View>
          <View style={s.goalCard}>
            <View style={s.goalCopy}>
              <View style={s.goalIcon}>
                <Ionicons name="flag" size={20} color="#1F6FEB" />
              </View>
              <View style={s.goalWords}>
                <Text style={s.goalTitle}>How many levels today?</Text>
                <Text style={s.goalHint}>Choose a goal that feels achievable.</Text>
              </View>
            </View>
            <View style={s.goalOptions}>
              {[1, 2, 3, 4, 5].map(goal => {
                const selected = dailyGoal.goal === goal;
                return (
                  <TouchableOpacity
                    key={goal}
                    activeOpacity={0.75}
                    onPress={() => setDailyGoal(goal)}
                    style={[s.goalOption, selected && s.goalOptionSelected]}
                    accessibilityRole="button"
                    accessibilityLabel={`Set daily goal to ${goal} ${goal === 1 ? 'level' : 'levels'}`}
                    accessibilityState={{ selected }}
                    testID={`daily-goal-${goal}`}
                  >
                    <Text style={[s.goalOptionText, selected && s.goalOptionTextSelected]}>
                      {goal}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={s.goalTrack}>
              <View
                style={[
                  s.goalFill,
                  {
                    width: `${Math.min(100, (dailyGoal.completed / dailyGoal.goal) * 100)}%` as any,
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        {/* ── Language XP Cards ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Stars & XP by language</Text>
          <View style={s.langRow}>
            {langStats.map(({ lang, stars, xp }) => (
              <LangXPCard
                key={lang}
                lang={lang}
                stars={stars}
                xp={xp}
                isActive={lang === activeLanguage}
              />
            ))}
          </View>
        </View>

        {/* ── Weekly stars ── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Stars by week</Text>
            <Text style={s.chartRange}>Last 8 weeks</Text>
          </View>
          <WeeklyStarChart history={starHistory} />
        </View>

        {/* ── Streak calendar ── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Streak calendar</Text>
            <View style={s.streakBadge}>
              <Text style={s.streakBadgeText}>🔥 {streak.current} day streak</Text>
            </View>
          </View>
          <View style={s.calCard}>
            {playedSet.size === 0 ? (
              <Text style={s.emptyMsg}>Complete a level today to start your streak! 🚀</Text>
            ) : (
              <StreakCalendar playedSet={playedSet} />
            )}
            <View style={s.calLegend}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#1F6FEB' }]} />
                <Text style={s.legendTxt}>Played</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#EAF2FF', borderWidth: 1.5, borderColor: '#1F6FEB' }]} />
                <Text style={s.legendTxt}>Today</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#F3F4F6' }]} />
                <Text style={s.legendTxt}>Not played</Text>
              </View>
              {streak.longest > 0 && (
                <Text style={s.bestStreak}>Best: {streak.longest} days 🏆</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Category mastery ── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Category mastery</Text>
            <Text style={s.masteryBadge}>{masteredCats}/{availableCategories.length} complete</Text>
          </View>
          <Text style={s.sectionSub}>Showing progress in {LANGUAGE_META[activeLanguage].flag} {LANGUAGE_META[activeLanguage].label}</Text>
          <View style={s.catList}>
            {availableCategories.map(cat => (
              <CategoryRow key={cat.id} category={cat} language={activeLanguage} />
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  accountSyncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  accountSyncIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountSyncTitle: { fontSize: 15, fontWeight: '700' },
  accountSyncSub: { fontSize: 12, lineHeight: 17, marginTop: 3 },

  // ── Header ──
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  headerSub:   { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 12 },

  heroStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignSelf: 'stretch',
  },
  heroStat:    { flex: 1, alignItems: 'center' },
  heroNum:     { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  heroLbl:     { fontSize: 9, fontWeight: '600', color: 'rgba(0,0,0,0.55)', textAlign: 'center', marginTop: 1 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginVertical: 4 },

  celebration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#1F6FEB',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
    boxShadow: '0px 4px 10px rgba(24,90,199,0.16)',
    elevation: 4,
  },
  celebrationIcon: { fontSize: 30, color: '#1F6FEB' },
  celebrationCopy: { flex: 1 },
  celebrationTitle: { fontSize: 16, fontWeight: '800', color: '#185AC7' },
  celebrationText: { fontSize: 12, fontWeight: '600', color: '#1F6FEB', marginTop: 1 },
  celebrationSpark: { fontSize: 24, color: '#1F6FEB' },

  // ── Scroll ──
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 24 },

  // ── Sections ──
  section:     { gap: 10 },
  sectionRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:{ fontSize: 15, fontWeight: '800', color: '#1F2937' },
  sectionSub:  { fontSize: 12, fontWeight: '500', color: '#6B7280', marginTop: -4 },
  goalCount: { fontSize: 12, fontWeight: '800', color: '#185AC7' },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
    elevation: 2,
  },
  goalCopy: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  goalWords: { flex: 1 },
  goalTitle: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  goalHint: { fontSize: 11, fontWeight: '500', color: '#6B7280', marginTop: 2 },
  goalOptions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  goalOption: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  goalOptionSelected: { backgroundColor: '#1F6FEB', borderColor: '#185AC7' },
  goalOptionText: { fontSize: 16, fontWeight: '800', color: '#6B7280' },
  goalOptionTextSelected: { color: '#FFFFFF' },
  goalTrack: { height: 7, borderRadius: 4, backgroundColor: '#DBEAFE', overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 4, backgroundColor: '#1F6FEB', minWidth: 3 },

  streakBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#1F6FEB',
  },
  streakBadgeText: { fontSize: 12, fontWeight: '700', color: '#185AC7' },

  masteryBadge: { fontSize: 12, fontWeight: '700', color: '#1F6FEB' },
  chartRange: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },

  // ── Language row ──
  langRow: { flexDirection: 'row', gap: 8 },

  // ── Calendar ──
  calCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  calLegend: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendTxt:  { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  bestStreak: { fontSize: 11, fontWeight: '700', color: '#1F6FEB', marginLeft: 'auto' },
  emptyMsg:   { fontSize: 13, fontWeight: '500', color: '#9CA3AF', textAlign: 'center', paddingVertical: 16 },

  // ── Category list ──
  catList: { gap: 7 },

});
