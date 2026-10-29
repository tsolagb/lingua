import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GameShell } from '@/components/arcade/GameShell';
import { SpeakerButton, usePreloadSpeech } from '@/components/SpeakerButton';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { alignWords, getSentencePool, shuffle, type Alignment } from '@/lib/arcade/voice-utils';
import { starsFor, useArcadeRound } from '@/lib/arcade/voice-session';
import { Chunky, Confetti, FeedbackCard, SaveRetry, StreakPill, VOICE_THEMES, WordDiff, resultHaptic, ui, useShake } from '@/lib/arcade/voice-ui';
import type { SentencePracticeItem } from '@/lib/sentence-practice-utils';
import Animated from 'react-native-reanimated';

const GAME_ID = 'dictation';
const TOTAL = 10;
const theme = VOICE_THEMES[GAME_ID];

export default function Dictation() {
  const colors = useColors();
  const { activeLanguage, isMuted, toggleMute, recordGuidedSentenceAnswer } = useGame();
  const { playCorrect, playWrong, speak, stopSpeaking } = useSound();
  const game = useArcadeRound(GAME_ID);
  const [items, setItems] = useState<SentencePracticeItem[]>([]);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<{ ok: boolean; align: Alignment } | null>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [wordRatioSum, setWordRatioSum] = useState(0);
  const [streak, setStreak] = useState(0);
  const [burst, setBurst] = useState(0);
  const checkedRef = useRef(false);
  const shake = useShake();

  const current = items[index];
  const target = current?.translations[activeLanguage] ?? '';
  usePreloadSpeech(useMemo(() => items.map(i => i.translations[activeLanguage]), [items, activeLanguage]), activeLanguage, ['normal', 'slow']);

  useEffect(() => {
    if (game.phase !== 'playing' || !current || isMuted) return;
    speak(target, activeLanguage);
  }, [game.phase, current?.id, isMuted]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopSpeaking(), [stopSpeaking]);

  const start = () => {
    setItems(shuffle(getSentencePool(activeLanguage, 8)).slice(0, TOTAL));
    setIndex(0); setTyped(''); setResult(null); setShowMeaning(false);
    setCorrect(0); setScore(0); setWordRatioSum(0); setStreak(0); setBurst(0);
    checkedRef.current = false;
    game.begin();
  };

  const check = () => {
    if (!current || checkedRef.current || !typed.trim()) return;
    checkedRef.current = true;
    stopSpeaking();
    const align = alignWords(target, typed);
    const ok = align.matched === align.total && align.extra.length === 0;
    recordGuidedSentenceAnswer({ sentenceId: current.id, english: current.english, target }, ok, activeLanguage);
    resultHaptic(ok);
    setWordRatioSum(s => s + align.ratio);
    if (ok) {
      playCorrect();
      const s = streak + 1;
      setStreak(s); setCorrect(c => c + 1); setScore(v => v + 100 + (s - 1) * 20); setBurst(b => b + 1);
    } else {
      playWrong(); shake.run();
      setStreak(0); setScore(v => v + Math.round(align.ratio * 50));
    }
    setResult({ ok, align });
  };

  const next = () => {
    if (index >= items.length - 1) {
      const stars = starsFor((correct + (wordRatioSum - correct) * 0.5) / Math.max(1, items.length));
      game.finish({ score, stars, xp: correct * 3 + Math.round(wordRatioSum) + stars });
      return;
    }
    checkedRef.current = false;
    setTyped(''); setResult(null); setShowMeaning(false);
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
      progress={items.length ? (index + (result ? 1 : 0)) / items.length : 0}
      saving={game.saving}
      error={game.error}
      onPlay={start}
      onReplay={start}
      onDone={() => router.back()}
      footer={game.phase === 'results' ? <SaveRetry error={game.error} onRetry={game.retrySave} testID="dictation-retry-save" /> : undefined}
    >
      {current ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Confetti burst={burst} />
            {isMuted ? (
              <View style={[ui.feedback, { backgroundColor: theme.soft, borderColor: theme.main + '66', padding: 12 }]} testID="dictation-muted">
                <Text style={[ui.body, { color: colors.foreground }]}>Sound is off, and this game needs audio. Turn sound on to hear each question.</Text>
                <Chunky label="Turn sound on" icon="volume-high" color={theme.main} lip={theme.lip} textColor={theme.ink} testID="dictation-unmute"
                  onPress={toggleMute} />
              </View>
            ) : null}
            <View style={[styles.stage, { backgroundColor: colors.card, borderColor: theme.main + '44' }]}>
              <View style={styles.stageHead}>
                <View style={[styles.badge, { backgroundColor: theme.main }]}>
                  <Ionicons name="headset" size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[ui.label, { color: theme.main }]}>SENTENCE {index + 1} OF {items.length}</Text>
                  <Text style={[ui.body, { color: colors.foreground }]}>Type exactly what you hear.</Text>
                </View>
              </View>
              <SpeakerButton text={target} language={activeLanguage} label="Play" showSlow testID="listening-replay" accessibilityLabel="Play the sentence" />
              {showMeaning || result ? (
                <Text style={[ui.small, { color: colors.mutedForeground }]}>Meaning: {current.english}</Text>
              ) : (
                <Text onPress={() => setShowMeaning(true)} accessibilityRole="button" testID="dictation-hint"
                  style={[ui.small, { color: theme.main, textDecorationLine: 'underline' }]}>Need a hint? Show the meaning</Text>
              )}
              <StreakPill streak={streak} theme={theme} />
            </View>

            <Animated.View style={shake.style}>
              <TextInput
                value={typed}
                onChangeText={setTyped}
                editable={!result}
                placeholder="Type the sentence…"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                multiline
                onSubmitEditing={check}
                blurOnSubmit
                returnKeyType="done"
                testID="dictation-input"
                accessibilityLabel="Your answer"
                style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: result ? (result.ok ? '#3CC23C' : '#FF4B4B') : theme.main + '66' }]}
              />
            </Animated.View>
            <Text style={[ui.small, { color: colors.mutedForeground, textAlign: 'center' }]}>Accents and small typos are forgiven.</Text>

            {!result ? (
              <Chunky label="Check" icon="checkmark" color={theme.main} lip={theme.lip} textColor={theme.ink} disabled={!typed.trim()} onPress={check} testID="dictation-check" big />
            ) : (
              <FeedbackCard ok={result.ok} theme={theme} title={result.ok ? 'Perfect dictation!' : `${result.align.matched} of ${result.align.total} words`}
                onNext={next} nextLabel={index >= items.length - 1 ? 'See results' : 'Next sentence'} testID="dictation-next">
                {!result.ok ? <WordDiff label="WORD CHECK" words={result.align.expected} /> : null}
                {result.align.extra.length ? (
                  <Text style={[ui.small, { color: colors.mutedForeground }]}>Extra words: {result.align.extra.join(' ')}</Text>
                ) : null}
                <Text style={[ui.label, { color: colors.mutedForeground }]}>CORRECT SENTENCE</Text>
                <Text style={[ui.big, { color: colors.foreground, fontSize: 18 }]}>{target}</Text>
                <Text style={[ui.small, { color: colors.mutedForeground }]}>{current.english}</Text>
              </FeedbackCard>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  stage: { borderRadius: 24, borderWidth: 2, padding: 16, gap: 12 },
  stageHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 92, borderRadius: 18, borderWidth: 2, padding: 14, fontSize: 18, textAlignVertical: 'top', fontFamily: 'Nunito_700Bold' },
});
