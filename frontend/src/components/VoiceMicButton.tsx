import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Globe,
  AlertCircle,
  RefreshCw,
  Send,
  HelpCircle,
  Radio,
  Square,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { useVoice, VoiceState } from '../hooks/useVoice';
import { api } from '../services/api';
import { VoiceIntentResult } from '../types';
import { translations, SupportedLanguage, ActiveLanguage } from '../i18n/translations';
import { commandRouter } from '../voice/commandRouter';
import { actionDispatcher, DispatcherHandlers } from '../voice/dispatcher';
import { voiceStore } from '../voice/voiceStore';
import { voiceNormalizer } from '../voice/normalize';

interface Props {
  onVoiceResult?: (result: {
    intentResult: VoiceIntentResult;
    searchData?: any;
    cartData?: any;
    orderData?: any;
  }) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  context?: any;
  handlers?: DispatcherHandlers;
}

export const VoiceMicButton: React.FC<Props> = ({
  onVoiceResult,
  language,
  onLanguageChange,
  context,
  handlers
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSpoken, setLastSpoken] = useState<string>('');
  const [typedFallbackText, setTypedFallbackText] = useState('');
  const [didYouMean, setDidYouMean] = useState<{ query: string; lang: SupportedLanguage } | null>(null);

  // Hands-free continuous voice mode state
  const [isVoiceModeActive, setIsVoiceModeActive] = useState<boolean>(() => {
    return localStorage.getItem('voicecart_voice_mode') === 'true';
  });

  const activeLang: ActiveLanguage = language === 'auto' ? 'en' : language;
  const t = translations[activeLang] || translations.en;
  const langCode = language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

  const confirmationTimeoutRef = useRef<any>(null);
  const isContinuousRef = useRef<boolean>(isVoiceModeActive);
  isContinuousRef.current = isVoiceModeActive;

  // Toggle voice mode
  const toggleVoiceMode = () => {
    const next = !isVoiceModeActive;
    setIsVoiceModeActive(next);
    localStorage.setItem('voicecart_voice_mode', String(next));
    if (!next) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      stopListening();
    } else {
      startListening();
    }
  };

  // Browser Text-to-Speech with turn-by-turn callback & barge-in support
  const speakWithBrowserTTS = useCallback((text: string, lang: 'en' | 'hi' | 'kn') => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(true);

      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find((v) => {
        const vl = v.lang.toLowerCase();
        const vn = v.name.toLowerCase();
        if (lang === 'kn') return vl.startsWith('kn') || vn.includes('kannada');
        if (lang === 'hi') return vl.startsWith('hi') || vn.includes('hindi');
        return vl.startsWith('en-in') || vl.startsWith('en');
      });

      const utterance = new SpeechSynthesisUtterance(text);
      if (matchingVoice) utterance.voice = matchingVoice;
      utterance.lang = lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 1.0;

      utterance.onend = () => {
        setIsSpeaking(false);
        // If Hands-Free Voice Mode is active, automatically listen for next turn!
        if (isContinuousRef.current) {
          setTimeout(() => {
            if (isContinuousRef.current) {
              startListening();
            }
          }, 400);
        }
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS playback error:', e);
      setIsSpeaking(false);
    }
  }, []);

  // Process voice transcript with two-layer Command Router & Action Dispatcher
  const handleFinalTranscript = async (transcript: string, _detectedLang?: string) => {
    if (!transcript.trim()) return;

    // Barge-in: cancel any running TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    // Normalize transcript and detect language & script
    const normalizedData = voiceNormalizer.normalize(transcript, language);

    // If language is set to 'auto', automatically switch to detected language
    if (language === 'auto' && normalizedData.language) {
      voiceStore.setLanguage(normalizedData.language);
    }

    // Check script & auto-detect language mismatch for explicit language selections
    const isKannadaScript = /[\u0C80-\u0CFF]/.test(transcript);
    const isHindiScript = /[\u0900-\u097F]/.test(transcript);

    if (isKannadaScript && language !== 'kn' && language !== 'auto') {
      setDidYouMean({ query: transcript, lang: 'kn' });
    } else if (isHindiScript && language !== 'hi' && language !== 'auto') {
      setDidYouMean({ query: transcript, lang: 'hi' });
    } else {
      setDidYouMean(null);
    }

    setIsProcessing(true);
    try {
      // 1. Evaluate two-layer command router (Rule Layer -> AI Layer)
      const currentContext = voiceStore.getContext();
      const targetLang: SupportedLanguage = language === 'auto' ? ((normalizedData.language as SupportedLanguage) || 'en') : language;
      const commandResult = await commandRouter.route(transcript, currentContext, targetLang);

      // Handle STOP command
      if (commandResult.action === 'stop') {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setIsSpeaking(false);
        stopListening();
        setLastSpoken(commandResult.reply);
        return;
      }

      if (handlers) {
        const dispatchResult = await actionDispatcher.dispatch(commandResult, handlers, transcript);
        const spoken = dispatchResult.spokenResponse || commandResult.reply;
        setLastSpoken(spoken);
        const spokenLang: ActiveLanguage =
          commandResult.language && commandResult.language !== 'auto'
            ? (commandResult.language as ActiveLanguage)
            : (normalizedData.language as ActiveLanguage) || 'en';

        // Check if confirmation was set -> start 30-second timeout
        const updatedContext = voiceStore.getContext();
        if (updatedContext.pendingConfirmation) {
          if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);
          confirmationTimeoutRef.current = setTimeout(() => {
            const ctx = voiceStore.getContext();
            if (ctx.pendingConfirmation) {
              voiceStore.setPendingConfirmation(null);
              const cancelMsg =
                spokenLang === 'kn'
                  ? "ನಾನು ಬುಕಿಂಗ್ ಅನ್ನು ರದ್ದುಗೊಳಿಸಿದ್ದೇನೆ. ನೀವು ಸಿದ್ಧರಾದಾಗ 'ಬುಕ್ ಮಾಡಿ' ಎಂದು ಹೇಳಿ."
                  : spokenLang === 'hi'
                  ? "मैंने बुकिंग रद्द कर दी है। तैयार होने पर 'बुक करो' कहें।"
                  : "I cancelled the booking. Say 'book it' when you're ready.";
              setLastSpoken(cancelMsg);
              speakWithBrowserTTS(cancelMsg, spokenLang);
            }
          }, 30000);
        } else {
          if (confirmationTimeoutRef.current) {
            clearTimeout(confirmationTimeoutRef.current);
            confirmationTimeoutRef.current = null;
          }
        }

        speakWithBrowserTTS(spoken, spokenLang);
      } else {
        // Fallback if handlers not provided
        const result = await api.processVoice(transcript, context);
        setLastSpoken(result.intentResult.spokenResponse);
        const spokenLang: ActiveLanguage =
          (result.intentResult.language as ActiveLanguage) ||
          (normalizedData.language as ActiveLanguage) ||
          'en';
        speakWithBrowserTTS(result.intentResult.spokenResponse, spokenLang);
        if (onVoiceResult) onVoiceResult(result);
      }
    } catch (err: any) {
      console.error('Voice processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const {
    state,
    mode,
    liveTranscript,
    error,
    startListening,
    stopListening,
    resetState
  } = useVoice(langCode, handleFinalTranscript);

  // Barge-in: if user starts speaking or clicks mic while TTS is talking
  const handleToggleMic = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    if (state === 'listening' || state === 'recording_fallback') {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleStopAll = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    stopListening();
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedFallbackText.trim()) return;
    const q = typedFallbackText.trim();
    setTypedFallbackText('');
    handleFinalTranscript(q);
  };

  const handleAcceptDidYouMean = () => {
    if (!didYouMean) return;
    onLanguageChange(didYouMean.lang);
    handleFinalTranscript(didYouMean.query);
    setDidYouMean(null);
  };

  const isBusy = state === 'listening' || state === 'recording_fallback' || isProcessing || isSpeaking;

  // Active status label
  const getStatusBadge = () => {
    if (isProcessing) {
      return { text: 'Thinking...', color: 'var(--accent-gold)', bg: 'rgba(245, 158, 11, 0.15)', icon: <RefreshCw size={12} className="mic-active-pulse" /> };
    }
    if (isSpeaking) {
      return { text: 'Speaking...', color: 'var(--accent-green)', bg: 'rgba(16, 185, 129, 0.15)', icon: <Volume2 size={12} className="mic-active-pulse" /> };
    }
    if (state === 'listening') {
      return { text: 'Listening...', color: 'var(--accent-rose)', bg: 'rgba(239, 68, 68, 0.15)', icon: <Mic size={12} className="mic-active-pulse" /> };
    }
    if (state === 'recording_fallback') {
      return { text: 'Recording...', color: 'var(--accent-gold)', bg: 'rgba(245, 158, 11, 0.15)', icon: <Radio size={12} className="mic-active-pulse" /> };
    }
    return null;
  };

  const statusBadge = getStatusBadge();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
      {/* Live Transcript / Bubble / Feedback */}
      {(liveTranscript || isProcessing || lastSpoken || error || didYouMean || statusBadge) && (
        <div
          className="glass-panel"
          style={{
            padding: '14px 20px',
            maxWidth: '560px',
            width: '92%',
            textAlign: 'center',
            fontSize: '0.92rem',
            border: error
              ? '1px solid var(--accent-rose)'
              : state === 'listening' || state === 'recording_fallback'
              ? '1px solid var(--accent-rose)'
              : isSpeaking
              ? '1px solid var(--accent-green)'
              : '1px solid var(--border-focus)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          {/* Status Header Badge */}
          {statusBadge && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: statusBadge.bg,
                  color: statusBadge.color,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                {statusBadge.icon}
                {statusBadge.text}
              </span>
            </div>
          )}

          {/* Live Streaming Speech Preview */}
          {liveTranscript && (
            <div
              style={{
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              <Sparkles size={16} color="var(--primary)" />
              <span>"{liveTranscript}"</span>
            </div>
          )}

          {/* Assistant Reply */}
          {!isProcessing && lastSpoken && (
            <div
              style={{
                color: 'var(--text-main)',
                marginTop: liveTranscript ? '8px' : '0',
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                lineHeight: 1.45
              }}
            >
              <Volume2 size={16} color="var(--accent-green)" />
              <span>{lastSpoken}</span>
            </div>
          )}

          {/* Did You Mean Language / Query Confirmation */}
          {didYouMean && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                fontSize: '0.84rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left' }}>
                <HelpCircle size={15} color="var(--primary)" />
                <span>
                  Did you mean in <strong>{didYouMean.lang === 'kn' ? 'ಕನ್ನಡ (Kannada)' : 'हिन्दी (Hindi)'}</strong>?
                </span>
              </div>
              <button
                onClick={handleAcceptDidYouMean}
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Yes, Search
              </button>
            </div>
          )}

          {/* Friendly Error Message & Try Again Button */}
          {error && (
            <div
              style={{
                marginTop: '6px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-rose)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{error.userMessage}</span>
              </div>
              {error.canRetry && (
                <button
                  onClick={() => {
                    resetState();
                    startListening();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--accent-rose)',
                    color: '#fff',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={12} /> Try Again
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mic Controls Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Hands-Free Voice Mode Toggle Switch */}
        <button
          onClick={toggleVoiceMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '20px',
            background: isVoiceModeActive ? 'rgba(16, 185, 129, 0.18)' : 'var(--bg-subtle)',
            border: isVoiceModeActive ? '1px solid var(--accent-green)' : '1px solid var(--border-color)',
            color: isVoiceModeActive ? 'var(--accent-green)' : 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="In Voice Mode, VoiceCart listens continuously turn-by-turn hands-free"
        >
          <Zap size={14} />
          <span>Voice Mode: {isVoiceModeActive ? 'ON' : 'OFF'}</span>
        </button>

        {/* Language Pill Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '4px 8px',
            gap: '4px'
          }}
        >
          <Globe size={14} color="var(--text-muted)" />
          <button
            onClick={() => {
              onLanguageChange('auto');
              resetState();
            }}
            style={{
              background: language === 'auto' ? 'var(--primary)' : 'transparent',
              color: language === 'auto' ? '#fff' : 'var(--text-main)',
              border: 'none',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Auto
          </button>
          <button
            onClick={() => {
              onLanguageChange('en');
              resetState();
            }}
            style={{
              background: language === 'en' ? 'var(--primary)' : 'transparent',
              color: language === 'en' ? '#fff' : 'var(--text-main)',
              border: 'none',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            EN
          </button>
          <button
            onClick={() => {
              onLanguageChange('hi');
              resetState();
            }}
            style={{
              background: language === 'hi' ? 'var(--primary)' : 'transparent',
              color: language === 'hi' ? '#fff' : 'var(--text-main)',
              border: 'none',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            हिन्दी
          </button>
          <button
            onClick={() => {
              onLanguageChange('kn');
              resetState();
            }}
            style={{
              background: language === 'kn' ? 'var(--primary)' : 'transparent',
              color: language === 'kn' ? '#fff' : 'var(--text-main)',
              border: 'none',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: "'Noto Sans Kannada', sans-serif"
            }}
          >
            ಕನ್ನಡ
          </button>
        </div>

        {/* Large Floating Mic Button with Dynamic Pulse & Barge-in */}
        <button
          onClick={handleToggleMic}
          className={state === 'listening' || state === 'recording_fallback' ? 'mic-active-pulse' : ''}
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background:
              state === 'recording_fallback'
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : state === 'listening'
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : isSpeaking
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : error
                ? 'linear-gradient(135deg, #64748b, #475569)'
                : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            border:
              state === 'listening'
                ? '3px solid #fecaca'
                : isSpeaking
                ? '3px solid #a7f3d0'
                : state === 'recording_fallback'
                ? '3px solid #fef3c7'
                : '3px solid rgba(255,255,255,0.25)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow:
              state === 'listening'
                ? '0 0 30px rgba(239, 68, 68, 0.6)'
                : isSpeaking
                ? '0 0 30px rgba(16, 185, 129, 0.6)'
                : state === 'recording_fallback'
                ? '0 0 30px rgba(245, 158, 11, 0.6)'
                : '0 0 25px var(--primary-glow)',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          title={
            state === 'listening' || state === 'recording_fallback'
              ? 'Listening... Click to stop'
              : isSpeaking
              ? 'Speaking... Click to interrupt (Barge-in)'
              : `${t.tapToSpeak} (${langCode})`
          }
        >
          {state === 'listening' ? (
            <Mic size={30} />
          ) : isSpeaking ? (
            <Volume2 size={30} />
          ) : state === 'recording_fallback' ? (
            <Radio size={28} className="mic-active-pulse" />
          ) : error ? (
            <MicOff size={26} />
          ) : (
            <Mic size={28} />
          )}
        </button>

        {/* Stop Button */}
        {(state === 'listening' || state === 'recording_fallback' || isSpeaking) && (
          <button
            onClick={handleStopAll}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--accent-rose)',
              color: 'var(--accent-rose)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Stop listening and cancel speech"
          >
            <Square size={16} />
          </button>
        )}

        {/* Waveform visualizer */}
        <AudioWaveform
          isActive={state === 'listening' || state === 'recording_fallback' || isProcessing || isSpeaking}
          color={
            isSpeaking
              ? '#10b981'
              : state === 'recording_fallback'
              ? '#f59e0b'
              : state === 'listening'
              ? '#ef4444'
              : 'var(--primary)'
          }
        />
      </div>

      {/* Mode / Language Status Indicator */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {state === 'listening' ? (
          <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>
            {language === 'kn'
              ? '🎙️ ಕನ್ನಡದಲ್ಲಿ ಆಲಿಸಲಾಗುತ್ತಿದೆ... (kn-IN)'
              : language === 'hi'
              ? '🎙️ हिन्दी में सुन रहे हैं... (hi-IN)'
              : '🎙️ Listening in English... (en-IN)'}
          </span>
        ) : state === 'recording_fallback' ? (
          <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
            ⏺️ Recording audio fallback (Upload to cloud STT)... Click to stop
          </span>
        ) : isSpeaking ? (
          <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
            🔊 Speaking... (Tap mic or speak to interrupt)
          </span>
        ) : (
          isVoiceModeActive
            ? '⚡ Hands-free Voice Mode ON: speak anytime'
            : t.listeningHint
        )}
      </div>

      {/* Typed Fallback Input Bar */}
      <form
        onSubmit={handleTypedSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          maxWidth: '460px',
          width: '90%',
          marginTop: '4px'
        }}
      >
        <input
          type="text"
          value={typedFallbackText}
          onChange={(e) => setTypedFallbackText(e.target.value)}
          placeholder={
            language === 'kn'
              ? 'ಅಥವಾ ಧ್ವನಿ ಬದಲಿಗೆ ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ (e.g. boAt earbuds under 2000)...'
              : language === 'hi'
              ? 'या आवाज़ के बजाय यहाँ टाइप करें (e.g. boAt earbuds under 2000)...'
              : 'Or type your shopping query (e.g. boAt earbuds under 2000)...'
          }
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: '10px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!typedFallbackText.trim() || isBusy}
          style={{
            background: typedFallbackText.trim() ? 'var(--primary)' : 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            color: typedFallbackText.trim() ? '#fff' : 'var(--text-muted)',
            padding: '8px 12px',
            borderRadius: '10px',
            cursor: typedFallbackText.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
