/**
 * Crossword game — English clues, fill in the target-language word in the grid.
 * Words are placed algorithmically so they share letters at intersections.
 */
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from '@/components/native';
import type { ScrollViewInstance } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { CATEGORIES, LANGUAGE_META } from '@/data/vocabulary';
import { useGame } from '@/context/GameContext';
import { useClassicGameResult } from '@/hooks/useClassicGameResult';
import { useSound } from '@/hooks/useSound';
import { AutoSpeakToggle } from '@/components/AutoSpeakToggle';
import { useColors } from '@/hooks/useColors';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { fontFamilies } from '@/constants/typography';
import { goBackOr } from '@/lib/navigation';
import { getNextCrosswordHintIndex } from '@/lib/crossword-hints';
import { normalizeCrosswordWord } from '@/lib/crossword-letters';
import {
  completeGeneralVocabularyStage,
  getGeneralVocabularyReturnPath,
  resolveGeneralVocabularySession,
} from '@/lib/general-vocabulary-session';
import { usePreloadSpeech } from '@/components/SpeakerButton';

const GRID_SIZE = 15; // working grid for placement algorithm

const ck = (r: number, c: number) => `${r},${c}`;

// ── Crossword placement ───────────────────────────────────────────────────────
interface PlacedWord {
  id: number;
  english: string;
  display: string;   // original target-language word (with accents)
  normal: string;    // uppercase ASCII letters only
  startRow: number;
  startCol: number;
  dir: 'H' | 'V';
  clueNum: number;
}

function canPlace(
  occ: Map<string, string>,
  word: string,
  sr: number, sc: number,
  dir: 'H' | 'V',
): boolean {
  const dr = dir === 'V' ? 1 : 0;
  const dc = dir === 'H' ? 1 : 0;
  const er = sr + dr * (word.length - 1);
  const ec = sc + dc * (word.length - 1);
  if (sr < 0 || sc < 0 || er >= GRID_SIZE || ec >= GRID_SIZE) return false;
  // Guard before/after endpoints
  if (occ.has(ck(sr - dr, sc - dc))) return false;
  if (occ.has(ck(er + dr, ec + dc))) return false;
  let crosses = 0;
  for (let i = 0; i < word.length; i++) {
    const r = sr + dr * i;
    const c = sc + dc * i;
    const existing = occ.get(ck(r, c));
    if (existing !== undefined) {
      if (existing !== word[i]) return false;
      crosses++;
    } else {
      // Perpendicular neighbours must be empty (no parallel adjacency)
      const a = dir === 'H' ? ck(r - 1, c) : ck(r, c - 1);
      const b = dir === 'H' ? ck(r + 1, c) : ck(r, c + 1);
      if (occ.has(a) || occ.has(b)) return false;
    }
  }
  if (occ.size > 0 && crosses === 0) return false;
  return true;
}

function buildCrossword(
  pairs: { english: string; display: string; normal: string }[],
): PlacedWord[] {
  // Longest words first gives more intersection opportunities
  const sorted = [...pairs]
    .filter(pair => pair.normal.length >= 3 && pair.normal.length <= GRID_SIZE)
    .sort((a, b) => b.normal.length - a.normal.length);
  if (sorted.length === 0) return [];
  const occ    = new Map<string, string>();
  const placed: PlacedWord[] = [];

  // Place first word horizontally at centre
  const first = sorted[0];
  const sr0   = Math.floor(GRID_SIZE / 2);
  const sc0   = Math.floor((GRID_SIZE - first.normal.length) / 2);
  const p0: PlacedWord = {
    id: 0, english: first.english, display: first.display, normal: first.normal,
    startRow: sr0, startCol: sc0, dir: 'H', clueNum: 0,
  };
  placed.push(p0);
  for (let i = 0; i < first.normal.length; i++) occ.set(ck(sr0, sc0 + i), first.normal[i]);

  for (let wi = 1; wi < sorted.length; wi++) {
    const entry  = sorted[wi];
    let best: { sr: number; sc: number; dir: 'H'|'V'; score: number } | null = null;

    for (const pw of placed) {
      const newDir: 'H'|'V' = pw.dir === 'H' ? 'V' : 'H';
      const pdr = pw.dir === 'V' ? 1 : 0;
      const pdc = pw.dir === 'H' ? 1 : 0;

      for (let pi = 0; pi < pw.normal.length; pi++) {
        for (let ni = 0; ni < entry.normal.length; ni++) {
          if (pw.normal[pi] !== entry.normal[ni]) continue;
          const crossR = pw.startRow + pdr * pi;
          const crossC = pw.startCol + pdc * pi;
          const ndr    = newDir === 'V' ? 1 : 0;
          const ndc    = newDir === 'H' ? 1 : 0;
          const nsr    = crossR - ndr * ni;
          const nsc    = crossC - ndc * ni;
          if (!canPlace(occ, entry.normal, nsr, nsc, newDir)) continue;
          // Score: more crossings + closer to centre = better
          let score = 0;
          for (let k = 0; k < entry.normal.length; k++) {
            if (occ.has(ck(nsr + ndr * k, nsc + ndc * k))) score += 4;
          }
          const midR = nsr + ndr * (entry.normal.length / 2);
          const midC = nsc + ndc * (entry.normal.length / 2);
          score -= Math.abs(midR - GRID_SIZE / 2) + Math.abs(midC - GRID_SIZE / 2);
          if (!best || score > best.score) best = { sr: nsr, sc: nsc, dir: newDir, score };
        }
      }
    }

    if (best) {
      const pw: PlacedWord = {
        id: placed.length, english: entry.english, display: entry.display,
        normal: entry.normal, startRow: best.sr, startCol: best.sc,
        dir: best.dir, clueNum: 0,
      };
      placed.push(pw);
      const dr = best.dir === 'V' ? 1 : 0;
      const dc = best.dir === 'H' ? 1 : 0;
      for (let i = 0; i < entry.normal.length; i++) occ.set(ck(best.sr + dr * i, best.sc + dc * i), entry.normal[i]);
    }
  }

  // Assign clue numbers in reading order (top → bottom, left → right)
  const order = [...placed].sort((a, b) =>
    a.startRow !== b.startRow ? a.startRow - b.startRow : a.startCol - b.startCol,
  );
  order.forEach((pw, i) => { pw.clueNum = i + 1; });
  return placed;
}

