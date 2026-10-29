import type { ReadingPracticeLanguage } from '@/data/reading-practice';
import { isSpeechAvailable } from '@/lib/speech-voice';

export type SpeechVoiceStatus = 'checking' | 'available' | 'unavailable';

// Neural audio is not limited by the voices installed on the phone.
export function useAvailableSpeechVoice(language: ReadingPracticeLanguage): SpeechVoiceStatus {
  return isSpeechAvailable(language) ? 'available' : 'unavailable';
}
