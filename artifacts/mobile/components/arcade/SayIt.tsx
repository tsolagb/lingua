import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Ionicons } from '@expo/vector-icons';
import { GameShell } from '@/components/arcade/GameShell';
import { SpeakerButton, usePreloadSpeech } from '@/components/SpeakerButton';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { useGameRecording } from '@/hooks/useGameRecording';
import type { SpeechAttempt } from '@/lib/arcade-speech';
import { alignWords, getSentencePool, getWordPool, shuffle, type Alignment } from '@/lib/arcade/voice-utils';
import { useArcadeRound } from '@/lib/arcade/voice-session';
import { BAD, Chunky, Confetti, GOOD, SaveRetry, VOICE_THEMES, WordDiff, resultHaptic, tapHaptic, ui } from '@/lib/arcade/voice-ui';
import { fontFamilies } from '@/constants/typography';

const GAME_ID = 'say-it';
const TOTAL = 8;
const MAX_SECONDS = 25;
const theme = VOICE_THEMES[GAME_ID];

type Prompt = { id: string; kind: 'word' | 'sentence'; english: string; target: string };
type Outcome = { attempt: SpeechAttempt; align: Alignment; stars: number };

function friendlyStars(ratio: number) {
  return ratio >= 0.85 ? 3 : ratio >= 0.5 ? 2 : 1;
}

