import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Share, TextInput } from 'react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from '@/components/native';
import { goBackOr } from '@/lib/navigation';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSpeech } from '@/hooks/useSpeech';
import { useArcadeProgress } from '@/hooks/useArcadeProgress';
import { fontFamilies } from '@/constants/typography';
import { LANGUAGE_META } from '@/data/vocabulary';
import type { ArcadeResult } from '@/lib/arcade-progress';
import { ChunkyButton, GameShell, tapHaptic } from '@/components/arcade/GameShell';
import { useDailyStatus } from '@/components/arcade/DailyChallengeCard';
import {
  DAILY_CONTENT_VERSION,
  DAILY_QUESTION_COUNT,
  buildDailyQuestions,
  dailyScore,
  dailySessionId,
  dailyShareText,
  dailyStars,
  lastNDays,
  localResetLabel,
  type DailyEntry,
  type DailyQuestion,
} from '@/lib/arcade/daily';

const ACCENT = '#2F6BEA';
const GOOD = '#20B486';
const BAD = '#E5484D';
const GOLD = '#FFC53D';
const INK = '#1E2A44';

const KIND_LABEL: Record<DailyQuestion['kind'], { label: string; icon: string }> = {
  meaning: { label: 'Word meaning', icon: 'book' },
  odd: { label: 'Odd one out', icon: 'shapes' },
  grammar: { label: 'Grammar fill', icon: 'construct' },
  listen: { label: 'Listening', icon: 'ear' },
  build: { label: 'Sentence builder', icon: 'reorder-four' },
};

function OptionButton({ label, state, onPress, disabled, testID }: {
  label: string; state: 'idle' | 'right' | 'wrong' | 'dim'; onPress: () => void; disabled: boolean; testID: string;
}) {
  const colors = useColors();
  const bg = state === 'right' ? GOOD : state === 'wrong' ? BAD : colors.card;
  const lip = state === 'right' ? '#13875F' : state === 'wrong' ? '#B42328' : colors.border;
  const fg = state === 'right' || state === 'wrong' ? '#FFFFFF' : colors.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: state === 'right' || state === 'wrong' }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={[styles.optLip, { backgroundColor: lip, opacity: state === 'dim' ? 0.5 : 1 }]}
    >
      {({ pressed }) => (
        <View style={[styles.opt, { backgroundColor: bg, borderColor: colors.border, transform: [{ translateY: pressed ? 3 : 0 }] }]}>
          <Text style={[styles.optText, { color: fg }]} numberOfLines={3}>{label}</Text>
          {state === 'right' ? <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" /> : state === 'wrong' ? <Ionicons name="close-circle" size={20} color="#FFFFFF" /> : null}
        </View>
      )}
    </Pressable>
  );
}

