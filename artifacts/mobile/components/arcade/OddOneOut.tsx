import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { goBackOr } from '@/lib/navigation';
import Animated, { FadeIn, FadeInDown, ZoomIn, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Ionicons } from '@expo/vector-icons';
import { GameShell } from '@/components/arcade/GameShell';
import { SpeakerButton } from '@/components/SpeakerButton';
import { useColors } from '@/hooks/useColors';
import { MOTION } from '@/constants/motion';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { getOddSets, ODD_KIND_LABEL, type OddSet } from '@/data/odd-one-out';
import { shuffle } from '@/lib/arcade/voice-utils';
import { starsFor, useArcadeRound } from '@/lib/arcade/voice-session';
import { BAD, BAD_LIP, Confetti, FeedbackCard, GOOD, GOOD_LIP, SaveRetry, StreakPill, resultHaptic, tapHaptic, ui, useShake, type VoiceTheme } from '@/lib/arcade/voice-ui';
import { fontFamilies } from '@/constants/typography';

const GAME_ID = 'odd-one-out' as const;
const TOTAL = 12;
const theme = { main: '#2F8CFF', lip: '#1A63C7', ink: '#FFFFFF', soft: '#2F8CFF22', icon: 'help' } as unknown as VoiceTheme;

/** Reshuffle card positions so the odd index is never memorised. */
function prepare(sets: OddSet[]): OddSet[] {
  return shuffle(sets).slice(0, TOTAL).map(s => {
    const order = shuffle([0, 1, 2, 3]);
    return { ...s, words: order.map(i => s.words[i]) as OddSet['words'], odd: order.indexOf(s.odd) };
  });
}

