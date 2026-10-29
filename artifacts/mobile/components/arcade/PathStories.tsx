import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { goBackOr } from '@/lib/navigation';
import Animated, { FadeIn, FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Ionicons } from '@expo/vector-icons';
import { GameShell, ChunkyButton, tapHaptic } from '@/components/arcade/GameShell';
import { SpeakerButton, usePreloadSpeech } from '@/components/SpeakerButton';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { useArcadeProgress } from '@/hooks/useArcadeProgress';
import { arcadeContentBestScore, arcadeContentWon } from '@/lib/arcade-progress';
import { makeSessionId } from '@/lib/arcade/voice-utils';
import { fontFamilies } from '@/constants/typography';
import { ARCADE_STORIES, STORY_LEVEL_LABEL, type ArcadeStory, type StoryLine, type StoryScene } from '@/data/arcade-stories';
import { glossStoryWord, normalizeStoryToken } from '@/data/story-glossary';

const GAME_ID = 'path-stories';
const ACCENT = '#2F8CFF';
const GOOD = '#20B486';
const BAD = '#E5484D';
const PATH_PAGES = 4;

type Outcome = { score: number; stars: number; xp: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function outcomeFor(story: ArcadeStory, pages: number, correct: boolean): Outcome {
  const score = pages * 20 + (correct ? 100 + story.level * 40 : 0);
  return { score, stars: correct ? 3 : 0, xp: correct ? 5 + story.level * 2 : 0 };
}

function Floaty({ children, delay }: { children: React.ReactNode; delay: number }) {
  const v = useSharedValue(0);
  const reduced = useReduceMotion();
  useEffect(() => {
    if (reduced) return;
    v.value = withRepeat(withSequence(withTiming(1, { duration: 1400 + delay }), withTiming(0, { duration: 1400 + delay })), -1);
  }, [delay, reduced, v]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: -v.value * 6 }] }));
  return <Animated.View style={st}>{children}</Animated.View>;
}

/** Original shape-built scene: sky panel, sun disc, rolling hill, and chunky icon "props". */
function Scene({ scene, color }: { scene: StoryScene; color: string }) {
  const night = ['#1E2B55', '#3B3350'].includes(scene.sky);
  return (
    <View style={[styles.scene, { backgroundColor: scene.sky }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.sun, { backgroundColor: night ? '#F4F1DE' : '#FFD45C' }]} />
      <View style={[styles.cloud, { left: '12%', top: 18, opacity: night ? 0.15 : 0.7 }]} />
      <View style={[styles.cloud, { left: '48%', top: 34, width: 46, opacity: night ? 0.1 : 0.5 }]} />
      <View style={[styles.hillBack, { backgroundColor: scene.ground, opacity: 0.55 }]} />
      <View style={[styles.hill, { backgroundColor: scene.ground }]} />
      <View style={styles.props}>
        {scene.icons.map((icon, i) => (
          <Floaty key={`${icon}-${i}`} delay={i * 220}>
            <View style={[styles.propLip, { backgroundColor: i === 0 ? color : '#00000022' }]}>
              <View style={[styles.prop, { backgroundColor: i === 0 ? color : '#FFFFFF', width: i === 0 ? 72 : 54, height: i === 0 ? 72 : 54 }]}>
                <Ionicons name={icon as any} size={i === 0 ? 38 : 26} color={i === 0 ? '#FFFFFF' : color} />
              </View>
            </View>
          </Floaty>
        ))}
      </View>
    </View>
  );
}

