import { CartItem, OrderRecord, Product, SearchFilters } from '../types';
import { SupportedLanguage } from '../i18n/translations';
import { CommandParams, CommandResult, ConversationContext, PaymentMethodCode, VoiceAction } from './types';
import { voiceStore } from './voiceStore';

export interface DispatcherHandlers {
  isAuthenticated?: boolean;
  onNavigate: (tab: 'home' | 'search' | 'cart' | 'orders' | 'settings') => void;
  onNavigateRoute?: (route: string) => void;
  onSearch: (query: string, filters?: SearchFilters) => Promise<any>;
  onAddToCart: (product: Product, quantity?: number) => Promise<void>;
  onRemoveFromCart: (cartItemId: string) => Promise<void>;
  onClearCart: () => Promise<void>;
  onOpenProductDetail: (product: Product) => void;
  onCloseProductDetail?: () => void;
  onSetPaymentTab: (tab: 'cod' | 'upi' | 'qr' | 'wallet' | 'card_netbanking') => void;
  onSetLanguage: (lang: SupportedLanguage) => void;
  onOpenPaymentModal?: () => void;
  onCheckoutPartner?: (storeUrl: string) => void;
  onOpenAuth?: (mode?: 'login' | 'signup' | 'profile') => void;
  onSignOut?: () => Promise<void>;
  onSelectCategory?: (category: string) => void;
  onSavePendingVoiceCommand?: (command: CommandResult, transcript: string) => void;
}



export class ActionDispatcher {
  /**
   * Resolves target product reference from current context
   */
  public resolveProductReference(
    params: CommandParams,
    context: ConversationContext
  ): { product: Product | null; failureReason?: string } {
    const products = context.searchResults?.products || [];
    const recommendations = context.searchResults?.topRecommendations;

    if (products.length === 0 && !context.selectedProduct) {
      return { product: null, failureReason: 'No products are currently visible on screen. Please search for a product first.' };
    }

    const targetRef = params.targetRef || 'this';

    // 0. By Named Product Query (e.g. "Add iPhone 15 128GB to cart")
    if (params.productQuery || params.itemTitle) {
      const searchTarget = (params.productQuery || params.itemTitle || '').toLowerCase().trim();
      if (searchTarget) {
        // Match exact attributes: brand, model, storage
        const tokens: string[] = searchTarget.split(/\s+/).filter((t: string) => t.length > 1);
        const matched = products.find((p) => {
          const titleLower = p.title.toLowerCase();
          return tokens.every((tok: string) => titleLower.includes(tok));
        });
        if (matched) return { product: matched };

        // Fallback to substring match
        const subMatch = products.find((p) => p.title.toLowerCase().includes(searchTarget));
        if (subMatch) return { product: subMatch };
      }
    }

    // 1. By Store filter (e.g. "the Flipkart one")
    if (params.store) {
      const matched = products.find((p) => p.store.toLowerCase() === params.store?.toLowerCase());
      if (matched) return { product: matched };
    }

    // 2. By Index / Ordinal (e.g. "the second one", index = 1)
    if (typeof params.index === 'number' && params.index >= 0) {
      if (products[params.index]) {
        return { product: products[params.index] };
      }
    }

    // 3. "the cheapest" / "lowest"
    if (targetRef === 'cheapest' || targetRef === 'lowest') {
      if (recommendations?.lowestPrice) {
        return { product: recommendations.lowestPrice };
      }
      if (products.length > 0) {
        const sorted = [...products].sort((a, b) => a.price - b.price);
        return { product: sorted[0] };
      }
    }

    // 4. "the best" / "top" / "best rated"
    if (targetRef === 'best' || targetRef === 'top') {
      if (recommendations?.bestOverall) {
        return { product: recommendations.bestOverall };
      }
      if (recommendations?.bestRated) {
        return { product: recommendations.bestRated };
      }
      if (products.length > 0) {
        return { product: products[0] };
      }
    }

    // 5. "the first one"
    if (targetRef === 'first') {
      if (products.length > 0) return { product: products[0] };
    }

    // 6. "the second one"
    if (targetRef === 'second') {
      if (products.length > 1) return { product: products[1] };
    }

    // 7. "the third one"
    if (targetRef === 'third') {
      if (products.length > 2) return { product: products[2] };
    }

    // 8. "this" -> selected product or best overall or first product
    if (context.selectedProduct) {
      return { product: context.selectedProduct };
    }
    if (recommendations?.bestOverall) {
      return { product: recommendations.bestOverall };
    }
    if (products.length > 0) {
      return { product: products[0] };
    }

    return { product: null, failureReason: 'Which item would you like to choose? Please specify the name, store, or position.' };
  }

  /**
   * Resolves target cart item from context
   */
  public resolveCartItemReference(
    params: CommandParams,
    cart: CartItem[] = []
  ): { cartItem: CartItem | null; failureReason?: string } {
    if (cart.length === 0) {
      return { cartItem: null, failureReason: 'Your basket is currently empty.' };
    }

    if (typeof params.index === 'number' && cart[params.index]) {
      return { cartItem: cart[params.index] };
    }

    if (params.itemTitle) {
      const lower = params.itemTitle.toLowerCase();
      const matched = cart.find((c) => c.product.title.toLowerCase().includes(lower));
      if (matched) return { cartItem: matched };
    }

    // Default to first cart item
    return { cartItem: cart[0] };
  }