export default function DailyChallenge() {
  const colors = useColors();
  const { activeLanguage, recordWordAnswer, recordGuidedSentenceAnswer, isMuted } = useGame();
  const { speak } = useSpeech();
  const arcade = useArcadeProgress('daily-challenge');
  const status = useDailyStatus();

  const [phase, setPhase] = useState<'intro' | 'playing' | 'results'>('intro');
  const [dateKey, setDateKey] = useState(status.today);
  const [official, setOfficial] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(0 | 1)[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [savedEntry, setSavedEntry] = useState<DailyEntry | null>(null);
  const resultRef = useRef<ArcadeResult | null>(null);

  const questions = useMemo(() => buildDailyQuestions(dateKey, activeLanguage), [dateKey, activeLanguage]);
  const q = questions[index];
  const answered = answers.length > index;
  const correctCount = answers.filter(a => a === 1).length;

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const finishRef = useRef(arcade.finishGame);
  finishRef.current = arcade.finishGame;

  const save = useCallback(() => {
    const result = resultRef.current;
    if (!result) return;
    finishRef.current(result).then(res => {
      setXpEarned(res.xpEarned);
      setSavedEntry({ dateKey: result.dateKey ?? '', score: result.score, stars: result.stars, grid: result.grid ?? '', xp: res.xpEarned } as DailyEntry);
    }).catch(() => { /* saveError shown by shell; retry reuses the same session id */ });
  }, []);

  const start = () => {
    const key = status.today;
    const isOfficial = !status.keys.has(key);
    if (isOfficial && !arcade.beginSession(dailySessionId(key, activeLanguage))) return;
    setDateKey(key);
    setOfficial(isOfficial);
    setIndex(0); setAnswers([]); setPicked(null); setBuilt([]); setRevealed(false);
    setXpEarned(0); setSavedEntry(null); setWebShare(null); resultRef.current = null;
    arcade.resetSaveError();
    setPhase('playing');
  };

  const commit = (ok: boolean) => {
    if (answered || !q) return;
    tapHaptic(ok ? 'success' : 'error');
    if (!ok) shake.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 60 }), withSpring(0));
    setAnswers(prev => [...prev, ok ? 1 : 0]);
    if (q.kind === 'meaning' || q.kind === 'listen' || q.kind === 'odd') recordWordAnswer(q.pair.english, ok, undefined, undefined, activeLanguage);
    else if (!ok) {
      if (q.kind === 'grammar') recordGuidedSentenceAnswer({ sentenceId: `daily-gap-${activeLanguage}-${q.before}${q.answer}`, english: q.english, target: `${q.before}${q.answer}${q.after}`.trim() }, false, activeLanguage);
      else recordGuidedSentenceAnswer({ sentenceId: q.sentenceId, english: q.english, target: q.target }, false, activeLanguage);
    }
    if (ok && q.kind !== 'listen') {
      const spoken = q.kind === 'grammar' ? `${q.before}${q.answer}${q.after}` : q.kind === 'build' ? q.target : q.answer;
      speak(spoken, activeLanguage, false);
    }
  };

  const choose = (opt: string) => {
    if (answered || !q || q.kind === 'build') return;
    setPicked(opt);
    commit(opt === q.answer);
  };

  const next = () => {
    if (!answered) return;
    if (index + 1 >= DAILY_QUESTION_COUNT) {
      const grid = answers.join('');
      const correct = answers.filter(a => a === 1).length;
      const score = dailyScore(correct);
      const stars = dailyStars(correct);
      if (official) {
        resultRef.current = {
          sessionId: dailySessionId(dateKey, activeLanguage), score, stars, xp: correct * 3,
          contentId: `${DAILY_CONTENT_VERSION}:${dateKey}`, won: correct >= 5, dateKey, grid,
        } as ArcadeResult;
        save();
      }
      setPhase('results');
      return;
    }
    setIndex(i => i + 1); setPicked(null); setBuilt([]); setRevealed(false);
  };

  const tapToken = (pos: number) => {
    if (answered || !q || q.kind !== 'build') return;
    const nextBuilt = [...built, pos];
    setBuilt(nextBuilt);
    tapHaptic();
    if (nextBuilt.length === q.tokens.length) {
      const attempt = nextBuilt.map(p => q.tokens[q.order[p]]).join(' ');
      commit(attempt === q.tokens.join(' '));
    }
  };

  const score = dailyScore(correctCount);
  const stars = dailyStars(correctCount);
  const shareEntry: DailyEntry | null = savedEntry ?? status.todayEntry ?? (status.history.find(h => h.dateKey === dateKey) ?? null);

  const [webShare, setWebShare] = useState<{ text: string; copied: boolean } | null>(null);
  const share = async () => {
    if (!shareEntry) return;
    const text = dailyShareText(shareEntry, activeLanguage);
    if (Platform.OS !== 'web') {
      try { await Share.share({ message: text }); } catch { /* dismissed */ }
      return;
    }
    const nav = (globalThis as { navigator?: { share?: (d: { text: string }) => Promise<void>; clipboard?: { writeText?: (t: string) => Promise<void> } } }).navigator;
    if (nav?.share) {
      try { await nav.share({ text }); return; } catch { /* fall through to copy */ }
    }
    let copied = false;
    if (nav?.clipboard?.writeText) {
      try { await nav.clipboard.writeText(text); copied = true; } catch { copied = false; }
    }
    setWebShare({ text, copied });
  };

  const renderQuestion = () => {
    if (!q) return null;
    const optState = (opt: string): 'idle' | 'right' | 'wrong' | 'dim' => {
      if (!answered) return 'idle';
      if ('answer' in q && opt === q.answer) return 'right';
      if (opt === picked) return 'wrong';
      return 'dim';
    };
    const options = q.kind !== 'build' ? (
      <View style={styles.options}>
        {q.options.map((opt, i) => (
          <OptionButton key={`${opt}-${i}`} label={opt} state={optState(opt)} disabled={answered} onPress={() => choose(opt)} testID={`daily-option-${i}`} />
        ))}
      </View>
    ) : null;

    if (q.kind === 'meaning') return (
      <>
        <Text style={[styles.prompt, { color: colors.mutedForeground }]}>How do you say</Text>
        <Text style={[styles.big, { color: colors.foreground }]}>{q.english}</Text>
        {options}
      </>
    );
    if (q.kind === 'odd') return (
      <>
        <Text style={[styles.prompt, { color: colors.mutedForeground }]}>Three of these are {q.category.toLowerCase()}. Which one is not?</Text>
        {options}
        {answered ? <Text style={[styles.note, { color: colors.mutedForeground }]}>{q.answer} = {q.pair.english} ({q.otherCategory})</Text> : null}
      </>
    );
    if (q.kind === 'grammar') return (
      <>
        <Text style={[styles.prompt, { color: colors.mutedForeground }]}>{q.english}</Text>
        <View style={[styles.sentenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sentence, { color: colors.foreground }]}>
            {q.before}
            <Text style={{ color: answered ? GOOD : ACCENT }}>{answered ? q.answer : ' ____ '}</Text>
            {q.after}
          </Text>
        </View>
        {options}
      </>
    );
    if (q.kind === 'listen') return (
      <>
        <Text style={[styles.prompt, { color: colors.mutedForeground }]}>Listen, then pick the meaning</Text>
        {isMuted ? (
          <View style={[styles.sentenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.note, { color: colors.mutedForeground, textAlign: 'center' }]}>Sound is off in settings. Read the word instead:</Text>
            {revealed || answered ? (
              <Text style={[styles.big, { color: colors.foreground }]}>{q.target}</Text>
            ) : (
              <ChunkyButton onPress={() => setRevealed(true)} color={ACCENT} testID="daily-reveal-word">Show the word</ChunkyButton>
            )}
          </View>
        ) : (
          <View style={styles.audioRow}>
            <ChunkyButton onPress={() => speak(q.target, activeLanguage, false, 'normal')} color={ACCENT} testID="daily-listen-normal" accessibilityLabel="Play audio" style={styles.flex}>
              <MaterialCommunityIcons name="account-voice" size={23} color="#FFFFFF" />
              <Text style={styles.audioText}>Listen</Text>
            </ChunkyButton>
            <ChunkyButton onPress={() => speak(q.target, activeLanguage, false, 'slow')} color="#5B8DEF" testID="daily-listen-slow" accessibilityLabel="Play audio slowly" style={styles.flex}>
              <Ionicons name="hourglass" size={20} color="#FFFFFF" />
              <Text style={styles.audioText}>Slow</Text>
            </ChunkyButton>
          </View>
        )}
        {!isMuted && answered ? <Text style={[styles.note, { color: colors.mutedForeground, textAlign: 'center' }]}>{q.target}</Text> : null}
        {options}
      </>
    );
    const builtText = built.map(p => q.tokens[q.order[p]]);
    const ok = answered && answers[index] === 1;
    return (
      <>
        <Text style={[styles.prompt, { color: colors.mutedForeground }]}>Build this sentence</Text>
        <Text style={[styles.mid, { color: colors.foreground }]}>{q.english}</Text>
        <View style={[styles.buildArea, { backgroundColor: colors.card, borderColor: answered ? (ok ? GOOD : BAD) : colors.border }]}>
          {builtText.length ? builtText.map((t, i) => (
            <View key={`${t}-${i}`} style={[styles.chip, { backgroundColor: ACCENT }]}><Text style={styles.chipTextOn}>{t}</Text></View>
          )) : <Text style={[styles.note, { color: colors.mutedForeground }]}>Tap the words in order</Text>}
        </View>
        {answered && !ok ? <Text style={[styles.note, { color: colors.foreground }]}>Correct: {q.target}</Text> : null}
        <View style={styles.bank}>
          {q.order.map((tokenIdx, pos) => {
            const usedTok = built.includes(pos);
            return (
              <Pressable
                key={pos}
                accessibilityRole="button"
                accessibilityLabel={q.tokens[tokenIdx]}
                disabled={usedTok || answered}
                onPress={() => tapToken(pos)}
                testID={`daily-token-${pos}`}
                style={[styles.chip, styles.bankChip, { backgroundColor: colors.card, borderColor: colors.border, opacity: usedTok ? 0.25 : 1 }]}
              >
                <Text style={[styles.chipText, { color: colors.foreground }]}>{q.tokens[tokenIdx]}</Text>
              </Pressable>
            );
          })}
        </View>
        {!answered && built.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => setBuilt(b => b.slice(0, -1))} style={styles.undo} testID="daily-undo">
            <Ionicons name="arrow-undo" size={16} color={colors.mutedForeground} />
            <Text style={[styles.note, { color: colors.mutedForeground }]}>Undo</Text>
          </Pressable>
        ) : null}
      </>
    );
  };

  const meta = q ? KIND_LABEL[q.kind] : KIND_LABEL.meaning;
  const days = lastNDays(status.today, 28);
  const savedKeys = new Set(status.keys);
  if (savedEntry) savedKeys.add(savedEntry.dateKey);
  const grid = answers.join('');

  const footer = (
    <View style={styles.footer}>
      <View style={[styles.modePill, { backgroundColor: official ? GOLD : colors.muted }]}>
        <Ionicons name={official ? 'ribbon' : 'refresh'} size={14} color={official ? INK : colors.mutedForeground} />
        <Text style={[styles.modeText, { color: official ? INK : colors.mutedForeground }]}>
          {official ? `Official result · ${dateKey}` : 'Practice round · no extra XP'}
        </Text>
      </View>
      <View style={styles.gridRow} accessibilityLabel={`${correctCount} of 10 first answers correct`}>
        {Array.from(grid).map((c, i) => (
          <View key={i} style={[styles.gridCell, { backgroundColor: c === '1' ? GOOD : BAD }]} />
        ))}
      </View>
      {official && arcade.saveError ? (
        <ChunkyButton onPress={save} color={ACCENT} testID="daily-retry-save">Try saving again</ChunkyButton>
      ) : null}
      <View style={[styles.calCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.calHead}>
          <Text style={[styles.calTitle, { color: colors.foreground }]}>Last 28 days</Text>
          <View style={styles.streak}>
            <Ionicons name="flame" size={15} color="#F59E0B" />
            <Text style={[styles.calTitle, { color: colors.foreground }]}>{status.streak} day streak</Text>
          </View>
        </View>
        <View style={styles.calGrid}>
          {[0, 1, 2, 3].map(week => (
            <View key={week} style={styles.calWeek}>
              {days.slice(week * 7, week * 7 + 7).map(d => (
                <View
                  key={d}
                  accessibilityLabel={`${d}${savedKeys.has(d) ? ', completed' : ''}`}
                  style={[styles.calCell, { backgroundColor: savedKeys.has(d) ? ACCENT : colors.muted }, d === status.today && { borderWidth: 2, borderColor: GOLD }]}
                >
                  <Text style={[styles.calNum, { color: savedKeys.has(d) ? '#FFFFFF' : colors.mutedForeground }]}>{Number(d.slice(8))}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          New questions in {status.countdown} at 00:00 UTC{localResetLabel(status.now) ? ` (${localResetLabel(status.now)} your time)` : ''}.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share today's result"
        accessibilityState={{ disabled: !shareEntry }}
        disabled={!shareEntry}
        onPress={share}
        testID="daily-share"
        style={[styles.goldLip, !shareEntry && { opacity: 0.5 }]}
      >
        <View style={styles.gold}>
          <Ionicons name="share-social" size={18} color={INK} />
          <Text style={styles.goldText}>{shareEntry ? 'Share result' : arcade.isSaving ? 'Saving…' : 'Share after saving'}</Text>
        </View>
      </Pressable>
      {webShare ? (
        <View style={[styles.calCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="daily-share-fallback">
          <Text style={[styles.calTitle, { color: colors.foreground }]}>{webShare.copied ? 'Copied! Paste it anywhere.' : 'Select and copy your result'}</Text>
          <TextInput
            value={webShare.text}
            editable={false}
            multiline
            selectTextOnFocus
            accessibilityLabel="Shareable result text"
            style={[styles.shareText, { color: colors.foreground, backgroundColor: colors.muted }]}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <GameShell
      gameId="daily-challenge"
      phase={phase}
      score={score}
      bestScore={arcade.bestScore}
      stars={stars}
      xp={official ? xpEarned : 0}
      onPlay={start}
      onReplay={start}
      onDone={() => goBackOr('/categories?tab=games')}
      progress={(index + (answered ? 1 : 0)) / DAILY_QUESTION_COUNT}
      saving={official && arcade.isSaving}
      error={official ? arcade.saveError : null}
      footer={footer}
    >
      <ScrollView contentContainerStyle={styles.play} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.qHead}>
          <View style={[styles.kind, { backgroundColor: ACCENT + '1F' }]}>
            <Ionicons name={meta.icon as any} size={14} color={colors.colorScheme === 'dark' ? '#8FB3FF' : ACCENT} />
            <Text style={[styles.kindText, { color: colors.colorScheme === 'dark' ? '#8FB3FF' : ACCENT }]}>{meta.label}</Text>
          </View>
          <Text style={[styles.counter, { color: colors.mutedForeground }]}>
            {index + 1}/{DAILY_QUESTION_COUNT} · {LANGUAGE_META[activeLanguage].label}{official ? '' : ' · practice'}
          </Text>
        </View>
        <Animated.View style={[styles.qBody, shakeStyle]} key={q?.id}>
          {renderQuestion()}
        </Animated.View>
        {answered ? (
          <ChunkyButton onPress={next} color={answers[index] === 1 ? GOOD : ACCENT} testID="daily-next">
            {index + 1 >= DAILY_QUESTION_COUNT ? 'See results' : answers[index] === 1 ? 'Correct! Next' : 'Next'}
          </ChunkyButton>
        ) : null}
      </ScrollView>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  play: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 24, gap: 16 },
  qHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  kind: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  kindText: { fontFamily: fontFamilies.extraBold, fontSize: 12, letterSpacing: 0.4 },
  counter: { fontFamily: fontFamilies.bold, fontSize: 13, fontVariant: ['tabular-nums'] },
  qBody: { gap: 14 },
  prompt: { fontFamily: fontFamilies.bold, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  big: { fontFamily: fontFamilies.extraBold, fontSize: 32, textAlign: 'center', letterSpacing: -0.4 },
  mid: { fontFamily: fontFamilies.extraBold, fontSize: 21, lineHeight: 27, textAlign: 'center' },
  note: { fontFamily: fontFamilies.semiBold, fontSize: 14, lineHeight: 20 },
  options: { gap: 10 },
  optLip: { borderRadius: 18, paddingBottom: 4 },
  opt: { minHeight: 56, borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optText: { flex: 1, fontFamily: fontFamilies.bold, fontSize: 17 },
  sentenceCard: { borderRadius: 20, borderWidth: 1, borderBottomWidth: 4, padding: 16, gap: 12 },
  sentence: { fontFamily: fontFamilies.bold, fontSize: 21, lineHeight: 30, textAlign: 'center' },
  audioRow: { flexDirection: 'row', gap: 12 },
  audioText: { fontFamily: fontFamilies.extraBold, fontSize: 16, color: '#FFFFFF' },
  buildArea: { minHeight: 84, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { minHeight: 44, borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center' },
  bankChip: { borderWidth: 1.5, borderBottomWidth: 4 },
  chipText: { fontFamily: fontFamilies.bold, fontSize: 17 },
  chipTextOn: { fontFamily: fontFamilies.bold, fontSize: 17, color: '#FFFFFF' },
  undo: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', minHeight: 44, paddingHorizontal: 12 },
  footer: { gap: 12 },
  modePill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  modeText: { fontFamily: fontFamilies.extraBold, fontSize: 13 },
  gridRow: { flexDirection: 'row', gap: 5, justifyContent: 'center' },
  gridCell: { width: 24, height: 24, borderRadius: 7 },
  calCard: { borderRadius: 22, borderWidth: 1, borderBottomWidth: 4, padding: 14, gap: 10 },
  calHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  calTitle: { fontFamily: fontFamilies.extraBold, fontSize: 14 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calGrid: { gap: 5 },
  calWeek: { flexDirection: 'row', gap: 5 },
  calCell: { flex: 1, aspectRatio: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  calNum: { fontFamily: fontFamilies.bold, fontSize: 11 },
  goldLip: { backgroundColor: '#D99A0B', borderRadius: 18, paddingBottom: 5 },
  gold: { minHeight: 52, borderRadius: 18, backgroundColor: GOLD, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareText: { fontFamily: fontFamilies.bold, fontSize: 15, lineHeight: 22, borderRadius: 12, padding: 12, minHeight: 90 },
  goldText: { fontFamily: fontFamilies.extraBold, fontSize: 17, color: INK },
});
