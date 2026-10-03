import React, { useState } from 'react';
import { Sparkles, X, Wand2, Loader2, Check } from 'lucide-react';

interface ScriptAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertScript: (script: string) => void;
}

export const ScriptAssistantModal: React.FC<ScriptAssistantModalProps> = ({
  isOpen,
  onClose,
  onInsertScript,
}) => {
  const [topic, setTopic] = useState('');
  const [genre, setGenre] = useState('Podcast intro');
  const [tone, setTone] = useState('Engaging and curious');
  const [duration, setDuration] = useState(25);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim() || 'Exciting breakthrough in technology',
          genre,
          tone,
          targetDurationSeconds: duration,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate script.');
      }

      setGeneratedScript(data.script);
    } catch (err: any) {
      setError(err.message || 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseScript = () => {
    if (generatedScript) {
      onInsertScript(generatedScript);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                AI Voiceover Scriptwriter
              </h3>
              <p className="text-xs text-neutral-400">
                Craft spoken-word scripts optimized for neural speech synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Topic */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              What should the voiceover talk about?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. A teaser for a deep space sci-fi documentary, or coffee brand ad"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          {/* Format & Tone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Format
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="Podcast intro">Podcast intro</option>
                <option value="Audiobook narration">Audiobook narration</option>
                <option value="Guided meditation">Guided meditation</option>
                <option value="Commercial ad">Commercial ad</option>
                <option value="Movie trailer">Movie trailer</option>
                <option value="Product explainer">Product explainer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="Engaging and curious">Engaging & curious</option>
                <option value="Warm and peaceful">Warm & peaceful</option>
                <option value="Dramatic and intense">Dramatic & intense</option>
                <option value="Professional and informative">Professional & crisp</option>
                <option value="Humorous and energetic">Humorous & upbeat</option>
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-400 font-medium">Approximate Spoken Length:</span>
              <span className="text-amber-400 font-semibold">{duration} seconds</span>
            </div>
            <div className="flex gap-2">
              {[15, 25, 45, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    duration === d
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  ~{d}s
                </button>
              ))}
            </div>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-semibold text-xs transition-all shadow-md disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Writing Voiceover Script with Gemini...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate Script</span>
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Generated Result preview */}
          {generatedScript && (
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium">Generated Voiceover:</span>
                <span className="text-[11px] text-neutral-500 font-mono">
                  {generatedScript.split(/\s+/).length} words
                </span>
              </div>
              <textarea
                value={generatedScript}
                onChange={(e) => setGeneratedScript(e.target.value)}
                rows={4}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 leading-relaxed focus:outline-none focus:border-amber-500/60"
              />
              <button
                type="button"
                onClick={handleUseScript}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Insert into Studio Editor</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
