export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  tone: string;
  accent: string;
  avatar: string;
  tags: string[];
  description: string;
  previewSample: string;
  isCloned?: boolean;
  baseVoice?: string;
  voiceDesignPrompt?: string;
  acousticTraits?: {
    timbre?: string;
    cadence?: string;
    accent?: string;
    emotionalBaseline?: string;
  };
  createdAt?: number;
}

export interface GeneratedClip {
  id: string;
  text: string;
  audioData: string; // base64 or blob URL
  mimeType: string;
  voice: string;
  style: string;
  model: string;
  createdAt: number;
  duration?: number;
}

export interface StylePreset {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  category: string;
}
