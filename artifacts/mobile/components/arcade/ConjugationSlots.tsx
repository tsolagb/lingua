import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import Animated, { Easing, FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Ionicons } from '@expo/vector-icons';
import { GameShell } from '@/components/arcade/GameShell';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { buildSlotQuestions, slotFillers, type SlotQuestion } from '@/lib/arcade/grammar-slots';
import { normalizeWord, shuffle } from '@/lib/arcade/voice-utils';
import { starsFor, useArcadeRound } from '@/lib/arcade/voice-session';
import { ChoiceTile, Chunky, Confetti, FeedbackCard, SaveRetry, StreakPill, VOICE_THEMES, resultHaptic, tapHaptic, ui } from '@/lib/arcade/voice-ui';
import { MOTION } from '@/constants/motion';
import { getUniqueVocabularyPairs } from '@/data/vocabulary';
import { fontFamilies } from '@/constants/typography';

const GAME_ID = 'conjugation-slots';
const TOTAL = 10;
const JACKPOT_STREAK = 5;
const REEL_H = 58;
const theme = VOICE_THEMES[GAME_ID];

type Stage = 'lever' | 'spinning' | 'answer' | 'feedback';

function Reel({ items, spinKey, duration, label }: { items: string[]; spinKey: number; duration: number; label: string }) {
  const colors = useColors();
  const reduced = useReduceMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = 0;
    const end = -(items.length - 1) * REEL_H;
    y.value = reduced ? end : withTiming(end, { duration, easing: Easing.bezier(0.15, 0.6, 0.25, 1.05) });
  }, [spinKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const final = items[items.length - 1];
  return (
    <View style={{ flex: 1, gap: 4 }} accessible accessibilityLabel={`${label}: ${final}`}>
      <Text style={[ui.label, { color: colors.mutedForeground, fontSize: 10, textAlign: 'center' }]}>{label}</Text>
      <View style={[styles.reelWindow, { backgroundColor: colors.card, borderColor: theme.lip }]}>
        <Animated.View style={st}>
          {items.map((it, i) => (
            <View key={`${it}-${i}`} style={styles.reelCell}>
              <Text style={[styles.reelText, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{it}</Text>
            </View>
          ))}
        </Animated.View>
        <View pointerEvents="none" style={[styles.reelShade, { top: 0, backgroundColor: colors.card, opacity: 0.35 }]} />
      </View>
    </View>
  );
}

function Lever({ onPull, disabled }: { onPull: () => void; disabled: boolean }) {
  const colors = useColors();
  const pull = useSharedValue(0);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateY: pull.value * 54 }] }));
  const stick = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 - pull.value * 0.9 }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Pull the lever to spin the reels"
      accessibilityState={{ disabled }}
      testID="conjugation-lever"
      disabled={disabled}
      onPress={() => {
        tapHaptic();
        pull.value = withSequence(withTiming(1, { duration: 160 }), withSpring(0, { damping: 7, stiffness: 140 }));
        onPull();
      }}
      style={[styles.lever, { opacity: disabled ? 0.5 : 1 }]}
      hitSlop={10}
    >
      <View style={[styles.leverSlot, { backgroundColor: colors.muted }]} />
      <Animated.View style={[styles.leverStick, { backgroundColor: colors.mutedForeground }, stick]} />
      <Animated.View style={[styles.leverKnob, { backgroundColor: '#FF4B4B', borderColor: '#D23535' }, knob]} />
    </Pressable>
  );
}

