import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { goBackOr } from '@/lib/navigation';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Ionicons } from '@expo/vector-icons';
import { GameShell, ChunkyButton, tapHaptic } from '@/components/arcade/GameShell';
import { SpeakerButton, usePreloadSpeech } from '@/components/SpeakerButton';
import { MOTION } from '@/constants/motion';
import { ChatAvatar, TypingDots } from '@/components/arcade/chat-ui';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { useArcadeProgress } from '@/hooks/useArcadeProgress';
import { arcadeContentBestScore, arcadeContentWon } from '@/lib/arcade-progress';
import { makeSessionId } from '@/lib/arcade/voice-utils';
import { fontFamilies } from '@/constants/typography';
import { CHAT_CONFUSED, CHAT_SCENARIOS, chatAnswerTokens, chatTileWord, type ChatLine, type ChatScenario } from '@/data/arcade-chat';

const GAME_ID = 'chat-simulator';
const ACCENT = '#2F8CFF';
const GOOD = '#20B486';
const SOFT_BAD = '#F59E0B';

type Msg = { id: string; from: 'them' | 'me'; line: ChatLine; tone?: 'ok' | 'off' | 'confused' };
type Tile = { key: string; word: string };
type Outcome = { score: number; stars: number; xp: number; firstTry: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Score model: 100 per first-try turn, 40 after a retry, +50 for a flawless chat. Stars = first-try turns. */
function outcomeFor(firstTry: number, turns: number): Outcome {
  const score = firstTry * 100 + (turns - firstTry) * 40 + (firstTry === turns ? 50 : 0);
  const stars = Math.min(3, Math.round((firstTry / turns) * 3));
  return { score, stars, xp: firstTry > 0 ? firstTry * 4 + stars : 0, firstTry };
}
function starsFromBest(best: number) {
  return best >= 350 ? 3 : best >= 240 ? 2 : best >= 180 ? 1 : 0;
}

export default function ChatSimulator() {
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const dark = colors.colorScheme === 'dark';
  const { progress, activeLanguage, isMuted, recordGuidedSentenceAnswer } = useGame();
  const { playCorrect, playWrong, speak, stopSpeaking } = useSound();
  const { bestScore, isSaving, saveError, beginSession, finishGame, resetSaveError } = useArcadeProgress(GAME_ID);

  const [phase, setPhase] = useState<'intro' | 'playing' | 'results'>('intro');
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [turnIdx, setTurnIdx] = useState(0);
  const [typing, setTyping] = useState(false);
  const [awaiting, setAwaiting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<{ text: string; said: string } | null>(null);
  const [options, setOptions] = useState<ChatLine[]>([]);
  const [pool, setPool] = useState<Tile[]>([]);
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [firstTry, setFirstTry] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>({ score: 0, stars: 0, xp: 0, firstTry: 0 });
  const [xpEarned, setXpEarned] = useState(0);
  const [startError, setStartError] = useState<string | null>(null);

  const sessionRef = useRef('');
  const savedRef = useRef(false);
  const resultRef = useRef<{ outcome: Outcome; index: number } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const msgSeq = useRef(0);
  const firstTryRef = useRef(0);

  const scenario: ChatScenario = CHAT_SCENARIOS[scenarioIndex];
  const turn = scenario.turns[turnIdx];
  const partnerName = scenario.partner.name[activeLanguage];

  usePreloadSpeech(useMemo(() => view === 'chat'
    ? [...scenario.turns.flatMap(t => [t.other[activeLanguage], t.answer[activeLanguage]]), scenario.closing[activeLanguage]]
    : [], [view, scenario, activeLanguage]), activeLanguage, ['normal', 'slow']);

  const clearTimers = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);
  useEffect(() => () => { clearTimers(); stopSpeaking(); }, [clearTimers, stopSpeaking]);
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };

  const unlocked = useCallback((i: number) => i === 0 || arcadeContentWon(progress, activeLanguage, GAME_ID, `chat-${i - 1}`), [progress, activeLanguage]);

  const say = (line: ChatLine) => { if (!isMuted) speak(line[activeLanguage], activeLanguage); };
  const pushMsg = (m: Omit<Msg, 'id'>) => {
    msgSeq.current += 1;
    const id = `m${msgSeq.current}`;
    setMessages(list => [...list, { ...m, id }]);
  };

  const prepareTurn = (sc: ChatScenario, idx: number) => {
    const t = sc.turns[idx];
    setAttempts(0); setHint(null); setPlaced([]);
    if (t.build) {
      const answerTokens = chatAnswerTokens(t.answer[activeLanguage]);
      const lower = new Set(answerTokens.map(w => w.toLowerCase()));
      const extra = chatAnswerTokens(t.wrong[0][activeLanguage]).concat(chatAnswerTokens(t.wrong[1][activeLanguage]))
        .filter(w => !lower.has(w.toLowerCase()));
      const distractors = Array.from(new Set(extra)).slice(0, answerTokens.length <= 3 ? 2 : 3);
      setPool(shuffle([...answerTokens, ...distractors].map((word, i) => ({ key: `${idx}-${i}-${word}`, word }))));
      setOptions([]);
    } else {
      setOptions(shuffle([t.answer, t.wrong[0], t.wrong[1]]));
      setPool([]);
    }
  };

  const themSpeaks = (line: ChatLine, tone: Msg['tone'], after?: () => void, delay = MOTION.answerPauseMs) => {
    setTyping(true); setAwaiting(false);
    later(() => {
      setTyping(false);
      pushMsg({ from: 'them', line, tone });
      say(line);
      after?.();
    }, delay);
  };

  const startScenario = (index: number) => {
    if (!unlocked(index)) return;
    const sessionId = makeSessionId(GAME_ID);
    if (!beginSession(sessionId)) { setStartError('Your progress is still loading or saving. Try again in a moment.'); return; }
    setStartError(null);
    clearTimers(); stopSpeaking();
    sessionRef.current = sessionId;
    savedRef.current = false;
    resultRef.current = null;
    resetSaveError();
    const sc = CHAT_SCENARIOS[index];
    setScenarioIndex(index);
    setMessages([]); setShown({}); setTurnIdx(0); setFirstTry(0); firstTryRef.current = 0; setXpEarned(0);
    setView('chat'); setPhase('playing');
    prepareTurn(sc, 0);
    themSpeaks(sc.turns[0].other, undefined, () => setAwaiting(true), MOTION.answerPauseMs);
  };

  const save = useCallback(async () => {
    const r = resultRef.current;
    if (!r || savedRef.current || !sessionRef.current) return;
    try {
      const res = await finishGame({
        sessionId: sessionRef.current, score: r.outcome.score, stars: r.outcome.stars, xp: r.outcome.xp,
        contentId: `chat-${r.index}`, won: true,
      });
      savedRef.current = true;
      setXpEarned(res.xpEarned);
    } catch {
      // saveError from hook drives the retry UI
    }
  }, [finishGame]);

  const complete = () => {
    const o = outcomeFor(firstTryRef.current, scenario.turns.length);
    setOutcome(o);
    resultRef.current = { outcome: o, index: scenarioIndex };
    setPhase('results');
    void save();
  };

  const submit = (said: ChatLine | null, builtText?: string) => {
    if (!awaiting || !turn) return;
    const ok = said === turn.answer;
    const sentenceId = `chat-${scenario.id}-${turnIdx}`;
    if (attempts === 0) {
      recordGuidedSentenceAnswer({ sentenceId, english: turn.answer.en, target: turn.answer[activeLanguage] }, ok, activeLanguage);
    }
    setAwaiting(false);
    if (ok) {
      playCorrect(); tapHaptic('success');
      if (attempts === 0) { firstTryRef.current += 1; setFirstTry(firstTryRef.current); }
      pushMsg({ from: 'me', line: turn.answer, tone: 'ok' });
      setHint(null);
      const nextIdx = turnIdx + 1;
      if (nextIdx < scenario.turns.length) {
        later(() => {
          setTurnIdx(nextIdx);
          prepareTurn(scenario, nextIdx);
          themSpeaks(scenario.turns[nextIdx].other, undefined, () => setAwaiting(true));
        }, 300);
      } else {
        later(() => themSpeaks(scenario.closing, undefined, () => later(complete, MOTION.answerPauseMs)), 300);
      }
    } else {
      playWrong(); tapHaptic('error');
      const off: ChatLine = said ?? { ...turn.answer, en: '(a jumbled sentence)', [activeLanguage]: builtText ?? '' };
      pushMsg({ from: 'me', line: off, tone: 'off' });
      const confusedPool = CHAT_CONFUSED[activeLanguage];
      const confused = confusedPool[(attempts + turnIdx) % confusedPool.length];
      setAttempts(a => a + 1);
      setPlaced([]);
      if (turn.build) setPool(p => shuffle(p));
      themSpeaks(confused, 'confused', () => {
        setHint({ text: turn.hint, said: said ? said.en : 'Those words are in a mixed-up order.' });
        setAwaiting(true);
      }, MOTION.answerPauseMs);
    }
  };

  const sendBuilt = () => {
    if (!turn) return;
    const target = chatAnswerTokens(turn.answer[activeLanguage]);
    const got = placed.map(t => t.word);
    const ok = got.length === target.length && got.every((w, i) => w === target[i]);
    submit(ok ? turn.answer : null, got.join(' '));
  };

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: !reduceMotion }), 60);
    return () => clearTimeout(t);
  }, [messages.length, typing, hint, awaiting, reduceMotion]);

  const backToList = () => { clearTimers(); stopSpeaking(); setView('list'); setPhase('playing'); };

  // ---------- render helpers ----------
  const renderList = () => (
    <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.listTitle, { color: colors.foreground }]}>Pick a conversation</Text>
      <Text style={[styles.listSub, { color: colors.mutedForeground }]}>Win a chat to unlock the next one.</Text>
      {startError || saveError ? (
        <View style={[styles.banner, { backgroundColor: SOFT_BAD + '22', borderColor: SOFT_BAD }]} accessibilityRole="alert">
          <Ionicons name="hourglass" size={16} color={SOFT_BAD} />
          <Text style={[styles.bannerText, { color: colors.foreground }]}>{startError ?? saveError}</Text>
        </View>
      ) : null}
      {CHAT_SCENARIOS.map((sc, i) => {
        const open = unlocked(i);
        const won = arcadeContentWon(progress, activeLanguage, GAME_ID, `chat-${i}`);
        const best = arcadeContentBestScore(progress, activeLanguage, GAME_ID, `chat-${i}`);
        const stars = won ? starsFromBest(best) : 0;
        return (
          <Animated.View key={sc.id} entering={reduceMotion ? undefined : FadeInDown.delay(Math.min(i, 8) * 24)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${sc.title}${open ? '' : ', locked'}${won ? `, ${stars} stars, best ${best}` : ''}`}
              accessibilityState={{ disabled: !open }}
              disabled={!open}
              testID={`chat-scenario-${i}`}
              onPress={() => { tapHaptic(); startScenario(i); }}
              style={({ pressed }) => [styles.scCard, {
                backgroundColor: colors.card, borderColor: open ? sc.partner.color + '55' : colors.border,
                opacity: open ? 1 : 0.55, transform: [{ translateY: pressed ? 3 : 0 }],
              }]}
            >
              <View style={styles.scAvatarWrap}>
                {open ? <ChatAvatar color={sc.partner.color} skin={sc.partner.skin} hair={sc.partner.hair} size={50} /> : (
                  <View style={[styles.lockCircle, { backgroundColor: colors.muted }]}><Ionicons name="lock-closed" size={20} color={colors.mutedForeground} /></View>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.scTitleRow}>
                  <Text style={[styles.scNum, { color: sc.partner.color }]}>{String(i + 1).padStart(2, '0')}</Text>
                  <Text style={[styles.scTitle, { color: colors.foreground }]} numberOfLines={1}>{sc.title}</Text>
                </View>
                <Text style={[styles.scMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {open ? `${sc.partner.name[activeLanguage]} · ${sc.partner.role}` : 'Win the previous chat to unlock'}
                </Text>
                {won ? (
                  <View style={styles.scStars}>
                    {[0, 1, 2].map(s => <Ionicons key={s} name={s < stars ? 'star' : 'star-outline'} size={13} color={s < stars ? '#FFC53D' : colors.border} />)}
                    <Text style={[styles.scBest, { color: colors.mutedForeground }]}>Best {best}</Text>
                  </View>
                ) : null}
              </View>
              <Ionicons name={open ? (sc.icon as any) : 'lock-closed'} size={22} color={open ? sc.partner.color : colors.mutedForeground} />
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );

  const bubble = (m: Msg) => {
    const mine = m.from === 'me';
    const tgt = m.line[activeLanguage];
    const isShown = !!shown[m.id];
    if (mine) {
      const bg = m.tone === 'off' ? (dark ? '#4A3A1A' : '#FFF1D6') : ACCENT;
      const fg = m.tone === 'off' ? colors.foreground : '#FFFFFF';
      return (
        <Animated.View key={m.id} entering={reduceMotion ? undefined : FadeInUp.duration(MOTION.transitionMs)} style={[styles.row, { justifyContent: 'flex-end' }]}>
          <View style={[styles.bubble, styles.mine, { backgroundColor: bg, borderColor: m.tone === 'off' ? SOFT_BAD : '#1E6FD9' }]}>
            <Text style={[styles.bubbleText, { color: fg }]}>{tgt}</Text>
            {m.tone === 'off' ? <Text style={[styles.caption, { color: colors.mutedForeground }]}>You said: “{m.line.en}”</Text> : null}
          </View>
        </Animated.View>
      );
    }
    return (
      <Animated.View key={m.id} entering={reduceMotion ? undefined : FadeInUp.duration(MOTION.transitionMs)} style={styles.row}>
        <ChatAvatar color={scenario.partner.color} skin={scenario.partner.skin} hair={scenario.partner.hair} size={34} />
        <View style={{ flexShrink: 1, gap: 4 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${tgt}. Tap to ${isShown ? 'hide' : 'show'} translation`}
            accessibilityHint="Shows the English meaning"
            onPress={() => setShown(s => ({ ...s, [m.id]: !s[m.id] }))}
            style={[styles.bubble, styles.theirs, {
              backgroundColor: m.tone === 'confused' ? (dark ? '#3A2E4D' : '#F2ECFF') : colors.card,
              borderColor: m.tone === 'confused' ? '#8B5CF6' : colors.border,
            }]}
          >
            <Text style={[styles.bubbleText, { color: colors.foreground }]}>{tgt}</Text>
            {isShown ? (
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>{m.line.en}</Text>
            ) : (
              <Text style={[styles.tapHint, { color: ACCENT }]}>Tap to translate</Text>
            )}
          </Pressable>
          <SpeakerButton text={tgt} language={activeLanguage} compact showSlow accessibilityLabel={`Hear ${partnerName}`} />
        </View>
      </Animated.View>
    );
  };

  const renderReply = () => {
    if (!turn) return null;
    if (!awaiting) return <View style={styles.replyIdle}><Text style={[styles.waitText, { color: colors.mutedForeground }]}>{typing ? `${partnerName} is typing…` : ' '}</Text></View>;
    const revealAnswer = attempts >= 2;
    if (turn.build) {
      return (
        <View style={styles.replyBox}>
          <Text style={[styles.replyLabel, { color: colors.mutedForeground }]}>BUILD YOUR REPLY</Text>
          <View style={[styles.slotRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
            {placed.length === 0 ? <Text style={[styles.slotEmpty, { color: colors.mutedForeground }]}>Tap the words in order</Text> : null}
            {placed.map(t => (
              <Pressable key={t.key} accessibilityRole="button" accessibilityLabel={`Remove ${t.word}`}
                onPress={() => { tapHaptic(); setPlaced(p => p.filter(x => x.key !== t.key)); setPool(p => [...p, t]); }}
                style={[styles.tile, { backgroundColor: ACCENT, borderColor: '#1E6FD9' }]}>
                <Text style={[styles.tileText, { color: '#FFFFFF' }]}>{t.word}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.poolRow}>
            {pool.map(t => (
              <Pressable key={t.key} accessibilityRole="button" accessibilityLabel={`Add ${t.word}`} testID={`chat-tile-${t.word}`}
                onPress={() => { tapHaptic(); setPool(p => p.filter(x => x.key !== t.key)); setPlaced(p => [...p, t]); }}
                style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.tileText, { color: colors.foreground }]}>{t.word}</Text>
              </Pressable>
            ))}
          </View>
          {revealAnswer ? (
            <Text style={[styles.reveal, { color: colors.foreground }]}>Try: <Text style={{ fontFamily: fontFamilies.extraBold }}>{chatAnswerTokens(turn.answer[activeLanguage]).join(' ')}</Text></Text>
          ) : null}
          <ChunkyButton onPress={sendBuilt} disabled={placed.length === 0} color={ACCENT} testID="chat-send" accessibilityLabel="Send reply">
            <Ionicons name="send" size={18} color="#FFFFFF" />
            <Text style={styles.sendText}>Send</Text>
          </ChunkyButton>
        </View>
      );
    }
    return (
      <View style={styles.replyBox}>
        <Text style={[styles.replyLabel, { color: colors.mutedForeground }]}>CHOOSE YOUR REPLY</Text>
        {options.map((o, i) => {
          const highlight = revealAnswer && o === turn.answer;
          return (
            <Pressable key={`${turnIdx}-${i}`} accessibilityRole="button" accessibilityLabel={o[activeLanguage]} testID={`chat-option-${i}`}
              onPress={() => { tapHaptic(); submit(o); }}
              style={({ pressed }) => [styles.option, {
                backgroundColor: highlight ? GOOD + '1F' : colors.card,
                borderColor: highlight ? GOOD : colors.border,
                transform: [{ translateY: pressed ? 2 : 0 }],
              }]}>
              <Text style={[styles.optionText, { color: colors.foreground }]}>{o[activeLanguage]}</Text>
              {highlight ? <Ionicons name="bulb" size={16} color={GOOD} /> : null}
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderChat = () => (
    <View style={{ flex: 1 }}>
      <View style={[styles.chatHeader, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable onPress={backToList} accessibilityRole="button" accessibilityLabel="Back to scenarios" hitSlop={8} testID="chat-back">
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <ChatAvatar color={scenario.partner.color} skin={scenario.partner.skin} hair={scenario.partner.hair} size={38} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.chName, { color: colors.foreground }]} numberOfLines={1}>{partnerName}</Text>
          <Text style={[styles.chSub, { color: typing ? ACCENT : colors.mutedForeground }]} numberOfLines={1}>
            {typing ? 'typing…' : `${scenario.partner.role} · ${scenario.setting}`}
          </Text>
        </View>
      </View>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.thread} showsVerticalScrollIndicator={false}>
        <View style={[styles.scenePill, { backgroundColor: scenario.partner.color + '22' }]}>
          <Ionicons name={scenario.icon as any} size={14} color={scenario.partner.color} />
          <Text style={[styles.scenePillText, { color: colors.foreground }]}>{scenario.title}</Text>
        </View>
        {messages.map(bubble)}
        {typing ? (
          <View style={styles.row}>
            <ChatAvatar color={scenario.partner.color} skin={scenario.partner.skin} hair={scenario.partner.hair} size={34} />
            <View style={[styles.bubble, styles.theirs, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TypingDots color={colors.mutedForeground} />
            </View>
          </View>
        ) : null}
        {hint && awaiting ? (
          <Animated.View entering={reduceMotion ? undefined : FadeInDown} style={[styles.hint, { backgroundColor: SOFT_BAD + '1A', borderColor: SOFT_BAD + '88' }]} accessibilityLiveRegion="polite">
            <Ionicons name="bulb" size={18} color={SOFT_BAD} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.hintTitle, { color: colors.foreground }]}>{partnerName} looks puzzled</Text>
              <Text style={[styles.hintBody, { color: colors.mutedForeground }]}>{hint.said.startsWith('Those') ? hint.said : `You said “${hint.said}”.`} {hint.text}</Text>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
      <View style={[styles.replyDock, { borderColor: colors.border, backgroundColor: colors.groupedBackground }]}>{renderReply()}</View>
    </View>
  );

  const learned = scenario.turns.map(t => t.answer);
  const resultsFooter = phase === 'results' ? (
    <View style={{ gap: 12 }}>
      {saveError ? (
        <ChunkyButton onPress={() => { resetSaveError(); void save(); }} color={SOFT_BAD} testID="chat-retry-save">Try saving again</ChunkyButton>
      ) : null}
      <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Phrases you used with {partnerName}</Text>
        <Text style={[styles.summarySub, { color: colors.mutedForeground }]}>{outcome.firstTry} of {scenario.turns.length} replies right on the first try</Text>
        {learned.map((l, i) => (
          <View key={i} style={[styles.learnRow, { borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.learnTarget, { color: colors.foreground }]}>{l[activeLanguage]}</Text>
              <Text style={[styles.learnEn, { color: colors.mutedForeground }]}>{l.en}</Text>
            </View>
            <SpeakerButton text={l[activeLanguage]} language={activeLanguage} compact />
          </View>
        ))}
      </View>
      {scenarioIndex + 1 < CHAT_SCENARIOS.length && unlocked(scenarioIndex + 1) ? (
        <ChunkyButton onPress={() => startScenario(scenarioIndex + 1)} color={GOOD} testID="chat-next-scenario">Next chat: {CHAT_SCENARIOS[scenarioIndex + 1].title}</ChunkyButton>
      ) : null}
      <ChunkyButton onPress={backToList} color={colors.mutedForeground} testID="chat-pick-another">All conversations</ChunkyButton>
    </View>
  ) : undefined;

  return (
    <GameShell
      gameId={GAME_ID}
      phase={phase}
      score={phase === 'results' ? outcome.score : firstTry * 100}
      bestScore={bestScore}
      stars={outcome.stars}
      xp={xpEarned}
      progress={view === 'chat' ? (turnIdx + (awaiting ? 0 : 0.5)) / scenario.turns.length : 0}
      saving={isSaving}
      error={saveError}
      onPlay={() => { setView('list'); setPhase('playing'); }}
      onReplay={() => startScenario(scenarioIndex)}
      onDone={() => goBackOr('/categories?tab=games')}
      footer={resultsFooter}
    >
      {view === 'list' ? renderList() : renderChat()}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16, gap: 10, paddingBottom: 32 },
  listTitle: { fontFamily: fontFamilies.extraBold, fontSize: 24, letterSpacing: -0.4 },
  listSub: { fontFamily: fontFamilies.semiBold, fontSize: 14, marginBottom: 4 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 14, borderWidth: 1 },
  bannerText: { flex: 1, fontFamily: fontFamilies.semiBold, fontSize: 13 },
  scCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, borderWidth: 2, borderBottomWidth: 5 },
  scAvatarWrap: { width: 50, alignItems: 'center' },
  lockCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  scTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  scNum: { fontFamily: fontFamilies.extraBold, fontSize: 13 },
  scTitle: { flexShrink: 1, fontFamily: fontFamilies.extraBold, fontSize: 16 },
  scMeta: { fontFamily: fontFamilies.semiBold, fontSize: 13, marginTop: 1 },
  scStars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  scBest: { fontFamily: fontFamilies.bold, fontSize: 12, marginLeft: 6 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12, padding: 10, borderRadius: 18, borderWidth: 1, borderBottomWidth: 3 },
  chName: { fontFamily: fontFamilies.extraBold, fontSize: 16 },
  chSub: { fontFamily: fontFamilies.semiBold, fontSize: 12 },
  thread: { padding: 14, gap: 12, paddingBottom: 18 },
  scenePill: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  scenePillText: { fontFamily: fontFamilies.bold, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bubble: { maxWidth: '84%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderBottomWidth: 3 },
  theirs: { borderTopLeftRadius: 6 },
  mine: { borderTopRightRadius: 6 },
  bubbleText: { fontFamily: fontFamilies.bold, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: fontFamilies.semiBold, fontSize: 13, lineHeight: 18, marginTop: 4 },
  tapHint: { fontFamily: fontFamilies.bold, fontSize: 11, marginTop: 4, letterSpacing: 0.3 },
  hint: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1 },
  hintTitle: { fontFamily: fontFamilies.extraBold, fontSize: 14 },
  hintBody: { fontFamily: fontFamilies.semiBold, fontSize: 13, lineHeight: 19, marginTop: 2 },
  replyDock: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10 },
  replyIdle: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  waitText: { fontFamily: fontFamilies.semiBold, fontSize: 13 },
  replyBox: { gap: 8 },
  replyLabel: { fontFamily: fontFamilies.extraBold, fontSize: 11, letterSpacing: 1 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4 },
  optionText: { flex: 1, fontFamily: fontFamilies.bold, fontSize: 15, lineHeight: 20 },
  slotRow: { minHeight: 52, flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 8, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center' },
  slotEmpty: { fontFamily: fontFamilies.semiBold, fontSize: 13, paddingHorizontal: 4 },
  poolRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderBottomWidth: 3 },
  tileText: { fontFamily: fontFamilies.bold, fontSize: 15 },
  reveal: { fontFamily: fontFamilies.semiBold, fontSize: 13 },
  sendText: { color: '#FFFFFF', fontFamily: fontFamilies.extraBold, fontSize: 16 },
  summary: { borderRadius: 22, borderWidth: 1, borderBottomWidth: 4, padding: 14, gap: 8 },
  summaryTitle: { fontFamily: fontFamilies.extraBold, fontSize: 16 },
  summarySub: { fontFamily: fontFamilies.semiBold, fontSize: 13 },
  learnRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8, borderTopWidth: 1 },
  learnTarget: { fontFamily: fontFamilies.extraBold, fontSize: 15 },
  learnEn: { fontFamily: fontFamilies.semiBold, fontSize: 13 },
});
