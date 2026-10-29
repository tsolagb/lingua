import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { goBackOr } from '@/lib/navigation';
import { createQuestionClock, type QuestionClockToken } from '@/lib/arcade/question-clock';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, ZoomIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Ionicons } from '@expo/vector-icons';
import { GameShell } from '@/components/arcade/GameShell';
import { SpeakerButton } from '@/components/SpeakerButton';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { useArcadeProgress } from '@/hooks/useArcadeProgress';
import { arcadeContentWon } from '@/lib/arcade-progress';
import { GUIDED_MILESTONES } from '@/data/guided-curriculum';
import { isSpeechAvailable } from '@/lib/speech-voice';
import { makeSessionId } from '@/lib/arcade/voice-utils';
import {
  BOSS_HEARTS, BOSS_HP, BOSS_QUESTION_SECONDS, bossDamage, bossLook, buildBossQuestions, isBossUnlocked, parseMilestoneParam, type BossQuestion,
} from '@/lib/arcade/boss-battle';
import { BAD, ChoiceTile, Chunky, FeedbackCard, GOOD, SaveRetry, resultHaptic, ui, type VoiceTheme } from '@/lib/arcade/voice-ui';
import { fontFamilies } from '@/constants/typography';

const GAME_ID = 'boss-battle' as const;
const theme = { main: '#8B5CF6', lip: '#6A3FD6', ink: '#FFFFFF', soft: '#8B5CF622', icon: 'skull' } as unknown as VoiceTheme;
type Stage = 'answer' | 'feedback';

/* ---------- Shape-built monster ---------- */
function Monster({ milestone, hitKey, angry, size = 150 }: { milestone: number; hitKey: number; angry: boolean; size?: number }) {
  const look = bossLook(milestone);
  const reduced = useReduceMotion();
  const bob = useSharedValue(0);
  const hit = useSharedValue(0);
  const x = useSharedValue(0);
  useEffect(() => {
    if (!reduced) bob.value = withRepeat(withSequence(withTiming(-6, { duration: 700 }), withTiming(0, { duration: 700 })), -1, true);
  }, [bob, reduced]);
  useEffect(() => {
    if (!hitKey) return;
    hit.value = withSequence(withTiming(1, { duration: 70 }), withSpring(0, { damping: 6, stiffness: 220 }));
    if (!reduced) x.value = withSequence(withTiming(-10, { duration: 45 }), withTiming(10, { duration: 45 }), withTiming(-6, { duration: 45 }), withTiming(0, { duration: 45 }));
  }, [hitKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value - hit.value * 14 }, { translateX: x.value }, { scaleX: 1 + hit.value * 0.12 }, { scaleY: 1 - hit.value * 0.1 }] }));
  const flash = useAnimatedStyle(() => ({ opacity: hit.value * 0.6 }));
  const s = size;
  const eyeXs = look.eyes === 1 ? [0] : look.eyes === 2 ? [-s * 0.17, s * 0.17] : [-s * 0.22, 0, s * 0.22];
  const hornXs = look.horns === 2 ? [-s * 0.28, s * 0.28] : [-s * 0.3, 0, s * 0.3];
  return (
    <Animated.View style={[{ width: s * 1.3, height: s * 1.25, alignItems: 'center', justifyContent: 'flex-end' }, st]} accessible accessibilityLabel={`Boss ${look.name}`}>
      {hornXs.map((hx, i) => (
        <View key={`h${i}`} style={{ position: 'absolute', top: s * 0.04, left: s * 0.65 + hx - s * 0.09, width: 0, height: 0, borderLeftWidth: s * 0.09, borderRightWidth: s * 0.09, borderBottomWidth: s * 0.26, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: look.horn, transform: [{ rotate: `${hx < 0 ? -18 : hx > 0 ? 18 : 0}deg` }] }} />
      ))}
      <View style={{ width: s * 1.05, height: s * 1.0, borderRadius: s * 0.5, backgroundColor: look.lip, paddingBottom: 8 }}>
        <View style={{ flex: 1, borderRadius: s * 0.5, backgroundColor: look.body, alignItems: 'center', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', bottom: -s * 0.25, width: s * 0.7, height: s * 0.55, borderRadius: s * 0.35, backgroundColor: look.belly, opacity: 0.85 }} />
          <View style={{ flexDirection: 'row', marginTop: s * 0.24, gap: 0 }}>
            {eyeXs.map((ex, i) => (
              <View key={`e${i}`} style={{ position: 'absolute', left: ex - s * 0.09, width: s * 0.18, height: angry ? s * 0.13 : s * 0.18, borderRadius: s * 0.09, backgroundColor: '#FFFDF7', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: s * 0.08, height: s * 0.08, borderRadius: s * 0.04, backgroundColor: '#1E1530' }} />
              </View>
            ))}
          </View>
          <View style={{ position: 'absolute', top: s * 0.56, width: s * 0.46, height: s * 0.16, borderBottomLeftRadius: s * 0.2, borderBottomRightRadius: s * 0.2, backgroundColor: '#3A1630', flexDirection: 'row', justifyContent: 'space-evenly' }}>
            {Array.from({ length: look.spikes }, (_, i) => (
              <View key={`t${i}`} style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 9, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#FFFDF7' }} />
            ))}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: s * 0.3, marginTop: -6 }}>
        {[0, 1].map(i => <View key={i} style={{ width: s * 0.22, height: s * 0.12, borderRadius: s * 0.06, backgroundColor: look.lip }} />)}
      </View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', borderRadius: s }, flash]} />
    </Animated.View>
  );
}