export default function SayIt() {
  const colors = useColors();
  const reduced = useReduceMotion();
  const { activeLanguage, recordWordAnswer, recordGuidedSentenceAnswer } = useGame();
  const { playCorrect, playWrong, stopSpeaking } = useSound();
  const rec = useGameRecording(activeLanguage);
  const game = useArcadeRound(GAME_ID);
  const micBusy = rec.status === 'requesting' || rec.isRecording || rec.isProcessing;
  const cancelledRef = useRef(false);

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [index, setIndex] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(0);
  const [ratioSum, setRatioSum] = useState(0);
  const [score, setScore] = useState(0);
  const [burst, setBurst] = useState(0);

  const pressingRef = useRef(false);
  const startedRef = useRef(false);
  const scoringRef = useRef(false);
  const promptIdRef = useRef<string | null>(null);
  const recordedReviewRef = useRef<Set<string>>(new Set());
  const bestRatioRef = useRef<Map<string, number>>(new Map());
  const cancelRef = useRef(rec.cancelRecording);
  cancelRef.current = rec.cancelRecording;

  const current = prompts[index];
  promptIdRef.current = current?.id ?? null;
  usePreloadSpeech(useMemo(() => prompts.map(p => p.target), [prompts]), activeLanguage, ['normal', 'slow']);

  // Cancel any capture when the prompt changes or the game leaves "playing".
  useEffect(() => () => {
    pressingRef.current = false;
    startedRef.current = false;
    void cancelRef.current();
  }, [index, game.phase]);
  useFocusEffect(useCallback(() => () => { void cancelRef.current(); stopSpeaking(); }, [stopSpeaking]));

  useEffect(() => { if (micBusy) stopSpeaking(); }, [micBusy, stopSpeaking]);

  // Mic pulse
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (rec.isRecording && !reduced) pulse.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0, { duration: 700 })), -1);
    else { cancelAnimation(pulse); pulse.value = withTiming(0); }
  }, [rec.isRecording, reduced, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: 0.25 + pulse.value * 0.35, transform: [{ scale: 1 + pulse.value * 0.35 }] }));
  const press = useSharedValue(0);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * 5 }, { scale: 1 - press.value * 0.03 }] }));

  const start = () => {
    const words = shuffle(getWordPool(activeLanguage)).slice(0, TOTAL / 2)
      .map(p => ({ id: `w-${p.english}`, kind: 'word' as const, english: p.english, target: p.translations[activeLanguage] }));
    const sentences = shuffle(getSentencePool(activeLanguage, 6)).slice(0, TOTAL - words.length)
      .map(s => ({ id: s.id, kind: 'sentence' as const, english: s.english, target: s.translations[activeLanguage] }));
    setPrompts([...words, ...sentences].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'word' ? -1 : 1)));
    setIndex(0); setOutcome(null); setNotice(null); setServiceError(null);
    setAttempted(0); setRatioSum(0); setScore(0); setBurst(0);
    recordedReviewRef.current = new Set();
    bestRatioRef.current = new Map();
    game.begin();
  };

  const applyResult = (prompt: Prompt, attempt: SpeechAttempt) => {
    const align = alignWords(prompt.target, attempt.transcription);
    const ratio = align.ratio;
    const stars = friendlyStars(ratio);
    const ok = ratio >= 0.6;
    // first real attempt per prompt feeds review
    if (!recordedReviewRef.current.has(prompt.id)) {
      recordedReviewRef.current.add(prompt.id);
      if (prompt.kind === 'word') recordWordAnswer(prompt.english, ok, undefined, undefined, activeLanguage);
      else recordGuidedSentenceAnswer({ sentenceId: prompt.id, english: prompt.english, target: prompt.target }, ok, activeLanguage);
    }
    // count best attempt per prompt only
    const prevBest = bestRatioRef.current.get(prompt.id);
    if (prevBest === undefined) setAttempted(a => a + 1);
    if (prevBest === undefined || ratio > prevBest) {
      bestRatioRef.current.set(prompt.id, ratio);
      setRatioSum(s => s + ratio - (prevBest ?? 0));
      setScore(s => s + Math.round((ratio - (prevBest ?? 0)) * 100));
    }
    resultHaptic(ok);
    if (ok) { playCorrect(); setBurst(b => b + 1); } else playWrong();
    setOutcome({ attempt, align, stars });
  };

  const onPressIn = async () => {
    if (!current || scoringRef.current || rec.isProcessing || startedRef.current) return;
    press.value = withTiming(1, { duration: 70 });
    tapHaptic();
    stopSpeaking();
    pressingRef.current = true;
    cancelledRef.current = false;
    setNotice(null); setServiceError(null);
    const ok = await rec.startRecording();
    if (!ok) return; // denied / error surfaced via rec.status
    if (!pressingRef.current) {
      await rec.cancelRecording();
      setNotice('Microphone ready. Press and hold the mic again while you speak.');
      return;
    }
    startedRef.current = true;
  };

  const onPressOut = async () => {
    press.value = withSpring(0, { damping: 12, stiffness: 300 });
    pressingRef.current = false;
    if (!startedRef.current || !current || cancelledRef.current) return;
    startedRef.current = false;
    if (scoringRef.current) return;
    scoringRef.current = true;
    const prompt = current;
    try {
      const attempt = await rec.stopAndScore(prompt.target);
      if (cancelledRef.current || promptIdRef.current !== prompt.id) return;
      if (attempt && attempt.transcription.trim()) applyResult(prompt, attempt);
      else if (attempt) setServiceError('We did not catch any words. Hold the mic and speak a little louder. Nothing was counted.');
      else setServiceError('We could not check that recording. Nothing was counted — hold the mic to try again.');
    } finally {
      scoringRef.current = false;
    }
  };

  const cancelProcessing = async () => {
    scoringRef.current = false;
    startedRef.current = false;
    pressingRef.current = false;
    cancelledRef.current = true; // ignore any late score from the cancelled capture
    await rec.cancelRecording();
  };

  const finishRound = () => {
    void cancelRef.current();
    stopSpeaking();
    const avg = attempted ? ratioSum / attempted : 0;
    const stars = attempted ? (avg >= 0.85 ? 3 : avg >= 0.6 ? 2 : 1) : 0;
    game.finish({ score, stars, xp: attempted ? attempted * 2 + stars : 0 });
  };

  const next = () => {
    if (index >= prompts.length - 1) { finishRound(); return; }
    setOutcome(null); setNotice(null); setServiceError(null);
    setIndex(i => i + 1);
  };

  const status = rec.status;
  const micLabel = rec.isRecording ? `Listening… ${Math.min(MAX_SECONDS, Math.floor(rec.durationSeconds))}s` : rec.isProcessing ? 'Checking words…' : status === 'requesting' ? 'Allow microphone…' : outcome ? 'Hold to try again' : 'Hold to speak';

  return (
    <GameShell
      gameId={GAME_ID}
      phase={game.phase}
      score={game.phase === 'results' ? game.outcome.score : score}
      bestScore={game.bestScore}
      stars={game.outcome.stars}
      xp={game.xpEarned}
      progress={prompts.length ? (index + (outcome ? 1 : 0)) / prompts.length : 0}
      saving={game.saving}
      error={game.error}
      onPlay={start}
      onReplay={start}
      onDone={() => router.back()}
      footer={game.phase === 'results' ? <SaveRetry error={game.error} onRetry={game.retrySave} testID="say-it-retry-save" /> : undefined}
    >
      {current ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Confetti burst={burst} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: theme.main + '44' }]}>
            <Text style={[ui.label, { color: theme.main }]}>SAY IT OUT LOUD · {index + 1}/{prompts.length}</Text>
            <Text style={[styles.target, { color: colors.foreground }]} accessibilityRole="header">{current.target}</Text>
            <Text style={[ui.body, { color: colors.mutedForeground, textAlign: 'center' }]}>{current.english}</Text>
            <SpeakerButton text={current.target} language={activeLanguage} label="Hear it" showSlow testID="say-it-hear" accessibilityLabel="Hear the phrase first" disabled={micBusy} />
          </View>

          <View style={styles.micZone}>
            <View style={styles.micWrap}>
              <Animated.View pointerEvents="none" style={[styles.micPulse, { backgroundColor: theme.main }, pulseStyle]} />
              <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={rec.isProcessing}
                accessibilityRole="button"
                accessibilityLabel={rec.isRecording ? 'Recording. Release to check your words' : 'Press and hold to record yourself'}
                accessibilityHint="Microphone permission is only requested when you press this."
                accessibilityState={{ busy: rec.isProcessing }}
                testID="say-it-mic"
              >
                <View style={[styles.micLip, { backgroundColor: rec.isRecording ? '#B8331C' : theme.lip }]}>
                  <Animated.View style={[styles.mic, { backgroundColor: rec.isRecording ? '#E8452A' : theme.main }, pressStyle]}>
                    {rec.isProcessing ? <ActivityIndicator color="#FFFFFF" size="large" /> : <Ionicons name={rec.isRecording ? 'radio-button-on' : 'mic'} size={44} color="#FFFFFF" />}
                  </Animated.View>
                </View>
              </Pressable>
            </View>
            <Text style={[styles.micLabel, { color: colors.foreground }]} accessibilityLiveRegion="polite">{micLabel}</Text>
            {rec.isRecording ? (
              <View style={[styles.timerTrack, { backgroundColor: colors.muted }]}>
                <View style={[styles.timerFill, { backgroundColor: theme.main, width: `${Math.min(100, (rec.durationSeconds / MAX_SECONDS) * 100)}%` }]} />
              </View>
            ) : null}
            {rec.isRecording || rec.isProcessing ? (
              <Chunky label={rec.isRecording ? 'Cancel recording' : 'Cancel check'} icon="close" color={colors.muted} lip={colors.border} textColor={colors.foreground} onPress={cancelProcessing} testID="say-it-cancel" />
            ) : null}
          </View>

          {notice ? <Text style={[ui.body, styles.notice, { color: theme.lip, backgroundColor: theme.soft }]} accessibilityLiveRegion="polite">{notice}</Text> : null}
          {status === 'denied' ? (
            <View style={[styles.notice, { backgroundColor: BAD + '14', gap: 8 }]}>
              <Text style={[ui.body, { color: colors.foreground }]}>Microphone access is off. You can turn it on in Settings, or skip speaking for now.</Text>
              <Chunky label="Open Settings" icon="settings" color={theme.main} lip={theme.lip} textColor={theme.ink} onPress={() => void rec.openSettings()} testID="say-it-open-settings" />
            </View>
          ) : null}
          {serviceError || (status === 'error' && rec.error) ? (
            <Text style={[ui.body, styles.notice, { color: colors.foreground, backgroundColor: BAD + '14' }]} accessibilityLiveRegion="polite">
              {serviceError ?? rec.error}
            </Text>
          ) : null}

          {outcome ? (
            <View style={[styles.result, { backgroundColor: colors.card, borderColor: (outcome.align.ratio >= 0.6 ? GOOD : BAD) + '66' }]}>
              <View style={styles.resultHead}>
                <Text style={[ui.label, { color: colors.mutedForeground }]}>WORDS MATCHED</Text>
                <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={`${outcome.stars} of 3 stars`}>
                  {[1, 2, 3].map(s => <Ionicons key={s} name={s <= outcome.stars ? 'star' : 'star-outline'} size={20} color="#FFB020" />)}
                </View>
              </View>
              <Text style={[styles.matched, { color: colors.foreground }]}>{outcome.align.matched} / {outcome.align.total}</Text>
              <WordDiff label="TARGET WORDS" words={outcome.align.expected} />
              <Text style={[ui.label, { color: colors.mutedForeground }]}>WE HEARD</Text>
              <View testID="say-it-transcript" accessibilityLabel={`We heard: ${outcome.attempt.transcription}`}>
                {outcome.align.actual.length ? <WordDiff words={outcome.align.actual} /> : <Text style={[ui.body, { color: colors.foreground }]}>“{outcome.attempt.transcription}”</Text>}
              </View>
              <Text style={[ui.label, { color: colors.mutedForeground }]}>CORRECT PHRASE</Text>
              <Text style={[ui.body, { color: colors.foreground, fontFamily: fontFamilies.extraBold }]}>{current.target}</Text>
              <Text style={[ui.small, { color: colors.mutedForeground }]}>This checks which words were recognised — not your accent or pronunciation.</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            {outcome ? (
              <Chunky label={index >= prompts.length - 1 ? 'See results' : 'Next'} icon="arrow-forward" color={theme.main} lip={theme.lip} textColor={theme.ink} onPress={next} testID="say-it-next" big disabled={rec.isRecording || rec.isProcessing} />
            ) : (
              <Chunky label="Can't speak now — skip" icon="play-skip-forward" color={colors.muted} lip={colors.border} textColor={colors.foreground}
                onPress={next} testID="say-it-skip" disabled={rec.isRecording || rec.isProcessing} accessibilityLabel="Skip this phrase. No points and no penalty." />
            )}
            <Text onPress={finishRound} accessibilityRole="button" testID="say-it-finish" style={[ui.small, { color: colors.mutedForeground, textAlign: 'center', textDecorationLine: 'underline' }]}>
              Finish round now
            </Text>
          </View>
        </ScrollView>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { borderRadius: 24, borderWidth: 2, padding: 16, alignItems: 'center', gap: 8 },
  target: { fontFamily: fontFamilies.extraBold, fontSize: 26, lineHeight: 34, textAlign: 'center' },
  micZone: { alignItems: 'center', gap: 8 },
  micWrap: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  micPulse: { position: 'absolute', width: 112, height: 112, borderRadius: 56 },
  micLip: { width: 104, height: 108, borderRadius: 54, alignItems: 'center' },
  mic: { width: 104, height: 102, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  micLabel: { fontFamily: fontFamilies.extraBold, fontSize: 16 },
  timerTrack: { width: 180, height: 8, borderRadius: 4, overflow: 'hidden' },
  timerFill: { height: 8, borderRadius: 4 },
  notice: { borderRadius: 16, padding: 12, overflow: 'hidden' },
  result: { borderRadius: 20, borderWidth: 2, padding: 14, gap: 8 },
  resultHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matched: { fontFamily: fontFamilies.extraBold, fontSize: 30 },
  actions: { gap: 12 },
});
