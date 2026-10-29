import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import { GUIDED_LEVELS_PER_MILESTONE, GUIDED_MILESTONES, getGuidedLevel } from '@/data/guided-curriculum';
import type { Language } from '@/data/vocabulary';
import { GUIDED_CHEST_AFTER_LEVELS, GUIDED_CHEST_CATEGORY_ID } from './guided-path-rewards';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Milestone palettes retain the playful blue-led LinguaMatch identity. */
export interface PathTheme {
  name: string;
  main: string;
  lip: string;
  soft: string;
  softDark: string;
  deep: string;
  ink: string;
  decor: IconName;
  emoji: string;
}

export const PATH_THEMES: readonly Omit<PathTheme, 'emoji'>[] = [
  { name: 'Blue', main: '#2F6BEA', lip: '#1C4CB8', soft: '#E3EDFF', softDark: '#13264A', deep: '#0C1830', ink: '#1F57D6', decor: 'chatbubble-ellipses' },
  { name: 'Purple', main: '#8050E7', lip: '#6236D0', soft: '#EFE7FF', softDark: '#251845', deep: '#150E2B', ink: '#6D3FD4', decor: 'sparkles' },
  { name: 'Sky', main: '#0F719E', lip: '#095A7D', soft: '#DDF3FC', softDark: '#102C3B', deep: '#091B25', ink: '#095A7D', decor: 'leaf' },
  { name: 'Orange', main: '#BB5B0C', lip: '#944508', soft: '#FFEEDB', softDark: '#3A2511', deep: '#22150A', ink: '#A94D07', decor: 'sunny' },
  { name: 'Pink', main: '#CC2E76', lip: '#A31C5B', soft: '#FFE3EF', softDark: '#3D1528', deep: '#230C17', ink: '#B82467', decor: 'heart' },
  { name: 'Sunshine', main: '#95610C', lip: '#704706', soft: '#FFF1CC', softDark: '#382A12', deep: '#21190B', ink: '#704706', decor: 'flower' },
];

const TOPIC_DECOR: Record<string, IconName> = {
  conversations: 'chatbubbles', verbs: 'book', food: 'restaurant', family: 'people',
  home: 'home', numbers: 'calculator', time: 'time', calendar: 'calendar',
  shopping: 'bag-handle', clothing: 'shirt', school: 'school', business: 'briefcase',
  directions: 'map', travel: 'airplane', transport: 'train', health: 'medkit',
  nature: 'leaf', animals: 'paw', emotions: 'happy', church: 'library',
};

/** Small scene/stamp emoji per destination topic (explicitly requested). */
const TOPIC_EMOJI: Record<string, string> = {
  conversations: '💬', verbs: '📖', food: '🍝', family: '👪', home: '🏠', numbers: '🔢',
  time: '⏰', calendar: '📅', shopping: '🛍️', clothing: '👕', school: '🎒', business: '💼',
  directions: '🧭', travel: '✈️', transport: '🚆', health: '🩺', nature: '🌿', animals: '🐾',
  emotions: '😊', church: '⛪',
};

const MILESTONE_THEMES: PathTheme[] = GUIDED_MILESTONES.map((milestone, index) => {
  const palette = PATH_THEMES[index % PATH_THEMES.length];
  return { ...palette, decor: TOPIC_DECOR[milestone.categoryId] ?? palette.decor, emoji: TOPIC_EMOJI[milestone.categoryId] ?? '📍' };
});
export const themeFor = (milestoneIndex: number) =>
  MILESTONE_THEMES[((milestoneIndex % MILESTONE_THEMES.length) + MILESTONE_THEMES.length) % MILESTONE_THEMES.length];

/** Later milestones appear above the start of the trail. */
export function buildAscentFloorOrder(floorCount = GUIDED_MILESTONES.length): number[] {
  const count = Math.max(0, Math.floor(floorCount));
  return Array.from({ length: count }, (_, index) => count - index - 1);
}

/** Visible journey wording. Underlying milestone ids/titles stay intact. */
export const journeyLineTitle = (milestoneIndex: number) => {
  const m = GUIDED_MILESTONES[milestoneIndex];
  return m ? `Milestone ${milestoneIndex + 1} · ${m.title}` : 'Climb complete';
};

/** Per-station exercise focus. Purely presentational: mirrors the guided lesson mix. */
const LEVEL_FOCUS: { icon: IconName; label: string }[] = [
  { icon: 'star', label: 'New words' },
  { icon: 'chatbubbles', label: 'Phrases' },
  { icon: 'headset', label: 'Listening' },
  { icon: 'construct', label: 'Sentence building' },
  { icon: 'pencil', label: 'Typing recall' },
  { icon: 'book', label: 'Grammar patterns' },
  { icon: 'ear', label: 'Listen and recall' },
  { icon: 'shuffle', label: 'Mixed review' },
  { icon: 'flag', label: 'Checkpoint' },
];
export const levelFocus = (levelIndex: number) => LEVEL_FOCUS[levelIndex] ?? LEVEL_FOCUS[0];