function HpBar({ hp }: { hp: number }) {
  const colors = useColors();
  const w = useSharedValue(1);
  useEffect(() => { w.value = withSpring(hp / BOSS_HP, { damping: 14 }); }, [hp, w]);
  const st = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.max(0, w.value) }] }));
  const color = hp > 50 ? GOOD : hp > 25 ? '#F59E0B' : BAD;
  return (
    <View style={[styles.hpTrack, { backgroundColor: colors.border }]} accessibilityLabel={`Boss health ${hp} of ${BOSS_HP}`}>
      <Animated.View style={[styles.hpFill, { backgroundColor: color, transformOrigin: 'left' } as any, st]} />
      <Text style={styles.hpText}>{hp} / {BOSS_HP}</Text>
    </View>
  );
}

/* ---------- Game ---------- */
export default function BossBattle() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ milestone?: string }>();
  const { activeLanguage, isLevelCompleted, isMuted, toggleMute, progress, recordWordAnswer, recordGuidedSentenceAnswer } = useGame();
  const { playCorrect, playWrong, speak, speakCorrectAnswer, speechState, stopSpeaking } = useSound();
  const arc = useArcadeProgress(GAME_ID);

  const [milestone, setMilestone] = useState<number | null>(() => parseMilestoneParam(params.milestone));
  const [phase, setPhase] = useState<'intro' | 'playing' | 'results'>('intro');
  const [questions, setQuestions] = useState<BossQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('answer');
  const [picked, setPicked] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [lastDamage, setLastDamage] = useState(0);
  const [hp, setHp] = useState(BOSS_HP);
  const [hearts, setHearts] = useState(BOSS_HEARTS);
  const [seconds, setSeconds] = useState(BOSS_QUESTION_SECONDS);
  const [hitKey, setHitKey] = useState(0);
  const [score, setScore] = useState(0);
  const [outcome, setOutcome] = useState({ score: 0, stars: 0, xp: 0, won: false });
  const [xpEarned, setXpEarned] = useState(0);
  const [savedBest, setSavedBest] = useState(0);

  const [armed, setArmed] = useState(false);
  const [showText, setShowText] = useState(false);
  const answered = useRef(false);
  const sessionRef = useRef('');
  const savedRef = useRef(false);
  const outcomeRef = useRef(outcome);
  const clock = useRef(createQuestionClock(BOSS_QUESTION_SECONDS)).current;
  const timerToken = clock.token();

  const arm = () => {
    if (clock.arm(clock.token())) {
      setSeconds(BOSS_QUESTION_SECONDS);
      setArmed(true);
    }
  };
  const openQuestion = (qq: BossQuestion | undefined) => {
    stopSpeaking();
    answered.current = false;
    setShowText(false);
    setSeconds(BOSS_QUESTION_SECONDS);
    clock.close();
    const paused = !!qq && qq.kind === 'listen' && !!qq.audio && !isMuted;
    if (qq) clock.open(qq.id, paused);
    setArmed(!paused);
  };
  const audioOn = !isMuted && isSpeechAvailable(activeLanguage);
  const unlocked = useCallback((m: number) => isBossUnlocked(isLevelCompleted, m), [isLevelCompleted]);
  const q = questions[index];

  const begin = (m: number) => {
    if (!unlocked(m)) return;
    const qs = buildBossQuestions(activeLanguage, m, audioOn);
    if (qs.length < 4) return;
    const sid = makeSessionId(GAME_ID);
    if (!arc.beginSession(sid)) return;
    sessionRef.current = sid; savedRef.current = false;
    setMilestone(m); setQuestions(qs); setIndex(0); setStage('answer'); setPicked(null); setTimedOut(false);
    setHp(BOSS_HP); setHearts(BOSS_HEARTS); setScore(0); setHitKey(0); setXpEarned(0); setSavedBest(0);
    openQuestion(qs[0]);
    setPhase('playing');
  };

  const save = useCallback(async () => {
    if (savedRef.current || !sessionRef.current || milestone === null) return;
    const o = outcomeRef.current;
    try {
      const res = await arc.finishGame({ sessionId: sessionRef.current, score: o.score, stars: o.stars, xp: o.xp, contentId: `milestone-${milestone}`, won: o.won });
      savedRef.current = true;
      setXpEarned(res.xpEarned); setSavedBest(res.bestScore);
    } catch { /* saveError drives retry */ }
  }, [arc, milestone]);

  const end = (won: boolean, finalScore: number, heartsLeft: number) => {
    clock.close();
    const stars = won ? Math.max(1, heartsLeft) : 0;
    const o = { score: finalScore, stars, xp: won ? (heartsLeft === BOSS_HEARTS ? 40 : 30) : 0, won };
    outcomeRef.current = o; setOutcome(o);
    setPhase('results');
    void save();
  };

  const resolve = (choice: string | null, sourceToken: QuestionClockToken | null = clock.token()) => {
    if (!q || answered.current || stage !== 'answer' || !sourceToken || sourceToken.id !== q.id || clock.token() !== sourceToken) return;
    const remaining = clock.remaining(sourceToken);
    // A queued timeout can never resolve a paused or newer question.
    if (choice === null && (remaining === null || remaining > 0)) return;
    answered.current = true;
    const left = remaining ?? BOSS_QUESTION_SECONDS;
    const expired = remaining !== null && remaining <= 0;
    clock.close(sourceToken);
    setArmed(false);
    stopSpeaking();
    const ok = choice !== null && !expired && choice === q.answer;
    setPicked(choice); setTimedOut(choice === null || expired);
    resultHaptic(ok);
    if (q.sentence) recordGuidedSentenceAnswer({ sentenceId: q.sentence.id, english: q.sentence.english, target: q.sentence.target }, ok, activeLanguage);
    else if (q.pair) recordWordAnswer(q.pair.english, ok, undefined, undefined, activeLanguage);
    if (ok) {
      playCorrect();
      const dmg = bossDamage(left);
      setLastDamage(dmg);
      setHp(h => Math.max(0, h - dmg));
      setHitKey(k => k + 1);
      setScore(s => s + dmg * 10);
      const say = q.pair?.translations[activeLanguage] ?? q.sentence?.target;
      if (say) speakCorrectAnswer(say, activeLanguage);
    } else {
      playWrong();
      setLastDamage(0);
      setHearts(h => Math.max(0, h - 1));
    }
    setStage('feedback');
  };
  useEffect(() => () => { clock.close(); stopSpeaking(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const resolveRef = useRef(resolve);
  resolveRef.current = resolve;

  // Local per-question timer: only runs while actively answering.
  useEffect(() => {
    if (phase !== 'playing' || stage !== 'answer' || !q || !armed) return;
    const token = clock.token();
    if (!token || token.id !== q.id) return;
    const id = setInterval(() => {
      const remaining = clock.remaining(token);
      if (remaining === null) { clearInterval(id); return; }
      const left = Math.ceil(remaining);
      setSeconds(Math.max(0, left));
      if (left <= 0) { clearInterval(id); resolveRef.current(null, token); }
    }, 250);
    return () => clearInterval(id);
  }, [phase, stage, q?.id, armed, timerToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const revealText = () => {
    if (!q || showText || answered.current || stage !== 'answer') return;
    stopSpeaking();
    setShowText(true);
    // Reading fallback gets a fresh, one-time window, never an old audio deadline.
    clock.open(q.id);
    setSeconds(BOSS_QUESTION_SECONDS);
    setArmed(true);
  };

  // Arm listening timer only once audio is really playing; fall back to text if unavailable/muted.
  useEffect(() => {
    if (phase !== 'playing' || stage !== 'answer' || !q || q.kind !== 'listen' || answered.current) return;
    if (isMuted || speechState.status === 'unavailable' && speechState.text === q.audio) { revealText(); return; }
    if (!armed && !showText && speechState.status === 'playing' && speechState.text === q.audio) arm();
  }, [speechState.status, speechState.text, isMuted, phase, stage, q?.id, armed, showText]); // eslint-disable-line react-hooks/exhaustive-deps

  // Speak listening prompts when a question opens.
  useEffect(() => {
    if (phase === 'playing' && stage === 'answer' && q?.kind === 'listen' && q.audio) speak(q.audio, activeLanguage);
  }, [phase, stage, q?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => {
    if (hp <= 0) return end(true, score + hearts * 150, hearts);
    if (hearts <= 0 || index >= questions.length - 1) return end(false, score, hearts);
    setPicked(null); setTimedOut(false);
    openQuestion(questions[index + 1]);
    setIndex(i => i + 1);
    setStage('answer');
  };

  const bestForPicker = milestone !== null ? arc.bestScore : 0;

  /* ---------- Intro / milestone picker ---------- */
  if (phase === 'intro') {
    const sel = milestone;
    const selUnlocked = sel !== null && unlocked(sel);
    const anyUnlocked = GUIDED_MILESTONES.some((_, i) => unlocked(i));
    return (
      <View style={[styles.root, { backgroundColor: colors.groupedBackground }]}>
        <View style={[styles.wash, { backgroundColor: theme.main, opacity: colors.colorScheme === 'dark' ? 0.16 : 0.1 }]} pointerEvents="none" />
        <View style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 6 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close game" testID="arcade-close" onPress={() => goBackOr('/categories?tab=games')} hitSlop={10}
            style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="close" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Boss Battle</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={isMuted ? 'Turn sound on' : 'Mute sound'} testID="boss-mute" onPress={toggleMute} hitSlop={10}
            style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={20} color={colors.foreground} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={[styles.introContent, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }]} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center' }}>
            <Monster milestone={sel ?? 0} hitKey={0} angry={false} size={120} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{sel !== null ? bossLook(sel).name : 'Pick your boss'}</Text>
          <Text style={[ui.body, { color: colors.mutedForeground, textAlign: 'center' }]}>
            {sel !== null ? `Milestone ${sel + 1} · ${GUIDED_MILESTONES[sel].title}` : 'Each Milestone has an optional Boss Battle built from its own words and grammar.'}
          </Text>
          {sel !== null && !selUnlocked ? (
            <Animated.View entering={FadeIn} style={[styles.locked, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="lock-closed" size={20} color={colors.mutedForeground} />
              <Text style={[ui.small, { color: colors.foreground, flex: 1 }]}>
              Locked. Pass Level 9 in Milestone {sel + 1} to challenge this Boss.
              </Text>
            </Animated.View>
          ) : null}
          {!anyUnlocked ? (
            <View style={[styles.locked, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="flag" size={20} color={theme.main} />
              <Text style={[ui.small, { color: colors.foreground, flex: 1 }]}>Boss Battles are optional challenges after each Milestone checkpoint. Finish Milestone 1 to meet the first Boss.</Text>
            </View>
          ) : null}
          <View style={[styles.rules, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              ['flash', `Answer within ${BOSS_QUESTION_SECONDS}s. Faster hits do more damage.`],
              ['heart', `You have ${BOSS_HEARTS} hearts. Wrong or too slow costs one.`],
              [audioOn ? 'ear' : 'book', audioOn ? 'Mixes vocab, grammar and listening.' : 'Sound is off: listening rounds become reading rounds.'],
            ].map(([icon, text]) => (
              <View key={text} style={styles.ruleRow}>
                <Ionicons name={icon as any} size={18} color={theme.main} />
                <Text style={[ui.small, { color: colors.foreground, flex: 1 }]}>{text}</Text>
              </View>
            ))}
            {sel !== null && bestForPicker > 0 ? <Text style={[ui.small, { color: colors.mutedForeground }]}>Best score (all bosses): {bestForPicker}</Text> : null}
          </View>
          <Chunky label={selUnlocked ? 'Fight!' : 'Choose an unlocked boss'} icon="flash" color={theme.main} lip={theme.lip} big disabled={!selUnlocked}
            onPress={() => sel !== null && begin(sel)} testID="arcade-play" />
          {arc.saveError ? <Text style={[ui.small, { color: BAD, textAlign: 'center' }]}>{arc.saveError}</Text> : null}
          <Text style={[ui.label, { color: colors.mutedForeground, marginTop: 6 }]}>GUIDED MILESTONES</Text>
          <View style={styles.pickGrid}>
            {GUIDED_MILESTONES.map((m, i) => {
              const open = unlocked(i);
              const won = (() => { try { return arcadeContentWon(progress, activeLanguage, GAME_ID, `milestone-${i}`); } catch { return false; } })();
              const active = sel === i;
              const look = bossLook(i);
              return (
                <Animated.View key={m.title + i} entering={FadeInDown.delay(Math.min(i, 12) * 25)} style={styles.pickCell}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Milestone ${i + 1}, ${m.title}${open ? '' : ', locked'}${won ? ', defeated' : ''}`}
                    testID={`boss-milestone-${i}`} onPress={() => setMilestone(i)}
                    style={[styles.pick, { backgroundColor: open ? look.body : colors.muted, borderColor: active ? colors.foreground : 'transparent', borderBottomColor: open ? look.lip : colors.border }]}>
                    <Text style={[styles.pickNum, { color: open ? '#FFFFFF' : colors.mutedForeground }]}>{i + 1}</Text>
                    <Ionicons name={!open ? 'lock-closed' : won ? 'trophy' : 'skull'} size={14} color={open ? '#FFFFFF' : colors.mutedForeground} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  /* ---------- Playing / results ---------- */
  const ok = !!q && !timedOut && picked === q.answer;
  return (
    <GameShell
      gameId={GAME_ID}
      phase={phase}
      score={phase === 'results' ? outcome.score : score}
      bestScore={Math.max(arc.bestScore ?? 0, savedBest)}
      stars={outcome.stars}
      xp={xpEarned}
      hearts={hearts}
      secondsLeft={stage === 'answer' && armed ? seconds : undefined}
      progress={1 - hp / BOSS_HP}
      saving={arc.isSaving}
      error={arc.saveError}
      onPlay={() => milestone !== null && begin(milestone)}
      onReplay={() => milestone !== null && begin(milestone)}
      onDone={() => goBackOr('/categories?tab=games')}
      footer={phase === 'results' ? (
        <View style={{ gap: 10 }}>
          <View style={[styles.locked, { backgroundColor: colors.card, borderColor: outcome.won ? GOOD : colors.border }]}>
            <Ionicons name={outcome.won ? 'ribbon' : 'skull'} size={22} color={outcome.won ? '#F59E0B' : colors.mutedForeground} />
            <Text style={[ui.small, { color: colors.foreground, flex: 1 }]}>
              {outcome.won
                ? `${bossLook(milestone ?? 0).name} is defeated! Boss Champion progress for Milestone ${(milestone ?? 0) + 1}.`
                : `${bossLook(milestone ?? 0).name} survived. No XP this time — review and try again.`}
            </Text>
          </View>
          <SaveRetry error={arc.saveError ?? undefined} onRetry={() => { arc.resetSaveError(); void save(); }} testID="boss-retry-save" />
        </View>
      ) : undefined}
    >
      {q && milestone !== null ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.arena, { backgroundColor: bossLook(milestone).belly + '33', borderColor: bossLook(milestone).lip + '55' }]}>
            <Text style={[ui.label, { color: colors.mutedForeground }]}>{bossLook(milestone).name.toUpperCase()} · MILESTONE {milestone + 1}</Text>
            <HpBar hp={hp} />
            <Monster milestone={milestone} hitKey={hitKey} angry={stage === 'feedback' && !ok} size={110} />
            {stage === 'feedback' && ok ? (
              <Animated.Text entering={ZoomIn.springify()} style={[styles.dmg, { color: BAD }]}>-{lastDamage}</Animated.Text>
            ) : null}
          </View>

          <View style={[styles.prompt, { backgroundColor: colors.card, borderColor: theme.main + '55' }]} key={q.id}>
            <Text style={[ui.label, { color: theme.lip }]}>{q.kind === 'grammar' ? 'GRAMMAR' : q.kind === 'listen' ? 'LISTEN' : q.kind === 'reading' ? 'READ' : 'VOCAB'}</Text>
            {q.kind === 'listen' && q.audio ? (
              <View style={{ gap: 8 }}>
                <SpeakerButton text={q.audio} language={activeLanguage} label="Hear it" showSlow testID="boss-listen" />
                {showText ? (
                  <Text style={[ui.big, { color: colors.foreground, fontSize: 21 }]} testID="boss-listen-text">{q.audio}</Text>
                ) : (
                  <Pressable accessibilityRole="button" accessibilityLabel="Show the word as text instead of audio" testID="boss-show-text"
                    onPress={revealText} hitSlop={8}>
                    <Text style={[ui.small, { color: theme.lip, fontFamily: fontFamilies.extraBold }]}>
                      {armed ? 'Can’t hear? Show text' : 'Waiting for audio… tap to read instead (timer paused)'}
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <Text style={[ui.big, { color: colors.foreground, fontSize: 21 }]}>{q.prompt}</Text>
            )}
            {q.translation && q.kind === 'grammar' ? <Text style={[ui.small, { color: colors.mutedForeground }]}>{q.translation}</Text> : null}
          </View>

          <View style={styles.grid}>
            {q.options.map((opt, i) => {
              const state = stage === 'answer' ? 'idle' : opt === q.answer ? 'correct' : opt === picked ? 'wrong' : 'dim';
              return (
                <View key={`${q.id}-${opt}`} style={styles.gridCell}>
                  <ChoiceTile index={i} label={opt} theme={theme} state={state} disabled={stage !== 'answer'} onPress={() => resolve(opt)} testID={`boss-option-${i}`} />
                </View>
              );
            })}
          </View>

          {stage === 'feedback' ? (
            <FeedbackCard ok={ok} theme={theme} onNext={next} testID="boss-next"
              title={ok ? (lastDamage >= 14 ? 'Critical hit!' : 'Hit!') : timedOut ? 'Too slow — ouch!' : 'The boss strikes back!'}
              nextLabel={hp <= 0 ? 'Finish him' : hearts <= 0 ? 'See results' : 'Next attack'}>
              <Text style={[ui.body, { color: colors.foreground }]}>Answer: <Text style={{ fontFamily: fontFamilies.extraBold }}>{q.answer}</Text></Text>
              {!ok ? <Text style={[ui.small, { color: colors.foreground }]}>{q.explanation}</Text> : null}
            </FeedbackCard>
          ) : null}
        </ScrollView>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', overflow: 'hidden' },
  wash: { position: 'absolute', top: -120, left: -60, right: -60, height: 320, borderBottomLeftRadius: 300, borderBottomRightRadius: 300 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: fontFamilies.extraBold, fontSize: 17 },
  introContent: { paddingHorizontal: 20, gap: 14 },
  title: { fontFamily: fontFamilies.extraBold, fontSize: 28, textAlign: 'center', letterSpacing: -0.5 },
  locked: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, borderBottomWidth: 3, padding: 12 },
  rules: { borderRadius: 20, borderWidth: 1, borderBottomWidth: 4, padding: 14, gap: 10 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  pickCell: { width: '16.66%', padding: 4 },
  pick: { aspectRatio: 1, borderRadius: 14, borderWidth: 2, borderBottomWidth: 5, alignItems: 'center', justifyContent: 'center', gap: 1 },
  pickNum: { fontFamily: fontFamilies.extraBold, fontSize: 15 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  arena: { borderRadius: 24, borderWidth: 2, padding: 12, alignItems: 'center', gap: 8 },
  hpTrack: { width: '100%', height: 18, borderRadius: 9, overflow: 'hidden', justifyContent: 'center' },
  hpFill: { position: 'absolute', left: 0, top: 0, bottom: 0, right: 0, borderRadius: 9 },
  hpText: { alignSelf: 'center', fontFamily: fontFamilies.extraBold, fontSize: 11, color: '#FFFFFF' },
  dmg: { position: 'absolute', right: 24, top: 60, fontFamily: fontFamilies.extraBold, fontSize: 30 },
  prompt: { borderRadius: 20, borderWidth: 2, padding: 14, gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  gridCell: { width: '50%', padding: 5 },
});
