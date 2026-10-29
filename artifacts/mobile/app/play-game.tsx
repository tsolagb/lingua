import React from 'react';
import { StyleSheet, Text, View } from '@/components/native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { fontFamilies } from '@/constants/typography';
import { ChunkyButton } from '@/components/arcade/GameShell';
import { isArcadeGameId, type ArcadeCatalogId } from '@/lib/arcade/catalog';
import WordRain from '@/components/arcade/WordRain';
import SpeedSwipe from '@/components/arcade/SpeedSwipe';
import LetterChain from '@/components/arcade/LetterChain';
import GenderSort from '@/components/arcade/GenderSort';
import ListenTap from '@/components/arcade/ListenTap';
import SayIt from '@/components/arcade/SayIt';
import Dictation from '@/components/arcade/Dictation';
import ConjugationSlots from '@/components/arcade/ConjugationSlots';
import ChatSimulator from '@/components/arcade/ChatSimulator';
import PathStories from '@/components/arcade/PathStories';
import OddOneOut from '@/components/arcade/OddOneOut';
import FixSentence from '@/components/arcade/FixSentence';
import DailyChallenge from '@/components/arcade/DailyChallenge';
import BossBattle from '@/components/arcade/BossBattle';

const GAMES: Record<ArcadeCatalogId, React.ComponentType> = {
  'word-rain': WordRain,
  'speed-swipe': SpeedSwipe,
  'letter-chain': LetterChain,
  'gender-sort': GenderSort,
  'listen-tap': ListenTap,
  'say-it': SayIt,
  dictation: Dictation,
  'conjugation-slots': ConjugationSlots,
  'odd-one-out': OddOneOut,
  'chat-simulator': ChatSimulator,
  'path-stories': PathStories,
  'fix-sentence': FixSentence,
  'boss-battle': BossBattle,
  'daily-challenge': DailyChallenge,
};

export default function PlayGameScreen() {
  const { game, milestone } = useLocalSearchParams<{ game?: string; milestone?: string }>();
  const colors = useColors();
  if (isArcadeGameId(game)) {
    const Game = GAMES[game];
    return <Game key={`${game}-${milestone ?? ''}`} />;
  }
  return (
    <View style={[styles.root, { backgroundColor: colors.groupedBackground }]}>
      <View style={[styles.icon, { backgroundColor: colors.accent }]}>
        <Ionicons name="game-controller-outline" size={44} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>That game wandered off</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>Pick one from the Games tab and jump right back in.</Text>
      <ChunkyButton onPress={() => router.replace('/categories?tab=games' as any)} testID="play-game-back" style={{ alignSelf: 'stretch' }}>
        Back to games
      </ChunkyButton>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  icon: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fontFamilies.extraBold, fontSize: 24, textAlign: 'center' },
  body: { fontFamily: fontFamilies.semiBold, fontSize: 15, textAlign: 'center', marginBottom: 8 },
});
