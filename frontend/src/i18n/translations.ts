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

  // Navigation & Header
  deliverTo: string;
  selectLocation: string;
  changePincode: string;
  cart: string;
  login: string;
  signup: string;
  myAccount: string;
  myOrders: string;
  logout: string;
  speakSearchShop: string;
  searchTooltip: string;
  themeToggle: string;
  home: string;
  categories: string;
  dealsAndOffers: string;
  shopByCategory: string;
  startVoiceShopping: string;
  allProducts: string;

  // Categories
  laptops: string;
  mobiles: string;
  smartwatches: string;
  headphones: string;
  appliances: string;
  shoes: string;
  fashion: string;
  electronics: string;
  books: string;
  toys: string;

  // Dashboard & Features
  heroVoicePill: string;
  heroVoiceTitle: string;
  heroVoiceSub: string;
  trySaying: string;
  voiceSearchNow: string;
  viewAllDeals: string;
  featuredDeals: string;
  featuredDealsSub: string;
  specialOfferTitle: string;
  specialOfferSub: string;
  shopNow: string;
  popularCategories: string;
  popularCategoriesSub: string;

  // Comparison & Badges
  compare: string;
  compared: string;
  inStock: string;
  outOfStock: string;
  addedToCart: string;
  viewProduct: string;
  ratingsAndReviews: string;
  allStores: string;
  sort: string;
  exactMatch: string;
  similarMatches: string;
  noProductsFound: string;

  // Checkout & Payments
  proceedToCheckout: string;
  paymentOptions: string;
  cashOnDelivery: string;
  upiPayment: string;
  qrPayment: string;
  cardNetbanking: string;
  wallet: string;
  placeOrder: string;
  deliveryAddress: string;
  changeAddress: string;
  pincode: string;

  // Voice Assistant & Statuses
  voiceAssistant: string;
  listening: string;
  processing: string;
  showingResults: string;
  voiceHelpTitle: string;
  voiceHintPrompt: string;
  youLabel: string;
  assistantLabel: string;
  voiceStopped: string;
  commandProcessed: string;
  couldNotProcess: string;

  // Modals & General
  welcomeBack: string;
  createAccount: string;
  email: string;
  password: string;
  fullName: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  save: string;
  cancel: string;
  close: string;
  apply: string;

  // Search & Cart Extras
  youSearchedFor: string;
  exactMatchFound: string;
  similarOnlyFound: string;
  noExactResults: string;
  emptyCart: string;
  shoppingBasket: string;
  remove: string;
  totalPayable: string;
  checkout: string;
  trackedOrders: string;
  trackOrder: string;
  sponsored: string;
  noRatings: string;
  ratings: string;
  reviews: string;
  delivery: string;
  trusted: string;
}