export default function ConjugationSlots() {
  const colors = useColors();
  const { activeLanguage, recordGuidedSentenceAnswer, recordWordAnswer } = useGame();
  const vocabPairs = useMemo(() => getUniqueVocabularyPairs(activeLanguage), [activeLanguage]);
  const { playCorrect, playWrong, speakCorrectAnswer } = useSound();
  const game = useArcadeRound(GAME_ID);
  const fillers = useMemo(() => slotFillers(activeLanguage), [activeLanguage]);
  const [questions, setQuestions] = useState<SlotQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('lever');
  const [spinKey, setSpinKey] = useState(0);
  const [mode, setMode] = useState<'pick' | 'type'>('pick');
  const [typed, setTyped] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [jackpots, setJackpots] = useState(0);
  const [jackpotNow, setJackpotNow] = useState(false);
  const [burst, setBurst] = useState(0);
  const answeredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const q = questions[index];
  const reels = useMemo(() => {
    if (!q) return null;
    const strip = (pool: string[], final: string) => [...shuffle(pool).slice(0, 7), ...shuffle(pool).slice(0, 3), final];
    return {
      a: strip(fillers.pronouns, q.pronoun),
      b: strip(q.context ? fillers.whens : fillers.verbs, q.verb),
      c: strip(fillers.tenses, q.tense),
    };
  }, [q?.id, spinKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    setQuestions(buildSlotQuestions(activeLanguage, TOTAL));
    setIndex(0); setStage('lever'); setTyped(''); setPicked(null);
    setCorrect(0); setScore(0); setStreak(0); setJackpots(0); setJackpotNow(false); setBurst(0);
    answeredRef.current = false;
    game.begin();
  };

  const spin = () => {
    if (stage !== 'lever') return;
    setSpinKey(k => k + 1);
    setStage('spinning');
    timerRef.current = setTimeout(() => setStage('answer'), MOTION.screenMs * 2);
  };

  const submit = (answer: string) => {
    if (!q || answeredRef.current || stage !== 'answer' || !answer.trim()) return;
    answeredRef.current = true;
    setPicked(answer);
    const ok = normalizeWord(answer) === normalizeWord(q.answer);
    if (q.context) {
      recordGuidedSentenceAnswer({ sentenceId: `verb-gap-${activeLanguage}-${q.answer}-${q.context.english}`, english: q.context.english, target: q.fullForm }, ok, activeLanguage);
    } else {
      const inf = normalizeWord(q.verb);
      const eng = q.verbEnglish.trim().toLowerCase();
      const vocab = vocabPairs.find(p => normalizeWord(p.translations[activeLanguage] ?? '') === inf
        && [eng, eng.replace(/^to /, '')].includes(p.english.trim().toLowerCase()));
      if (vocab) recordWordAnswer(vocab.english, ok, undefined, undefined, activeLanguage);
      // Always track the exact conjugated form too, so present misses never go untracked.
      recordGuidedSentenceAnswer({
        sentenceId: `verb-present-${activeLanguage}-${q.verb}-${q.pronoun}`,
        english: `${q.pronounEnglish || q.pronoun} — ${q.verbEnglish.replace(/^to /, '')} (${q.verb}, present)`,
        target: q.fullForm,
      }, ok, activeLanguage);
    }
    resultHaptic(ok);
    if (ok) {
      playCorrect();
      speakCorrectAnswer(q.fullForm, activeLanguage);
      const s = streak + 1;
      const jackpot = s % JACKPOT_STREAK === 0;
      setStreak(s);
      setCorrect(c => c + 1);
      setScore(v => v + 100 + (s - 1) * 20 + (jackpot ? 250 : 0));
      setJackpotNow(jackpot);
      if (jackpot) setJackpots(j => j + 1);
      setBurst(b => b + 1);
    } else {
      playWrong();
      setStreak(0);
      setJackpotNow(false);
    }
    setStage('feedback');
  };

  const next = () => {
    if (index >= questions.length - 1) {
      const stars = starsFor(correct / Math.max(1, questions.length));
      game.finish({ score, stars, xp: correct * 2 + jackpots * 3 + stars });
      return;
    }
    answeredRef.current = false;
    setPicked(null); setTyped(''); setJackpotNow(false);
    setIndex(i => i + 1);
    setStage('lever');
  };

  const ok = !!q && picked !== null && normalizeWord(picked) === normalizeWord(q.answer);
  const revealed = stage === 'answer' || stage === 'feedback';

  return (
    <GameShell
      gameId={GAME_ID}
      phase={game.phase}
      score={game.phase === 'results' ? game.outcome.score : score}
      bestScore={game.bestScore}
      stars={game.outcome.stars}
      xp={game.xpEarned}
      progress={questions.length ? (index + (stage === 'feedback' ? 1 : 0)) / questions.length : 0}
      saving={game.saving}
      error={game.error}
      onPlay={start}
      onReplay={start}
      onDone={() => router.back()}
      footer={game.phase === 'results' ? <SaveRetry error={game.error} onRetry={game.retrySave} testID="conjugation-retry-save" /> : undefined}
    >
      {q && reels ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Confetti burst={burst} />
            <View style={[styles.machine, { backgroundColor: theme.main, borderColor: theme.lip }]}>
              <View style={styles.marquee}>
                {[0, 1, 2, 3, 4].map(i => <View key={i} style={[styles.bulb, { backgroundColor: i % 2 === spinKey % 2 ? '#FFFFFF' : '#FFE29A' }]} />)}
                <Text style={styles.marqueeText}>VERB SLOTS</Text>
                {[0, 1, 2, 3, 4].map(i => <View key={`r${i}`} style={[styles.bulb, { backgroundColor: i % 2 !== spinKey % 2 ? '#FFFFFF' : '#FFE29A' }]} />)}
              </View>
              <View style={styles.reelRow}>
                <View style={[styles.reels, { backgroundColor: theme.lip }]}>
                  {spinKey === 0 || stage === 'lever' ? (
                    ['WHO', q.context ? 'WHEN' : 'VERB', 'TENSE'].map(l => (
                      <View key={l} style={{ flex: 1, gap: 4 }}>
                        <Text style={[ui.label, { color: '#FFFFFF', fontSize: 10, textAlign: 'center' }]}>{l}</Text>
                        <View style={[styles.reelWindow, { backgroundColor: colors.card, borderColor: theme.lip, alignItems: 'center', justifyContent: 'center' }]}>
                          <Ionicons name="help" size={26} color={theme.main} />
                        </View>
                      </View>
                    ))
                  ) : (
                    <>
                      <Reel items={reels.a} spinKey={spinKey} duration={900} label="WHO" />
                      <Reel items={reels.b} spinKey={spinKey} duration={1150} label={q.context ? 'WHEN' : 'VERB'} />
                      <Reel items={reels.c} spinKey={spinKey} duration={1400} label="TENSE" />
                    </>
                  )}
                </View>
                <Lever onPull={spin} disabled={stage !== 'lever'} />
              </View>
              <StreakPill streak={streak} theme={{ ...theme, main: theme.lip }} />
            </View>

            {stage === 'lever' ? (
              <Animated.View entering={FadeIn} style={{ gap: 10 }}>
                <Text style={[ui.body, { color: colors.mutedForeground, textAlign: 'center' }]}>Spin {index + 1} of {questions.length}. Pull the lever!</Text>
                <Chunky label="Spin" icon="sync" color={theme.main} lip={theme.lip} textColor={theme.ink} onPress={spin} testID="conjugation-spin" big />
              </Animated.View>
            ) : null}

            {revealed ? (
              <Animated.View entering={FadeIn.duration(250)} style={[styles.prompt, { backgroundColor: colors.card, borderColor: theme.main + '55' }]}>
                {q.context ? (
                  <>
                    <Text style={[ui.label, { color: theme.lip }]}>COMPLETE THE SENTENCE · {q.tense.toUpperCase()}</Text>
                    <Text style={[ui.big, { color: colors.foreground, fontSize: 19 }]}>
                      {q.context.before}<Text style={{ color: theme.lip, textDecorationLine: 'underline' }}>{picked ?? '_____'}</Text>{q.context.after}
                    </Text>
                    <Text style={[ui.small, { color: colors.mutedForeground }]}>{q.context.english}</Text>
                  </>
                ) : (
                  <>
                    <Text style={[ui.label, { color: theme.lip }]}>CONJUGATE · PRESENT</Text>
                    <Text style={[ui.big, { color: colors.foreground }]}>
                      {q.pronoun} <Text style={{ color: theme.lip, textDecorationLine: 'underline' }}>{picked ?? '_____'}</Text>
                    </Text>
                    <Text style={[ui.small, { color: colors.mutedForeground }]}>{q.verb} · {q.verbEnglish}{q.pronounEnglish ? ` · ${q.pronounEnglish}` : ''}</Text>
                  </>
                )}
              </Animated.View>
            ) : null}

            {stage === 'answer' ? (
              <View style={{ gap: 10 }}>
                <View style={[styles.modeRow, { backgroundColor: colors.muted }]}>
                  {(['pick', 'type'] as const).map(m => (
                    <Pressable key={m} onPress={() => setMode(m)} accessibilityRole="tab" accessibilityState={{ selected: mode === m }} testID={`conjugation-mode-${m}`}
                      style={[styles.modeBtn, mode === m && { backgroundColor: colors.card }]}>
                      <Text style={[ui.small, { color: mode === m ? theme.lip : colors.mutedForeground, fontFamily: fontFamilies.extraBold }]}>{m === 'pick' ? 'Pick' : 'Type it'}</Text>
                    </Pressable>
                  ))}
                </View>
                {mode === 'pick' ? (
                  <View style={styles.grid}>
                    {q.options.map((opt, i) => (
                      <View key={`${q.id}-${opt}`} style={styles.gridCell}>
                        <ChoiceTile index={i} label={opt} state="idle" theme={theme} onPress={() => submit(opt)} testID={`conjugation-option-${i}`} />
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={{ gap: 10 }}>
                    <TextInput value={typed} onChangeText={setTyped} autoFocus autoCapitalize="none" autoCorrect={false} spellCheck={false}
                      placeholder="Type the verb form" placeholderTextColor={colors.mutedForeground} onSubmitEditing={() => submit(typed)} returnKeyType="done"
                      testID="conjugation-input" accessibilityLabel="Type the conjugated verb"
                      style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: theme.main }]} />
                    <Chunky label="Check" icon="checkmark" color={theme.main} lip={theme.lip} textColor={theme.ink} disabled={!typed.trim()} onPress={() => submit(typed)} testID="conjugation-check" />
                  </View>
                )}
              </View>
            ) : null}

            {stage === 'feedback' ? (
              <>
                {jackpotNow ? (
                  <Animated.View entering={ZoomIn.springify()} style={[styles.jackpot, { backgroundColor: theme.main, borderColor: theme.lip }]}>
                    <Ionicons name="trophy" size={22} color="#3A2600" />
                    <Text style={styles.jackpotText}>JACKPOT! +250</Text>
                  </Animated.View>
                ) : null}
                <FeedbackCard ok={ok} theme={theme} title={ok ? 'Ding ding! Correct' : 'Close — here’s why'} onNext={next}
                  nextLabel={index >= questions.length - 1 ? 'See results' : 'Next spin'} testID="conjugation-next">
                  <Text style={[ui.body, { color: colors.foreground }]}>
                    Answer: <Text style={{ fontFamily: fontFamilies.extraBold }}>{q.answer}</Text>
                  </Text>
                  {!ok ? <Text style={[ui.small, { color: colors.foreground }]}>{q.why}</Text> : null}
                  <Text style={[ui.small, { color: colors.mutedForeground }]}>{q.fullForm}</Text>
                </FeedbackCard>
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  machine: { borderRadius: 26, borderWidth: 3, borderBottomWidth: 8, padding: 12, gap: 10 },
  marquee: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  bulb: { width: 7, height: 7, borderRadius: 4 },
  marqueeText: { fontFamily: fontFamilies.extraBold, fontSize: 15, letterSpacing: 2, color: '#3A2600', marginHorizontal: 6 },
  reelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reels: { flex: 1, flexDirection: 'row', gap: 6, padding: 6, borderRadius: 16 },
  reelWindow: { height: REEL_H, borderRadius: 12, borderWidth: 2, overflow: 'hidden' },
  reelCell: { height: REEL_H, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  reelText: { fontFamily: fontFamilies.extraBold, fontSize: 17 },
  reelShade: { position: 'absolute', left: 0, right: 0, height: 0 },
  lever: { width: 34, height: 110, alignItems: 'center', justifyContent: 'flex-start' },
  leverSlot: { position: 'absolute', bottom: 0, width: 22, height: 20, borderRadius: 6 },
  leverStick: { position: 'absolute', top: 18, width: 6, height: 80, borderRadius: 3, transformOrigin: 'bottom' },
  leverKnob: { width: 30, height: 30, borderRadius: 15, borderWidth: 3 },
  prompt: { borderRadius: 20, borderWidth: 2, padding: 14, gap: 6 },
  modeRow: { flexDirection: 'row', borderRadius: 14, padding: 4, alignSelf: 'center' },
  modeBtn: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  gridCell: { width: '50%', padding: 5 },
  input: { borderRadius: 16, borderWidth: 2, padding: 14, fontSize: 18, fontFamily: fontFamilies.bold },
  jackpot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, borderWidth: 3, paddingVertical: 10 },
  jackpotText: { fontFamily: fontFamilies.extraBold, fontSize: 20, letterSpacing: 1.5, color: '#3A2600' },
});
