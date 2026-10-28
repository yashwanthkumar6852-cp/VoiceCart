import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  X,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  ShoppingBag,
  Filter,
  ArrowRight,
  Trash2,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Scale
} from 'lucide-react';
import { Product, CartItem } from '../types';
import { SupportedLanguage } from '../i18n/translations';
import { ttsService } from '../voice/tts';

export interface FloatingVoiceAssistantProps {
  // Deals Page State & Controls
  deals?: Product[];
  filteredDeals?: Product[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  selectedStore?: string;
  onSelectStore?: (store: string) => void;
  minDiscount?: number;
  onSelectMinDiscount?: (minDiscount: number) => void;
  sortBy?: 'discount' | 'price_low' | 'price_high' | 'rating';
  onSelectSortBy?: (sortBy: 'discount' | 'price_low' | 'price_high' | 'rating') => void;
  maxPrice?: number | null;
  onSelectMaxPrice?: (maxPrice: number | null) => void;
  searchQuery?: string;
  onSearchQuery?: (query: string) => void;
  onClearFilters?: () => void;

  // Global actions
  onAddToCart?: (product: Product, quantity?: number) => void;
  onNavigateRoute?: (route: string) => void;
  onSearchPrompt?: (query: string) => void;
  cart?: CartItem[];
  onRemoveFromCart?: (cartItemId: string) => void;

  // Configuration
  language?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  showToast?: (message: string) => void;
}

type AssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface ConversationMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionBadge?: string;
}

