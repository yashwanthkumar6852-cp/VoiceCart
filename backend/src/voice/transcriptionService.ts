import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config';

export interface TranscriptionResult {
  text: string;
  provider: 'sarvam' | 'groq' | 'gemini' | 'fallback';
  lang: string;
  durationMs?: number;
}

export class TranscriptionService {
  /**
   * Transcribes audio buffer / base64 using a multi-tiered provider cascade:
   * Tier 1: Sarvam AI (Saaras v3) - Specialized for Indian languages (Kannada, Hindi, Indian English)
   * Tier 2: Groq Whisper (whisper-large-v3) - Ultra fast low-latency STT
   * Tier 3: Google Gemini (Multimodal Audio inline) - Broad multilingual intelligence
   */
  public async transcribeAudio(
    audioBuffer: Buffer,
    mimeType = 'audio/webm',
    requestedLang = 'en-IN'
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    const langCode = this.normalizeLangCode(requestedLang);

    // 1. Try Sarvam AI Saaras v3 (if SARVAM_API_KEY configured)
    if (config.sarvamApiKey) {
      try {
        const sarvamResult = await this.transcribeSarvam(audioBuffer, mimeType, langCode);
        if (sarvamResult && sarvamResult.trim().length > 0) {
          console.log(`🎙️ [STT] Successfully transcribed via Sarvam AI [Lang: ${langCode}] in ${Date.now() - startTime}ms`);
          return {
            text: sarvamResult.trim(),
            provider: 'sarvam',
            lang: requestedLang,
            durationMs: Date.now() - startTime
          };
        }
      } catch (sarvamErr: any) {
        console.warn('⚠️ Sarvam AI STT error (falling back to Groq/Gemini):', sarvamErr.response?.data?.message || sarvamErr.message);
      }
    }

    // 2. Try Groq Whisper (if GROQ_API_KEY configured)
    if (config.groqApiKey) {
      try {
        const groqResult = await this.transcribeGroq(audioBuffer, mimeType, langCode);
        if (groqResult && groqResult.trim().length > 0) {
          console.log(`🎙️ [STT] Successfully transcribed via Groq Whisper [Lang: ${langCode}] in ${Date.now() - startTime}ms`);
          return {
            text: groqResult.trim(),
            provider: 'groq',
            lang: requestedLang,
            durationMs: Date.now() - startTime
          };
        }
      } catch (groqErr: any) {
        console.warn('⚠️ Groq Whisper STT error (falling back to Gemini):', groqErr.response?.data?.error?.message || groqErr.message);
      }
    }

    // 3. Try Google Gemini Multimodal Audio (if GEMINI_API_KEY configured)
    if (config.geminiApiKey) {
      try {
        const geminiResult = await this.transcribeGemini(audioBuffer, mimeType, requestedLang);
        if (geminiResult && geminiResult.trim().length > 0) {
          console.log(`🎙️ [STT] Successfully transcribed via Google Gemini [Lang: ${requestedLang}] in ${Date.now() - startTime}ms`);
          return {
            text: geminiResult.trim(),
            provider: 'gemini',
            lang: requestedLang,
            durationMs: Date.now() - startTime
          };
        }
      } catch (geminiErr: any) {
        console.warn('⚠️ Gemini Audio STT error:', geminiErr.response?.data?.error?.message || geminiErr.message);
      }
    }

    throw new Error('All speech-to-text providers failed or no API keys configured for audio transcription fallback.');
  }

  // --- Tier 1: Sarvam AI Saaras v3 ---
  private async transcribeSarvam(audioBuffer: Buffer, mimeType: string, langCode: string): Promise<string> {
    const form = new FormData();
    const ext = mimeType.includes('wav') ? 'wav' : mimeType.includes('mp4') ? 'mp4' : 'webm';
    form.append('file', audioBuffer, {
      filename: `audio.${ext}`,
      contentType: mimeType
    });

    const sarvamLang = langCode === 'kn' ? 'kn-IN' : langCode === 'hi' ? 'hi-IN' : 'en-IN';
    form.append('model', 'saaras:v3');
    form.append('language_code', sarvamLang);

    const response = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
      headers: {
        ...form.getHeaders(),
        'api-subscription-key': config.sarvamApiKey
      },
      timeout: 10000
    });

    return response.data?.transcript || response.data?.text || '';
  }

  // --- Tier 2: Groq Whisper ---
  private async transcribeGroq(audioBuffer: Buffer, mimeType: string, langCode: string): Promise<string> {
    const form = new FormData();
    const ext = mimeType.includes('wav') ? 'wav' : 'webm';
    form.append('file', audioBuffer, {
      filename: `audio.${ext}`,
      contentType: mimeType
    });
    form.append('model', 'whisper-large-v3');
    if (langCode && langCode !== 'auto') {
      form.append('language', langCode);
    }
    form.append('response_format', 'json');

    const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${config.groqApiKey}`
      },
      timeout: 10000
    });

    return response.data?.text || '';
  }

  // --- Tier 3: Google Gemini Multimodal ---
  private async transcribeGemini(audioBuffer: Buffer, mimeType: string, lang: string): Promise<string> {
    const base64Audio = audioBuffer.toString('base64');
    const langInstruction =
      lang.startsWith('kn')
        ? 'The user is speaking in Kannada (ಕನ್ನಡ) or Indian English, mentioning product names (like boAt, Samsung, Sony, Apple) and rupee budgets.'
        : lang.startsWith('hi')
        ? 'The user is speaking in Hindi (हिन्दी) or Indian English, mentioning Indian products and rupee budgets.'
        : 'The user is speaking in English, Hindi, or Kannada.';

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are an accurate audio transcription engine for VoiceCart, a multilingual voice shopping app in India.
${langInstruction}
Listen carefully to the audio and transcribe what the user said with 100% fidelity.
Keep English brand and tech product names (boAt, Realme, OnePlus, Redmi, Sony, earbuds, smart watch) in readable English/Latin script when mentioned.
Output ONLY the raw transcription without any quotes, markdown formatting, or timestamps.`
              },
              {
                inline_data: {
                  mime_type: mimeType.split(';')[0],
                  data: base64Audio
                }
              }
            ]
          }
        ]
      },
      { timeout: 12000 }
    );

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }

  private normalizeLangCode(lang: string): string {
    if (!lang) return 'en';
    const lower = lang.toLowerCase();
    if (lower.startsWith('kn')) return 'kn';
    if (lower.startsWith('hi')) return 'hi';
    if (lower.startsWith('ta')) return 'ta';
    if (lower.startsWith('te')) return 'te';
    return 'en';
  }
}

export const transcriptionService = new TranscriptionService();
