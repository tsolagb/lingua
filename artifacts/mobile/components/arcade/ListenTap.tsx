import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, cancelAnimation } from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Ionicons } from '@expo/vector-icons';
import { GameShell } from '@/components/arcade/GameShell';
import { SpeakerButton, usePreloadSpeech } from '@/components/SpeakerButton';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { buildListenRounds } from '@/lib/arcade/voice-utils';
import { starsFor, useArcadeRound } from '@/lib/arcade/voice-session';
import { ChoiceTile, Chunky, Confetti, FeedbackCard, SaveRetry, StreakPill, VOICE_THEMES, resultHaptic, ui } from '@/lib/arcade/voice-ui';
import { fontFamilies } from '@/constants/typography';

const GAME_ID = 'listen-tap';
const TOTAL = 10;
const HEARTS = 3;
const theme = VOICE_THEMES[GAME_ID];

type Round = ReturnType<typeof buildListenRounds>[number];

function PulseRings({ active }: { active: boolean }) {
  const p = useSharedValue(0);
  const reduced = useReduceMotion();
  useEffect(() => {
    if (active && !reduced) p.value = withRepeat(withSequence(withTiming(1, { duration: 1100 }), withTiming(0, { duration: 0 })), -1);
    else { cancelAnimation(p); p.value = 0; }
  }, [active, reduced, p]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - p.value), transform: [{ scale: 1 + p.value * 0.6 }] }));
  return <Animated.View pointerEvents="none" style={[styles.ring, { borderColor: theme.main }, ring]} />;
}

