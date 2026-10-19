const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const key = process.env.GEMINI_API_KEY || '';

async function test() {
  const models = ['gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-3.5-flash-lite'];
  for (const m of models) {
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`,
        {
          contents: [{
            role: 'user',
            parts: [{
              text: 'Extract product spec from "boAt Airdopes 141" in strict JSON format: { "rawQuery": "boAt Airdopes 141", "englishQuery": "boAt Airdopes 141", "productType": "earbuds", "brand": "boAt", "model": "Airdopes 141", "variant": {}, "mustInclude": ["boAt", "141"], "mustExclude": ["case", "cover", "strap"], "budgetMin": null, "budgetMax": null, "preference": "balanced", "isSpecific": true }'
            }]
          }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        },
        { timeout: 8000 }
      );
      console.log(`Success with ${m}:`, res.data.candidates[0].content.parts[0].text);
      break;
    } catch (e) {
      console.error(`Error with ${m}:`, e.response?.data?.error || e.message);
    }
  }
}

test();
