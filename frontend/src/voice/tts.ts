/**
 * VoiceCart Multilingual Text-To-Speech (TTS) Service
 * Works across Chrome, Edge, Safari, and Firefox with Indian accent & vernacular fallback.
 */

type SpeakingChangeListener = (isSpeaking: boolean, text: string) => void;

class TTSService {
  private isSpeakingState: boolean = false;
  private currentText: string = '';
  private listeners: Set<SpeakingChangeListener> = new Set();
  private voices: SpeechSynthesisVoice[] = [];
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.voices = window.speechSynthesis.getVoices() || [];
      }
    } catch {}
  }

  public subscribe(listener: SpeakingChangeListener): () => void {
    this.listeners.add(listener);
    // Notify immediately of current state
    listener(this.isSpeakingState, this.currentText);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.isSpeakingState = false;
    this.currentText = '';
    this.activeUtterance = null;
    this.notify();
  }

  public speak(
    text: string,
    lang: 'en' | 'hi' | 'kn' | 'auto' = 'en',
    onEnd?: () => void
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      // 1. Cancel previous speech cleanly
      window.speechSynthesis.cancel();

      // 2. Pre-clean text to sound natural:
      // Strip markdown asterisks, hashtags, urls, and pronounce currency
      let cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/[*#_~`]/g, '')
        .replace(/₹\s*(\d[\d,]*)/g, 'rupees $1')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        if (onEnd) onEnd();
        return;
      }

      if (this.voices.length === 0) {
        this.loadVoices();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Select voice:
      const targetLang = lang === 'kn' ? 'kn' : lang === 'hi' ? 'hi' : 'en';
      let selectedVoice = this.voices.find((v) => {
        const vl = v.lang.toLowerCase();
        const vn = v.name.toLowerCase();
        if (targetLang === 'kn') return vl.startsWith('kn') || vn.includes('kannada');
        if (targetLang === 'hi') return vl.startsWith('hi') || vn.includes('hindi');
        return vl.startsWith('en-in') || vl.startsWith('en_in');
      });

      // Fallback voice if specific accent not found
      if (!selectedVoice && targetLang === 'en') {
        selectedVoice = this.voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.lang = targetLang === 'kn' ? 'kn-IN' : targetLang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.isSpeakingState = true;
        this.currentText = cleanText;
        this.notify();
      };

      utterance.onend = () => {
        this.isSpeakingState = false;
        this.currentText = '';
        this.activeUtterance = null;
        this.notify();
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('TTS playback error:', e);
        this.isSpeakingState = false;
        this.currentText = '';
        this.activeUtterance = null;
        this.notify();
        if (onEnd) onEnd();
      };

      this.activeUtterance = utterance;

      // Chrome garbage-collection bug workaround: attach utterance to window
      (window as any).__voicecart_active_utterance = utterance;

      // Ensure speech synthesis is not paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error in TTSService:', err);
      this.isSpeakingState = false;
      this.currentText = '';
      this.notify();
      if (onEnd) onEnd();
    }
  }

  private notify() {
    this.listeners.forEach((l) => l(this.isSpeakingState, this.currentText));
  }
}

export const ttsService = new TTSService();
