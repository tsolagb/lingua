import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from '@/components/native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { fontFamilies } from '@/constants/typography';
import { LANGUAGE_META } from '@/data/vocabulary';
import {
  dailyStreak,
  formatCountdown,
  lastNDays,
  nextUtcReset,
  readDailyHistory,
  utcDateKey,
} from '@/lib/arcade/daily';

export function useUtcClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function useDailyStatus() {
  const { progress, activeLanguage } = useGame();
  const now = useUtcClock();
  const today = utcDateKey(now);
  const history = useMemo(() => readDailyHistory(progress, activeLanguage), [progress, activeLanguage]);
  const keys = useMemo(() => new Set(history.map(h => h.dateKey)), [history]);
  const todayEntry = history.find(h => h.dateKey === today) ?? null;
  return {
    now, today, history, keys, todayEntry,
    streak: dailyStreak(keys, today),
    countdown: formatCountdown(nextUtcReset(now) - now.getTime()),
    language: activeLanguage,
  };
}

const GOLD = '#FFC53D';
const GOLD_LIP = '#D99A0B';
const INK = '#1E2A44';

export function DailyChallengeCard({ compact = false, testID }: { compact?: boolean; testID?: string }) {
  const colors = useColors();
  const { today, keys, todayEntry, streak, countdown, language } = useDailyStatus();
  const done = !!todayEntry;
  const days = lastNDays(today, compact ? 7 : 14);
  const open = () => router.push('/play-game?game=daily-challenge' as any);
  const label = `Today's challenge in ${LANGUAGE_META[language].label}. ${done ? `Completed, score ${todayEntry!.score}.` : 'Not played yet.'} New questions in ${countdown}, at midnight UTC. Daily streak ${streak}.`;

  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={testID ?? 'home-daily-challenge'}
        onPress={open}
        style={({ pressed }) => [styles.compactLip, { backgroundColor: colors.homePrimaryDark, transform: [{ translateY: pressed ? 2 : 0 }] }]}
      >
        <View style={[styles.compact, { backgroundColor: colors.homePrimary }]}>
          <View style={[styles.compactBadge, { backgroundColor: done ? GOLD : 'rgba(255,255,255,0.18)' }]}>
            <Ionicons name={done ? 'checkmark' : 'calendar'} size={20} color={done ? INK : '#FFFFFF'} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.compactTitle} numberOfLines={1}>Today's challenge</Text>
            <Text style={styles.compactSub} numberOfLines={1}>
              {done ? `Done · ${todayEntry!.score} pts · resets in ${countdown}` : `10 questions · resets in ${countdown}`}
            </Text>
          </View>
          <View style={styles.dots}>
            {days.map(d => (
              <View key={d} style={[styles.dot, { backgroundColor: keys.has(d) ? GOLD : 'rgba(255,255,255,0.28)' }]} />
            ))}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID ?? 'daily-challenge-card'}
      onPress={open}
      style={({ pressed }) => [styles.lip, { backgroundColor: colors.homePrimaryDark, transform: [{ translateY: pressed ? 3 : 0 }] }]}
    >
      <View style={[styles.face, { backgroundColor: colors.homePrimary }]}>
        <View style={styles.blobA} pointerEvents="none" />
        <View style={styles.blobB} pointerEvents="none" />
        <View style={styles.topRow}>
          <View style={styles.kickerPill}>
            <Ionicons name="sparkles" size={12} color={INK} />
            <Text style={styles.kicker}>DAILY</Text>
          </View>
          <View style={styles.streak} accessibilityLabel={`${streak} day daily streak`}>
            <Ionicons name="flame" size={15} color={GOLD} />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        </View>
        <Text style={styles.title}>Today's challenge</Text>
        <Text style={styles.sub}>
          {done ? `You scored ${todayEntry!.score}. Replays are practice.` : 'Ten questions. Everyone gets the same set today.'}
        </Text>
        <View style={styles.strip}>
          {days.map(d => (
            <View
              key={d}
              style={[
                styles.cell,
                { backgroundColor: keys.has(d) ? GOLD : 'rgba(255,255,255,0.2)' },
                d === today && styles.cellToday,
              ]}
            />
          ))}
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.flex}>
            <Text style={styles.timer}>{countdown}</Text>
            <Text style={styles.timerLabel}>until new questions · 00:00 UTC</Text>
          </View>
          <View style={styles.goldLip}>
            <View style={styles.gold}>
              <Text style={styles.goldText}>{done ? 'Practice' : 'Play'}</Text>
              <Ionicons name="arrow-forward" size={16} color={INK} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  lip: { borderRadius: 26, paddingBottom: 6, marginBottom: 20 },
  face: { borderRadius: 26, padding: 18, gap: 8, overflow: 'hidden' },
  blobA: { position: 'absolute', right: -40, top: -50, width: 170, height: 150, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.1)', transform: [{ rotate: '24deg' }] },
  blobB: { position: 'absolute', right: 40, bottom: -60, width: 110, height: 110, borderRadius: 44, backgroundColor: 'rgba(255,197,61,0.16)', transform: [{ rotate: '-18deg' }] },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kickerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GOLD, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  kicker: { fontFamily: fontFamilies.extraBold, fontSize: 11, letterSpacing: 1.2, color: INK },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.16)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  streakText: { fontFamily: fontFamilies.extraBold, fontSize: 14, color: '#FFFFFF' },
  title: { fontFamily: fontFamilies.extraBold, fontSize: 26, color: '#FFFFFF', letterSpacing: -0.4, marginTop: 4 },
  sub: { fontFamily: fontFamilies.semiBold, fontSize: 14, lineHeight: 19, color: 'rgba(255,255,255,0.88)' },
  strip: { flexDirection: 'row', gap: 4, marginTop: 6 },
  cell: { flex: 1, height: 10, borderRadius: 4 },
  cellToday: { borderWidth: 2, borderColor: '#FFFFFF' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  timer: { fontFamily: fontFamilies.extraBold, fontSize: 22, color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  timerLabel: { fontFamily: fontFamilies.semiBold, fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  goldLip: { backgroundColor: GOLD_LIP, borderRadius: 16, paddingBottom: 4 },
  gold: { minHeight: 46, minWidth: 108, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: GOLD, borderRadius: 16, paddingHorizontal: 16 },
  goldText: { fontFamily: fontFamilies.extraBold, fontSize: 16, color: INK },
  compactLip: { borderRadius: 20, paddingBottom: 4 },
  compact: { minHeight: 64, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  compactBadge: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  compactTitle: { fontFamily: fontFamilies.extraBold, fontSize: 16, color: '#FFFFFF' },
  compactSub: { fontFamily: fontFamilies.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.86)', marginTop: 2, fontVariant: ['tabular-nums'] },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});

export default DailyChallengeCard;
