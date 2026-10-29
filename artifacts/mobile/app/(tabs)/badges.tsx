import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from '@/components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/context/GameContext';
import { ALL_BADGES, Badge } from '@/data/badges';

const GROUP_LABELS: Record<string, string> = {
  progress: '🚀  Progress',
  stars:    '⭐  Stars',
  streak:   '🔥  Streak',
  mastery:  '🏆  Mastery',
};

const GROUP_ORDER = ['progress', 'stars', 'streak', 'mastery'];

function BadgeCard({ badge, earned }: { badge: Badge; earned: boolean }) {
  return (
    <View style={[card.wrap, earned ? card.earned : card.locked]}>
      <Text style={[card.emoji, !earned && card.lockedEmoji]}>
        {earned ? badge.emoji : '🔒'}
      </Text>
      <Text style={[card.title, !earned && card.lockedText]} numberOfLines={1}>
        {badge.title}
      </Text>
      <Text style={[card.desc, !earned && card.lockedText]} numberOfLines={2}>
        {badge.description}
      </Text>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    width: '47%',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  earned: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1F6FEB',
  },
  locked: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  emoji: { fontSize: 38 },
  lockedEmoji: { opacity: 0.4 },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  desc: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 15,
  },
  lockedText: { color: '#9CA3AF' },
});

export default function BadgesScreen() {
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { earnedBadgeIds } = useGame();
  const earnedCount = earnedBadgeIds.size;
  const totalCount  = ALL_BADGES.length;

  const byGroup = GROUP_ORDER.map(group => ({
    group,
    badges: ALL_BADGES.filter(b => b.group === group),
  }));

  return (
    <View style={s.root}>
      {/* Header */}
      <LinearGradient
        colors={['#2F6BEA', '#1F57D6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: topPad + 8 }]}
      >
        <Text style={s.headerTitle}>🏅  My Badges</Text>
        <Text style={s.headerSub}>Collect them all by reaching milestones!</Text>

        {/* Progress pill */}
        <View style={s.countPill}>
          <Text style={s.countText}>
            {earnedCount} / {totalCount} earned
          </Text>
        </View>

        {/* Progress bar */}
        <View style={s.barTrack}>
          <View
            style={[
              s.barFill,
              { width: `${Math.round((earnedCount / totalCount) * 100)}%` as any },
            ]}
          />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: bottomPad + 90 }]}
      >
        {byGroup.map(({ group, badges }) => (
          <View key={group} style={s.section}>
            <Text style={s.sectionTitle}>{GROUP_LABELS[group]}</Text>
            <View style={s.grid}>
              {badges.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={earnedBadgeIds.has(badge.id)}
                />
              ))}
            </View>
          </View>
        ))}

        {earnedCount === totalCount && (
          <View style={s.allEarned}>
            <Text style={s.allEarnedEmoji}>🎉</Text>
            <Text style={s.allEarnedTitle}>All badges collected!</Text>
            <Text style={s.allEarnedSub}>You are a true LinguaMatch champion!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  headerSub:   {
    fontSize: 13, fontWeight: '600',
    color: 'rgba(255,255,255,0.85)', textAlign: 'center',
  },

  countPill: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  countText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  barTrack: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    marginTop: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    minWidth: 8,
  },

  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 24 },

  section:      { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },

  allEarned: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  allEarnedEmoji: { fontSize: 48 },
  allEarnedTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  allEarnedSub:   { fontSize: 14, fontWeight: '500', color: '#6B7280' },
});
