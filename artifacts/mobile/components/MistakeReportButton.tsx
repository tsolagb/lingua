import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from '@/components/native';
import { Ionicons } from '@expo/vector-icons';
import { useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { submitMistakeReport } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';

const REPORTABLE_ROUTES = new Set([
  'crossword',
  'fill-in-the-blank',
  'flashcards',
  'game',
  'grammar-practice',
  'guided-lesson',
  'guided-sentence-review',
  'italian-foundations',
  'language-foundations',
  'phrases',
  'play-game',
  'quiz',
  'rapidfire',
  'reading-practice',
  'sentence-practice',
  'spelling',
  'theology-practice',
  'time-practice',
  'trueorfalse',
  'verb-fill-in',
  'verb-sentence-builder',
  'vocabulary-test',
  'wordsearch',
]);

const GAME_NAMES: Record<string, string> = {
  crossword: 'Crossword',
  'fill-in-the-blank': 'Fill in the blank',
  flashcards: 'Flash Cards',
  game: 'Word Match',
  'grammar-practice': 'Grammar practice',
  'guided-lesson': 'Guided lessons',
  'guided-sentence-review': 'Sentence review',
  'italian-foundations': 'Italian foundations',
  'language-foundations': 'Language foundations',
  phrases: 'Phrases',
  'play-game': 'Arcade game',
  quiz: 'Quiz',
  rapidfire: 'Rapid Fire',
  'reading-practice': 'Reading practice',
  'sentence-practice': 'Sentence practice',
  spelling: 'Spelling',
  'theology-practice': 'Theology practice',
  'time-practice': 'Time practice',
  trueorfalse: 'True or False',
  'verb-fill-in': 'Verb fill-in',
  'verb-sentence-builder': 'Verb sentence builder',
  'vocabulary-test': 'Vocabulary test',
  wordsearch: 'Word Search',
};

const LANGUAGE_NAMES: Record<string, string> = {
  armenian: 'Armenian',
  french: 'French',
  italian: 'Italian',
  spanish: 'Spanish',
};

type IssueType = 'vocabulary' | 'grammar';

export function MistakeReportButton() {
  const segments = useSegments();
  const route = String(segments[segments.length - 1] ?? '');
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeLanguage } = useGame();
  const [visible, setVisible] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>('vocabulary');
  const [reportedContent, setReportedContent] = useState('');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const gameName = useMemo(
    () => GAME_NAMES[route] ?? route.replace(/[-_]/g, ' '),
    [route],
  );

  if (!REPORTABLE_ROUTES.has(route)) return null;

  const close = () => {
    if (sending) return;
    setVisible(false);
    setError('');
  };

  const open = () => {
    setSent(false);
    setError('');
    setVisible(true);
  };

  const submit = async () => {
    const content = reportedContent.trim();
    if (content.length < 3) {
      setError('Describe the word, sentence, or answer that seems wrong.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await submitMistakeReport({
        language: activeLanguage,
        issueType,
        game: gameName.slice(0, 80),
        reportedContent: content,
        ...(suggestedCorrection.trim()
          ? { suggestedCorrection: suggestedCorrection.trim() }
          : {}),
      });
      setSent(true);
      setReportedContent('');
      setSuggestedCorrection('');
    } catch {
      setError('Could not send this report. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Report a vocabulary or grammar mistake"
          testID="report-content-mistake"
          onPress={open}
          activeOpacity={0.82}
          style={[
            styles.launcher,
            {
              top: insets.top + 9,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="flag-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close mistake report"
            style={StyleSheet.absoluteFill}
            onPress={close}
          />
          <KeyboardAvoidingView
            style={styles.sheetPosition}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.card,
                  paddingBottom: Math.max(insets.bottom, 18),
                },
              ]}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sheetContent}
              >
                <View style={styles.titleRow}>
                  <View style={[styles.titleIcon, { backgroundColor: colors.accent }]}>
                    <Ionicons name={sent ? 'checkmark-circle' : 'flag'} size={22} color={colors.primary} />
                  </View>
                  <View style={styles.titleCopy}>
                    <Text style={[styles.title, { color: colors.foreground }]}>
                      {sent ? 'Thanks for the report' : 'Report a mistake'}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                      {sent
                        ? 'Your note was sent for review.'
                        : `${LANGUAGE_NAMES[activeLanguage] ?? activeLanguage} · ${gameName}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Close mistake report"
                    onPress={close}
                    disabled={sending}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={22} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>

                {sent ? (
                  <View style={[styles.successBox, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.bodyText, { color: colors.foreground }]}>
                      Reports are anonymous and help us review vocabulary and grammar content.
                    </Text>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={close}
                      style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.fieldLabel, { color: colors.foreground }]}>What kind of issue is it?</Text>
                    <View style={[styles.segment, { backgroundColor: colors.background }]}>
                      {(['vocabulary', 'grammar'] as const).map(type => {
                        const selected = issueType === type;
                        return (
                          <TouchableOpacity
                            key={type}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            onPress={() => setIssueType(type)}
                            style={[
                              styles.segmentOption,
                              selected && { backgroundColor: colors.primary },
                            ]}
                          >
                            <Text
                              style={[
                                styles.segmentText,
                                { color: selected ? colors.primaryForeground : colors.mutedForeground },
                              ]}
                            >
                              {type === 'vocabulary' ? 'Vocabulary' : 'Grammar'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                      Word, sentence, or answer with the issue
                    </Text>
                    <TextInput
                      accessibilityLabel="Word, sentence, or answer with the issue"
                      testID="mistake-report-content"
                      value={reportedContent}
                      onChangeText={setReportedContent}
                      placeholder="Tell us what seems incorrect"
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      maxLength={1000}
                      textAlignVertical="top"
                      style={[
                        styles.input,
                        styles.contentInput,
                        { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    />

                    <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                      Suggested correction <Text style={{ color: colors.mutedForeground }}>(optional)</Text>
                    </Text>
                    <TextInput
                      accessibilityLabel="Suggested correction"
                      testID="mistake-report-correction"
                      value={suggestedCorrection}
                      onChangeText={setSuggestedCorrection}
                      placeholder="What do you think it should say?"
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      maxLength={500}
                      textAlignVertical="top"
                      style={[
                        styles.input,
                        styles.correctionInput,
                        { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    />
                    <Text style={[styles.privacyNote, { color: colors.mutedForeground }]}>
                      The app sends the report, language, and game name only. Please don’t include personal information.
                    </Text>
                    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={sending ? 'Sending mistake report' : 'Send mistake report'}
                      testID="submit-mistake-report"
                      onPress={() => void submit()}
                      disabled={sending || reportedContent.trim().length < 3}
                      activeOpacity={0.86}
                      style={[
                        styles.primaryButton,
                        { backgroundColor: colors.primary },
                        (sending || reportedContent.trim().length < 3) && styles.disabledButton,
                      ]}
                    >
                      <Ionicons name="send-outline" size={17} color={colors.primaryForeground} />
                      <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                        {sending ? 'Sending…' : 'Send report'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  launcher: {
    position: 'absolute',
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,12,24,0.44)' },
  sheetPosition: { width: '100%', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  sheetContent: { gap: 14, paddingBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 3 },
  titleIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titleCopy: { flex: 1, gap: 3 },
  title: { fontSize: 19, fontWeight: '800' },
  subtitle: { fontSize: 13, fontWeight: '600' },
  closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 14, fontWeight: '700', marginBottom: -7 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: 14, gap: 5 },
  segmentOption: { flex: 1, minHeight: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 14, fontWeight: '800' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingTop: 12, fontSize: 15, lineHeight: 21 },
  contentInput: { minHeight: 94 },
  correctionInput: { minHeight: 70 },
  privacyNote: { fontSize: 12, lineHeight: 17 },
  error: { color: '#C0393B', fontSize: 13, fontWeight: '700' },
  primaryButton: {
    minHeight: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 16,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '800' },
  disabledButton: { opacity: 0.55 },
  successBox: { gap: 16, borderRadius: 18, padding: 15 },
  bodyText: { fontSize: 14, lineHeight: 21 },
});
