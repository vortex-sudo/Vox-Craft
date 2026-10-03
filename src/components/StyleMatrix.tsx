import React from 'react';
import { StylePreset } from '../types';
import { Radio, Mic, Moon, Flame, Sparkles, Cpu, Smile, Compass, Sliders, Wand2 } from 'lucide-react';

interface StyleMatrixProps {
  presets: StylePreset[];
  selectedPresetId: string;
  onSelectPreset: (preset: StylePreset) => void;
  customStyle: string;
  onChangeCustomStyle: (val: string) => void;
  selectedModel: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts' | 'browser-speech';
  onChangeModel: (model: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts' | 'browser-speech') => void;
  speechRate: number;
  onChangeSpeechRate: (rate: number) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Radio: <Radio className="w-3.5 h-3.5" />,
  Mic: <Mic className="w-3.5 h-3.5" />,
  Moon: <Moon className="w-3.5 h-3.5" />,
  Flame: <Flame className="w-3.5 h-3.5" />,
  Sparkles: <Sparkles className="w-3.5 h-3.5" />,
  Cpu: <Cpu className="w-3.5 h-3.5" />,
  Smile: <Smile className="w-3.5 h-3.5" />,
  Compass: <Compass className="w-3.5 h-3.5" />,
};

export const StyleMatrix: React.FC<StyleMatrixProps> = ({
  presets,
  selectedPresetId,
  onSelectPreset,
  customStyle,
  onChangeCustomStyle,
  selectedModel,
  onChangeModel,
  speechRate,
  onChangeSpeechRate,
}) => {
  return (
    <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-4 backdrop-blur-sm">
      {/* Title & Model Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">
              Vocal Delivery & Style Direction
            </h3>
            <p className="text-xs text-neutral-400">
              Control emotional tone, pacing, and synthesis engine
            </p>
          </div>
        </div>

        {/* Engine switcher */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => onChangeModel('gemini-3.8-flash-lite-tts')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
              selectedModel === 'gemini-3.8-flash-lite-tts'
                ? 'bg-amber-500 text-neutral-950 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Flash-Lite (Fast)
          </button>
          <button
            type="button"
            onClick={() => onChangeModel('gemini-3.8-flash-tts')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1 ${
              selectedModel === 'gemini-3.8-flash-tts'
                ? 'bg-amber-500 text-neutral-950 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Flash (Expressive)</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-900 text-amber-300 border border-amber-400/30">
              PRO
            </span>
          </button>
          <button
            type="button"
            onClick={() => onChangeModel('browser-speech')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
              selectedModel === 'browser-speech'
                ? 'bg-amber-500 text-neutral-950 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Web Speech (Local)
          </button>
        </div>
      </div>

      {/* Preset pills */}
      <div>
        <label className="block text-xs font-medium text-neutral-300 mb-2">
          Delivery Style Presets
        </label>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                <span className={isSelected ? 'text-amber-400' : 'text-neutral-500'}>
                  {ICON_MAP[preset.icon] || <Sparkles className="w-3.5 h-3.5" />}
                </span>
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Style Prompt Directive */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
            <Sliders className="w-3 h-3 text-amber-400" />
            Style Directive / Speech Metadata
          </label>
          <span className="text-[10px] text-neutral-500">
            Guide emotional nuances, cadence & persona
          </span>
        </div>
        <input
          type="text"
          value={customStyle}
          onChange={(e) => onChangeCustomStyle(e.target.value)}
          placeholder="e.g. Warm, soothing, conversational with thoughtful pauses and gentle inflection"
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
        />
      </div>

      {/* Speech speed tuning */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-400">Speaking Pace:</span>
          <span className="text-xs font-semibold text-amber-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
            {speechRate.toFixed(2)}x
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <span className="text-[10px] text-neutral-500">0.75x</span>
          <input
            type="range"
            min="0.75"
            max="1.5"
            step="0.05"
            value={speechRate}
            onChange={(e) => onChangeSpeechRate(parseFloat(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-neutral-500">1.5x</span>
        </div>
      </div>
    </div>
  );
};
