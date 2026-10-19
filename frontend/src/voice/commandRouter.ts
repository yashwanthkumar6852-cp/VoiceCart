import { voiceNormalizer } from './normalize';
import { CommandParams, CommandResult, ConversationContext, VoiceAction } from './types';
import { SupportedLanguage } from '../i18n/translations';
import { api } from '../lib/api';

export class CommandRouter {
  public normalize(text: string): string {
    if (!text) return '';
    let normalized = text.toLowerCase().trim();
    normalized = normalized.replace(/[.,/#!$%^&*;:{}=\-_`~()?¿¡!"']/g, ' ');
    normalized = normalized.replace(/\s+/g, ' ').trim();

    const numMap: Record<string, string> = {
      first: '1st',
      second: '2nd',
      third: '3rd',
      two: '2',
      three: '3',
      four: '4',
      five: '5',
      एक: '1',
      दो: '2',
      तीन: '3',
      पहला: '1st',
      दूसरा: '2nd',
      तीसरा: '3rd',
      ಒಂದು: '1',
      ಎರಡು: '2',
      ಮೂರು: '3',
      ಮೊದಲ: '1st',
      ಎರಡನೇ: '2nd',
      ಮೂರನೇ: '3rd'
    };

    const words = normalized.split(' ');
    const translated = words.map((w) => numMap[w] || w);
    return translated.join(' ');
  }

  public detectLanguage(text: string, currentLang: SupportedLanguage = 'en'): SupportedLanguage {
    const res = voiceNormalizer.detectLanguageAndScript(text, currentLang);
    return res.language;
  }

  public matchRule(text: string, currentLang: SupportedLanguage = 'en'): CommandResult | null {
    if (!text || !text.trim()) return null;

    const norm = this.normalize(text);
    const fullNormalized = voiceNormalizer.normalize(text, currentLang);
    const englishNorm = fullNormalized.englishText.toLowerCase().trim();
    const originalLower = text.toLowerCase().trim();
    const lang = fullNormalized.language;

    // SECURITY CHECK: Reject sensitive credentials / OTPs by voice
    if (
      /\b(password|otp|cvv|pin|upi pin|card number|cvv number|security code|verification code|one time password|auth code|bank login|netbanking password)\b/i.test(
        originalLower
      ) ||
      /\b(?:code|otp|pin)\s+(?:is\s+)?\d{4,8}\b/i.test(originalLower) ||
      /^\s*\d{6}\s*$/.test(originalLower)
    ) {
      return {
        action: 'chat',
        params: {},
        layer: 'rule',
        confidence: 0.99,
        language: lang,
        reply:
          lang === 'kn'
            ? 'ಸುರಕ್ಷತೆಯ ಕಾರಣಗಳಿಗಾಗಿ, ವಾಯ್ಸ್‌ಕಾರ್ಟ್ ಎಂದಿಗೂ ಒಟಿಪಿ ಅಥವಾ ಪರಿಶೀಲನಾ ಕೋಡ್‌ಗಳನ್ನು ಧ್ವನಿಯ ಮೂಲಕ ಸ್ವೀಕರಿಸುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ಪರದೆಯ ಮೇಲೆ ನಮೂದಿಸಿ.'
            : lang === 'hi'
            ? 'सुरक्षा कारणों से, वॉयसकार्ट कभी भी वॉयस द्वारा ओटीपी या सत्यापन कोड स्वीकार नहीं करता है। कृपया इसे स्क्रीन पर दर्ज करें।'
            : 'For your security, VoiceCart never accepts OTPs or verification codes by voice. Please enter the 6-digit code on your screen.'
      };
    }

    // 0. LANGUAGE SWITCHING BY VOICE
    if (
      /\b(switch to kannada|change language to kannada|speak in kannada|kannada please|kannada dalli matanadu|kannadadalli heli|kannada bhasha)\b/i.test(
        originalLower
      ) ||
      (text.includes('ಕನ್ನಡ') && (text.includes('ಬದಲಾಯಿಸಿ') || text.includes('ಮಾತಾಡು') || text.includes('ಹೇಳು') || text.includes('ಮಾತನಾಡು') || text.includes('ಭಾಷೆ'))) ||
      originalLower === 'kannada' ||
      originalLower === 'kannada please'
    ) {
      return {
        action: 'change_language',
        params: { language: 'kn' },
        layer: 'rule',
        confidence: 0.99,
        language: 'kn',
        reply: 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.'
      };
    }

    if (
      /\b(switch to hindi|change language to hindi|speak in hindi|hindi please|hindi me bolo|hindi me baat karo|hindi bhasha)\b/i.test(
        originalLower
      ) ||
      (text.includes('हिंदी') && (text.includes('बदलो') || text.includes('बोलो') || text.includes('बात करो') || text.includes('बताओ') || text.includes('करो') || text.includes('भाषा'))) ||
      text.includes('ಹಿಂದಿಗೆ ಬದಲಾಯಿಸಿ') ||
      text.includes('ಹಿಂದಿಯಲ್ಲಿ') ||
      (text.includes('ಹಿಂದಿ') && (text.includes('ಬದಲಾಯಿಸಿ') || text.includes('ಮಾತಾಡು') || text.includes('ಹೇಳು') || text.includes('ಮಾತನಾಡು') || text.includes('ಭಾಷೆ'))) ||
      originalLower === 'hindi' ||
      originalLower === 'hindi please'
    ) {
      return {
        action: 'change_language',
        params: { language: 'hi' },
        layer: 'rule',
        confidence: 0.99,
        language: 'hi',
        reply: 'भाषा बदलकर हिन्दी कर दी गई है।'
      };
    }

    if (
      /\b(switch to english|change language to english|speak in english|english please|english me baat karo)\b/i.test(
        originalLower
      ) ||
      text.includes('अंग्रेजी में बोलो') ||
      text.includes('ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಮಾತನಾಡು') ||
      text.includes('ಇಂಗ್ಲಿಷ್‌ಗೆ ಬದಲಾಯಿಸಿ') ||
      originalLower === 'english' ||
      originalLower === 'english please'
    ) {
      return {
        action: 'change_language',
        params: { language: 'en' },
        layer: 'rule',
        confidence: 0.99,
        language: 'en',
        reply: 'Language switched to English.'
      };
    }

    // 1. CONFIRM YES
    if (
      /^(yes|confirm|proceed|ok|okay|yep|sure|continue|go ahead|yes please|do it|ha|haan|sahi hai|theek hai|kardo|hau|haudu|sari|agali|mundhuvarisu)$/i.test(
        norm
      ) ||
      norm === 'हाँ' ||
      norm === 'हाँ कर दो' ||
      norm === 'ठीक है' ||
      norm === 'ಹೌದು' ||
      norm === 'ಹೌದು ಮುಂದುವರಿಸು' ||
      norm === 'ಸರಿ'
    ) {
      return {
        action: 'confirm_yes',
        params: {},
        layer: 'rule',
        confidence: 0.99,
        language: lang,
        reply: lang === 'kn' ? 'ಖಚಿತಪಡಿಸಲಾಗಿದೆ.' : lang === 'hi' ? 'पुष्टि की गई।' : 'Confirmed.'
      };
    }

    // 2. CONFIRM NO
    if (
      /^(no|cancel|dont|don't|no dont|never mind|na|nahi|mat karo|cancel karo|beda|bedave beda|raddumadu)$/i.test(
        norm
      ) ||
      norm === 'नहीं' ||
      norm === 'रद्द करो' ||
      norm === 'ಬೇಡ' ||
      norm === 'ರದ್ದು ಮಾಡು'
    ) {
      return {
        action: 'confirm_no',
        params: {},
        layer: 'rule',
        confidence: 0.99,
        language: lang,
        reply: lang === 'kn' ? 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.' : lang === 'hi' ? 'ರद्द कर दिया गया।' : 'Cancelled.'
      };
    }

    // 3. WHO AM I / USER PROFILE / ACCOUNT / ADDRESSES
    if (
      /\b(who am i|who is logged in|my account|my profile|open my profile|open my account|open profile|open account|show my profile|show my account|mera account|mera profile|profile dikhao|main kaun hoon|nannu yaru|nanna account|nanna profile)\b/i.test(
        originalLower
      ) ||
      text.includes('मैं कौन हूँ') ||
      text.includes('मेरा खाता') ||
      text.includes('मेरा अकाउंट') ||
      text.includes('अकाउंट दिखाओ') ||
      text.includes('मेरा प्रोफाइल') ||
      text.includes('प्रोफाइल खोलो') ||
      text.includes('प्रोफाइल दिखाओ') ||
      text.includes('ನಾನು ಯಾರು') ||
      text.includes('ನನ್ನ ಖಾತೆ') ||
      text.includes('ನನ್ನ ಪ್ರೊಫೈಲ್') ||
      text.includes('ಪ್ರೊಫೈಲ್ ತೋರಿಸು') ||
      text.includes('ಖಾತೆ ತೆರೆ')
    ) {
      return {
        action: 'whoami',
        params: {},
        layer: 'rule',
        confidence: 0.99,
        language: lang,
        reply: lang === 'kn' ? 'ನಿಮ್ಮ ಖಾತೆಯ ವಿವರಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'आपके खाते का विवरण दिखाया जा रहा है।' : 'Opening your profile and account.'
      };
    }

    if (
      /\b(show my addresses|my addresses|saved addresses|show addresses|addresses|mera pata|pata dikhao|nanna address|vilasagalu)\b/i.test(
        originalLower
      ) ||
      text.includes('मेरा पता') ||
      text.includes('पते दिखाओ') ||
      text.includes('ವಿಳಾಸಗಳು')
    ) {
      return {
        action: 'whoami',
        params: { section: 'addresses' },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ನಿಮ್ಮ ಉಳಿಸಿದ ವಿಳಾಸಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'आपके सहेजे गए पते दिखाए जा रहे हैं।' : 'Showing your saved delivery addresses.'
      };
    }

    // 4. LOG OUT / SIGN OUT
    if (
      /\b(log out|logout|sign out|signout|bahar niklo|logout karo|logout madi|khate se niklo)\b/i.test(
        originalLower
      ) ||
      text.includes('लॉग आउट') ||
      text.includes('साइन आउट') ||
      text.includes('ಲಾಗ್ ಔಟ್') ||
      text.includes('ಸೈನ್ ಔಟ್')
    ) {
      return {
        action: 'logout',
        params: {},
        layer: 'rule',
        confidence: 0.99,
        language: lang,
        reply: lang === 'kn' ? 'ಯಶಸ್ವಿಯಾಗಿ ಲಾಗ್ ಔಟ್ ಮಾಡಲಾಗಿದೆ.' : lang === 'hi' ? 'सफलतापूर्वक लॉग आउट कर दिया गया है।' : 'Logged out successfully.'
      };
    }

    // 5. LOG IN / SIGN IN
    if (
      /\b(log in|login|sign in|signin|login karo|khata kholo|login madi)\b/i.test(
        originalLower
      ) ||
      text.includes('लॉग इन') ||
      text.includes('लॉगिन') ||
      text.includes('साइन इन') ||
      text.includes('ಲಾಗ್ ಇನ್') ||
      text.includes('ಲಾಗಿನ್') ||
      text.includes('ಸೈನ್ ಇನ್')
    ) {
      return {
        action: 'login',
        params: {},
        layer: 'rule',
        confidence: 0.99,
        language: lang,
        reply: lang === 'kn' ? 'ಲಾಗಿನ್ ಪುಟಕ್ಕೆ ತೆರಳಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'लॉगिन पृष्ठ खोला जा रहा है।' : 'Opening login page.'
      };
    }

    // 5A. QUICK RE-LOGIN BY VOICE ("log in as <name>")
    const loginAsMatch = originalLower.match(/\b(?:log in as|login as|sign in as|signin as)\s+([a-zA-Z0-9_-]+)/i);
    if (loginAsMatch) {
      const targetName = loginAsMatch[1].trim();
      return {
        action: 'login_as',
        params: { name: targetName },
        layer: 'rule',
        confidence: 0.99,
        language: lang,
        reply: lang === 'kn' ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪರದೆಯ ಮೇಲೆ 6 ಅಂಕಿಗಳ ಪರಿಶೀಲನಾ ಕೋಡ್ ನಮೂದಿಸಿ.' : lang === 'hi' ? 'कृपया अपनी स्क्रीन पर 6 अंकों का सत्यापन कोड दर्ज करें।' : 'Please enter the 6-digit verification code on your screen.'
      };
    }

    // 5B. CATEGORY SWITCHING BY VOICE
    if (/\b(show for you|open for you|for you|trending deals|khas aapke liye|nimageagi)\b/i.test(originalLower)) {
      return {
        action: 'select_category',
        params: { category: 'all' },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ನಿಮಗಾಗಿ ಟ್ರೆಂಡಿಂಗ್ ಡೀಲ್‌ಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'आपके लिए ट्रेंडिंग डील्स दिखाई जा रही हैं।' : 'Showing trending deals for you.'
      };
    }

    if (/\b(show mobiles|open mobiles|mobiles dikhao|mobile phone|mobiles|smartphones)\b/i.test(originalLower) || text.includes('मोबाइल') || text.includes('ಮೊಬೈಲ್')) {
      return {
        action: 'select_category',
        params: { category: 'mobiles' },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಸ್ಮಾರ್ಟ್‌ಫೋನ್‌ಗಳು ಮತ್ತು ಮೊಬೈಲ್‌ಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'स्मार्टफोन और मोबाइल दिखाए जा रहे हैं।' : 'Showing top smartphones and mobiles.'
      };
    }

    if (/\b(open fashion|show fashion|fashion dikhao|clothing|apparel|fashion nodi)\b/i.test(originalLower) || text.includes('फैशन') || text.includes('ಫ್ಯಾಷನ್')) {
      return {
        action: 'select_category',
        params: { category: 'fashion' },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಫ್ಯಾಷನ್ ಉಡುಪುಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'ट्रेंडिंग फैशन कलेक्शन दिखाया जा रहा है।' : 'Showing trending fashion collection.'
      };
    }

    if (/\b(show electronics|open electronics|electronics dikhao|laptops|gadgets)\b/i.test(originalLower) || text.includes('इलेक्ट्रॉनिक्स') || text.includes('ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್')) {
      return {
        action: 'select_category',
        params: { category: 'electronics' },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಮತ್ತು ಲ್ಯಾಪ್‌ಟಾಪ್‌ಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'इलेक्ट्रॉनिक्स और लैपटॉप दिखाए जा रहे हैं।' : 'Showing top electronics and laptops.'
      };
    }

    if (/\b(show appliances|open appliances|go to appliances|appliances dikhao|home appliances)\b/i.test(originalLower) || text.includes('अप्लायंसेज') || text.includes('ಉಪಕರಣಗಳು')) {
      return {
        action: 'select_category',
        params: { category: 'appliances' },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಮನೆ ಮತ್ತು ಅಡುಗೆ ಸಲಕರಣೆಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'होम अप्लायंसेज दिखाए जा रहे हैं।' : 'Showing home and kitchen appliances.'
      };
    }

    // 5C. SIGN UP / CREATE ACCOUNT
    if (
      /\b(sign up|signup|create account|register|new account|sign me up|khata banao|khata banaye|naya khata|khate teredu|khate rachisi|hosa khate)\b/i.test(norm) ||
      text.includes('साइन अप') ||
      text.includes('खाता बनाएं') ||
      text.includes('ಸೈನ್ ಅಪ್') ||
      text.includes('ಖಾತೆ ರಚಿಸಿ')
    ) {
      return {
        action: 'signup',
        params: {},
        layer: 'rule',
        confidence: 0.99,
        language: lang,
        reply: lang === 'kn' ? 'ಸೈನ್ ಅಪ್ ಪುಟಕ್ಕೆ ತೆರಳಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'साइन अप पृष्ठ खोला जा रहा है।' : 'Opening signup page.'
      };
    }

    // SECURITY CHECK: Reject sensitive credentials by voice
    if (
      /\b(password|otp|cvv|pin|upi pin|card number|cvv number|security code|bank login|netbanking password)\b/i.test(
        originalLower
      )
    ) {
      return {
        action: 'chat',
        params: {},
        layer: 'rule',
        confidence: 0.99,
        language: lang,
        reply:
          lang === 'kn'
            ? 'ಸುರಕ್ಷತೆಯ ಕಾರಣಗಳಿಗಾಗಿ, ದಯವಿಟ್ಟು ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ ಒಟಿಪಿ ಮುಂತಾದ ಸೂಕ್ಷ್ಮ ವಿವರಗಳನ್ನು ಧ್ವನಿಯ ಮೂಲಕ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.'
            : lang === 'hi'
            ? 'सुरक्षा कारणों से, कृपया पासवर्ड या ओटीपी जैसी संवेदनशील जानकारी बोलकर साझा न करें।'
            : 'For your security, please do not speak passwords, OTPs, CVV, or PINs. Enter them securely on screen.'
      };
    }

    // 6. STOP / STOP LISTENING
    if (
      /^(stop|pause|shut up|chup|ruko|nillu|nillisu|bidi|stop listening|band karo|mute|silent)$/i.test(norm) ||
      /\b(stop listening|stop speaking|quiet|chup raho|band karo|nillisu|kelisikollabeda)\b/i.test(originalLower) ||
      text.includes('रुको') ||
      text.includes('रोको') ||
      text.includes('ನಿಲ್ಲಿಸು') ||
      text.includes('ನಿಲ್ಲು')
    ) {
      return {
        action: 'stop',
        params: {},
        layer: 'rule',
        confidence: 0.99,
        language: lang,
        reply: lang === 'kn' ? 'ನಿಲ್ಲಿಸಲಾಗಿದೆ.' : lang === 'hi' ? 'रोक दिया गया।' : 'Stopped.'
      };
    }

    // 4. HELP
    if (
      /\b(help|help me|what can you do|commands|how to use|madad|kya kar sakte ho|sahaya|sahaya madu|enu madabahudu)\b/i.test(norm) ||
      norm === 'help' ||
      text.includes('मदद') ||
      text.includes('ಸಹಾಯ')
    ) {
      return {
        action: 'help',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply:
          lang === 'kn'
            ? 'ನೀವು ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಬಹುದು, ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಬಹುದು, ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದು ಮತ್ತು ಯುಪಿಐ ಮೂಲಕ ಪಾವತಿಸಬಹುದು.'
            : lang === 'hi'
            ? 'आप उत्पाद खोज सकते हैं, तुलना कर सकते हैं, कार्ट में जोड़ सकते हैं, और यूपीआई से भुगतान कर सकते हैं।'
            : 'You can search products, compare across Amazon, Flipkart and Meesho, add items to cart, and checkout with UPI.'
      };
    }

    // 5. TRACK ORDER
    if (
      /\b(where is my order|where is my delivery|track order|track orders|track my order|track my package|order status|delivery status|delivery ki sthiti|mera order kaha hai|mera order kahan hai|order track karo|nanna order ellide|order track madu|delivery sthiti)\b/i.test(
        norm
      ) ||
      englishNorm.includes('where is my order') ||
      originalLower.includes('mera order') ||
      originalLower.includes('nanna order') ||
      originalLower.includes('order track') ||
      text.includes('मेरा ऑर्डर कहाँ है') ||
      text.includes('ऑर्डर ट्रैक करो') ||
      text.includes('डिलीवरी की स्थिति') ||
      text.includes('ನನ್ನ ಆರ್ಡರ್ ಎಲ್ಲಿದೆ') ||
      text.includes('ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್ ಮಾಡು') ||
      text.includes('ಡೆಲಿವರಿ ಸ್ಥಿತಿ')
    ) {
      return {
        action: 'track_order',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply:
          lang === 'kn'
            ? 'ನಿಮ್ಮ ಆರ್ಡರ್ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...'
            : lang === 'hi'
            ? 'आपके ऑर्डर की स्थिति जांची जा रही है...'
            : 'Tracking your latest order...'
      };
    }

    // 6. OPEN ORDERS
    if (
      /\b(open orders|view orders|show orders|show my orders|my orders|order history|view order history|past orders|my purchases|orders kholo|orders dikhao|mere order kholo|purani kharidari|ardargalannu torisu|ardargalu|nanna order tere|hindina kharidagalu)\b/i.test(
        norm
      ) ||
      englishNorm.includes('open orders') ||
      text.includes('ऑर्डर दिखाओ') ||
      text.includes('मेरे ऑर्डर खोलो') ||
      text.includes('पुरानी खरीदारी') ||
      text.includes('ಆರ್ಡರ್‌ಗಳನ್ನು ತೋರಿಸು') ||
      text.includes('ನನ್ನ ಆರ್ಡರ್ ತೆರೆ') ||
      text.includes('ಹಿಂದಿನ ಖರೀದಿಗಳು')
    ) {
      return {
        action: 'open_orders',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ನಿಮ್ಮ ಆರ್ಡರ್‌ಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'आपके ऑर्डर दिखाए जा रहे हैं।' : 'Showing your orders.'
      };
    }

    // 7. OPEN CART
    if (
      /\b(open cart|view cart|show cart|go to cart|show my cart|view my cart|open shopping cart|open basket|my cart|open my basket|show basket|view basket|open the cart|cart kholo|cart dikhao|cart me jao|cart par jao|basket kholo|mera cart|cartge hogu|cart torisu|cart nodisu|nanna cart|karte tere|cart tere|cart tegi)\b/i.test(
        norm
      ) ||
      englishNorm === 'open cart' ||
      originalLower.includes('cart kholo') ||
      originalLower.includes('cart tere') ||
      originalLower.includes('cart tegi') ||
      originalLower.includes('mera cart') ||
      text.includes('कार्ट खोलो') ||
      text.includes('मेरा कार्ट दिखाओ') ||
      text.includes('कार्ट पर जाओ') ||
      text.includes('ಕಾರ್ಟ್ ತೆರೆಯಿರಿ') ||
      text.includes('ಕಾರ್ಟ್ ತೆರೆ') ||
      text.includes('ಕಾರ್ಟ್ ತೋರಿಸು') ||
      text.includes('ನನ್ನ ಕಾರ್ಟ್ ತೋರಿಸು') ||
      text.includes('ಕಾರ್ಟ್‌ಗೆ ಹೋಗು')
    ) {
      return {
        action: 'open_cart',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ನಿಮ್ಮ ಕಾರ್ಟ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'आपकी कार्ट खोली जा रही है।' : 'Opening your cart.'
      };
    }

    // 8. OPEN HOME
    if (
      /\b(go home|open home|back to home|home screen|main page|homepage|home page|go to home|go to homepage|main screen|home jao|home par jao|mukhyaputakke hogu|home screen tere)\b/i.test(
        norm
      ) ||
      englishNorm.includes('go home') ||
      text.includes('होम पर जाओ') ||
      text.includes('होम स्क्रीन खोलो') ||
      text.includes('मुख्य पृष्ठ') ||
      text.includes('ಮುಖಪುಟಕ್ಕೆ ಹೋಗು') ||
      text.includes('ಹೋಮ್ ಸ್ಕ್ರೀನ್ ತೆರೆ')
    ) {
      return {
        action: 'open_home',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಮುಖಪುಟಕ್ಕೆ ಹೋಗಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'होम पेज पर जा रहे हैं।' : 'Going to home page.'
      };
    }

    // 9. GO BACK
    if (/\b(go back|back|previous page|piche jao|piche|hinde hogu|hindakke)\b/i.test(norm) || englishNorm.includes('go back')) {
      return {
        action: 'go_back',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಹಿಂದಿನ ಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'पीछे जा रहे हैं।' : 'Going back.'
      };
    }

    // 10. OPEN SETTINGS
    if (
      /\b(open settings|show settings|go to settings|go to preferences|preferences|app settings|change preferences|my settings|settings kholo|settingsge hogu|settings torisu|settings tere)\b/i.test(
        norm
      ) ||
      englishNorm.includes('open settings') ||
      text.includes('सेटिंग्स खोलो') ||
      text.includes('सेटिंग्स दिखाओ') ||
      text.includes('मेरी सेटिंग्स') ||
      text.includes('ಸೆಟ್ಟಿಂಗ್ಸ್ ತೆರೆ') ||
      text.includes('ಸೆಟ್ಟಿಂಗ್ಸ್ ತೋರಿಸು') ||
      text.includes('ಸೆಟ್ಟಿಂಗ್ಸ್')
    ) {
      return {
        action: 'open_settings',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಸೆಟ್ಟಿಂಗ್ಸ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'सेटिंग्स खोली जा रही है।' : 'Opening settings.'
      };
    }

    // 11. PAY WITH MODE (Wallet, card, cod, qr, netbanking, upi)
    if (
      /\b(pay with wallet|pay from wallet|wallet payment|pay with paytm wallet|paytm wallet|amazon pay|mobikwik|wallet se pay karo|wallet se bhugtan|wallet moolaka pavatisu)\b/i.test(
        norm
      ) ||
      englishNorm.includes('pay with wallet') ||
      text.includes('वॉलेट से भुगतान') ||
      text.includes('ವಾಲೆಟ್ ಮೂಲಕ ಪಾವತಿ')
    ) {
      return {
        action: 'pay',
        params: { paymentMethod: 'wallet' },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ವಾಲೆಟ್ ಪಾವತಿ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ.' : lang === 'hi' ? 'वॉलेट भुगतान विकल्प चुना गया है।' : 'Opening digital wallets.'
      };
    }

    if (
      /\b(pay by card|pay with card|pay with credit card|pay with debit card|credit card|debit card|card payment|card se pay karo|card se bhugtan|card moolaka pavatisu)\b/i.test(
        norm
      ) ||
      englishNorm.includes('pay by card') ||
      text.includes('कार्ड से भुगतान') ||
      text.includes('क्रेडिट कार्ड') ||
      text.includes('ಕಾರ್ಡ್ ಮೂಲಕ ಪಾವತಿ')
    ) {
      return {
        action: 'pay',
        params: { paymentMethod: 'card' },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಕಾರ್ಡ್ ಪಾವತಿ ಆಯ್ಕೆ ತೆರೆಯಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'कार्ड भुगतान विकल्प खोला जा रहा है।' : 'Opening card payment.'
      };
    }

    if (
      /\b(show qr code|show qr|pay with qr|scan qr code|scan and pay|qr payment|qr code dikhao|qr se pay karo|qr code torisu|qr moolaka pavatisu|qr torisu)\b/i.test(
        norm
      ) ||
      englishNorm.includes('show qr code') ||
      originalLower.includes('qr code') ||
      text.includes('क्यूआर कोड दिखाओ') ||
      text.includes('ಕ್ಯೂಆರ್ ಕೋಡ್ ತೋರಿಸು')
    ) {
      return {
        action: 'pay',
        params: { paymentMethod: 'qr' },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಕ್ಯೂಆರ್ ಕೋಡ್ ತೋರಿಸಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'क्यूआर कोड दिखाया जा रहा है।' : 'Displaying UPI QR code.'
      };
    }

    if (
      /\b(pay cash on delivery|pay with cod|cash on delivery|cod payment|pay on delivery|cod se order karo|cash on delivery se bhugtan|cash on delivery chahiye|cod ge hakku|cod moolaka pavatisu|cash on delivery pavati|cash on delivery aayke)\b/i.test(
        norm
      ) ||
      englishNorm.includes('pay cash on delivery') ||
      originalLower.includes('cash on delivery') ||
      originalLower.includes('cod') ||
      text.includes('कैश ऑन डिलीवरी') ||
      text.includes('ಕ್ಯಾಶ್ ಆನ್ ಡೆಲಿವರಿ')
    ) {
      return {
        action: 'pay',
        params: { paymentMethod: 'cod' },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಕ್ಯಾಶ್ ಆನ್ ಡೆಲಿವರಿ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ.' : lang === 'hi' ? 'कैश ऑन डिलीवरी चुना गया है।' : 'Selecting Cash on Delivery.'
      };
    }

    if (
      /\b(pay via netbanking|pay with netbanking|net banking|netbanking|internet banking|bank transfer|netbanking se pay karo|netbanking moolaka pavatisu)\b/i.test(
        norm
      ) ||
      englishNorm.includes('pay via netbanking') ||
      text.includes('नेटबैंकिंग') ||
      text.includes('ನೆಟ್‌ಬ್ಯಾಂಕಿಂಗ್')
    ) {
      return {
        action: 'pay',
        params: { paymentMethod: 'netbanking' },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ನೆಟ್‌ಬ್ಯಾಂಕಿಂಗ್ ಪಾವತಿ ತೆರೆಯಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'नेटबैंकिंग भुगतान खोला जा रहा है।' : 'Opening Netbanking.'
      };
    }

    if (
      /\b(pay with upi|pay by upi|pay via upi|upi payment|upi se|upi se pay karo|upi se payment karo|upi se bhugtan|open upi|use upi|google pay|gpay|phonepe|paytm|upi moolaka pavatisu|upi payment madu|upi pavati)\b/i.test(
        norm
      ) ||
      englishNorm.includes('pay with upi') ||
      englishNorm.includes('pay by upi') ||
      originalLower.includes('upi') ||
      originalLower.includes('google pay') ||
      originalLower.includes('gpay') ||
      originalLower.includes('phonepe') ||
      originalLower.includes('paytm') ||
      text.includes('यूपीआई') ||
      text.includes('ಯುಪಿಐ')
    ) {
      return {
        action: 'pay',
        params: { paymentMethod: 'upi' },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಯುಪಿಐ ಪಾವತಿ ಆಯ್ಕೆ ತೆರೆಯಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'यूपीआई भुगतान विकल्प खोला जा रहा है।' : 'Opening UPI payment.'
      };
    }

    // 12. CLEAR CART
    if (
      /\b(clear cart|clear my cart|empty cart|empty basket|clear basket|cart khali karo|cart saaf karo|cart khali madu)\b/i.test(
        norm
      ) ||
      englishNorm.includes('clear cart') ||
      text.includes('कार्ट खाली करो') ||
      text.includes('ಕಾರ್ಟ್ ಖಾಲಿ ಮಾಡು')
    ) {
      return {
        action: 'clear_cart',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಕಾರ್ಟ್ ಖಾಲಿ ಮಾಡಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'कार्ट खाली की जा रही है।' : 'Clearing your cart.'
      };
    }

    // 13. REMOVE FROM CART
    if (
      /\b(remove item|remove this item|remove the 1st item|remove the first item|remove 1st item|remove the 2nd item|remove the second item|remove 2nd item|delete item from cart|delete from cart|1st item delete karo|first item delete karo|remove from basket|cart se nikalo|cart se hatao|item hatao|1st item hata do|pehla item hata do|cart ninda tege|1st vastuvannu tegeyiri|modala vastuvannu tegeyiri|tegeduhaku)\b/i.test(
        norm
      ) ||
      englishNorm.includes('remove from cart') ||
      originalLower.includes('delete karo') ||
      originalLower.includes('item delete') ||
      text.includes('आइटम हटाओ') ||
      text.includes('1st आइटम हटा') ||
      text.includes('पहला आइटम हटा') ||
      text.includes('कार्ट से निकालो') ||
      text.includes('ಕಾರ್ಟ್‌ನಿಂದ ತೆಗೆ') ||
      text.includes('ಮೊದಲ ವಸ್ತುವನ್ನು ತೆಗೆಯಿರಿ') ||
      text.includes('ತೆಗೆದುಹಾಕು')
    ) {
      let index: number = 0;
      if (norm.includes('2nd') || norm.includes('second') || norm.includes('doosra') || norm.includes('eradane')) {
        index = 1;
      } else if (norm.includes('3rd') || norm.includes('third') || norm.includes('teesra') || norm.includes('moorane')) {
        index = 2;
      }

      return {
        action: 'remove_from_cart',
        params: { index },
        layer: 'rule',
        confidence: 0.96,
        language: lang,
        reply: lang === 'kn' ? 'ಕಾರ್ಟ್‌ನಿಂದ ತೆಗೆಯಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'कार्ट से हटाया जा रहा है...' : 'Removing item from cart...'
      };
    }

    // 14. BUY / BOOK IT / ORDER THIS
    if (
      /\b(buy this|buy now|book it|book this|order this|order it|buy it|add to cart and order|place order|checkout now|proceed to checkout|checkout on amazon|checkout on flipkart|checkout on meesho|ise kharido|order book karo|ise book karo|ise order karo|order place karo|checkout karo|idannu kharidisu|idannu kharidi|idannu book madu|order madu|checkout madu|eegale kharidisi)\b/i.test(
        norm
      ) ||
      englishNorm.includes('buy this') ||
      englishNorm.includes('book it') ||
      englishNorm.includes('order this') ||
      text.includes('बुक करो') ||
      text.includes('इसे खरीदो') ||
      text.includes('ऑर्डर बुक करो') ||
      text.includes('चेकआउट करो') ||
      text.includes('ಇದನ್ನು ಖರೀದಿಸು') ||
      text.includes('ಬುಕ್ ಮಾಡು') ||
      text.includes('ಆರ್ಡರ್ ಮಾಡು') ||
      text.includes('ಈಗಲೇ ಖರೀದಿಸಿ') ||
      text.includes('ಖರೀದಿಸು')
    ) {
      let store: any = undefined;
      if (norm.includes('amazon')) store = 'amazon';
      else if (norm.includes('flipkart')) store = 'flipkart';
      else if (norm.includes('meesho')) store = 'meesho';

      let targetRef: any = 'this';
      if (norm.includes('cheapest') || norm.includes('lowest') || norm.includes('sasta') || norm.includes('kadime')) {
        targetRef = 'cheapest';
      } else if (norm.includes('best') || norm.includes('overall') || norm.includes('achha') || norm.includes('uttam')) {
        targetRef = 'best';
      }

      return {
        action: 'buy',
        params: { store, targetRef },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಖರೀದಿಗೆ ದೃಢೀಕರಣ ಪಡೆಯಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'बुकिंग की पुष्टि की जा रही है...' : 'Confirming your booking...'
      };
    }

    // 14B. PROCEED TO PAYMENT
    if (
      /\b(proceed to payment|go to payment|open payment|pay now|proceed to pay|payment karo|bhugtan karo|pavathisu|pavathige hogu|munduvarisi|munduvariyiri)\b/i.test(
        norm
      ) ||
      englishNorm.includes('proceed to payment') ||
      text.includes('भुगतान करो') ||
      text.includes('पेमेंट करो') ||
      text.includes('ಪಾವತಿಗೆ ಮುಂದುವರಿಯಿರಿ') ||
      text.includes('ಮುಂದುವರಿಯಿರಿ') ||
      text.includes('ಪಾವತಿಗೆ ಹೋಗು')
    ) {
      return {
        action: 'proceed_to_payment',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಪಾವತಿ ಪುಟಕ್ಕೆ ತೆರಳಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'भुगतान पृष्ठ खोला जा रहा है।' : 'Proceeding to payment.'
      };
    }

    // 14C. INCREASE QUANTITY
    if (
      /\b(increase quantity|add one more|add more|quantity badhao|ek aur jodo|ek aur chahiye|pramana hecchisu|inondu serisu|innu beku)\b/i.test(
        norm
      ) ||
      englishNorm.includes('increase quantity') ||
      text.includes('मात्रा बढ़ाओ') ||
      text.includes('ಪ್ರಮಾಣ ಹೆಚ್ಚಿಸು')
    ) {
      return {
        action: 'increase_quantity',
        params: {},
        layer: 'rule',
        confidence: 0.97,
        language: lang,
        reply: lang === 'kn' ? 'ಪ್ರಮಾಣವನ್ನು ಹೆಚ್ಚಿಸಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'मात्रा बढ़ाई जा रही है...' : 'Increasing item quantity...'
      };
    }

    // 14D. CONTINUE SHOPPING
    if (
      /\b(continue shopping|keep shopping|shop more|aur shopping|aur kharidari|shopping jari rakho|matthe shopping madu|shopping mundhuvarisu)\b/i.test(
        norm
      ) ||
      englishNorm.includes('continue shopping') ||
      text.includes('खरीदारी जारी रखो') ||
      text.includes('ಶಾಪಿಂಗ್ ಮುಂದುವರಿಸು')
    ) {
      return {
        action: 'continue_shopping',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಶಾಪಿಂಗ್ ಮುಂದುವರಿಸಲಾಗುತ್ತಿದೆ.' : lang === 'hi' ? 'खरीदारी जारी रख रहे हैं।' : 'Continuing shopping.'
      };
    }

    // 14E. CANCEL ORDER
    if (
      /\b(cancel my order|cancel order|cancel this order|order cancel karo|order raddumadu|nanna order raddumadu)\b/i.test(
        norm
      ) ||
      englishNorm.includes('cancel my order') ||
      text.includes('ऑर्डर रद्द करो') ||
      text.includes('ಆರ್ಡರ್ ರದ್ದು ಮಾಡು')
    ) {
      return {
        action: 'cancel_order',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಆರ್ಡರ್ ರದ್ದುಗೊಳಿಸಲು ದೃಢೀಕರಣ ಪಡೆಯಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'ऑर्डर रद्द करने की पुष्टि की जा रही है...' : 'Confirming order cancellation...'
      };
    }

    // 14F. BUY AGAIN
    if (
      /\b(buy it again|buy again|reorder|order again|phir se kharido|dobara mangao|punaha kharidi|matthe order madu)\b/i.test(
        norm
      ) ||
      englishNorm.includes('buy again') ||
      text.includes('फिर से खरीदो') ||
      text.includes('ಮತ್ತೆ ಆರ್ಡರ್ ಮಾಡು')
    ) {
      return {
        action: 'buy_again',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಮತ್ತೆ ಆರ್ಡರ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'फिर से ऑर्डर किया जा रहा है...' : 'Reordering item...'
      };
    }

    // 15. ADD TO CART (Named product, ordinals, stores, references)
    if (
      /\b(add to cart|add this to cart|add this|add it to cart|add the cheapest to cart|add the cheapest|add lowest price to cart|add lowest to cart|add the best to cart|add the best|add the lowest to cart|add 1st item to cart|add first item to cart|add the 1st one to cart|add the first one to cart|add 2nd one to cart|add second one to cart|add the 2nd one to cart|add the second one to cart|add 3rd one to cart|add third one to cart|add the 3rd one to cart|add the third one to cart|add flipkart one to cart|add the flipkart one to cart|add amazon product to cart|add the amazon one to cart|add the meesho one to cart|cart me dalo|cart me daalo|cart me jodo|ise cart me daalo|saste wale ko cart me daalo|sabse sasta cart me jodo|pehla wala cart me daalo|doosra wala cart me daalo|cartge serisu|idannu cartge serisu|atyuttamavaddannu cartge serisu|kadime beleyaddannu cartge serisu|modaladdannu cartge serisu|eradaneaddannu cartge serisu)\b/i.test(
        norm
      ) ||
      /\badd\s+.+\s+to\s+cart\b/i.test(norm) ||
      englishNorm === 'add to cart' ||
      englishNorm === 'add this to cart' ||
      originalLower.includes('cart me daalo') ||
      originalLower.includes('cart me dalo') ||
      originalLower.includes('cart ge serisu') ||
      text.includes('कार्ट में डालो') ||
      text.includes('कार्ट में जोड़ो') ||
      text.includes('सबसे सस्ता कार्ट में जोड़ो') ||
      text.includes('पहला वाला कार्ट') ||
      text.includes('पहला वाला कार्ट में डालो') ||
      text.includes('इसे कार्ट में डालो') ||
      text.includes('ಕಾರ್ಟ್ಗೆ ಸೇರಿಸು') ||
      text.includes('ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸು') ||
      text.includes('ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ') ||
      text.includes('ಕಾರ್ಟ್‌ಗೆ') ||
      text.includes('ಕಾರ್ಟ್ಗೆ') ||
      text.includes('ಅತ್ಯುತ್ತಮವಾದದ್ದನ್ನು ಕಾರ್ಟ್ಗೆ ಸೇರಿಸು') ||
      text.includes('ಕಡಿಮೆ ಬೆಲೆಯದನ್ನು ಕಾರ್ಟ್ಗೆ ಸೇರಿಸು')
    ) {
      let targetRef: any = 'this';
      let index: number | undefined = undefined;
      let store: any = undefined;
      let productQuery: string | undefined = undefined;

      // Check if a specific named product was requested: e.g. "add iPhone 15 128GB to cart"
      const namedMatch = norm.match(/\badd\s+(.+?)\s+(?:to\s+cart|into\s+cart)\b/i) ||
                         norm.match(/(.+?)\s+(?:cart\s+me\s+daalo|cart\s+me\s+dalo|cart\s+ge\s+serisu)\b/i);
      if (namedMatch && !['this', 'it', 'the item', 'item', 'the product', 'product', 'the cheapest', 'cheapest', 'lowest', 'best', '1st', '2nd', '3rd', 'first', 'second', 'third'].includes(namedMatch[1].trim())) {
        productQuery = namedMatch[1].trim();
        targetRef = 'named';
      }

      if (
        norm.includes('cheapest') ||
        norm.includes('lowest') ||
        norm.includes('saste') ||
        norm.includes('sasta') ||
        norm.includes('kadime') ||
        text.includes('सस्ता') ||
        text.includes('सस्ते') ||
        text.includes('ಕಡಿಮೆ')
      ) {
        targetRef = 'cheapest';
      } else if (
        norm.includes('best') ||
        norm.includes('overall') ||
        norm.includes('top') ||
        norm.includes('achha') ||
        norm.includes('uttam') ||
        norm.includes('atyuttama') ||
        text.includes('ಅತ್ಯುತ್ತಮ')
      ) {
        targetRef = 'best';
      } else if (norm.includes('1st') || norm.includes('first') || norm.includes('pehla') || norm.includes('modala') || text.includes('पहला') || text.includes('ಮೊದಲ')) {
        targetRef = 'first';
        index = 0;
      } else if (norm.includes('2nd') || norm.includes('second') || norm.includes('doosra') || norm.includes('eradane') || text.includes('दूसरा') || text.includes('ಎರಡನೇ')) {
        targetRef = 'second';
        index = 1;
      } else if (norm.includes('3rd') || norm.includes('third') || norm.includes('teesra') || norm.includes('moorane') || text.includes('तीसरा') || text.includes('ಮೂರನೇ')) {
        targetRef = 'third';
        index = 2;
      }

      if (norm.includes('flipkart') || originalLower.includes('flipkart')) store = 'flipkart';
      else if (norm.includes('amazon') || originalLower.includes('amazon')) store = 'amazon';
      else if (norm.includes('meesho') || originalLower.includes('meesho')) store = 'meesho';

      return {
        action: 'add_to_cart',
        params: { targetRef, index, store, productQuery },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'कार्ट में जोड़ा जा रहा है...' : 'Adding to your cart...'
      };
    }

    // 16A. SPECIFICATIONS QUERY
    if (
      /\b(show the specifications|show specifications|what are the specifications|what is the specification|tell me the specifications|tell specifications|tell specs|specifications|specs|show specs|full specs|technical specifications|specification dikhao|specs kya hai|vivaranegalu|vivarane torisu|specification torisu|specs helu|vivaranegalu tilisi|vivarane tilisi)\b/i.test(
        norm
      ) ||
      englishNorm.includes('specifications') ||
      englishNorm.includes('specs') ||
      originalLower.includes('specification') ||
      originalLower.includes('specs') ||
      text.includes('स्पेसिफिकेशन') ||
      text.includes('विवरण दिखाओ') ||
      text.includes('ವಿವರಣೆಗಳನ್ನು ತೋರಿಸು') ||
      text.includes('ವಿವರಣೆಗಳನ್ನು ತಿಳಿಸಿ') ||
      text.includes('ಸ್ಪೆಸಿಫಿಕೇಶನ್')
    ) {
      return {
        action: 'get_specifications',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ವಿವರಣೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'स्पेसिफिकेशन्स देखे जा रहे हैं...' : 'Retrieving specifications...'
      };
    }

    // 16B. RATING QUERY
    if (
      /\b(what is the rating|tell me the rating|what is the score|star rating|how many stars|what rating|rating kya hai|kitne star hai|rating batao|rating eshtu|star eshtu|rating helu)\b/i.test(
        norm
      ) ||
      englishNorm.includes('rating') ||
      originalLower.includes('rating') ||
      originalLower.includes('stars') ||
      text.includes('रेटिंग क्या है') ||
      text.includes('कितने स्टार हैं') ||
      text.includes('ರೇಟಿಂಗ್ ಎಷ್ಟು') ||
      text.includes('ಸ್ಟಾರ್ ರೇಟಿಂಗ್')
    ) {
      return {
        action: 'get_rating',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ರೇಟಿಂಗ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'रेटिंग जांची जा रही है...' : 'Checking rating...'
      };
    }

    // 16C. QUANTITY & PACK SIZE QUERY
    if (
      /\b(what is the quantity|what is the pack size|how many units|pack size|quantity kya hai|pack size kya hai|kitne piece hai|kitna quantity hai|pramana eshtu|pack size eshtu|quantity eshtu|yastu pieces ide)\b/i.test(
        norm
      ) ||
      englishNorm.includes('quantity') ||
      englishNorm.includes('pack size') ||
      originalLower.includes('quantity') ||
      originalLower.includes('pack size') ||
      text.includes('क्वांटिटी क्या है') ||
      text.includes('पैक साइज क्या है') ||
      text.includes('ಪ್ರಮಾಣ ಎಷ್ಟು') ||
      text.includes('ಪ್ಯಾಕ್ ಸೈಜ್ ಎಷ್ಟು')
    ) {
      return {
        action: 'get_quantity',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಪ್ರಮಾಣವನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'मात्रा जांची जा रही है...' : 'Checking quantity and pack size...'
      };
    }

    // 16D. QUALITY SCORE QUERY
    if (
      /\b(how is the quality|what is the quality|quality score|how good is the quality|quality score kya hai|quality kaisi hai|quality kaisa hai|gunamatta hegide|quality hegide|quality score eshtu)\b/i.test(
        norm
      ) ||
      englishNorm.includes('quality') ||
      originalLower.includes('quality') ||
      text.includes('क्वालिटी कैसी है') ||
      text.includes('क्वालिटी स्कोर क्या है') ||
      text.includes('ಗುಣಮಟ್ಟ ಹೇಗಿದೆ') ||
      text.includes('ಕ್ವಾಲಿಟಿ ಸ್ಕೋರ್ ಎಷ್ಟು')
    ) {
      return {
        action: 'get_quality',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಗುಣಮಟ್ಟದ ಸ್ಕೋರ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'क्वालिटी स्कोर जाँचा जा रहा है...' : 'Checking quality score...'
      };
    }

    // 16E. BATTERY LIFE QUERY
    if (
      /\b(what is the battery life|battery life|battery backup|playtime|play time|battery capacity|how long does the battery last|battery kitni hai|battery backup kitna hai|battery eshtu baratte|battery backup eshtu|playtime eshtu)\b/i.test(
        norm
      ) ||
      englishNorm.includes('battery life') ||
      englishNorm.includes('playtime') ||
      text.includes('बैटरी लाइफ') ||
      text.includes('बैटरी कितनी है') ||
      text.includes('ಬ್ಯಾಟರಿ ಲೈಫ್') ||
      text.includes('ಬ್ಯಾಟರಿ ಎಷ್ಟು')
    ) {
      return {
        action: 'get_battery_life',
        params: {},
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಬ್ಯಾಟರಿ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'बैटरी विवरण देखा जा रहा है...' : 'Checking battery life details...'
      };
    }

    // 16F. COMPARE PRICES ACROSS STORES
    if (
      /\b(is it cheaper on flipkart|is it cheaper on amazon|is it cheaper on meesho|compare prices|compare on all stores|compare all stores|compare across stores|compare stores|which store is cheapest|price difference|flipkart me kitna hai|amazon me kitna hai|yaava store alli kadime|bele holike madu|sabhi store par tulna karo|sabhi stores par tulna karo|ella angadegalalli holike|ella angadegalalli holike madi)\b/i.test(
        norm
      ) ||
      englishNorm.includes('is it cheaper on') ||
      englishNorm.includes('compare prices') ||
      englishNorm.includes('compare on all stores') ||
      englishNorm.includes('compare all stores') ||
      text.includes('कीमतों की तुलना') ||
      text.includes('तुलना करो') ||
      text.includes('फ्लिपकार्ट पर सस्ता') ||
      text.includes('ಬೆಲೆ ಹೋಲಿಕೆ') ||
      text.includes('ಹೋಲಿಕೆ ಮಾಡಿ')
    ) {
      let store: any = undefined;
      if (norm.includes('flipkart')) store = 'flipkart';
      else if (norm.includes('amazon')) store = 'amazon';
      else if (norm.includes('meesho')) store = 'meesho';

      return {
        action: 'compare_prices',
        params: { store },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಅಂಗಡಿಗಳ ನಡುವೆ ಬೆಲೆ ಹೋಲಿಸಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'स्टोर्स की कीमतों की तुलना की जा रही है...' : 'Comparing prices across stores...'
      };
    }

    // 16G. SHOW NEXT OPTION / COMPARE WITH SECOND OPTION
    if (
      /\b(show the next one|show next one|show next option|show the 2nd option|show second option|show another option|show next|next option|next one|next product|compare with the second option|compare with second option|compare with the 2nd option|compare with 2nd option|2nd option|second option|agla dikhao|doosra option dikhao|mundina option torisu|eradane option torisu|agla option)\b/i.test(
        norm
      ) ||
      norm.includes('compare with the 2nd option') ||
      norm.includes('compare with 2nd option') ||
      englishNorm.includes('show next') ||
      englishNorm.includes('next one') ||
      englishNorm.includes('compare with the second option') ||
      englishNorm.includes('second option') ||
      text.includes('अगला दिखाओ') ||
      text.includes('अगला विकल्प') ||
      text.includes('दूसरा विकल्प') ||
      text.includes('दूसरा विकल्प दिखाओ') ||
      text.includes('ಮುಂದಿನ ಆಯ್ಕೆ') ||
      text.includes('ಮುಂದಿನ ಆಯ್ಕೆ ತೋರಿಸು')
    ) {
      let index = 1;
      if (norm.includes('3rd') || norm.includes('third') || norm.includes('teesra') || norm.includes('moorane')) {
        index = 2;
      }
      return {
        action: 'show_next_option',
        params: { index },
        layer: 'rule',
        confidence: 0.98,
        language: lang,
        reply: lang === 'kn' ? 'ಮುಂದಿನ ಆಯ್ಕೆಯನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'अगला विकल्प दिखाया जा रहा है...' : 'Showing the next option...'
      };
    }

    // 16. READ DETAILS / PRICE
    if (
      /\b(read details|read the details|tell me the price|what is the price|tell price|show product details|product details|features|price kya hai|details batao|kimat batao|vivaran batao|vivaran padho|pricy kya hai|bele eshtu|vivaragalanu helu|vivaragalanu odi|utpanna vivara tilisi|details helu)\b/i.test(
        norm
      ) ||
      englishNorm.includes('read details') ||
      englishNorm.includes('price') ||
      text.includes('कीमत बताओ') ||
      text.includes('कीमत क्या है') ||
      text.includes('कीमत') ||
      text.includes('विवरण पढ़ो') ||
      text.includes('प्राइस क्या है') ||
      text.includes('ಬೆಲೆ ಎಷ್ಟು') ||
      text.includes('ವಿವರಗಳನ್ನು ಓದಿ') ||
      text.includes('ಉತ್ಪನ್ನ ವಿವರ ತಿಳಿಸಿ')
    ) {
      return {
        action: 'read_details',
        params: {},
        layer: 'rule',
        confidence: 0.96,
        language: lang,
        reply: lang === 'kn' ? 'ಉತ್ಪನ್ನದ ವಿವರಗಳನ್ನು ಓದಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'उत्पाद विवरण पढ़ा जा रहा है...' : 'Reading product details...'
      };
    }

    // 17. CHEAPEST STANDALONE
    if (
      norm === 'cheapest' ||
      norm === 'show the cheapest' ||
      norm.includes('cheapest') ||
      originalLower.includes('sasta dikhao') ||
      originalLower.includes('kadime bele') ||
      text.includes('सबसे सस्ता') ||
      text.includes('ಅತ್ಯಂತ ಕಡಿಮೆ') ||
      text.includes('ಅಗ್ಗವಾಗಿದೆ') ||
      text.includes('ಅತ್ಯಂತ ಅಗ್ಗ') ||
      text.includes('ಅಗ್ಗ')
    ) {
      return {
        action: 'search',
        params: { preference: 'cheapest', query: norm.replace(/\b(cheapest|find|show me|the)\b/gi, '').trim() || undefined },
        layer: 'rule',
        confidence: 0.95,
        language: lang,
        reply: lang === 'kn' ? 'ಅತ್ಯಂತ ಕಡಿಮೆ ಬೆಲೆಯ ಉತ್ಪನ್ನಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'सबसे सस्ते उत्पाद दिखाए जा रहे हैं...' : 'Showing the cheapest options...'
      };
    }

    // 18. SEARCH / COMPARE PRODUCT
    const searchMatch =
      norm.match(/\b(?:find|search|look for|get me|khojo|dhundo|huduku|torisu|nodisu)\s+(.+)/i) ||
      norm.match(/\b(?:show me|show the|show|display|dikhao)\s+(?!the\s*(?:1st|2nd|3rd|first|second|third|cheapest|best|lowest|specifications|specs|next|orders|cart|settings|my orders|my cart|addresses|for you|mobiles|fashion|electronics|appliances)\b)(.+)/i);

    if (
      searchMatch ||
      norm.includes('under') ||
      norm.includes('ke andar') ||
      norm.includes('olage') ||
      text.includes('ಒಳಗೆ') ||
      originalLower.includes('dhundo') ||
      originalLower.includes('huduku') ||
      text.includes('ढूंढो') ||
      text.includes('खोजो') ||
      text.includes('दिखाओ') ||
      text.includes('ಹುಡುಕು') ||
      text.includes('ತೋರಿಸು')
    ) {
      let rawQuery = searchMatch ? searchMatch[1] : englishNorm;
      let maxBudget: number | undefined = undefined;

      const budgetMatch =
        rawQuery.match(/(?:under|below|less than|ke andar|ke niche|olage|kadime)\s*(?:₹|rs|rupees)?\s*(\d+)/i) ||
        rawQuery.match(/(\d+)\s*(?:₹|rs|rupees)?\s*(?:ke andar|ke niche|olage|under|r\s+olage|ra\s+olage)/i) ||
        text.match(/(\d+)\s*(?:₹|rs|rupees)?\s*(?:ರ\s*ಒಳಗೆ|ಒಳಗೆ)/) ||
        norm.match(/(?:under|below|less than|ke andar|ke niche|olage|kadime)\s*(?:₹|rs|rupees)?\s*(\d+)/i) ||
        norm.match(/(\d+)\s*(?:₹|rs|rupees)?\s*(?:ke andar|ke niche|olage|under)/i);

      if (budgetMatch) {
        maxBudget = parseInt(budgetMatch[1], 10);
        rawQuery = rawQuery.replace(budgetMatch[0], '').trim();
      }

      const cleanedQuery = rawQuery
        .replace(/\b(find|search|show me|show the|show|look for|compare|get me|khojo|dhundo|dikhao|thulane karo|huduku|torisu|nodisu|please|for me|best|cheapest|good|mujhe|chahiye|beku|nodbeku)\b/gi, '')
        .trim();

      if (cleanedQuery.length >= 2 || rawQuery.trim().length >= 2) {
        const queryToUse = cleanedQuery.length >= 2 ? cleanedQuery : rawQuery.trim();
        return {
          action: 'search',
          params: { query: queryToUse, maxBudget },
          layer: 'rule',
          confidence: 0.98,
          language: lang,
          reply:
            lang === 'kn'
              ? `${queryToUse} ಹುಡುಕಲಾಗುತ್ತಿದೆ...`
              : lang === 'hi'
              ? `${queryToUse} खोजा जा रहा है...`
              : `Searching for ${queryToUse}...`
        };
      }
    }

    return null;
  }

  public async route(
    transcript: string,
    context?: ConversationContext,
    currentLang: SupportedLanguage = 'en'
  ): Promise<CommandResult> {
    const trimmed = transcript.trim();
    if (!trimmed) {
      return {
        action: 'chat',
        params: {},
        layer: 'rule',
        confidence: 1.0,
        language: currentLang,
        reply: ''
      };
    }

    const ruleMatch = this.matchRule(trimmed, currentLang);
    if (ruleMatch) {
      return ruleMatch;
    }

    // Call backend API for AI command fallback via unified HTTP client
    try {
      const res = await api.routeVoiceCommand(
        trimmed,
        {
          currentScreen: context?.currentScreen,
          cartItemCount: context?.cart?.length || 0,
          hasLastOrder: !!context?.lastOrder
        },
        currentLang === 'auto' ? undefined : (currentLang as any)
      );

      const commandData = (res && (res as any).result) ? (res as any).result : res;
      if (commandData && commandData.action && commandData.action !== 'chat') {
        return {
          action: commandData.action,
          params: commandData.params || {},
          layer: commandData.layer || 'ai',
          confidence: commandData.confidence || 0.85,
          language: commandData.language || (currentLang === 'auto' ? 'en' : currentLang),
          reply: commandData.reply || 'Processing your request...'
        };
      } else if (commandData && commandData.action === 'chat' && commandData.reply && !commandData.reply.startsWith('How can I assist')) {
        return {
          action: 'chat',
          params: commandData.params || {},
          layer: commandData.layer || 'ai',
          confidence: commandData.confidence || 0.7,
          language: commandData.language || (currentLang === 'auto' ? 'en' : currentLang),
          reply: commandData.reply
        };
      }
    } catch (err) {
      console.warn('Backend AI fallback failed:', err);
    }

    // Fallback: If query has 2 or more characters and is not a generic greeting, treat as product search
    if (trimmed.length >= 2 && !/^(hi|hello|hey|namaste|namaskara|bye|goodbye|help)$/i.test(trimmed)) {
      const queryToUse = trimmed
        .replace(/\b(find|search|show me|show the|show|look for|get me|khojo|dhundo|dikhao|huduku|torisu|nodisu|please|chahiye|beku)\b/gi, '')
        .trim() || trimmed;

      return {
        action: 'search',
        params: { query: queryToUse },
        layer: 'rule',
        confidence: 0.85,
        language: currentLang === 'auto' ? 'en' : currentLang,
        reply:
          currentLang === 'kn'
            ? `${queryToUse} ಹುಡುಕಲಾಗುತ್ತಿದೆ...`
            : currentLang === 'hi'
            ? `${queryToUse} खोजा जा रहा है...`
            : `Searching for ${queryToUse}...`
      };
    }

    return {
      action: 'chat',
      params: { rawText: transcript },
      layer: 'ai',
      confidence: 0.5,
      language: currentLang,
      reply: 'How can I assist you with VoiceCart shopping?'
    };
  }
}

export const commandRouter = new CommandRouter();
