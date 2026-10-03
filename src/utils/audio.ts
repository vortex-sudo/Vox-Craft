// Utility for handling base64 audio and Web Audio API visualization

export function base64ToBlob(base64: string, mimeType = 'audio/wav'): Blob {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export function downloadAudioBlob(blob: Blob, filename = 'voxcraft-speech.wav') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Browser Web Speech API fallback player
export class BrowserSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public speak(
    text: string,
    options: {
      voice?: SpeechSynthesisVoice | null;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ) {
    if (!this.synth) {
      options.onError?.(new Error('Web Speech API is not supported in this browser.'));
      return;
    }

    this.cancel();

    // Clean any Gemini tags like <laugh>, |yeah| for browser synth
    const cleanText = text
      .replace(/<[^>]+>/g, '')
      .replace(/\|[^|]+\|/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (options.voice) {
      utterance.voice = options.voice;
    }
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    utterance.onstart = () => options.onStart?.();
    utterance.onend = () => options.onEnd?.();
    utterance.onerror = (e) => options.onError?.(e);

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    this.synth?.pause();
  }

  public resume() {
    this.synth?.resume();
  }

  public cancel() {
    this.synth?.cancel();
    this.currentUtterance = null;
  }
}
