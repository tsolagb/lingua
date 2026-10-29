import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  Dimensions,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, LANGUAGE_META, Language } from '@/data/vocabulary';
import { GENERAL_VOCABULARY_CATEGORY_ID } from '@/data/general-vocabulary';
import { useGame } from '@/context/GameContext';
import { useClassicGameResult } from '@/hooks/useClassicGameResult';
import { useSound } from '@/hooks/useSound';
import { AutoSpeakToggle } from '@/components/AutoSpeakToggle';
import { goBackOr } from '@/lib/navigation';
import {
  completeGeneralVocabularyStage,
  getGeneralVocabularyReturnPath,
  resolveGeneralVocabularySession,
} from '@/lib/general-vocabulary-session';
import { usePreloadSpeech } from '@/components/SpeakerButton';

// ─── Constants ────────────────────────────────────────────────────────────────
const SCREEN_W  = Dimensions.get('window').width;
const H_PAD     = 16;
const GRID_SIZE = 14;
const CELL_SIZE = Math.floor((SCREEN_W - H_PAD * 2) / GRID_SIZE);
const ALPHABET  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ARMENIAN_ALPHABET = Array.from('ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔՕՖ');

// ─── Types ────────────────────────────────────────────────────────────────────
interface Placement {
  word: string;        // normalized uppercase (used for matching)
  english: string;
  original: string;   // display form in target language
  isReview?: boolean;
  row: number;
  col: number;
  dir: 'H' | 'V';
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function normalize(s: string): string {
  return s.toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z\u0531-\u0556]/g, '');
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canPlace(grid: string[][], word: string, r: number, c: number, dir: 'H' | 'V'): boolean {
  for (let i = 0; i < word.length; i++) {
    const rr = dir === 'H' ? r : r + i;
    const cc = dir === 'H' ? c + i : c;
    if (rr >= GRID_SIZE || cc >= GRID_SIZE) return false;
    if (grid[rr][cc] && grid[rr][cc] !== word[i]) return false;
  }
  return true;
}

function doPlace(grid: string[][], word: string, r: number, c: number, dir: 'H' | 'V') {
  for (let i = 0; i < word.length; i++) {
    const rr = dir === 'H' ? r : r + i;
    const cc = dir === 'H' ? c + i : c;
    grid[rr][cc] = word[i];
  }
}

function generateGrid(
  words: { english: string; original: string; normalized: string; isReview?: boolean }[],
  alphabet: string[],
) {
  const grid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
  const placements: Placement[] = [];

  const sorted = [...words]
    .filter(w => w.normalized.length >= 3 && w.normalized.length <= GRID_SIZE)
    .sort((a, b) => b.normalized.length - a.normalized.length);

  for (const w of sorted) {
    const word = w.normalized;
    const len  = word.length;
    const candidates: { r: number; c: number; dir: 'H' | 'V' }[] = [];

    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c <= GRID_SIZE - len; c++)
        candidates.push({ r, c, dir: 'H' });
    for (let r = 0; r <= GRID_SIZE - len; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        candidates.push({ r, c, dir: 'V' });

    for (const pos of shuffled(candidates)) {
      if (canPlace(grid, word, pos.r, pos.c, pos.dir)) {
        doPlace(grid, word, pos.r, pos.c, pos.dir);
        placements.push({
          word,
          english: w.english,
          original: w.original,
          isReview: w.isReview,
          row: pos.r,
          col: pos.c,
          dir: pos.dir,
        });
        break;
      }
    }
  }

  // Fill empty cells with random letters
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (!grid[r][c]) grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];

  return { grid, placements };
}

// ─── Selection helpers ────────────────────────────────────────────────────────
type Cell = { r: number; c: number };

function selectionCells(start: Cell | null, end: Cell | null): Set<string> {
  const out = new Set<string>();
  if (!start) return out;
  out.add(`${start.r},${start.c}`);
  if (!end) return out;
  if (start.r === end.r) {
    const lo = Math.min(start.c, end.c), hi = Math.max(start.c, end.c);
    for (let c = lo; c <= hi; c++) out.add(`${start.r},${c}`);
  } else if (start.c === end.c) {
    const lo = Math.min(start.r, end.r), hi = Math.max(start.r, end.r);
    for (let r = lo; r <= hi; r++) out.add(`${r},${start.c}`);
  }
  return out;
}

