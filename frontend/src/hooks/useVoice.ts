import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { ttsService } from '../voice/tts';

export type VoiceState = 'idle' | 'listening' | 'recording_fallback' | 'processing' | 'error';
export type VoiceMode = 'webspeech' | 'mediarecorder';

export interface VoiceError {
  code: 'no-speech' | 'not-allowed' | 'network' | 'language-not-supported' | 'audio-capture' | 'aborted' | 'unknown';
  message: string;
  userMessage: string;
  canRetry: boolean;
}

export interface UseVoiceOptions {
  autoListen?: boolean;
}

const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  'not-allowed': {
    en: 'Microphone permission was denied. Please allow microphone access in your browser settings.',
    hi: 'माइक्रोफ़ोन की अनुमति अस्वीकार कर दी गई। कृपया ब्राउज़र सेटिंग्स में अनुमति सक्षम करें।',
    kn: 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿಯನ್ನು ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಅನುಮತಿ ನೀಡಿ.'
  },
  'no-speech': {
    en: 'No speech was detected. Please tap the mic and try speaking again.',
    hi: 'कोई आवाज़ नहीं पहचानी गई। कृपया माइक दबाकर दोबारा बोलें।',
    kn: 'ಯಾವುದೇ ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೈಕ್ ಒತ್ತಿ ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ.'
  },
  'audio-capture': {
    en: 'No microphone found on your device. Please plug in a microphone or use text search.',
    hi: 'कोई माइक्रोफ़ोन नहीं मिला। कृपया माइक कनेक्ट करें या टेक्स्ट से खोजें।',
    kn: 'ಯಾವುದೇ ಮೈಕ್ರೊಫೋನ್ ಪತ್ತೆಯಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ ಹುಡುಕಿ.'
  },
  'network': {
    en: 'Network issue with speech recognition. Switched to cloud audio fallback.',
    hi: 'नेटवर्क की समस्या। क्लाउड ऑडियो ट्रांसक्रिप्शन का उपयोग किया जा रहा है।',
    kn: 'ನೆಟ್‌ವರ್ಕ್ ಸಮಸ್ಯೆ. ಕ್ಲೌಡ್ ಆಡಿಯೊ ಬ್ಯಾಕ್‌ಅಪ್ ಬಳಸಲಾಗುತ್ತಿದೆ.'
  },
  'language-not-supported': {
    en: 'This language is not supported by your browser. Using cloud speech fallback.',
    hi: 'यह भाषा ब्राउज़र द्वारा समर्थित नहीं है। क्लाउड ट्रांसक्रिप्शन सक्रिय है।',
    kn: 'ಈ ಭಾಷೆ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ಕ್ಲೌಡ್ ಆಡಿಯೊಗೆ ಬದಲಾಯಿಸಲಾಗುತ್ತಿದೆ.'
  },
  'insecure-context': {
    en: 'Voice input requires HTTPS on mobile/LAN IP (browsers block microphone on plain HTTP). Please use typed search or open via HTTPS.',
    hi: 'मोबाइल/LAN IP पर वॉयस इनपुट के लिए HTTPS आवश्यक है (ब्राउज़र HTTP पर माइक ब्लॉक करते हैं)। कृपया टाइप करके खोजें।',
    kn: 'ಮೊಬೈಲ್/LAN IP ನಲ್ಲಿ ಧ್ವನಿ ಇನ್ಪುಟ್ಗೆ HTTPS ಅಗತ್ಯವಿದೆ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ ಹುಡುಕಿ.'
  },
  'unknown': {
    en: 'Voice recognition error. Tap "Try again" or type your search query.',
    hi: 'ध्वनि पहचान में त्रुटि। "दोबारा प्रयास करें" दबाएँ या टाइप करें।',
    kn: 'ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆಯಲ್ಲಿ ದೋಷ. "ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ" ಒತ್ತಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'
  }
};