export default function ListenTap() {
  const colors = useColors();
  const { activeLanguage, isMuted, toggleMute, recordWordAnswer, recordGuidedSentenceAnswer } = useGame();
  const { playCorrect, playWrong, speak, stopSpeaking, speechState } = useSound();
  const game = useArcadeRound(GAME_ID);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [hearts, setHearts] = useState(HEARTS);
  const [correct, setCorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [burst, setBurst] = useState(0);
  const answeredRef = useRef(false);

  const current = rounds[index];
  usePreloadSpeech(useMemo(() => rounds.map(r => r.item.target), [rounds]), activeLanguage, ['normal', 'slow']);

  // Explicit listening game: auto-play the prompt once per question, respecting mute.
  useEffect(() => {
    if (game.phase !== 'playing' || !current || isMuted) return;
    speak(current.item.target, activeLanguage);
  }, [game.phase, current?.item.id, index, isMuted]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopSpeaking(), [stopSpeaking]);

  const start = () => {
    setRounds(buildListenRounds(activeLanguage, TOTAL));
    setIndex(0); setPicked(null); setHearts(HEARTS); setCorrect(0); setScore(0); setStreak(0); setBurst(0);
    answeredRef.current = false;
    game.begin();
  };

  const pick = (option: string) => {
    if (!current || answeredRef.current) return;
    answeredRef.current = true;
    setPicked(option);
    const ok = option === current.item.english;
    const { item } = current;
    if (item.kind === 'word') recordWordAnswer(item.english, ok, undefined, undefined, activeLanguage);
    else recordGuidedSentenceAnswer({ sentenceId: item.id, english: item.english, target: item.target }, ok, activeLanguage);
    resultHaptic(ok);
    if (ok) {
      playCorrect();
      const s = streak + 1;
      setStreak(s);
      setCorrect(c => c + 1);
      setScore(v => v + 100 + (s - 1) * 20);
      setBurst(b => b + 1);
    } else {
      playWrong();
      setStreak(0);
      setHearts(h => h - 1);
    }
  };

  const next = () => {
    stopSpeaking();
    const last = index >= rounds.length - 1 || hearts <= 0;
    if (last) {
      const stars = starsFor(correct / TOTAL);
      game.finish({ score, stars, xp: correct * 2 + stars });
      return;
    }
    answeredRef.current = false;
    setPicked(null);
    setIndex(i => i + 1);
  };

  const ok = picked !== null && current && picked === current.item.english;
  const playing = !!current && speechState.status === 'playing';

  return (
    <GameShell
      gameId={GAME_ID}
      phase={game.phase}
      score={game.phase === 'results' ? game.outcome.score : score}
      bestScore={game.bestScore}
      stars={game.outcome.stars}
      xp={game.xpEarned}
      hearts={hearts}
      progress={rounds.length ? (index + (picked ? 1 : 0)) / TOTAL : 0}
      saving={game.saving}
      error={game.error}
      onPlay={start}
      onReplay={start}
      onDone={() => router.back()}
      footer={game.phase === 'results' ? <SaveRetry error={game.error} onRetry={game.retrySave} testID="listen-tap-retry-save" /> : undefined}
    >
      {current ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Confetti burst={burst} />
          {isMuted ? (
            <View style={[ui.feedback, { backgroundColor: theme.soft, borderColor: theme.main + '66', padding: 12 }]} testID="listen-tap-muted">
              <Text style={[ui.body, { color: colors.foreground }]}>Sound is off, and this game needs audio. Turn sound on to hear each question.</Text>
              <Chunky label="Turn sound on" icon="volume-high" color={theme.main} lip={theme.lip} textColor={theme.ink} testID="listen-tap-unmute"
                onPress={toggleMute} />
            </View>
          ) : null}
          <View style={[styles.stage, { backgroundColor: colors.card, borderColor: theme.main + '44' }]}>
            <Text style={[ui.label, { color: theme.main }]}>
              {current.item.kind === 'word' ? 'WHAT DOES THIS WORD MEAN?' : 'WHAT DOES THIS SENTENCE MEAN?'}
            </Text>
            <View style={styles.earWrap}>
              <PulseRings active={playing} />
              <View style={[styles.ear, { backgroundColor: theme.main }]}>
                <Ionicons name="ear" size={40} color="#FFFFFF" />
              </View>
            </View>
            <SpeakerButton
              text={current.item.target}
              language={activeLanguage}
              label="Replay"
              showSlow
              testID="listening-replay"
              accessibilityLabel="Replay the audio"
            />
            {picked ? (
              <Animated.Text entering={FadeIn} style={[styles.reveal, { color: colors.foreground }]}>{current.item.target}</Animated.Text>
            ) : null}
            <StreakPill streak={streak} theme={theme} />
          </View>

          <View style={styles.options}>
            {current.options.map((opt, i) => {
              const state = !picked ? 'idle' : opt === current.item.english ? 'correct' : opt === picked ? 'wrong' : 'dim';
              return (
                <ChoiceTile key={`${current.item.id}-${opt}`} index={i} label={opt} state={state} theme={theme}
                  disabled={!!picked} onPress={() => pick(opt)} testID={`listen-tap-option-${i}`} />
              );
            })}
          </View>

          {picked ? (
            <FeedbackCard
              ok={!!ok}
              theme={theme}
              title={ok ? (streak >= 3 ? `${streak} in a row!` : 'Nice ears!') : hearts <= 0 ? 'Out of hearts' : 'Not quite'}
              onNext={next}
              nextLabel={index >= rounds.length - 1 || hearts <= 0 ? 'See results' : 'Next'}
              testID="listen-tap-next"
            >
              <Text style={[ui.body, { color: colors.foreground }]}>
                <Text style={{ fontFamily: fontFamilies.extraBold }}>{current.item.target}</Text> means “{current.item.english}”.
              </Text>
            </FeedbackCard>
          ) : null}
        </ScrollView>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  stage: { borderRadius: 24, borderWidth: 2, padding: 16, alignItems: 'center', gap: 12 },
  earWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  ear: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 4 },
  reveal: { fontFamily: fontFamilies.extraBold, fontSize: 20, textAlign: 'center' },
  options: { gap: 10 },
});