function validate(start: Cell, end: Cell, grid: string[][], placements: Placement[], found: Set<string>): Placement | null {
  let str = '';
  if (start.r === end.r) {
    const lo = Math.min(start.c, end.c), hi = Math.max(start.c, end.c);
    for (let c = lo; c <= hi; c++) str += grid[start.r][c];
  } else if (start.c === end.c) {
    const lo = Math.min(start.r, end.r), hi = Math.max(start.r, end.r);
    for (let r = lo; r <= hi; r++) str += grid[r][start.c];
  } else return null;
  return placements.find(p => !found.has(p.word) && p.word === str) ?? null;
}

// ─── Cell component ───────────────────────────────────────────────────────────
function GridCell({ letter, state }: { letter: string; state: 'default' | 'selected' | 'found' | 'error' }) {
  const bg = state === 'found'    ? '#DCFCE7'
           : state === 'selected' ? '#DBEAFE'
           : state === 'error'    ? '#FFCDD2'
           : '#F8FAFC';
  const border = state === 'found'    ? '#22C55E'
               : state === 'selected' ? '#1F6FEB'
               : state === 'error'    ? '#EF9A9A'
               : '#E5E7EB';
  const color = state === 'found'    ? '#FFFFFF'
              : state === 'selected' ? '#185AC7'
              : state === 'error'    ? '#B71C1C'
              : '#374151';
  const bold = state !== 'default';

  return (
    <View style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.cellLetter, { color, fontFamily: bold ? 'Nunito_700Bold' : 'Nunito_400Regular' }]}>
        {letter}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function WordSearchScreen() {
  const {
    categoryId,
    levelIndex: levelParam,
    generalStage: generalStageParam,
    allWords: allWordsParam,
    randomBatch: randomBatchParam,
    batchIndices,
    stageIndex: stageParam,
    returnTo,
  } = useLocalSearchParams<{
    categoryId?: string; levelIndex?: string; generalStage?: string;
    allWords?: string; randomBatch?: string; batchIndices?: string;
    stageIndex?: string; returnTo?: string;
  }>();
  const levelIndex = Number.parseInt(levelParam ?? '0', 10);
  const stageIndex = Number.parseInt(stageParam ?? '', 10);
  const isGeneralStage = generalStageParam === '1';
  const isRandomBatch = allWordsParam === '1' && randomBatchParam === '1';
  const isGeneralSession = isGeneralStage || isRandomBatch;
  const insets          = useSafeAreaInsets();
  const topPad          = Platform.OS === 'web' ? 67 : insets.top;
  const botPad          = Platform.OS === 'web' ? 34 : insets.bottom;
  const { activeLanguage, getPracticePairs, recordWordAnswer, completeLevel } = useGame();
  const { report: reportClassic } = useClassicGameResult('wordsearch');
  const { speakCorrectAnswer } = useSound();

  const category  = CATEGORIES.find(c => c.id === categoryId) ??
    (isGeneralSession
      ? ({
          id: GENERAL_VOCABULARY_CATEGORY_ID,
          name: 'General vocabulary',
          icon: 'book-outline',
          emoji: '📚',
          levels: [],
          accentColor: '#1F6FEB',
          bgColor: '#EFF6FF',
        } as (typeof CATEGORIES)[number])
      : undefined);
  const langMeta  = LANGUAGE_META[activeLanguage];
  const practicePairs = useMemo(
    () => isGeneralSession
      ? resolveGeneralVocabularySession({
          generalStage: generalStageParam,
          allWords: allWordsParam,
          randomBatch: randomBatchParam,
          batchIndices,
          levelIndex: levelParam,
          stageIndex: stageParam,
        }, activeLanguage)?.pairs ?? []
      : getPracticePairs(categoryId ?? '', Math.max(0, (category?.levels.length ?? 1) - 1)),
    [categoryId, category, getPracticePairs, isGeneralSession, generalStageParam, allWordsParam, randomBatchParam, batchIndices, levelParam, stageParam, activeLanguage],
  );

  // ── Build word list (first 2 from each level → max 12 words) ────────────
  const wordList = useMemo(() => {
    if (isGeneralSession) {
      return practicePairs
        .map(pair => ({
          english: pair.english,
          original: pair.translations[activeLanguage as Language],
          normalized: normalize(pair.translations[activeLanguage as Language]),
          isReview: pair.isReview,
        }))
        .filter(word => word.normalized.length >= 3 && word.normalized.length <= GRID_SIZE)
        .slice(0, 12);
    }
    if (!category) return [];
    const base = category.levels.flatMap(level =>
      level.pairs
        .map(pair => ({
          english:    pair.english,
          original:   pair.translations[activeLanguage as Language],
          normalized: normalize(pair.translations[activeLanguage as Language]),
          isReview: false,
        }))
        .filter(word => word.normalized.length >= 3 && word.normalized.length <= GRID_SIZE)
        .slice(0, 2)
    );
    const baseKeys = new Set(base.map(word => word.english.trim().toLocaleLowerCase()));
    const queued = practicePairs
      .filter(pair => pair.isReview)
      .filter(pair => !baseKeys.has(pair.english.trim().toLocaleLowerCase()))
      .map(pair => ({
        english: pair.english,
        original: pair.translations[activeLanguage],
        normalized: normalize(pair.translations[activeLanguage]),
        isReview: true,
      }))
      .filter(word => word.normalized.length >= 3 && word.normalized.length <= GRID_SIZE)
      .slice(0, 5);
    const reviewKeys = new Set(practicePairs
      .filter(pair => pair.isReview)
      .map(pair => pair.english.trim().toLocaleLowerCase()));
    return [
      ...queued,
      ...base.map(word => ({ ...word, isReview: reviewKeys.has(word.english.trim().toLocaleLowerCase()) })),
    ]
      .filter((word, index, words) =>
        words.findIndex(candidate => candidate.normalized === word.normalized) === index,
      )
      .slice(0, 12);
  }, [category, activeLanguage, practicePairs, isGeneralSession]);

  // ── Generate grid once per mount ──────────────────────────────────────────
  const alphabet = activeLanguage === 'armenian' ? ARMENIAN_ALPHABET : Array.from(ALPHABET);
  const [puzzle, setPuzzle] = useState(() => generateGrid(wordList, alphabet));
  const { grid, placements } = puzzle;

  const regenerate = useCallback(
    () => setPuzzle(generateGrid(wordList, alphabet)),
    [wordList, alphabet],
  );

  // ── Game state ─────────────────────────────────────────────────────────────
  usePreloadSpeech(wordList.map(word => word.original), activeLanguage);
  const [found,      setFound]      = useState<Set<string>>(new Set());
  const [selStart,   setSelStart]   = useState<Cell | null>(null);
  const [selEnd,     setSelEnd]     = useState<Cell | null>(null);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());

  // Refs for PanResponder (avoids stale-closure issues)
  const selStartRef  = useRef<Cell | null>(null);
  const foundRef     = useRef<Set<string>>(new Set());
  const placementsRef = useRef(placements);
  placementsRef.current = placements;

  const setStart = useCallback((v: Cell | null) => { selStartRef.current = v; setSelStart(v); }, []);

  const commit = useCallback((endCell: Cell) => {
    const start = selStartRef.current;
    if (!start) return;
    const matched = validate(start, endCell, grid, placementsRef.current, foundRef.current);
    if (matched) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      speakCorrectAnswer(matched.original, activeLanguage);
      recordWordAnswer(
        matched.english,
        true,
        isGeneralSession ? undefined : category?.id,
        isGeneralSession ? undefined : (category?.levels.length ?? 1) - 1,
        activeLanguage,
      );
      const next = new Set(foundRef.current);
      next.add(matched.word);
      foundRef.current = next;
      setFound(next);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errCells = selectionCells(start, endCell);
      setErrorCells(errCells);
      setTimeout(() => setErrorCells(new Set()), 500);
    }
    setStart(null);
    setSelEnd(null);
  }, [grid, setStart, category, recordWordAnswer, activeLanguage, speakCorrectAnswer, isGeneralSession]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const r = clamp(Math.floor(evt.nativeEvent.locationY / CELL_SIZE), 0, GRID_SIZE - 1);
        const c = clamp(Math.floor(evt.nativeEvent.locationX / CELL_SIZE), 0, GRID_SIZE - 1);
        selStartRef.current = { r, c };
        setSelStart({ r, c });
        setSelEnd(null);
        setErrorCells(new Set());
      },
      onPanResponderMove: (evt) => {
        const r = clamp(Math.floor(evt.nativeEvent.locationY / CELL_SIZE), 0, GRID_SIZE - 1);
        const c = clamp(Math.floor(evt.nativeEvent.locationX / CELL_SIZE), 0, GRID_SIZE - 1);
        setSelEnd({ r, c });
      },
      onPanResponderRelease: (evt) => {
        const r = clamp(Math.floor(evt.nativeEvent.locationY / CELL_SIZE), 0, GRID_SIZE - 1);
        const c = clamp(Math.floor(evt.nativeEvent.locationX / CELL_SIZE), 0, GRID_SIZE - 1);
        commit({ r, c });
      },
    })
  ).current;

  // ── Computed cell states ───────────────────────────────────────────────────
  const selCells = useMemo(() => selectionCells(selStart, selEnd), [selStart, selEnd]);

  const foundCellKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const p of placements) {
      if (!found.has(p.word)) continue;
      for (let i = 0; i < p.word.length; i++) {
        const rr = p.dir === 'H' ? p.row : p.row + i;
        const cc = p.dir === 'H' ? p.col + i : p.col;
        keys.add(`${rr},${cc}`);
      }
    }
    return keys;
  }, [found, placements]);

  const getCellState = (r: number, c: number): 'default' | 'selected' | 'found' | 'error' => {
    const key = `${r},${c}`;
    if (foundCellKeys.has(key))  return 'found';
    if (errorCells.has(key))     return 'error';
    if (selCells.has(key))       return 'selected';
    return 'default';
  };

  const completed = found.size === placements.length && placements.length > 0;
  const stageCompletionSaved = useRef(false);
  const classicReported = useRef(false);
  useEffect(() => {
    if (!completed || isGeneralStage || classicReported.current) return;
    classicReported.current = true;
    reportClassic(3);
  }, [completed, isGeneralStage, reportClassic]);
  useEffect(() => {
    if (!completed || !isGeneralStage || stageCompletionSaved.current) return;
    stageCompletionSaved.current = true;
    void reportClassic(3, completeGeneralVocabularyStage(
      completeLevel,
      levelIndex,
      stageIndex,
      3,
      activeLanguage,
      'wordsearch',
    ));
  }, [completed, isGeneralStage, completeLevel, levelIndex, activeLanguage, stageIndex]);
  const reviewWordCount = placements.filter(placement => placement.isReview).length;

  if (!category) return null;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBackOr(isGeneralSession
          ? getGeneralVocabularyReturnPath(returnTo, levelIndex) as any
          : `/levels?categoryId=${categoryId}` as any)} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.headerEmoji}>{category.emoji}</Text>
          <View>
            <Text style={styles.headerTitle}>Word Search</Text>
            <Text style={styles.headerSub}>
              {isGeneralStage
                ? `Level ${levelIndex + 1} · Stage ${stageIndex + 1} · selected words · ${langMeta.label}`
                : isRandomBatch
                  ? `${placements.length} words from your random batch · ${langMeta.label}`
                  : `${category.name} · ${langMeta.flag} ${langMeta.label}`}
              {reviewWordCount > 0 ? ` · ${reviewWordCount} review` : ''}
            </Text>
          </View>
        </View>
        <AutoSpeakToggle />
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{found.size}/{placements.length}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 16 }}>
        {/* ── Instruction ─────────────────────────────────────────── */}
        <Text style={styles.instruction}>
          👇 Find each {langMeta.label} word by dragging across the grid
        </Text>

        {/* ── Grid ────────────────────────────────────────────────── */}
        <View style={styles.gridWrap} {...panResponder.panHandlers}>
          {grid.map((row, r) => (
            <View key={r} style={styles.row}>
              {row.map((letter, c) => (
                <GridCell key={c} letter={letter} state={getCellState(r, c)} />
              ))}
            </View>
          ))}
        </View>

        {/* ── Clues ───────────────────────────────────────────────── */}
        <Text style={styles.cluesTitle}>🇬🇧  English Clues — find in {langMeta.label}</Text>
        <View style={styles.clueGrid}>
          {placements.map((p) => {
            const isFound = found.has(p.word);
            return (
              <View
                key={p.word}
                style={[styles.clueChip, isFound && styles.clueChipFound]}
              >
                {isFound && <Ionicons name="checkmark-circle" size={14} color="#166534" style={{ marginRight: 4 }} />}
                <View>
                  <Text style={[styles.clueEn, isFound && styles.clueFoundText]}>{p.english}</Text>
                  {isFound && <Text style={styles.clueAnswer}>{p.original}</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Completion overlay ───────────────────────────────────── */}
      {completed && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Text style={styles.overlayEmoji}>🎉</Text>
            <Text style={styles.overlayTitle}>You found them all!</Text>
            <Text style={styles.overlaySub}>
              Every {langMeta.label} word hidden in the grid — impressive!
            </Text>
            <TouchableOpacity
              onPress={() => { setFound(new Set()); foundRef.current = new Set(); regenerate(); }}
              style={styles.playAgainBtn}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.playAgainTxt}>New Puzzle</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => goBackOr(isGeneralSession
              ? getGeneralVocabularyReturnPath(returnTo, levelIndex) as any
              : `/levels?categoryId=${categoryId}` as any)} style={styles.backToLevels}>
              <Text style={styles.backToLevelsTxt}>{isGeneralStage ? 'Back to stages' : isRandomBatch ? 'Back to words' : 'Back to levels'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 10,
    backgroundColor: '#1F6FEB',
  },
  backCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  headerMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerEmoji: { fontSize: 26 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, fontWeight: '600', color: 'rgba(0,0,0,0.55)' },
  progressBadge: {
    backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  progressText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  // ── Instruction ──
  instruction: {
    fontSize: 13, fontWeight: '600',
    color: '#6B7280', textAlign: 'center',
    marginVertical: 10,
  },

  // ── Grid ──
  gridWrap: {
    alignSelf: 'center',
    width: CELL_SIZE * GRID_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: { flexDirection: 'row' },
  cell: {
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLetter: { fontSize: CELL_SIZE * 0.52, lineHeight: CELL_SIZE },

  // ── Clues ──
  cluesTitle: {
    fontSize: 13, fontWeight: '700',
    color: '#374151', marginTop: 16, marginBottom: 8,
    marginHorizontal: 16,
  },
  clueGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: 12, gap: 8,
  },
  clueChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 7,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  clueChipFound: {
    backgroundColor: '#DCFCE7', borderColor: '#22C55E',
  },
  clueEn: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  clueFoundText: { color: '#166534' },
  clueAnswer: { fontSize: 11, fontWeight: '600', color: '#15803D' },

  // ── Overlay ──
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: 'white', borderRadius: 28,
    padding: 32, marginHorizontal: 32,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 12,
  },
  overlayEmoji: { fontSize: 60 },
  overlayTitle: { fontSize: 28, fontWeight: '800', color: '#1F2937' },
  overlaySub: { fontSize: 15, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  playAgainBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1F6FEB', borderRadius: 16,
    paddingHorizontal: 24, paddingVertical: 14,
    marginTop: 8,
  },
  playAgainTxt: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  backToLevels: { paddingVertical: 8 },
  backToLevelsTxt: { fontSize: 14, fontWeight: '600', color: '#9B9BB4' },
});
