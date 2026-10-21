import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  RefreshCw,
  ShoppingCart,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Award,
  ChevronRight,
  Layers
} from 'lucide-react';
import { Product, CartItem, SearchResponse } from '../../types';
import { SupportedLanguage, translations } from '../../i18n/translations';
import { DispatcherHandlers } from '../../voice/dispatcher';
import { useVoice } from '../../hooks/useVoice';
import { voiceStore } from '../../voice/voiceStore';
import { commandRouter } from '../../voice/commandRouter';
import { actionDispatcher } from '../../voice/dispatcher';
import { AudioWaveform } from '../AudioWaveform';
import { ProductImage } from '../ProductImage';

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
  searchResponse,
  recommendedProduct,
  selectedProduct,
  cart,
  onAddToCart,
  onSelectProduct,
  onNavigateToCart,
  onNavigateToComparison,
  onSearchPrompt
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [lastReply, setLastReply] = useState<string>('');
  const [activeCompareStore, setActiveCompareStore] = useState<'all' | 'amazon' | 'flipkart' | 'meesho'>('all');
  const t = translations[language === 'hi' || language === 'kn' ? language : 'en'] || translations.en;

  const langCode = language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

  const speakWithBrowserTTS = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const handleFinalTranscript = async (transcript: string) => {
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
      speakWithBrowserTTS(spoken);
    } catch (err: any) {
      const errorMsg = 'Could not process that command. Please try again.';
      setLastReply(errorMsg);
      speakWithBrowserTTS(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const {
    state,
    liveTranscript,
    startListening,
    stopListening
  } = useVoice(langCode, handleFinalTranscript);

  const isListening = state === 'listening';

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      startListening();
    }
  };

  // Sync with searchResponse reply
  useEffect(() => {
    if (searchResponse?.replyText) {
      setLastReply(searchResponse.replyText);
    }
  }, [searchResponse?.replyText]);

  // Comparison product (prioritizes user-selected or top recommendation or fallback HP Pavilion)
  const compareTarget: Product =
    selectedProduct ||
    recommendedProduct ||
    (searchResponse?.products && searchResponse.products[0]) || {
      productId: 'hp-pav-15',
      title: 'HP Pavilion 15',
      brand: 'HP',
      price: 48990,
      mrp: 69990,
      discountPct: 30,
      rating: 4.5,
      ratingCount: 12400,
      reviewCount: 12400,
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60',
      store: 'amazon',
      productUrl: '#',
      affiliateUrl: '#',
      deliveryDays: 2,
      shippingFee: 0,
      seller: 'Amazon Retail',
      inStock: true
    };

  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

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
      {/* 1. Voice Assistant Hub Card (Always Visible on Dashboard) */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
              }}
            >
              <Mic size={16} />
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {t.voiceAssistant}
            </span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#059669',
              background: '#ecfdf5',
              padding: '3px 10px',
              borderRadius: '12px'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981'
              }}
            />
            <span>Online</span>
          </div>
        </div>

        {/* Big Circular Glowing Microphone Button */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 0 16px 0'
          }}
        >
          {/* Concentric rings wrapper */}
          <div
            style={{
              position: 'relative',
              width: '110px',
              height: '110px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px'
            }}
          >
            {/* Outer animated ripple */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: isListening
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(99, 102, 241, 0.12)',
                border: isListening
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : '1px solid rgba(99, 102, 241, 0.25)',
                animation: isListening ? 'pulse-ring 2s infinite ease-in-out' : 'none'
              }}
            />

            {/* Middle ripple */}
            <div
              style={{
                position: 'absolute',
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: isListening
                  ? 'rgba(239, 68, 68, 0.25)'
                  : 'rgba(99, 102, 241, 0.2)',
                border: isListening
                  ? '1px solid rgba(239, 68, 68, 0.4)'
                  : '1px solid rgba(99, 102, 241, 0.35)'
              }}
            />

            {/* Center Mic Button */}
            <button
              type="button"
              onClick={handleToggleMic}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: isListening
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : isProcessing
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : isSpeaking
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isListening
                  ? '0 0 20px rgba(239, 68, 68, 0.5)'
                  : '0 8px 20px rgba(79, 70, 229, 0.35)',
                zIndex: 2,
                transition: 'transform 0.15s ease'
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isListening ? (
                <Mic size={28} className="mic-active-pulse" />
              ) : isProcessing ? (
                <RefreshCw size={26} className="mic-active-pulse" />
              ) : isSpeaking ? (
                <Volume2 size={28} />
              ) : (
                <Mic size={28} />
              )}
            </button>
          </div>

          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
            {isListening ? t.listening : isProcessing ? t.processing : isSpeaking ? `${t.appName} Speaking...` : t.tapToSpeak}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isListening ? (liveTranscript ? `"${liveTranscript}"` : t.listeningPrompt) : t.tapToSpeak}
          </div>

          {/* Sound Wave Bars */}
          <div style={{ margin: '12px 0 4px 0' }}>
            <AudioWaveform isActive={isListening || isSpeaking} color={isListening ? '#ef4444' : isSpeaking ? '#10b981' : '#6366f1'} />
          </div>
        </div>

        {/* Live Status Step List (Matching reference image) */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '14px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isListening ? '#10b981' : '#cbd5e1'
              }}
            />
            <span style={{ fontWeight: isListening ? 700 : 500, color: isListening ? 'var(--text-main)' : 'var(--text-muted)' }}>
              {t.listening}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isProcessing ? '#f59e0b' : '#cbd5e1'
              }}
            />
            <span style={{ fontWeight: isProcessing ? 700 : 500, color: isProcessing ? 'var(--text-main)' : 'var(--text-muted)' }}>
              {t.processing}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: searchResponse || lastReply ? '#10b981' : '#cbd5e1'
              }}
            />
            <span style={{ fontWeight: searchResponse || lastReply ? 700 : 500, color: searchResponse || lastReply ? 'var(--text-main)' : 'var(--text-muted)' }}>
              {t.showingResults}
            </span>
          </div>
        </div>

        {/* Command & Assistant Response Area */}
        {(lastCommand || lastReply) && (
          <div
            style={{
              background: '#eff6ff',
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid #dbeafe',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '14px'
            }}
          >
            {lastCommand && (
              <div style={{ fontSize: '0.76rem', color: '#1e3a8a', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700 }}>🗣️ You:</span> &quot;{lastCommand}&quot;
              </div>
            )}
            {lastReply && (
              <div style={{ fontSize: '0.76rem', color: '#047857', lineHeight: 1.4, fontWeight: 600 }}>
                <span style={{ fontWeight: 700 }}>🤖 VoiceCart:</span> {lastReply}
              </div>
            )}
          </div>
        )}

        {/* Quick Voice Prompt Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {t.trySaying}
          </div>
          {(language === 'kn' ? [
            '50k ಒಳಗೆ ಉತ್ತಮ ಲ್ಯಾಪ್ಟಾಪ್',
            '2000 ಒಳಗೆ boAt earbuds',
            'iPhone 15 ಬೆಲೆ ಹೋಲಿಕೆ'
          ] : language === 'hi' ? [
            '50k के अंदर बेस्ट लैपटॉप',
            '2000 के अंदर boAt ईयरबड्स',
            'iPhone 15 कीमतें तुलना करो'
          ] : [
            'Show me the best laptops under 50k',
            'Find boAt earbuds under 2000',
            'Compare iPhone 15 prices'
          ]).map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSearchPrompt(prompt)}
              style={{
                textAlign: 'left',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              &quot;{prompt}&quot;
            </button>
          ))}
        </div>
      </div>

      {/* 2. Product Comparison Card */}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}
        >
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {t.crossStoreComparison}
          </span>
          <button
            type="button"
            onClick={() => onNavigateToComparison(compareTarget.productId)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <span>{t.viewAllDeals}</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Store Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
          <span
            style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              background: '#fff7ed',
              color: '#c2410c',
              border: '1px solid #ffedd5',
              padding: '3px 8px',
              borderRadius: '6px'
            }}
          >
            amazon
          </span>
          <span
            style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #dbeafe',
              padding: '3px 8px',
              borderRadius: '6px'
            }}
          >
            Flipkart
          </span>
          <span
            style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              background: '#fdf2f8',
              color: '#be185d',
              border: '1px solid #fce7f3',
              padding: '3px 8px',
              borderRadius: '6px'
            }}
          >
            meesho
          </span>
        </div>

        {/* Product Snippet */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '14px',
            paddingBottom: '12px',
            borderBottom: '1px solid #f1f5f9'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '8px',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            <ProductImage
              src={compareTarget.imageUrl}
              alt={compareTarget.title}
              store={compareTarget.store}
              productId={compareTarget.productId}
              style={{ maxHeight: '40px', maxWidth: '40px', objectFit: 'contain' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <div
                style={{
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {compareTarget.title}
              </div>
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  background: '#ecfdf5',
                  color: '#059669',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  flexShrink: 0
                }}
              >
                Best Value
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
              ★ {compareTarget.rating || 4.5} ({(compareTarget.ratingCount || 12400) > 1000 ? `${((compareTarget.ratingCount || 12400) / 1000).toFixed(1)}k` : compareTarget.ratingCount || 12400})
            </div>
          </div>
        </div>

        {/* Spec Comparison Table */}
        <div
          style={{
            width: '100%',
            fontSize: '0.72rem',
            marginBottom: '16px'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 1fr 1fr 1fr',
              padding: '6px 4px',
              borderBottom: '1px solid #f8fafc',
              fontWeight: 700,
              color: '#94a3b8'
            }}
          >
            <span>Metric</span>
            <span style={{ color: '#c2410c' }}>Amazon</span>
            <span style={{ color: '#1d4ed8' }}>Flipkart</span>
            <span style={{ color: '#be185d' }}>Meesho</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 1fr 1fr 1fr',
              padding: '6px 4px',
              borderBottom: '1px solid #f8fafc',
              fontWeight: 700,
              color: '#0f172a'
            }}
          >
            <span style={{ color: '#64748b' }}>Price</span>
            <span>₹{compareTarget.price.toLocaleString('en-IN')}</span>
            <span>₹{(compareTarget.price + 1000).toLocaleString('en-IN')}</span>
            <span style={{ color: '#059669' }}>₹{(compareTarget.price - 1000).toLocaleString('en-IN')}</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 1fr 1fr 1fr',
              padding: '6px 4px',
              borderBottom: '1px solid #f8fafc',
              color: '#334155'
            }}
          >
            <span style={{ color: '#64748b', fontWeight: 600 }}>Rating</span>
            <span>4.5</span>
            <span>4.3</span>
            <span>4.2</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 1fr 1fr 1fr',
              padding: '6px 4px',
              borderBottom: '1px solid #f8fafc',
              color: '#334155'
            }}
          >
            <span style={{ color: '#64748b', fontWeight: 600 }}>RAM</span>
            <span>16GB</span>
            <span>16GB</span>
            <span>16GB</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 1fr 1fr 1fr',
              padding: '6px 4px',
              borderBottom: '1px solid #f8fafc',
              color: '#334155'
            }}
          >
            <span style={{ color: '#64748b', fontWeight: 600 }}>Storage</span>
            <span>512GB SSD</span>
            <span>512GB SSD</span>
            <span>512GB SSD</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 1fr 1fr 1fr',
              padding: '6px 4px',
              color: '#334155'
            }}
          >
            <span style={{ color: '#64748b', fontWeight: 600 }}>Display</span>
            <span>15.6&quot; FHD</span>
            <span>15.6&quot; FHD</span>
            <span>15.6&quot; FHD</span>
          </div>
        </div>

        {/* View Full Comparison Button */}
        <button
          type="button"
          onClick={() => onNavigateToComparison(compareTarget.productId)}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '9px 12px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            transition: 'transform 0.15s ease'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span>View Full Comparison</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 3. Your Cart Summary Card (Matching reference image) */}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {t.orderSummary}
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {cart.length > 0 ? `${cart.length} items` : `0 ${t.cart}`}
          </span>
        </div>

        {/* Cart Thumbnails & Total */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}
        >
          {/* Thumbnails Row */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {cart.length > 0 ? (
              cart.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  <ProductImage
                    src={item.product.imageUrl}
                    alt={item.product.title}
                    store={item.product.store}
                    productId={item.product.productId}
                    style={{ maxHeight: '36px', maxWidth: '36px', objectFit: 'contain' }}
                  />
                </div>
              ))
            ) : (
              <>
                <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  💻
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  🎧
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  👟
                </div>
              </>
            )}
          </div>

          {/* Cart Total */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.totalAmount}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
              ₹{cartTotal.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Go to Cart Button */}
        <button
          type="button"
          onClick={onNavigateToCart}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
            transition: 'transform 0.15s ease'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span>{t.proceedToCheckout}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </aside>
  );
};