export const useVoice = (
  lang: string = 'en-IN',
  onFinal?: (transcript: string, detectedLang?: string) => void,
  options?: UseVoiceOptions
) => {
  const [state, setState] = useState<VoiceState>('idle');
  const [mode, setMode] = useState<VoiceMode>('webspeech');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<VoiceError | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [suggestedQuery, setSuggestedQuery] = useState<{ text: string; lang: string } | null>(null);
  const [autoListen, setAutoListenState] = useState<boolean>(() => options?.autoListen ?? false);

  const autoListenRef = useRef(autoListen);
  const userStoppedRef = useRef(false);
  const autoRestartTimerRef = useRef<any>(null);

  useEffect(() => {
    if (options?.autoListen !== undefined) {
      autoListenRef.current = options.autoListen;
      setAutoListenState(options.autoListen);
    }
  }, [options?.autoListen]);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const normalizedLang = lang.startsWith('kn') ? 'kn-IN' : lang.startsWith('hi') ? 'hi-IN' : 'en-IN';
  const langKey = lang.startsWith('kn') ? 'kn' : lang.startsWith('hi') ? 'hi' : 'en';

  const getUserFriendlyMessage = useCallback((code: string): string => {
    const langDict = ERROR_MESSAGES[code] || ERROR_MESSAGES.unknown;
    return langDict[langKey] || langDict.en;
  }, [langKey]);

  // Clean up all audio resources
  const cleanupResources = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {}
      mediaRecorderRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    setAudioLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  // Audio level visualizer for waveform animation
  const setupAudioVisualizer = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) {
      console.warn('Audio visualizer setup skipped:', e);
    }
  }, []);

  // MediaRecorder Fallback for Firefox, Brave, unsupported languages or network errors
  const startMediaRecorderFallback = useCallback(async () => {
    cleanupResources();
    setError(null);
    setState('recording_fallback');
    setMode('mediarecorder');
    setLiveTranscript('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setupAudioVisualizer(stream);

      audioChunksRef.current = [];
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      let selectedMime = 'audio/webm';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType: selectedMime });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setState('processing');
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMime });

        if (audioBlob.size < 500) {
          setState('error');
          setError({
            code: 'no-speech',
            message: 'Audio clip was too short or silent.',
            userMessage: getUserFriendlyMessage('no-speech'),
            canRetry: true
          });
          cleanupResources();
          return;
        }

        try {
          // Upload audio to backend transcription cascade (Sarvam -> Groq -> Gemini)
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          formData.append('lang', normalizedLang);

          const res = await api.transcribeAudioBlob(formData);
          const transcript = res.text || res.transcript || '';

          if (transcript.trim().length > 0) {
            setLiveTranscript(transcript.trim());
            setState('idle');
            if (onFinal) {
              onFinal(transcript.trim(), res.lang);
            }
          } else {
            setState('error');
            setError({
              code: 'no-speech',
              message: 'No speech recognized in audio.',
              userMessage: getUserFriendlyMessage('no-speech'),
              canRetry: true
            });
          }
        } catch (uploadErr: any) {
          console.error('Audio upload fallback error:', uploadErr);
          setState('error');
          setError({
            code: 'network',
            message: uploadErr?.response?.data?.details || uploadErr.message || 'Transcription failed',
            userMessage: getUserFriendlyMessage('unknown'),
            canRetry: true
          });
        } finally {
          cleanupResources();
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;

      // 10 seconds max duration limit
      recordingTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 10000);
    } catch (micErr: any) {
      console.error('MediaRecorder getUserMedia error:', micErr);
      setState('error');
      const isDenied = micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError';
      setError({
        code: isDenied ? 'not-allowed' : 'audio-capture',
        message: micErr.message,
        userMessage: getUserFriendlyMessage(isDenied ? 'not-allowed' : 'audio-capture'),
        canRetry: true
      });
      cleanupResources();
    }
  }, [cleanupResources, getUserFriendlyMessage, normalizedLang, onFinal, setupAudioVisualizer]);

  // Primary: Web Speech Recognition API
  const startListening = useCallback(async () => {
    cleanupResources();
    setError(null);
    setSuggestedQuery(null);
    setLiveTranscript('');

    // Check for insecure context on LAN IP / HTTP
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setState('error');
      setError({
        code: 'not-allowed',
        message: 'Microphone blocked: Browser requires HTTPS for audio capture on network addresses.',
        userMessage: getUserFriendlyMessage('insecure-context'),
        canRetry: false
      });
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setState('error');
      setError({
        code: 'audio-capture',
        message: 'Audio input API is not supported or blocked in this browser context.',
        userMessage: getUserFriendlyMessage('insecure-context'),
        canRetry: false
      });
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // If browser lacks SpeechRecognition (e.g. Firefox, Brave) -> use MediaRecorder immediately
    if (!SpeechRecognition) {
      console.log('ℹ️ Web SpeechRecognition not available in this browser. Switching to MediaRecorder cloud STT.');
      return startMediaRecorderFallback();
    }

    // Step 1: Explicitly request microphone permission with getUserMedia first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setupAudioVisualizer(stream);
    } catch (permErr: any) {
      console.warn('Microphone permission check failed:', permErr);
      const isDenied = permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError';
      setState('error');
      setError({
        code: isDenied ? 'not-allowed' : 'audio-capture',
        message: permErr.message,
        userMessage: getUserFriendlyMessage(isDenied ? 'not-allowed' : 'audio-capture'),
        canRetry: true
      });
      cleanupResources();
      return;
    }

    userStoppedRef.current = false;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = !!autoListenRef.current;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = normalizedLang;

      recognition.onstart = () => {
        setState('listening');
        setMode('webspeech');
        setLiveTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final = trans;
          } else {
            interim += trans;
          }
        }

        const currentText = (final || interim).trim();
        setLiveTranscript(currentText);

        if (final && final.trim().length > 0) {
          if (!autoListenRef.current) {
            setState('processing');
          }
          if (onFinal) {
            onFinal(final.trim(), normalizedLang);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        const errorCode = event.error || 'unknown';

        if (['network', 'language-not-supported', 'service-not-allowed'].includes(errorCode)) {
          console.log(`Switching to MediaRecorder fallback due to speech error: ${errorCode}`);
          startMediaRecorderFallback();
          return;
        }

        if (errorCode === 'no-speech') {
          if (autoListenRef.current && !userStoppedRef.current) {
            // Normal silence between utterances in auto voice detect mode
            return;
          }
          setState('error');
          setError({
            code: 'no-speech',
            message: 'No speech was detected.',
            userMessage: getUserFriendlyMessage('no-speech'),
            canRetry: true
          });
        } else if (errorCode === 'not-allowed') {
          setState('error');
          setError({
            code: 'not-allowed',
            message: 'Microphone access denied.',
            userMessage: getUserFriendlyMessage('not-allowed'),
            canRetry: true
          });
        } else if (errorCode !== 'aborted') {
          setState('error');
          setError({
            code: 'unknown',
            message: event.message || errorCode,
            userMessage: getUserFriendlyMessage('unknown'),
            canRetry: true
          });
        }
        cleanupResources();
      };

      recognition.onend = () => {
        cleanupResources();
        if (autoListenRef.current && !userStoppedRef.current && !ttsService.isSpeaking()) {
          if (autoRestartTimerRef.current) clearTimeout(autoRestartTimerRef.current);
          autoRestartTimerRef.current = setTimeout(() => {
            if (autoListenRef.current && !userStoppedRef.current && !ttsService.isSpeaking()) {
              startListening();
            }
          }, 350);
        } else {
          if (state === 'listening' && !liveTranscript) {
            setState('idle');
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('SpeechRecognition start error, falling back to MediaRecorder:', err);
      startMediaRecorderFallback();
    }
  }, [cleanupResources, getUserFriendlyMessage, normalizedLang, onFinal, setupAudioVisualizer, startMediaRecorderFallback, state, liveTranscript]);

  const stopListening = useCallback(() => {
    userStoppedRef.current = true;
    if (autoRestartTimerRef.current) {
      clearTimeout(autoRestartTimerRef.current);
      autoRestartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    cleanupResources();
    if (state === 'listening' || state === 'recording_fallback') {
      setState('idle');
    }
  }, [cleanupResources, state]);

  const setAutoListen = useCallback((val: boolean) => {
    autoListenRef.current = val;
    setAutoListenState(val);
    if (!val) {
      userStoppedRef.current = true;
      if (autoRestartTimerRef.current) {
        clearTimeout(autoRestartTimerRef.current);
        autoRestartTimerRef.current = null;
      }
      stopListening();
    } else {
      userStoppedRef.current = false;
      setTimeout(() => startListening(), 150);
    }
  }, [startListening, stopListening]);

  // Subscribe to TTS: pause listening while assistant speaks, resume afterwards if autoListen is on
  useEffect(() => {
    const unsub = ttsService.subscribe((isSpeaking) => {
      if (isSpeaking) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {}
        }
      } else {
        if (autoListenRef.current && !userStoppedRef.current) {
          if (autoRestartTimerRef.current) clearTimeout(autoRestartTimerRef.current);
          autoRestartTimerRef.current = setTimeout(() => {
            if (autoListenRef.current && !userStoppedRef.current && !ttsService.isSpeaking()) {
              startListening();
            }
          }, 400);
        }
      }
    });
    return unsub;
  }, [startListening]);

  const resetState = useCallback(() => {
    cleanupResources();
    setState('idle');
    setError(null);
    setLiveTranscript('');
    setSuggestedQuery(null);
  }, [cleanupResources]);

  return {
    state,
    mode,
    liveTranscript,
    error,
    audioLevel,
    suggestedQuery,
    autoListen,
    setAutoListen,
    startListening,
    stopListening,
    resetState,
    setLiveTranscript
  };
};
