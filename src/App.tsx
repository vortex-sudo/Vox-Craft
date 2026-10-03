/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VoiceSelector } from './components/VoiceSelector';
import { StyleMatrix } from './components/StyleMatrix';
import { AudioPlayer } from './components/AudioPlayer';
import { ScriptAssistantModal } from './components/ScriptAssistantModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { VoiceCloneModal } from './components/VoiceCloneModal';
import { GEMINI_VOICES, STYLE_PRESETS, VOCAL_TAGS, SAMPLE_SCRIPTS } from './data/voices';
import { VoiceProfile, GeneratedClip, StylePreset } from './types';
import { base64ToBlob, BrowserSpeechEngine } from './utils/audio';
import {
  Mic,
  Sparkles,
  Volume2,
  Trash2,
  BookOpen,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CornerDownLeft,
  Fingerprint,
} from 'lucide-react';

export default function App() {
  // Primary editor state
  const [text, setText] = useState<string>(SAMPLE_SCRIPTS[0].text);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('Kore');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('podcast-host');
  const [customStyle, setCustomStyle] = useState<string>(
    'Energetic, warm, conversational, authentic podcast host with natural pauses'
  );
  const [selectedModel, setSelectedModel] = useState<
    'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts' | 'browser-speech'
  >('gemini-3.8-flash-lite-tts');
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  // Cloned voices catalog
  const [clonedVoices, setClonedVoices] = useState<VoiceProfile[]>(() => {
    try {
      const saved = localStorage.getItem('voxcraft_cloned_voices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Audio output state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentVoiceName, setCurrentVoiceName] = useState<string>('Kore');
  const [currentStyleName, setCurrentStyleName] = useState<string>('Podcast Host');
  const [currentModelName, setCurrentModelName] = useState<string>('gemini-3.8-flash-lite-tts');

  // History state
  const [history, setHistory] = useState<GeneratedClip[]>(() => {
    try {
      const saved = localStorage.getItem('voxcraft_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI state
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState<boolean>(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const browserSpeechRef = useRef<BrowserSpeechEngine>(new BrowserSpeechEngine());
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voxcraft_history', JSON.stringify(history.slice(0, 30)));
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }
  }, [history]);

  // Save cloned voices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voxcraft_cloned_voices', JSON.stringify(clonedVoices));
    } catch (e) {
      console.warn('Could not save cloned voices to localStorage', e);
    }
  }, [clonedVoices]);

  // Check backend status
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasGeminiKey !== undefined) {
          setHasGeminiKey(data.hasGeminiKey);
        }
      })
      .catch((err) => {
        console.warn('Backend status check failed:', err);
      });
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Insert vocal burst or nuance tag at cursor position
  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const newVal = currentVal.substring(0, start) + tag + ' ' + currentVal.substring(end);
    setText(newVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 1, start + tag.length + 1);
    }, 0);
  };

  // Select a preset delivery style
  const handleSelectPreset = (preset: StylePreset) => {
    setSelectedPresetId(preset.id);
    setCustomStyle(preset.prompt);
  };

  // Preview voice sample (cloned or prebuilt)
  const handlePreviewVoice = (voice: VoiceProfile) => {
    setPreviewingVoiceId(voice.id);

    // If cloned voice has a direct synthesized preview sample
    const voiceAny = voice as any;
    if (voiceAny.previewAudioData) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(`data:audio/wav;base64,${voiceAny.previewAudioData}`);
      previewAudioRef.current = audio;
      audio.onended = () => setPreviewingVoiceId(null);
      audio.onerror = () => setPreviewingVoiceId(null);
      audio.play().catch(() => setPreviewingVoiceId(null));
      return;
    }

    // Otherwise speak sample via browser synth
    browserSpeechRef.current.speak(voice.previewSample, {
      rate: 1.0,
      pitch: voice.gender === 'Female' ? 1.1 : 0.95,
      onEnd: () => setPreviewingVoiceId(null),
      onError: () => setPreviewingVoiceId(null),
    });
  };

  // Synthesize via Browser Web Speech
  const speakWithBrowser = (textToSpeak: string) => {
    setIsGenerating(true);
    const allVoices = [...clonedVoices, ...GEMINI_VOICES];
    const activeVoice = allVoices.find((v) => v.id === selectedVoiceId) || GEMINI_VOICES[0];

    browserSpeechRef.current.speak(textToSpeak, {
      rate: speechRate,
      pitch: activeVoice.gender === 'Female' ? 1.15 : 0.9,
      onStart: () => {
        setIsGenerating(false);
        showToast('Speaking aloud with Browser Speech Engine', 'info');
      },
      onEnd: () => {
        setIsGenerating(false);
      },
      onError: (err) => {
        setIsGenerating(false);
        showToast('Browser speech synthesis error: ' + (err?.message || 'Playback failed'), 'error');
      },
    });
  };

  // Main Speech Generation
  const handleGenerateSpeech = async () => {
    if (!text.trim()) {
      showToast('Please type some text to speak aloud.', 'error');
      return;
    }

    // Stop any ongoing audio
    browserSpeechRef.current.cancel();
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    // If browser speech engine explicitly selected:
    if (selectedModel === 'browser-speech') {
      speakWithBrowser(text);
      return;
    }

    setIsGenerating(true);

    try {
      const allVoices = [...clonedVoices, ...GEMINI_VOICES];
      const activeVoice = allVoices.find((v) => v.id === selectedVoiceId) || GEMINI_VOICES[0];

      // For cloned voices, use the base anchor voice and pass the voiceDesignPrompt
      const voiceAnchor = activeVoice.baseVoice || activeVoice.id;
      const voiceDesignPrompt = activeVoice.voiceDesignPrompt || undefined;

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voiceName: voiceAnchor,
          style: customStyle.trim(),
          voiceDesignPrompt,
          model: activeVoice.isCloned ? 'gemini-3.8-flash-tts' : selectedModel,
          speakingRate: speechRate,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to synthesize audio');
      }

      // Create audio blob from base64
      const blob = base64ToBlob(data.audioData, data.mimeType || 'audio/wav');
      const blobUrl = URL.createObjectURL(blob);

      // Clean up previous blob URL
      if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentAudioUrl);
      }

      setCurrentAudioBlob(blob);
      setCurrentAudioUrl(blobUrl);
      setCurrentVoiceName(activeVoice.name);
      setCurrentStyleName(
        activeVoice.isCloned
          ? `Cloned (${activeVoice.tone})`
          : STYLE_PRESETS.find((p) => p.id === selectedPresetId)?.label || 'Custom'
      );
      setCurrentModelName(data.model);

      // Add to session history
      const newClip: GeneratedClip = {
        id: 'clip-' + Date.now(),
        text: text.trim(),
        audioData: data.audioData,
        mimeType: data.mimeType || 'audio/wav',
        voice: activeVoice.name,
        style: activeVoice.isCloned
          ? `Cloned (${activeVoice.tone})`
          : customStyle.trim(),
        model: data.model,
        createdAt: Date.now(),
      };
      setHistory((prev) => [newClip, ...prev]);

      showToast(
        activeVoice.isCloned
          ? `Synthesized speech using authentic cloned voice "${activeVoice.name}"!`
          : 'Audio synthesized successfully! Playing out loud...',
        'success'
      );
    } catch (err: any) {
      console.warn('Gemini TTS generation error, falling back to local speech:', err);
      showToast(
        `Gemini engine note: ${err.message}. Speaking immediately using high-quality local synthesis.`,
        'info'
      );
      speakWithBrowser(text);
    } finally {
      setIsGenerating(false);
    }
  };

  // Add cloned voice to state and auto-select
  const handleSaveClonedVoice = (newVoice: VoiceProfile) => {
    setClonedVoices((prev) => [newVoice, ...prev]);
    setSelectedVoiceId(newVoice.id);
    setSelectedModel('gemini-3.8-flash-tts'); // Cloned voices run on flagship Voice Design
    showToast(`Voice "${newVoice.name}" cloned & activated in studio!`, 'success');
  };

  // Delete cloned voice
  const handleDeleteClonedVoice = (voiceId: string) => {
    setClonedVoices((prev) => prev.filter((v) => v.id !== voiceId));
    if (selectedVoiceId === voiceId) {
      setSelectedVoiceId('Kore');
    }
    showToast('Cloned voice removed.', 'info');
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerateSpeech();
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(1, Math.round((wordCount / (140 * speechRate)) * 60));

  const allVoices = [...clonedVoices, ...GEMINI_VOICES];
  const activeVoice = allVoices.find((v) => v.id === selectedVoiceId) || GEMINI_VOICES[0];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`p-3.5 rounded-xl border shadow-2xl flex items-start gap-3 backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-neutral-900/90 border-amber-500/40 text-amber-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <p className="text-xs leading-relaxed">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        hasGeminiKey={hasGeminiKey}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenScriptAssistant={() => setIsScriptModalOpen(true)}
        onOpenCloneModal={() => setIsCloneModalOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Active Voice Persona Hero Status Banner */}
        {activeVoice.isCloned && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold shadow-md">
                <Fingerprint className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-100">
                    Active Cloned Voice: {activeVoice.name}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950">
                    Authentic Voice Active
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  {activeVoice.tone} • Base Neural Anchor: {activeVoice.baseVoice}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCloneModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
            >
              + Clone Another
            </button>
          </div>
        )}

        {/* Quick Presets Strip */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-neutral-200">Sample Voiceover Prompts:</span>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {SAMPLE_SCRIPTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setText(sample.text);
                  setSelectedVoiceId(sample.recommendedVoice);
                  setCustomStyle(sample.recommendedStyle);
                  showToast(`Loaded "${sample.title}" sample script`, 'info');
                }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800/80 text-xs font-medium transition-all group"
              >
                <span className="text-[10px] text-amber-400/80 font-mono">
                  [{sample.category}]
                </span>
                <span>{sample.title}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Text Input Studio Box */}
        <section className="bg-neutral-900/50 border border-neutral-800/90 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 backdrop-blur-sm relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Mic className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-neutral-100">
                Text Studio & Performance Director
              </h2>
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{text.length} chars</span>
              <span>•</span>
              <span className="text-amber-400 font-medium">~{estimatedSeconds}s audio</span>
              {text.length > 0 && (
                <button
                  type="button"
                  title="Clear text"
                  onClick={() => setText('')}
                  className="p-1 hover:text-rose-400 transition-colors ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Vocal Burst & Nuance Quick Insert Bar */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2 sm:px-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Authenticity Nuances:
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {VOCAL_TAGS.map((vt) => (
                  <button
                    key={vt.tag}
                    type="button"
                    title={`${vt.desc} — click to insert at cursor`}
                    onClick={() => handleInsertTag(vt.tag)}
                    className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 text-neutral-300 border border-neutral-800 hover:border-amber-400 text-xs font-mono transition-all group"
                  >
                    <span>{vt.tag}</span>
                    <span className="ml-1 text-[10px] text-neutral-500 group-hover:text-neutral-900">
                      ({vt.label})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-neutral-500 hidden lg:inline">
              Tags add human realism (chuckle, breath, agreement) in Flash TTS
            </span>
          </div>

          {/* Main Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type or paste text to be converted to speech... Use commas and ellipses for natural breath pauses."
              rows={5}
              className="w-full bg-neutral-950/90 border border-neutral-800/80 rounded-xl p-4 text-sm sm:text-base text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 leading-relaxed font-normal resize-y min-h-[140px] transition-all"
            />
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-neutral-500 flex items-center gap-1.5">
              <span className="hidden sm:inline">Press</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-900 border border-neutral-800 rounded text-neutral-400">
                Cmd / Ctrl + Enter
              </kbd>
              <span className="hidden sm:inline">to synthesize & speak</span>
            </div>

            <button
              type="button"
              onClick={handleGenerateSpeech}
              disabled={isGenerating || !text.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm tracking-wide shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                  <span>Synthesizing Voice...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {activeVoice.isCloned ? `Speak with Cloned ${activeVoice.name}` : 'Generate & Speak'}
                  </span>
                  <CornerDownLeft className="w-3.5 h-3.5 opacity-70" />
                </>
              )}
            </button>
          </div>
        </section>

        {/* Audio Player Showcase */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              Audio Output & Real-time Acoustic Waveform
            </h3>
          </div>
          <AudioPlayer
            audioBlob={currentAudioBlob}
            audioUrl={currentAudioUrl}
            voiceName={currentVoiceName}
            styleName={currentStyleName}
            modelName={currentModelName}
          />
        </section>

        {/* Voice Persona Selection */}
        <section className="pt-2">
          <VoiceSelector
            voices={GEMINI_VOICES}
            clonedVoices={clonedVoices}
            selectedVoiceId={selectedVoiceId}
            onSelectVoice={(id) => {
              setSelectedVoiceId(id);
              const all = [...clonedVoices, ...GEMINI_VOICES];
              const v = all.find((item) => item.id === id);
              if (v) showToast(`Selected voice: ${v.name} (${v.tone})`, 'info');
            }}
            onPreviewSample={handlePreviewVoice}
            onOpenCloneModal={() => setIsCloneModalOpen(true)}
            onDeleteClonedVoice={handleDeleteClonedVoice}
            previewingVoiceId={previewingVoiceId}
          />
        </section>

        {/* Style Matrix & Engine Settings */}
        <section className="pt-2">
          <StyleMatrix
            presets={STYLE_PRESETS}
            selectedPresetId={selectedPresetId}
            onSelectPreset={handleSelectPreset}
            customStyle={customStyle}
            onChangeCustomStyle={setCustomStyle}
            selectedModel={selectedModel}
            onChangeModel={setSelectedModel}
            speechRate={speechRate}
            onChangeSpeechRate={setSpeechRate}
          />
        </section>
      </main>

      {/* History Drawer Modal */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        clips={history}
        onSelectClip={(clip) => {
          setText(clip.text);
          setSelectedVoiceId(clip.voice);
          setCustomStyle(clip.style);
          const blob = base64ToBlob(clip.audioData, clip.mimeType);
          const url = URL.createObjectURL(blob);
          setCurrentAudioBlob(blob);
          setCurrentAudioUrl(url);
          setCurrentVoiceName(clip.voice);
          setCurrentStyleName(clip.style);
          setCurrentModelName(clip.model);
          showToast(`Loaded clip into editor`, 'info');
        }}
        onDeleteClip={(id) => {
          setHistory((prev) => prev.filter((c) => c.id !== id));
        }}
        onClearAll={() => {
          setHistory([]);
          localStorage.removeItem('voxcraft_history');
        }}
      />

      {/* Voice Cloning Modal */}
      <VoiceCloneModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onSaveClonedVoice={handleSaveClonedVoice}
      />

      {/* AI Script Assistant Modal */}
      <ScriptAssistantModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        onInsertScript={(newScript) => {
          setText(newScript);
          showToast('Script inserted into Text Studio!', 'success');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <p>
          VoxCraft AI Studio • Powered by Google Gemini 3.8 Neural Speech Synthesis & Voice Design
        </p>
      </footer>
    </div>
  );
}
