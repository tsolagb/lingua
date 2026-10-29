import React, { useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import {
  GENERAL_VOCABULARY_CATEGORY_ID,
  GENERAL_VOCABULARY_STAGE_SIZE,
  GENERAL_VOCABULARY_STAGES_PER_LEVEL,
  getGeneralVocabularyLevels,
} from '@/data/general-vocabulary';
import { goBackOr } from '@/lib/navigation';
import { GeneralVocabularyGameChooser } from '@/components/GeneralVocabularyGameChooser';
import {
  buildGeneralVocabularyGameHref,
  createRandomGeneralVocabularyBatch,
  getGeneralVocabularyStageGrade,
  getGeneralVocabularyStageProgress,
  type GeneralVocabularyGameMode,
} from '@/lib/general-vocabulary-session';

export default function GeneralVocabularyLevelsScreen() {
  const {
    levelIndex: levelParam,
    stageIndex: stageParam,
    randomLevel: randomParam,
    returnTo,
  } = useLocalSearchParams<{
    levelIndex?: string;
    stageIndex?: string;
    randomLevel?: string;
    returnTo?: string;
  }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeLanguage, progress, wordReviews } = useGame();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const levels = useMemo(() => getGeneralVocabularyLevels(activeLanguage), [activeLanguage]);
  const parsedLevelIndex = Number.parseInt(levelParam ?? '', 10);
  const selectedLevel = Number.isInteger(parsedLevelIndex) ? levels[parsedLevelIndex] : undefined;
  const parsedStageIndex = Number.parseInt(stageParam ?? '', 10);
  const selectedStage = selectedLevel && Number.isInteger(parsedStageIndex)
    ? selectedLevel.stages[parsedStageIndex]
    : undefined;
  const choosingRandom = randomParam === '1';
  const categoryProgress = progress[`${activeLanguage}::${GENERAL_VOCABULARY_CATEGORY_ID}`] ?? {};
  const selectedLevelProgress = selectedLevel
    ? categoryProgress[selectedLevel.index]
    : undefined;
  const completedStageCount = selectedLevel
    ? Object.values(selectedLevelProgress?.stages ?? {}).filter(stage => stage.completed).length
    : 0;
  const levelPercent = Math.round(
    (completedStageCount / GENERAL_VOCABULARY_STAGES_PER_LEVEL) * 100,
  );
  const chooseGame = (mode: GeneralVocabularyGameMode) => {
    if (selectedStage) {
      router.push(buildGeneralVocabularyGameHref(mode, {
        kind: 'stage',
        levelIndex: selectedLevel!.index,
        stageIndex: selectedStage.index,
      }) as any);
      return;
    }
    if (choosingRandom) {
      const batch = createRandomGeneralVocabularyBatch(activeLanguage);
      router.push(buildGeneralVocabularyGameHref(mode, {
        kind: 'random',
        batchIndices: batch.indices,
        returnTo: returnTo === 'random-practice' ? 'random-practice' : 'general-vocabulary-levels',
      }) as any);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity
          accessibilityRole="button"
            accessibilityLabel={selectedStage || choosingRandom
              ? 'Back to vocabulary levels'
              : selectedLevel ? 'Back to vocabulary levels' : 'Back to topics'}
            onPress={() => selectedStage
              ? goBackOr(`/general-vocabulary-levels?levelIndex=${selectedLevel!.index}` as any)
              : choosingRandom
                ? goBackOr(returnTo === 'random-practice'
                  ? '/random-practice' as any
                  : '/general-vocabulary-levels' as any)
                : selectedLevel
                  ? router.replace('/general-vocabulary-levels' as any)
                  : goBackOr('/categories')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>GENERAL VOCABULARY</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {selectedStage
              ? `Stage ${selectedStage.index + 1}`
              : choosingRandom
                ? 'Random Level'
                : selectedLevel ? `Level ${selectedLevel.index + 1}` : 'Build your word bank'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {selectedStage || choosingRandom ? (
          <GeneralVocabularyGameChooser
            wordCount={selectedStage?.pairs.length ?? GENERAL_VOCABULARY_STAGE_SIZE}
            onChoose={chooseGame}
          />
        ) : selectedLevel ? (
          <>
            <View style={[styles.levelSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.levelNumber, { backgroundColor: colors.primary }]}>
                <Text style={[styles.levelNumberText, { color: colors.primaryForeground }]}>
                  {selectedLevel.index + 1}
                </Text>
              </View>
              <View style={styles.summaryCopy}>
                <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
                  {selectedLevel.pairs.length} words · {GENERAL_VOCABULARY_STAGES_PER_LEVEL} stages
                </Text>
                <Text style={[styles.summarySubtitle, { color: colors.mutedForeground }]}>
                  Complete every stage to finish this level.
                </Text>
              </View>
              <Text style={[styles.percent, { color: colors.primary }]}>{levelPercent}%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${levelPercent}%` as any }]} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose a 25-word stage</Text>

            {selectedLevel.stages.map(stage => {
              const savedStageProgress = selectedLevelProgress?.stages?.[stage.index];
              const stageDone = savedStageProgress?.completed === true;
              const stageProgress = getGeneralVocabularyStageProgress(
                stage.pairs,
                activeLanguage,
                wordReviews,
                stageDone,
              );
              const grade = getGeneralVocabularyStageGrade(savedStageProgress?.gameScores);
              return (
                <TouchableOpacity
                  key={stage.index}
                  accessibilityRole="button"
                  accessibilityLabel={`Stage ${stage.index + 1}, ${stageProgress.percent}% complete, ${stageProgress.practicedWords} of ${stageProgress.total} words practiced${grade ? `, grade ${grade}` : ', grade available after three different game types'}. Practice now.`}
                  testID={`general-vocabulary-stage-${stage.index + 1}`}
                  onPress={() => router.push(
                    `/general-vocabulary-levels?levelIndex=${selectedLevel.index}&stageIndex=${stage.index}` as any,
                  )}
                  activeOpacity={0.84}
                  style={[
                    styles.stageCard,
                    { backgroundColor: colors.card, borderColor: stageDone ? colors.primary : colors.border },
                  ]}
                >
                  <View style={[
                    styles.stageIcon,
                    { backgroundColor: colors.accent },
                  ]}>
                    <Ionicons
                      name="layers-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.stageCopy}>
                    <View style={styles.stageHeading}>
                      <Text style={[styles.stageTitle, { color: colors.foreground }]}>
                        Stage {String(stage.index + 1).padStart(2, '0')}
                      </Text>
                      <Text style={[styles.stagePercent, { color: colors.primary }]}>
                        {stageProgress.percent}%
                      </Text>
                    </View>
                    <Text style={[styles.stageSubtitle, { color: colors.mutedForeground }]}>
                      {stageProgress.practicedWords} / {GENERAL_VOCABULARY_STAGE_SIZE} words practiced
                    </Text>
                    <View style={[styles.stageProgressTrack, { backgroundColor: colors.muted }]}>
                      <View
                        style={[
                          styles.stageProgressFill,
                          { backgroundColor: colors.primary, width: `${stageProgress.percent}%` as any },
                        ]}
                      />
                    </View>
                  </View>
                  {grade ? (
                    <View style={[styles.gradeBadge, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.gradeText, { color: colors.primaryForeground }]}>{grade}</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={19} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          <>
            <Text style={[styles.intro, { color: colors.mutedForeground }]}>
              Practice every unique word from all topics, with no repeats between levels.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Start a random 25-word level from every vocabulary category"
              testID="general-vocabulary-random-level"
              onPress={() => router.push(
                '/general-vocabulary-levels?randomLevel=1' as any,
              )}
              activeOpacity={0.86}
              style={[styles.randomCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            >
              <View style={[styles.randomIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Ionicons name="shuffle" size={23} color={colors.primaryForeground} />
              </View>
              <View style={styles.randomCopy}>
                <Text style={[styles.randomTitle, { color: colors.primaryForeground }]}>Random Level</Text>
                <Text style={[styles.randomSubtitle, { color: colors.primaryForeground }]}>
                  25 words · all categories · always open
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primaryForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Browse all vocabulary words"
              onPress={() => router.push('/random-practice' as any)}
              activeOpacity={0.8}
              style={styles.browseLink}
            >
              <Ionicons name="list-outline" size={18} color={colors.primary} />
              <Text style={[styles.browseText, { color: colors.primary }]}>Browse the full word list</Text>
              <Ionicons name="chevron-forward" size={17} color={colors.primary} />
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All levels are open</Text>
            {levels.map(level => {
              const levelProgress = categoryProgress[level.index];
              const completed = Object.values(levelProgress?.stages ?? {})
                .filter(stage => stage.completed).length;
              const percent = Math.round(
                (completed / GENERAL_VOCABULARY_STAGES_PER_LEVEL) * 100,
              );
              return (
                <TouchableOpacity
                  key={level.index}
                  accessibilityRole="button"
                  accessibilityLabel={`Level ${level.index + 1}, ${percent} percent complete, ${level.pairs.length} words`}
                  testID={`general-vocabulary-level-${level.index + 1}`}
                  onPress={() => router.push(
                    `/general-vocabulary-levels?levelIndex=${level.index}` as any,
                  )}
                  activeOpacity={0.84}
                  style={[styles.levelCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.levelNumberSmall, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.levelNumberSmallText, { color: colors.primary }]}>
                      {level.index + 1}
                    </Text>
                  </View>
                  <View style={styles.levelCardCopy}>
                    <Text style={[styles.levelCardTitle, { color: colors.foreground }]}>
                      Level {level.index + 1}
                    </Text>
                    <Text style={[styles.levelCardSubtitle, { color: colors.mutedForeground }]}>
                      {level.pairs.length} words · {completed} of {GENERAL_VOCABULARY_STAGES_PER_LEVEL} stages
                    </Text>
                    <View style={[styles.smallProgressTrack, { backgroundColor: colors.muted }]}>
                      <View style={[styles.smallProgressFill, { backgroundColor: colors.primary, width: `${percent}%` as any }]} />
                    </View>
                  </View>
                  <Text style={[styles.levelPercent, { color: colors.primary }]}>{percent}%</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 3 },
  headerTitle: { fontSize: 21, fontWeight: '800' },
  content: { paddingHorizontal: 18, paddingTop: 18, gap: 12 },
  intro: { fontSize: 14, lineHeight: 21, marginBottom: 3 },
  randomCard: {
    minHeight: 82,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  randomIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  randomCopy: { flex: 1, gap: 4 },
  randomTitle: { fontSize: 17, fontWeight: '800' },
  randomSubtitle: { fontSize: 12, fontWeight: '600', opacity: 0.88 },
  browseLink: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 8 },
  browseText: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 7, marginBottom: 2 },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 17,
    padding: 13,
  },
  levelNumberSmall: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  levelNumberSmallText: { fontSize: 16, fontWeight: '800' },
  levelCardCopy: { flex: 1, gap: 3 },
  levelCardTitle: { fontSize: 15, fontWeight: '800' },
  levelCardSubtitle: { fontSize: 12 },
  smallProgressTrack: { height: 5, borderRadius: 99, overflow: 'hidden', marginTop: 5 },
  smallProgressFill: { height: '100%', borderRadius: 99 },
  levelPercent: { minWidth: 38, textAlign: 'right', fontSize: 13, fontWeight: '800' },
  levelSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  levelNumber: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  levelNumberText: { fontSize: 18, fontWeight: '900' },
  summaryCopy: { flex: 1, gap: 4 },
  summaryTitle: { fontSize: 15, fontWeight: '800' },
  summarySubtitle: { fontSize: 12, lineHeight: 17 },
  percent: { fontSize: 17, fontWeight: '900' },
  progressTrack: { height: 7, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  stageCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  stageIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stageCopy: { flex: 1, gap: 4 },
  stageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stageTitle: { fontSize: 14, fontWeight: '800' },
  stageSubtitle: { fontSize: 12 },
  stagePercent: { fontSize: 12, fontWeight: '900' },
  stageProgressTrack: { height: 5, borderRadius: 99, overflow: 'hidden', marginTop: 2 },
  stageProgressFill: { height: '100%', borderRadius: 99 },
  gradeBadge: { minWidth: 38, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  gradeText: { fontSize: 13, fontWeight: '900' },
});
