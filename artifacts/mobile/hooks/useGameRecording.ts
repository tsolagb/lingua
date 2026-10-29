import { useCallback, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { File } from 'expo-file-system';
import { stopSpeaking } from '@/lib/speech-player';
import { scoreRecording, type SpeechAttempt } from '@/lib/arcade-speech';
import { recordingDeadline } from '@/lib/recording-deadline';
import type { Language } from '@/data/vocabulary';

export function useGameRecording(language: Language) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 150);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'recording' | 'processing' | 'denied' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const phase = useRef(status);
  const abort = useRef<AbortController | null>(null);
  const clearDeadline = useRef<(() => void) | null>(null);
  const setPhase = useCallback((value: typeof status) => { phase.current = value; setStatus(value); }, []);
  const deleteRecording = useCallback((uri: string | null) => {
    if (!uri) return;
    try {
      if (Platform.OS === 'web' && uri.startsWith('blob:')) URL.revokeObjectURL(uri);
      else if (Platform.OS !== 'web') { const file = new File(uri); if (file.exists) file.delete(); }
    } catch { /* Temporary recording cleanup must not interrupt the learner. */ }
  }, []);
  const restorePlayback = useCallback(() => setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {}), []);
  const cancelRecording = useCallback(async () => {
    clearDeadline.current?.(); clearDeadline.current = null;
    generation.current++;
    abort.current?.abort(); abort.current = null;
    try { if (recorder.isRecording) await recorder.stop(); } catch {}
    deleteRecording(recorder.uri);
    await restorePlayback();
    setPhase('idle');
  }, [recorder, deleteRecording, restorePlayback, setPhase]);
  useFocusEffect(useCallback(() => {
    const listener = AppState.addEventListener('change', next => { if (next !== 'active') void cancelRecording(); });
    return () => { listener.remove(); void cancelRecording(); };
  }, [cancelRecording]));
  const startRecording = useCallback(async () => {
    if (phase.current === 'recording' || phase.current === 'processing' || phase.current === 'requesting') return false;
    const token = ++generation.current;
    setError(null); setPhase('requesting'); stopSpeaking();
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (token !== generation.current) return false;
      if (!permission.granted) { setPhase('denied'); setError('Microphone access is optional. Enable it in settings, or skip speaking for now.'); return false; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (token !== generation.current) { await restorePlayback(); return false; }
      await recorder.prepareToRecordAsync();
      if (token !== generation.current) { await restorePlayback(); return false; }
      // SDK 57 web's forDuration timer survives manual stop and tries to stop
      // a disposed MediaRecorder later. Own and cancel this deadline ourselves.
      recorder.record();
      setPhase('recording');
      clearDeadline.current?.();
      clearDeadline.current = recordingDeadline(() => {
        if (phase.current !== 'recording') return;
        void cancelRecording().then(() => {
          setPhase('error');
          setError('Try a shorter recording—up to 25 seconds. Hold the microphone to try again.');
        });
      });
      return true;
    } catch {
      if (token === generation.current) { setPhase('error'); setError('The microphone could not start. You can try again or skip this question.'); }
      await restorePlayback();
      return false;
    }
  }, [recorder, restorePlayback, setPhase, cancelRecording]);
  const stopAndScore = useCallback(async (expectedText: string): Promise<SpeechAttempt | null> => {
    if (phase.current === 'requesting') {
      generation.current++;
      setPhase('idle'); setError('Once permission is ready, hold the microphone again to speak.');
      return null;
    }
    if (phase.current !== 'recording') return null;
    clearDeadline.current?.(); clearDeadline.current = null;
    const token = generation.current;
    setPhase('processing');
    const controller = new AbortController(); abort.current = controller;
    const timeout = setTimeout(() => controller.abort(), 45_000);
    let uri: string | null = null;
    try {
      await recorder.stop(); uri = recorder.uri;
      await restorePlayback();
      if (token !== generation.current) return null;
      if (!uri || recorderState.durationMillis < 300) throw new Error('Hold a little longer and say the word or sentence clearly.');
      const result = await scoreRecording(uri, expectedText, language, controller.signal);
      if (token !== generation.current) return null;
      setPhase('idle');
      return result;
    } catch (failure) {
      if (token === generation.current) {
        setPhase('error');
        setError(controller.signal.aborted ? 'The audio check timed out. Please try a shorter recording.' : failure instanceof Error ? failure.message : 'Please try that recording again.');
      }
      return null;
    } finally { clearTimeout(timeout); deleteRecording(uri); if (abort.current === controller) abort.current = null; }
  }, [recorder, recorderState.durationMillis, language, setPhase, restorePlayback, deleteRecording]);
  return {
    status, error, isRecording: status === 'recording', isProcessing: status === 'processing',
    durationSeconds: recorderState.durationMillis / 1000,
    startRecording, stopAndScore, cancelRecording,
    openSettings: useCallback(async () => {
      if (Platform.OS === 'web') { setError('Allow microphone access in your browser’s site settings, then hold the microphone again.'); return; }
      await Linking.openSettings();
    }, []),
  };
}
