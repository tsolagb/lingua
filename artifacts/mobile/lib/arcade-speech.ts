import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import { speechApiUrl } from './speech-cache';
import type { Language } from '@/data/vocabulary';

export interface SpeechAttempt {
  transcription: string;
  similarity: number;
  similarityScore: number;
  scoreType: 'transcript_similarity';
}
export async function scoreRecording(uri: string, expectedText: string, language: Language, signal: AbortSignal): Promise<SpeechAttempt> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const recording = await globalThis.fetch(uri).then(response => response.blob());
    const extension = recording.type.includes('mp4') ? 'm4a' : 'webm';
    form.append('audio', recording, `practice.${extension}`);
  } else {
    form.append('audio', new File(uri), 'practice.m4a');
  }
  form.append('expectedText', expectedText);
  form.append('language', language);
  const response = await expoFetch(speechApiUrl('transcribe'), { method: 'POST', body: form, signal, credentials: 'omit' });
  if (!response.ok) throw new Error(response.status === 429 ? 'A little pause is needed. Please try again shortly.' : 'We could not hear this attempt right now. Check your connection and try again.');
  const result = await response.json() as SpeechAttempt;
  if (typeof result.transcription !== 'string' || !Number.isFinite(result.similarity) || result.similarity < 0 || result.similarity > 1 || result.scoreType !== 'transcript_similarity') {
    throw new Error('The recording could not be scored. Please try again.');
  }
  return result;
}
