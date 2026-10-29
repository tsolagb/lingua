import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from '@/components/native';
import type { ViewInstance } from 'react-native';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { useColors } from '@/hooks/useColors';
import { fontFamilies } from '@/constants/typography';
import { ChunkyButton, GameShell, tapHaptic } from '@/components/arcade/GameShell';
import { ARCADE_CATALOG } from '@/lib/arcade/catalog';
import { useArcadeRound } from '@/lib/arcade/useArcadeRound';
import { useCountdown } from '@/lib/arcade/useCountdown';
import { buildSortDeck, getSortBuckets, type SortBucket, type SortItem } from '@/lib/arcade/gender';
import { starsFor } from '@/lib/arcade/vocab';
import { MOTION } from '@/constants/motion';

const META = ARCADE_CATALOG['gender-sort'];
const SECONDS = 60;
const BUCKET_COLORS: Record<SortBucket, [string, string]> = { a: ['#2F8CFF', '#1C64C9'], b: ['#E5484D', '#B42328'] };

type Rect = { x: number; y: number; w: number; h: number };

export default function GenderSort() {
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const { activeLanguage, recordWordAnswer } = useGame();
  const { playCorrect, playWrong } = useSound();
  const labels = useMemo(() => getSortBuckets(activeLanguage), [activeLanguage]);
  const [deck, setDeck] = useState<SortItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [reveal, setReveal] = useState<{ text: string; right: boolean } | null>(null);
  const [hover, setHover] = useState<SortBucket | null>(null);
  const stats = useRef({ score: 0, correct: 0, answered: 0, streak: 0, best: 0, busy: false });
  const pan = useRef(new Animated.ValueXY()).current;
  const enter = useRef(new Animated.Value(1)).current;
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wobble = { a: useRef(new Animated.Value(0)).current, b: useRef(new Animated.Value(0)).current };
  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
  }, []);
  const bucketRefs = {
    a: useRef<ViewInstance | null>(null),
    b: useRef<ViewInstance | null>(null),
  };
  const rects = useRef<Partial<Record<SortBucket, Rect>>>({});

  const measure = () => {
    (['a', 'b'] as SortBucket[]).forEach(k => {
      const node = bucketRefs[k].current as unknown as { getBoundingClientRect?: () => DOMRect } | null;
      if (Platform.OS === 'web' && node?.getBoundingClientRect) {
        // Viewport rect, compared against pointer clientX/clientY on web.
        const r = node.getBoundingClientRect();
        rects.current[k] = { x: r.left, y: r.top, w: r.width, h: r.height };
        return;
      }
      bucketRefs[k].current?.measureInWindow((x, y, w, h) => { rects.current[k] = { x, y, w, h }; });
    });
  };

  const game = useArcadeRound('gender-sort', () => {
    const d = buildSortDeck(activeLanguage, 24);
    stats.current = { score: 0, correct: 0, answered: 0, streak: 0, best: 0, busy: false };
    setDeck(d); setIdx(0); setScore(0); setStreak(0); setReveal(null);
    pan.setValue({ x: 0, y: 0 });
  });
  const playing = game.phase === 'playing';
  const finishRef = useRef(game.finish);
  finishRef.current = game.finish;
  const end = useCallback(() => {
    const s = stats.current;
    const acc = s.answered ? s.correct / s.answered : 0;
    finishRef.current(s.score, acc < 0.5 ? 0 : starsFor(s.correct, [6, 12, 18]), s.correct + s.best);
  }, []);
  const secondsLeft = useCountdown(SECONDS, playing, end);
  const item = deck[idx];
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const itemRef = useRef(item);
  itemRef.current = item;

  const hit = (px: number, py: number): SortBucket | null => {
    for (const k of ['a', 'b'] as SortBucket[]) {
      const r = rects.current[k];
      if (r && px >= r.x - 12 && px <= r.x + r.w + 12 && py >= r.y - 24 && py <= r.y + r.h + 12) return k;
    }
    return null;
  };

  const choose = useCallback((bucket: SortBucket) => {
    const it = itemRef.current;
    const s = stats.current;
    if (!it || s.busy) return;
    s.busy = true;
    const right = it.bucket === bucket;
    s.answered += 1;
    if (right) {
      s.correct += 1; s.streak += 1; s.best = Math.max(s.best, s.streak);
      s.score += 10 + Math.min(15, s.streak * 3);
      tapHaptic('success'); playCorrect();
      recordWordAnswer(it.english, true, undefined, undefined, activeLanguage);
    } else {
      s.streak = 0;
      tapHaptic('error'); playWrong();
      recordWordAnswer(it.english, false, undefined, undefined, activeLanguage);
      if (!reduceMotion) {
        const w = wobble[bucket];
        Animated.sequence([
          Animated.timing(w, { toValue: 1, duration: 70, useNativeDriver: true }),
          Animated.timing(w, { toValue: -1, duration: 70, useNativeDriver: true }),
          Animated.timing(w, { toValue: 0.6, duration: 70, useNativeDriver: true }),
          Animated.timing(w, { toValue: 0, duration: 70, useNativeDriver: true }),
        ]).start();
      }
    }
    setScore(s.score); setStreak(s.streak); setHover(null);
    setReveal({ text: it.reveal, right });
    const target = rects.current[it.bucket];
    Animated.parallel([
      Animated.timing(pan, { toValue: { x: reduceMotion ? 0 : target ? (it.bucket === 'a' ? -90 : 90) : 0, y: reduceMotion ? 0 : 260 }, duration: reduceMotion ? 0 : 260, useNativeDriver: true }),
      Animated.timing(enter, { toValue: 0, duration: reduceMotion ? MOTION.transitionMs : 260, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) return;
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      transitionTimer.current = setTimeout(() => {
        transitionTimer.current = null;
        setReveal(null);
        pan.setValue({ x: 0, y: 0 });
        const next = idxRef.current + 1;
        if (next >= deck.length) { end(); return; }
        setIdx(next);
        enter.setValue(0);
        if (reduceMotion) enter.setValue(1);
        else Animated.spring(enter, { toValue: 1, friction: 6, useNativeDriver: true }).start();
        s.busy = false;
      }, right ? 350 : MOTION.wrongPauseMs);
    });
  }, [activeLanguage, deck.length, end, enter, pan, playCorrect, playWrong, recordWordAnswer, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps
  const chooseRef = useRef(choose);
  chooseRef.current = choose;

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !stats.current.busy,
    onPanResponderGrant: () => measure(),
    onPanResponderMove: (e, g) => {
      pan.setValue({ x: g.dx, y: g.dy });
      setHover(hit(e.nativeEvent.pageX, e.nativeEvent.pageY));
    },
    onPanResponderRelease: (e) => {
      const b = hit(e.nativeEvent.pageX, e.nativeEvent.pageY);
      setHover(null);
      if (b) chooseRef.current(b);
      else Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => { setHover(null); Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start(); },
  }), [pan]); // eslint-disable-line react-hooks/exhaustive-deps

  // Web: drive the drag with real pointer events + capture so mouse drags never select text.
  const cardRef = useRef<ViewInstance | null>(null);
  const hasItem = !!item;
  useEffect(() => {
    if (Platform.OS !== 'web' || !playing || !hasItem) return;
    const el = cardRef.current as unknown as HTMLElement | null;
    if (!el || typeof el.addEventListener !== 'function') return;
    let drag: { id: number; x: number; y: number } | null = null;
    const down = (e: PointerEvent) => {
      if (stats.current.busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      measure();
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      e.preventDefault();
      pan.setValue({ x: e.clientX - drag.x, y: e.clientY - drag.y });
      setHover(hit(e.clientX, e.clientY));
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      e.preventDefault();
      const moved = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
      drag = null;
      try { el.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      measure();
      const b = moved > 8 ? hit(e.clientX, e.clientY) : null;
      setHover(null);
      if (b) chooseRef.current(b);
      else Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
    };
    const cancel = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null; setHover(null);
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    };
    const noSelect = (e: Event) => e.preventDefault();
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    el.addEventListener('lostpointercapture', cancel);
    el.addEventListener('selectstart', noSelect);
    el.addEventListener('dragstart', noSelect);
    el.addEventListener('touchmove', noSelect, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
      el.removeEventListener('lostpointercapture', cancel);
      el.removeEventListener('selectstart', noSelect);
      el.removeEventListener('dragstart', noSelect);
      el.removeEventListener('touchmove', noSelect);
    };
  }, [playing, hasItem, pan]); // eslint-disable-line react-hooks/exhaustive-deps
  const dragHandlers = Platform.OS === 'web' ? {} : responder.panHandlers;
  const webNoSelect = Platform.OS === 'web' ? ({ userSelect: 'none', touchAction: 'none', cursor: 'grab' } as object) : null;

  const rotate = pan.x.interpolate({ inputRange: [-150, 0, 150], outputRange: ['-10deg', '0deg', '10deg'] });
  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  const renderBucket = (k: SortBucket) => {
    const [c, d] = BUCKET_COLORS[k];
    const rot = wobble[k].interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });
    const active = hover === k;
    return (
      <Animated.View style={[styles.bucketWrap, { transform: [{ rotate: rot }, { scale: active ? 1.06 : 1 }] }]}>
        <Pressable
          ref={bucketRefs[k] as any}
          onLayout={measure}
          accessibilityRole="button"
          accessibilityLabel={`Sort into ${k === 'a' ? labels.a : labels.b}`}
          testID={`gender-sort-bucket-${k}`}
          onPress={() => choose(k)}
          style={[styles.bucketLip, { backgroundColor: d }]}
        >
          <View style={[styles.bucket, { backgroundColor: active ? d : c }]}>
            <Ionicons name={k === 'a' ? 'ellipse' : 'triangle'} size={18} color="#FFFFFF" />
            <Text style={styles.bucketTitle} numberOfLines={1} adjustsFontSizeToFit>{k === 'a' ? labels.a : labels.b}</Text>
            <Text style={styles.bucketHint}>{k === 'a' ? labels.aHint : labels.bHint}</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <GameShell
      {...game.shell}
      gameId="gender-sort"
      secondsLeft={secondsLeft}
      progress={deck.length ? idx / deck.length : 0}
      footer={game.shell.error ? <ChunkyButton onPress={game.retry} color={META.color}>Retry save</ChunkyButton> : undefined}
    >
      <View style={styles.top}>
        <View>
          <Text style={[styles.prompt, { color: colors.mutedForeground }]}>{labels.title}</Text>
          <Text style={[styles.score, { color: colors.foreground }]}>{score}</Text>
        </View>
        <View style={[styles.streak, { backgroundColor: streak >= 4 ? '#F59E0B' : colors.muted }]}>
          <Ionicons name="flame" size={16} color={streak >= 4 ? '#FFFFFF' : colors.mutedForeground} />
          <Text style={[styles.streakText, { color: streak >= 4 ? '#FFFFFF' : colors.mutedForeground }]}>{streak}</Text>
        </View>
      </View>
      <View style={[styles.stage, Platform.OS === 'web' ? ({ userSelect: 'none' } as object) : null]}>
        {item ? (
          <Animated.View
            ref={cardRef as any}
            {...dragHandlers}
            accessibilityLabel={`${item.word}. Drag to a bucket or tap a bucket below.`}
            style={[styles.cardLip, webNoSelect, { backgroundColor: colors.border, opacity: enter, transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }, { scale }] }]}
          >
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: reveal ? (reveal.right ? '#20B486' : '#E5484D') : colors.border }]}>
              <Ionicons name="reorder-two" size={22} color={colors.mutedForeground} />
              <Text style={[styles.word, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>{item.word}</Text>
              <Text style={[styles.english, { color: colors.mutedForeground }]}>{item.english}</Text>
            </View>
          </Animated.View>
        ) : (
          <Text style={[styles.english, { color: colors.mutedForeground }]}>No sortable words for this language yet.</Text>
        )}
        {reveal ? (
          <View style={[styles.reveal, { backgroundColor: reveal.right ? '#20B486' : '#E5484D' }]} accessibilityRole="alert">
            <Ionicons name={reveal.right ? 'checkmark-circle' : 'close-circle'} size={18} color="#FFFFFF" />
            <Text style={styles.revealText}>{reveal.text}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.buckets}>
        {renderBucket('a')}
        {renderBucket('b')}
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  prompt: { fontFamily: fontFamilies.bold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  score: { fontFamily: fontFamilies.extraBold, fontSize: 26 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  streakText: { fontFamily: fontFamilies.extraBold, fontSize: 15 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 14 },
  cardLip: { width: '100%', maxWidth: 320, borderRadius: 26, paddingBottom: 6 },
  card: { borderRadius: 26, borderWidth: 3, paddingVertical: 28, paddingHorizontal: 18, alignItems: 'center', gap: 6 },
  word: { fontFamily: fontFamilies.extraBold, fontSize: 36 },
  english: { fontFamily: fontFamilies.semiBold, fontSize: 15, textAlign: 'center' },
  reveal: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  revealText: { color: '#FFFFFF', fontFamily: fontFamilies.extraBold, fontSize: 17 },
  buckets: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  bucketWrap: { flex: 1 },
  bucketLip: { borderRadius: 24, paddingBottom: 6 },
  bucket: { borderRadius: 24, minHeight: 112, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, gap: 2 },
  bucketTitle: { color: '#FFFFFF', fontFamily: fontFamilies.extraBold, fontSize: 18 },
  bucketHint: { color: 'rgba(255,255,255,0.85)', fontFamily: fontFamilies.bold, fontSize: 13 },
});
