import { transcriptionService } from '../src/voice/transcriptionService';
import { config } from '../src/config';

describe('Voice Transcription Service Provider Cascade Tests', () => {
  test('should report enabled speech provider status without leaking secrets', () => {
    expect(config.speechProviders).toBeDefined();
    expect(typeof config.speechProviders.webSpeech).toBe('boolean');
    expect(typeof config.speechProviders.sarvam).toBe('boolean');
    expect(typeof config.speechProviders.groq).toBe('boolean');
    expect(typeof config.speechProviders.gemini).toBe('boolean');
  });

  test('should normalize language codes accurately for Indian languages', () => {
    const normalize = (transcriptionService as any).normalizeLangCode.bind(transcriptionService);
    expect(normalize('kn-IN')).toBe('kn');
    expect(normalize('kn')).toBe('kn');
    expect(normalize('hi-IN')).toBe('hi');
    expect(normalize('hi')).toBe('hi');
    expect(normalize('en-IN')).toBe('en');
    expect(normalize('en-US')).toBe('en');
    expect(normalize('')).toBe('en');
  });
});
