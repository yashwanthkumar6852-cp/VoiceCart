import { config } from '../config';

export class VoiceService {
  /**
   * Generates speech synthesis settings and voice metadata for frontend Web Speech / TTS API.
   * Languages supported: English ('en'), Hindi ('hi'), Kannada ('kn').
   */
  public getVoiceConfig(language: 'en' | 'hi' | 'kn') {
    switch (language) {
      case 'kn':
        return {
          lang: 'kn-IN',
          pitch: 1.0,
          rate: 0.95,
          voiceName: 'Google ಕನ್ನಡ'
        };
      case 'hi':
        return {
          lang: 'hi-IN',
          pitch: 1.0,
          rate: 0.95,
          voiceName: 'Google हिन्दी'
        };
      case 'en':
      default:
        return {
          lang: 'en-IN',
          pitch: 1.0,
          rate: 1.0,
          voiceName: 'Google English (India)'
        };
    }
  }
}

export const voiceService = new VoiceService();
