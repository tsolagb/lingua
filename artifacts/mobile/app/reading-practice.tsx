import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { LANGUAGE_META } from '@/data/vocabulary';
import {
  READING_PRACTICE_PASSAGES,
  READING_SPEECH_TAGS,
} from '@/data/reading-practice';
import { useAvailableSpeechVoice } from '@/hooks/useAvailableSpeechVoice';
import { transliterateWesternArmenian } from '@/data/armenian-transliteration';
import { SpeakerButton, usePreloadSpeech } from '@/components/SpeakerButton';
import { goBackOr } from '@/lib/navigation';

export default function ReadingPracticeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeLanguage, isMuted, toggleMute } = useGame();
  useSound();
  const [selectedId, setSelectedId] = useState(READING_PRACTICE_PASSAGES[0].id);
  const voiceStatus = useAvailableSpeechVoice(activeLanguage);
  const languageInfo = LANGUAGE_META[activeLanguage];
  const passageIndex = useMemo(
    () => READING_PRACTICE_PASSAGES.findIndex(passage => passage.id === selectedId),
    [selectedId],
  );
  const passage = READING_PRACTICE_PASSAGES[passageIndex] ?? READING_PRACTICE_PASSAGES[0];
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  usePreloadSpeech(passage.sentences.map(sentence => sentence.translations[activeLanguage]), activeLanguage);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back to topics"
          testID="reading-practice-back"
          onPress={() => goBackOr('/categories')}
          style={[styles.iconButton, { backgroundColor: colors.muted }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>READ & UNDERSTAND</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Reading practice</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="switch"
          accessibilityLabel={`Sound ${isMuted ? 'off' : 'on'}`}
          accessibilityState={{ checked: !isMuted }}
          testID="reading-practice-sound-toggle"
          onPress={toggleMute}
          style={[styles.iconButton, { backgroundColor: colors.muted }]}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={20}
            color={isMuted ? colors.mutedForeground : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.languageBanner, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <View style={[styles.languageIcon, { backgroundColor: colors.card }]}>
            <Text style={styles.flag}>{languageInfo.flag}</Text>
          </View>
          <View style={styles.languageCopy}>
            <Text style={[styles.languageTitle, { color: colors.foreground }]}>{languageInfo.label}</Text>
            <Text style={[styles.languageHint, { color: colors.mutedForeground }]}>
              Read each sentence, then check the English underneath.
            </Text>
          </View>
        </View>

        <View style={styles.selectorSection}>
          <Text style={[styles.selectorLabel, { color: colors.mutedForeground }]}>CHOOSE A READING</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.passageChips}>
            {READING_PRACTICE_PASSAGES.map((item, index) => {
              const selected = item.id === passage.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.title}, ${item.levelName}`}
                  testID={`reading-passage-${item.id}`}
                  onPress={() => setSelectedId(item.id)}
                  style={[
                    styles.passageChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.passageChipIndex,
                      { color: selected ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.passageChipText,
                      { color: selected ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.passageHeading}>
          <View style={[styles.levelPill, { backgroundColor: colors.accent }]}>
            <Text style={[styles.levelPillText, { color: colors.primary }]}>
              READING {passage.level} · {passage.levelName.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.passageTitle, { color: colors.foreground }]}>{passage.title}</Text>
          <Text style={[styles.passageMeta, { color: colors.mutedForeground }]}>
            {passage.sentences.length} sentences · {languageInfo.nativeLabel}
          </Text>
        </View>

        {voiceStatus === 'checking' && (
          <View style={styles.voiceNotice}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.voiceNoticeText, { color: colors.mutedForeground }]}>
              Preparing sentence audio…
            </Text>
          </View>
        )}
        {voiceStatus === 'unavailable' && (
          <View style={[styles.voiceNotice, styles.voiceUnavailable, { backgroundColor: colors.muted }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.mutedForeground} />
            <Text style={[styles.voiceNoticeText, { color: colors.mutedForeground }]}>
              Sentence audio is not available for this language.
            </Text>
          </View>
        )}
        {isMuted && voiceStatus === 'available' && (
          <View style={[styles.voiceNotice, styles.voiceUnavailable, { backgroundColor: colors.muted }]}>
            <Ionicons name="volume-mute-outline" size={18} color={colors.mutedForeground} />
            <Text style={[styles.voiceNoticeText, { color: colors.mutedForeground }]}>
              Sound is off. Use the sound button above to hear sentences.
            </Text>
          </View>
        )}
        {activeLanguage === 'armenian' && (
          <View style={[styles.dialectNotice, { borderLeftColor: colors.primary }]}>
            <Text style={[styles.dialectNoticeText, { color: colors.mutedForeground }]}>
              Western Armenian uses traditional spelling. AI pronunciation may vary; a fluent speaker should verify it. The inaccurate device voice is not used offline.
            </Text>
          </View>
        )}

        <View style={styles.sentences}>
          {passage.sentences.map((sentence, index) => (
            <View
              key={`${passage.id}-${index}`}
              style={[styles.sentenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.sentenceTopline}>
                <View style={[styles.sentenceNumber, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.sentenceNumberText, { color: colors.primary }]}>{index + 1}</Text>
                </View>
                <View style={styles.sentenceTopSpacer} />
                {voiceStatus === 'available' && (
                  <SpeakerButton
                    text={sentence.translations[activeLanguage]}
                    language={activeLanguage}
                    accessibilityLabel={`Listen to sentence ${index + 1} in ${languageInfo.label}`}
                    testID={`reading-sentence-listen-${index + 1}`}
                    disabled={isMuted}
                    compact
                    showSlow
                  />
                )}
              </View>
              <Text
                accessibilityLabel={`${languageInfo.label}: ${sentence.translations[activeLanguage]}`}
                style={[styles.targetSentence, { color: colors.foreground }]}
              >
                {sentence.translations[activeLanguage]}
              </Text>
              {activeLanguage === 'armenian' && passage.level <= 3 && (
                <Text style={[styles.transliteration, { color: colors.primary }]}>
                  {transliterateWesternArmenian(sentence.translations.armenian)}
                </Text>
              )}
              <View style={[styles.translationDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.translationLabel, { color: colors.mutedForeground }]}>ENGLISH</Text>
              <Text style={[styles.englishTranslation, { color: colors.mutedForeground }]}>
                {sentence.english}
              </Text>
            </View>
          ))}
        </View>
        {voiceStatus === 'available' && (
          <Text style={[styles.voiceFooter, { color: colors.mutedForeground }]}>
            Natural AI audio is saved after playback. Cached audio works offline; a device voice is used if needed, except for Armenian.
          </Text>
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
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 3 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  content: { paddingHorizontal: 18, paddingTop: 16 },
  languageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 13,
  },
  languageIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  flag: { fontSize: 22 },
  languageCopy: { flex: 1, gap: 3 },
  languageTitle: { fontSize: 15, fontWeight: '800' },
  languageHint: { fontSize: 11, lineHeight: 16 },
  selectorSection: { marginTop: 23 },
  selectorLabel: { fontSize: 10, letterSpacing: 1, fontWeight: '800', marginBottom: 9 },
  passageChips: { gap: 8, paddingRight: 3 },
  passageChip: {
    minHeight: 44,
    maxWidth: 190,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  passageChipIndex: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  passageChipText: { flexShrink: 1, fontSize: 12, fontWeight: '700' },
  passageHeading: { marginTop: 23, marginBottom: 14 },
  levelPill: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  levelPillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  passageTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.7, marginTop: 10 },
  passageMeta: { fontSize: 12, marginTop: 4 },
  voiceNotice: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  voiceUnavailable: { padding: 11, borderRadius: 14 },
  voiceNoticeText: { flex: 1, fontSize: 11, lineHeight: 16 },
  dialectNotice: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 12 },
  dialectNoticeText: { fontSize: 11, lineHeight: 16 },
  sentences: { gap: 11, marginTop: 3 },
  sentenceCard: { borderWidth: 1, borderRadius: 18, padding: 14 },
  sentenceTopline: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sentenceNumber: { width: 27, height: 27, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sentenceNumberText: { fontSize: 11, fontWeight: '900' },
  sentenceTopSpacer: { flex: 1 },
  listenButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  targetSentence: { fontSize: 19, lineHeight: 27, fontWeight: '700' },
  transliteration: { fontSize: 13, lineHeight: 19, marginTop: 7, fontStyle: 'italic' },
  translationDivider: { height: StyleSheet.hairlineWidth, marginTop: 12, marginBottom: 9 },
  translationLabel: { fontSize: 9, letterSpacing: 0.9, fontWeight: '900' },
  englishTranslation: { fontSize: 14, lineHeight: 21, marginTop: 4 },
  voiceFooter: { fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 14 },
});