  /**
   * Dispatches and executes the resolved command
   */
  public async dispatch(
    command: CommandResult,
    handlers: DispatcherHandlers,
    transcript: string
  ): Promise<{
    spokenResponse: string;
    executionResult: string;
    status: 'success' | 'clarification' | 'confirmation_required' | 'error';
  }> {
    const context = voiceStore.getContext();
    const lang = command.language || context.language || 'en';

    // A. HANDLE CONFIRM YES (User confirmed pending risky action)
    if (command.action === 'confirm_yes') {
      if (context.pendingConfirmation) {
        const pending = context.pendingConfirmation;
        voiceStore.setPendingConfirmation(null);

        // Execute the pending action
        if (pending.action === 'buy') {
          const product = pending.params.product || context.selectedProduct || context.searchResults?.recommendation || context.searchResults?.products?.[0];
          if (product && handlers.onAddToCart) {
            await handlers.onAddToCart(product, pending.params.quantity || 1);
          }
          handlers.onNavigate('cart');
          const reply =
            lang === 'kn'
              ? 'ನಿಮ್ಮ ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಆರ್ಡರ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಪಾವತಿ ವಿಧಾನವನ್ನು ಆಯ್ಕೆಮಾಡಿ.'
              : lang === 'hi'
              ? 'आपकी कार्ट में जोड़ दिया गया है। कृपया अपने ऑर्डर की समीक्षा करें और भुगतान विधि चुनें।'
              : 'Added to your cart. Please review your order and choose a payment method.';

          voiceStore.addDebugLog({
            transcript,
            layer: command.layer,
            action: 'buy',
            params: pending.params,
            confidence: command.confidence,
            language: lang,
            reply,
            executionResult: `Confirmed booking of ${pending.targetTitle || 'item'} for ₹${pending.targetPrice || 0}`,
            status: 'success'
          });
          return { spokenResponse: reply, executionResult: 'Added item to cart and opened cart', status: 'success' };
        }

        if (pending.action === 'clear_cart') {
          await handlers.onClearCart();
          const reply = lang === 'kn' ? 'ಕಾರ್ಟ್ ಖಾಲಿ ಮಾಡಲಾಗಿದೆ.' : lang === 'hi' ? 'कार्ट खाली कर दी गई है।' : 'Basket cleared.';
          voiceStore.addDebugLog({
            transcript,
            layer: command.layer,
            action: 'clear_cart',
            params: {},
            confidence: command.confidence,
            language: lang,
            reply,
            executionResult: 'Cleared entire cart',
            status: 'success'
          });
          return { spokenResponse: reply, executionResult: 'Basket cleared', status: 'success' };
        }

        if (pending.action === 'remove_from_cart' && pending.params.cartItemId) {
          await handlers.onRemoveFromCart(pending.params.cartItemId);
          const reply = lang === 'kn' ? 'ವಸ್ತುವನ್ನು ತೆಗೆಯಲಾಗಿದೆ.' : lang === 'hi' ? 'उत्पाद हटा दिया गया है।' : 'Item removed from cart.';
          voiceStore.addDebugLog({
            transcript,
            layer: command.layer,
            action: 'remove_from_cart',
            params: pending.params,
            confidence: command.confidence,
            language: lang,
            reply,
            executionResult: `Removed item ${pending.targetTitle || ''}`,
            status: 'success'
          });
          return { spokenResponse: reply, executionResult: 'Removed cart item', status: 'success' };
        }
      }

      const defaultReply = lang === 'kn' ? 'ಸರಿ.' : lang === 'hi' ? 'ठीक है।' : 'Okay.';
      return { spokenResponse: defaultReply, executionResult: 'No pending action to confirm', status: 'success' };
    }

    // B. HANDLE CONFIRM NO (User cancelled pending risky action)
    if (command.action === 'confirm_no') {
      voiceStore.setPendingConfirmation(null);
      const reply = lang === 'kn' ? 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.' : lang === 'hi' ? 'रद्द किया गया।' : 'Action cancelled.';
      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'confirm_no',
        params: {},
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: 'Cancelled pending action',
        status: 'success'
      });
      return { spokenResponse: reply, executionResult: 'Cancelled pending confirmation', status: 'success' };
    }

    // C. SEARCH / COMPARE
    if (command.action === 'search' || command.action === 'compare') {
      const query = command.params.query || transcript;
      const filters: SearchFilters = {
        maxBudget: command.params.maxBudget,
        brand: command.params.brand,
        preference: command.params.preference || 'balanced',
        inStockOnly: true
      };

      const searchRes: any = await handlers.onSearch(query, filters);
      handlers.onNavigate('search');

      let reply = searchRes?.replyText || '';
      let spoken = searchRes?.spokenText || reply;

      if (!reply) {
        const topPick =
          searchRes?.recommendation ||
          searchRes?.topRecommendations?.bestOverall ||
          searchRes?.products?.[0];

        if (topPick) {
          const storeName = topPick.store === 'amazon' ? 'Amazon' : topPick.store === 'flipkart' ? 'Flipkart' : 'Meesho';
          const shortTitle = topPick.title?.split(/[,(-]/)[0]?.trim() || topPick.title?.slice(0, 36) || 'Item';
          const priceStr = `₹${topPick.price?.toLocaleString('en-IN') || 0}`;

          if (lang === 'kn') {
            reply = `${shortTitle}, ${storeName} ನಲ್ಲಿ ${priceStr}.`;
            spoken = reply;
          } else if (lang === 'hi') {
            reply = `${shortTitle} ${storeName} पर ${priceStr} में उपलब्ध है।`;
            spoken = reply;
          } else {
            reply = `${shortTitle} on ${storeName} for ${priceStr}.`;
            spoken = reply;
          }
        } else {
          reply =
            lang === 'kn'
              ? `ಕ್ಷಮಿಸಿ, "${query}" ಗೆ ಯಾವುದೇ ನಿಖರ ಉತ್ಪನ್ನಗಳು ಕಂಡುಬಂದಿಲ್ಲ.`
              : lang === 'hi'
              ? `क्षमा करें, "${query}" के लिए कोई सटीक उत्पाद नहीं मिला।`
              : `I couldn't find "${query}" on Amazon, Flipkart or Meesho right now.`;
          spoken = reply;
        }
      }

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'search',
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply: spoken || reply,
        executionResult: `Searched for "${query}" (Search ID: ${searchRes?.searchId || 'latest'})`,
        status: 'success'
      });

      return { spokenResponse: spoken || reply, executionResult: `Searched for "${query}"`, status: 'success' };
    }

    // Check for shopping actions that require user authentication
    const isProtectedShoppingAction = [
      'add_to_cart',
      'buy',
      'pay',
      'open_cart',
      'open_orders',
      'track_order',
      'remove_from_cart',
      'clear_cart'
    ].includes(command.action);

    if (isProtectedShoppingAction && handlers.isAuthenticated === false) {
      // Prompt user in selected language and navigate to full login page
      const reply =
        lang === 'kn'
          ? 'ದಯವಿಟ್ಟು ಮುಂದುವರಿಯಲು ಮೊದಲು ಲಾಗಿನ್ ಮಾಡಿ.'
          : lang === 'hi'
          ? 'जारी रखने के लिए कृपया पहले लॉगिन करें।'
          : 'Please log in first to continue.';

      if (handlers.onSavePendingVoiceCommand) {
        handlers.onSavePendingVoiceCommand(command, transcript);
      }
      if (handlers.onNavigateRoute) {
        handlers.onNavigateRoute('/login');
      } else if (handlers.onOpenAuth) {
        handlers.onOpenAuth('login');
      }

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: command.action,
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: 'Protected action requires user login; navigated to /login & command saved',
        status: 'clarification'
      });

      return { spokenResponse: reply, executionResult: 'Protected action requires login', status: 'clarification' };
    }

    // D. NAVIGATION (Cart, Orders, Home, Settings)
    if (command.action === 'open_cart') {
      handlers.onNavigate('cart');
      const reply = lang === 'kn' ? 'ನಿಮ್ಮ ಕಾರ್ಟ್ ತೆರೆಯಲಾಗಿದೆ.' : lang === 'hi' ? 'आपकी कार्ट खोली गई।' : 'Opening your cart.';
      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'open_cart',
        params: {},
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: 'Navigated to Cart screen',
        status: 'success'
      });
      return { spokenResponse: reply, executionResult: 'Navigated to Cart', status: 'success' };
    }

    if (command.action === 'open_orders' || command.action === 'track_order') {
      handlers.onNavigate('orders');
      const lastOrder = context.lastOrder;
      let reply = lang === 'kn' ? 'ನಿಮ್ಮ ಆರ್ಡರ್‌ಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'आपके ऑर्डर दिखाए जा रहे हैं।' : 'Showing your orders.';
      if (lastOrder) {
        reply =
          lang === 'kn'
            ? `ನಿಮ್ಮ ${lastOrder.store.toUpperCase()} ಆರ್ಡರ್ ${lastOrder.status.replace(/_/g, ' ')} ಹಂತದಲ್ಲಿದೆ.`
            : lang === 'hi'
            ? `आपका ${lastOrder.store.toUpperCase()} ऑर्डर #${lastOrder.orderId} ${lastOrder.status.replace(/_/g, ' ')} स्थिति में है।`
            : `Your ${lastOrder.store.toUpperCase()} order #${lastOrder.orderId} is currently ${lastOrder.status.replace(/_/g, ' ')}.`;
      }

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'track_order',
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: lastOrder ? `Tracking Order #${lastOrder.orderId}` : 'Navigated to Orders screen',
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: 'Navigated to Orders', status: 'success' };
    }

    if (command.action === 'open_home') {
      handlers.onNavigate('home');
      const reply = lang === 'kn' ? 'ಮುಖಪುಟಕ್ಕೆ ಹೋಗಲಾಗಿದೆ.' : lang === 'hi' ? 'होम पेज खोला गया।' : 'Navigated to Home.';
      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'open_home',
        params: {},
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: 'Navigated to Home screen',
        status: 'success'
      });
      return { spokenResponse: reply, executionResult: 'Navigated to Home', status: 'success' };
    }

    if (command.action === 'open_settings') {
      handlers.onNavigate('settings');
      const reply = lang === 'kn' ? 'ಸೆಟ್ಟಿಂಗ್ಸ್ ತೆರೆಯಲಾಗಿದೆ.' : lang === 'hi' ? 'सेटिंग्स खोली गई।' : 'Opening Settings.';
      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'open_settings',
        params: {},
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: 'Navigated to Settings screen',
        status: 'success'
      });
      return { spokenResponse: reply, executionResult: 'Navigated to Settings', status: 'success' };
    }

    // E. PAYMENT MODE SWITCHING / PAYING
    if (command.action === 'pay') {
      const mode = command.params.paymentMethod || 'upi';
      const mappedTab = mode === 'card' || mode === 'netbanking' ? 'card_netbanking' : (mode as any);

      handlers.onSetPaymentTab(mappedTab);
      handlers.onNavigate('cart');
      if (handlers.onOpenPaymentModal) handlers.onOpenPaymentModal();

      const methodNames: Record<string, { en: string; hi: string; kn: string }> = {
        upi: { en: 'UPI', hi: 'यूपीआई', kn: 'ಯುಪಿಐ' },
        cod: { en: 'Cash on Delivery', hi: 'कैश ऑन डिलीवरी', kn: 'ಕ್ಯಾಶ್ ಆನ್ ಡೆಲಿವರಿ' },
        qr: { en: 'QR Code', hi: 'क्यूआर कोड', kn: 'ಕ್ಯೂಆರ್ ಕೋಡ್' },
        wallet: { en: 'Wallets', hi: 'वॉलेट', kn: 'ವಾಲೆಟ್' },
        card: { en: 'Card', hi: 'कार्ड', kn: 'ಕಾರ್ಡ್' },
        netbanking: { en: 'Netbanking', hi: 'नेटबैंकिंग', kn: 'ನೆಟ್‌ಬ್ಯಾಂಕಿಂಗ್' }
      };

      const name = methodNames[mode] || methodNames.upi;
      const reply =
        lang === 'kn'
          ? `${name.kn} ಪಾವತಿ ತೆರೆಯಲಾಗಿದೆ.`
          : lang === 'hi'
          ? `${name.hi} भुगतान विकल्प खोला गया।`
          : `Selected ${name.en} payment.`;

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'pay',
        params: { paymentMethod: mode },
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: `Switched payment mode to ${mode.toUpperCase()} and opened checkout`,
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: `Opened ${mode} payment`, status: 'success' };
    }

    // F. ADD TO CART
    if (command.action === 'add_to_cart') {
      const { product, failureReason } = this.resolveProductReference(command.params, context);
      if (!product) {
        const clarifyReply = failureReason || 'Please specify which item to add.';
        voiceStore.addDebugLog({
          transcript,
          layer: command.layer,
          action: 'add_to_cart',
          params: command.params,
          confidence: command.confidence,
          language: lang,
          reply: clarifyReply,
          executionResult: 'Failed reference resolution',
          status: 'clarification'
        });
        return { spokenResponse: clarifyReply, executionResult: 'Unresolved product reference', status: 'clarification' };
      }

      await handlers.onAddToCart(product);
      const storeLabel = product.store.toUpperCase();
      const reply =
        lang === 'kn'
          ? `${storeLabel} ${product.title.slice(0, 26)} ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ.`
          : lang === 'hi'
          ? `${storeLabel} का ${product.title.slice(0, 26)} कार्ट में जोड़ दिया गया है।`
          : `Added the ${storeLabel} ${product.title.slice(0, 26)} to your cart.`;

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'add_to_cart',
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: `Added "${product.title}" (₹${product.price}) to cart`,
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: `Added "${product.title}" to cart`, status: 'success' };
    }

    // G. REMOVE FROM CART
    if (command.action === 'remove_from_cart') {
      const { cartItem, failureReason } = this.resolveCartItemReference(command.params, context.cart);
      if (!cartItem) {
        const reply = failureReason || 'Basket is empty.';
        voiceStore.addDebugLog({
          transcript,
          layer: command.layer,
          action: 'remove_from_cart',
          params: command.params,
          confidence: command.confidence,
          language: lang,
          reply,
          executionResult: 'No cart item found',
          status: 'clarification'
        });
        return { spokenResponse: reply, executionResult: 'No cart item found', status: 'clarification' };
      }

      // Prompt confirmation for risky action
      const prompt =
        lang === 'kn'
          ? `ದೃಢೀಕರಿಸಿ: ${cartItem.product.title.slice(0, 25)} ತೆಗೆಯಲೇ? ಮುಂದುವರಿಸಲು ಹೌದು ಎಂದು ಹೇಳಿ.`
          : lang === 'hi'
          ? `पुष्टि करें: ${cartItem.product.title.slice(0, 25)} हटाएं? जारी रखने के लिए हाँ कहें।`
          : `Confirm: Remove ${cartItem.product.title.slice(0, 25)}? Say yes to continue.`;

      voiceStore.setPendingConfirmation({
        action: 'remove_from_cart',
        params: { cartItemId: cartItem.id },
        prompt,
        targetTitle: cartItem.product.title,
        targetPrice: cartItem.currentPrice
      });

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'remove_from_cart',
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply: prompt,
        executionResult: 'Requested user confirmation for removal',
        status: 'confirmation_required'
      });

      return { spokenResponse: prompt, executionResult: 'Pending removal confirmation', status: 'confirmation_required' };
    }

    // H. CLEAR CART
    if (command.action === 'clear_cart') {
      const prompt =
        lang === 'kn'
          ? 'ದೃಢೀಕರಿಸಿ: ಇಡೀ ಕಾರ್ಟ್ ಖಾಲಿ ಮಾಡಬೇಕೆ? ಮುಂದುವರಿಸಲು ಹೌದು ಎಂದು ಹೇಳಿ.'
          : lang === 'hi'
          ? 'पुष्टि करें: क्या आप पूरी कार्ट खाली करना चाहते हैं? हाँ कहें।'
          : 'Confirm: Clear your entire basket? Say yes to continue.';

      voiceStore.setPendingConfirmation({
        action: 'clear_cart',
        params: {},
        prompt
      });

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'clear_cart',
        params: {},
        confidence: command.confidence,
        language: lang,
        reply: prompt,
        executionResult: 'Requested user confirmation to clear cart',
        status: 'confirmation_required'
      });

      return { spokenResponse: prompt, executionResult: 'Pending clear cart confirmation', status: 'confirmation_required' };
    }

    // I. BUY / BOOK IT / ORDER THIS
    if (command.action === 'buy') {
      const { product, failureReason } = this.resolveProductReference(command.params, context);
      if (!product) {
        handlers.onNavigate('cart');
        if (handlers.onOpenPaymentModal) handlers.onOpenPaymentModal();
        const reply = lang === 'kn' ? 'ಚೆಕ್‌ಔಟ್ ತೆರೆಯಲಾಗಿದೆ.' : lang === 'hi' ? 'चेकआउट खोला गया।' : 'Opening checkout.';
        return { spokenResponse: reply, executionResult: 'Opened checkout', status: 'success' };
      }

      const storeName = product.store === 'amazon' ? 'Amazon' : product.store === 'flipkart' ? 'Flipkart' : 'Meesho';
      const shortTitle = product.title?.split(/[,(-]/)[0]?.trim() || product.title?.slice(0, 32) || 'Product';
      const variant = (product as any).color || (product as any).storage || 'Standard';
      const qty = command.params.quantity || 1;
      const priceStr = `₹${product.price.toLocaleString('en-IN')}`;

      const prompt =
        lang === 'kn'
          ? `ದೃಢೀಕರಿಸಿ: ${shortTitle}, ${variant}, ಪ್ರಮಾಣ ${qty}, ${storeName} ನಿಂದ ${priceStr}. ಬುಕ್ ಮಾಡಲು ಹೌದು ಎಂದು ಹೇಳಿ, ಅಥವಾ ರದ್ದು ಮಾಡಲು ಇಲ್ಲ ಎಂದು ಹೇಳಿ.`
          : lang === 'hi'
          ? `पुष्टि करें: ${shortTitle}, ${variant}, मात्रा ${qty}, ${storeName} से ${priceStr}। बुक करने के लिए हाँ कहें, या रद्द करने के लिए नहीं कहें।`
          : `Confirm: ${shortTitle}, ${variant}, quantity ${qty}, ${priceStr} from ${storeName}. Say yes to book, or no to cancel.`;

      voiceStore.setPendingConfirmation({
        action: 'buy',
        params: { productId: product.productId, store: product.store, product, quantity: qty },
        prompt,
        targetTitle: shortTitle,
        targetPrice: product.price
      });

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'buy',
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply: prompt,
        executionResult: `Requested confirmation to book ${shortTitle}`,
        status: 'confirmation_required'
      });

      return { spokenResponse: prompt, executionResult: 'Pending booking confirmation', status: 'confirmation_required' };
    }

    // I1. PROCEED TO PAYMENT
    if (command.action === 'proceed_to_payment') {
      handlers.onNavigate('cart');
      if (handlers.onOpenPaymentModal) handlers.onOpenPaymentModal();
      const reply =
        lang === 'kn'
          ? 'ದಯವಿಟ್ಟು ಪಾವತಿ ವಿಧಾನವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಪಾವತಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.'
          : lang === 'hi'
          ? 'कृपया भुगतान विधि चुनें और भुगतान पूरा करें।'
          : 'Please choose a payment method and complete the payment.';

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'proceed_to_payment',
        params: {},
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: 'Opened VoiceCart Pay checkout modal',
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: 'Opened payment modal', status: 'success' };
    }

    // I2. INCREASE QUANTITY
    if (command.action === 'increase_quantity') {
      const { cartItem } = this.resolveCartItemReference(command.params, context.cart);
      if (cartItem && handlers.onAddToCart) {
        await handlers.onAddToCart(cartItem.product, 1);
        const reply =
          lang === 'kn'
            ? `${cartItem.product.title.slice(0, 24)} ಪ್ರಮಾಣವನ್ನು ಹೆಚ್ಚಿಸಲಾಗಿದೆ.`
            : lang === 'hi'
            ? `${cartItem.product.title.slice(0, 24)} की मात्रा बढ़ा दी गई है।`
            : `Increased quantity for ${cartItem.product.title.slice(0, 24)}.`;

        return { spokenResponse: reply, executionResult: 'Increased cart item quantity', status: 'success' };
      }
      const emptyReply = lang === 'kn' ? 'ಕಾರ್ಟ್‌ನಲ್ಲಿ ಯಾವುದೇ ವಸ್ತುಗಳಿಲ್ಲ.' : lang === 'hi' ? 'कार्ट खाली है।' : 'Your cart is empty.';
      return { spokenResponse: emptyReply, executionResult: 'No cart item to increase', status: 'clarification' };
    }

    // I3. CONTINUE SHOPPING
    if (command.action === 'continue_shopping') {
      handlers.onNavigate('search');
      const reply = lang === 'kn' ? 'ಶಾಪಿಂಗ್ ಮುಂದುವರಿಸಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'खरीदारी जारी रख रहे हैं।' : 'Continuing shopping.';
      return { spokenResponse: reply, executionResult: 'Navigated to search for continued shopping', status: 'success' };
    }

    // J. READ DETAILS
    if (command.action === 'read_details') {
      const { product } = this.resolveProductReference(command.params, context);
      if (product) {
        handlers.onOpenProductDetail(product);
        const reply =
          lang === 'kn'
            ? `${product.title}. ${product.store.toUpperCase()} ನಲ್ಲಿ ಬೆಲೆ ₹${product.price}. ರೇಟಿಂಗ್ ${product.rating} ಸ್ಟಾರ್ಸ್.`
            : lang === 'hi'
            ? `${product.title}। ${product.store.toUpperCase()} पर कीमत ₹${product.price} है। रेटिंग ${product.rating} स्टार है।`
            : `${product.title} on ${product.store.toUpperCase()} is priced at ₹${product.price.toLocaleString()} with a ${product.rating} star rating.`;

        voiceStore.addDebugLog({
          transcript,
          layer: command.layer,
          action: 'read_details',
          params: command.params,
          confidence: command.confidence,
          language: lang,
          reply,
          executionResult: `Read details for "${product.title}"`,
          status: 'success'
        });

        return { spokenResponse: reply, executionResult: `Read details for "${product.title}"`, status: 'success' };
      }
    }

    // J1. GET SPECIFICATIONS
    if (command.action === 'get_specifications') {
      const { product } = this.resolveProductReference(command.params, context);
      if (!product || (!product.highlights?.length && !Object.keys(product.specifications || {}).length)) {
        const missingReply =
          lang === 'kn'
            ? 'ಅಂಗಡಿ ಇದನ್ನು ಪಟ್ಟಿ ಮಾಡಿಲ್ಲ.'
            : lang === 'hi'
            ? 'स्टोर में यह जानकारी उपलब्ध नहीं है।'
            : "The store doesn't list that.";
        return { spokenResponse: missingReply, executionResult: 'Specifications missing', status: 'success' };
      }

      const highlights = product.highlights?.slice(0, 3).join(', ') ||
        Object.values(product.specifications || {})
          .flatMap(grp => Object.entries(grp).map(([k, v]) => `${k}: ${v}`))
          .slice(0, 3)
          .join(', ');

      const reply =
        lang === 'kn'
          ? `ಮುಖ್ಯ ವಿವರಣೆಗಳು: ${highlights}.`
          : lang === 'hi'
          ? `मुख्य स्पेसिफिकेशन्स हैं: ${highlights}।`
          : `Key specifications are: ${highlights}.`;

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'get_specifications',
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: `Spoke specifications for "${product.title}"`,
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: `Read specifications`, status: 'success' };
    }

    // J2. GET RATING
    if (command.action === 'get_rating') {
      const { product } = this.resolveProductReference(command.params, context);
      if (!product || !product.rating || product.rating <= 0) {
        const missingReply =
          lang === 'kn'
            ? 'ಅಂಗಡಿ ಇದನ್ನು ಪಟ್ಟಿ ಮಾಡಿಲ್ಲ.'
            : lang === 'hi'
            ? 'स्टोर में यह जानकारी उपलब्ध नहीं है।'
            : "The store doesn't list that.";
        return { spokenResponse: missingReply, executionResult: 'Rating missing', status: 'success' };
      }

      const countsText = product.ratingCount > 0 ? ` (${product.ratingCount.toLocaleString()} ratings)` : '';
      const reply =
        lang === 'kn'
          ? `${product.store.toUpperCase()} ನಲ್ಲಿ ರೇಟಿಂಗ್ ${product.rating} ಸ್ಟಾರ್ಸ್${countsText}.`
          : lang === 'hi'
          ? `${product.store.toUpperCase()} पर इसकी रेटिंग ${product.rating} स्टार है${countsText}।`
          : `On ${product.store.toUpperCase()}, it has a rating of ${product.rating} out of 5 stars based on ${product.ratingCount.toLocaleString()} verified ratings.`;

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'get_rating',
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: `Spoke rating: ${product.rating}`,
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: `Read rating`, status: 'success' };
    }

    // J3. GET QUANTITY & PACK SIZE
    if (command.action === 'get_quantity') {
      const { product } = this.resolveProductReference(command.params, context);
      const pack = product?.quantityInfo?.packSize || product?.quantity;
      if (!product || !pack) {
        const missingReply =
          lang === 'kn'
            ? 'ಅಂಗಡಿ ಇದನ್ನು ಪಟ್ಟಿ ಮಾಡಿಲ್ಲ.'
            : lang === 'hi'
            ? 'स्टोर में यह जानकारी उपलब्ध नहीं है।'
            : "The store doesn't list that.";
        return { spokenResponse: missingReply, executionResult: 'Quantity missing', status: 'success' };
      }

      const stock = product.quantityInfo?.stockStatus === 'IN_STOCK' ? 'in stock' : 'limited stock';
      const reply =
        lang === 'kn'
          ? `ಪ್ಯಾಕ್ ಸೈಜ್ ${pack} ಮತ್ತು ಪ್ರಸ್ತುತ ಲಭ್ಯವಿದೆ.`
          : lang === 'hi'
          ? `पैक साइज़ ${pack} है और यह स्टॉक में उपलब्ध है।`
          : `The pack size is ${pack} and it is currently ${stock}.`;

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'get_quantity',
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: `Spoke quantity: ${pack}`,
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: `Read quantity`, status: 'success' };
    }

    // J4. GET QUALITY SCORE
    if (command.action === 'get_quality') {
      const { product } = this.resolveProductReference(command.params, context);
      if (!product || !product.quality?.hasEnoughData) {
        const missingReply =
          lang === 'kn'
            ? 'ಅಂಗಡಿ ಇದನ್ನು ಪಟ್ಟಿ ಮಾಡಿಲ್ಲ.'
            : lang === 'hi'
            ? 'स्टोर में यह जानकारी उपलब्ध नहीं है।'
            : "The store doesn't list that.";
        return { spokenResponse: missingReply, executionResult: 'Quality score missing', status: 'success' };
      }

      const reply =
        lang === 'kn'
          ? `ಗುಣಮಟ್ಟದ ಸ್ಕೋರ್ 10 ರಲ್ಲಿ ${product.quality.score}. ರೇಟಿಂಗ್‌ಗಳು ಮತ್ತು ರಿಟರ್ನ್ ನೀತಿಗಳನ್ನು ಆಧರಿಸಿದೆ.`
          : lang === 'hi'
          ? `इसकी क्वालिटी का स्कोर 10 में से ${product.quality.score} है, जो रेटिंग और ब्रांड नीतियों पर आधारित है।`
          : `The verified quality score is ${product.quality.score} out of 10, computed from customer ratings, seller performance, and return policies.`;

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'get_quality',
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: `Spoke quality score: ${product.quality.score}`,
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: `Read quality score`, status: 'success' };
    }

    // J5. GET BATTERY LIFE
    if (command.action === 'get_battery_life') {
      const { product } = this.resolveProductReference(command.params, context);
      let batteryInfo: string | null = null;

      if (product) {
        // Search in highlights
        const hl = product.highlights?.find(h => /battery|playback|playtime|play time|backup|mah|hours|hrs/i.test(h));
        if (hl) batteryInfo = hl;

        // Search in specs
        if (!batteryInfo && product.specifications) {
          for (const grp of Object.values(product.specifications)) {
            for (const [k, v] of Object.entries(grp)) {
              if (/battery|playback|playtime|backup|capacity|mah/i.test(k) || /playback|battery|playtime|mah/i.test(v)) {
                batteryInfo = `${k}: ${v}`;
                break;
              }
            }
            if (batteryInfo) break;
          }
        }
      }

      if (!batteryInfo) {
        const missingReply =
          lang === 'kn'
            ? 'ಅಂಗಡಿ ಇದನ್ನು ಪಟ್ಟಿ ಮಾಡಿಲ್ಲ.'
            : lang === 'hi'
            ? 'स्टोर में यह जानकारी उपलब्ध नहीं है।'
            : "The store doesn't list that.";
        return { spokenResponse: missingReply, executionResult: 'Battery info missing', status: 'success' };
      }

      const reply =
        lang === 'kn'
          ? `ಬ್ಯಾಟರಿ ವಿವರಗಳು: ${batteryInfo}.`
          : lang === 'hi'
          ? `बैटरी विवरण: ${batteryInfo}।`
          : `The battery life and playtime is: ${batteryInfo}.`;

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'get_battery_life',
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: `Spoke battery info: ${batteryInfo}`,
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: `Read battery info: ${batteryInfo}`, status: 'success' };
    }

    // J6. COMPARE PRICES ACROSS STORES
    if (command.action === 'compare_prices') {
      const { product } = this.resolveProductReference(command.params, context);
      const comparison = context.searchResults?.topRecommendations || null;
      const products = context.searchResults?.products || [];

      if (!product && products.length === 0) {
        const missingReply =
          lang === 'kn'
            ? 'ಹೋಲಿಸಲು ಯಾವುದೇ ಉತ್ಪನ್ನಗಳು ಲಭ್ಯವಿಲ್ಲ.'
            : lang === 'hi'
            ? 'तुलना के लिए कोई उत्पाद उपलब्ध नहीं है।'
            : 'No product comparisons available right now.';
        return { spokenResponse: missingReply, executionResult: 'No comparison data', status: 'clarification' };
      }

      const lowest = comparison?.lowestPrice || (products.length > 0 ? [...products].sort((a, b) => a.price - b.price)[0] : product);
      const lowestStore = lowest?.store === 'amazon' ? 'Amazon' : lowest?.store === 'flipkart' ? 'Flipkart' : 'Meesho';
      const lowestPrice = lowest ? `₹${lowest.price.toLocaleString('en-IN')}` : '';

      const targetStore = command.params.store;
      let reply = '';
      if (targetStore) {
        const storeProd = products.find(p => p.store.toLowerCase() === targetStore.toLowerCase());
        const storeName = targetStore.charAt(0).toUpperCase() + targetStore.slice(1);
        if (storeProd) {
          const isCheapest = storeProd.price <= (lowest?.price || storeProd.price);
          if (lang === 'kn') {
            reply = `${storeName} ನಲ್ಲಿ ಬೆಲೆ ₹${storeProd.price.toLocaleString('en-IN')}${isCheapest ? ' (ಇದು ಅತ್ಯಂತ ಕಡಿಮೆ ಬೆಲೆಯಾಗಿದೆ).' : ` (${lowestStore} ನಲ್ಲಿ ₹${lowest?.price} ಗೆ ಲಭ್ಯವಿದೆ).`}`;
          } else if (lang === 'hi') {
            reply = `${storeName} पर कीमत ₹${storeProd.price.toLocaleString('en-IN')} है${isCheapest ? ' (यह सबसे सस्ता विकल्प है)।' : ` (${lowestStore} पर ₹${lowest?.price} में उपलब्ध है)।`}`;
          } else {
            reply = `On ${storeName}, it is priced at ₹${storeProd.price.toLocaleString('en-IN')}${isCheapest ? ' which is the lowest price.' : `, compared to ${lowestStore} at ₹${lowest?.price}.`}`;
          }
        } else {
          reply =
            lang === 'kn'
              ? `ಈ ಉತ್ಪನ್ನ ${storeName} ನಲ್ಲಿ ಪಟ್ಟಿಯಾಗಿಲ್ಲ. ಅತ್ಯಂತ ಕಡಿಮೆ ಬೆಲೆ ${lowestStore} ನಲ್ಲಿ ${lowestPrice}.`
              : lang === 'hi'
              ? `यह उत्पाद ${storeName} पर उपलब्ध नहीं है। सबसे कम कीमत ${lowestStore} पर ${lowestPrice} है।`
              : `This item is not listed on ${storeName}. The lowest price is on ${lowestStore} at ${lowestPrice}.`;
        }
      } else {
        reply =
          lang === 'kn'
            ? `ಅತ್ಯಂತ ಕಡಿಮೆ ಬೆಲೆ ${lowestStore} ನಲ್ಲಿ ${lowestPrice} ಆಗಿದೆ.`
            : lang === 'hi'
            ? `सबसे कम कीमत ${lowestStore} पर ${lowestPrice} है।`
            : `The lowest price across stores is on ${lowestStore} at ${lowestPrice}.`;
      }

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'compare_prices',
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: `Compared prices across stores`,
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: 'Compared store prices', status: 'success' };
    }

    // J7. SHOW NEXT OPTION
    if (command.action === 'show_next_option') {
      const products = context.searchResults?.products || [];
      const targetIndex = typeof command.params.index === 'number' ? command.params.index : 1;
      const nextProduct = products[targetIndex] || products[0];

      if (nextProduct) {
        handlers.onOpenProductDetail(nextProduct);
        const storeName = nextProduct.store === 'amazon' ? 'Amazon' : nextProduct.store === 'flipkart' ? 'Flipkart' : 'Meesho';
        const reply =
          lang === 'kn'
            ? `ಆಯ್ಕೆ ${targetIndex + 1}: ${nextProduct.title.slice(0, 30)}, ${storeName} ನಲ್ಲಿ ₹${nextProduct.price}. ರೇಟಿಂಗ್ ${nextProduct.rating} ಸ್ಟಾರ್ಸ್.`
            : lang === 'hi'
            ? `विकल्प ${targetIndex + 1}: ${nextProduct.title.slice(0, 30)}, ${storeName} पर ₹${nextProduct.price}। रेटिंग ${nextProduct.rating} स्टार।`
            : `Option ${targetIndex + 1}: ${nextProduct.title.slice(0, 30)} on ${storeName} for ₹${nextProduct.price.toLocaleString('en-IN')} with ${nextProduct.rating} stars.`;

        voiceStore.addDebugLog({
          transcript,
          layer: command.layer,
          action: 'show_next_option',
          params: command.params,
          confidence: command.confidence,
          language: lang,
          reply,
          executionResult: `Selected option #${targetIndex + 1}`,
          status: 'success'
        });

        return { spokenResponse: reply, executionResult: `Opened option #${targetIndex + 1}`, status: 'success' };
      }

      const reply =
        lang === 'kn'
          ? 'ಬೇರೆ ಯಾವುದೇ ಆಯ್ಕೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.'
          : lang === 'hi'
          ? 'कोई अन्य विकल्प नहीं मिला।'
          : 'No other options found.';
      return { spokenResponse: reply, executionResult: 'No next option', status: 'clarification' };
    }

    // J8. CANCEL ORDER
    if (command.action === 'cancel_order') {
      const lastOrder = context.lastOrder;
      const prompt =
        lang === 'kn'
          ? `ದೃಢೀಕರಿಸಿ: ಆರ್ಡರ್ #${lastOrder?.orderId || ''} ಅನ್ನು ರದ್ದುಗೊಳಿಸಬೇಕೆ? ಹೌದು ಎಂದು ಹೇಳಿ.`
          : lang === 'hi'
          ? `पुष्टि करें: क्या आप ऑर्डर #${lastOrder?.orderId || ''} रद्द करना चाहते हैं? हाँ कहें।`
          : `Confirm: Cancel order #${lastOrder?.orderId || ''}? Say yes to proceed.`;

      voiceStore.setPendingConfirmation({
        action: 'cancel_order',
        params: { orderId: lastOrder?.orderId },
        prompt
      });

      return { spokenResponse: prompt, executionResult: 'Pending cancel order confirmation', status: 'confirmation_required' };
    }

    // J9. BUY AGAIN / REORDER
    if (command.action === 'buy_again') {
      const lastOrder = context.lastOrder;
      if (lastOrder && lastOrder.items && lastOrder.items.length > 0 && handlers.onAddToCart) {
        for (const item of lastOrder.items) {
          const prod = (item as any).product || item;
          await handlers.onAddToCart(prod as Product, item.quantity || 1);
        }
        handlers.onNavigate('cart');
        const reply =
          lang === 'kn'
            ? 'ನಿಮ್ಮ ಹಿಂದಿನ ಆರ್ಡರ್‌ನ ವಸ್ತುಗಳನ್ನು ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ.'
            : lang === 'hi'
            ? 'आपके पिछले ऑर्डर के आइटम फिर से कार्ट में जोड़ दिए गए हैं।'
            : 'Added items from your previous order back to your cart.';
        return { spokenResponse: reply, executionResult: 'Reordered previous items', status: 'success' };
      }
      const reply = lang === 'kn' ? 'ಯಾವುದೇ ಹಿಂದಿನ ಆರ್ಡರ್ ಕಂಡುಬಂದಿಲ್ಲ.' : lang === 'hi' ? 'कोई पिछला ऑर्डर नहीं मिला।' : 'No previous order found to reorder.';
      return { spokenResponse: reply, executionResult: 'No previous order', status: 'clarification' };
    }

    // K. CHANGE LANGUAGE
    if (command.action === 'change_language' && command.params.language) {
      const targetLang = command.params.language;
      handlers.onSetLanguage(targetLang);
      const reply =
        targetLang === 'kn'
          ? 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.'
          : targetLang === 'hi'
          ? 'भाषा बदलकर हिन्दी कर दी गई है।'
          : 'Language changed to English.';

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'change_language',
        params: { language: targetLang },
        confidence: command.confidence,
        language: targetLang,
        reply,
        executionResult: `Changed app language to ${targetLang.toUpperCase()}`,
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: `Switched language to ${targetLang}`, status: 'success' };
    }

    // L. AUTHENTICATION & USER ACTIONS
    if (command.action === 'whoami') {
      const targetRoute = command.params?.section ? `/account/${command.params.section}` : '/account';
      if (handlers.onNavigateRoute) {
        handlers.onNavigateRoute(targetRoute);
      } else if (handlers.onOpenAuth) {
        handlers.onOpenAuth('profile');
      }
      const reply =
        lang === 'kn'
          ? 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಖಾತೆಯ ವಿವರಗಳು ಇಲ್ಲಿವೆ.'
          : lang === 'hi'
          ? 'यह रहा आपके खाते और प्रोफाइल का विवरण।'
          : 'Here are your profile and account details.';

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'whoami',
        params: command.params || {},
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: `Navigated to ${targetRoute}`,
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: `Opened ${targetRoute}`, status: 'success' };
    }

    if (command.action === 'logout') {
      if (handlers.onSignOut) await handlers.onSignOut();
      const reply =
        lang === 'kn'
          ? 'ಖಾತೆಯಿಂದ ಯಶಸ್ವಿಯಾಗಿ ಲಾಗ್ ಔಟ್ ಮಾಡಲಾಗಿದೆ.'
          : lang === 'hi'
          ? 'खाते से सफलतापूर्वक लॉग आउट कर दिया गया है।'
          : 'You have been signed out successfully.';

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'logout',
        params: {},
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: 'Executed voice logout',
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: 'Signed out user', status: 'success' };
    }

    if (command.action === 'login') {
      if (handlers.onNavigateRoute) handlers.onNavigateRoute('/login');
      else if (handlers.onOpenAuth) handlers.onOpenAuth('login');
      const reply =
        lang === 'kn'
          ? 'ಲಾಗಿನ್ ಪುಟಕ್ಕೆ ತೆರಳಲಾಗಿದೆ.'
          : lang === 'hi'
          ? 'लॉगिन पृष्ठ खोल दिया गया है।'
          : 'Opening login page.';

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'login',
        params: {},
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: 'Navigated to /login page',
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: 'Navigated to /login', status: 'success' };
    }

    if (command.action === 'signup') {
      if (handlers.onNavigateRoute) handlers.onNavigateRoute('/signup');
      else if (handlers.onOpenAuth) handlers.onOpenAuth('signup');
      const reply =
        lang === 'kn'
          ? 'ಸೈನ್ ಅಪ್ ಪುಟಕ್ಕೆ ತೆರಳಲಾಗಿದೆ.'
          : lang === 'hi'
          ? 'साइन अप पृष्ठ खोल दिया गया है।'
          : 'Opening signup page.';

      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'signup',
        params: {},
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: 'Navigated to /signup page',
        status: 'success'
      });

      return { spokenResponse: reply, executionResult: 'Navigated to /signup', status: 'success' };
    }

    if (command.action === 'login_as') {
      if (handlers.onNavigateRoute) handlers.onNavigateRoute('/login');
      else if (handlers.onOpenAuth) handlers.onOpenAuth('login');
      const reply = command.reply || 'Please enter the 6-digit verification code on your screen.';
      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'login_as',
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: `Navigated to /login for account "${command.params?.name || ''}"`,
        status: 'success'
      });
      return { spokenResponse: reply, executionResult: `Opened login for "${command.params?.name || ''}"`, status: 'success' };
    }

    if (command.action === 'select_category') {
      const cat = command.params?.category || 'all';
      if (handlers.onSelectCategory) {
        handlers.onSelectCategory(cat);
      }
      handlers.onNavigate('home');
      const reply = command.reply || 'Showing selected category.';
      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'select_category',
        params: command.params,
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: `Selected category ${cat}`,
        status: 'success'
      });
      return { spokenResponse: reply, executionResult: `Switched to category "${cat}"`, status: 'success' };
    }

    // M. GO BACK / STOP / HELP / CHAT
    if (command.action === 'go_back') {
      handlers.onNavigate('home');
      const reply = lang === 'kn' ? 'ಹಿಂದಿನ ಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಲಾಗಿದೆ.' : lang === 'hi' ? 'पीछे आ गए।' : 'Navigated back.';
      return { spokenResponse: reply, executionResult: 'Navigated back', status: 'success' };
    }

    if (command.action === 'help') {
      const reply = command.reply || 'You can search products, compare across Amazon and Flipkart, and pay via UPI.';
      voiceStore.addDebugLog({
        transcript,
        layer: command.layer,
        action: 'help',
        params: {},
        confidence: command.confidence,
        language: lang,
        reply,
        executionResult: 'Provided voice command assistance',
        status: 'success'
      });
      return { spokenResponse: reply, executionResult: 'Provided help', status: 'success' };
    }

    // Default Chat
    const chatReply = command.reply || 'How can I assist you with your shopping?';
    voiceStore.addDebugLog({
      transcript,
      layer: command.layer,
      action: 'chat',
      params: command.params,
      confidence: command.confidence,
      language: lang,
      reply: chatReply,
      executionResult: 'Handled as conversational query',
      status: 'success'
    });

    return { spokenResponse: chatReply, executionResult: 'General chat response', status: 'success' };
  }
}

export const actionDispatcher = new ActionDispatcher();
