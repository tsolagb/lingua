import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View, useWindowDimensions } from '@/components/native';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { useColors } from '@/hooks/useColors';
import { fontFamilies } from '@/constants/typography';
import type { WordPair } from '@/data/vocabulary';
import { ChunkyButton, GameShell, tapHaptic } from '@/components/arcade/GameShell';
import { ARCADE_CATALOG } from '@/lib/arcade/catalog';
import { useArcadeRound } from '@/lib/arcade/useArcadeRound';
import { useCountdown } from '@/lib/arcade/useCountdown';
import { getShortWordPairs, pickDistractors, shuffle, starsFor } from '@/lib/arcade/vocab';

const META = ARCADE_CATALOG['speed-swipe'];
const SECONDS = 60;
const THRESHOLD = 90;

interface Card { pair: WordPair; shownEnglish: string; isMatch: boolean; id: number }

export default function SpeedSwipe() {
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const { width } = useWindowDimensions();
  const { activeLanguage, recordWordAnswer } = useGame();
  const { playCorrect, playWrong } = useSound();
  const pool = useMemo(() => getShortWordPairs(activeLanguage, 18), [activeLanguage]);
  const queue = useRef<WordPair[]>([]);
  const idRef = useRef(0);
  const stats = useRef({ score: 0, correct: 0, answered: 0, streak: 0, best: 0, busy: false });
  const [card, setCard] = useState<Card | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const shake = useRef(new Animated.Value(0)).current;

  const nextCard = useCallback((): Card => {
    if (!queue.current.length) queue.current = shuffle(pool);
    const pair = queue.current.pop()!;
    const wantMatch = Math.random() < 0.5;
    // Distractors never share the target's foreign form (e.g. house/home both "casa"),
    // so a valid synonym is never presented as a false pair.
    const decoy = wantMatch ? undefined : pickDistractors(pool, pair, activeLanguage, 1)[0];
    const shownEnglish = decoy?.english ?? pair.english;
    return { pair, shownEnglish, isMatch: !decoy, id: ++idRef.current };
  }, [activeLanguage, pool]);

  const game = useArcadeRound('speed-swipe', () => {
    stats.current = { score: 0, correct: 0, answered: 0, streak: 0, best: 0, busy: false };
    queue.current = shuffle(pool);
    setScore(0); setStreak(0); setFeedback(null);
    pan.setValue({ x: 0, y: 0 });
    setCard(nextCard());
  });
  const playing = game.phase === 'playing';
  const finishRef = useRef(game.finish);
  finishRef.current = game.finish;
  const secondsLeft = useCountdown(SECONDS, playing, () => {
    const s = stats.current;
    const accuracy = s.answered ? s.correct / s.answered : 0;
    finishRef.current(s.score, accuracy < 0.6 ? Math.min(1, starsFor(s.correct, [6, 14, 22])) : starsFor(s.correct, [6, 14, 22]), s.correct + s.best);
  });

  const cardRef = useRef(card);
  cardRef.current = card;

  const answer = useCallback((saysMatch: boolean) => {
    const c = cardRef.current;
    const s = stats.current;
    if (!c || s.busy) return;
    s.busy = true;
    const right = saysMatch === c.isMatch;
    s.answered += 1;
    if (right) {
      s.correct += 1; s.streak += 1; s.best = Math.max(s.best, s.streak);
      s.score += 10 + Math.min(20, s.streak * 2);
      tapHaptic('success'); playCorrect();
    } else {
      s.streak = 0;
      tapHaptic('error'); playWrong();
      recordWordAnswer(c.pair.english, false, undefined, undefined, activeLanguage);
      if (!reduceMotion) Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
    if (right && c.isMatch) recordWordAnswer(c.pair.english, true, undefined, undefined, activeLanguage);
    setScore(s.score); setStreak(s.streak); setFeedback(right ? 'good' : 'bad');
    Animated.timing(pan, { toValue: { x: (saysMatch ? 1 : -1) * width * 1.2, y: 40 }, duration: reduceMotion ? 0 : 220, useNativeDriver: true }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      setFeedback(null);
      setCard(nextCard());
      s.busy = false;
    });
  }, [activeLanguage, nextCard, pan, playCorrect, playWrong, recordWordAnswer, reduceMotion, shake, width]);
  const answerRef = useRef(answer);
  answerRef.current = answer;

  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
    onStartShouldSetPanResponder: () => false,
    onPanResponderMove: (_, g) => pan.setValue({ x: g.dx, y: g.dy * 0.25 }),
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > THRESHOLD || Math.abs(g.vx) > 0.8) answerRef.current(g.dx > 0);
      else Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start(),
  }), [pan]);

  const rotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-14deg', '0deg', '14deg'] });
  const greenGlow = pan.x.interpolate({ inputRange: [0, THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const redGlow = pan.x.interpolate({ inputRange: [-THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const onFire = streak >= 5;

  return (
    <GameShell
      {...game.shell}
      gameId="speed-swipe"
      secondsLeft={secondsLeft}
      progress={secondsLeft / SECONDS}
      footer={game.shell.error ? <ChunkyButton onPress={game.retry} color={META.color}>Retry save</ChunkyButton> : undefined}
    >
      <View style={styles.top}>
        <Text style={[styles.score, { color: colors.foreground }]}>{score}</Text>
        <View style={[styles.streak, { backgroundColor: onFire ? '#F59E0B' : colors.muted }]} accessibilityLabel={`Streak ${streak}`}>
          <Ionicons name="flame" size={16} color={onFire ? '#FFFFFF' : colors.mutedForeground} />
          <Text style={[styles.streakText, { color: onFire ? '#FFFFFF' : colors.mutedForeground }]}>{streak}</Text>
        </View>
      </View>
      <View style={styles.deck}>
        {card ? (
          <Animated.View
            key={card.id}
            {...responder.panHandlers}
            style={[styles.cardLip, { backgroundColor: colors.border, transform: [{ translateX: Animated.add(pan.x, shakeX) }, { translateY: pan.y }, { rotate }] }]}
            accessibilityLabel={`${card.pair.translations[activeLanguage]} means ${card.shownEnglish}?`}
          >
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: feedback === 'good' ? '#20B486' : feedback === 'bad' ? '#E5484D' : colors.border }]}>
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.glow, { backgroundColor: '#20B48633', opacity: greenGlow }]} />
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.glow, { backgroundColor: '#E5484D33', opacity: redGlow }]} />
              <Animated.View style={[styles.stamp, styles.stampRight, { opacity: greenGlow }]}><Text style={[styles.stampText, { color: '#13875F' }]}>MATCH</Text></Animated.View>
              <Animated.View style={[styles.stamp, styles.stampLeft, { opacity: redGlow }]}><Text style={[styles.stampText, { color: '#B42328' }]}>NOPE</Text></Animated.View>
              <Text style={[styles.word, { color: colors.foreground }]} adjustsFontSizeToFit numberOfLines={2}>{card.pair.translations[activeLanguage]}</Text>
              <View style={[styles.eq, { backgroundColor: META.color + '22' }]}><Ionicons name="swap-vertical" size={20} color={META.color} /></View>
              <Text style={[styles.english, { color: colors.mutedForeground }]} numberOfLines={2} adjustsFontSizeToFit>{card.shownEnglish}</Text>
            </View>
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.buttons}>
        <ChunkyButton onPress={() => answer(false)} color="#E5484D" style={styles.btn} accessibilityLabel="Not a match" testID="speed-swipe-no">
          <Ionicons name="close" size={30} color="#FFFFFF" />
        </ChunkyButton>
        <ChunkyButton onPress={() => answer(true)} color="#20B486" style={styles.btn} accessibilityLabel="Match" testID="speed-swipe-yes">
          <Ionicons name="checkmark" size={30} color="#FFFFFF" />
        </ChunkyButton>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  score: { fontFamily: fontFamilies.extraBold, fontSize: 28 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  streakText: { fontFamily: fontFamilies.extraBold, fontSize: 15 },
  deck: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  cardLip: { width: '100%', maxWidth: 360, borderRadius: 30, paddingBottom: 6 },
  card: { minHeight: 260, borderRadius: 30, borderWidth: 3, alignItems: 'center', justifyContent: 'center', padding: 22, gap: 14, overflow: 'hidden' },
  glow: { borderRadius: 28 },
  stamp: { position: 'absolute', top: 18, borderWidth: 3, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  stampRight: { left: 18, borderColor: '#13875F', transform: [{ rotate: '-12deg' }] },
  stampLeft: { right: 18, borderColor: '#B42328', transform: [{ rotate: '12deg' }] },
  stampText: { fontFamily: fontFamilies.extraBold, fontSize: 18, letterSpacing: 1 },
  word: { fontFamily: fontFamilies.extraBold, fontSize: 34, textAlign: 'center' },
  eq: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  english: { fontFamily: fontFamilies.bold, fontSize: 22, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 16, paddingHorizontal: 24, paddingTop: 8 },
  btn: { flex: 1 },
});