export const translations: Record<'en' | 'hi' | 'kn', Translations> & { auto?: Translations } = {
  en: {
    appName: 'VoiceCart',
    heroTag: 'Multi-Store AI Voice Shopping',
    heroTitle: 'Speak Your Wish. We Compare Prices.',
    heroSubtitle: 'Live official data across Amazon India, Flipkart, and Meesho with explainable ranking.',
    searchPlaceholder: 'Search products, brands (e.g. boAt earbuds, shoes)...',
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
    ],

    deliverTo: 'Deliver to',
    selectLocation: 'Select Location',
    changePincode: 'Change Pincode',
    cart: 'Cart',
    login: 'Login',
    signup: 'Sign Up',
    myAccount: 'My Account',
    myOrders: 'My Orders',
    logout: 'Logout',
    speakSearchShop: 'Speak · Search · Shop',
    searchTooltip: 'Voice search with AI',
    themeToggle: 'Toggle Theme',
    home: 'Home',
    categories: 'Categories',
    dealsAndOffers: 'Deals & Offers',
    shopByCategory: 'Shop by Category',
    startVoiceShopping: 'Start Voice Shopping',
    allProducts: 'All Products',

    laptops: 'Laptops',
    mobiles: 'Mobiles',
    smartwatches: 'Smartwatches',
    headphones: 'Headphones',
    appliances: 'TV & Appliances',
    shoes: 'Shoes',
    fashion: 'Fashion',
    electronics: 'Electronics',
    books: 'Books',
    toys: 'Toys & More',

    heroVoicePill: 'Voice Controlled Shopping',
    heroVoiceTitle: 'Your Smart Shopping Companion',
    heroVoiceSub: 'Find the best products across Amazon, Flipkart & Meesho with just your voice.',
    trySaying: 'Try saying:',
    voiceSearchNow: 'Voice Search Now',
    viewAllDeals: 'View All Deals',
    featuredDeals: 'Featured Multi-Store Deals',
    featuredDealsSub: 'Real-time verified pricing across Amazon, Flipkart & Meesho',
    specialOfferTitle: 'Special Voice Shopping Offer',
    specialOfferSub: 'Get up to 40% OFF on Top Electronics using voice search.',
    shopNow: 'Shop Deals Now',
    popularCategories: 'Popular Categories',
    popularCategoriesSub: 'Explore trending categories with real-time price comparisons',

    compare: 'Compare',
    compared: 'Compared',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    addedToCart: 'Added to Cart',
    viewProduct: 'View Details',
    ratingsAndReviews: 'Ratings & Reviews',
    allStores: 'All Stores',
    sort: 'Sort:',
    exactMatch: 'Exact Match Found ✓',
    similarMatches: 'Similar Matches Found',
    noProductsFound: 'No products found. Try changing your search query or filters.',

    proceedToCheckout: 'Proceed to Checkout',
    paymentOptions: 'Payment Options',
    cashOnDelivery: 'Cash on Delivery (COD)',
    upiPayment: 'UPI Payment (Instant)',
    qrPayment: 'Scan UPI QR Code',
    cardNetbanking: 'Credit / Debit Cards & Netbanking',
    wallet: 'Wallets',
    placeOrder: 'Place Order',
    deliveryAddress: 'Delivery Address',
    changeAddress: 'Change',
    pincode: 'PIN Code',

    voiceAssistant: 'AI Voice Assistant',
    listening: 'Listening...',
    processing: 'Processing...',
    showingResults: 'Showing results...',
    voiceHelpTitle: 'Voice Shopping Assistant',
    voiceHintPrompt: 'Say anything like: "Find shoes under 1500" or "Compare laptops"',
    youLabel: 'You',
    assistantLabel: 'VoiceCart',
    voiceStopped: 'Voice stopped.',
    commandProcessed: 'Command processed.',
    couldNotProcess: 'Could not process that command. Please try again.',

    welcomeBack: 'Welcome Back',
    createAccount: 'Create an Account',
    email: 'Email Address',
    password: 'Password',
    fullName: 'Full Name',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    apply: 'Apply',

    youSearchedFor: 'You searched for:',
    exactMatchFound: 'Exact Match Found ✓',
    similarOnlyFound: 'Exact product not found, showing similar',
    noExactResults: 'No exact results',
    emptyCart: 'Your basket is empty',
    shoppingBasket: 'Shopping Basket',
    remove: 'Remove',
    totalPayable: 'Total Payable',
    checkout: 'Proceed to Checkout',
    trackedOrders: 'Tracked Orders',
    trackOrder: 'Track New Order',
    sponsored: 'Sponsored',
    noRatings: 'No ratings yet',
    ratings: 'Ratings',
    reviews: 'Reviews',
    delivery: 'Delivery',
    trusted: 'Trusted'
  },
  hi: {
    appName: 'वॉयसकार्ट',
    heroTag: 'मल्टी-स्टोर एआई वॉयस शॉपिंग',
    heroTitle: 'अपनी पसंद बोलें। हम कीमतें तुलना करेंगे।',
    heroSubtitle: 'अमेज़न इंडिया, फ्लिपकार्ट और मीशो पर लाइव डेटा और स्पष्ट रैंकिंग।',
    searchPlaceholder: 'उत्पाद, ब्रांड खोजें (उदा. boAt ईयरबड्स, जूते)...',
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
    ],

    deliverTo: 'डिलीवरी स्थान',
    selectLocation: 'स्थान चुनें',
    changePincode: 'पिनकोड बदलें',
    cart: 'कार्ट',
    login: 'लॉग इन',
    signup: 'साइन अप',
    myAccount: 'मेरा खाता',
    myOrders: 'मेरे ऑर्डर',
    logout: 'लॉगआउट',
    speakSearchShop: 'बोलें · खोजें · खरीदें',
    searchTooltip: 'एआई वॉयस खोज',
    themeToggle: 'थीम बदलें',
    home: 'होम',
    categories: 'श्रेणियाँ',
    dealsAndOffers: 'ऑफ़र और छूट',
    shopByCategory: 'श्रेणी अनुसार खोजें',
    startVoiceShopping: 'वॉयस शॉपिंग शुरू करें',
    allProducts: 'सभी उत्पाद',

    laptops: 'लैपटॉप',
    mobiles: 'मोबाइल',
    smartwatches: 'स्मार्टवॉच',
    headphones: 'हेडफ़ोन',
    appliances: 'टीवी और उपकरण',
    shoes: 'जूते',
    fashion: 'फैशन',
    electronics: 'इलेक्ट्रॉनिक्स',
    books: 'किताबें',
    toys: 'खिलौने और अधिक',

    heroVoicePill: 'वॉयस नियंत्रित शॉपिंग',
    heroVoiceTitle: 'आपका स्मार्ट शॉपिंग साथी',
    heroVoiceSub: 'केवल अपनी आवाज़ से अमेज़न, फ्लिपकार्ट और मीशो पर बेहतरीन उत्पाद पाएं।',
    trySaying: 'बोलकर देखें:',
    voiceSearchNow: 'अभी आवाज़ से खोजें',
    viewAllDeals: 'सभी ऑफ़र देखें',
    featuredDeals: 'प्रमुख मल्टी-स्टोर ऑफ़र',
    featuredDealsSub: 'अमेज़न, फ्लिपकार्ट और मीशो पर रीयल-टाइम सत्यापित कीमतें',
    specialOfferTitle: 'विशेष वॉयस शॉपिंग ऑफर',
    specialOfferSub: 'वॉयस सर्च का उपयोग करके शीर्ष इलेक्ट्रॉनिक्स पर 40% तक की छूट पाएं।',
    shopNow: 'अभी खरीदें',
    popularCategories: 'लोकप्रिय श्रेणियाँ',
    popularCategoriesSub: 'रीयल-टाइम मूल्य तुलना के साथ लोकप्रिय श्रेणियां देखें',

    compare: 'तुलना करें',
    compared: 'तुलना में शामिल',
    inStock: 'स्टॉक में उपलब्ध',
    outOfStock: 'स्टॉक समाप्त',
    addedToCart: 'कार्ट में जोड़ा गया',
    viewProduct: 'विवरण देखें',
    ratingsAndReviews: 'रेटिंग और समीक्षाएं',
    allStores: 'सभी स्टोर',
    sort: 'क्रम:',
    exactMatch: 'सटीक मिलान मिला ✓',
    similarMatches: 'समान उत्पाद मिले',
    noProductsFound: 'कोई उत्पाद नहीं मिला। कृपया अपनी खोज या फ़िल्टर बदलें।',

    proceedToCheckout: 'चेकआउट करें',
    paymentOptions: 'भुगतान विकल्प',
    cashOnDelivery: 'कैश ऑन डिलीवरी (COD)',
    upiPayment: 'यूपीआई भुगतान (त्वरित)',
    qrPayment: 'क्यूआर कोड स्कैन करें',
    cardNetbanking: 'क्रेडिट/डेबिट कार्ड और नेटबैंकिंग',
    wallet: 'वॉलेट्स',
    placeOrder: 'ऑर्डर दें',
    deliveryAddress: 'डिलीवरी का पता',
    changeAddress: 'बदलें',
    pincode: 'पिनकोड',

    voiceAssistant: 'एआई वॉयस असिस्टेंट',
    listening: 'सुन रहे हैं...',
    processing: 'प्रक्रिया जारी है...',
    showingResults: 'परिणाम दिखाए जा रहे हैं...',
    voiceHelpTitle: 'वॉयस शॉपिंग असिस्टेंट',
    voiceHintPrompt: 'बोलें: "1500 के अंदर जूते दिखाओ" या "लैपटॉप तुलना करो"',
    youLabel: 'आप',
    assistantLabel: 'वॉयसकार्ट',
    voiceStopped: 'आवाज़ बंद हुई।',
    commandProcessed: 'कमांड पूरी हुई।',
    couldNotProcess: 'कमांड संसाधित नहीं हो सकी। कृपया दोबारा प्रयास करें।',

    welcomeBack: 'वापसी पर स्वागत है',
    createAccount: 'नया खाता बनाएं',
    email: 'ईमेल पता',
    password: 'पासवर्ड',
    fullName: 'पूरा नाम',
    dontHaveAccount: 'खाता नहीं है?',
    alreadyHaveAccount: 'पहले से खाता है?',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    close: 'बंद करें',
    apply: 'लागू करें',

    youSearchedFor: 'आपने खोजा:',
    exactMatchFound: 'सटीक परिणाम मिला ✓',
    similarOnlyFound: 'सटीक उत्पाद नहीं मिला, मिलते-जुलते उत्पाद दिखाए जा रहे हैं',
    noExactResults: 'कोई सटीक परिणाम नहीं',
    emptyCart: 'आपकी टोकरी खाली है',
    shoppingBasket: 'शॉपिंग टोकरी',
    remove: 'हटाएं',
    totalPayable: 'कुल देय राशि',
    checkout: 'चेकआउट करें',
    trackedOrders: 'ट्रैक किए गए ऑर्डर',
    trackOrder: 'नया ऑर्डर ट्रैक करें',
    sponsored: 'प्रायोजित',
    noRatings: 'कोई रेटिंग नहीं',
    ratings: 'रेटिंग',
    reviews: 'समीक्षाएं',
    delivery: 'डिलीवरी',
    trusted: 'विश्वसनीय'
  },
  kn: {
    appName: 'ವಾಯ್ಸ್‌ಕಾರ್ಟ್',
    heroTag: 'ಮಲ್ಟಿ-ಸ್ಟೋರ್ ಎಐ ಧ್ವನಿ ಶಾಪಿಂಗ್',
    heroTitle: 'ನಿಮ್ಮಿಷ್ಟವನ್ನು ಮಾತನಾಡಿ. ನಾವು ಬೆಲೆ ಹೋಲಿಸುತ್ತೇವೆ.',
    heroSubtitle: 'ಅಮೆಜಾನ್ ಇಂಡಿಯಾ, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ಮತ್ತು ಮೀಶೋ ಲೈವ್ ಅಧಿಕೃತ ಡೇಟಾ ಮತ್ತು ವಿವರಣಾತ್ಮಕ ರ‍್ಯಾಂಕಿಂಗ್.',
    searchPlaceholder: 'ಉತ್ಪನ್ನ, ಬ್ರ್ಯಾಂಡ್ ಹುಡುಕಿ (ಉದಾ. 2000 ಒಳಗೆ boAt ಇಯರ್‌ಬಡ್ಸ್, ಶೂ)...',
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
    ],

    deliverTo: 'ಡೆಲಿವರಿ ಸ್ಥಳ',
    selectLocation: 'ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ',
    changePincode: 'ಪಿನ್‌ಕೋಡ್ ಬದಲಾಯಿಸಿ',
    cart: 'ಕಾರ್ಟ್',
    login: 'ಲಾಗಿನ್',
    signup: 'ಸೈನ್ ಅಪ್',
    myAccount: 'ನನ್ನ ಖಾತೆ',
    myOrders: 'ನನ್ನ ಆರ್ಡರ್‌ಗಳು',
    logout: 'ಲಾಗ್ ಔಟ್',
    speakSearchShop: 'ಮಾತನಾಡಿ · ಹುಡುಕಿ · ಖರೀದಿಸಿ',
    searchTooltip: 'ಧ್ವನಿ ಹುಡುಕಾಟ',
    themeToggle: 'ಥೀಮ್ ಬದಲಾಯಿಸಿ',
    home: 'ಮುಖಪುಟ',
    categories: 'ವರ್ಗಗಳು',
    dealsAndOffers: 'ಡೀಲ್‌ಗಳು & ಆಫರ್‌ಗಳು',
    shopByCategory: 'ವರ್ಗವಾರು ಶಾಪಿಂಗ್',
    startVoiceShopping: 'ಧ್ವನಿ ಶಾಪಿಂಗ್ ಪ್ರಾರಂಭಿಸಿ',
    allProducts: 'ಎಲ್ಲಾ ಉತ್ಪನ್ನಗಳು',

    laptops: 'ಲ್ಯಾಪ್ಟಾಪ್ಗಳು',
    mobiles: 'ಮೊಬೈಲ್ಗಳು',
    smartwatches: 'ಸ್ಮಾರ್ಟ್‌ವಾಚ್‌ಗಳು',
    headphones: 'ಹೆಡ್‌ಫೋನ್‌ಗಳು',
    appliances: 'ಟಿವಿ & ಗೃಹೋಪಯೋಗಿ',
    shoes: 'ಪಾದರಕ್ಷೆಗಳು',
    fashion: 'ಫ್ಯಾಷನ್',
    electronics: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್',
    books: 'ಪುಸ್ತಕಗಳು',
    toys: 'ಆಟಿಕೆಗಳು ಮತ್ತು ಇನ್ನಷ್ಟು',

    heroVoicePill: 'ಧ್ವನಿ ನಿಯಂತ್ರಿತ ಶಾಪಿಂಗ್',
    heroVoiceTitle: 'ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್ ಶಾಪಿಂಗ್ ಸಹಾಯಕ',
    heroVoiceSub: 'ಕೇವಲ ನಿಮ್ಮ ಧ್ವನಿಯ ಮೂಲಕ ಅಮೆಜಾನ್, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ಮತ್ತು ಮೀಶೋನಲ್ಲಿ ಉತ್ತಮ ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಿ.',
    trySaying: 'ಹೀಗೆ ಹೇಳಿ ನೋಡಿ:',
    voiceSearchNow: 'ಈಗಲೇ ಧ್ವನಿ ಮೂಲಕ ಹುಡುಕಿ',
    viewAllDeals: 'ಎಲ್ಲಾ ಆಫರ್‌ಗಳನ್ನು ನೋಡಿ',
    featuredDeals: 'ವಿಶೇಷ ಮಲ್ಟಿ-ಸ್ಟೋರ್ ಡೀಲ್‌ಗಳು',
    featuredDealsSub: 'ಅಮೆಜಾನ್, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ಮತ್ತು ಮೀಶೋ ಲೈವ್ ದೃಢೀಕೃತ ಬೆಲೆಗಳು',
    specialOfferTitle: 'ವಿಶೇಷ ಧ್ವನಿ ಶಾಪಿಂಗ್ ಆಫರ್',
    specialOfferSub: 'ಧ್ವನಿ ಹುಡುಕಾಟ ಬಳಸಿ ಪ್ರಮುಖ ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್‌ಗಳ ಮೇಲೆ 40% ವರೆಗೆ ರಿಯಾಯಿತಿ ಪಡೆಯಿರಿ.',
    shopNow: 'ಈಗಲೇ ಖರೀದಿಸಿ',
    popularCategories: 'ಜನಪ್ರಿಯ ವರ್ಗಗಳು',
    popularCategoriesSub: 'ಲೈವ್ ಬೆಲೆ ಹೋಲಿಕೆಯೊಂದಿಗೆ ಜನಪ್ರಿಯ ವರ್ಗಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',

    compare: 'ಹೋಲಿಕೆ ಮಾಡಿ',
    compared: 'ಹೋಲಿಸಲಾಗಿದೆ',
    inStock: 'ಸ್ಟಾಕ್‌ನಲ್ಲಿದೆ',
    outOfStock: 'ಲಭ್ಯವಿಲ್ಲ',
    addedToCart: 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ',
    viewProduct: 'ವಿವರಗಳನ್ನು ನೋಡಿ',
    ratingsAndReviews: 'ರೇಟಿಂಗ್‌ಗಳು ಮತ್ತು ವಿಮರ್ಶೆಗಳು',
    allStores: 'ಎಲ್ಲಾ ಸ್ಟೋರ್‌ಗಳು',
    sort: 'ವಿಂಗಡಣೆ:',
    exactMatch: 'ಖಚಿತ ಹೊಂದಾಣಿಕೆ ದೊರೆತಿದೆ ✓',
    similarMatches: 'ಹೊಂದಾಣಿಕೆಯ ಉತ್ಪನ್ನಗಳು ದೊರೆತಿವೆ',
    noProductsFound: 'ಯಾವುದೇ ಉತ್ಪನ್ನ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಹುಡುಕಾಟವನ್ನು ಬದಲಿಸಿ ನೋಡಿ.',

    proceedToCheckout: 'ಚೆಕ್‌ಔಟ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ',
    paymentOptions: 'ಪಾವತಿ ವಿಧಾನಗಳು',
    cashOnDelivery: 'ಕ್ಯಾಶ್ ಆನ್ ಡೆಲಿವರಿ (COD)',
    upiPayment: 'ಯುಪಿಐ ಪಾವತಿ (ತತ್‌ಕ್ಷಣ)',
    qrPayment: 'ಕ್ಯೂಆರ್ ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    cardNetbanking: 'ಕಾರ್ಡ್ ಮತ್ತು ನೆಟ್‌ಬ್ಯಾಂಕಿಂಗ್',
    wallet: 'ವಾಲೆಟ್‌ಗಳು',
    placeOrder: 'ಆರ್ಡರ್ ನೀಡಿ',
    deliveryAddress: 'ಡೆಲಿವರಿ ವಿಳಾಸ',
    changeAddress: 'ಬದಲಾಯಿಸಿ',
    pincode: 'ಪಿನ್‌ಕೋಡ್',

    voiceAssistant: 'ಎಐ ಧ್ವನಿ ಸಹಾಯಕ',
    listening: 'ಆಲಿಸಲಾಗುತ್ತಿದೆ...',
    processing: 'ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...',
    showingResults: 'ಫಲಿತಾಂಶಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ...',
    voiceHelpTitle: 'ಧ್ವನಿ ಶಾಪಿಂಗ್ ಸಹಾಯಕ',
    voiceHintPrompt: 'ಹೇಳಿ: "1500 ಒಳಗೆ ಶೂಗಳನ್ನು ತೋರಿಸು" ಅಥವಾ "ಲ್ಯಾಪ್ಟಾಪ್ ಬೆಲೆ ಹೋಲಿಸು"',
    youLabel: 'ನೀವು',
    assistantLabel: 'ವಾಯ್ಸ್‌ಕಾರ್ಟ್',
    voiceStopped: 'ಧ್ವನಿ ನಿಲ್ಲಿಸಲಾಗಿದೆ.',
    commandProcessed: 'ಆದೇಶ ಪೂರ್ಣಗೊಂಡಿದೆ.',
    couldNotProcess: 'ಆದೇಶವನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',

    welcomeBack: 'ಮರಳಿ ಸ್ವಾಗತ',
    createAccount: 'ಹೊಸ ಖಾತೆ ರಚಿಸಿ',
    email: 'ಇಮೇಲ್ ವಿಳಾಸ',
    password: 'ಪಾಸ್‌ವರ್ಡ್',
    fullName: 'ಪೂರ್ಣ ಹೆಸರು',
    dontHaveAccount: 'ಖಾತೆ ಇಲ್ಲವೇ?',
    alreadyHaveAccount: 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?',
    save: 'ಉಳಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    close: 'ಮುಚ್ಚು',
    apply: 'ಅನ್ವಯಿಸು',

    youSearchedFor: 'ನೀವು ಹುಡುಕಿದ್ದು:',
    exactMatchFound: 'ನಿಖರ ಉತ್ಪನ್ನ ದೊರೆತಿದೆ ✓',
    similarOnlyFound: 'ನಿಖರ ಉತ್ಪನ್ನ ಸಿಗಲಿಲ್ಲ, ಹೊಂದಾಣಿಕೆಯಾಗುವ ಉತ್ಪನ್ನಗಳು',
    noExactResults: 'ಯಾವುದೇ ಫಲಿತಾಂಶಗಳಿಲ್ಲ',
    emptyCart: 'ನಿಮ್ಮ ಬುಟ್ಟಿ ಖಾಲಿಯಾಗಿದೆ',
    shoppingBasket: 'ಶಾಪಿಂಗ್ ಬುಟ್ಟಿ',
    remove: 'ತೆಗೆದುಹಾಕಿ',
    totalPayable: 'ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ',
    checkout: 'ಚೆಕ್‌ಔಟ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ',
    trackedOrders: 'ಟ್ರ್ಯಾಕ್ ಮಾಡಿದ ಆರ್ಡರ್‌ಗಳು',
    trackOrder: 'ಹೊಸ ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    sponsored: 'ಪ್ರಾಯೋಜಿತ',
    noRatings: 'ಇನ್ನೂ ರೇಟಿಂಗ್ ಇಲ್ಲ',
    ratings: 'ರೇಟಿಂಗ್‌ಗಳು',
    reviews: 'ವಿಮರ್ಶೆಗಳು',
    delivery: 'ಡೆಲಿವರಿ',
    trusted: 'ವಿಶ್ವಾಸಾರ್ಹ'
  }
};

export const getStoredLanguage = (): SupportedLanguage => {
  try {
    const saved = localStorage.getItem('voicecart_language');
    if (saved === 'en' || saved === 'hi' || saved === 'kn') {
      return saved;
    }
  } catch {}
  return 'en';
};

export const setStoredLanguage = (lang: SupportedLanguage): void => {
  try {
    localStorage.setItem('voicecart_language', lang);
  } catch {}
};

export const getTranslation = (lang: SupportedLanguage = 'en'): Translations => {
  const active: ActiveLanguage = lang === 'hi' || lang === 'kn' ? lang : 'en';
  return translations[active] || translations.en;
};
