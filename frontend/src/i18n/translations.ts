export type SupportedLanguage = 'auto' | 'en' | 'hi' | 'kn';
export type ActiveLanguage = 'en' | 'hi' | 'kn';

export interface Translations {
  appName: string;
  heroTag: string;
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  searchBtn: string;
  listeningPrompt: string;
  listeningHint: string;
  tapToSpeak: string;
  searchingStores: string;
  rankBy: string;
  rankedResultsFor: string;
  liveItemsAnalyzed: string;
  bestOverall: string;
  lowestPrice: string;
  fastestDelivery: string;
  bestRated: string;
  addToCart: string;
  buyOn: string;
  crossStoreComparison: string;
  realTimeData: string;
  storePlatform: string;
  dealPrice: string;
  deliverySpeed: string;
  customerRating: string;
  platformStatus: string;
  officialStore: string;
  liveVerified: string;
  notAvailable: string;
  cartTitle: string;
  cartEmpty: string;
  cartEmptyDesc: string;
  recheckPrices: string;
  clearCart: string;
  orderSummary: string;
  itemsTotal: string;
  discountSavings: string;
  deliveryCharges: string;
  freeDelivery: string;
  totalAmount: string;
  secureRouteNotice: string;
  checkoutOn: string;
  directCheckout: string;
  ordersTitle: string;
  ordersSubtitle: string;
  noOrders: string;
  noOrdersDesc: string;
  trackNewOrder: string;
  pasteSmsBtn: string;
  officialTracking: string;
  settingsTitle: string;
  providerStatus: string;
  speechLanguage: string;
  rankingAlgorithm: string;
  themeTitle: string;
  darkMode: string;
  lightMode: string;
  affiliateDisclosureTitle: string;
  affiliateDisclosureText: string;
  balanced: string;
  cheapest: string;
  quickPills: string[];
}