function WordCard({ word, english, state, onPress, index, reveal }: {
  word: string; english: string; state: 'idle' | 'correct' | 'wrong' | 'dim' | 'odd'; onPress: () => void; index: number; reveal: boolean;
}) {
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const shake = useShake();
  const press = useSharedValue(0);
  const pop = useSharedValue(1);
  useEffect(() => {
    if (state === 'wrong' && !reduceMotion) shake.run();
    if (state === 'correct') pop.value = reduceMotion ? 1 : withSequence(withTiming(1.04, { duration: 100 }), withSpring(1, { damping: 16, stiffness: 240 }));
  }, [reduceMotion, state]); // eslint-disable-line react-hooks/exhaustive-deps
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * 4 }, { scale: pop.value }] }));
  const border = state === 'correct' ? GOOD : state === 'wrong' ? BAD : state === 'odd' ? GOOD : colors.border;
  const lip = state === 'correct' || state === 'odd' ? GOOD_LIP : state === 'wrong' ? BAD_LIP : colors.border;
  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(Math.min(index * 24, 96)).duration(MOTION.transitionMs)} style={[styles.cell, shake.style, { opacity: state === 'dim' ? 0.55 : 1 }]}>
      <Pressable
        accessibilityRole="button" accessibilityLabel={word} testID={`odd-card-${index}`}
        disabled={reveal}
        onPressIn={() => { press.value = withTiming(1, { duration: 50 }); }}
        onPressOut={() => { press.value = withSpring(0, { damping: 10, stiffness: 300 }); }}
        onPress={onPress}
      >
        <View style={[styles.cardLip, { backgroundColor: lip }]}>
          <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: border }, face]}>
            {state === 'correct' || state === 'odd' ? <View style={[StyleSheet.absoluteFill, { backgroundColor: GOOD + '1F', borderRadius: 18 }]} /> : null}
            {state === 'wrong' ? <View style={[StyleSheet.absoluteFill, { backgroundColor: BAD + '1A', borderRadius: 18 }]} /> : null}
            <Text style={[styles.word, { color: colors.foreground }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{word}</Text>
            {reveal ? <Animated.Text entering={FadeIn} style={[ui.small, { color: colors.mutedForeground, textAlign: 'center' }]}>{english}</Animated.Text> : null}
            {state === 'correct' || state === 'odd' ? <Ionicons name="checkmark-circle" size={22} color={GOOD} style={styles.badge} /> : null}
            {state === 'wrong' ? <Ionicons name="close-circle" size={22} color={BAD} style={styles.badge} /> : null}
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function OddOneOut() {
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const { activeLanguage, recordWordAnswer, recordGuidedSentenceAnswer } = useGame();
  const { playCorrect, playWrong, speakCorrectAnswer } = useSound();
  const game = useArcadeRound(GAME_ID);
  const [sets, setSets] = useState<OddSet[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [burst, setBurst] = useState(0);
  const lock = useRef(false);

  const start = () => {
    setSets(prepare(getOddSets(activeLanguage)));
    setIndex(0); setPicked(null); setScore(0); setCorrect(0); setStreak(0); setBest(0); setBurst(0);
    lock.current = false;
    game.begin();
  };

  const q = sets[index];

  const choose = (i: number) => {
    if (!q || lock.current) return;
    lock.current = true;
    tapHaptic();
    setPicked(i);
    const ok = i === q.odd;
    resultHaptic(ok);
    const oddWord = q.words[q.odd];
    if (q.context) recordGuidedSentenceAnswer({ sentenceId: `${q.id}-context`, english: q.context.english, target: q.context.target }, ok, activeLanguage);
    else recordWordAnswer(oddWord.english, ok, undefined, undefined, activeLanguage);
    if (ok) {
      playCorrect();
      speakCorrectAnswer(oddWord.word, activeLanguage);
      const s = streak + 1;
      setStreak(s); setBest(b => Math.max(b, s));
      setCorrect(c => c + 1);
      setScore(v => v + 100 + (s - 1) * 25);
      setBurst(b => b + 1);
    } else {
      playWrong();
      setStreak(0);
    }
  };

  const next = () => {
    if (index >= sets.length - 1) {
      const stars = starsFor(correct / Math.max(1, sets.length));
      game.finish({ score, stars, xp: correct * 2 + Math.floor(best / 3) + stars });
      return;
    }
    lock.current = false;
    setPicked(null);
    setIndex(i => i + 1);
  };

  const ok = q && picked === q.odd;

  return (
    <GameShell
      gameId={GAME_ID}
      phase={game.phase}
      score={game.phase === 'results' ? game.outcome.score : score}
      bestScore={game.bestScore}
      stars={game.outcome.stars}
      xp={game.xpEarned}
      progress={sets.length ? (index + (picked !== null ? 1 : 0)) / sets.length : 0}
      saving={game.saving}
      error={game.error}
      onPlay={start}
      onReplay={start}
      onDone={() => goBackOr('/categories?tab=games')}
      footer={game.phase === 'results' ? <SaveRetry error={game.error} onRetry={game.retrySave} testID="odd-retry-save" /> : undefined}
    >
      {q ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Confetti burst={burst} />
          <View style={styles.topRow}>
            <View style={[styles.kindPill, { backgroundColor: theme.soft }]}>
              <Text style={[ui.label, { color: colors.colorScheme === 'dark' ? theme.main : theme.lip }]}>{ODD_KIND_LABEL[q.kind].toUpperCase()}</Text>
            </View>
            <Text style={[ui.small, { color: colors.mutedForeground }]}>{index + 1} / {sets.length}</Text>
            <View style={{ flex: 1 }} />
            <StreakPill streak={streak} theme={theme} />
          </View>
          <Text style={[styles.question, { color: colors.foreground }]}>Which one doesn’t belong?</Text>
          <View style={styles.grid} key={q.id}>
            {q.words.map((w, i) => {
              const state = picked === null ? 'idle' : i === picked ? (ok ? 'correct' : 'wrong') : i === q.odd ? 'odd' : 'dim';
              return <WordCard key={`${q.id}-${i}`} index={i} word={w.word} english={w.english} state={state} reveal={picked !== null} onPress={() => choose(i)} />;
            })}
          </View>
          {picked !== null ? (
            <Animated.View entering={reduceMotion ? undefined : ZoomIn.duration(MOTION.transitionMs)}>
              <FeedbackCard ok={!!ok} theme={theme} title={ok ? 'Spot on!' : 'Not quite'} onNext={next}
                nextLabel={index >= sets.length - 1 ? 'See results' : 'Next'} testID="odd-next">
                <View style={styles.groups}>
                  <Text style={[ui.small, { color: colors.foreground }]}><Text style={styles.strong}>3 × {q.groupLabel}</Text>  ·  odd: <Text style={styles.strong}>{q.oddLabel}</Text></Text>
                </View>
                <Text style={[ui.body, { color: colors.foreground }]}>{q.why}</Text>
                {q.context ? (
                  <View style={styles.ctx}>
                    <View style={{ flex: 1 }}>
                      <Text style={[ui.body, { color: colors.foreground, fontFamily: fontFamilies.bold }]}>{q.context.target}</Text>
                      <Text style={[ui.small, { color: colors.mutedForeground }]}>{q.context.english}</Text>
                    </View>
                    <SpeakerButton text={q.context.target} language={activeLanguage} compact testID="odd-speak" />
                  </View>
                ) : (
                  <SpeakerButton text={q.words[q.odd].word} language={activeLanguage} compact testID="odd-speak" />
                )}
              </FeedbackCard>
            </Animated.View>
          ) : null}
        </ScrollView>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kindPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  question: { fontFamily: fontFamilies.extraBold, fontSize: 24, letterSpacing: -0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  cell: { width: '50%', padding: 6 },
  cardLip: { borderRadius: 20, paddingBottom: 5 },
  card: { minHeight: 104, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: 12, gap: 4, overflow: 'hidden' },
  word: { fontFamily: fontFamilies.extraBold, fontSize: 22, textAlign: 'center' },
  badge: { position: 'absolute', top: 6, right: 6 },
  groups: { flexDirection: 'row' },
  strong: { fontFamily: fontFamilies.extraBold },
  ctx: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
