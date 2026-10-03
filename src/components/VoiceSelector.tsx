import React, { useState } from 'react';
import { VoiceProfile } from '../types';
import { Volume2, Check, Sparkles, User, Fingerprint, Plus, Trash2 } from 'lucide-react';

interface VoiceSelectorProps {
  voices: VoiceProfile[];
  clonedVoices: VoiceProfile[];
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  onPreviewSample: (voice: VoiceProfile) => void;
  onOpenCloneModal: () => void;
  onDeleteClonedVoice?: (voiceId: string) => void;
  previewingVoiceId: string | null;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  clonedVoices,
  selectedVoiceId,
  onSelectVoice,
  onPreviewSample,
  onOpenCloneModal,
  onDeleteClonedVoice,
  previewingVoiceId,
}) => {
  const [filter, setFilter] = useState<'All' | 'Cloned' | 'Female' | 'Male'>('All');

  const combinedVoices = [...clonedVoices, ...voices];

  const filteredVoices = combinedVoices.filter((v) => {
    if (filter === 'All') return true;
    if (filter === 'Cloned') return v.isCloned;
    return v.gender === filter;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              Voice Persona & Cloning Studio
              {clonedVoices.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {clonedVoices.length} Cloned
                </span>
              )}
            </h2>
            <p className="text-xs text-neutral-400">
              Select standard neural voices or clone authentic voices with biometric DNA
            </p>
          </div>
        </div>

        {/* Action button & filter tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCloneModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Clone Voice</span>
          </button>

          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs font-medium">
            {(['All', 'Cloned', 'Female', 'Male'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`px-3 py-1 rounded-md transition-all ${
                  filter === option
                    ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {option === 'Cloned' ? `Cloned (${clonedVoices.length})` : option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Quick Clone CTA Card */}
        <div
          onClick={onOpenCloneModal}
          className="border-2 border-dashed border-neutral-800 hover:border-amber-500/50 bg-neutral-950/40 hover:bg-neutral-900/60 rounded-xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group min-h-[140px]"
        >
          <div className="p-3 rounded-full bg-neutral-900 text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/10 border border-neutral-800 group-hover:border-amber-500/40 transition-all">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-200 block group-hover:text-amber-300 transition-colors">
              + Clone or Design Voice
            </span>
            <span className="text-[11px] text-neutral-400">
              Record mic, upload audio, or prompt persona
            </span>
          </div>
        </div>

        {filteredVoices.map((voice) => {
          const isSelected = selectedVoiceId === voice.id;
          const isPreviewing = previewingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              className={`group relative text-left rounded-xl p-3.5 transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-neutral-900/90 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.12)] ring-1 ring-amber-500/30'
                  : 'bg-neutral-900/40 border-neutral-800/80 hover:bg-neutral-900/80 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar with status indicator */}
                <div className="relative shrink-0">
                  <img
                    src={voice.avatar}
                    alt={voice.name}
                    className="w-11 h-11 rounded-lg object-cover border border-neutral-700/80 shadow-md group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 text-neutral-950 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  {voice.isCloned && (
                    <div className="absolute -top-1 -left-1 w-4 h-4 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full flex items-center justify-center shadow-sm">
                      <Fingerprint className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-sm text-neutral-100 flex items-center gap-1.5 truncate">
                      {voice.name}
                      {voice.isCloned ? (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          CLONED
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/50">
                          {voice.gender === 'Female' ? 'F' : 'M'}
                        </span>
                      )}
                    </span>

                    {/* Preview audio & delete buttons */}
                    <div className="flex items-center gap-1">
                      {voice.isCloned && onDeleteClonedVoice && (
                        <button
                          type="button"
                          title="Delete cloned voice"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClonedVoice(voice.id);
                          }}
                          className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Preview sample"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewSample(voice);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isPreviewing
                            ? 'bg-amber-500 text-neutral-950 border-amber-400 animate-pulse'
                            : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:bg-neutral-700 hover:text-white'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-amber-400/90 font-medium truncate mb-1">
                    {voice.tone}
                  </p>

                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                    {voice.description}
                  </p>
                </div>
              </div>

              {/* Tags & traits */}
              <div className="mt-2.5 pt-2 border-t border-neutral-800/60 flex flex-wrap gap-1">
                {voice.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-950/60 text-neutral-400 border border-neutral-800/80"
                  >
                    #{tag}
                  </span>
                ))}
                {voice.baseVoice && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 text-amber-400/80 border border-neutral-800 font-mono ml-auto">
                    Base: {voice.baseVoice}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
