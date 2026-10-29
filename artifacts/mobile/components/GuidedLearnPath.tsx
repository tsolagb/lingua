import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from '@/components/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { GUIDED_CATEGORY_ID, GUIDED_LEVELS_PER_MILESTONE, GUIDED_MILESTONES, getGuidedCurrentLevelIndex, getGuidedLevelCount, getGuidedLevel } from '@/data/guided-curriculum';
import { GuidedTipsSheet } from '@/components/GuidedTipsSheet';
import { useGuidedPathReturn } from '@/lib/guided-path-events';
import { buildPathItems, CHEST_AFTER_LEVEL, CHEST_CATEGORY_ID, itemHeight, levelFocus, ROW_H, themeFor, type PathItem } from '@/lib/guided-path-presentation';
import { ChestRow, DividerRow, FooterRow, LevelRow } from '@/components/guided-path/PathRows';
import { LevelSheet, LockedModal, MilestoneCompleteModal } from '@/components/guided-path/PathOverlays';
import { useSound } from '@/hooks/useSound';
import { MOTION } from '@/constants/motion';

const PATH_ITEMS = buildPathItems().reverse();
const PATH_OFFSETS: number[] = [];
let PATH_HEIGHT = 0;
for (const item of PATH_ITEMS) {
  PATH_OFFSETS.push(PATH_HEIGHT);
  PATH_HEIGHT += itemHeight(item);
}
const currentItemIndex = (globalIndex: number) => PATH_ITEMS.findIndex(item => item.kind === 'level' && item.globalIndex === globalIndex);
const itemOffset = (index: number, viewport: number) => Math.max(0, Math.min(Math.max(0, PATH_HEIGHT - viewport), PATH_OFFSETS[index] - (viewport - ROW_H.level) / 2));