export const CHEST_AFTER_LEVEL = GUIDED_CHEST_AFTER_LEVELS - 1;
export const CHEST_CATEGORY_ID = GUIDED_CHEST_CATEGORY_ID;

/** Fixed row heights keep FlatList getItemLayout exact across hundreds of rows. */
export const ROW_H = { divider: 148, level: 128, chest: 96, footer: 190 } as const;

/** Route lanes: stations 1–4 ride lane 0, a 45° shift happens at the Souvenir shop, 5–9 ride lane 1. */
export type Lane = 0 | 1;
export type PathItem =
  | { kind: 'divider'; key: string; milestoneIndex: number }
  | { kind: 'level'; key: string; milestoneIndex: number; levelIndex: number; globalIndex: number; lane: Lane }
  | { kind: 'chest'; key: string; milestoneIndex: number }
  | { kind: 'footer'; key: string };

/** Lane x-position for a given content width. Lanes swap sides every other line. */
export function laneX(milestoneIndex: number, lane: Lane, width: number) {
  const offset = Math.max(28, Math.min(40, width * 0.1));
  const leftFirst = milestoneIndex % 2 === 0;
  const isLeft = (lane === 0) === leftFirst;
  return width / 2 + (isLeft ? -offset : offset);
}

export function buildPathItems(): PathItem[] {
  const items: PathItem[] = [];
  GUIDED_MILESTONES.forEach((_, milestoneIndex) => {
    items.push({ kind: 'divider', key: `d-${milestoneIndex}`, milestoneIndex });
    for (let levelIndex = 0; levelIndex < GUIDED_LEVELS_PER_MILESTONE; levelIndex++) {
      items.push({
        kind: 'level',
        key: `l-${milestoneIndex}-${levelIndex}`,
        milestoneIndex,
        levelIndex,
        globalIndex: milestoneIndex * GUIDED_LEVELS_PER_MILESTONE + levelIndex,
        lane: levelIndex > CHEST_AFTER_LEVEL ? 1 : 0,
      });
      if (levelIndex === CHEST_AFTER_LEVEL) items.push({ kind: 'chest', key: `c-${milestoneIndex}`, milestoneIndex });
    }
  });
  items.push({ kind: 'footer', key: 'footer' });
  return items;
}

export const itemHeight = (item: PathItem) => ROW_H[item.kind];

export function buildOffsets(items: PathItem[]) {
  const offsets: number[] = [];
  let y = 0;
  for (const item of items) {
    offsets.push(y);
    y += itemHeight(item);
  }
  return { offsets, total: y };
}

export const MILESTONE_BLOCK_H = ROW_H.divider + GUIDED_LEVELS_PER_MILESTONE * ROW_H.level + ROW_H.chest;
export const ITEMS_PER_MILESTONE = 1 + GUIDED_LEVELS_PER_MILESTONE + 1;

export function itemIndexForLevel(globalIndex: number) {
  const milestoneIndex = Math.floor(globalIndex / GUIDED_LEVELS_PER_MILESTONE);
  const levelIndex = globalIndex % GUIDED_LEVELS_PER_MILESTONE;
  return milestoneIndex * ITEMS_PER_MILESTONE + 1 + levelIndex + (levelIndex > CHEST_AFTER_LEVEL ? 1 : 0);
}

export function milestoneAtOffset(y: number) {
  return Math.max(0, Math.min(GUIDED_MILESTONES.length - 1, Math.floor(y / MILESTONE_BLOCK_H)));
}

export const ENCOURAGEMENTS = [
  'Going up!',
  'One level at a time.',
  'Your words are taking shape.',
  'A little higher every day.',
  'Ready for the next milestone?',
  'Your brain is warming up.',
];

/** Cached station topic + exercise count per language (presentation only). */
const STATION_CACHE = new Map<string, { title: string; exercises: number | null }>();
export function stationInfo(language: Language, milestoneIndex: number, levelIndex: number) {
  const key = `${language}:${milestoneIndex}:${levelIndex}`;
  let hit = STATION_CACHE.get(key);
  if (!hit) {
    try {
      const level = getGuidedLevel(language, milestoneIndex, levelIndex);
      hit = { title: level.title, exercises: level.exercises.length };
    } catch {
      hit = { title: levelFocus(levelIndex).label, exercises: null };
    }
    STATION_CACHE.set(key, hit);
  }
  return hit;
}
