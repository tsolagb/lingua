import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { goBackOr } from '@/lib/navigation';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Ionicons } from '@expo/vector-icons';
import { GameShell } from '@/components/arcade/GameShell';
import { SpeakerButton } from '@/components/SpeakerButton';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { correctedSentence, getFixItems, type FixItem } from '@/data/fix-sentence';
import { shuffle } from '@/lib/arcade/voice-utils';
import { starsFor, useArcadeRound } from '@/lib/arcade/voice-session';
import { BAD, ChoiceTile, Confetti, FeedbackCard, GOOD, SaveRetry, StreakPill, resultHaptic, tapHaptic, ui, useShake, type VoiceTheme } from '@/lib/arcade/voice-ui';
import { fontFamilies } from '@/constants/typography';
import { MOTION } from '@/constants/motion';

const GAME_ID = 'fix-sentence' as const;
const TOTAL = 10;
const theme = { main: '#20B486', lip: '#14876A', ink: '#FFFFFF', soft: '#20B48622', icon: 'construct' } as unknown as VoiceTheme;

type Stage = 'find' | 'fix' | 'done';

function Token({ text, state, onPress, index, disabled }: { text: string; state: 'idle' | 'miss' | 'found' | 'fixed'; onPress: () => void; index: number; disabled: boolean }) {
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const shake = useShake();
  useEffect(() => { if (state === 'miss') shake.run(); }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const border = state === 'found' ? BAD : state === 'fixed' ? GOOD : state === 'miss' ? BAD + '88' : colors.border;
  const bg = state === 'found' ? BAD + '18' : state === 'fixed' ? GOOD + '1F' : colors.card;
  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(Math.min(index * 20, 120))} style={shake.style}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Word ${text}`} testID={`fix-token-${index}`} disabled={disabled} onPress={onPress}
        style={[styles.token, { borderColor: border, backgroundColor: bg }]}>
        <Text style={[styles.tokenText, { color: colors.foreground, textDecorationLine: state === 'found' ? 'line-through' : 'none' }]}>{text}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function FixSentence() {
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const { activeLanguage, recordGuidedSentenceAnswer } = useGame();
  const { playCorrect, playWrong, speakCorrectAnswer } = useSound();
  const game = useArcadeRound(GAME_ID);
  const [items, setItems] = useState<FixItem[]>([]);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('find');
  const [missToken, setMissToken] = useState<number | null>(null);
  const [wrongFixes, setWrongFixes] = useState<string[]>([]);
  const [firstMiss, setFirstMiss] = useState(false);
  const [score, setScore] = useState(0);
  const [clean, setClean] = useState(0);
  const [streak, setStreak] = useState(0);
  const [burst, setBurst] = useState(0);
  const recorded = useRef(false);

  const q = items[index];
  const options = useMemo(() => (q ? shuffle([q.fix, ...q.distractors]) : []), [q?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    setItems(shuffle(getFixItems(activeLanguage)).slice(0, TOTAL));
    setIndex(0); setStage('find'); setMissToken(null); setWrongFixes([]); setFirstMiss(false);
    setScore(0); setClean(0); setStreak(0); setBurst(0);
    recorded.current = false;
    game.begin();
  };

  const miss = () => {
    playWrong(); resultHaptic(false);
    setFirstMiss(true); setStreak(0);
  };

  const tapToken = (i: number) => {
    if (!q || stage !== 'find') return;
    tapHaptic();
    if (i === q.wrongIndex) { setMissToken(null); setStage('fix'); return; }
    setMissToken(i);
    miss();
  };

  const chooseFix = (opt: string) => {
    if (!q || stage !== 'fix' || recorded.current) return;
    if (opt !== q.fix) { setWrongFixes(w => [...w, opt]); miss(); return; }
    recorded.current = true;
    const ok = !firstMiss;
    const full = correctedSentence(q);
    recordGuidedSentenceAnswer({ sentenceId: q.id, english: q.english, target: full }, ok, activeLanguage);
    playCorrect(); resultHaptic(true);
    speakCorrectAnswer(full, activeLanguage);
    if (ok) {
      const s = streak + 1;
      setStreak(s); setClean(c => c + 1);
      setScore(v => v + 100 + (s - 1) * 20);
      setBurst(b => b + 1);
    } else {
      setScore(v => v + 30);
    }
    setStage('done');
  };

  const next = () => {
    if (index >= items.length - 1) {
      const stars = starsFor(clean / Math.max(1, items.length));
      game.finish({ score, stars, xp: clean * 2 + stars });
      return;
    }
    recorded.current = false;
    setStage('find'); setMissToken(null); setWrongFixes([]); setFirstMiss(false);
    setIndex(i => i + 1);
  };

  return (
    <GameShell
      gameId={GAME_ID}
      phase={game.phase}
      score={game.phase === 'results' ? game.outcome.score : score}
      bestScore={game.bestScore}
      stars={game.outcome.stars}
      xp={game.xpEarned}
      progress={items.length ? (index + (stage === 'done' ? 1 : 0)) / items.length : 0}
      saving={game.saving}
      error={game.error}
      onPlay={start}
      onReplay={start}
      onDone={() => goBackOr('/categories?tab=games')}
      footer={game.phase === 'results' ? <SaveRetry error={game.error} onRetry={game.retrySave} testID="fix-retry-save" /> : undefined}
    >
      {q ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Confetti burst={burst} />
          <View style={styles.topRow}>
            <View style={[styles.pill, { backgroundColor: theme.soft }]}>
              <Text style={[ui.label, { color: colors.colorScheme === 'dark' ? theme.main : theme.lip }]}>{q.categoryLabel.toUpperCase()}</Text>
            </View>
            <Text style={[ui.small, { color: colors.mutedForeground }]}>{index + 1} / {items.length}</Text>
            <View style={{ flex: 1 }} />
            <StreakPill streak={streak} theme={theme} />
          </View>

          <View style={[styles.board, { backgroundColor: colors.card, borderColor: stage === 'done' ? GOOD : theme.main + '55' }]} key={q.id}>
            <Text style={[ui.label, { color: colors.mutedForeground }]}>{q.english}</Text>
            <View style={styles.tokens}>
              {q.tokens.map((t, i) => {
                const isWrong = i === q.wrongIndex;
                const label = stage === 'done' && isWrong ? q.fix : t;
                const state = stage === 'done' && isWrong ? 'fixed' : stage === 'fix' && isWrong ? 'found' : missToken === i ? 'miss' : 'idle';
                return <Token key={`${q.id}-${i}-${missToken === i ? 'm' : ''}`} index={i} text={label} state={state} disabled={stage !== 'find'} onPress={() => tapToken(i)} />;
              })}
              <Text style={[styles.tokenText, { color: colors.foreground, alignSelf: 'center' }]}>{q.end}</Text>
            </View>
          </View>

          {stage === 'find' ? (
            <Animated.View entering={reduceMotion ? undefined : FadeIn} style={styles.hintRow}>
              <Ionicons name="finger-print" size={18} color={theme.main} />
              <Text style={[ui.body, { color: colors.mutedForeground, flex: 1 }]}>
                {missToken !== null ? 'That word is fine. Look again!' : 'Tap the one word that’s wrong.'}
              </Text>
            </Animated.View>
          ) : null}

          {stage === 'fix' ? (
            <Animated.View entering={reduceMotion ? undefined : FadeInDown} style={{ gap: 10 }}>
              <Text style={[ui.body, { color: colors.foreground, fontFamily: fontFamilies.extraBold }]}>Found it! Pick the fix:</Text>
              <View style={styles.grid}>
                {options.map((opt, i) => (
                  <View key={`${q.id}-${opt}`} style={styles.gridCell}>
                    <ChoiceTile index={i} label={opt} theme={theme} state={wrongFixes.includes(opt) ? 'wrong' : 'idle'} disabled={wrongFixes.includes(opt)} onPress={() => chooseFix(opt)} testID={`fix-option-${i}`} />
                  </View>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {stage === 'done' ? (
            <Animated.View entering={reduceMotion ? undefined : ZoomIn.duration(MOTION.transitionMs)}>
              <FeedbackCard ok={!firstMiss} theme={theme} title={firstMiss ? 'Fixed — after a retry' : 'Perfect fix!'} onNext={next}
                nextLabel={index >= items.length - 1 ? 'See results' : 'Next sentence'} testID="fix-next">
                <View style={styles.ctx}>
                  <Text style={[ui.body, { color: colors.foreground, fontFamily: fontFamilies.extraBold, flex: 1 }]}>{correctedSentence(q)}</Text>
                  <SpeakerButton text={correctedSentence(q)} language={activeLanguage} compact testID="fix-speak" />
                </View>
                <View style={styles.ruleRow}>
                  <Ionicons name="bulb" size={16} color="#F59E0B" />
                  <Text style={[ui.small, { color: colors.foreground, flex: 1 }]}>{q.rule}</Text>
                </View>
                {firstMiss ? (
                  <Text style={[ui.small, { color: BAD }]}>
                    Mistake noted: “{q.tokens[q.wrongIndex]}” → “{q.fix}”. It’s queued for review.
                  </Text>
                ) : null}
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
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  board: { borderRadius: 22, borderWidth: 2, borderBottomWidth: 5, padding: 16, gap: 12 },
  tokens: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  token: { borderRadius: 12, borderWidth: 2, borderBottomWidth: 4, paddingHorizontal: 12, paddingVertical: 8 },
  tokenText: { fontFamily: fontFamilies.extraBold, fontSize: 19 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  gridCell: { width: '50%', padding: 5 },
  ctx: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
});
