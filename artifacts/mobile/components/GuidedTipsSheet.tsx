import React from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSound } from '@/hooks/useSound';
import { LANGUAGE_META, type Language } from '@/data/vocabulary';
import { journeyLineTitle } from '@/lib/guided-path-presentation';
import { getGuidedGrammarTable } from '@/data/guided-grammar-notes';
import { isSpeechAvailable } from '@/lib/speech-voice';
import {
  getGuidedGrammarRule,
  getGuidedMilestoneExamples,
  GUIDED_MILESTONES,
} from '@/data/guided-curriculum';
import { SpeakerButton } from '@/components/SpeakerButton';

interface GuidedTipsSheetProps {
  visible: boolean;
  onClose: () => void;
  milestoneIndex: number;
  language: Language;
}

export function GuidedTipsSheet({
  visible,
  onClose,
  milestoneIndex,
  language,
}: GuidedTipsSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { speak } = useSound();
  const milestone = GUIDED_MILESTONES[milestoneIndex];
  const examples = getGuidedMilestoneExamples(language, milestoneIndex);
  const rule = getGuidedGrammarRule(language, milestoneIndex);
  const title = journeyLineTitle(milestoneIndex);
  const table = milestone ? getGuidedGrammarTable(language, milestone.grammarUnitId) : [];
  const topPad = Platform.OS === 'web' ? 24 : insets.top;

  const highlighted = (sentence: string, highlight: string) => {
    const index = sentence.toLocaleLowerCase().indexOf(highlight.toLocaleLowerCase());
    if (index < 0) return sentence;
    return (
      <>
        {sentence.slice(0, index)}
        <Text style={{ color: colors.primary, fontWeight: '800' }}>
          {sentence.slice(index, index + highlight.length)}
        </Text>
        {sentence.slice(index + highlight.length)}
      </>
    );
  };

  if (!milestone) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={Platform.OS === 'web'}
      onRequestClose={onClose}
    >
      <View style={[styles.scrim, { backgroundColor: Platform.OS === 'web' ? 'rgba(0,0,0,0.32)' : 'transparent' }]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingTop: topPad + 14,
              paddingBottom: Math.max(insets.bottom, 16) + 14,
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.headingCopy}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>GUIDEBOOK · GRAMMAR NOTES</Text>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>{title}</Text>
              <Text style={[styles.focus, { color: colors.mutedForeground }]}>{milestone.grammarFocus}</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close grammar tips"
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={10}
            >
              <Ionicons name="close" size={23} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.ruleCard, { backgroundColor: colors.card, shadowColor: colors.glassShadow }]}>
              <View style={[styles.ruleIcon, { backgroundColor: colors.primary + '16' }]}>
                <Ionicons name="bulb-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.ruleCopy}>
                <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>THE RULE</Text>
                <Text style={[styles.ruleText, { color: colors.foreground }]}>{rule}</Text>
              </View>
            </View>

            {table.length > 0 ? (
              <View style={[styles.table, { backgroundColor: colors.card }]}>
                {table.map(row => (
                  <View key={row.label} style={styles.tableRow}>
                    <Text style={[styles.tableLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                    <Text style={[styles.tableForm, { color: colors.primary }]}>{row.form}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SEE IT IN A SENTENCE</Text>
            {examples.slice(0, table.length ? 2 : 3).map((example, index) => (
              <View key={`${milestoneIndex}-${index}`} style={[styles.exampleCard, { backgroundColor: colors.card, shadowColor: colors.glassShadow }]}>
                <View style={styles.exampleTop}>
                  <View style={[styles.exampleNumber, { backgroundColor: colors.primary + '14' }]}>
                    <Text style={[styles.exampleNumberText, { color: colors.primary }]}>{index + 1}</Text>
                  </View>
                  {isSpeechAvailable(language) ? <SpeakerButton
                                                   text={example.sentence}
                                                   language={language}
                                                   accessibilityLabel={`Hear example ${index + 1} in ${LANGUAGE_META[language].label}`}
                                                   compact
                                                   showSlow
                                                 /> : null}
                </View>
                <Text style={[styles.exampleTarget, { color: colors.foreground }]}>
                  {highlighted(example.sentence, example.highlight)}
                </Text>
                <Text style={[styles.exampleEnglish, { color: colors.mutedForeground }]}>{example.translation}</Text>
              </View>
            ))}
            {language === 'armenian' && milestone.band === 'B1' ? (
              <Text style={[styles.reviewNotice, { color: colors.mutedForeground }]}>
                Western Armenian examples in advanced lessons have not been independently reviewed by a qualified speaker.
              </Text>
            ) : null}
          </ScrollView>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Done reading grammar tips"
            onPress={onClose}
            style={[styles.doneButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneText, { color: colors.primaryForeground }]}>Back to lesson</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end' },
  sheet: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  headingCopy: { flex: 1, gap: 4 },
  eyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, letterSpacing: 1.1 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 24, lineHeight: 30 },
  focus: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 19, marginTop: 3 },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { gap: 12, paddingBottom: 18 },
  ruleCard: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 20, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  ruleIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ruleCopy: { flex: 1, gap: 6 },
  cardLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 0.9 },
  ruleText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, lineHeight: 22 },
  table: { borderRadius: 17, padding: 13, gap: 9 },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tableLabel: { flex: 1, fontSize: 12, fontWeight: '600' },
  tableForm: { flex: 1, fontSize: 13, fontWeight: '800' },
  sectionLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, letterSpacing: 0.9, marginTop: 7 },
  exampleCard: { padding: 15, borderRadius: 18, gap: 7, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  exampleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exampleNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  exampleNumberText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  audioButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  exampleTarget: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17, lineHeight: 24 },
  exampleEnglish: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 20 },
  reviewNotice: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, lineHeight: 18, marginTop: 4 },
  doneButton: { minHeight: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  doneText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
});
