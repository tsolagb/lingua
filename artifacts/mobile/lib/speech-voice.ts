export interface SpeechVoiceOption {
  identifier: string;
  language: string;
  quality?: string;
}

function normalizeLanguageTag(language: string): string {
  return language.replace(/_/g, '-').toLowerCase();
}

export function isSpeechAvailable(language: string): boolean {
  return ['it', 'italian', 'fr', 'french', 'es', 'spanish', 'hy', 'armenian'].includes(normalizeLanguageTag(language).split('-')[0]);
}

/** Armenian AI audio is enabled; its previously inaccurate device fallback stays off. */
export function isDeviceSpeechAvailable(language: string): boolean {
  const languageCode = normalizeLanguageTag(language).split('-')[0];
  return languageCode !== 'hy' && languageCode !== 'armenian';
}

export function selectPreferredSpeechVoice(
  voices: readonly SpeechVoiceOption[],
  requestedLanguage: string,
): SpeechVoiceOption | undefined {
  if (!isDeviceSpeechAvailable(requestedLanguage)) return undefined;
  const normalizedRequest = normalizeLanguageTag(requestedLanguage);
  const requestedLanguageCode = normalizedRequest.split('-')[0];

  return voices
    .filter(voice => normalizeLanguageTag(voice.language).split('-')[0] === requestedLanguageCode)
    .slice()
    .sort((left, right) => {
      const qualityRank = (voice: SpeechVoiceOption) => voice.quality === 'Enhanced' ? 0 : 1;
      const localeRank = (voice: SpeechVoiceOption) =>
        normalizeLanguageTag(voice.language) === normalizedRequest ? 0 : 1;
      return qualityRank(left) - qualityRank(right) || localeRank(left) - localeRank(right);
    })[0];
}
