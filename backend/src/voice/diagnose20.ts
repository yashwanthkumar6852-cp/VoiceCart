import { commandRouter } from './commandRouter';
import { voiceNormalizer } from './normalize';

const commands = [
  // 1. find boAt earbuds under 2000
  {
    en: 'find boAt earbuds under 2000',
    hi: '2000 के अंदर boAt ईयरबड्स ढूंढो',
    kn: '2000 ಒಳಗೆ boAt ಇಯರ್‌ಬಡ್ಸ್ ಹುಡುಕು',
    expectedAction: 'search'
  },
  // 2. show the iPhone 14
  {
    en: 'show the iPhone 14',
    hi: 'iPhone 14 दिखाओ',
    kn: 'iPhone 14 ತೋರಿಸು',
    expectedAction: 'search' // or show_details / search
  },
  // 3. tell me the specifications
  {
    en: 'tell me the specifications',
    hi: 'स्पेसिफिकेशन बताओ',
    kn: 'ವಿವರಣೆಗಳನ್ನು ತಿಳಿಸಿ',
    expectedAction: 'get_specifications'
  },
  // 4. what is the price
  {
    en: 'what is the price',
    hi: 'कीमत क्या है',
    kn: 'ಬೆಲೆ ಎಷ್ಟು',
    expectedAction: 'read_details' // or ask_about_product / read_details
  },
  // 5. compare on all stores
  {
    en: 'compare on all stores',
    hi: 'सभी स्टोर पर तुलना करो',
    kn: 'ಎಲ್ಲಾ ಅಂಗಡಿಗಳಲ್ಲಿ ಹೋಲಿಕೆ ಮಾಡಿ',
    expectedAction: 'compare_prices' // or compare
  },
  // 6. which is the cheapest
  {
    en: 'which is the cheapest',
    hi: 'सबसे सस्ता कौन सा है',
    kn: 'ಯಾವುದು ಅತ್ಯಂತ ಕಡಿಮೆ ಬೆಲೆಯದ್ದು',
    expectedAction: 'compare_prices' // or search with cheapest
  },
  // 7. show the next one
  {
    en: 'show the next one',
    hi: 'अगला विकल्प दिखाओ',
    kn: 'ಮುಂದಿನ ಆಯ್ಕೆ ತೋರಿಸು',
    expectedAction: 'show_next_option' // or next_item
  },
  // 8. book it
  {
    en: 'book it',
    hi: 'इसे बुक करो',
    kn: 'ಇದನ್ನು ಬುಕ್ ಮಾಡು',
    expectedAction: 'buy'
  },
  // 9. yes
  {
    en: 'yes',
    hi: 'हाँ',
    kn: 'ಹೌದು',
    expectedAction: 'confirm_yes'
  },
  // 10. no
  {
    en: 'no',
    hi: 'नहीं',
    kn: 'ಬೇಡ',
    expectedAction: 'confirm_no'
  },
  // 11. add to cart
  {
    en: 'add to cart',
    hi: 'कार्ट में जोड़ो',
    kn: 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸು',
    expectedAction: 'add_to_cart'
  },
  // 12. open cart
  {
    en: 'open cart',
    hi: 'कार्ट खोलो',
    kn: 'ಕಾರ್ಟ್ ತೆರೆ',
    expectedAction: 'open_cart'
  },
  // 13. increase quantity
  {
    en: 'increase quantity',
    hi: 'मात्रा बढ़ाओ',
    kn: 'ಪ್ರಮಾಣ ಹೆಚ್ಚಿಸು',
    expectedAction: 'increase_quantity'
  },
  // 14. remove this
  {
    en: 'remove this',
    hi: 'इसे हटाओ',
    kn: 'ಇದನ್ನು ತೆಗೆದುಹಾಕು',
    expectedAction: 'remove_from_cart'
  },
  // 15. proceed to payment
  {
    en: 'proceed to payment',
    hi: 'भुगतान के लिए आगे बढ़ो',
    kn: 'ಪಾವತಿಗೆ ಮುಂದುವರಿಯಿರಿ',
    expectedAction: 'proceed_to_payment'
  },
  // 16. where is my order
  {
    en: 'where is my order',
    hi: 'मेरा ऑर्डर कहाँ है',
    kn: 'ನನ್ನ ಆರ್ಡರ್ ಎಲ್ಲಿದೆ',
    expectedAction: 'track_order'
  },
  // 17. show my orders
  {
    en: 'show my orders',
    hi: 'मेरे ऑर्डर दिखाओ',
    kn: 'ನನ್ನ ಆರ್ಡರ್‌ಗಳನ್ನು ತೋರಿಸು',
    expectedAction: 'open_orders'
  },
  // 18. go back
  {
    en: 'go back',
    hi: 'पीछे जाओ',
    kn: 'ಹಿಂದೆ ಹೋಗು',
    expectedAction: 'go_back'
  },
  // 19. stop
  {
    en: 'stop',
    hi: 'रुक जाओ',
    kn: 'ನಿಲ್ಲಿಸು',
    expectedAction: 'stop'
  },
  // 20. change language to Hindi
  {
    en: 'change language to Hindi',
    hi: 'भाषा बदलकर हिन्दी करो',
    kn: 'ಭಾಷೆಯನ್ನು ಹಿಂದಿಗೆ ಬದಲಾಯಿಸಿ',
    expectedAction: 'change_language'
  }
];

async function runDiagnosis() {
  console.log('=== VOICE PIPELINE DIAGNOSIS (20 COMMANDS x 3 LANGUAGES) ===\n');

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    console.log(`\n------------------------------------------------------------`);
    console.log(`COMMAND #${i + 1}: Expected: [${cmd.expectedAction}]`);
    console.log(`------------------------------------------------------------`);

    for (const lang of ['en', 'hi', 'kn'] as const) {
      const text = cmd[lang];
      const normResult = voiceNormalizer.normalize(text, lang);
      const res = await commandRouter.route(text, undefined, lang);

      const pass = res.action === cmd.expectedAction || (cmd.expectedAction === 'search' && res.action === 'search');
      const statusIcon = pass ? '✅ PASS' : '❌ FAIL';

      console.log(`[${lang.toUpperCase()}] "${text}" -> ${statusIcon}`);
      console.log(`     Normalized: "${normResult.englishText}" | DetLang: ${normResult.language}`);
      console.log(`     Matched: Layer: ${res.layer} | Action: ${res.action} | Conf: ${res.confidence}`);
      console.log(`     Params: ${JSON.stringify(res.params)}`);
      console.log(`     Reply: "${res.reply}"`);
    }
  }
}

runDiagnosis().catch(console.error);