export const translations: Record<'en' | 'hi' | 'kn', Translations> & { auto?: Translations } = {
  en: {
    appName: 'VoiceCart',
    heroTag: 'Multi-Store AI Voice Shopping',
    heroTitle: 'Speak Your Wish. We Compare Prices.',
    heroSubtitle: 'Live official data across Amazon India, Flipkart, and Meesho with explainable ranking.',
    searchPlaceholder: 'Or type query (e.g. boAt earbuds under 2000, running shoes)...',
    searchBtn: 'Search',
    listeningPrompt: 'Listening in English... speak now',
    listeningHint: 'Tap mic or say e.g. "Find boAt earbuds under 2000 rupees"',
    tapToSpeak: 'Tap to speak',
    searchingStores: '⚡ Querying Amazon, Flipkart & Meesho live engines...',
    rankBy: 'Rank by:',
    rankedResultsFor: 'Ranked Recommendations for',
    liveItemsAnalyzed: 'live products analyzed',
    bestOverall: 'Best Overall',
    lowestPrice: 'Lowest Price',
    fastestDelivery: 'Fastest Delivery',
    bestRated: 'Top Rated',
    addToCart: 'Add to Cart',
    buyOn: 'Buy on',
    crossStoreComparison: '⚖️ Live 3-Store Cross Comparison',
    realTimeData: 'Real-time API Data',
    storePlatform: 'Store Platform',
    dealPrice: 'Lowest Deal Price',
    deliverySpeed: 'Delivery Speed',
    customerRating: 'Customer Rating',
    platformStatus: 'Platform Status',
    officialStore: 'Official Store',
    liveVerified: 'Live Verified',
    notAvailable: 'Not Available',
    cartTitle: 'Items in Basket',
    cartEmpty: 'Your VoiceCart is Empty',
    cartEmptyDesc: 'Tap the voice microphone and say "Find boAt earbuds under 2000 rupees" to add items across stores.',
    recheckPrices: 'Re-check Live Prices',
    clearCart: 'Clear',
    orderSummary: 'Order Summary',
    itemsTotal: 'Items Total',
    discountSavings: 'Total Discount Savings',
    deliveryCharges: 'Delivery Charges',
    freeDelivery: 'FREE',
    totalAmount: 'Total Amount',
    secureRouteNotice: '🔒 VoiceCart routes your order directly to the official merchant app or site where payment is fulfilled safely.',
    checkoutOn: 'Checkout on',
    directCheckout: 'VoiceCart Checkout (UPI / Cards / Netbanking)',
    ordersTitle: 'Tracked Orders',
    ordersSubtitle: 'Live tracking across Amazon India, Flipkart, and Meesho',
    noOrders: 'No Orders Tracked Yet',
    noOrdersDesc: 'After making a purchase on Amazon or Flipkart, paste the confirmation SMS or order ID here to track it.',
    trackNewOrder: 'Track New Order',
    pasteSmsBtn: 'Paste Order SMS / Confirmation',
    officialTracking: 'Official Store Tracking',
    settingsTitle: 'Settings & Status',
    providerStatus: 'Real-Time Store Provider Status',
    speechLanguage: 'Speech & Language Recognition',
    rankingAlgorithm: 'Default Product Ranking Algorithm',
    themeTitle: 'Theme & Appearance',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    affiliateDisclosureTitle: 'Official Affiliate & Partner Disclosure',
    affiliateDisclosureText: 'VoiceCart is a participant in official affiliate and partner programs. All prices, ratings, and product data are fetched dynamically in real-time from official APIs. We do not automate checkout logins or compromise customer credentials.',
    balanced: 'Balanced',
    cheapest: 'Lowest Price',
    quickPills: [
      'boAt earbuds under 2000',
      'Noise smartwatch under 1500',
      'Sony wireless headphones',
      '5G Smartphone under 15000'
    ]
  },
  hi: {
    appName: 'वॉयसकार्ट',
    heroTag: 'मल्टी-स्टोर एआई वॉयस शॉपिंग',
    heroTitle: 'अपनी पसंद बोलें। हम कीमतें तुलना करेंगे।',
    heroSubtitle: 'अमेज़न इंडिया, फ्लिपकार्ट और मीशो पर लाइव डेटा और स्पष्ट रैंकिंग।',
    searchPlaceholder: 'या खोजें (उदा. boAt ईयरबड्स 2000 के अंदर, रनिंग शूज)...',
    searchBtn: 'खोजें',
    listeningPrompt: 'हिन्दी में सुन रहे हैं... बोलिए',
    listeningHint: 'माइक दबाएं या कहें "2000 रुपये के अंदर boAt ईयरबड्स दिखाओ"',
    tapToSpeak: 'बोलने के लिए दबाएं',
    searchingStores: '⚡ अमेज़न, फ्लिपकार्ट और मीशो पर लाइव खोज जारी है...',
    rankBy: 'रैंक क्रम:',
    rankedResultsFor: 'के लिए सर्वोत्तम सुझाव:',
    liveItemsAnalyzed: 'लाइव उत्पाद विश्लेषित',
    bestOverall: 'सर्वोत्तम विकल्प',
    lowestPrice: 'सबसे कम कीमत',
    fastestDelivery: 'सबसे तेज़ डिलीवरी',
    bestRated: 'उच्चतम रेटिंग',
    addToCart: 'कार्ट में जोड़ें',
    buyOn: 'पर खरीदें',
    crossStoreComparison: '⚖️ लाइव 3-स्टोर तुलना तालिका',
    realTimeData: 'रीयल-टाइम डेटा',
    storePlatform: 'स्टोर प्लेटफॉर्म',
    dealPrice: 'सबसे कम कीमत',
    deliverySpeed: 'डिलीवरी समय',
    customerRating: 'ग्राहक रेटिंग',
    platformStatus: 'प्लेटफॉर्म स्थिति',
    officialStore: 'आधिकारिक स्टोर',
    liveVerified: 'सत्यापित लाइव',
    notAvailable: 'उपलब्ध नहीं',
    cartTitle: 'कार्ट के उत्पाद',
    cartEmpty: 'आपकी कार्ट खाली है',
    cartEmptyDesc: 'माइक दबाएं और कहें "2000 के अंदर boAt ईयरबड्स" उत्पाद जोड़ने के लिए।',
    recheckPrices: 'लाइव कीमतें दोबारा जांचें',
    clearCart: 'खाली करें',
    orderSummary: 'ऑर्डर सारांश',
    itemsTotal: 'कुल उत्पाद मूल्य',
    discountSavings: 'कुल छूट बचत',
    deliveryCharges: 'डिलीवरी शुल्क',
    freeDelivery: 'मुफ़्त',
    totalAmount: 'कुल देय राशि',
    secureRouteNotice: '🔒 वॉयसकार्ट आपके ऑर्डर को आधिकारिक स्टोर पर सुरक्षित रूप से निर्देशित करता है।',
    checkoutOn: 'पर चेकआउट करें',
    directCheckout: 'वॉयसकार्ट चेकआउट (UPI / Cards / Netbanking)',
    ordersTitle: 'ट्रैक किए गए ऑर्डर',
    ordersSubtitle: 'अमेज़न, फ्लिपकार्ट और मीशो पर लाइव ट्रैकिंग',
    noOrders: 'कोई ऑर्डर नहीं मिला',
    noOrdersDesc: 'खरीदारी के बाद पुष्टिकरण एसएमएस यहाँ पेस्ट करें।',
    trackNewOrder: 'नया ऑर्डर ट्रैक करें',
    pasteSmsBtn: 'ऑर्डर SMS पेस्ट करें',
    officialTracking: 'आधिकारिक ट्रैकिंग',
    settingsTitle: 'सेटिंग्स और स्थिति',
    providerStatus: 'स्टोर प्रोवाइडर स्थिति',
    speechLanguage: 'आवाज़ और भाषा',
    rankingAlgorithm: 'डिफ़ॉल्ट रैंकिंग एल्गोरिदम',
    themeTitle: 'थीम और दिखावट',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    affiliateDisclosureTitle: 'आधिकारिक सहबद्ध प्रकटीकरण',
    affiliateDisclosureText: 'वॉयसकार्ट आधिकारिक एफिलिएट प्रोग्राम में भाग लेता है। सभी डेटा रीयल-टाइम में प्राप्त किया जाता है।',
    balanced: 'संतुलित (स्मार्ट)',
    cheapest: 'सबसे कम कीमत',
    quickPills: [
      '2000 के अंदर boAt ईयरबड्स',
      '1500 के अंदर स्मार्टवॉच',
      'सोनी हेडफ़ोन',
      '15000 के अंदर 5G मोबाइल'
    ]
  },
  kn: {
    appName: 'ವಾಯ್ಸ್‌ಕಾರ್ಟ್',
    heroTag: 'ಮಲ್ಟಿ-ಸ್ಟೋರ್ ಎಐ ಧ್ವನಿ ಶಾಪಿಂಗ್',
    heroTitle: 'ನಿಮ್ಮಿಷ್ಟವನ್ನು ಮಾತನಾಡಿ. ನಾವು ಬೆಲೆ ಹೋಲಿಸುತ್ತೇವೆ.',
    heroSubtitle: 'ಅಮೆಜಾನ್ ಇಂಡಿಯಾ, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ಮತ್ತು ಮೀಶೋ ಲೈವ್ ಅಧಿಕೃತ ಡೇಟಾ ಮತ್ತು ವಿವರಣಾತ್ಮಕ ರ‍್ಯಾಂಕಿಂಗ್.',
    searchPlaceholder: 'ಅಥವಾ ಟೈಪ್ ಮಾಡಿ (ಉದಾ. 2000 ಒಳಗೆ boAt earbuds, ಶೂಗಳು)...',
    searchBtn: 'ಹುಡುಕು',
    listeningPrompt: 'ಕನ್ನಡದಲ್ಲಿ ಆಲಿಸಲಾಗುತ್ತಿದೆ... ಮಾತನಾಡಿ',
    listeningHint: 'ಮೈಕ್ ಒತ್ತಿ ಅಥವಾ "2000 ಒಳಗೆ ಒಳ್ಳೆಯ boAt earbuds ತೋರಿಸು" ಎಂದು ಹೇಳಿ',
    tapToSpeak: 'ಮಾತನಾಡಲು ಒತ್ತಿ',
    searchingStores: '⚡ ಅಮೆಜಾನ್, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ಮತ್ತು ಮೀಶೋ ಲೈವ್ ಹುಡುಕಾಟ ನಡೆಯುತ್ತಿದೆ...',
    rankBy: 'ವರ್ಗೀಕರಣ:',
    rankedResultsFor: 'ಉತ್ಪನ್ನ ಶಿಫಾರಸುಗಳು:',
    liveItemsAnalyzed: 'ಲೈವ್ ಉತ್ಪನ್ನಗಳ ವಿಶ್ಲೇಷಣೆ',
    bestOverall: 'ಅತ್ಯುತ್ತಮ ಆಯ್ಕೆ',
    lowestPrice: 'ಕಡಿಮೆ ಬೆಲೆ',
    fastestDelivery: 'ವೇಗದ ಡೆಲಿವರಿ',
    bestRated: 'ಉತ್ತಮ ರೇಟಿಂಗ್',
    addToCart: 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸು',
    buyOn: 'ನಲ್ಲಿ ಖರೀದಿಸಿ',
    crossStoreComparison: '⚖️ 3-ಸ್ಟೋರ್ ಲೈವ್ ಬೆಲೆ ಹೋಲಿಕೆ',
    realTimeData: 'ನೈಜ-ಸಮಯದ ಡೇಟಾ',
    storePlatform: 'ಸ್ಟೋರ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್',
    dealPrice: 'ಕಡಿಮೆ ಬೆಲೆ ಡೀಲ್',
    deliverySpeed: 'ಡೆಲಿವರಿ ವೇಗ',
    customerRating: 'ಗ್ರಾಹಕರ ರೇಟಿಂಗ್',
    platformStatus: 'ಸ್ಟೋರ್ ಸ್ಥಿತಿ',
    officialStore: 'ಅಧಿಕೃತ ಸ್ಟೋರ್',
    liveVerified: 'ಲೈವ್ ದೃಢೀಕೃತ',
    notAvailable: 'ಲಭ್ಯವಿಲ್ಲ',
    cartTitle: 'ಬುಟ್ಟಿಯಲ್ಲಿರುವ ಉತ್ಪನ್ನಗಳು',
    cartEmpty: 'ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ',
    cartEmptyDesc: 'ಧ್ವನಿ ಮೈಕ್ ಒತ್ತಿ "2000 ಒಳಗೆ ಇಯರ್‌ಬಡ್ಸ್" ಎಂದು ಹೇಳಿ ಉತ್ಪನ್ನಗಳನ್ನು ಸೇರಿಸಿ.',
    recheckPrices: 'ಲೈವ್ ಬೆಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
    clearCart: 'ಖಾಲಿ ಮಾಡು',
    orderSummary: 'ಆರ್ಡರ್ ಸಾರಾಂಶ',
    itemsTotal: 'ಒಟ್ಟು ಉತ್ಪನ್ನಗಳ ಮೊತ್ತ',
    discountSavings: 'ಒಟ್ಟು ರಿಯಾಯಿತಿ ಉಳಿತಾಯ',
    deliveryCharges: 'ಡೆಲಿವರಿ ಶುಲ್ಕ',
    freeDelivery: 'ಉಚಿತ',
    totalAmount: 'ಪಾವತಿಸಬೇಕಾದ ಒಟ್ಟು ಮೊತ್ತ',
    secureRouteNotice: '🔒 ವಾಯ್ಸ್‌ಕಾರ್ಟ್ ನಿಮ್ಮ ಆರ್ಡರ್ ಅನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಅಧಿಕೃತ ಸ್ಟೋರ್ ಪುಟಕ್ಕೆ ನಿರ್ದೇಶಿಸುತ್ತದೆ.',
    checkoutOn: 'ನಲ್ಲಿ ಚೆಕ್‌ಔಟ್ ಮಾಡಿ',
    directCheckout: 'ವಾಯ್ಸ್‌ಕಾರ್ಟ್ ಪಾವತಿ (VoiceCart Checkout)',
    ordersTitle: 'ಟ್ರ್ಯಾಕ್ ಮಾಡಿದ ಆರ್ಡರ್‌ಗಳು',
    ordersSubtitle: 'ಅಮೆಜಾನ್, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ಮತ್ತು ಮೀಶೋನಲ್ಲಿ ಲೈವ್ ಟ್ರ್ಯಾಕಿಂಗ್',
    noOrders: 'ಯಾವುದೇ ಆರ್ಡರ್‌ಗಳು ಇಲ್ಲ',
    noOrdersDesc: 'ಖರೀದಿಸಿದ ನಂತರ SMS ಸಂದೇಶವನ್ನು ಇಲ್ಲಿ ಪೇಸ್ಟ್ ಮಾಡಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
    trackNewOrder: 'ಹೊಸ ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    pasteSmsBtn: 'ಆರ್ಡರ್ SMS ಪೇಸ್ಟ್ ಮಾಡಿ',
    officialTracking: 'ಅಧಿಕೃತ ಸ್ಟೋರ್ ಟ್ರ್ಯಾಕಿಂಗ್',
    settingsTitle: 'ಸೆಟ್ಟಿಂಗ್ಸ್ ಮತ್ತು ಸ್ಥಿತಿ',
    providerStatus: 'ರಿಯಲ್-ಟೈಮ್ ಸ್ಟೋರ್ ಪ್ರೊವೈಡರ್ ಸ್ಥಿತಿ',
    speechLanguage: 'ಧ್ವನಿ ಮತ್ತು ಭಾಷೆ ಗುರುತಿಸುವಿಕೆ',
    rankingAlgorithm: 'ಉತ್ಪನ್ನ ರ‍್ಯಾಂಕಿಂಗ್ ಅಲ್ಗಾರಿದಮ್',
    themeTitle: 'ಥೀಮ್ ಮತ್ತು ನೋಟ',
    darkMode: 'ಡಾರ್ಕ್ ಮೋಡ್',
    lightMode: 'ಲೈಟ್ ಮೋಡ್',
    affiliateDisclosureTitle: 'ಅಧಿಕೃತ ಪಾಲುದಾರಿಕೆ ಪ್ರಕಟಣೆ',
    affiliateDisclosureText: 'ವಾಯ್ಸ್‌ಕಾರ್ಟ್ ಅಧಿಕೃತ ಅಂಗಸಂಸ್ಥೆ ಕಾರ್ಯಕ್ರಮಗಳಲ್ಲಿ ಭಾಗವಹಿಸುತ್ತದೆ. ಎಲ್ಲಾ ಮಾಹಿತಿಯನ್ನು ನೇರವಾಗಿ ಅಧಿಕೃತ API ಮೂಲಕ ಪಡೆಯಲಾಗುತ್ತದೆ.',
    balanced: 'ಸಮತೋಲಿತ (ಸ್ಮಾರ್ಟ್)',
    cheapest: 'ಕಡಿಮೆ ಬೆಲೆ',
    quickPills: [
      '2000 ಒಳಗೆ boAt earbuds',
      '1500 ಒಳಗೆ ಸ್ಮಾರ್ಟ್‌ವಾಚ್',
      'ಸೋನಿ ಹೆಡ್‌ಫೋನ್',
      '15000 ಒಳಗೆ 5G ಮೊಬೈಲ್'
    ]
  }
};