export const FloatingVoiceAssistant: React.FC<FloatingVoiceAssistantProps> = ({
  deals = [],
  filteredDeals = [],
  selectedCategory = 'all',
  onSelectCategory,
  selectedStore = 'all',
  onSelectStore,
  minDiscount = 0,
  onSelectMinDiscount,
  sortBy = 'discount',
  onSelectSortBy,
  maxPrice = null,
  onSelectMaxPrice,
  searchQuery = '',
  onSearchQuery,
  onClearFilters,
  onAddToCart,
  onNavigateRoute,
  onSearchPrompt,
  cart = [],
  onRemoveFromCart,
  language = 'en',
  onLanguageChange,
  showToast
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [activeLang, setActiveLang] = useState<SupportedLanguage>(language);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [typedInput, setTypedInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [conversation, setConversation] = useState<ConversationMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text:
        language === 'kn'
          ? 'ನಮಸ್ಕಾರ! ನಾನು VoiceCart ಸಹಾಯಕ. ಮೊಬೈಲ್‌ಗಳು, ರಿಯಾಯಿತಿಗಳು, ಬೆಲೆ ಹೋಲಿಕೆ ಅಥವಾ ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲು ಮಾತನಾಡಿ.'
          : language === 'hi'
          ? 'नमस्ते! मैं VoiceCart सहायक हूँ। मोबाइल, छूट, मूल्य तुलना या कार्ट में जोड़ने के लिए बोलें।'
          : "Hi! I'm your VoiceCart Assistant. Ask me to show mobile phones, find laptops under ₹50,000, filter 50%+ discounts, sort prices, or add items to your cart.",
      timestamp: 'Just now'
    }
  ]);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<AssistantStatus>(status);
  statusRef.current = status;

  // Keep internal language in sync with prop
  useEffect(() => {
    setActiveLang(language);
  }, [language]);

  // Subscribe to TTS changes to track speaking state
  useEffect(() => {
    const unsub = ttsService.subscribe((isSpeaking) => {
      if (isSpeaking && !isMuted) {
        setStatus('speaking');
      } else if (statusRef.current === 'speaking') {
        setStatus('idle');
      }
    });
    return unsub;
  }, [isMuted]);

  // Auto-scroll conversation to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, liveTranscript, isOpen]);

  // Clean up recognition and speech when component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      ttsService.stop();
    };
  }, []);

  // Speak response helper
  const speakResponse = useCallback(
    (text: string, langToUse: SupportedLanguage = activeLang) => {
      if (isMuted) return;
      ttsService.stop();
      ttsService.speak(text, langToUse);
    },
    [isMuted, activeLang]
  );

  // Command Execution Engine
  const executeCommand = useCallback(
    async (rawCommand: string) => {
      const command = rawCommand.trim();
      if (!command) return;

      setStatus('processing');
      setLiveTranscript('');
      setErrorMessage(null);

      // Add user message to conversation
      const userMsgId = `user-${Date.now()}`;
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setConversation((prev) => [
        ...prev,
        {
          id: userMsgId,
          sender: 'user',
          text: command,
          timestamp: timeString
        }
      ]);

      const lower = command.toLowerCase();
      let assistantReply = '';
      let actionBadge = '';
      const targetLang = activeLang;

      // 1. CLEAR FILTERS
      if (
        lower.includes('clear all filters') ||
        lower.includes('clear filter') ||
        lower.includes('reset filter') ||
        lower.includes('show all products') ||
        lower.includes('ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ') ||
        lower.includes('फ़िल्टर हटाएं')
      ) {
        if (onClearFilters) onClearFilters();
        if (onSelectCategory) onSelectCategory('all');
        if (onSelectStore) onSelectStore('all');
        if (onSelectMinDiscount) onSelectMinDiscount(0);
        if (onSelectSortBy) onSelectSortBy('discount');
        if (onSelectMaxPrice) onSelectMaxPrice(null);
        if (onSearchQuery) onSearchQuery('');

        actionBadge = 'Filters Reset';
        assistantReply =
          targetLang === 'kn'
            ? 'ಎಲ್ಲಾ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಲಾಗಿದೆ.'
            : targetLang === 'hi'
            ? 'सभी फ़िल्टर हटा दिए गए हैं।'
            : 'All filters have been cleared.';
      }

      // 2. SHOW MOBILE PHONES
      else if (
        lower.includes('mobile') ||
        lower.includes('phone') ||
        lower.includes('smartphone') ||
        lower.includes('ಮೊಬೈಲ್') ||
        lower.includes('मोबाइल')
      ) {
        if (onSelectCategory) onSelectCategory('mobiles');
        actionBadge = 'Category: Mobiles';
        assistantReply =
          targetLang === 'kn'
            ? 'ಟಾಪ್ ಮೊಬೈಲ್ ಫೋನ್ ಡೀಲ್‌ಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.'
            : targetLang === 'hi'
            ? 'मोबाइल फ़ोन के बेहतरीन डील्स दिखाए जा रहे हैं।'
            : 'Showing mobile phones with live multi-store discounts.';
      }

      // 3. LAPTOPS (UNDER 50000 or GENERAL)
      else if (
        lower.includes('laptop') ||
        lower.includes('notebook') ||
        lower.includes('ಲ್ಯಾಪ್ಟಾಪ್') ||
        lower.includes('लैपटॉप')
      ) {
        if (onSelectCategory) onSelectCategory('laptops');
        if (lower.includes('50000') || lower.includes('50,000') || lower.includes('fifty thousand')) {
          if (onSelectMaxPrice) onSelectMaxPrice(50000);
          if (onSelectSortBy) onSelectSortBy('price_low');
          actionBadge = 'Laptops < ₹50,000';
          assistantReply =
            targetLang === 'kn'
              ? 'ಇಲ್ಲಿ ₹50,000 ಒಳಗೆ ಲಭ್ಯವಿರುವ ಲ್ಯಾಪ್ಟಾಪ್‌ಗಳು.'
              : targetLang === 'hi'
              ? 'यहाँ ₹50,000 के तहत उपलब्ध लैपटॉप हैं।'
              : 'Here are the laptops available under ₹50,000.';
        } else {
          actionBadge = 'Category: Laptops';
          assistantReply =
            targetLang === 'kn'
              ? 'ಟಾಪ್ ಲ್ಯಾಪ್ಟಾಪ್ ಡೀಲ್‌ಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.'
              : targetLang === 'hi'
              ? 'लैपटॉप डील्स दिखाए जा रहे हैं।'
              : 'Showing top laptop deals.';
        }
      }

      // 4. SMARTWATCHES
      else if (
        lower.includes('smartwatch') ||
        lower.includes('smart watch') ||
        lower.includes('watch') ||
        lower.includes('ಸ್ಮಾರ್ಟ್') ||
        lower.includes('स्मार्टवॉच')
      ) {
        if (onSelectCategory) onSelectCategory('smartwatches');
        actionBadge = 'Category: Smartwatches';
        assistantReply =
          targetLang === 'kn'
            ? 'ಸ್ಮಾರ್ಟ್‌ವಾಚ್ ಆಫರ್‌ಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.'
            : targetLang === 'hi'
            ? 'स्मार्टवॉच के डील्स दिखाए जा रहे हैं।'
            : 'Showing top smartwatch deals.';
      }

      // 5. AUDIO & EARBUDS
      else if (
        lower.includes('audio') ||
        lower.includes('earbud') ||
        lower.includes('headphone') ||
        lower.includes('neckband') ||
        lower.includes('airdopes') ||
        lower.includes('ಆಡಿಯೋ') ||
        lower.includes('हेडफ़ोन')
      ) {
        if (onSelectCategory) onSelectCategory('audio');
        actionBadge = 'Category: Audio';
        assistantReply =
          targetLang === 'kn'
            ? 'ಆಡಿಯೋ & ಇಯರ್‌ಬಡ್ಸ್ ಆಫರ್‌ಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.'
            : targetLang === 'hi'
            ? 'ऑडियो और ईयरबड्स डील्स दिखाए जा रहे हैं।'
            : 'Showing deals on audio, headphones, and earbuds.';
      }

      // 6. APPLIANCES & FASHION
      else if (lower.includes('appliance') || lower.includes('home') || lower.includes('ಗೃಹೋಪಯೋಗಿ')) {
        if (onSelectCategory) onSelectCategory('appliances');
        actionBadge = 'Category: Appliances';
        assistantReply = 'Showing home appliance deals.';
      } else if (lower.includes('fashion') || lower.includes('clothes') || lower.includes('shoes') || lower.includes('ಫ್ಯಾಷನ್')) {
        if (onSelectCategory) onSelectCategory('fashion');
        actionBadge = 'Category: Fashion';
        assistantReply = 'Showing top fashion and footwear deals.';
      }

      // 7. DISCOUNTS (70%+, 50%+, 30%+)
      else if (
        lower.includes('70 percent') ||
        lower.includes('70%') ||
        lower.includes('seventy percent') ||
        lower.includes('70 ಪ್ರತಿಶತ') ||
        lower.includes('70 प्रतिशत')
      ) {
        if (onSelectMinDiscount) onSelectMinDiscount(70);
        actionBadge = 'Min Discount: 70%+';
        assistantReply =
          targetLang === 'kn'
            ? '70 ಪ್ರತಿಶತಕ್ಕೂ ಹೆಚ್ಚು ರಿಯಾಯಿತಿಯ ಆಫರ್‌ಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.'
            : targetLang === 'hi'
            ? '70 प्रतिशत से अधिक छूट वाले डील्स दिखाए जा रहे हैं।'
            : 'Showing deals with discounts above 70 percent.';
      } else if (
        lower.includes('50 percent') ||
        lower.includes('50%') ||
        lower.includes('fifty percent') ||
        lower.includes('50 ಪ್ರತಿಶತ') ||
        lower.includes('50 प्रतिशत')
      ) {
        if (onSelectMinDiscount) onSelectMinDiscount(50);
        actionBadge = 'Min Discount: 50%+';
        assistantReply =
          targetLang === 'kn'
            ? '50 ಪ್ರತಿಶತಕ್ಕೂ ಹೆಚ್ಚು ರಿಯಾಯಿತಿಯ ಆಫರ್‌ಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.'
            : targetLang === 'hi'
            ? '50 प्रतिशत से अधिक छूट वाले डील्स दिखाए जा रहे हैं।'
            : 'Showing deals with discounts above 50 percent.';
      } else if (
        lower.includes('30 percent') ||
        lower.includes('30%') ||
        lower.includes('thirty percent')
      ) {
        if (onSelectMinDiscount) onSelectMinDiscount(30);
        actionBadge = 'Min Discount: 30%+';
        assistantReply = 'Showing deals with discounts above 30 percent.';
      }

      // 8. RATINGS (4+ STARS)
      else if (
        lower.includes('4 star') ||
        lower.includes('4-star') ||
        lower.includes('four star') ||
        lower.includes('rating') ||
        lower.includes('top rated') ||
        lower.includes('ರೇಟಿಂಗ್')
      ) {
        if (onSelectSortBy) onSelectSortBy('rating');
        actionBadge = 'Sort: Top Rated (4★+)';
        assistantReply =
          targetLang === 'kn'
            ? '4 ಕ್ಕಿಂತ ಹೆಚ್ಚು ರೇಟಿಂಗ್ ಹೊಂದಿರುವ ಉತ್ಪನ್ನಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.'
            : targetLang === 'hi'
            ? '4 स्टार से अधिक रेटिंग वाले उत्पाद दिखाए जा रहे हैं।'
            : 'Showing top-rated products with more than 4-star ratings.';
      }

      // 9. SORT BY LOWEST PRICE
      else if (
        lower.includes('lowest price') ||
        lower.includes('low price') ||
        lower.includes('cheapest') ||
        lower.includes('price low') ||
        lower.includes('ಕಡಿಮೆ ಬೆಲೆ') ||
        lower.includes('कम कीमत')
      ) {
        if (onSelectSortBy) onSelectSortBy('price_low');
        actionBadge = 'Sort: Price Low to High';
        assistantReply =
          targetLang === 'kn'
            ? 'ಕಡಿಮೆ ಬೆಲೆಯ ಪ್ರಕಾರ ಆಫರ್‌ಗಳನ್ನು ಜೋಡಿಸಲಾಗಿದೆ.'
            : targetLang === 'hi'
            ? 'डील्स को सबसे कम कीमत के अनुसार क्रमबद्ध किया गया है।'
            : 'Sorting deals by lowest price first.';
      }

      // 10. SORT BY HIGHEST DISCOUNT
      else if (
        lower.includes('highest discount') ||
        lower.includes('biggest discount') ||
        lower.includes('best discount') ||
        lower.includes('ಹೆಚ್ಚಿನ ರಿಯಾಯಿತಿ')
      ) {
        if (onSelectSortBy) onSelectSortBy('discount');
        actionBadge = 'Sort: Highest Discount %';
        assistantReply =
          targetLang === 'kn'
            ? 'ಗರಿಷ್ಠ ರಿಯಾಯಿತಿ ಶೇಕಡಾವಾರು ಆಫರ್‌ಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.'
            : targetLang === 'hi'
            ? 'अधिकतम छूट प्रतिशत वाले डील्स दिखाए जा रहे हैं।'
            : 'Showing deals sorted by highest discount percentage.';
      }

      // 11. VALUE FOR MONEY RECOMMENDATION
      else if (
        lower.includes('best value for money') ||
        lower.includes('value for money') ||
        lower.includes('best value') ||
        lower.includes('best deal') ||
        lower.includes('ಯಾವುದು ಉತ್ತಮ ಡೀಲ್') ||
        lower.includes('वैल्यू फॉर मनी')
      ) {
        const pool = filteredDeals.length > 0 ? filteredDeals : deals;
        if (pool.length > 0) {
          // Sort by combined discount & rating score
          const best = [...pool].sort((a, b) => {
            const scoreA = (a.discountPct || 0) * (a.rating || 4);
            const scoreB = (b.discountPct || 0) * (b.rating || 4);
            return scoreB - scoreA;
          })[0];

          actionBadge = 'Top Value Recommendation';
          assistantReply =
            targetLang === 'kn'
              ? `${best.store.toUpperCase()} ನಲ್ಲಿ ${best.title.slice(0, 32)} ${best.discountPct}% ರಿಯಾಯಿತಿಯೊಂದಿಗೆ ₹${best.price.toLocaleString()} ಬೆಲೆಯಲ್ಲಿ ಅತ್ಯುತ್ತಮ ಮೌಲ್ಯವನ್ನು ನೀಡುತ್ತದೆ.`
              : targetLang === 'hi'
              ? `${best.store.toUpperCase()} पर ${best.title.slice(0, 32)} ${best.discountPct}% छूट के साथ ₹${best.price.toLocaleString()} में सबसे बेहतरीन वैल्यू प्रदान करता है।`
              : `The ${best.title.slice(0, 32)} on ${best.store.toUpperCase()} has the best value for money with ${best.discountPct}% off at ₹${best.price.toLocaleString()}.`;
        } else {
          assistantReply = 'Looking across stores for the best value products.';
        }
      }

      // 12. STORE FILTERS (Amazon, Flipkart, Meesho)
      else if (lower.includes('amazon')) {
        if (onSelectStore) onSelectStore('amazon');
        actionBadge = 'Store: Amazon';
        assistantReply = 'Filtering deals from Amazon India.';
      } else if (lower.includes('flipkart')) {
        if (onSelectStore) onSelectStore('flipkart');
        actionBadge = 'Store: Flipkart';
        assistantReply = 'Filtering deals from Flipkart.';
      } else if (lower.includes('meesho')) {
        if (onSelectStore) onSelectStore('meesho');
        actionBadge = 'Store: Meesho';
        assistantReply = 'Filtering deals from Meesho.';
      }

      // 13. COMPARE PRODUCT
      else if (
        lower.includes('compare this product') ||
        lower.includes('compare product') ||
        lower.includes('compare on amazon') ||
        lower.includes('compare') ||
        lower.includes('ಹೋಲಿಕೆ') ||
        lower.includes('तुलना')
      ) {
        if (onNavigateRoute) onNavigateRoute('/compare');
        actionBadge = 'Cross-Store Comparison';
        assistantReply =
          targetLang === 'kn'
            ? 'ಅಮೆಜಾನ್, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ಮತ್ತು ಮೀಶೋ ಬೆಲೆ ಹೋಲಿಕೆ ಪುಟವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.'
            : targetLang === 'hi'
            ? 'अमेज़न, फ्लिपकार्ट और मीशो पर मूल्य तुलना खोली जा रही है।'
            : 'Opening multi-store price comparison across Amazon, Flipkart, and Meesho.';
      }

      // 14. ADD TO CART
      else if (
        lower.includes('add this product to my cart') ||
        lower.includes('add this product to cart') ||
        lower.includes('add to cart') ||
        lower.includes('add to my cart') ||
        lower.includes('ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ') ||
        lower.includes('कार्ट में जोड़ें')
      ) {
        const targetProduct = (filteredDeals.length > 0 ? filteredDeals : deals)[0];
        if (targetProduct && onAddToCart) {
          onAddToCart(targetProduct, 1);
          actionBadge = 'Added to Cart';
          assistantReply =
            targetLang === 'kn'
              ? `ಆಯ್ಕೆಮಾಡಿದ ಉತ್ಪನ್ನ (${targetProduct.title.slice(0, 28)}) ಅನ್ನು ನಿಮ್ಮ ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ.`
              : targetLang === 'hi'
              ? `चयनित उत्पाद (${targetProduct.title.slice(0, 28)}) को आपके कार्ट में जोड़ दिया गया है।`
              : 'The selected product has been added to your cart.';
        } else {
          assistantReply = 'Please select a product first to add it to your cart.';
        }
      }

      // 15. REMOVE FROM CART
      else if (
        lower.includes('remove the last product from my cart') ||
        lower.includes('remove last product') ||
        lower.includes('remove from cart') ||
        lower.includes('ಕಾರ್ಟ್‌ನಿಂದ ತೆಗೆಯಿರಿ') ||
        lower.includes('कार्ट से हटाएं')
      ) {
        if (cart && cart.length > 0 && onRemoveFromCart) {
          const lastItem = cart[cart.length - 1];
          onRemoveFromCart(lastItem.id);
          actionBadge = 'Removed from Cart';
          assistantReply =
            targetLang === 'kn'
              ? 'ನಿಮ್ಮ ಕಾರ್ಟ್‌ನಿಂದ ಕೊನೆಯ ಐಟಂ ಅನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ.'
              : targetLang === 'hi'
              ? 'कार्ट से अंतिम आइटम हटा दिया गया है।'
              : 'The last item has been removed from your shopping cart.';
        } else {
          assistantReply =
            targetLang === 'kn'
              ? 'ನಿಮ್ಮ ಕಾರ್ಟ್ ಪ್ರಸ್ತುತ ಖಾಲಿಯಾಗಿದೆ.'
              : targetLang === 'hi'
              ? 'आपका कार्ट वर्तमान में खाली है।'
              : 'Your shopping cart is currently empty.';
        }
      }

      // 16. OPEN SHOPPING CART
      else if (
        lower.includes('open my shopping cart') ||
        lower.includes('open cart') ||
        lower.includes('show cart') ||
        lower.includes('view cart') ||
        lower.includes('ಕಾರ್ಟ್ ತೆರೆಯಿರಿ') ||
        lower.includes('कार्ट दिखाएं')
      ) {
        if (onNavigateRoute) onNavigateRoute('/cart');
        actionBadge = 'Navigate: Cart';
        assistantReply =
          targetLang === 'kn'
            ? 'ನಿಮ್ಮ ಶಾಪಿಂಗ್ ಕಾರ್ಟ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.'
            : targetLang === 'hi'
            ? 'आपका शॉपिंग कार्ट खोला जा रहा है।'
            : 'Opening your shopping cart.';
      }

      // 17. SEARCH QUERY (e.g. "Search for Samsung Galaxy phones")
      else if (
        lower.includes('samsung') ||
        lower.startsWith('search for ') ||
        lower.startsWith('find ') ||
        lower.startsWith('search ') ||
        lower.includes('ಹುಡುಕಿ') ||
        lower.includes('खोजें')
      ) {
        let cleanQuery = command.replace(/^(search for|find|search)\s+/i, '').replace(/(ಹುಡುಕಿ|खोजें)/gi, '').trim();
        if (!cleanQuery && lower.includes('samsung')) {
          cleanQuery = 'Samsung Galaxy';
        }
        actionBadge = `Search: "${cleanQuery}"`;
        assistantReply =
          targetLang === 'kn'
            ? `"${cleanQuery}" ಗಾಗಿ ಫಲಿತಾಂಶಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.`
            : targetLang === 'hi'
            ? `"${cleanQuery}" के परिणाम दिखाए जा रहे हैं।`
            : `Showing products matching "${cleanQuery}".`;

        if (onSearchQuery) {
          onSearchQuery(cleanQuery);
        } else if (onNavigateRoute) {
          onNavigateRoute(`/?q=${encodeURIComponent(cleanQuery)}`);
        } else if (onSearchPrompt) {
          onSearchPrompt(cleanQuery);
        }
      }

      // 18. GREETINGS & CASUAL
      else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        assistantReply =
          targetLang === 'kn'
            ? 'ನಮಸ್ಕಾರ! VoiceCart ಗೆ ಸ್ವಾಗತ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?'
            : targetLang === 'hi'
            ? 'नमस्ते! VoiceCart में आपका स्वागत है। मैं आपकी क्या मदद कर सकता हूँ?'
            : "Hello! Welcome to VoiceCart. How can I help with your shopping today?";
      }

      // 19. DEFAULT FALLBACK
      else {
        assistantReply = `I received: "${command}". Searching across Amazon, Flipkart, and Meesho for the best matching deals.`;
        actionBadge = 'Store Search';
        if (onNavigateRoute) {
          onNavigateRoute(`/?q=${encodeURIComponent(command)}`);
        }
      }

      // Append Assistant Response
      const assistantMsgId = `asst-${Date.now()}`;
      setConversation((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          sender: 'assistant',
          text: assistantReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionBadge
        }
      ]);

      if (showToast && actionBadge) {
        showToast(actionBadge);
      }

      setStatus('speaking');
      speakResponse(assistantReply, targetLang);
    },
    [
      activeLang,
      deals,
      filteredDeals,
      cart,
      onSelectCategory,
      onSelectStore,
      onSelectMinDiscount,
      onSelectSortBy,
      onSelectMaxPrice,
      onSearchQuery,
      onClearFilters,
      onAddToCart,
      onRemoveFromCart,
      onNavigateRoute,
      onSearchPrompt,
      speakResponse,
      showToast
    ]
  );

  // Stop listening helper
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    isListeningRef.current = false;
    if (statusRef.current === 'listening') {
      setStatus('idle');
    }
  }, []);

  // Real SpeechRecognition Initialization
  const startListening = useCallback(() => {
    // If speaking, cancel speech first
    ttsService.stop();

    if (isListeningRef.current) {
      stopListening();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'Web Speech Recognition is not supported by this browser. You can type commands in the text box below.'
      );
      setStatus('error');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = activeLang === 'kn' ? 'kn-IN' : activeLang === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        isListeningRef.current = true;
        setStatus('listening');
        setErrorMessage(null);
        setLiveTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const recognizedText = final || interim;
        setLiveTranscript(recognizedText);

        if (final) {
          isListeningRef.current = false;
          executeCommand(final);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error in FloatingVoiceAssistant:', event.error);
        isListeningRef.current = false;

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage(
            activeLang === 'kn'
              ? 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಅನುಮತಿ ನೀಡಿ.'
              : activeLang === 'hi'
              ? 'माइक्रोफ़ोन अनुमति अस्वीकार कर दी गई। कृपया ब्राउज़र में अनुमति सक्षम करें।'
              : 'Microphone permission denied. Please allow microphone access in your browser to use voice commands.'
          );
          setStatus('error');
        } else if (event.error === 'no-speech') {
          setStatus('idle');
        } else if (event.error === 'network') {
          setErrorMessage('Network connection error with speech service. You can type below.');
          setStatus('error');
        } else if (event.error === 'aborted') {
          setStatus('idle');
        } else {
          setErrorMessage(`Speech error: ${event.error}. Try again or type below.`);
          setStatus('error');
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        if (statusRef.current === 'listening') {
          setStatus('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start SpeechRecognition:', err);
      isListeningRef.current = false;
      // Prevent InvalidStateError
      if (err.name === 'InvalidStateError') {
        setStatus('idle');
      } else {
        setErrorMessage('Could not activate microphone. Please try again.');
        setStatus('error');
      }
    }
  }, [activeLang, executeCommand, stopListening]);

  // Handle panel toggle
  const handleTogglePanel = () => {
    if (isOpen) {
      stopListening();
      ttsService.stop();
      setIsOpen(false);
    } else {
      setIsOpen(true);
      // Auto-start listening on open
      setTimeout(() => {
        startListening();
      }, 350);
    }
  };

  const handleClose = () => {
    stopListening();
    ttsService.stop();
    setIsOpen(false);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedInput.trim()) {
      executeCommand(typedInput.trim());
      setTypedInput('');
    }
  };

  const samplePrompts = [
    { label: 'Show mobile phones', cmd: 'Show mobile phones' },
    { label: 'Laptops under ₹50,000', cmd: 'Find laptops under 50000 rupees' },
    { label: '4★+ rated deals', cmd: 'Show products with more than 4-star ratings' },
    { label: '50%+ discounts', cmd: 'Show discounts above 50 percent' },
    { label: 'Best value deal?', cmd: 'Which product has the best value for money?' },
    { label: 'Add to cart', cmd: 'Add this product to my cart' },
    { label: 'Compare across stores', cmd: 'Compare this product on Amazon, Flipkart and Meesho' }
  ];

  return (
    <>
      {/* 1. FLOATING BUTTON WITH TOOLTIP (Fixed bottom-right: 25px, 100px) */}
      <div className="floating-voice-btn-container" style={{ position: 'fixed', right: '25px', bottom: '100px', zIndex: 1050 }}>
        {/* Glow & Pulse Animation when open or listening */}
        {(isOpen || status === 'listening') && (
          <div className="floating-voice-pulse-ring" />
        )}

        {/* Hover Tooltip when Idle */}
        {!isOpen && (
          <div className="floating-voice-tooltip">
            <span>Talk to VoiceCart</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleTogglePanel}
          className="floating-voice-trigger-btn"
          aria-label="Talk to VoiceCart Assistant"
          title={isOpen ? 'Close Voice Assistant' : 'Talk to VoiceCart'}
        >
          {status === 'listening' ? (
            <Mic size={26} className="mic-active-pulse" />
          ) : (
            <Mic size={24} />
          )}
        </button>
      </div>

      {/* 2. FLOATING VOICE ASSISTANT PANEL */}
      {isOpen && (
        <div className="floating-voice-panel glass-panel">
          {/* HEADER */}
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(219, 39, 119, 0.2) 100%)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f46e5, #db2777)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)'
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>VoiceCart Assistant</span>
                  <span style={{ fontSize: '0.62rem', background: 'var(--primary)', color: '#fff', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    Live
                  </span>
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background:
                        status === 'listening'
                          ? '#10b981'
                          : status === 'speaking'
                          ? '#ec4899'
                          : status === 'processing'
                          ? '#f59e0b'
                          : status === 'error'
                          ? '#ef4444'
                          : '#94a3b8'
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {status === 'listening'
                      ? 'Listening...'
                      : status === 'processing'
                      ? 'Processing...'
                      : status === 'speaking'
                      ? 'Speaking...'
                      : status === 'error'
                      ? 'Error'
                      : 'Ready to listen'}
                  </span>
                </div>
              </div>
            </div>

            {/* CONTROLS: Language, Mute, Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {/* Language Selector */}
              <select
                value={activeLang}
                onChange={(e) => {
                  const newLang = e.target.value as SupportedLanguage;
                  setActiveLang(newLang);
                  if (onLanguageChange) onLanguageChange(newLang);
                }}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: '6px',
                  padding: '4px 6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
                title="Select Voice Language"
              >
                <option value="en">EN</option>
                <option value="hi">हिन्दी</option>
                <option value="kn">ಕನ್ನಡ</option>
              </select>

              {/* Mute Button */}
              <button
                type="button"
                onClick={() => {
                  if (!isMuted) {
                    ttsService.stop();
                  }
                  setIsMuted(!isMuted);
                }}
                style={{
                  background: isMuted ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: isMuted ? '#ef4444' : 'var(--text-secondary)',
                  borderRadius: '6px',
                  padding: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isMuted ? 'Unmute assistant voice' : 'Mute assistant voice'}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: '6px',
                  padding: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Close assistant"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* LISTENING WAVEFORM & TRANSCRIPT BANNER */}
          {status === 'listening' && (
            <div
              style={{
                background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.12), rgba(219, 39, 119, 0.15))',
                padding: '10px 16px',
                borderBottom: '1px solid rgba(124, 58, 237, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                {/* 5-bar animated waveform */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <span
                      key={idx}
                      style={{
                        width: '3.5px',
                        borderRadius: '3px',
                        background: 'linear-gradient(to top, #4f46e5, #db2777)',
                        animation: `wave-bar ${0.6 + idx * 0.15}s infinite ease-in-out`
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {liveTranscript || 'Listening to your voice command...'}
                </span>
              </div>

              <button
                type="button"
                onClick={stopListening}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Stop
              </button>
            </div>
          )}

          {/* PERMISSION ERROR ALERT */}
          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '0.78rem',
                color: '#ef4444'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* CONVERSATION HISTORY AREA */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '180px',
              maxHeight: '260px'
            }}
          >
            {conversation.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '9px 12px',
                    borderRadius:
                      msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background:
                      msg.sender === 'user'
                        ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                        : 'var(--bg-subtle)',
                    color: msg.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                    fontSize: '0.84rem',
                    lineHeight: 1.45,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                >
                  {msg.actionBadge && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: 'var(--accent-green, #10b981)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        marginBottom: '4px'
                      }}
                    >
                      <CheckCircle2 size={11} />
                      <span>{msg.actionBadge}</span>
                    </div>
                  )}
                  <div>{msg.text}</div>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px', padding: '0 4px' }}>
                  {msg.timestamp}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPT CHIPS */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-subtle)',
              display: 'flex',
              overflowX: 'auto',
              gap: '6px',
              scrollbarWidth: 'none'
            }}
          >
            {samplePrompts.map((p) => (
              <button
                key={p.cmd}
                type="button"
                onClick={() => executeCommand(p.cmd)}
                style={{
                  flex: '0 0 auto',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: '16px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
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
                {p.label}
              </button>
            ))}
          </div>

          {/* FOOTER: MIC ACTION & FALLBACK TEXT INPUT */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {/* Big Mic Toggle */}
            <button
              type="button"
              onClick={() => {
                if (status === 'listening') {
                  stopListening();
                } else {
                  startListening();
                }
              }}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background:
                  status === 'listening'
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #4f46e5 0%, #db2777 100%)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow:
                  status === 'listening'
                    ? '0 0 14px rgba(239, 68, 68, 0.5)'
                    : '0 4px 12px rgba(124, 58, 237, 0.35)'
              }}
              title={status === 'listening' ? 'Stop Listening' : 'Start Voice Listening'}
            >
              {status === 'listening' ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Fallback Text Input Form */}
            <form onSubmit={handleTextSubmit} style={{ display: 'flex', flex: 1, gap: '6px' }}>
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder={
                  activeLang === 'kn'
                    ? 'ಅಥವಾ ಇಲ್ಲಿ ಕಮಾಂಡ್ ಟೈಪ್ ಮಾಡಿ...'
                    : activeLang === 'hi'
                    ? 'या यहाँ कमांड टाइप करें...'
                    : 'Or type a shopping command...'
                }
                style={{
                  flex: 1,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!typedInput.trim()}
                style={{
                  background: typedInput.trim() ? 'var(--primary)' : 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: typedInput.trim() ? '#ffffff' : 'var(--text-muted)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  cursor: typedInput.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                title="Send command"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
