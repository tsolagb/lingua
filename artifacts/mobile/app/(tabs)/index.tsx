import React, { useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from '@/components/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '@/context/GameContext';
import { CATEGORIES, isCategoryAvailable, LANGUAGE_META, SUPPORTED_LANGUAGES } from '@/data/vocabulary';
import { GUIDED_CATEGORY_ID, getGuidedLevelCount } from '@/data/guided-curriculum';
import { trackEvent } from '@/lib/analytics';
import { useColors } from '@/hooks/useColors';
import { GlassPanel, PressScale } from '@/components/HomeGlass';
import { fontFamilies, typography } from '@/constants/typography';
import { DailyChallengeCard } from '@/components/arcade/DailyChallengeCard';
import * as Haptics from 'expo-haptics';

type Colors = ReturnType<typeof useColors>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const {
    totalCompleted,
    activeLanguage,
    setLanguage,
    getLevelStars,
    isLevelCompleted,
    dueReviewPairs,
    dueGuidedSentences,
    streak,
    currency,
  } = useGame();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const guidedLevelCount = getGuidedLevelCount();
  const guidedIndex = Array.from({ length: guidedLevelCount }, (_, index) => index)
    .find(index => !isLevelCompleted(GUIDED_CATEGORY_ID, index)) ?? guidedLevelCount;
  const guidedSpot = guidedIndex >= guidedLevelCount
    ? 'All Milestones and Levels complete'
    : guidedIndex === 0
      ? 'Milestone 1 · Level 1'
      : `Milestone ${Math.floor(guidedIndex / 9) + 1} · Level ${guidedIndex % 9 + 1}`;
  const hasLearningProgress = totalCompleted > 0;
  const availableCategories = CATEGORIES.filter(category => isCategoryAvailable(category, activeLanguage));
  const totalLevels = availableCategories.reduce((sum, category) => sum + category.levels.length, 0) + guidedLevelCount;
  const maxXp = totalLevels * 3;
  const activeXp = currency[activeLanguage];
  const xpProgress = maxXp > 0 ? Math.min(1, activeXp / maxXp) : 0;
  const totalStars = availableCategories.reduce(
    (sum, category) =>
      sum + category.levels.reduce((levelSum, _, index) => levelSum + getLevelStars(category.id, index), 0),
    0,
  ) + Array.from({ length: guidedLevelCount }, (_, index) =>
    getLevelStars(GUIDED_CATEGORY_ID, index),
  ).reduce((sum, stars) => sum + stars, 0);
  const languages = SUPPORTED_LANGUAGES;
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const dueCount = dueReviewPairs.length + dueGuidedSentences.length;
  const activeMeta = LANGUAGE_META[activeLanguage];
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const weekday = today.getDay();
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - weekday + index);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      label: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
      number: date.getDate(),
    };
  });
  const playedDates = new Set(streak.playedDates ?? []);

  return (
    <View style={[styles.root, { backgroundColor: colors.groupedBackground }]}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad + 22 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.brandHeader}>
            <View style={styles.headerIntro}>
              <Text accessibilityLabel="Lingua" style={[styles.wordmark, { color: colors.mutedForeground }]}>LINGUA</Text>
              <Text style={[styles.todayTitle, { color: colors.foreground }]}>Today</Text>
              <Text style={[styles.todayDate, { color: colors.mutedForeground }]}>
                {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <View
                accessibilityRole="text"
                accessibilityLabel={`Current streak ${streak.current} days. Best streak ${streak.longest} days.`}
                style={[styles.headerStreak, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name="flame" size={15} color={colors.homeAccent} />
                <Text style={[styles.headerStreakText, { color: colors.foreground }]}>{streak.current}</Text>
              </View>
              <PressScale
                onPress={() => setLanguageDropdownOpen(open => !open)}
                accessibilityRole="button"
                accessibilityLabel={`Learning language: ${activeMeta.label}. Choose a language.`}
                accessibilityState={{ expanded: languageDropdownOpen }}
                testID="language-picker-toggle"
                scaleTo={0.95}
              >
                <GlassPanel radius={18} style={styles.languageTab}>
                  <Text style={styles.languageFlag}>{activeMeta.flag}</Text>
                  <Text numberOfLines={1} style={[styles.languageTabLabel, { color: colors.foreground }]}>
                    {activeMeta.label}
                  </Text>
                  <Ionicons
                    name={languageDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={13}
                    color={colors.mutedForeground}
                  />
                </GlassPanel>
              </PressScale>
            </View>
          </View>

          {languageDropdownOpen && (
            <View style={styles.dropdownWrap}>
              <GlassPanel radius={18} style={styles.languageDropdownList}>
                {languages.map(language => {
                  const meta = LANGUAGE_META[language];
                  const selected = language === activeLanguage;
                  return (
                    <PressScale
                      key={language}
                      onPress={() => {
                        setLanguage(language);
                        setLanguageDropdownOpen(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${meta.label}, ${meta.nativeLabel}${selected ? ', selected' : ''}`}
                      accessibilityState={{ selected }}
                      scaleTo={0.98}
                    >
                      <View
                        style={[
                          styles.languageOption,
                          { backgroundColor: selected ? colors.homePrimary + '16' : 'transparent' },
                        ]}
                      >
                        <View style={styles.languageOptionCopy}>
                          <Text style={[styles.languageOptionName, { color: colors.foreground }]}>
                            {meta.flag} {meta.label}
                          </Text>
                          <Text style={[styles.languageOptionNative, { color: colors.mutedForeground }]}>
                            {meta.nativeLabel}
                          </Text>
                        </View>
                        {selected && <Ionicons name="checkmark-circle" size={19} color={colors.homePrimary} />}
                      </View>
                    </PressScale>
                  );
                })}
              </GlassPanel>
            </View>
          )}

          <GlassPanel radius={20} style={styles.weekCard}>
            <View style={styles.weekHeading}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>THIS WEEK</Text>
              <Text style={[styles.weekBest, { color: colors.mutedForeground }]}>Best streak · {streak.longest} days</Text>
            </View>
            <View style={styles.weekStrip}>
              {weekDays.map(day => {
                const played = playedDates.has(day.key);
                const isToday = day.key === todayKey;
                return (
                  <View key={day.key} style={styles.weekDay}>
                    <Text style={[styles.weekDayLabel, { color: colors.mutedForeground }]}>{day.label}</Text>
                    <View style={[
                      styles.weekDayDot,
                      { backgroundColor: played ? colors.homePrimary : isToday ? colors.accent : colors.muted },
                      isToday && { borderColor: colors.homePrimary, borderWidth: 1.5 },
                    ]}>
                      {played && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                      {!played && <Text style={[styles.weekDayNumber, { color: colors.mutedForeground }]}>{day.number}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </GlassPanel>

          <View style={styles.mainActions}>
            <PressScale
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                trackEvent('learning_cta_clicked', { state: hasLearningProgress ? 'continue' : 'start', section: 'lessons' });
                router.push('/categories');
              }}
              accessibilityRole="button"
              accessibilityLabel={`${guidedIndex === 0 ? 'Start learning' : 'Keep going'}. ${guidedSpot}`}
              scaleTo={0.95}
              style={[styles.actionShadow, { boxShadow: `0px 7px 13px ${toRgba(colors.homePrimary, 0.24)}` }]}
            >
              <LinearGradient colors={[colors.homePrimary, colors.homePrimaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionCard}>
                <Ionicons name="book" size={25} color="#FFFFFF" />
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>{guidedIndex === 0 ? 'Start learning' : 'Keep going'}</Text>
                  <Text style={styles.actionSubtitle} numberOfLines={2}>{guidedSpot}</Text>
                </View>
                <Ionicons name="arrow-forward" size={17} color="rgba(255,255,255,0.9)" style={styles.actionArrow} />
              </LinearGradient>
            </PressScale>
            <PressScale
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                router.push('/categories?tab=games' as any);
              }}
              accessibilityRole="button"
              accessibilityLabel="Practice. Open games and daily challenge."
              testID="lessons-tab-games"
              scaleTo={0.95}
              style={[styles.actionShadow, { boxShadow: `0px 7px 13px ${toRgba(colors.homeAccent, 0.24)}` }]}
            >
              <LinearGradient colors={['#8063C8', '#5D428F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionCard}>
                <Ionicons name="game-controller" size={26} color="#FFFFFF" />
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>Practice</Text>
                  <Text style={styles.actionSubtitle} numberOfLines={2}>Games &amp; daily challenge</Text>
                </View>
                <Ionicons name="arrow-forward" size={17} color="rgba(255,255,255,0.9)" style={styles.actionArrow} />
              </LinearGradient>
            </PressScale>
          </View>

          <DailyChallengeCard compact testID="home-daily-challenge" />
          <View style={[styles.xpProgress, { backgroundColor: colors.card }]}>
            <View style={styles.xpProgressHeading}>
              <Text style={[styles.xpProgressLabel, { color: colors.foreground }]}>{activeMeta.flag}  {activeXp.toLocaleString()} XP</Text>
              <Text style={[styles.xpProgressLabel, { color: colors.mutedForeground }]}>{maxXp.toLocaleString()} XP</Text>
            </View>
            <View accessibilityRole="progressbar" accessibilityLabel={`${activeMeta.label} XP progress`} accessibilityValue={{ min: 0, max: maxXp, now: activeXp }} testID="home-xp-progress" style={[styles.xpProgressTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.xpProgressFill, { width: `${xpProgress * 100}%`, backgroundColor: colors.homePrimary }]} />
            </View>
          </View>

          <Text style={[styles.practiceLabel, { color: colors.mutedForeground }]}>YOUR PROGRESS</Text>
          <View style={styles.statsRow}>
            <Stat value={String(totalCompleted)} label="levels done" tint={colors.homePrimary} colors={colors} />
            <Stat value={String(totalStars)} label="stars earned" tint={colors.homeAccent} colors={colors} />
            <Stat value={String(Math.max(totalLevels - totalCompleted, 0))} label="to explore" tint={colors.mutedForeground} colors={colors} />
          </View>

          <Text style={[styles.practiceLabel, { color: colors.mutedForeground }]}>PRACTICE</Text>

          <PressScale
            onPress={() => router.push('/mistake-review' as any)}
            accessibilityRole="button"
            accessibilityLabel={`Fix your mistakes. ${dueCount} ${dueCount === 1 ? 'word needs' : 'words need'} practice in ${activeMeta.label}`}
            testID="start-due-review"
            scaleTo={0.985}
            style={[styles.reviewLip, { backgroundColor: colors.homePrimaryDark }]}
          >
            <View style={[styles.reviewCard, { backgroundColor: colors.homePrimary }]}>
              <View style={[styles.reviewIconWrap, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Ionicons name="refresh" size={19} color="#FFFFFF" />
              </View>
              <View style={styles.flex}>
                <Text style={styles.reviewCount} numberOfLines={1}>Fix your mistakes</Text>
                <Text style={styles.reviewSub} numberOfLines={1}>
                  {dueCount > 0
                    ? `${dueCount} ${dueCount === 1 ? 'word' : 'words'} to practice`
                    : 'You’re all caught up'}
                </Text>
              </View>
              {dueCount > 0 && (
                <View style={styles.reviewBadge}>
                  <Text style={styles.reviewBadgeText}>{dueCount > 99 ? '99+' : dueCount}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.9)" />
            </View>
          </PressScale>

          <PressScale
            onPress={() => Linking.openURL('https://www.buymeacoffee.com/ThomasApps')}
            accessibilityRole="link"
            scaleTo={0.95}
            style={styles.supportWrap}
          >
            <View style={styles.supportLink}>
              <Ionicons name="heart-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.supportText, { color: colors.mutedForeground }]}>Support this little app</Text>
            </View>
          </PressScale>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, tint, colors }: { value: string; label: string; tint: string; colors: Colors }) {
  return (
    <View style={[styles.statItem, { backgroundColor: colors.card }]}>
      <View style={[styles.statDot, { backgroundColor: tint }]} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const homeFontFamily = fontFamilies.bold;

function toRgba(hex: string, opacity: number) {
  const match = /^#?([\da-f]{6})$/i.exec(hex);
  if (!match) return `rgba(0,0,0,${opacity})`;
  const value = match[1];
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${opacity})`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 10, gap: 15 },
  brandHeader: { minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  headerIntro: { flex: 1, minWidth: 0 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  wordmark: { ...typography.micro, fontFamily: homeFontFamily, letterSpacing: 1.6 },
  todayTitle: { ...typography.largeTitle, fontFamily: homeFontFamily, lineHeight: 36 },
  todayDate: { ...typography.caption, fontFamily: homeFontFamily, marginTop: 2 },
  headerStreak: { minHeight: 34, minWidth: 48, paddingHorizontal: 10, borderRadius: 99, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  headerStreakText: { fontFamily: homeFontFamily, fontSize: 12, fontWeight: '700' },
  weekCard: { padding: 14, gap: 12 },
  weekHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { ...typography.micro, fontFamily: homeFontFamily, letterSpacing: 1 },
  weekBest: { fontFamily: homeFontFamily, fontSize: 10, fontWeight: '600' },
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 6 },
  weekDayLabel: { fontFamily: homeFontFamily, fontSize: 10, fontWeight: '600' },
  weekDayDot: { width: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  weekDayNumber: { fontFamily: homeFontFamily, fontSize: 10, fontWeight: '500' },
  languageTab: { minHeight: 36, maxWidth: 132, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 9, paddingRight: 10 },
  languageFlag: { fontSize: 14 },
  globeDot: { width: 24, height: 24, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  languageTabLabel: { maxWidth: 86, flexShrink: 1, fontFamily: homeFontFamily, fontSize: 13, fontWeight: '600' },
  dropdownWrap: { width: 232, alignSelf: 'flex-end', marginTop: -6 },
  mainActions: { flexDirection: 'row', gap: 11, width: '100%' },
  actionShadow: { flex: 1, minWidth: 0, borderRadius: 22, elevation: 4 },
  actionCard: { height: 150, borderRadius: 22, padding: 15, justifyContent: 'space-between', overflow: 'hidden' },
  actionCopy: { gap: 1, paddingRight: 2 },
  actionTitle: { color: '#FFFFFF', fontFamily: fontFamilies.extraBold, fontSize: 19, lineHeight: 24 },
  actionSubtitle: { color: 'rgba(255,255,255,0.88)', fontFamily: fontFamilies.semiBold, fontSize: 11, lineHeight: 15 },
  actionArrow: { position: 'absolute', right: 13, top: 15 },
  xpProgress: { borderRadius: 15, paddingHorizontal: 13, paddingVertical: 10, gap: 7 },
  xpProgressHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpProgressLabel: { fontFamily: homeFontFamily, fontSize: 11, fontWeight: '700' },
  xpProgressTrack: { height: 5, borderRadius: 6, overflow: 'hidden' },
  xpProgressFill: { height: '100%', borderRadius: 6 },
  languageDropdownList: { padding: 5, gap: 2 },
  languageOption: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 13 },
  languageOptionCopy: { flex: 1, gap: 2 },
  languageOptionName: { fontFamily: homeFontFamily, fontSize: 14, fontWeight: '600' },
  languageOptionNative: { fontFamily: homeFontFamily, fontSize: 12 },
  xpCard: { paddingHorizontal: 13, paddingVertical: 10 },
  xpInner: { gap: 8 },
  xpHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  xpLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  xpLabel: { fontFamily: homeFontFamily, fontSize: 13, fontWeight: '600' },
  xpValue: { fontFamily: homeFontFamily, fontSize: 12, fontWeight: '500', fontVariant: ['tabular-nums'] },
  xpTrack: { height: 6, borderRadius: 99, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 99 },
  progressCard: { padding: 15, gap: 13 },
  progressHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardKicker: { fontFamily: homeFontFamily, fontSize: 11, fontWeight: '600', letterSpacing: 0.4, marginBottom: 3 },
  cardTitle: { ...typography.title, fontFamily: homeFontFamily },
  progressIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 9 },
  statItem: {
    flex: 1,
    borderRadius: 17,
    paddingVertical: 13,
    paddingHorizontal: 10,
    boxShadow: '0px 3px 8px rgba(0,0,0,0.045)',
    elevation: 1,
  },
  statDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 6 },
  statValue: { fontFamily: homeFontFamily, fontSize: 20, fontWeight: '600', letterSpacing: -0.2, fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: homeFontFamily, fontSize: 10, marginTop: 1, fontWeight: '500' },
  ctaShadow: { borderRadius: 20, boxShadow: '0px 8px 14px rgba(0,0,0,0.28)', elevation: 4 },
  cta: { minHeight: 128, paddingHorizontal: 18, paddingVertical: 17, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ctaWords: { gap: 3, flex: 1 },
  ctaEyebrow: { fontFamily: homeFontFamily, fontSize: 11, fontWeight: '500', letterSpacing: 0.1 },
  ctaText: { ...typography.title, fontFamily: homeFontFamily },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  heroFlag: { fontSize: 13 },
  heroXp: { fontFamily: homeFontFamily, color: 'rgba(255,255,255,0.92)', fontSize: 11, fontWeight: '600' },
  heroTrack: { width: 54, height: 4, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.32)', overflow: 'hidden' },
  heroFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 9 },
  continuePill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 9 },
  continueText: { fontFamily: homeFontFamily, fontSize: 11, fontWeight: '700' },
  practiceLabel: { ...typography.micro, fontFamily: homeFontFamily, letterSpacing: 1, marginTop: 2, marginBottom: -3 },
  reviewLip: { width: '100%', borderRadius: 20, paddingBottom: 4, marginBottom: 4 },
  reviewCard: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 10 },
  practiceDivider: { height: StyleSheet.hairlineWidth, marginLeft: 52 },
  reviewIconWrap: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  reviewBadge: { minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFC53D' },
  reviewBadgeText: { fontFamily: fontFamilies.extraBold, fontSize: 11, color: '#1E2A44' },
  reviewCount: { fontFamily: fontFamilies.extraBold, fontSize: 16, color: '#FFFFFF' },
  reviewSub: { fontFamily: fontFamilies.semiBold, fontSize: 12, marginTop: 2, lineHeight: 16, color: 'rgba(255,255,255,0.86)' },
  streakCard: { borderRadius: 20, overflow: 'hidden' },
  streakInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  streakIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  streakNumber: { fontFamily: homeFontFamily, fontSize: 17, fontWeight: '600' },
  streakText: { fontFamily: homeFontFamily, fontSize: 12, marginTop: 3 },
  bestStreak: { borderRadius: 12, paddingHorizontal: 11, paddingVertical: 6, alignItems: 'center' },
  bestValue: { fontFamily: homeFontFamily, fontSize: 18, fontWeight: '600' },
  bestLabel: { fontFamily: homeFontFamily, fontSize: 9, fontWeight: '600', letterSpacing: 0.4 },
  supportWrap: { alignSelf: 'center' },
  supportLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10 },
  supportText: { fontFamily: homeFontFamily, fontSize: 12, fontWeight: '500' },
});
