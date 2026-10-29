import React, { useState } from 'react';
import {
  ActivityIndicator,
  TextInput,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { LANGUAGE_META } from '@/data/vocabulary';
import { PHRASE_PRACTICE_LEVELS, type PhraseLevelId } from '@/data/phrase-practice';
import {
  EVERYDAY_DIALOGUE_TOPICS,
  getEverydayDialogueExchanges,
  type EverydayDialogueTopicId,
} from '@/data/thematic-vocabulary';
import { useAvailableSpeechVoice } from '@/hooks/useAvailableSpeechVoice';
import { transliterateWesternArmenian } from '@/data/armenian-transliteration';
import { goBackOr } from '@/lib/navigation';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SpeakerButton, usePreloadSpeech } from '@/components/SpeakerButton';

export default function PhrasesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeLanguage, isMuted, toggleMute } = useGame();
  const { speak } = useSound();
  const params = useLocalSearchParams<{ topic?: string }>();
  const requestedTopic = Array.isArray(params.topic) ? params.topic[0] : params.topic;
  const initialTopic = EVERYDAY_DIALOGUE_TOPICS.find(topic => topic.id === requestedTopic);
  const [practiceSection, setPracticeSection] = useState<'phrases' | 'conversations'>(
    initialTopic ? 'conversations' : 'phrases',
  );
  const [selectedLevelId, setSelectedLevelId] = useState<PhraseLevelId>('simple');
  const [selectedTopicId, setSelectedTopicId] = useState<EverydayDialogueTopicId>(
    initialTopic?.id ?? 'groceries',
  );
  const [hiddenMeaningLines, setHiddenMeaningLines] = useState<Set<string>>(() => new Set());
  const [conversationMode, setConversationMode] = useState<'practice' | 'dialogue'>('practice');
  const [exchangeIndex, setExchangeIndex] = useState(0);
  const [draftReply, setDraftReply] = useState('');
  const [replyRevealed, setReplyRevealed] = useState(false);
  const voiceStatus = useAvailableSpeechVoice(activeLanguage);
  const levelIndex = Math.max(
    0,
    PHRASE_PRACTICE_LEVELS.findIndex(level => level.id === selectedLevelId),
  );
  const level = PHRASE_PRACTICE_LEVELS[levelIndex];
  const conversationTopic =
    EVERYDAY_DIALOGUE_TOPICS.find(topic => topic.id === selectedTopicId) ??
    EVERYDAY_DIALOGUE_TOPICS[0];
  const exchanges = getEverydayDialogueExchanges(conversationTopic);
  const activeExchange = exchanges[exchangeIndex];
  usePreloadSpeech([...level.phrases.map(phrase => phrase.translations[activeLanguage]), ...conversationTopic.lines.map(line => line.translations[activeLanguage]), ...exchanges.map(exchange => exchange.reply.translations[activeLanguage])], activeLanguage);
  const languageInfo = LANGUAGE_META[activeLanguage];
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back to topics"
          testID="phrases-back"
          onPress={() => goBackOr('/categories')}
          style={[styles.iconButton, { backgroundColor: colors.muted }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>SPEAK NATURALLY</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {practiceSection === 'phrases' ? 'Useful phrases' : 'Short conversations'}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="switch"
          accessibilityLabel={`Sound ${isMuted ? 'off' : 'on'}`}
          accessibilityState={{ checked: !isMuted }}
          testID="phrases-sound-toggle"
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

      <KeyboardAvoidingView style={styles.keyboardArea} behavior="padding" keyboardVerticalOffset={0}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 28 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={[styles.languageBanner, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <View style={[styles.languageIcon, { backgroundColor: colors.card }]}>
            <Text style={styles.flag}>{languageInfo.flag}</Text>
          </View>
          <View style={styles.languageCopy}>
            <Text style={[styles.languageTitle, { color: colors.foreground }]}>{languageInfo.label}</Text>
            <Text style={[styles.languageHint, { color: colors.mutedForeground }]}>
              Phrase levels and everyday conversations are always open.
            </Text>
          </View>
        </View>

        <View style={styles.practiceTabs} accessibilityRole="tablist">
          {[
            { id: 'phrases' as const, title: 'Useful phrases', icon: 'chatbubble-ellipses-outline' as const },
            { id: 'conversations' as const, title: 'Short conversations', icon: 'people-outline' as const },
          ].map(item => {
            const selected = practiceSection === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                testID={`phrase-practice-tab-${item.id}`}
                onPress={() => setPracticeSection(item.id)}
                style={[
                  styles.practiceTab,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={selected ? colors.primaryForeground : colors.primary}
                />
                <Text style={[styles.practiceTabText, { color: selected ? colors.primaryForeground : colors.foreground }]}>
                  {item.title}
                </Text>
                <Text style={[styles.practiceTabHint, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>
                  Always open
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {practiceSection === 'phrases' ? (
          <>
            <View style={styles.levelSection}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CHOOSE A LEVEL</Text>
              <View style={styles.levelTabs}>
                {PHRASE_PRACTICE_LEVELS.map(item => {
                  const selected = item.id === level.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      accessibilityRole="tab"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${item.title}, always available`}
                      testID={`phrase-level-${item.id}`}
                      onPress={() => setSelectedLevelId(item.id)}
                      style={[
                        styles.levelTab,
                        {
                          backgroundColor: selected ? colors.primary : colors.card,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.levelTabText,
                          { color: selected ? colors.primaryForeground : colors.foreground },
                        ]}
                      >
                        {item.title.replace(' phrases', '')}
                      </Text>
                      <Text
                        style={[
                          styles.levelOpenText,
                          { color: selected ? colors.primaryForeground : colors.mutedForeground },
                        ]}
                      >
                        Always open
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.levelHeading}>
              <Text style={[styles.levelTitle, { color: colors.foreground }]}>{level.title}</Text>
              <Text style={[styles.levelDescription, { color: colors.mutedForeground }]}>{level.description}</Text>
              <Text style={[styles.phraseCount, { color: colors.primary }]}>
                {level.phrases.length} phrases · {languageInfo.nativeLabel}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.levelSection}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CHOOSE A TOPIC</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topicTabs}
              >
                {EVERYDAY_DIALOGUE_TOPICS.map(topic => {
                  const selected = topic.id === conversationTopic.id;
                  return (
                    <TouchableOpacity
                      key={topic.id}
                      accessibilityRole="tab"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${topic.title}, always available`}
                      testID={`conversation-topic-${topic.id}`}
                      onPress={() => {
                        setSelectedTopicId(topic.id);
                        setExchangeIndex(0);
                        setDraftReply('');
                        setReplyRevealed(false);
                      }}
                      style={[
                        styles.topicTab,
                        {
                          backgroundColor: selected ? colors.primary : colors.card,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.topicTabText, { color: selected ? colors.primaryForeground : colors.foreground }]}>
                        {topic.title.replace('At the ', '')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <View style={styles.levelHeading}>
              <Text style={[styles.levelTitle, { color: colors.foreground }]}>{conversationTopic.title}</Text>
              <Text style={[styles.levelDescription, { color: colors.mutedForeground }]}>{conversationTopic.description}</Text>
              <Text style={[styles.phraseCount, { color: colors.primary }]}>
                {conversationTopic.lines.length} lines · {languageInfo.nativeLabel} + English
              </Text>
            </View>
          </>
        )}

        {practiceSection === 'conversations' && (
          <View style={styles.conversationModes} accessibilityRole="tablist">
            {[
              { id: 'practice' as const, title: 'Practice replies', icon: 'create-outline' as const },
              { id: 'dialogue' as const, title: 'Read dialogue', icon: 'chatbubbles-outline' as const },
            ].map(item => {
              const selected = conversationMode === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  testID={`conversation-mode-${item.id}`}
                  onPress={() => setConversationMode(item.id)}
                  style={[
                    styles.conversationMode,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={selected ? colors.primaryForeground : colors.primary}
                  />
                  <Text style={[styles.conversationModeText, { color: selected ? colors.primaryForeground : colors.foreground }]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {voiceStatus === 'checking' && (
          <View style={styles.voiceNotice}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
              Preparing phrase audio…
            </Text>
          </View>
        )}
        {voiceStatus === 'unavailable' && (
          <View style={[styles.voiceNotice, styles.noticeCard, { backgroundColor: colors.muted }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.mutedForeground} />
            <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
              Phrase audio is not available for this language.
            </Text>
          </View>
        )}
        {isMuted && voiceStatus === 'available' && (
          <View style={[styles.voiceNotice, styles.noticeCard, { backgroundColor: colors.muted }]}>
            <Ionicons name="volume-mute-outline" size={18} color={colors.mutedForeground} />
            <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
              Sound is off. Use the sound button above to hear the practice.
            </Text>
          </View>
        )}
        {activeLanguage === 'armenian' && (
          <View style={[styles.dialectNotice, { borderLeftColor: colors.primary }]}>
            <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
              Armenian examples use Western Armenian spelling; some wording may vary by region.
            </Text>
          </View>
        )}

        {practiceSection === 'phrases' ? (
          <View style={styles.phrases}>
            {level.phrases.map((phrase, index) => (
              <View
                key={`${level.id}-${phrase.id}`}
                style={[styles.phraseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.phraseTopline}>
                  <View style={[styles.phraseNumber, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.phraseNumberText, { color: colors.primary }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.phraseTopSpacer} />
                  {voiceStatus === 'available' && (
                    <SpeakerButton
                      text={phrase.translations[activeLanguage]}
                      language={activeLanguage}
                      accessibilityLabel={`Listen to phrase ${index + 1} in ${languageInfo.label}`}
                      testID={`phrase-listen-${phrase.id}`}
                      disabled={isMuted}
                      compact
                      showSlow
                    />
                  )}
                </View>
                <Text
                  accessibilityLabel={`${languageInfo.label}: ${phrase.translations[activeLanguage]}`}
                  style={[styles.targetPhrase, { color: colors.foreground }]}
                >
                  {phrase.translations[activeLanguage]}
                </Text>
                {activeLanguage === 'armenian' && levelIndex < 2 && (
                  <Text style={[styles.transliteration, { color: colors.primary }]}>
                    {transliterateWesternArmenian(phrase.translations.armenian)}
                  </Text>
                )}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.meaningLabel, { color: colors.mutedForeground }]}>MEANING</Text>
                <Text style={[styles.meaning, { color: colors.mutedForeground }]}>{phrase.meaning}</Text>
                {!!phrase.usageNotes?.[activeLanguage] && (
                  <Text style={[styles.usageNote, { color: colors.mutedForeground }]}>
                    {phrase.usageNotes[activeLanguage]}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : conversationMode === 'practice' ? (
          <View style={styles.replyPractice}>
            <View style={[styles.replyPracticeIntro, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Ionicons name="sparkles-outline" size={19} color={colors.primary} />
              <View style={styles.replyPracticeIntroCopy}>
                <Text style={[styles.replyPracticeTitle, { color: colors.foreground }]}>
                  Your turn to reply
                </Text>
                <Text style={[styles.replyPracticeHint, { color: colors.mutedForeground }]}>
                  Available at every course level · Reply in {languageInfo.label}
                </Text>
              </View>
            </View>

            {activeExchange ? (
              <View style={[styles.replyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.replyProgress}>
                  <Text style={[styles.sectionLabel, { color: colors.primary }]}>
                    REPLY {exchangeIndex + 1} OF {exchanges.length}
                  </Text>
                  <Text style={[styles.replyPromptSpeaker, { color: colors.mutedForeground }]}>
                    SPEAKER A
                  </Text>
                </View>
                <Text style={[styles.targetPhrase, { color: colors.foreground }]}>
                  {activeExchange.prompt.translations[activeLanguage]}
                </Text>
                {activeLanguage === 'armenian' && (
                  <Text style={[styles.transliteration, { color: colors.primary }]}>
                    {transliterateWesternArmenian(activeExchange.prompt.translations.armenian)}
                  </Text>
                )}
                <Text style={[styles.meaning, { color: colors.mutedForeground }]}>
                  {activeExchange.prompt.english}
                </Text>

                <Text style={[styles.yourReplyLabel, { color: colors.foreground }]}>
                  What would you say?
                </Text>
                <TextInput
                  value={draftReply}
                  onChangeText={setDraftReply}
                  multiline
                  textAlignVertical="top"
                  placeholder={`Write a reply in ${languageInfo.label}…`}
                  placeholderTextColor={colors.mutedForeground}
                  accessibilityLabel={`Your reply in ${languageInfo.label}`}
                  testID={`conversation-reply-input-${conversationTopic.id}-${exchangeIndex + 1}`}
                  style={[
                    styles.replyInput,
                    { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                />

                {!replyRevealed ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !draftReply.trim() }}
                    disabled={!draftReply.trim()}
                    onPress={() => setReplyRevealed(true)}
                    testID={`conversation-reveal-${conversationTopic.id}-${exchangeIndex + 1}`}
                    style={[
                      styles.replyAction,
                      {
                        backgroundColor: colors.primary,
                        opacity: draftReply.trim() ? 1 : 0.5,
                      },
                    ]}
                  >
                    <Ionicons name="eye-outline" size={18} color={colors.primaryForeground} />
                    <Text style={[styles.replyActionText, { color: colors.primaryForeground }]}>
                      Reveal suggested reply
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.suggestedReply, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                    <View style={styles.suggestedReplyTopline}>
                      <Text style={[styles.suggestedReplyLabel, { color: colors.primary }]}>
                        SUGGESTED REPLY
                      </Text>
                      {voiceStatus === 'available' && (
                        <SpeakerButton
                          text={activeExchange.reply.translations[activeLanguage]}
                          language={activeLanguage}
                          accessibilityLabel={`Listen to the suggested reply in ${languageInfo.label}`}
                          testID={`conversation-reply-listen-${conversationTopic.id}-${exchangeIndex + 1}`}
                          disabled={isMuted}
                          compact
                          showSlow
                        />
                      )}
                    </View>
                    <Text style={[styles.targetPhrase, { color: colors.foreground }]}>
                      {activeExchange.reply.translations[activeLanguage]}
                    </Text>
                    {activeLanguage === 'armenian' && (
                      <Text style={[styles.transliteration, { color: colors.primary }]}>
                        {transliterateWesternArmenian(activeExchange.reply.translations.armenian)}
                      </Text>
                    )}
                    <Text style={[styles.meaning, { color: colors.mutedForeground }]}>
                      {activeExchange.reply.english}
                    </Text>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => {
                        setExchangeIndex(exchangeIndex + 1);
                        setDraftReply('');
                        setReplyRevealed(false);
                      }}
                      testID={`conversation-next-reply-${conversationTopic.id}`}
                      style={[styles.replyAction, { backgroundColor: colors.primary, marginTop: 15 }]}
                    >
                      <Text style={[styles.replyActionText, { color: colors.primaryForeground }]}>
                        {exchangeIndex + 1 < exchanges.length ? 'Next reply' : 'Finish practice'}
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.replyComplete, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.completionIcon, { backgroundColor: colors.accent }]}>
                  <Ionicons name="checkmark" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.replyPracticeTitle, { color: colors.foreground }]}>
                  Conversation complete
                </Text>
                <Text style={[styles.replyPracticeHint, { color: colors.mutedForeground }]}>
                  You tried both replies in {languageInfo.label}.
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => {
                    setExchangeIndex(0);
                    setDraftReply('');
                    setReplyRevealed(false);
                  }}
                  testID={`conversation-restart-${conversationTopic.id}`}
                  style={[styles.replyAction, { backgroundColor: colors.primary, marginTop: 15 }]}
                >
                  <Ionicons name="refresh-outline" size={18} color={colors.primaryForeground} />
                  <Text style={[styles.replyActionText, { color: colors.primaryForeground }]}>
                    Practice again
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.dialogueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {conversationTopic.lines.map((line, index) => {
              const lineKey = `${conversationTopic.id}-${index}`;
              const meaningHidden = hiddenMeaningLines.has(lineKey);
              return (
                <View
                  key={lineKey}
                  testID={`conversation-line-${conversationTopic.id}-${index + 1}`}
                  style={[
                    styles.dialogueLine,
                    index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                <View style={styles.dialogueTopline}>
                  <Text style={[styles.speakerLabel, { color: colors.primary }]}>Speaker {line.speaker}</Text>
                  {voiceStatus === 'available' && (
                    <SpeakerButton
                      text={line.translations[activeLanguage]}
                      language={activeLanguage}
                      accessibilityLabel={`Listen to speaker ${line.speaker} in ${languageInfo.label}`}
                      testID={`conversation-listen-${conversationTopic.id}-${index + 1}`}
                      disabled={isMuted}
                      compact
                      showSlow
                    />
                  )}
                </View>
                <Text style={[styles.targetPhrase, { color: colors.foreground }]}>
                  {line.translations[activeLanguage]}
                </Text>
                {activeLanguage === 'armenian' && (
                  <Text style={[styles.transliteration, { color: colors.primary }]}>
                    {transliterateWesternArmenian(line.translations.armenian)}
                  </Text>
                )}
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`${meaningHidden ? 'Show' : 'Hide'} English meaning for speaker ${line.speaker}`}
                  accessibilityState={{ expanded: !meaningHidden }}
                  testID={`conversation-meaning-toggle-${conversationTopic.id}-${index + 1}`}
                  onPress={() => {
                    setHiddenMeaningLines(current => {
                      const next = new Set(current);
                      if (next.has(lineKey)) {
                        next.delete(lineKey);
                      } else {
                        next.add(lineKey);
                      }
                      return next;
                    });
                  }}
                  style={styles.meaningToggle}
                >
                  <Ionicons
                    name={meaningHidden ? 'eye-outline' : 'eye-off-outline'}
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={[styles.meaningToggleText, { color: colors.primary }]}>
                    {meaningHidden ? 'Show meaning' : 'Hide meaning'}
                  </Text>
                </TouchableOpacity>
                {!meaningHidden && (
                  <Text style={[styles.meaning, { color: colors.mutedForeground }]}>{line.english}</Text>
                )}
                </View>
              );
            })}
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardArea: { flex: 1 },
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
  practiceTabs: { flexDirection: 'row', gap: 9, marginTop: 20 },
  practiceTab: {
    flex: 1,
    minHeight: 66,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 15,
  },
  practiceTabText: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  practiceTabHint: { fontSize: 9, fontWeight: '600' },
  levelSection: { marginTop: 23 },
  sectionLabel: { fontSize: 10, letterSpacing: 1, fontWeight: '800', marginBottom: 9 },
  levelTabs: { flexDirection: 'row', gap: 7 },
  levelTab: {
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 6,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  levelTabText: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  levelOpenText: { fontSize: 8, fontWeight: '600', marginTop: 4 },
  topicTabs: { gap: 8, paddingRight: 18 },
  topicTab: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
  },
  topicTabText: { fontSize: 11, fontWeight: '700' },
  conversationModes: { flexDirection: 'row', gap: 8, marginTop: 15 },
  conversationMode: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 13,
  },
  conversationModeText: { fontSize: 11, fontWeight: '800' },
  levelHeading: { marginTop: 22, marginBottom: 13 },
  levelTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.7 },
  levelDescription: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  phraseCount: { fontSize: 11, fontWeight: '700', marginTop: 8 },
  voiceNotice: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  noticeCard: { padding: 11, borderRadius: 14 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 16 },
  dialectNotice: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 12 },
  phrases: { gap: 11, marginTop: 3 },
  replyPractice: { gap: 12, marginTop: 3 },
  replyPracticeIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderWidth: 1,
    borderRadius: 15,
  },
  replyPracticeIntroCopy: { flex: 1, gap: 3 },
  replyPracticeTitle: { fontSize: 15, fontWeight: '800' },
  replyPracticeHint: { fontSize: 11, lineHeight: 16 },
  replyCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 9 },
  replyProgress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  replyPromptSpeaker: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  yourReplyLabel: { fontSize: 13, fontWeight: '800', marginTop: 8 },
  replyInput: {
    minHeight: 88,
    maxHeight: 150,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 21,
  },
  replyAction: {
    minHeight: 46,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  replyActionText: { fontSize: 13, fontWeight: '800' },
  suggestedReply: { marginTop: 7, padding: 12, borderWidth: 1, borderRadius: 14 },
  suggestedReplyTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  suggestedReplyLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.9 },
  replyComplete: { alignItems: 'center', padding: 22, borderWidth: 1, borderRadius: 18 },
  completionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dialogueCard: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  dialogueLine: { padding: 14, gap: 8 },
  dialogueTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  speakerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  meaningToggle: { minHeight: 32, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6 },
  meaningToggleText: { fontSize: 12, fontWeight: '700' },
  phraseCard: { borderWidth: 1, borderRadius: 18, padding: 14 },
  phraseTopline: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  phraseNumber: { width: 27, height: 27, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  phraseNumberText: { fontSize: 11, fontWeight: '900' },
  phraseTopSpacer: { flex: 1 },
  listenButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  targetPhrase: { fontSize: 19, lineHeight: 27, fontWeight: '700' },
  transliteration: { fontSize: 13, lineHeight: 19, marginTop: 7, fontStyle: 'italic' },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 12, marginBottom: 9 },
  meaningLabel: { fontSize: 9, letterSpacing: 0.9, fontWeight: '900' },
  meaning: { fontSize: 14, lineHeight: 21, marginTop: 4 },
  usageNote: { fontSize: 11, lineHeight: 16, fontStyle: 'italic', marginTop: 6 },
});
