import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from '@/components/native';
import type { ViewInstance } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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
import { getSpellablePairs, graphemes, shuffle, starsFor } from '@/lib/arcade/vocab';
import { MOTION } from '@/constants/motion';

const META = ARCADE_CATALOG['letter-chain'];
const ROUNDS = 10;
const ROUND_SECONDS = 30;

interface Tile { id: string; ch: string }

/** Build tiles with unique ids so duplicate letters stay distinct. */
export function buildTiles(word: string): { answer: string[]; tiles: Tile[] } {
  const answer = graphemes(word.toLocaleLowerCase());
  let tiles = answer.map((ch, i) => ({ id: `${i}-${ch}`, ch }));
  for (let i = 0; i < 5; i++) {
    tiles = shuffle(tiles);
    if (tiles.map(t => t.ch).join('') !== answer.join('')) break;
  }
  return { answer, tiles };
}

function RingTile({ tile, x, y, used, onPress, size }: { tile: Tile; x: number; y: number; used: boolean; onPress: () => void; size: number }) {
  const s = useSharedValue(0);
  useEffect(() => { s.value = withSpring(used ? 0 : 1, { damping: 11, stiffness: 220 }); }, [used, s]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: s.value }));
  return (
    <Animated.View style={[styles.ringTile, { left: x - size / 2, top: y - size / 2, width: size }, st]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Letter ${tile.ch}`}
        disabled={used}
        onPress={onPress}
        style={[styles.tileLip, { backgroundColor: META.darkColor }]}
      >
        <View style={[styles.tile, { backgroundColor: META.color, height: size - 4 }]}>
          <Text style={styles.tileText}>{tile.ch}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

type Pt = { x: number; y: number };
type Flight = { id: string; ch: string; from: Pt; to: Pt; size: number; slotW: number };

function measure(ref: React.RefObject<ViewInstance | null>): Promise<{ x: number; y: number; w: number; h: number } | null> {
  return new Promise(resolve => {
    const node = ref.current;
    if (!node) return resolve(null);
    node.measureInWindow((x, y, w, h) => resolve(Number.isFinite(x) ? { x, y, w, h } : null));
  });
}

/** Letter that flies from its ring tile to the destination slot, then settles. */
function FlyingLetter({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const t = useSharedValue(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const finish = useCallback(() => doneRef.current(), []);
  useEffect(() => {
    t.value = withTiming(1, { duration: 200 }, ok => { if (ok) runOnJS(finish)(); });
  }, [t, finish]);
  const { from, to, size, slotW } = flight;
  const st = useAnimatedStyle(() => {
    const p = t.value;
    const arc = -40 * 4 * p * (1 - p);
    const w = size + (slotW - size) * p;
    return {
      width: w,
      transform: [
        { translateX: from.x + (to.x - from.x) * p - w / 2 },
        { translateY: from.y + (to.y - from.y) * p + arc - 26 },
        { scale: 1 + 0.15 * Math.sin(p * Math.PI) },
      ],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.flyer, { backgroundColor: META.color }, st]}>
      <Text style={styles.tileText}>{flight.ch}</Text>
    </Animated.View>
  );
}

function Slot({ ch, state, width, hinted }: { ch?: string; state: 'idle' | 'wrong' | 'right'; width: number; hinted: boolean }) {
  const colors = useColors();
  const s = useSharedValue(ch ? 1 : 0.6);
  useEffect(() => { s.value = ch ? withSequence(withTiming(1.25, { duration: 90 }), withSpring(1, { damping: 8 })) : withTiming(1); }, [ch, s]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const bg = state === 'wrong' ? '#E5484D' : state === 'right' ? '#20B486' : ch ? (hinted ? '#F59E0B' : META.color) : colors.muted;
  return (
    <Animated.View style={[styles.slot, { width, backgroundColor: bg, borderColor: ch ? 'transparent' : colors.border }, st]}>
      <Text style={[styles.slotText, { color: ch ? '#FFFFFF' : colors.mutedForeground, fontSize: width > 40 ? 22 : 18 }]}>{ch ?? ''}</Text>
    </Animated.View>
  );
}

export default function LetterChain() {
  const colors = useColors();
  const { width: screenW } = useWindowDimensions();
  const { activeLanguage, recordWordAnswer } = useGame();
  const { playCorrect, playWrong } = useSound();
  const pool = useMemo(() => getSpellablePairs(activeLanguage), [activeLanguage]);
  const [words, setWords] = useState<WordPair[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [answer, setAnswer] = useState<string[]>([]);
  const [picked, setPicked] = useState<Tile[]>([]);
  const [hintIds, setHintIds] = useState<Set<string>>(new Set());
  const [slotState, setSlotState] = useState<'idle' | 'wrong' | 'right'>('idle');
  const [score, setScore] = useState(0);
  const [roundKey, setRoundKey] = useState(0);
  const [resolved, setResolved] = useState(false);
  const stats = useRef({ score: 0, solved: 0, clean: 0, busy: false });
  const reduceMotion = useReduceMotion();
  const [flight, setFlight] = useState<Flight | null>(null);
  const flyingRef = useRef(false);
  const boardRef = useRef<ViewInstance | null>(null);
  const ringRef = useRef<ViewInstance | null>(null);
  const slotRefs = useRef<(ViewInstance | null)[]>([]);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const loadRound = useCallback((list: WordPair[], idx: number) => {
    const built = buildTiles(list[idx].translations[activeLanguage]);
    setTiles(built.tiles); setAnswer(built.answer); setPicked([]); setHintIds(new Set()); setSlotState('idle');
    setRoundIdx(idx); setRoundKey(k => k + 1); setResolved(false);
    setFlight(null); flyingRef.current = false; pendingCheck.current = null;
    stats.current.busy = false;
  }, [activeLanguage]);

  const game = useArcadeRound('letter-chain', () => {
    const list = shuffle(pool).slice(0, ROUNDS);
    stats.current = { score: 0, solved: 0, clean: 0, busy: false };
    setScore(0);
    setWords(list);
    if (list.length) loadRound(list, 0);
  });
  const playing = game.phase === 'playing';
  const word = words.length ? words[Math.min(roundIdx, words.length - 1)] : undefined;

  const finishRef = useRef(game.finish);
  finishRef.current = game.finish;
  const advance = useCallback(() => {
    const next = roundIdx + 1;
    if (next >= words.length) {
      const s = stats.current;
      finishRef.current(s.score, starsFor(s.solved + s.clean, [8, 14, 18]), s.solved * 2 + s.clean * 2);
    } else {
      loadRound(words, next);
    }
  }, [loadRound, roundIdx, words]);

  const fail = useCallback(() => {
    if (!word || stats.current.busy) return;
    stats.current.busy = true;
    tapHaptic('error'); playWrong();
    recordWordAnswer(word.english, false, undefined, undefined, activeLanguage);
    setPicked(answer.map((ch, i) => ({ id: `reveal-${i}`, ch })));
    setSlotState('wrong');
    setResolved(true);
    setTimeout(advance, MOTION.wrongPauseMs);
  }, [activeLanguage, advance, answer, playWrong, recordWordAnswer, word]);
  const failRef = useRef(fail);
  failRef.current = fail;

  const secondsLeft = useCountdown(ROUND_SECONDS, playing && roundKey > 0 && !resolved, () => failRef.current());

  const check = (next: Tile[], hints: Set<string>) => {
    if (next.length !== answer.length) return;
    const guess = next.map(t => t.ch).join('');
    if (guess === answer.join('')) {
      stats.current.busy = true;
      const assisted = hints.size > 0;
      const gained = assisted ? Math.max(20, 100 - hints.size * 30) : 100 + secondsLeft * 2;
      stats.current.score += gained; stats.current.solved += 1;
      if (!assisted) stats.current.clean += 1;
      setScore(stats.current.score);
      setSlotState('right');
      setResolved(true);
      tapHaptic('success'); playCorrect();
      // Assisted answers are not credited as clean recall.
      if (!assisted && word) recordWordAnswer(word.english, true, undefined, undefined, activeLanguage);
      setTimeout(advance, MOTION.answerPauseMs);
    } else {
      tapHaptic('error'); playWrong();
      setSlotState('wrong');
      shake.value = withSequence(withTiming(-10, { duration: 50 }), withTiming(10, { duration: 50 }), withTiming(-6, { duration: 50 }), withTiming(0, { duration: 50 }));
      setTimeout(() => {
        // Keep hinted letters, clear the rest.
        setPicked(p => p.filter(t => hints.has(t.id)));
        setSlotState('idle');
      }, MOTION.wrongPauseMs);
    }
  };

  const pick = async (tile: Tile, tilePos: Pt) => {
    if (flyingRef.current || stats.current.busy || slotState !== 'idle' || picked.some(p => p.id === tile.id)) return;
    tapHaptic();
    const next = [...picked, tile];
    const hints = hintIds;
    if (reduceMotion) { setPicked(next); check(next, hints); return; }
    // Lock input for the short flight, then reveal in the slot and check.
    flyingRef.current = true;
    setPicked(next);
    const [board, ring, slot] = await Promise.all([
      measure(boardRef), measure(ringRef), measure({ current: slotRefs.current[next.length - 1] ?? null }),
    ]);
    if (!board || !ring || !slot) { flyingRef.current = false; check(next, hints); return; }
    setFlight({
      id: tile.id,
      ch: tile.ch,
      size: tileSize,
      slotW,
      from: { x: ring.x - board.x + tilePos.x, y: ring.y - board.y + tilePos.y },
      to: { x: slot.x - board.x + slot.w / 2, y: slot.y - board.y + slot.h / 2 },
    });
    pendingCheck.current = { next, hints };
  };
  const pendingCheck = useRef<{ next: Tile[]; hints: Set<string> } | null>(null);
  const land = () => {
    setFlight(null);
    flyingRef.current = false;
    const p = pendingCheck.current;
    pendingCheck.current = null;
    if (p && !stats.current.busy) check(p.next, p.hints);
  };

  const undo = () => {
    if (flyingRef.current || slotState !== 'idle' || !picked.length) return;
    const last = picked[picked.length - 1];
    if (hintIds.has(last.id)) return;
    setPicked(picked.slice(0, -1));
  };

  const hint = () => {
    if (flyingRef.current || stats.current.busy || slotState !== 'idle') return;
    // Remove any wrong prefix, then place the next correct letter.
    let prefix = 0;
    while (prefix < picked.length && picked[prefix].ch === answer[prefix]) prefix++;
    const kept = picked.slice(0, prefix);
    if (prefix >= answer.length) return;
    const needed = answer[prefix];
    const tile = tiles.find(t => t.ch === needed && !kept.some(k => k.id === t.id));
    if (!tile) return;
    const hints = new Set(hintIds); hints.add(tile.id);
    setHintIds(hints);
    const next = [...kept, tile];
    setPicked(next);
    check(next, hints);
  };

  const ringSize = Math.max(200, Math.min(screenW - 48, 300));
  const n = tiles.length;
  const tileSize = n > 7 ? 50 : 56;
  const radius = ringSize / 2 - tileSize / 2 - 4;
  const slotW = Math.min(48, Math.floor((screenW - 40 - (answer.length - 1) * 6) / Math.max(1, answer.length)));

  return (
    <GameShell
      {...game.shell}
      gameId="letter-chain"
      secondsLeft={secondsLeft}
      progress={(roundIdx + (slotState === 'right' ? 1 : 0)) / ROUNDS}
      footer={game.shell.error ? <ChunkyButton onPress={game.retry} color={META.color}>Retry save</ChunkyButton> : undefined}
    >
      <View style={styles.cueRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.cueHint, { color: colors.mutedForeground }]}>Word {roundIdx + 1} of {words.length || ROUNDS}</Text>
          <Text style={[styles.cue, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit testID="letter-chain-cue">{word?.english ?? ''}</Text>
        </View>
        <Text style={[styles.score, { color: META.darkColor }]}>{score}</Text>
      </View>
      <View ref={boardRef} collapsable={false} style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
      <Animated.View style={[styles.slots, shakeStyle]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Remove last letter" onPress={undo} style={styles.slotsInner}>
          {answer.map((_, i) => (
            <View key={`${roundKey}-${i}`} ref={el => { slotRefs.current[i] = el; }} collapsable={false}>
            <Slot ch={picked[i] && picked[i].id !== flight?.id ? picked[i].ch : undefined} state={slotState} width={slotW} hinted={!!picked[i] && hintIds.has(picked[i].id)} />
            </View>
          ))}
        </Pressable>
      </Animated.View>
      <View style={styles.ringWrap}>
        <View ref={ringRef} collapsable={false} style={[styles.ring, { width: ringSize, height: ringSize, borderRadius: ringSize / 2, borderColor: META.color + '44', backgroundColor: META.color + '10' }]}>
          {tiles.map((t, i) => {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2;
            const pos = { x: ringSize / 2 + Math.cos(a) * radius, y: ringSize / 2 + Math.sin(a) * radius };
            return (
              <RingTile
                key={`${roundKey}-${t.id}`}
                tile={t}
                size={tileSize}
                x={pos.x}
                y={pos.y}
                used={picked.some(p => p.id === t.id)}
                onPress={() => { void pick(t, pos); }}
              />
            );
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove last letter"
            onPress={undo}
            style={[styles.centerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="backspace-outline" size={26} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>
      {flight ? <FlyingLetter key={flight.id + roundKey} flight={flight} onDone={land} /> : null}
      </View>
      <View style={styles.actions}>
        <ChunkyButton onPress={hint} color="#F59E0B" style={{ flex: 1 }} accessibilityLabel="Hint: reveal next letter" testID="letter-chain-hint">
          <Ionicons name="bulb" size={20} color="#FFFFFF" />
          <Text style={styles.btnText}>Hint</Text>
        </ChunkyButton>
        <ChunkyButton onPress={fail} color={colors.mutedForeground} style={{ flex: 1 }} accessibilityLabel="Skip word" testID="letter-chain-skip">
          <Text style={styles.btnText}>Skip</Text>
        </ChunkyButton>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  cueRow: { width: '100%', minWidth: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10 },
  cueHint: { fontFamily: fontFamilies.bold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  cue: { fontFamily: fontFamilies.extraBold, fontSize: 28 },
  score: { fontFamily: fontFamilies.extraBold, fontSize: 24 },
  slots: { paddingHorizontal: 20, marginTop: 14 },
  slotsInner: { flexDirection: 'row', justifyContent: 'center', gap: 6, flexWrap: 'nowrap' },
  slot: { height: 52, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  slotText: { fontFamily: fontFamilies.extraBold },
  ringWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 3, borderStyle: 'dashed' },
  flyer: { position: 'absolute', left: 0, top: 0, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', zIndex: 10, elevation: 10 },
  ringTile: { position: 'absolute' },
  tileLip: { borderRadius: 18, paddingBottom: 4 },
  tile: { borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tileText: { color: '#FFFFFF', fontFamily: fontFamilies.extraBold, fontSize: 24 },
  centerBtn: { position: 'absolute', left: '50%', top: '50%', width: 64, height: 64, marginLeft: -32, marginTop: -32, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  btnText: { color: '#FFFFFF', fontFamily: fontFamilies.extraBold, fontSize: 17 },
});