export default function PathStories() {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const { progress, activeLanguage, isMuted, recordGuidedSentenceAnswer } = useGame();
  const { playCorrect, playWrong, speak, stopSpeaking } = useSound();
  const { bestScore, isSaving, saveError, beginSession, finishGame, resetSaveError } = useArcadeProgress(GAME_ID);

  const [phase, setPhase] = useState<'intro' | 'playing' | 'results'>('intro');
  const [view, setView] = useState<'list' | 'read' | 'question'>('list');
  const [storyIndex, setStoryIndex] = useState(0);
  const [path, setPath] = useState<string[]>(['start']);
  const [word, setWord] = useState<{ text: string; gloss: string } | null>(null);
  const [showEnglish, setShowEnglish] = useState(false);
  const [order, setOrder] = useState<number[]>([0, 1, 2]);
  const [picked, setPicked] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome>({ score: 0, stars: 0, xp: 0 });
  const [xpEarned, setXpEarned] = useState(0);
  const [startError, setStartError] = useState<string | null>(null);

  const sessionRef = useRef('');
  const savedRef = useRef(false);
  const resultRef = useRef<{ outcome: Outcome; index: number; won: boolean } | null>(null);

  const story = ARCADE_STORIES[storyIndex];
  const pageKey = path[path.length - 1];
  const page = story.pages[pageKey];
  const endingKey = page?.answer !== undefined ? pageKey : null;
  const pageText = page ? page.lines.map(l => l[activeLanguage]).join(' ') : '';

  usePreloadSpeech(useMemo(() => view === 'read' ? Object.values(story.pages).map(p => p.lines.map(l => l[activeLanguage]).join(' ')) : [], [view, story, activeLanguage]), activeLanguage, ['normal', 'slow']);

  useEffect(() => () => stopSpeaking(), [stopSpeaking]);

  // Shared AI narration once per page, respecting mute.
  useEffect(() => {
    if (phase !== 'playing' || view !== 'read' || !pageText || isMuted) return;
    speak(pageText, activeLanguage);
  }, [phase, view, pageKey, storyIndex, isMuted]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = (index: number) => {
    const sessionId = makeSessionId(GAME_ID);
    if (!beginSession(sessionId)) { setStartError('Your progress is still loading or saving. Try again in a moment.'); return; }
    setStartError(null);
    stopSpeaking();
    sessionRef.current = sessionId;
    savedRef.current = false;
    resultRef.current = null;
    resetSaveError();
    setStoryIndex(index);
    setPath(['start']); setWord(null); setShowEnglish(false); setPicked(null); setXpEarned(0);
    setOrder(shuffle([0, 1, 2]));
    setView('read'); setPhase('playing');
  };

  const save = useCallback(async () => {
    const r = resultRef.current;
    if (!r || savedRef.current || !sessionRef.current) return;
    try {
      const res = await finishGame({
        sessionId: sessionRef.current, score: r.outcome.score, stars: r.outcome.stars, xp: r.outcome.xp,
        contentId: `story-${r.index}`, won: r.won,
      });
      savedRef.current = true;
      setXpEarned(res.xpEarned);
    } catch {
      // saveError drives retry UI
    }
  }, [finishGame]);

  const go = (to: string) => {
    tapHaptic(); stopSpeaking();
    setWord(null); setShowEnglish(false);
    setPath(p => [...p, to]);
  };

  const answer = (optionIdx: number) => {
    if (picked !== null || !page || page.answer === undefined) return;
    setPicked(optionIdx);
    const ok = optionIdx === page.answer;
    const correctLine = story.question.options[page.answer];
    recordGuidedSentenceAnswer({ sentenceId: `story-${story.id}-${pageKey}`, english: correctLine.en, target: correctLine[activeLanguage] }, ok, activeLanguage);
    if (ok) { playCorrect(); tapHaptic('success'); } else { playWrong(); tapHaptic('error'); }
  };

  const finish = () => {
    if (picked === null || !page || page.answer === undefined) return;
    const ok = picked === page.answer;
    const o = outcomeFor(story, path.length, ok);
    setOutcome(o);
    resultRef.current = { outcome: o, index: storyIndex, won: ok };
    stopSpeaking();
    setPhase('results');
    void save();
  };

  const tapWord = (raw: string) => {
    const gloss = glossStoryWord(raw, activeLanguage);
    const text = normalizeStoryToken(raw);
    if (!text) return;
    tapHaptic();
    setWord({ text, gloss: gloss ?? 'Name or number' });
  };

  // ---------- renderers ----------
  const renderList = () => (
    <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.listTitle, { color: colors.foreground }]}>Choose a story</Text>
      <Text style={[styles.listSub, { color: colors.mutedForeground }]}>Stories get longer and trickier as you go down.</Text>
      {startError || saveError ? (
        <View style={[styles.banner, { borderColor: '#F59E0B', backgroundColor: '#F59E0B22' }]} accessibilityRole="alert">
          <Ionicons name="hourglass" size={16} color="#F59E0B" />
          <Text style={[styles.bannerText, { color: colors.foreground }]}>{startError ?? saveError}</Text>
        </View>
      ) : null}
      {ARCADE_STORIES.map((s, i) => {
        const won = arcadeContentWon(progress, activeLanguage, GAME_ID, `story-${i}`);
        const best = arcadeContentBestScore(progress, activeLanguage, GAME_ID, `story-${i}`);
        return (
          <Animated.View key={s.id} entering={FadeInDown.delay(i * 45)}>
            <Pressable accessibilityRole="button" testID={`story-${i}`}
              accessibilityLabel={`${s.title.en}, level ${s.level}${won ? ', completed' : ''}${best ? `, best ${best}` : ''}`}
              onPress={() => { tapHaptic(); start(i); }}
              style={({ pressed }) => [styles.storyCard, { backgroundColor: colors.card, borderColor: s.color + '55', transform: [{ translateY: pressed ? 3 : 0 }] }]}>
              <View style={[styles.coverLip, { backgroundColor: s.color + 'AA' }]}>
                <View style={[styles.cover, { backgroundColor: s.color }]}>
                  <Ionicons name={s.icon as any} size={28} color="#FFFFFF" />
                </View>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.levelRow}>
                  {[1, 2, 3, 4, 5].map(n => <View key={n} style={[styles.levelPip, { backgroundColor: n <= s.level ? s.color : colors.border }]} />)}
                  <Text style={[styles.levelText, { color: s.color }]}>{STORY_LEVEL_LABEL[s.level]}</Text>
                </View>
                <Text style={[styles.storyTitle, { color: colors.foreground }]} numberOfLines={1}>{s.title[activeLanguage]}</Text>
                <Text style={[styles.storyEn, { color: colors.mutedForeground }]} numberOfLines={1}>{s.title.en}</Text>
              </View>
              {won ? (
                <View style={styles.doneCol}>
                  <Ionicons name="checkmark-circle" size={24} color={GOOD} />
                  <Text style={[styles.bestSmall, { color: colors.mutedForeground }]}>{best}</Text>
                </View>
              ) : best > 0 ? (
                <Text style={[styles.bestSmall, { color: colors.mutedForeground }]}>Best {best}</Text>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );

  const renderSentence = (line: StoryLine, li: number) => (
    <View key={li} style={styles.sentence}>
      {line[activeLanguage].split(/\s+/).map((w, wi) => {
        const active = word && normalizeStoryToken(w) === word.text;
        return (
          <Pressable key={`${li}-${wi}`} onPress={() => tapWord(w)} accessibilityRole="button" accessibilityLabel={`${w}, tap for meaning`} hitSlop={2}>
            <Text style={[styles.word, { color: colors.foreground, backgroundColor: active ? story.color + '33' : 'transparent' }]}>{w}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderRead = () => {
    if (!page) return null;
    const isEnding = page.answer !== undefined;
    return (
      <ScrollView contentContainerStyle={styles.readContent} showsVerticalScrollIndicator={false}>
        <View style={styles.readTop}>
          <Pressable onPress={() => { stopSpeaking(); setView('list'); }} accessibilityRole="button" accessibilityLabel="Back to stories" hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.readTitle, { color: colors.foreground }]} numberOfLines={1}>{story.title[activeLanguage]}</Text>
          <Text style={[styles.pageNo, { color: colors.mutedForeground }]}>{path.length}/{PATH_PAGES}</Text>
        </View>
        <Animated.View key={pageKey} entering={FadeInRight.springify().damping(18)}>
          <Scene scene={page.scene} color={story.color} />
        </Animated.View>
        <Animated.View key={`t-${pageKey}`} entering={FadeIn.delay(120)} style={[styles.textCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {isEnding && page.endingTitle ? (
            <View style={[styles.endingTag, { backgroundColor: story.color + '22' }]}>
              <Ionicons name="flag" size={13} color={story.color} />
              <Text style={[styles.endingTagText, { color: dark ? colors.foreground : story.color }]}>Ending: {page.endingTitle}</Text>
            </View>
          ) : null}
          {page.lines.map(renderSentence)}
          {word ? (
            <Animated.View entering={FadeInDown} style={[styles.gloss, { backgroundColor: story.color + '1A', borderColor: story.color + '66' }]} accessibilityLiveRegion="polite">
              <Text style={[styles.glossWord, { color: colors.foreground }]}>{word.text}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.mutedForeground} />
              <Text style={[styles.glossMeaning, { color: colors.foreground }]}>{word.gloss}</Text>
            </Animated.View>
          ) : (
            <Text style={[styles.tapTip, { color: colors.mutedForeground }]}>Tap any word for its meaning</Text>
          )}
          <View style={styles.toolRow}>
            <SpeakerButton text={pageText} language={activeLanguage} label="Listen" showSlow compact testID="story-narrate" accessibilityLabel="Hear this page" />
            <Pressable onPress={() => setShowEnglish(v => !v)} accessibilityRole="button" testID="story-english"
              style={[styles.engBtn, { borderColor: colors.border, backgroundColor: showEnglish ? colors.muted : 'transparent' }]}>
              <Ionicons name="language" size={16} color={colors.foreground} />
              <Text style={[styles.engBtnText, { color: colors.foreground }]}>{showEnglish ? 'Hide English' : 'English'}</Text>
            </Pressable>
          </View>
          {showEnglish ? <Text style={[styles.english, { color: colors.mutedForeground }]}>{page.lines.map(l => l.en).join(' ')}</Text> : null}
        </Animated.View>

        {page.choices ? (
          <View style={styles.choices}>
            <Text style={[styles.choiceLabel, { color: colors.mutedForeground }]}>WHAT HAPPENS NEXT?</Text>
            {page.choices.map((c, i) => (
              <Pressable key={c.to} onPress={() => go(c.to)} accessibilityRole="button" testID={`story-choice-${i}`}
                style={({ pressed }) => [styles.choice, { backgroundColor: colors.card, borderColor: story.color, transform: [{ translateY: pressed ? 3 : 0 }] }]}>
                <View style={[styles.choiceBadge, { backgroundColor: story.color }]}><Text style={styles.choiceBadgeText}>{i === 0 ? 'A' : 'B'}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.choiceText, { color: colors.foreground }]}>{c.label[activeLanguage]}</Text>
                  <Text style={[styles.choiceEn, { color: colors.mutedForeground }]}>{c.label.en}</Text>
                </View>
                <Ionicons name="git-branch" size={18} color={story.color} />
              </Pressable>
            ))}
          </View>
        ) : page.next ? (
          <ChunkyButton onPress={() => go(page.next!)} color={story.color} testID="story-next">Next page</ChunkyButton>
        ) : (
          <ChunkyButton onPress={() => { stopSpeaking(); setView('question'); }} color={story.color} testID="story-to-question">Check your understanding</ChunkyButton>
        )}
      </ScrollView>
    );
  };

  const renderQuestion = () => {
    if (!page || page.answer === undefined) return null;
    const ok = picked !== null && picked === page.answer;
    return (
      <ScrollView contentContainerStyle={styles.readContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.qCard, { backgroundColor: colors.card, borderColor: story.color + '55' }]}>
          <Text style={[styles.choiceLabel, { color: story.color }]}>ABOUT YOUR PATH</Text>
          <Text style={[styles.qPrompt, { color: colors.foreground }]}>{story.question.prompt}</Text>
        </View>
        {order.map(i => {
          const o = story.question.options[i];
          const state = picked === null ? 'idle' : i === page.answer ? 'correct' : i === picked ? 'wrong' : 'dim';
          const border = state === 'correct' ? GOOD : state === 'wrong' ? BAD : colors.border;
          return (
            <Pressable key={i} disabled={picked !== null} onPress={() => answer(i)} accessibilityRole="button" testID={`story-answer-${i}`}
              accessibilityState={{ disabled: picked !== null, selected: picked === i }}
              style={[styles.choice, { backgroundColor: state === 'correct' ? GOOD + '1F' : state === 'wrong' ? BAD + '1A' : colors.card, borderColor: border, opacity: state === 'dim' ? 0.55 : 1 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.choiceText, { color: colors.foreground }]}>{o[activeLanguage]}</Text>
                {picked !== null ? <Text style={[styles.choiceEn, { color: colors.mutedForeground }]}>{o.en}</Text> : null}
              </View>
              {state === 'correct' ? <Ionicons name="checkmark-circle" size={22} color={GOOD} /> : state === 'wrong' ? <Ionicons name="close-circle" size={22} color={BAD} /> : null}
            </Pressable>
          );
        })}
        {picked !== null ? (
          <Animated.View entering={FadeInDown} style={[styles.feedback, { backgroundColor: (ok ? GOOD : BAD) + '14', borderColor: (ok ? GOOD : BAD) + '66' }]}>
            <Text style={[styles.fbTitle, { color: colors.foreground }]}>{ok ? 'Exactly what happened!' : 'Not on your path'}</Text>
            {!ok ? <Text style={[styles.fbBody, { color: colors.mutedForeground }]}>In your ending: {page.lines.map(l => l.en).join(' ')}</Text> : null}
            <ChunkyButton onPress={finish} color={story.color} testID="story-finish">See results</ChunkyButton>
          </Animated.View>
        ) : null}
      </ScrollView>
    );
  };

  const won = picked !== null && page?.answer === picked;
  const resultsFooter = phase === 'results' && page ? (
    <View style={{ gap: 12 }}>
      {saveError ? <ChunkyButton onPress={() => { resetSaveError(); void save(); }} color="#F59E0B" testID="story-retry-save">Try saving again</ChunkyButton> : null}
      <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sumTitle, { color: colors.foreground }]}>Your path: {page.endingTitle}</Text>
        <View style={styles.pathRow}>
          {path.map((k, i) => (
            <React.Fragment key={k}>
              <View style={[styles.pathDot, { backgroundColor: i === path.length - 1 ? story.color : story.color + '55' }]}>
                <Ionicons name={story.pages[k].scene.icons[0] as any} size={14} color="#FFFFFF" />
              </View>
              {i < path.length - 1 ? <View style={[styles.pathLine, { backgroundColor: story.color + '55' }]} /> : null}
            </React.Fragment>
          ))}
        </View>
        {!won && endingKey ? (
          <View style={{ gap: 8 }}>
            <Text style={[styles.reviewLabel, { color: BAD }]}>REVIEW THIS</Text>
            {page.lines.map((l, i) => (
              <View key={i} style={[styles.reviewRow, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reviewTarget, { color: colors.foreground }]}>{l[activeLanguage]}</Text>
                  <Text style={[styles.reviewEn, { color: colors.mutedForeground }]}>{l.en}</Text>
                </View>
                <SpeakerButton text={l[activeLanguage]} language={activeLanguage} compact />
              </View>
            ))}
            <Text style={[styles.reviewEn, { color: colors.foreground }]}>
              Answer: <Text style={{ fontFamily: fontFamilies.extraBold }}>{story.question.options[page.answer ?? 0][activeLanguage]}</Text> ({story.question.options[page.answer ?? 0].en})
            </Text>
          </View>
        ) : (
          <Text style={[styles.reviewEn, { color: colors.mutedForeground }]}>Want the other ending? Play again and choose differently.</Text>
        )}
      </View>
      <ChunkyButton onPress={() => { setView('list'); setPhase('playing'); }} color={colors.mutedForeground} testID="story-all">All stories</ChunkyButton>
    </View>
  ) : undefined;

  return (
    <GameShell
      gameId={GAME_ID}
      phase={phase}
      score={phase === 'results' ? outcome.score : path.length * 20}
      bestScore={bestScore}
      stars={outcome.stars}
      xp={xpEarned}
      progress={view === 'list' ? 0 : view === 'question' ? 0.95 : path.length / (PATH_PAGES + 1)}
      saving={isSaving}
      error={saveError}
      onPlay={() => { setView('list'); setPhase('playing'); }}
      onReplay={() => start(storyIndex)}
      onDone={() => goBackOr('/categories?tab=games')}
      footer={resultsFooter}
    >
      {view === 'list' ? renderList() : view === 'read' ? renderRead() : renderQuestion()}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16, gap: 10, paddingBottom: 32 },
  listTitle: { fontFamily: fontFamilies.extraBold, fontSize: 24, letterSpacing: -0.4 },
  listSub: { fontFamily: fontFamilies.semiBold, fontSize: 14, marginBottom: 4 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 14, borderWidth: 1 },
  bannerText: { flex: 1, fontFamily: fontFamilies.semiBold, fontSize: 13 },
  storyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, borderWidth: 2, borderBottomWidth: 5 },
  coverLip: { borderRadius: 16, paddingBottom: 4 },
  cover: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  levelPip: { width: 10, height: 5, borderRadius: 3 },
  levelText: { fontFamily: fontFamilies.extraBold, fontSize: 11, marginLeft: 5, letterSpacing: 0.4, textTransform: 'uppercase' },
  storyTitle: { fontFamily: fontFamilies.extraBold, fontSize: 16, marginTop: 3 },
  storyEn: { fontFamily: fontFamilies.semiBold, fontSize: 12 },
  doneCol: { alignItems: 'center' },
  bestSmall: { fontFamily: fontFamilies.bold, fontSize: 12 },
  readContent: { padding: 16, gap: 12, paddingBottom: 32 },
  readTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readTitle: { flex: 1, fontFamily: fontFamilies.extraBold, fontSize: 17 },
  pageNo: { fontFamily: fontFamilies.bold, fontSize: 13 },
  scene: { height: 170, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end' },
  sun: { position: 'absolute', top: 16, right: 22, width: 44, height: 44, borderRadius: 22 },
  cloud: { position: 'absolute', width: 64, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  hillBack: { position: 'absolute', bottom: -70, left: -60, width: 300, height: 150, borderRadius: 150 },
  hill: { position: 'absolute', bottom: -90, right: -80, left: 40, height: 160, borderRadius: 200 },
  props: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 14, paddingBottom: 22 },
  propLip: { borderRadius: 22, paddingBottom: 4 },
  prop: { borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  textCard: { borderRadius: 22, borderWidth: 1, borderBottomWidth: 4, padding: 16, gap: 10 },
  endingTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  endingTagText: { fontFamily: fontFamilies.extraBold, fontSize: 12 },
  sentence: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 5, rowGap: 2 },
  word: { fontFamily: fontFamilies.bold, fontSize: 19, lineHeight: 28, borderRadius: 6, paddingHorizontal: 1 },
  gloss: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 14, borderWidth: 1, flexWrap: 'wrap' },
  glossWord: { fontFamily: fontFamilies.extraBold, fontSize: 15 },
  glossMeaning: { fontFamily: fontFamilies.semiBold, fontSize: 15, flexShrink: 1 },
  tapTip: { fontFamily: fontFamilies.semiBold, fontSize: 12 },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  engBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, minHeight: 34, borderRadius: 999, borderWidth: 1 },
  engBtnText: { fontFamily: fontFamilies.extraBold, fontSize: 12 },
  english: { fontFamily: fontFamilies.semiBold, fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  choices: { gap: 10 },
  choiceLabel: { fontFamily: fontFamilies.extraBold, fontSize: 11, letterSpacing: 1 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 2, borderBottomWidth: 5 },
  choiceBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  choiceBadgeText: { color: '#FFFFFF', fontFamily: fontFamilies.extraBold, fontSize: 14 },
  choiceText: { fontFamily: fontFamilies.extraBold, fontSize: 16, lineHeight: 21 },
  choiceEn: { fontFamily: fontFamilies.semiBold, fontSize: 13, marginTop: 2 },
  qCard: { borderRadius: 22, borderWidth: 2, borderBottomWidth: 5, padding: 16, gap: 6 },
  qPrompt: { fontFamily: fontFamilies.extraBold, fontSize: 20, lineHeight: 26 },
  feedback: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  fbTitle: { fontFamily: fontFamilies.extraBold, fontSize: 17 },
  fbBody: { fontFamily: fontFamilies.semiBold, fontSize: 14, lineHeight: 20 },
  summary: { borderRadius: 22, borderWidth: 1, borderBottomWidth: 4, padding: 14, gap: 12 },
  sumTitle: { fontFamily: fontFamilies.extraBold, fontSize: 16 },
  pathRow: { flexDirection: 'row', alignItems: 'center' },
  pathDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pathLine: { flex: 1, height: 4, borderRadius: 2 },
  reviewLabel: { fontFamily: fontFamilies.extraBold, fontSize: 11, letterSpacing: 1 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8, borderTopWidth: 1 },
  reviewTarget: { fontFamily: fontFamilies.extraBold, fontSize: 15, lineHeight: 20 },
  reviewEn: { fontFamily: fontFamilies.semiBold, fontSize: 13, lineHeight: 18 },
});