// ── QWERTY keyboard ───────────────────────────────────────────────────────────
const QWERTY = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M','⌫'],
];
const ARMENIAN_KEYBOARD = [
  ['Ք','Օ','Ե','Ռ','Տ','Ը','Ւ','Ի','Ո','Պ'],
  ['Ա','Ս','Դ','Ֆ','Գ','Հ','Ճ','Կ','Լ','Բ'],
  ['Զ','Է','Թ','Ժ','Ձ','Ղ','Խ','Ծ','Յ','Մ'],
  ['Ն','Շ','Չ','Ջ','Վ','Ր','Ց','Փ','⌫'],
];
const GREEK_KEYBOARD = [
  [';','ς','ε','ρ','τ','υ','θ','ι','ο','π'],
  ['α','σ','δ','φ','γ','η','ξ','κ','λ'],
  ['ζ','χ','ψ','ω','β','ν','μ','⌫'],
];

// ── Main component ────────────────────────────────────────────────────────────
export default function CrosswordScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const {
    categoryId,
    levelIndex: liStr,
    generalStage: generalStageParam,
    allWords: allWordsParam,
    randomBatch: randomBatchParam,
    batchIndices,
    stageIndex: stageIndexParam,
    returnTo,
  } = useLocalSearchParams<{
    categoryId?: string; levelIndex?: string; generalStage?: string;
    allWords?: string; randomBatch?: string; batchIndices?: string;
    stageIndex?: string; returnTo?: string;
  }>();
  const levelIndex = parseInt(liStr ?? '0', 10);
  const stageIndex = Number.parseInt(stageIndexParam ?? '', 10);
  const isGeneralStage = generalStageParam === '1';
  const isRandomBatch = allWordsParam === '1' && randomBatchParam === '1';
  const isGeneralSession = isGeneralStage || isRandomBatch;
  const insets     = useSafeAreaInsets();
  const {
    activeLanguage,
    completeLevel,
    getPracticePairs,
    recordWordAnswer,
  } = useGame();
  const { report: reportClassic } = useClassicGameResult('crossword');
  const { playCorrect, speakCorrectAnswer } = useSound();
  const colors     = useColors();
  const reduceMotion = useReduceMotion();
  const topPad     = Platform.OS === 'web' ? 67 : insets.top;

  const category = CATEGORIES.find(c => c.id === categoryId) ??
    (isGeneralSession
      ? ({ name: 'General vocabulary', accentColor: colors.primary, bgColor: colors.accent } as any)
      : undefined);
  const [pairs]  = useState(() => isGeneralSession
    ? resolveGeneralVocabularySession({
        generalStage: generalStageParam,
        allWords: allWordsParam,
        randomBatch: randomBatchParam,
        batchIndices,
        levelIndex: liStr,
        stageIndex: stageIndexParam,
      }, activeLanguage)?.pairs ?? []
    : getPracticePairs(categoryId ?? '', levelIndex));
  const reviewWordCount = pairs.filter(pair => pair.isReview).length;
  const langMeta = LANGUAGE_META[activeLanguage];

  // Build the crossword layout once on mount
  const placedWords = useMemo(() => buildCrossword(
    pairs.map(p => ({
      english: p.english,
      display: p.translations[activeLanguage],
      normal:  normalizeCrosswordWord(p.translations[activeLanguage]),
    }))
  ), [pairs, activeLanguage]);

  // Bounding box of placed words (for cropped display)
  const bounds = useMemo(() => {
    let r0 = 99, r1 = 0, c0 = 99, c1 = 0;
    for (const pw of placedWords) {
      const dr = pw.dir === 'V' ? 1 : 0;
      const dc = pw.dir === 'H' ? 1 : 0;
      r0 = Math.min(r0, pw.startRow);
      r1 = Math.max(r1, pw.startRow + dr * (pw.normal.length - 1));
      c0 = Math.min(c0, pw.startCol);
      c1 = Math.max(c1, pw.startCol + dc * (pw.normal.length - 1));
    }
    return { r0: r0 - 1, r1: r1 + 1, c0: c0 - 1, c1: c1 + 1 };
  }, [placedWords]);

  const numRows = bounds.r1 - bounds.r0 + 1;
  const numCols = bounds.c1 - bounds.c0 + 1;
  const gridViewportWidth = Math.max(0, screenWidth - 24);
  const CELL = Math.max(30, Math.min(36, Math.floor(gridViewportWidth / Math.max(1, numCols))));
  const gridWidth = numCols * CELL;
  const gridHeight = numRows * CELL;

  // Correct-answer cell map
  const correctGrid = useMemo(() => {
    const g = new Map<string, { letter: string; wordIds: number[]; clueNum?: number }>();
    for (const pw of placedWords) {
      const dr = pw.dir === 'V' ? 1 : 0;
      const dc = pw.dir === 'H' ? 1 : 0;
      for (let i = 0; i < pw.normal.length; i++) {
        const k = ck(pw.startRow + dr * i, pw.startCol + dc * i);
        const e = g.get(k);
        if (e) {
          e.wordIds.push(pw.id);
        } else {
          g.set(k, {
            letter:  pw.normal[i],
            wordIds: [pw.id],
            clueNum: i === 0 ? pw.clueNum : undefined,
          });
        }
      }
    }
    return g;
  }, [placedWords]);

  // ── State ──
  usePreloadSpeech(placedWords.map(word => word.display), activeLanguage);
  const [userGrid,      setUserGrid]      = useState<Map<string, string>>(new Map());
  const [selectedId,    setSelectedId]    = useState<number>(placedWords[0]?.id ?? 0);
  const [cursorIdx,     setCursorIdx]     = useState(0);
  const [solvedWords,   setSolvedWords]   = useState<Set<number>>(new Set());
  const [hintedIndicesByWord, setHintedIndicesByWord] = useState<Map<number, Set<number>>>(() => new Map());
  const [mistakes,      setMistakes]      = useState(0);
  const [finished,      setFinished]      = useState(false);
  const [isGridDragging, setIsGridDragging] = useState(false);
  const [dragPreviewId, setDragPreviewId] = useState<number | null>(null);
  const [dragTouchedCell, setDragTouchedCell] = useState<string | null>(null);
  const [measuredGridWidth, setMeasuredGridWidth] = useState(gridViewportWidth);
  const [gridTopY, setGridTopY] = useState(0);
  const wrongWordsInSession = useRef(new Set<number>());
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const gridGestureCount = useRef(new Set<string>());
  const gridTouch = useRef<{
    startCell: string | null;
    startX: number;
    startY: number;
    direction: 'H' | 'V' | null;
    lastCell: string | null;
  }>({ startCell: null, startX: 0, startY: 0, direction: null, lastCell: null });
  const gridScale = useSharedValue(1);
  const gridTranslateX = useSharedValue(Math.max(0, (gridViewportWidth - gridWidth) / 2));
  const gridTranslateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const gridTransformStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: gridTranslateX.value },
      { translateY: gridTranslateY.value },
      { scale: gridScale.value },
    ],
  }));

  useEffect(() => {
    gridScale.value = 1;
    gridTranslateX.value = Math.max(0, (measuredGridWidth - gridWidth) / 2);
    gridTranslateY.value = 0;
  }, [gridScale, gridTranslateX, gridTranslateY, measuredGridWidth, gridWidth, gridHeight]);

  const selectedWord = placedWords.find(pw => pw.id === selectedId);

  const wordCells = useCallback((pw: PlacedWord): string[] => {
    const dr = pw.dir === 'V' ? 1 : 0;
    const dc = pw.dir === 'H' ? 1 : 0;
    return pw.normal.split('').map((_, i) => ck(pw.startRow + dr * i, pw.startCol + dc * i));
  }, []);

  const checkWord = useCallback((pw: PlacedWord, ug: Map<string, string>) =>
    wordCells(pw).every((k, i) => ug.get(k) === pw.normal[i]),
  [wordCells]);

  const selectedWordCells = selectedWord ? wordCells(selectedWord) : [];
  const selectedHintIndices = hintedIndicesByWord.get(selectedId) ?? new Set<number>();
  const nextHintIndex = selectedWord
    ? getNextCrosswordHintIndex(
        selectedWord.normal,
        selectedHintIndices,
        selectedWordCells.map(cellKey => userGrid.get(cellKey)),
      )
    : null;
  const hintText = selectedWord
    ? [...selectedHintIndices]
        .sort((a, b) => a - b)
        .map(index => `Letter ${index + 1} is ${selectedWord.normal[index]}`)
        .join(' · ')
    : '';

  // Tap a grid cell
  const handleCellTap = useCallback((r: number, c: number) => {
    const cell = correctGrid.get(ck(r, c));
    if (!cell) return;
    if (cell.wordIds.includes(selectedId) && cell.wordIds.length > 1) {
      // Toggle between crossing words
      const other = cell.wordIds.find(id => id !== selectedId)!;
      setSelectedId(other);
      const pw = placedWords.find(p => p.id === other)!;
      setCursorIdx(wordCells(pw).indexOf(ck(r, c)));
    } else {
      const id = cell.wordIds[0];
      setSelectedId(id);
      const pw = placedWords.find(p => p.id === id)!;
      setCursorIdx(wordCells(pw).indexOf(ck(r, c)));
    }
  }, [selectedId, correctGrid, placedWords, wordCells]);

  const gridCellAt = useCallback((x: number, y: number) => {
    const scale = Math.max(1, gridScale.value);
    const localX = (x - gridTranslateX.value - (gridWidth / 2) * (1 - scale)) / scale;
    const localY = (y - gridTranslateY.value - (gridHeight / 2) * (1 - scale)) / scale;
    if (localX < 0 || localY < 0 || localX >= gridWidth || localY >= gridHeight) return null;
    const c = bounds.c0 + Math.floor(localX / CELL);
    const r = bounds.r0 + Math.floor(localY / CELL);
    return correctGrid.has(ck(r, c)) ? ck(r, c) : null;
  }, [gridScale, gridTranslateX, gridTranslateY, gridWidth, gridHeight, bounds.c0, bounds.r0, CELL, correctGrid]);

  const beginGridGesture = useCallback((id: string) => {
    gridGestureCount.current.add(id);
    setIsGridDragging(true);
  }, []);

  const finishGridGesture = useCallback((id: string) => {
    gridGestureCount.current.delete(id);
    if (gridGestureCount.current.size === 0) setIsGridDragging(false);
  }, []);

  const beginGridTouch = useCallback((x: number, y: number) => {
    const startCell = gridCellAt(x, y);
    gridTouch.current = { startCell, startX: x, startY: y, direction: null, lastCell: startCell };
    setDragTouchedCell(startCell);
    setDragPreviewId(null);
  }, [gridCellAt]);

  const updateGridTouch = useCallback((x: number, y: number) => {
    const touch = gridTouch.current;
    if (!touch.startCell) return;
    const currentCell = gridCellAt(x, y);
    if (currentCell !== touch.lastCell) {
      if (currentCell) void Haptics.selectionAsync();
      touch.lastCell = currentCell;
      setDragTouchedCell(currentCell);
    }

    if (!touch.direction) {
      const dx = x - touch.startX;
      const dy = y - touch.startY;
      if (Math.hypot(dx, dy) >= 8) {
        touch.direction = Math.abs(dx) >= Math.abs(dy) ? 'H' : 'V';
      }
    }

    if (touch.direction) {
      const directionalId = correctGrid.get(touch.startCell)?.wordIds.find(id =>
        placedWords.find(word => word.id === id)?.dir === touch.direction,
      );
      const fallbackId = correctGrid.get(touch.startCell)?.wordIds.find(id => id === selectedId)
        ?? correctGrid.get(touch.startCell)?.wordIds[0]
        ?? null;
      setDragPreviewId(directionalId ?? fallbackId);
    }
  }, [gridCellAt, correctGrid, placedWords, selectedId]);

  const endGridTouch = useCallback((x: number, y: number) => {
    const { startCell, direction } = gridTouch.current;
    if (!startCell) return;
    const [startRow, startCol] = startCell.split(',').map(Number);
    if (!direction) {
      handleCellTap(startRow, startCol);
      return;
    }

    const cell = correctGrid.get(startCell);
    const candidateId = cell?.wordIds.find(id =>
      placedWords.find(word => word.id === id)?.dir === direction,
    );
    const candidate = placedWords.find(word => word.id === candidateId);
    const endCell = gridCellAt(x, y);
    const followsWord = candidate
      && endCell
      && wordCells(candidate).includes(endCell);
    const fallbackId = cell?.wordIds.find(id => id === selectedId) ?? cell?.wordIds[0];
    const chosenId = followsWord ? candidateId : fallbackId;
    const chosenWord = placedWords.find(word => word.id === chosenId);
    if (!chosenWord) return;
    setSelectedId(chosenWord.id);
    const cells = wordCells(chosenWord);
    setCursorIdx(Math.max(0, cells.indexOf(startCell)));
  }, [handleCellTap, correctGrid, placedWords, gridCellAt, selectedId, wordCells]);

  const finishGridTouch = useCallback(() => {
    gridTouch.current = { startCell: null, startX: 0, startY: 0, direction: null, lastCell: null };
    setDragPreviewId(null);
    setDragTouchedCell(null);
  }, []);

  const handleGridLayout = useCallback((event: any) => {
    const { width, y } = event.nativeEvent.layout;
    setMeasuredGridWidth((current: number) => Math.abs(current - width) < 1 ? current : width);
    setGridTopY(y);
  }, []);

  const scrollGridIntoView = useCallback(() => {
    scrollRef.current?.scrollTo({ y: Math.max(0, gridTopY - 8), animated: !reduceMotion });
  }, [gridTopY, reduceMotion]);

  const clampGridOffset = useCallback((
    offset: number,
    viewportSize: number,
    contentSize: number,
    scale: number,
  ) => {
    const center = contentSize / 2;
    if (contentSize * scale <= viewportSize) return (viewportSize - contentSize) / 2;
    const min = viewportSize - center * (1 + scale);
    const max = center * (scale - 1);
    return Math.max(min, Math.min(max, offset));
  }, []);

  const gridPanGesture = useMemo(() => Gesture.Pan()
    .minDistance(0)
    .maxPointers(1)
    .onBegin(event => {
      runOnJS(beginGridGesture)('select');
      runOnJS(beginGridTouch)(event.x, event.y);
    })
    .onUpdate(event => runOnJS(updateGridTouch)(event.x, event.y))
    .onEnd(event => runOnJS(endGridTouch)(event.x, event.y))
    .onFinalize(() => {
      runOnJS(finishGridTouch)();
      runOnJS(finishGridGesture)('select');
    }), [
    beginGridGesture, beginGridTouch, updateGridTouch, endGridTouch, finishGridTouch, finishGridGesture,
  ]);

  const canZoomGrid = gridWidth > measuredGridWidth + 1;
  const gridPinchGesture = useMemo(() => Gesture.Pinch()
    .enabled(canZoomGrid)
    .onBegin(() => {
      savedScale.value = gridScale.value;
      savedTranslateX.value = gridTranslateX.value;
      savedTranslateY.value = gridTranslateY.value;
      runOnJS(beginGridGesture)('pinch');
    })
    .onUpdate(event => {
      const nextScale = Math.max(1, Math.min(3, savedScale.value * event.scale));
      gridScale.value = nextScale;
      gridTranslateX.value = clampGridOffset(
        savedTranslateX.value, measuredGridWidth, gridWidth, nextScale,
      );
      gridTranslateY.value = clampGridOffset(
        savedTranslateY.value, gridHeight, gridHeight, nextScale,
      );
    })
    .onFinalize(() => runOnJS(finishGridGesture)('pinch')), [
    canZoomGrid, savedScale, savedTranslateX, savedTranslateY, gridScale, gridTranslateX,
    gridTranslateY, clampGridOffset, measuredGridWidth, gridWidth, gridHeight,
    beginGridGesture, finishGridGesture,
  ]);

  const gridTwoFingerPanGesture = useMemo(() => Gesture.Pan()
    .enabled(canZoomGrid)
    .minPointers(2)
    .maxPointers(2)
    .onBegin(() => {
      savedTranslateX.value = gridTranslateX.value;
      savedTranslateY.value = gridTranslateY.value;
      runOnJS(beginGridGesture)('pan');
    })
    .onUpdate(event => {
      gridTranslateX.value = clampGridOffset(
        savedTranslateX.value + event.translationX, measuredGridWidth, gridWidth, gridScale.value,
      );
      gridTranslateY.value = clampGridOffset(
        savedTranslateY.value + event.translationY, gridHeight, gridHeight, gridScale.value,
      );
    })
    .onFinalize(() => runOnJS(finishGridGesture)('pan')), [
    canZoomGrid, savedTranslateX, savedTranslateY, gridTranslateX, gridTranslateY,
    gridScale, clampGridOffset, measuredGridWidth, gridWidth, gridHeight,
    beginGridGesture, finishGridGesture,
  ]);

  const gridGesture = useMemo(
    () => Gesture.Simultaneous(gridPanGesture, gridPinchGesture, gridTwoFingerPanGesture),
    [gridPanGesture, gridPinchGesture, gridTwoFingerPanGesture],
  );

  const selectClue = useCallback((word: PlacedWord) => {
    setSelectedId(word.id);
    setCursorIdx(0);
    scrollGridIntoView();
  }, [scrollGridIntoView]);

  // Tap a keyboard key
  const handleKey = useCallback((key: string) => {
    if (!selectedWord || finished) return;
    const cells = wordCells(selectedWord);

    if (key === '⌫') {
      const backIdx = Math.max(0, cursorIdx - (userGrid.has(cells[cursorIdx]) ? 0 : 1));
      const target  = cells[backIdx];
      if (target && userGrid.has(target)) {
        const next = new Map(userGrid);
        next.delete(target);
        setUserGrid(next);
        setCursorIdx(backIdx);
      }
      return;
    }

    if (cursorIdx >= cells.length) return;
    const cellKey = cells[cursorIdx];
    const typed   = key.toUpperCase();
    const correct = selectedWord.normal[cursorIdx];

    const nextGrid = new Map(userGrid);
    nextGrid.set(cellKey, typed);
    setUserGrid(nextGrid);

    if (typed !== correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMistakes(m => m + 1);
      if (!wrongWordsInSession.current.has(selectedWord.id)) {
        wrongWordsInSession.current.add(selectedWord.id);
        recordWordAnswer(
          selectedWord.english,
          false,
          isGeneralSession ? undefined : categoryId,
          isGeneralSession ? undefined : levelIndex,
          activeLanguage,
        );
      }
    } else {
      Haptics.selectionAsync();
    }

    const nextIdx = cursorIdx + 1;
    setCursorIdx(nextIdx >= cells.length ? cells.length : nextIdx);

    // Check if this word is now correctly filled
    if (nextIdx >= cells.length) {
      const newGrid = nextGrid;
      if (checkWord(selectedWord, newGrid)) {
        recordWordAnswer(
          selectedWord.english,
          true,
          isGeneralSession ? undefined : categoryId,
          isGeneralSession ? undefined : levelIndex,
          activeLanguage,
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playCorrect();
        speakCorrectAnswer(selectedWord.display, activeLanguage);
        const newSolved = new Set(solvedWords);
        newSolved.add(selectedId);
        setSolvedWords(newSolved);

        if (newSolved.size >= placedWords.length) {
          // All solved!
          setTimeout(() => {
            const earned = mistakes <= 0 ? 3 : mistakes <= 5 ? 2 : 1;
            if (isGeneralSession) {
              if (isGeneralStage) {
                void reportClassic(earned, completeGeneralVocabularyStage(
                  completeLevel,
                  levelIndex,
                  stageIndex,
                  earned,
                  activeLanguage,
                  'crossword',
                ));
              } else {
                reportClassic(earned);
              }
              router.replace(getGeneralVocabularyReturnPath(returnTo, levelIndex) as any);
              return;
            }
            reportClassic(earned, completeLevel(categoryId!, levelIndex, earned, activeLanguage));
            router.replace({
              pathname: '/results',
              params: {
                categoryId, levelIndex: String(levelIndex),
                earned: String(earned), language: activeLanguage,
              },
            });
          }, 700);
          setFinished(true);
          return;
        }

        // Jump to next unsolved word
        const next = placedWords.find(pw => !newSolved.has(pw.id));
        if (next) {
          setSelectedId(next.id);
          const nc = wordCells(next);
          const firstEmpty = nc.findIndex(k => !newGrid.has(k));
          setCursorIdx(firstEmpty >= 0 ? firstEmpty : 0);
        }
      }
    }
  }, [selectedWord, cursorIdx, userGrid, solvedWords, selectedId, finished, mistakes,
      placedWords, wordCells, checkWord, completeLevel, recordWordAnswer,
      playCorrect, speakCorrectAnswer,
      categoryId, levelIndex, activeLanguage, isGeneralSession, isGeneralStage, stageIndex, returnTo]);

  if (!category) return null;
  const hasGreekLetters = placedWords.some(word => /[\u0370-\u03FF]/.test(word.display));
  const keyboardRows = activeLanguage === 'armenian'
    ? ARMENIAN_KEYBOARD
    : (activeLanguage as string) === 'greek' || hasGreekLetters
      ? GREEK_KEYBOARD
      : QWERTY;

  // Clue lists
  const acrossClues = [...placedWords].filter(pw => pw.dir === 'H').sort((a, b) => a.clueNum - b.clueNum);
  const downClues   = [...placedWords].filter(pw => pw.dir === 'V').sort((a, b) => a.clueNum - b.clueNum);

  // Selected word cells set for fast lookup
  const previewWord = placedWords.find(word => word.id === dragPreviewId);
  const shownWord = isGridDragging && previewWord ? previewWord : selectedWord;
  const selCells = new Set(shownWord ? wordCells(shownWord) : []);
  const selCellsArr = shownWord ? wordCells(shownWord) : [];
  const cursorCell = isGridDragging ? null : selCellsArr[cursorIdx];
  const webGridInteractionStyle = Platform.OS === 'web'
    ? ({ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' } as any)
    : undefined;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: category.accentColor }]}>
        <TouchableOpacity onPress={() => goBackOr(isGeneralSession
          ? getGeneralVocabularyReturnPath(returnTo, levelIndex) as any
          : `/levels?categoryId=${categoryId}` as any)} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>📝  Crossword</Text>
          <Text style={styles.headerSub}>
            {isGeneralStage
              ? `Level ${levelIndex + 1} · Stage ${stageIndex + 1} · ${pairs.length} words · ${langMeta.label}`
              : isRandomBatch
                ? `${pairs.length} random words · every category · ${langMeta.label}`
                : `${category.name} · Level ${levelIndex + 1} · ${langMeta.flag} ${langMeta.label}`}
            {reviewWordCount > 0 ? ` · ${reviewWordCount} review` : ''}
          </Text>
        </View>
        <AutoSpeakToggle />
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{solvedWords.size} / {placedWords.length}</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        scrollEnabled={!isGridDragging}
      >
        {/* ── Crossword grid ── */}
        <View style={styles.gridWrap}>
          <GestureDetector gesture={gridGesture}>
            <View
              onLayout={handleGridLayout}
              style={[
                styles.gridViewport,
                webGridInteractionStyle,
                { width: gridViewportWidth, height: gridHeight },
              ]}
              accessibilityLabel="Crossword grid. Tap a square to choose a word, or drag across or down to select it."
            >
              <Animated.View style={[{ width: gridWidth, height: gridHeight }, gridTransformStyle]}>
                {Array.from({ length: numRows }, (_, ri) => {
                  const r = bounds.r0 + ri;
                  return (
                    <View key={r} style={styles.gridRow}>
                      {Array.from({ length: numCols }, (_, ci) => {
                        const c = bounds.c0 + ci;
                        const k = ck(r, c);
                        const cell = correctGrid.get(k);
                        const typed = userGrid.get(k);
                        const isSelected = selCells.has(k);
                        const isCursor = k === cursorCell;
                        const isDragTouched = isGridDragging && k === dragTouchedCell;
                        const isSolvedCell = cell?.wordIds.some(id => solvedWords.has(id));

                        if (!cell) {
                          return <View key={c} style={[styles.cell, { width: CELL, height: CELL, backgroundColor: colors.muted, borderColor: colors.border }]} />;
                        }

                        let bgColor = colors.card;
                        let borderColor = colors.border;
                        let textColor = colors.foreground;

                        if (isSelected) {
                          bgColor = colors.accent;
                          borderColor = category.accentColor;
                        }
                        if (isDragTouched) {
                          bgColor = colors.cardSelectedBg;
                          borderColor = colors.cardSelectedBorder;
                        }
                        if (isCursor) {
                          bgColor = category.accentColor;
                          borderColor = category.accentColor;
                          textColor = colors.primaryForeground;
                        }

                        if (typed && !isCursor) {
                          const isRight = typed === cell.letter;
                          if (isSolvedCell || isRight) {
                            bgColor = colors.cardMatchedBg;
                            borderColor = colors.cardMatchedBorder;
                            textColor = colors.successForeground;
                          } else {
                            bgColor = colors.cardErrorBg;
                            borderColor = colors.cardErrorBorder;
                            textColor = colors.destructive;
                          }
                        }

                        return (
                          <View
                            key={c}
                            accessible
                            accessibilityRole="button"
                            accessibilityLabel={`Row ${r - bounds.r0 + 1}, column ${c - bounds.c0 + 1}${typed ? `, ${typed}` : ', empty'}`}
                            onAccessibilityTap={() => handleCellTap(r, c)}
                            style={[styles.cell, { width: CELL, height: CELL, backgroundColor: bgColor, borderColor }]}
                          >
                            {cell.clueNum !== undefined && (
                              <Text style={[styles.clueNumInCell, { fontSize: Math.max(7, CELL * 0.25), color: colors.mutedForeground }]}>
                                {cell.clueNum}
                              </Text>
                            )}
                            <Text style={[styles.cellLetter, { fontSize: Math.max(10, CELL * 0.45), color: textColor }]}>
                              {typed ?? ''}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </Animated.View>
            </View>
          </GestureDetector>
        </View>

        {/* ── Current clue ── */}
        {shownWord && (
          <View style={[styles.currentClue, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.currentClueTopRow}>
              <Text style={[styles.currentClueNum, { color: category.accentColor }]}>
                {shownWord.clueNum} {shownWord.dir === 'H' ? 'Across' : 'Down'}
              </Text>
              <Text style={[styles.currentClueText, { color: colors.foreground }]}>
                {shownWord.english}
              </Text>
              <Text style={[styles.currentClueLetters, { color: colors.mutedForeground }]}>
                {shownWord.normal.length} letters
              </Text>
            </View>
            {!isGridDragging && selectedWord && (
              <View style={styles.currentClueHintRow}>
              <TouchableOpacity
                onPress={() => {
                  if (nextHintIndex === null) return;
                  Haptics.selectionAsync();
                  setHintedIndicesByWord(previous => {
                    const next = new Map(previous);
                    const wordHints = new Set(next.get(selectedWord.id) ?? []);
                    wordHints.add(nextHintIndex);
                    next.set(selectedWord.id, wordHints);
                    return next;
                  });
                }}
                disabled={nextHintIndex === null}
                accessibilityRole="button"
                accessibilityLabel={nextHintIndex === null
                  ? 'No more hints available; one letter remains for you to solve'
                  : 'Get a letter hint for this word'}
                testID="crossword-get-hint"
                activeOpacity={0.75}
                style={[
                  styles.hintButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: category.accentColor + '55',
                    opacity: nextHintIndex === null ? 0.58 : 1,
                  },
                ]}
              >
                <Ionicons name="bulb-outline" size={16} color={category.accentColor} />
                <Text style={[styles.hintButtonText, { color: category.accentColor }]}>
                  {nextHintIndex === null ? 'One letter left' : 'Get a hint'}
                </Text>
              </TouchableOpacity>
              <Text
                testID="crossword-hint-text"
                accessibilityLiveRegion="polite"
                style={[styles.hintMessage, { color: colors.mutedForeground }]}
              >
                {hintText
                  ? `${hintText}${nextHintIndex === null ? ' · One letter stays for you to solve.' : ''}`
                  : 'Hints reveal a letter without filling the grid.'}
              </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Clue list ── */}
        <View style={styles.clueSection}>
          {acrossClues.length > 0 && (
            <View style={styles.clueGroup}>
              <Text style={[styles.clueGroupTitle, { color: colors.mutedForeground }]}>ACROSS</Text>
              {acrossClues.map(pw => (
                <TouchableOpacity key={pw.id} onPress={() => selectClue(pw)}
                  accessibilityRole="button"
                  accessibilityLabel={`Across ${pw.clueNum}: ${pw.english}`}
                  style={[styles.clueRow, {
                    backgroundColor: pw.id === selectedId ? colors.accent : 'transparent',
                    borderColor: pw.id === selectedId ? colors.primary : 'transparent',
                  }]}>
                  <Text style={[styles.clueRowNum, { color: category.accentColor }]}>{pw.clueNum}</Text>
                  <Text style={[styles.clueRowText, {
                    color: solvedWords.has(pw.id) ? colors.success : colors.foreground,
                    textDecorationLine: solvedWords.has(pw.id) ? 'line-through' : 'none',
                  }]}>
                    {pw.english}
                  </Text>
                  {solvedWords.has(pw.id) && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {downClues.length > 0 && (
            <View style={styles.clueGroup}>
              <Text style={[styles.clueGroupTitle, { color: colors.mutedForeground }]}>DOWN</Text>
              {downClues.map(pw => (
                <TouchableOpacity key={pw.id} onPress={() => selectClue(pw)}
                  accessibilityRole="button"
                  accessibilityLabel={`Down ${pw.clueNum}: ${pw.english}`}
                  style={[styles.clueRow, {
                    backgroundColor: pw.id === selectedId ? colors.accent : 'transparent',
                    borderColor: pw.id === selectedId ? colors.primary : 'transparent',
                  }]}>
                  <Text style={[styles.clueRowNum, { color: category.accentColor }]}>{pw.clueNum}</Text>
                  <Text style={[styles.clueRowText, {
                    color: solvedWords.has(pw.id) ? colors.success : colors.foreground,
                    textDecorationLine: solvedWords.has(pw.id) ? 'line-through' : 'none',
                  }]}>
                    {pw.english}
                  </Text>
                  {solvedWords.has(pw.id) && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pinned on-screen keyboard */}
      <View style={[styles.keyboard, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 10 : 8), backgroundColor: colors.background }]}>
        {keyboardRows.map((row, ri) => (
          <View key={ri} style={styles.kbRow}>
            {row.map(k => (
              <TouchableOpacity
                key={k}
                onPress={() => handleKey(k)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={k === '⌫' ? 'Delete previous letter' : `Type ${k}`}
                style={[
                  styles.kbKey,
                  k === '⌫' && styles.kbDelete,
                  {
                    backgroundColor: k === '⌫' ? colors.destructive : colors.card,
                    borderColor: k === '⌫' ? colors.destructive : colors.border,
                  },
                ]}
              >
                <Text style={[styles.kbKeyTxt, { color: k === '⌫' ? colors.destructiveForeground : colors.foreground }]}>
                  {k === '⌫' ? <Ionicons name="backspace-outline" size={19} color={colors.destructiveForeground} /> : k}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14, gap: 10,
  },
  backCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerMid:   { flex: 1 },
  headerTitle: { fontFamily: fontFamilies.extraBold, fontSize: 18, color: '#fff' },
  headerSub:   { fontFamily: fontFamilies.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  progressBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  progressText: { fontFamily: fontFamilies.bold, fontSize: 13, color: '#fff' },

  // Grid
  gridWrap: { alignItems: 'center', paddingTop: 14, marginHorizontal: 12 },
  gridViewport: { alignItems: 'flex-start', overflow: 'hidden' },
  gridRow:  { flexDirection: 'row' },
  cell: {
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    position: 'relative', borderRadius: 4,
  },
  clueNumInCell: {
    position: 'absolute', top: 1, left: 2,
    fontFamily: fontFamilies.bold, lineHeight: 10,
  },
  cellLetter: { fontFamily: fontFamilies.extraBold, lineHeight: undefined },

  // Current clue banner
  currentClue: {
    gap: 10,
    marginHorizontal: 12, marginTop: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 18, borderWidth: 1,
  },
  currentClueTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currentClueNum:     { fontFamily: fontFamilies.extraBold, fontSize: 13, minWidth: 60 },
  currentClueText:    { flex: 1, fontFamily: fontFamilies.bold, fontSize: 16 },
  currentClueLetters: { fontFamily: fontFamilies.semiBold, fontSize: 12 },
  currentClueHintRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  hintButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1, borderRadius: 12,
  },
  hintButtonText: { fontFamily: fontFamilies.extraBold, fontSize: 12 },
  hintMessage: { flex: 1, minWidth: 120, fontFamily: fontFamilies.semiBold, fontSize: 12 },

  // Keyboard
  keyboard: {
    paddingHorizontal: 8, paddingTop: 10, paddingBottom: 8, gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#00000010',
  },
  kbRow:    { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  kbKey: {
    minWidth: 28, height: 38, paddingHorizontal: 6,
    borderRadius: 11, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  kbDelete: { minWidth: 42 },
  kbKeyTxt: { fontFamily: fontFamilies.extraBold, fontSize: 14 },

  // Clue list
  clueSection: { marginHorizontal: 12, marginTop: 16, gap: 16 },
  clueGroup:   { gap: 4 },
  clueGroupTitle: {
    fontFamily: fontFamilies.extraBold, fontSize: 11, letterSpacing: 1, marginBottom: 4,
  },
  clueRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 14, borderWidth: 1,
  },
  clueRowNum:  { fontFamily: fontFamilies.extraBold, fontSize: 13, minWidth: 22, textAlign: 'right' },
  clueRowText: { flex: 1, fontFamily: fontFamilies.semiBold, fontSize: 14 },
});
