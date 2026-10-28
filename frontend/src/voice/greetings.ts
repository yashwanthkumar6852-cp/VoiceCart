export interface GreetingResult {
  isGreeting: boolean;
  type?: 'gm' | 'ga' | 'ge' | 'gn' | 'general' | 'identity';
  spokenResponse: string;
  displayText: string;
  suggestedCommands: string[];
}

export function detectAndGenerateGreeting(
  transcript: string,
  lang: 'en' | 'hi' | 'kn' = 'en'
): GreetingResult | null {
  if (!transcript) return null;

  const raw = transcript.trim().toLowerCase();
  const clean = raw.replace(/[.,/#!$%^&*;:{}=\-_`~()?¿¡!"']/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Check for specific time-based greeting acronyms & phrases
  const isGm = /\b(gm|g\s*m|good\s*morning|morning|suprabhat|shubhodaya|shubh\s*prabhat)\b/i.test(clean) ||
    /^(सुप्रभात|शुभ प्रभात|ಶುಭೋದಯ)$/.test(raw);

  const isGaOrGf = /\b(ga|g\s*a|gf|g\s*f|good\s*afternoon|afternoon|shubh\s*dopahar|shubha\s*madhyahna)\b/i.test(clean) ||
    /^(शुभ दोपहर|ಶುಭ ಮಧ್ಯಾಹ್ನ)$/.test(raw);

  const isGe = /\b(ge|g\s*e|good\s*evening|evening|shubh\s*sandhya|shubha\s*sanje)\b/i.test(clean) ||
    /^(शुभ संध्या|ಶುಭ ಸಂಜೆ)$/.test(raw);

  const isGn = /\b(gn|g\s*n|good\s*night|night|shubh\s*ratri|shubha\s*ratri)\b/i.test(clean) ||
    /^(शुभ रात्रि|ಶುಭ ರಾತ್ರಿ)$/.test(raw);

  // 2. Check for assistant wake words & general greetings
  const isAssistantWake = /\b(hey\s*siri|hi\s*siri|siri|hey\s*google|ok\s*google|okay\s*google|google\s*assistant|hey\s*voicecart|hello\s*voicecart|hi\s*voicecart|voicecart|hey\s*alexa|alexa)\b/i.test(clean);

  const isGeneralGreeting = /\b(hi|hello|hey|heya|hiya|namaste|namaskara|namaskar|vanakkam|greetings|yo|wassup|what's\s*up|whats\s*up)\b/i.test(clean) ||
    /^(नमस्ते|हेलो|हाय|ನಮಸ್ಕಾರ|ಹಲೋ|ಹಾಯ್)$/.test(raw);

  // 3. Check for identity / who are you
  const isIdentity = /\b(who\s*are\s*you|what\s*is\s*your\s*name|who\s*made\s*you|introduce\s*yourself|tum\s*kaun\s*ho|neenu\s*yaaru)\b/i.test(clean) ||
    /^(तुम कौन हो|ನೀನು ಯಾರು)$/.test(raw);

  if (!isGm && !isGaOrGf && !isGe && !isGn && !isAssistantWake && !isGeneralGreeting && !isIdentity) {
    return null;
  }

  // Determine current time period (local system clock)
  const hour = new Date().getHours();
  let timeOfDayGreetingEn = 'Good morning';
  let timeOfDayGreetingHi = 'सुप्रभात';
  let timeOfDayGreetingKn = 'ಶುಭೋದಯ';

  if (hour >= 4 && hour < 12) {
    timeOfDayGreetingEn = 'Good morning';
    timeOfDayGreetingHi = 'सुप्रभात';
    timeOfDayGreetingKn = 'ಶುಭೋದಯ';
  } else if (hour >= 12 && hour < 17) {
    timeOfDayGreetingEn = 'Good afternoon';
    timeOfDayGreetingHi = 'शुभ दोपहर';
    timeOfDayGreetingKn = 'ಶುಭ ಮಧ್ಯಾಹ್ನ';
  } else if (hour >= 17 && hour < 21) {
    timeOfDayGreetingEn = 'Good evening';
    timeOfDayGreetingHi = 'शुभ संध्या';
    timeOfDayGreetingKn = 'ಶುಭ ಸಂಜೆ';
  } else {
    timeOfDayGreetingEn = 'Good evening'; // Night greeting
    timeOfDayGreetingHi = 'शुभ संध्या';
    timeOfDayGreetingKn = 'ಶುಭ ಸಂಜೆ';
  }

  const suggestedCommands = [
    'Search boAt earbuds under 2000',
    'Compare iPhone 15 prices',
    'Show top deals today',
    'Where is my order?'
  ];

  // A. Identity / Introduction
  if (isIdentity) {
    let spoken = "I am your VoiceCart AI Assistant, inspired by Siri and Google Assistant. You can speak to search products across Amazon, Flipkart, and Meesho, compare prices, manage your cart, and track orders! How can I help you today?";
    if (lang === 'hi') {
      spoken = "मैं आपका वॉयसकार्ट एआई सहायक हूँ, सिरी और गूगल असिस्टेंट की तरह! आप अमेज़न, फ्लिपकार्ट और मीशो पर उत्पाद खोजने, कीमतें जांचने और ऑर्डर ट्रैक करने के लिए बोल सकते हैं। आज मैं आपकी क्या सहायता करूँ?";
    } else if (lang === 'kn') {
      spoken = "ನಾನು ಸಿರಿ ಮತ್ತು ಗೂಗಲ್ ಅಸಿಸ್ಟೆಂಟ್ ತರಹದ ನಿಮ್ಮ ವಾಯ್ಸ್‌ಕಾರ್ಟ್ ಎಐ ಸಹಾಯಕ. ನೀವು ಅಮೆಜಾನ್, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ಮತ್ತು ಮೀಶೋ ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಲು ಧ್ವನಿ ಆಜ್ಞೆಗಳನ್ನು ನೀಡಬಹುದು. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?";
    }
    return {
      isGreeting: true,
      type: 'identity',
      spokenResponse: spoken,
      displayText: spoken,
      suggestedCommands
    };
  }

  // B. Specific Good Morning (gm)
  if (isGm) {
    let spoken = "Good morning! How can I help you today? What product would you like to search or buy?";
    if (lang === 'hi') {
      spoken = "सुप्रभात! आज मैं आपकी क्या सहायता कर सकता हूँ? आप क्या खोजना या खरीदना चाहते हैं?";
    } else if (lang === 'kn') {
      spoken = "ಶುಭೋದಯ! ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ನೀವು ಏನನ್ನು ಹುಡುಕಲು ಅಥವಾ ಖರೀದಿಸಲು ಬಯಸುತ್ತೀರಿ?";
    }
    return {
      isGreeting: true,
      type: 'gm',
      spokenResponse: spoken,
      displayText: spoken,
      suggestedCommands
    };
  }

  // C. Specific Good Afternoon (ga / gf)
  if (isGaOrGf) {
    let spoken = "Good afternoon! How can I help you today? What product are you looking to buy or compare?";
    if (lang === 'hi') {
      spoken = "शुभ दोपहर! आज मैं आपकी क्या सहायता कर सकता हूँ? आप क्या खोजना या खरीदना चाहते हैं?";
    } else if (lang === 'kn') {
      spoken = "ಶುಭ ಮಧ್ಯಾಹ್ನ! ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ನೀವು ಏನನ್ನು ಹುಡುಕಲು ಅಥವಾ ಖರೀದಿಸಲು ಬಯಸುತ್ತೀರಿ?";
    }
    return {
      isGreeting: true,
      type: 'ga',
      spokenResponse: spoken,
      displayText: spoken,
      suggestedCommands
    };
  }

  // D. Specific Good Evening (ge)
  if (isGe) {
    let spoken = "Good evening! How can I help you today? What would you like to find on Amazon, Flipkart, or Meesho?";
    if (lang === 'hi') {
      spoken = "शुभ संध्या! आज मैं आपकी क्या सहायता कर सकता हूँ? आप क्या खोजना या खरीदना चाहते हैं?";
    } else if (lang === 'kn') {
      spoken = "ಶುಭ ಸಂಜೆ! ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ನೀವು ಏನನ್ನು ಹುಡುಕಲು ಅಥವಾ ಖರೀದಿಸಲು ಬಯಸುತ್ತೀರಿ?";
    }
    return {
      isGreeting: true,
      type: 'ge',
      spokenResponse: spoken,
      displayText: spoken,
      suggestedCommands
    };
  }

  // E. Specific Good Night (gn)
  if (isGn) {
    let spoken = "Good night! How can I help you? Need any quick shopping assistance or order status before you rest?";
    if (lang === 'hi') {
      spoken = "शुभ रात्रि! क्या आप सोने से पहले कुछ खोजना या ऑर्डर स्थिति जानना चाहते हैं? मैं आपकी क्या सहायता करूँ?";
    } else if (lang === 'kn') {
      spoken = "ಶುಭ ರಾತ್ರಿ! ನಿದ್ರಿಸುವ ಮುನ್ನ ಏನಾದರೂ ಶಾಪಿಂಗ್ ಮಾಡಬೇಕೇ ಅಥವಾ ಆರ್ಡರ್ ಸ್ಥಿತಿ ತಿಳಿಯಬೇಕೇ? ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?";
    }
    return {
      isGreeting: true,
      type: 'gn',
      spokenResponse: spoken,
      displayText: spoken,
      suggestedCommands
    };
  }

  // F. General Hi / Hello / Hey / Hey Google / Siri style response with time-of-day greeting
  let spoken = `Hello! ${timeOfDayGreetingEn}! I'm your VoiceCart Assistant. How can I help you today? What are you looking to buy or search for?`;
  if (lang === 'hi') {
    spoken = `नमस्ते! ${timeOfDayGreetingHi}! मैं आपका वॉयसकार्ट सहायक हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ? आप क्या खोजना या खरीदना चाहते हैं?`;
  } else if (lang === 'kn') {
    spoken = `ನಮಸ್ಕಾರ! ${timeOfDayGreetingKn}! ನಾನು ನಿಮ್ಮ ವಾಯ್ಸ್‌ಕಾರ್ಟ್ ಸಹಾಯಕ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ನೀವು ಏನನ್ನು ಹುಡುಕಲು ಅಥವಾ ಖರೀದಿಸಲು ಬಯಸುತ್ತೀರಿ?`;
  }

  return {
    isGreeting: true,
    type: 'general',
    spokenResponse: spoken,
    displayText: spoken,
    suggestedCommands
  };
}
