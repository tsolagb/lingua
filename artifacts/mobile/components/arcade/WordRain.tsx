import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from '@/components/native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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
import { MOTION } from '@/constants/motion';

const META = ARCADE_CATALOG['word-rain'];
const MAX_CORRECT = 15;
const LIVES = 3;
const SECONDS = 60;
const BUBBLE_W = 132;

interface Drop { key: string; pair: WordPair; isTarget: boolean; x: number; delay: number; duration: number }

function Bubble({
  drop, label, floor, onLand, onTap, color, dark, locked,
}: {
  locked: boolean; drop: Drop; label: string; floor: number; onLand: (d: Drop) => void; onTap: (d: Drop) => boolean; color: string; dark: string;
}) {
  const y = useSharedValue(-70);
  const pop = useSharedValue(1);
  const shake = useSharedValue(0);
  const [state, setState] = useState<'falling' | 'hit' | 'wrong'>('falling');
  const landRef = useRef(onLand);
  landRef.current = onLand;
  const landed = useCallback(() => landRef.current(drop), [drop]);
  useEffect(() => {
    y.value = withDelay(drop.delay, withTiming(floor, { duration: drop.duration, easing: Easing.linear }, finished => {
      if (finished) runOnJS(landed)();
    }));
    return () => cancelAnimation(y);
  }, [drop, floor, landed, y]);
  const st = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { translateX: shake.value }, { scale: pop.value }],
    opacity: pop.value,
  }));
  return (
    <Animated.View style={[styles.bubbleWrap, { left: drop.x }, st]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={state !== 'falling' || locked}
        onPress={() => {
          const correct = onTap(drop);
          cancelAnimation(y);
          if (correct) {
            setState('hit');
            pop.value = withSequence(withSpring(1.3, { damping: 6 }), withTiming(0, { duration: 160 }));
          } else {
            setState('wrong');
            shake.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(-5, { duration: 50 }), withTiming(0, { duration: 50 }));
            pop.value = withDelay(260, withTiming(0, { duration: 220 }));
          }
        }}
        style={[styles.bubbleLip, { backgroundColor: state === 'wrong' ? '#B42328' : dark }]}
      >
        <View style={[styles.bubble, { backgroundColor: state === 'wrong' ? '#E5484D' : state === 'hit' ? '#20B486' : color }]}>
          <Text style={styles.bubbleText} numberOfLines={2} adjustsFontSizeToFit>{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function WordRain() {
  const colors = useColors();
  const { activeLanguage, recordWordAnswer } = useGame();
  const { playCorrect, playWrong } = useSound();
  const pool = useMemo(() => getShortWordPairs(activeLanguage, 14), [activeLanguage]);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<WordPair | null>(null);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [lives, setLives] = useState(LIVES);
  const [correct, setCorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const stateRef = useRef({ lives: LIVES, correct: 0, score: 0, combo: 0, roundDone: false, best: 0 });
  const queueRef = useRef<WordPair[]>([]);
  const targetRef = useRef<WordPair | null>(null);
  targetRef.current = target;

  const reset = () => {
    stateRef.current = { lives: LIVES, correct: 0, score: 0, combo: 0, roundDone: false, best: 0 };
    queueRef.current = shuffle(pool);
    setLives(LIVES); setCorrect(0); setScore(0); setCombo(0); setRound(0); setTarget(null); setDrops([]);
  };
  const game = useArcadeRound('word-rain', reset);
  const playing = game.phase === 'playing';
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const end = useCallback(() => {
    const s = stateRef.current;
    game.finish(s.score, starsFor(s.correct, [5, 10, 14]), s.correct * 2 + s.best);
  }, [game]);
  const endRef = useRef(end);
  endRef.current = end;

  const secondsLeft = useCountdown(SECONDS, playing, () => endRef.current());

  const spawn = useCallback(() => {
    if (!area.w || !area.h) return;
    if (!queueRef.current.length) queueRef.current = shuffle(pool);
    const t = queueRef.current.pop()!;
    const level = stateRef.current.correct;
    const distractorCount = Math.min(4, 2 + Math.floor(level / 4));
    const distractors = pickDistractors(pool, t, activeLanguage, distractorCount);
    const lanes = Math.max(2, Math.floor(area.w / (BUBBLE_W + 6)));
    const laneW = area.w / lanes;
    const laneOrder = shuffle(Array.from({ length: lanes }, (_, i) => i));
    const base = Math.max(3200, 7200 - level * 270);
    const all = shuffle([t, ...distractors]);
    const next: Drop[] = all.map((pair, i) => ({
      key: `${round}-${pair.english}-${i}`,
      pair,
      isTarget: pair.english === t.english,
      x: laneOrder[i % lanes] * laneW + Math.max(0, (laneW - BUBBLE_W) / 2),
      delay: i * 380 + (i >= lanes ? 900 : 0),
      duration: base * (0.85 + Math.random() * 0.3),
    }));
    stateRef.current.roundDone = false;
    setTarget(t);
    setDrops(next);
    setRound(r => r + 1);
  }, [activeLanguage, area.h, area.w, pool, round]);

  useEffect(() => {
    if (playing && !target && area.h > 0) spawn();
  }, [playing, target, area.h, spawn]);

  const advance = () => {
    const s = stateRef.current;
    if (s.lives <= 0 || s.correct >= MAX_CORRECT) { endRef.current(); return; }
    setTimeout(() => setTarget(null), MOTION.wrongPauseMs);
  };

  const onLand = useCallback((d: Drop) => {
    if (!d.isTarget || stateRef.current.roundDone || !playingRef.current) return;
    const s = stateRef.current;
    s.roundDone = true;
    s.lives -= 1; s.combo = 0;
    setLives(s.lives); setCombo(0); setFlash('bad');
    tapHaptic('error'); playWrong();
    recordWordAnswer(d.pair.english, false, undefined, undefined, activeLanguage);
    setTimeout(() => setFlash(null), 500);
    advance();
  }, [activeLanguage, playWrong, recordWordAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTap = useCallback((d: Drop) => {
    const s = stateRef.current;
    if (s.roundDone) return false;
    if (!d.isTarget) {
      // A wrong tap is a wrong answer for the current English target: one miss per target,
      // so multi-taps and the later fall timeout cannot double-count.
      s.roundDone = true;
      s.lives -= 1; s.combo = 0;
      setLives(s.lives); setCombo(0); setFlash('bad');
      tapHaptic('error'); playWrong();
      const t = targetRef.current;
      if (t) recordWordAnswer(t.english, false, undefined, undefined, activeLanguage);
      setTimeout(() => setFlash(null), 500);
      advance();
      return false;
    }
    s.roundDone = true;
    s.combo += 1; s.best = Math.max(s.best, s.combo);
    const mult = Math.min(4, 1 + Math.floor(s.combo / 3));
    s.score += 10 * mult; s.correct += 1;
    setScore(s.score); setCorrect(s.correct); setCombo(s.combo); setFlash('good');
    tapHaptic('success'); playCorrect();
    recordWordAnswer(d.pair.english, true, undefined, undefined, activeLanguage);
    setTimeout(() => setFlash(null), 400);
    advance();
    return true;
  }, [activeLanguage, playCorrect, playWrong, recordWordAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  const mult = Math.min(4, 1 + Math.floor(combo / 3));
  const floor = Math.max(0, area.h - 58);

  return (
    <GameShell
      {...game.shell}
      gameId="word-rain"
      hearts={lives}
      secondsLeft={secondsLeft}
      progress={correct / MAX_CORRECT}
      footer={game.shell.error ? <ChunkyButton onPress={game.retry} color={META.color}>Retry save</ChunkyButton> : undefined}
    >
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color: colors.foreground }]}>{score}</Text>
        {mult > 1 ? (
          <View style={[styles.multi, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="flame" size={14} color="#FFFFFF" />
            <Text style={styles.multiText}>x{mult}</Text>
          </View>
        ) : null}
        <Text style={[styles.count, { color: colors.mutedForeground }]}>{correct}/{MAX_CORRECT}</Text>
      </View>
      <View
        style={[styles.sky, { borderColor: flash === 'bad' ? '#E5484D' : flash === 'good' ? '#20B486' : colors.border, backgroundColor: colors.card }]}
        onLayout={e => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {drops.map(d => (
          <Bubble
            key={d.key}
            drop={d}
            label={d.pair.translations[activeLanguage]}
            floor={floor}
            onLand={onLand}
            onTap={onTap}
            color={META.color}
            dark={META.darkColor}
            locked={flash !== null}
          />
        ))}
        <View style={[styles.ground, { backgroundColor: flash === 'bad' ? '#E5484D' : META.color + '33' }]} />
      </View>
      <View style={[styles.targetLip, { backgroundColor: colors.border }]}>
        <View style={[styles.target, { backgroundColor: colors.card }]}>
          <Text style={[styles.targetHint, { color: colors.mutedForeground }]}>Catch the word for</Text>
          <Text style={[styles.targetWord, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit testID="word-rain-target">
            {target?.english ?? '…'}
          </Text>
        </View>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingBottom: 6 },
  score: { fontFamily: fontFamilies.extraBold, fontSize: 26 },
  count: { marginLeft: 'auto', fontFamily: fontFamilies.bold, fontSize: 14 },
  multi: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  multiText: { color: '#FFFFFF', fontFamily: fontFamilies.extraBold, fontSize: 13 },
  sky: { flex: 1, minHeight: 220, marginHorizontal: 12, borderRadius: 24, borderWidth: 2, overflow: 'hidden' },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 10 },
  bubbleWrap: { position: 'absolute', top: 0, width: BUBBLE_W },
  bubbleLip: { borderRadius: 26, paddingBottom: 4 },
  bubble: { minHeight: 50, borderRadius: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 6 },
  bubbleText: { color: '#FFFFFF', fontFamily: fontFamilies.extraBold, fontSize: 16, textAlign: 'center' },
  targetLip: { marginHorizontal: 12, marginTop: 10, borderRadius: 20, paddingBottom: 4 },
  target: { borderRadius: 20, paddingVertical: 10, alignItems: 'center' },
  targetHint: { fontFamily: fontFamilies.bold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  targetWord: { fontFamily: fontFamilies.extraBold, fontSize: 28 },
});