export function GuidedLearnPath() {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const reduceMotion = useReduceMotion();
  const { width } = useWindowDimensions();
  const game = useGame();
  const { activeLanguage, isLevelCompleted, getLevelStars, streak, currency, claimGuidedChest } = game;
  const { event, consume } = useGuidedPathReturn();
  const { playCorrect } = useSound();
  const listRef = useRef<FlatList<PathItem>>(null);
  const viewportHeight = useRef(500);
  const didInitialJump = useRef(false);
  const claimPendingRef = useRef(false);
  const [scrollY, setScrollY] = useState(0);
  const [visibleMilestone, setVisibleMilestone] = useState(0);
  const [tipsMilestone, setTipsMilestone] = useState<number | null>(null);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ milestoneIndex: number; levelIndex: number } | null>(null);
  const [celebrateIndex, setCelebrateIndex] = useState<number | null>(null);
  const [milestoneDone, setMilestoneDone] = useState<{ milestoneIndex: number; xp: number } | null>(null);
  const [gemPending, setGemPending] = useState<number | null>(null);
  const [gemError, setGemError] = useState<{ m: number; msg: string } | null>(null);
  const totalLevels = getGuidedLevelCount();
  const currentLevel = getGuidedCurrentLevelIndex(isLevelCompleted);
  const pathComplete = currentLevel >= totalLevels;
  const activeGlobalIndex = pathComplete ? totalLevels - 1 : currentLevel;
  const currentMilestone = Math.floor(activeGlobalIndex / GUIDED_LEVELS_PER_MILESTONE);
  const shownMilestone = Math.min(visibleMilestone, GUIDED_MILESTONES.length - 1);
  const activeItemIndex = currentItemIndex(activeGlobalIndex);
  const currentOffset = itemOffset(activeItemIndex, viewportHeight.current);
  const contentWidth = Math.min(width, 520);
  const xp = currency[activeLanguage] ?? 0;
  const scrollToCurrent = useCallback((animated: boolean) => {
    const targetGlobal = pathComplete ? totalLevels - 1 : currentLevel;
    const index = currentItemIndex(targetGlobal);
    if (index < 0) return;
    listRef.current?.scrollToOffset({ offset: itemOffset(index, viewportHeight.current), animated: animated && !reduceMotion });
  }, [currentLevel, pathComplete, reduceMotion, totalLevels]);

  useEffect(() => {
    if (!didInitialJump.current) return;
    const timer = setTimeout(() => scrollToCurrent(true), 160);
    return () => clearTimeout(timer);
  }, [activeLanguage, currentLevel, scrollToCurrent]);

  useEffect(() => {
    if (!event) return;
    if (!event.passed || event.language !== activeLanguage) { consume(); return; }
    setCelebrateIndex(event.globalLevelIndex);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (event.isCheckpoint) {
      if (!game.isMuted) playCorrect();
      const timer = setTimeout(() => setMilestoneDone({
        milestoneIndex: Math.floor(event.globalLevelIndex / GUIDED_LEVELS_PER_MILESTONE),
        xp: event.xp,
      }), reduceMotion ? 200 : 900);
      return () => clearTimeout(timer);
    }
    const done = setTimeout(() => { setCelebrateIndex(null); consume(); }, reduceMotion ? 350 : MOTION.celebrationMs);
    return () => clearTimeout(done);
  }, [event, activeLanguage, consume, reduceMotion, playCorrect, game.isMuted]);

  const closeMilestoneDone = () => {
    setMilestoneDone(null);
    setCelebrateIndex(null);
    consume();
    setTimeout(() => scrollToCurrent(true), 120);
  };
  const openLevel = useCallback((milestoneIndex: number, levelIndex: number) => {
    const globalIndex = milestoneIndex * GUIDED_LEVELS_PER_MILESTONE + levelIndex;
    if (globalIndex > currentLevel) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setLockedMessage(globalIndex % GUIDED_LEVELS_PER_MILESTONE === 0
        ? `Finish Milestone ${milestoneIndex} to open the next milestone.`
        : `Complete the earlier levels in Milestone ${milestoneIndex + 1} first.`);
      return;
    }
    setSheet({ milestoneIndex, levelIndex });
  }, [currentLevel]);
  const pushLesson = (milestoneIndex: number, levelIndex: number) => {
    router.push({ pathname: '/guided-lesson', params: { milestoneIndex: String(milestoneIndex), levelIndex: String(levelIndex) } } as never);
  };
  const startLevel = () => {
    if (!sheet) return;
    const target = sheet;
    setSheet(null);
    pushLesson(target.milestoneIndex, target.levelIndex);
  };
  const openBossBattle = useCallback((milestoneIndex: number) => {
    router.push(`/play-game?game=boss-battle&milestone=${milestoneIndex}` as never);
  }, []);
  const claimGem = useCallback(async (milestoneIndex: number) => {
    if (claimPendingRef.current) return;
    claimPendingRef.current = true;
    setGemPending(milestoneIndex);
    setGemError(null);
    try {
      const ok = await claimGuidedChest(milestoneIndex);
      if (ok) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      else setGemError({ m: milestoneIndex, msg: 'Couldn’t save your power-up. Try again.' });
    } catch {
      setGemError({ m: milestoneIndex, msg: 'Couldn’t save your power-up. Try again.' });
    } finally {
      claimPendingRef.current = false;
      setGemPending(null);
    }
  }, [claimGuidedChest]);

  const renderItem = ({ item }: { item: PathItem }) => {
    if (item.kind === 'footer') return <FooterRow complete={pathComplete} />;
    const milestoneIndex = item.milestoneIndex;
    const theme = themeFor(milestoneIndex);
    if (item.kind === 'divider') {
      const locked = milestoneIndex * GUIDED_LEVELS_PER_MILESTONE > currentLevel && !pathComplete;
      return <DividerRow milestoneIndex={milestoneIndex} theme={theme} locked={locked}
        complete={currentLevel >= (milestoneIndex + 1) * GUIDED_LEVELS_PER_MILESTONE} onTips={setTipsMilestone} width={contentWidth} />;
    }
    if (item.kind === 'chest') {
      const first = milestoneIndex * GUIDED_LEVELS_PER_MILESTONE;
      const claimed = isLevelCompleted(CHEST_CATEGORY_ID, milestoneIndex);
      const ready = currentLevel >= first + CHEST_AFTER_LEVEL + 1;
      return <ChestRow milestoneIndex={milestoneIndex} width={contentWidth} theme={theme}
        state={claimed ? 'claimed' : ready ? 'ready' : 'locked'} pending={gemPending === milestoneIndex}
        error={gemError?.m === milestoneIndex ? gemError.msg : null} available={ready} reduceMotion={reduceMotion} onClaim={claimGem} />;
    }
    const globalIndex = item.globalIndex;
    const completed = isLevelCompleted(GUIDED_CATEGORY_ID, globalIndex);
    const unlocked = globalIndex <= currentLevel || pathComplete;
    let title = `Level ${item.levelIndex + 1}`;
    let exerciseCount: number | null = null;
    try {
      const level = getGuidedLevel(activeLanguage, milestoneIndex, item.levelIndex);
      title = level.title.replace(/ · Level \d+$/, ` · Level ${item.levelIndex + 1}`);
      exerciseCount = level.exercises.length;
    } catch { /* curriculum fallback retains a useful level label */ }
    return <LevelRow milestoneIndex={milestoneIndex} levelIndex={item.levelIndex} globalIndex={globalIndex} lane={item.lane}
      width={contentWidth} theme={theme} completed={completed} stars={getLevelStars(GUIDED_CATEGORY_ID, globalIndex)}
      unlocked={unlocked} isCurrent={!pathComplete && globalIndex === currentLevel} celebrate={celebrateIndex === globalIndex}
      bounce={celebrateIndex === globalIndex} reduceMotion={reduceMotion} showBorderControl={item.levelIndex === 8 && (pathComplete || currentLevel >= (milestoneIndex + 1) * GUIDED_LEVELS_PER_MILESTONE)}
      title={title} exerciseCount={exerciseCount} onBoard={() => openLevel(milestoneIndex, item.levelIndex)} onPress={openLevel} onBorderControl={openBossBattle} />;
  };

  const showJump = didInitialJump.current
    && Math.abs(scrollY - currentOffset) > Math.max(160, viewportHeight.current * 0.28);
  const skyColors = (dark
    ? ['#0B1830', themeFor(shownMilestone).deep, '#111E37']
    : [themeFor(shownMilestone).soft, '#E7F1FF', '#F6F3EB']) as [string, string, string];
  return <View style={[styles.root, { backgroundColor: dark ? '#0A172C' : '#E8F1FC' }]}>
    <LinearGradient colors={skyColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
    <View style={styles.topBar}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to Lessons" testID="guided-path-back" onPress={() => router.dismissTo('/categories')}
        style={[styles.iconBtn, { backgroundColor: dark ? '#14233D' : '#FFFDF8', borderColor: dark ? '#30476D' : '#C7D9F0' }]}>
        <Ionicons name="arrow-back" size={20} color={colors.foreground} />
      </TouchableOpacity>
      <View style={styles.stats}>
        <Stat icon="flame" value={streak.current} label={`${streak.current} day streak`} tint="#F28A1E" />
        <Stat icon="flash" value={xp} label={`${xp} XP`} tint="#E8A50E" />
        <Stat icon="heart" value="5" label="5 hearts per lesson" tint="#E8478E" />
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open Passport" testID="guided-path-passport" onPress={() => router.push('/journey-passport' as never)}
        style={[styles.iconBtn, { backgroundColor: dark ? '#14233D' : '#FFFDF8', borderColor: dark ? '#30476D' : '#C7D9F0' }]}>
        <Ionicons name="id-card" size={19} color={colors.homePrimary} />
      </TouchableOpacity>
    </View>
    <View style={[styles.milestoneBar, { backgroundColor: dark ? 'rgba(17,30,52,0.94)' : 'rgba(255,253,248,0.9)' }]}>
      <View style={styles.milestoneCopy}>
        <Text style={[styles.milestoneEyebrow, { color: colors.homePrimary }]}>{pathComplete ? 'CLIMB COMPLETE' : `MILESTONE ${shownMilestone + 1} OF 30`}</Text>
        <Text style={[styles.milestoneTitle, { color: colors.foreground }]} numberOfLines={1}>{GUIDED_MILESTONES[shownMilestone].title}</Text>
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open Guidebook for Milestone ${shownMilestone + 1}`} testID="guided-path-tips-book"
        onPress={() => setTipsMilestone(shownMilestone)} style={[styles.guideButton, { backgroundColor: dark ? '#182B49' : '#FFFFFF', borderColor: dark ? '#30476D' : '#C8D9EF' }]}>
        <View testID="guided-path-tips"><Ionicons name="book" size={17} color={colors.homePrimary} /></View><Text style={[styles.guideText, { color: colors.foreground }]}>Guidebook</Text>
      </TouchableOpacity>
    </View>
    <View accessible accessibilityRole="progressbar" accessibilityLabel={`Milestone ${shownMilestone + 1} of 30`}
      accessibilityValue={{ min: 1, max: 30, now: shownMilestone + 1 }} style={[styles.progressTrack, { backgroundColor: dark ? '#294267' : '#AEC6E4' }]} pointerEvents="none">
      <View style={[styles.progressFill, { width: `${Math.max(3, (shownMilestone + 1) / 30 * 100)}%`, backgroundColor: colors.homePrimary }]} />
      <View style={[styles.progressDot, { left: `${Math.max(2, (shownMilestone + 1) / 30 * 100)}%` }]} />
    </View>
    <FlatList ref={listRef} data={PATH_ITEMS} keyExtractor={item => item.key} renderItem={renderItem}
      extraData={[activeLanguage, currentLevel, gemPending, gemError, pathComplete, contentWidth, dark]}
      getItemLayout={(_, index) => ({ length: itemHeight(PATH_ITEMS[index]), offset: PATH_OFFSETS[index], index })}
      initialNumToRender={8} maxToRenderPerBatch={8} windowSize={9} removeClippedSubviews
      showsVerticalScrollIndicator={false} scrollEventThrottle={32}
      onScroll={e => {
        const y = e.nativeEvent.contentOffset.y;
        setScrollY(y);
        const center = y + viewportHeight.current / 2;
        const index = PATH_ITEMS.findIndex((candidate, i) => center >= PATH_OFFSETS[i] && center < PATH_OFFSETS[i] + itemHeight(candidate));
        const visible = PATH_ITEMS[index];
        if (visible && visible.kind !== 'footer') setVisibleMilestone(visible.milestoneIndex);
      }}
      style={styles.list} contentContainerStyle={{ alignItems: 'center' }}
      onLayout={e => {
        viewportHeight.current = e.nativeEvent.layout.height;
        if (!didInitialJump.current) {
          didInitialJump.current = true;
          setVisibleMilestone(currentMilestone);
          requestAnimationFrame(() => scrollToCurrent(false));
        }
      }} />
    {celebrateIndex !== null && celebrateIndex % GUIDED_LEVELS_PER_MILESTONE === GUIDED_LEVELS_PER_MILESTONE - 1 ? (
      <Animated.View entering={reduceMotion ? undefined : FadeIn} exiting={reduceMotion ? undefined : FadeOut} pointerEvents="none" style={styles.levelUpBanner}>
        <Ionicons name="arrow-up-circle" size={18} color="#FFFFFF" /><Text style={styles.levelUpText}>MILESTONE COMPLETE</Text>
      </Animated.View>
    ) : null}
    {showJump ? <Animated.View entering={reduceMotion ? undefined : FadeIn} exiting={reduceMotion ? undefined : FadeOut} style={styles.jumpWrap}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Jump to current level" testID="guided-path-jump-current"
        onPress={() => { void Haptics.selectionAsync().catch(() => {}); scrollToCurrent(true); }} style={styles.jump}>
        <Ionicons name="arrow-down" size={16} color="#FFFFFF" /><Text style={styles.jumpText}>Latest lesson</Text>
      </TouchableOpacity>
    </Animated.View> : null}
    {tipsMilestone !== null ? <GuidedTipsSheet visible milestoneIndex={tipsMilestone} language={activeLanguage} onClose={() => setTipsMilestone(null)} /> : null}
    <LevelSheet target={sheet} language={activeLanguage} stars={sheet ? getLevelStars(GUIDED_CATEGORY_ID, sheet.milestoneIndex * 9 + sheet.levelIndex) : 0}
      onStart={startLevel} onClose={() => setSheet(null)} reduceMotion={reduceMotion} />
    <LockedModal message={lockedMessage} onClose={() => setLockedMessage(null)} />
    <MilestoneCompleteModal milestoneIndex={milestoneDone?.milestoneIndex ?? null} xp={milestoneDone?.xp ?? 0}
      isFinal={milestoneDone?.milestoneIndex === 29} onNext={closeMilestoneDone} reduceMotion={reduceMotion} />
  </View>;
}

function Stat({ icon, value, label, tint }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string | number; label: string; tint: string }) {
  return <View style={styles.statPill} accessibilityRole="text" accessibilityLabel={label}>
    <Ionicons name={icon} size={13} color={tint} /><Text style={styles.statText} numberOfLines={1}>{value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingTop: 5, paddingBottom: 4 },
  iconBtn: { width: 37, height: 37, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stats: { flex: 1, flexDirection: 'row', gap: 5, minWidth: 0 },
  statPill: { flex: 1, height: 35, minWidth: 0, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.76)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4 },
  statText: { fontFamily: 'Nunito_800ExtraBold', color: '#1D3153', fontSize: 11 },
  milestoneBar: { marginHorizontal: 11, marginBottom: 4, minHeight: 56, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestoneCopy: { flex: 1, minWidth: 0, gap: 1 },
  milestoneEyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9, letterSpacing: 1.1 },
  milestoneTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, lineHeight: 19 },
  guideButton: { height: 36, borderRadius: 11, paddingHorizontal: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  guideText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10 },
  list: { flex: 1 },
  progressTrack: { height: 3, marginHorizontal: 15, marginBottom: 3, borderRadius: 3 },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3 },
  progressDot: { position: 'absolute', width: 9, height: 9, top: -3, marginLeft: -5, borderRadius: 5, backgroundColor: '#FFFDF8', borderWidth: 2, borderColor: '#2F6BEA' },
  levelUpBanner: { position: 'absolute', top: 108, alignSelf: 'center', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#2F6BEA', flexDirection: 'row', alignItems: 'center', gap: 7 },
  levelUpText: { color: '#FFFFFF', fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.8 },
  jumpWrap: { position: 'absolute', right: 18, bottom: 18 },
  jump: { height: 42, borderRadius: 21, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2F6BEA' },
  jumpText: { color: '#FFFFFF', fontFamily: 'Nunito_800ExtraBold', fontSize: 11 },
});
