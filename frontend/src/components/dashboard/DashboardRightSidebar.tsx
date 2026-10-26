import React, { useState, useEffect, useCallback } from 'react';
import {
  Mic,
  Bot,
  ArrowRight,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  Sun,
  Moon,
  Trash2
} from 'lucide-react';
import { Product, CartItem, SearchResponse } from '../../types';
import { SupportedLanguage } from '../../i18n/translations';
import { DispatcherHandlers } from '../../voice/dispatcher';
import { useVoice } from '../../hooks/useVoice';
import { voiceStore } from '../../voice/voiceStore';
import { commandRouter } from '../../voice/commandRouter';
import { actionDispatcher } from '../../voice/dispatcher';
import { ttsService } from '../../voice/tts';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  handlers: DispatcherHandlers;
  searchResponse: SearchResponse | null;
  recommendedProduct?: Product | null;
  selectedProduct?: Product | null;
  cart: CartItem[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateToCart: () => void;
  onNavigateToComparison: (productId?: string) => void;
  onSearchPrompt: (query: string) => void;
}

export const DashboardRightSidebar: React.FC<Props> = ({
  language,
  onLanguageChange,
  handlers,
  cart,
  onAddToCart,
  onNavigateToCart,
  onSearchPrompt
}) => {
  const { theme, setTheme } = useTheme();
  const [quantities, setQuantities] = useState<Record<string, number>>({
    'cart-demo-iphone15': 1,
    'cart-demo-nike-revolution7': 1,
    'cart-demo-sony-headphones': 1
  });

  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Subscribe to central TTS speaking changes
  useEffect(() => {
    const unsub = ttsService.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return unsub;
  }, []);

  // Auto Voice Command Detect state (Enabled by default as requested)
  const [autoDetect, setAutoDetect] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('voicecart_auto_detect');
      return stored !== 'false';
    } catch {
      return true;
    }
  });

  const langCode = language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
  const {
    state: voiceState,
    liveTranscript,
    startListening,
    stopListening,
    setAutoListen
  } = useVoice(
    langCode,
    (transcript: string) => {
      processVoiceCommand(transcript);
    },
    { autoListen: autoDetect }
  );

  const isListening = voiceState === 'listening';

  // Automatically start continuous auto-listening on mount if enabled
  useEffect(() => {
    if (autoDetect) {
      const timer = setTimeout(() => {
        startListening();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [autoDetect, startListening]);

  const handleToggleAutoDetect = (forceState?: boolean) => {
    const nextState = forceState !== undefined ? forceState : !autoDetect;
    setAutoDetect(nextState);
    setAutoListen(nextState);
    try {
      localStorage.setItem('voicecart_auto_detect', nextState ? 'true' : 'false');
    } catch {}

    if (nextState) {
      ttsService.speak('Auto voice command detect enabled. You can speak commands anytime.', language as any);
      startListening();
    } else {
      ttsService.stop();
      stopListening();
    }
  };

  // Process voice command through NLP Router -> Action Dispatcher -> TTS Speech
  const processVoiceCommand = useCallback(
    async (input: string) => {
      const cleanInput = input.trim();
      if (!cleanInput) return;

      // Handle voice command to toggle auto detect
      if (/\b(enable auto voice|turn on auto voice|start auto voice|enable auto detect|turn on auto detect|start auto detect)\b/i.test(cleanInput)) {
        handleToggleAutoDetect(true);
        return;
      }
      if (/\b(disable auto voice|turn off auto voice|stop auto voice|disable auto detect|turn off auto detect|stop auto detect)\b/i.test(cleanInput)) {
        handleToggleAutoDetect(false);
        return;
      }

      // Barge-in: cancel any running speech synthesis
      ttsService.stop();
      setLastCommand(cleanInput);
      setIsProcessing(true);

      try {
        const currentContext = voiceStore.getContext();
        const targetLang: SupportedLanguage = language === 'auto' ? 'en' : language;
        const commandResult = await commandRouter.route(cleanInput, currentContext, targetLang);

        // Handle voice STOP command
        if (commandResult.action === 'stop') {
          ttsService.stop();
          setAssistantReply(commandResult.reply || 'Voice stopped.');
          return;
        }

        const dispatchResult = await actionDispatcher.dispatch(commandResult, handlers, cleanInput);
        const spoken = dispatchResult.spokenResponse || commandResult.reply || 'Command processed.';
        setAssistantReply(spoken);

        const spokenLang = (commandResult.language && commandResult.language !== 'auto'
          ? commandResult.language
          : targetLang) as 'en' | 'hi' | 'kn';

        // Play voice response audio aloud
        ttsService.speak(spoken, spokenLang);
      } catch (err) {
        console.error('Voice routing error in right sidebar:', err);
        const fallbackReply = 'Sorry, I had trouble processing that voice command. Please try again.';
        setAssistantReply(fallbackReply);
        ttsService.speak(fallbackReply, 'en');
      } finally {
        setIsProcessing(false);
      }
    },
    [handlers, language, autoDetect]
  );

  const handleToggleMic = () => {
    if (isSpeaking) {
      ttsService.stop();
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      ttsService.stop();
      startListening();
    }
  };

  const voicePrompts = [
    'Show me best laptops under 60000',
    'Compare iPhone 15 on Amazon, Flipkart',
    'Find running shoes with good rating',
    'Add headphones to cart',
    "What's the order status?"
  ];

  // Default display items matching reference image
  const defaultCartItems = [
    {
      id: 'cart-demo-iphone15',
      title: 'iPhone 15 (128GB)',
      price: 64999,
      imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&auto=format&fit=crop&q=80'
    },
    {
      id: 'cart-demo-nike-revolution7',
      title: 'Nike Revolution 7',
      price: 4499,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80'
    },
    {
      id: 'cart-demo-sony-headphones',
      title: 'Sony WH-CH720N',
      price: 8990,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80'
    }
  ];

  const updateQty = (id: string, delta: number) => {
    setQuantities((prev) => {
      const cur = prev[id] || 1;
      const next = Math.max(1, cur + delta);
      return { ...prev, [id]: next };
    });
  };

  // If real cart has items, use real cart, otherwise display reference items
  const hasRealItems = cart && cart.length > 0;
  const displayCartItems = hasRealItems
    ? cart.map((ci) => ({
        id: ci.id || ci.product?.productId || 'cart-item',
        title: ci.product?.title || 'Product',
        price: ci.product?.price || ci.currentPrice || 0,
        imageUrl: ci.product?.imageUrl || '',
        quantity: ci.quantity
      }))
    : defaultCartItems.map((di) => ({
        ...di,
        quantity: quantities[di.id] || 1
      }));

  const totalAmount = displayCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = displayCartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
        flexShrink: 0
      }}
    >
      {/* 1. Voice Assistant Card (Dark sleek card matching reference image) */}
      <div
        style={{
          background: '#0b1120',
          borderRadius: '20px',
          padding: '22px 20px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          color: '#ffffff'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.25)'
              }}
            >
              <img
                src="/logo.png"
                alt="Voice Assistant"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                Voice Assistant
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Ask me anything...
              </div>
            </div>
          </div>

          {/* Auto Voice Detect Toggle Button */}
          <button
            type="button"
            id="toggle-auto-voice-btn"
            onClick={() => handleToggleAutoDetect()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: autoDetect ? '#34d399' : '#94a3b8',
              background: autoDetect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              border: autoDetect ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
              padding: '4px 10px',
              borderRadius: '20px',
              cursor: 'pointer',
              boxShadow: autoDetect ? '0 0 10px rgba(16, 185, 129, 0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
            title={autoDetect ? 'Auto Voice Detect is ON. Click to turn off.' : 'Auto Voice Detect is OFF. Click to turn on.'}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: autoDetect ? '#10b981' : '#64748b',
                boxShadow: autoDetect ? '0 0 8px #10b981' : 'none'
              }}
            />
            <span>{autoDetect ? 'Auto: ON' : 'Auto: OFF'}</span>
          </button>
        </div>

        {/* Hands-free Voice Detect Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: autoDetect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.6)',
            border: autoDetect ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '8px 12px',
            marginBottom: '14px',
            fontSize: '0.75rem',
            color: autoDetect ? '#34d399' : '#94a3b8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} color={autoDetect ? '#10b981' : '#38bdf8'} />
            <span style={{ fontWeight: 600 }}>
              {autoDetect ? 'Hands-Free Voice Detect Active' : 'Push-to-Talk Voice Mode'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleToggleAutoDetect()}
            style={{
              fontSize: '0.68rem',
              background: autoDetect ? '#10b981' : '#334155',
              color: '#ffffff',
              border: 'none',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {autoDetect ? (isListening ? 'LISTENING' : 'READY') : 'ENABLE'}
          </button>
        </div>

        {/* 5 Speech Prompts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: assistantReply || isListening ? '14px' : '22px' }}>
          {voicePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => processVoiceCommand(prompt)}
              style={{
                textAlign: 'left',
                background: lastCommand === prompt ? 'rgba(56, 189, 248, 0.18)' : 'rgba(30, 41, 59, 0.7)',
                border: lastCommand === prompt ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '9px 12px',
                fontSize: '0.76rem',
                color: lastCommand === prompt ? '#ffffff' : '#cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1e293b';
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                if (lastCommand !== prompt) {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#cbd5e1';
                }
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Live Listening Transcription Pill */}
        {isListening && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.78rem',
              color: '#34d399',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.2)'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
                animation: 'pulse 1s infinite'
              }}
            />
            <span style={{ fontWeight: 600 }}>
              {liveTranscript ? `Hearing: "${liveTranscript}"` : 'Listening... Speak now'}
            </span>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && !isListening && (
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.78rem',
              color: '#38bdf8'
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            <span>Processing your voice request...</span>
          </div>
        )}

        {/* Voice Assistant Response Bubble */}
        {assistantReply && !isProcessing && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: isSpeaking ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '18px',
              boxShadow: isSpeaking
                ? '0 0 20px rgba(56, 189, 248, 0.3)'
                : '0 4px 14px rgba(0,0,0,0.25)',
              transition: 'all 0.25s ease'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bot size={15} color="#38bdf8" />
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.3px' }}>
                  {isSpeaking ? 'VoiceCart Speaking...' : 'VoiceCart Response'}
                </span>
              </div>

              {isSpeaking ? (
                <button
                  type="button"
                  onClick={() => ttsService.stop()}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <VolumeX size={12} />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => ttsService.speak(assistantReply, language as any)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Volume2 size={12} />
                  <span>Replay</span>
                </button>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', color: '#f1f5f9', lineHeight: 1.48 }}>
              {assistantReply}
            </div>
          </div>
        )}

        {/* Dynamic Waveform + Big Glowing Mic Button in Center */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '6px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              width: '100%',
              marginBottom: '10px'
            }}
          >
            {/* Left Sound Wave */}
            <svg
              width="44"
              height="24"
              viewBox="0 0 44 24"
              style={{
                opacity: isListening || isSpeaking ? 1 : 0.65,
                filter: isListening
                  ? autoDetect
                    ? 'drop-shadow(0 0 6px #10b981)'
                    : 'drop-shadow(0 0 6px #ef4444)'
                  : isSpeaking
                  ? 'drop-shadow(0 0 6px #38bdf8)'
                  : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <path
                d="M2,12 Q6,2 10,12 T18,12 T26,12 T34,12 T42,12"
                fill="none"
                stroke={isListening ? (autoDetect ? '#10b981' : '#ef4444') : '#38bdf8'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Circular Mic Button */}
            <button
              id="right-sidebar-voice-mic-btn"
              type="button"
              onClick={handleToggleMic}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: isListening
                  ? autoDetect
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : isSpeaking
                  ? 'linear-gradient(135deg, #06b6d4, #0284c7)'
                  : autoDetect
                  ? 'linear-gradient(135deg, #059669, #0284c7)'
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isListening
                  ? autoDetect
                    ? '0 0 30px rgba(16, 185, 129, 0.75)'
                    : '0 0 28px rgba(239, 68, 68, 0.7)'
                  : isSpeaking
                  ? '0 0 28px rgba(6, 182, 212, 0.7)'
                  : autoDetect
                  ? '0 0 22px rgba(16, 185, 129, 0.45), inset 0 0 10px rgba(255, 255, 255, 0.35)'
                  : '0 0 25px rgba(37, 99, 235, 0.55), inset 0 0 10px rgba(255, 255, 255, 0.35)',
                transition: 'transform 0.15s ease, box-shadow 0.25s ease'
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              title={autoDetect ? (isListening ? 'Auto listening active. Click to pause.' : 'Auto detect paused. Click to listen.') : (isListening ? 'Listening. Click to stop.' : 'Click to speak')}
            >
              {isSpeaking ? (
                <Volume2 size={26} color="#ffffff" className="mic-active-pulse" />
              ) : (
                <Mic size={26} color="#ffffff" className={isListening ? 'mic-active-pulse' : ''} />
              )}
            </button>

            {/* Right Sound Wave */}
            <svg
              width="44"
              height="24"
              viewBox="0 0 44 24"
              style={{
                opacity: isListening || isSpeaking ? 1 : 0.65,
                filter: isListening
                  ? autoDetect
                    ? 'drop-shadow(0 0 6px #10b981)'
                    : 'drop-shadow(0 0 6px #ef4444)'
                  : isSpeaking
                  ? 'drop-shadow(0 0 6px #38bdf8)'
                  : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <path
                d="M2,12 Q6,22 10,12 T18,12 T26,12 T34,12 T42,12"
                fill="none"
                stroke={isListening ? (autoDetect ? '#10b981' : '#ef4444') : '#38bdf8'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <span style={{ fontSize: '0.78rem', color: isSpeaking ? '#38bdf8' : isListening ? '#34d399' : '#94a3b8', fontWeight: 600 }}>
            {isListening
              ? (liveTranscript ? `Hearing: "${liveTranscript}"` : autoDetect ? '🟢 Auto detecting commands... Speak anytime' : 'Listening... Speak now')
              : isSpeaking
              ? 'VoiceCart Speaking... (Tap to stop)'
              : isProcessing
              ? 'Processing request...'
              : autoDetect
              ? '🟢 Auto detect ready (Speak anytime or tap)'
              : 'Tap to speak'}
          </span>
        </div>
      </div>

      {/* 2. Your Cart Card (Clean white card matching reference image) */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Your Cart ({totalCount})
          </h3>

          <button
            type="button"
            onClick={onNavigateToCart}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 4px'
            }}
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Cart Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
          {displayCartItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>

              {/* Title & Price */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={item.title}
                >
                  {item.title}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  ₹{item.price.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Quantity Stepper & Delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--bg-subtle, #f1f5f9)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: '6px',
                    padding: '2px 6px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, -1)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px'
                    }}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, minWidth: '14px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, 1)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px'
                    }}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => updateQty(item.id, -item.quantity)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Remove item"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border-color, #e2e8f0)', margin: '4px 0 16px 0' }} />

        {/* Total & Checkout Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}
        >
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Total
          </span>
          <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main)' }}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <button
          type="button"
          onClick={onNavigateToCart}
          style={{
            width: '100%',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            transition: 'background 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
        >
          <span>Go to Checkout</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* 3. Smart Shopping with Voice Promo Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
          borderRadius: '18px',
          padding: '18px 16px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(255, 255, 255, 0.35)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              flexShrink: 0
            }}
          >
            <Mic size={20} color="#ffffff" />
          </div>
          <div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.2px' }}>
              Smart Shopping with Voice
            </h4>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.35 }}>
              Just speak. We&apos;ll find it for you!
            </p>
          </div>
        </div>
      </div>

      {/* 4. Language / Theme Card */}
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '18px',
          padding: '18px 16px',
          boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.04))',
          border: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
          Language / Theme
        </div>

        {/* Language Radio Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'en', label: 'English' },
            { id: 'kn', label: 'ಕನ್ನಡ' },
            { id: 'hi', label: 'हिन्दी' }
          ].map((l) => {
            const isSelected = language === l.id;
            return (
              <label
                key={l.id}
                onClick={() => onLanguageChange(l.id as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--text-main, #0f172a)' : 'var(--text-secondary, #64748b)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: isSelected ? '4.5px solid #2563eb' : '1.5px solid var(--border-color, #cbd5e1)',
                    background: isSelected ? '#ffffff' : 'transparent',
                    boxSizing: 'border-box'
                  }}
                />
                <span>{l.label}</span>
              </label>
            );
          })}
        </div>

        {/* Theme Toggle Buttons */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-subtle, #f1f5f9)',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid var(--border-color, #e2e8f0)',
            gap: '4px'
          }}
        >
          <button
            type="button"
            onClick={() => setTheme('light')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 0',
              borderRadius: '7px',
              border: 'none',
              background: theme === 'light' ? 'var(--bg-card, #ffffff)' : 'transparent',
              color: theme === 'light' ? 'var(--text-main, #0f172a)' : 'var(--text-muted, #94a3b8)',
              boxShadow: theme === 'light' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              fontSize: '0.78rem',
              fontWeight: theme === 'light' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            <Sun size={14} color={theme === 'light' ? '#2563eb' : 'currentColor'} />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 0',
              borderRadius: '7px',
              border: 'none',
              background: theme === 'dark' ? 'var(--bg-card, #ffffff)' : 'transparent',
              color: theme === 'dark' ? 'var(--text-main, #ffffff)' : 'var(--text-muted, #94a3b8)',
              boxShadow: theme === 'dark' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              fontSize: '0.78rem',
              fontWeight: theme === 'dark' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            <Moon size={14} color={theme === 'dark' ? '#6366f1' : 'currentColor'} />
            <span>Dark</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
