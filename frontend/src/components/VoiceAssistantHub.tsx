import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Zap,
  Globe,
  Radio,
  CheckCircle2,
  RefreshCw,
  ShoppingCart,
  ExternalLink,
  ChevronRight,
  Award,
  Star,
  Tag
} from 'lucide-react';
import { Product, SearchResponse } from '../types';
import { SupportedLanguage, ActiveLanguage, translations } from '../i18n/translations';
import { DispatcherHandlers, actionDispatcher } from '../voice/dispatcher';
import { commandRouter } from '../voice/commandRouter';
import { voiceStore } from '../voice/voiceStore';
import { useVoice, VoiceState } from '../hooks/useVoice';
import { AudioWaveform } from './AudioWaveform';
import { ProductImage } from './ProductImage';

interface Props {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  handlers: DispatcherHandlers;
  searchResponse: SearchResponse | null;
  recommendedProduct?: Product | null;
  onAddToCart: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const VoiceAssistantHub: React.FC<Props> = ({
  language,
  onLanguageChange,
  handlers,
  searchResponse,
  recommendedProduct,
  onAddToCart,
  onSelectProduct,
  onSearch,
  isLoading = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [lastReply, setLastReply] = useState<string>('');
  const [isVoiceModeActive, setIsVoiceModeActive] = useState<boolean>(() => {
    return localStorage.getItem('voicecart_voice_mode') === 'true';
  });

  const activeLang: ActiveLanguage = language === 'auto' ? 'en' : language;
  const t = translations[activeLang] || translations.en;
  const langCode = language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

  // Browser Text-to-Speech
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
        if (isVoiceModeActive) {
          setTimeout(() => startListening(), 400);
        }
      };

      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  }, [isVoiceModeActive]);

  // Voice transcript handler
  const handleFinalTranscript = useCallback(
    async (transcript: string) => {
      if (!transcript.trim()) return;
      setLastCommand(transcript);
      setIsProcessing(true);

      try {
        const currentContext = voiceStore.getContext();
        const targetLang: SupportedLanguage = language === 'auto' ? 'en' : language;
        const commandResult = await commandRouter.route(transcript, currentContext, targetLang);

        if (commandResult.action === 'stop') {
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
          setIsSpeaking(false);
          stopListening();
          setLastReply(commandResult.reply || 'Voice stopped.');
          return;
        }

        const dispatchResult = await actionDispatcher.dispatch(commandResult, handlers, transcript);
        const spoken = dispatchResult.spokenResponse || commandResult.reply || 'Command processed.';
        setLastReply(spoken);

        const spokenLang: ActiveLanguage =
          commandResult.language && commandResult.language !== 'auto'
            ? (commandResult.language as ActiveLanguage)
            : 'en';

        speakWithBrowserTTS(spoken, spokenLang);
      } catch (err) {
        console.error('Voice processing error in VoiceAssistantHub:', err);
        setLastReply('Sorry, I encountered an issue executing that command. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [handlers, language, speakWithBrowserTTS]
  );

  const { state: voiceState, liveTranscript, error: voiceError, startListening, stopListening, resetState } = useVoice(
    langCode,
    (transcript) => handleFinalTranscript(transcript)
  );

  const isListening = voiceState === 'listening' || voiceState === 'recording_fallback';

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      startListening();
    }
  };

  const handleStopAll = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    stopListening();
  };

  const toggleVoiceMode = () => {
    const next = !isVoiceModeActive;
    setIsVoiceModeActive(next);
    localStorage.setItem('voicecart_voice_mode', String(next));
    if (!next) {
      handleStopAll();
    } else {
      startListening();
    }
  };

  // Synchronize reply text from searchResponse
  useEffect(() => {
    if (searchResponse?.replyText) {
      setLastReply(searchResponse.replyText);
    }
    if (searchResponse?.query && !lastCommand) {
      setLastCommand(searchResponse.query);
    }
  }, [searchResponse]);

  // Active top recommended product
  const activeRecommendation =
    recommendedProduct ||
    searchResponse?.topRecommendations?.bestOverall ||
    voiceStore.getState().activeSearch?.recommendation ||
    (searchResponse?.products && searchResponse.products.length > 0 ? searchResponse.products[0] : null);

  const quickVoicePrompts = [
    { label: '🎧 Best earbuds under ₹2000', query: 'wireless earbuds under 2000' },
    { label: '📱 Top 5G smartphones', query: '5g smartphones' },
    { label: '👕 Casual cotton shirts', query: 'cotton shirts for men' },
    { label: '⚡ Electronics deals', query: 'electronics deals' },
    { label: '🛒 Open my shopping cart', query: 'open cart' }
  ];

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
        border: '1.5px solid #c7dcff',
        borderRadius: '14px',
        padding: '18px 22px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(40, 116, 240, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative top-right accent */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(40, 116, 240, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* 1. Header Bar: Status Indicator, Voice Mode Toggle, Languages */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px',
          borderBottom: '1px solid #e8f0fe',
          paddingBottom: '12px'
        }}
      >
        {/* Assistant Title & Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#2874f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(40, 116, 240, 0.3)'
            }}
          >
            <Mic size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#131921', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>VoiceCart AI Assistant</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: isListening
                    ? '#fee2e2'
                    : isProcessing
                    ? '#fef3c7'
                    : isSpeaking
                    ? '#dcfce7'
                    : '#e0f2fe',
                  color: isListening
                    ? '#dc2626'
                    : isProcessing
                    ? '#d97706'
                    : isSpeaking
                    ? '#16a34a'
                    : '#0284c7',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isListening
                      ? '#dc2626'
                      : isProcessing
                      ? '#d97706'
                      : isSpeaking
                      ? '#16a34a'
                      : '#0284c7',
                    animation: isListening || isSpeaking ? 'pulse-ring 1.5s infinite' : 'none'
                  }}
                />
                {isListening
                  ? 'Listening...'
                  : isProcessing
                  ? 'Searching stores...'
                  : isSpeaking
                  ? 'Speaking response...'
                  : 'Ready'}
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Multi-store voice comparison engine (Amazon • Flipkart • Meesho)
            </div>
          </div>
        </div>

        {/* Controls: Voice Mode Toggle & Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Hands-Free Voice Mode */}
          <button
            type="button"
            onClick={toggleVoiceMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '20px',
              border: isVoiceModeActive ? '1px solid #16a34a' : '1px solid #cbd5e1',
              background: isVoiceModeActive ? '#dcfce7' : '#ffffff',
              color: isVoiceModeActive ? '#15803d' : '#475569',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="In Voice Mode, VoiceCart listens continuously turn-by-turn hands-free"
          >
            <Zap size={13} color={isVoiceModeActive ? '#15803d' : '#64748b'} />
            <span>Continuous: {isVoiceModeActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Languages */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '2px 4px', gap: '2px' }}>
            <Globe size={12} color="#64748b" style={{ marginLeft: '4px' }} />
            {[
              { code: 'auto', label: 'Auto' },
              { code: 'en', label: 'EN' },
              { code: 'hi', label: 'हिन्दी' },
              { code: 'kn', label: 'ಕನ್ನಡ' }
            ].map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  onLanguageChange(item.code as SupportedLanguage);
                  voiceStore.setLanguage(item.code as SupportedLanguage);
                }}
                style={{
                  background: language === item.code ? '#2874f0' : 'transparent',
                  color: language === item.code ? '#ffffff' : '#334155',
                  border: 'none',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Voice Assist Content Area */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Left / Center: Interactive Mic Button & Audio Waveform / Transcript */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 320px' }}>
          {/* Prominent Mic Button */}
          <button
            type="button"
            onClick={handleToggleMic}
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: isListening
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : isProcessing
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : isSpeaking
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #2874f0, #1c62d6)',
              border: isListening ? '3px solid #fecaca' : isSpeaking ? '3px solid #bbf7d0' : '3px solid #ffffff',
              boxShadow: isListening
                ? '0 0 24px rgba(239, 68, 68, 0.6)'
                : isSpeaking
                ? '0 0 20px rgba(16, 185, 129, 0.5)'
                : '0 4px 16px rgba(40, 116, 240, 0.35)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
            title={
              isListening
                ? 'Listening... Click to stop'
                : isSpeaking
                ? 'Speaking... Click to interrupt (Barge-in)'
                : `Tap to Speak (${langCode})`
            }
          >
            {isListening ? (
              <Mic size={26} className="mic-active-pulse" />
            ) : isProcessing ? (
              <RefreshCw size={24} className="mic-active-pulse" />
            ) : isSpeaking ? (
              <Volume2 size={26} />
            ) : (
              <Mic size={26} />
            )}
          </button>

          {/* Speech Feedback / Status Bubble */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              {isListening ? (
                <>
                  <AudioWaveform isActive={true} color="#ef4444" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#dc2626' }}>Listening to you...</span>
                </>
              ) : isProcessing ? (
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d97706' }}>
                  Processing command & ranking prices...
                </span>
              ) : isSpeaking ? (
                <>
                  <AudioWaveform isActive={true} color="#16a34a" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803d' }}>VoiceCart Speaking</span>
                  <button
                    type="button"
                    onClick={handleStopAll}
                    style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Stop
                  </button>
                </>
              ) : (
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b' }}>
                  Tap mic or speak: &quot;Find boAt earbuds&quot;, &quot;Buy this&quot;...
                </span>
              )}
            </div>

            {/* Live Streaming Speech Preview */}
            {liveTranscript ? (
              <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, background: '#ffffff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                &ldquo;{liveTranscript}&rdquo;
              </div>
            ) : null}

            {/* Voice Error notice */}
            {voiceError && !liveTranscript && (
              <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '2px' }}>
                {voiceError.userMessage}
              </div>
            )}
          </div>
        </div>

        {/* 3. Live Command & Assistant Response Box (Displayed up to command & response complete) */}
        {(lastCommand || lastReply) && (
          <div
            style={{
              flex: '1 1 360px',
              background: '#ffffff',
              borderRadius: '10px',
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              minWidth: '260px'
            }}
          >
            {lastCommand && (
              <div style={{ marginBottom: '6px', fontSize: '0.82rem', color: '#475569' }}>
                <strong style={{ color: '#0f172a' }}>🗣️ You said: </strong>
                <span>&ldquo;{lastCommand}&rdquo;</span>
              </div>
            )}

            {lastReply && (
              <div style={{ fontSize: '0.84rem', color: '#1e293b', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <span style={{ color: '#2874f0', fontWeight: 700, flexShrink: 0 }}>🤖 Assistant:</span>
                <span style={{ flex: 1 }}>{lastReply}</span>
                <button
                  type="button"
                  onClick={() => speakWithBrowserTTS(lastReply, activeLang)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2874f0',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                  title="Replay spoken response"
                >
                  <Volume2 size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Voice Recommend Product Card (Always shown when AI has top match) */}
      {activeRecommendation && (
        <div
          style={{
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid #e8f0fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #dbeafe'
          }}
        >
          {/* Recommendation Info Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 320px', minWidth: '240px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '6px',
                overflow: 'hidden',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid #e2e8f0'
              }}
            >
              <ProductImage
                src={activeRecommendation.imageUrl}
                alt={activeRecommendation.title}
                store={activeRecommendation.store}
                productId={activeRecommendation.productId}
                style={{ maxHeight: '54px', maxWidth: '54px', objectFit: 'contain' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <Award size={11} /> AI Top Recommendation
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '3px',
                    background: activeRecommendation.store === 'amazon' ? '#ff9900' : activeRecommendation.store === 'flipkart' ? '#2874f0' : '#f43397',
                    color: '#ffffff'
                  }}
                >
                  {activeRecommendation.store.toUpperCase()}
                </span>
              </div>

              <div
                onClick={() => onSelectProduct && onSelectProduct(activeRecommendation)}
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  maxWidth: '420px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={activeRecommendation.title}
              >
                {activeRecommendation.title}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  ₹{activeRecommendation.price.toLocaleString('en-IN')}
                </span>
                {activeRecommendation.mrp > activeRecommendation.price && (
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                    ₹{activeRecommendation.mrp.toLocaleString('en-IN')}
                  </span>
                )}
                {activeRecommendation.discountPct > 0 && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
                    {activeRecommendation.discountPct}% off
                  </span>
                )}
                {activeRecommendation.rating > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#475569', marginLeft: '4px' }}>
                    ★ {activeRecommendation.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onAddToCart(activeRecommendation, 1)}
              style={{
                background: '#2874f0',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(40, 116, 240, 0.25)'
              }}
            >
              <ShoppingCart size={14} /> Add to Cart
            </button>

            {onSelectProduct && (
              <button
                type="button"
                onClick={() => onSelectProduct(activeRecommendation)}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>View</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. Quick Voice Command Suggestion Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: '4px' }}>
          Try saying:
        </span>
        {quickVoicePrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSearch(p.query);
              handleFinalTranscript(p.query);
            }}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '3px 10px',
              borderRadius: '14px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2874f0';
              e.currentTarget.style.color = '#2874f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.color = '#334155';
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </section>
  );
};
