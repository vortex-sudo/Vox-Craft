import React from 'react';
import { Waves, Sparkles, Clock, Volume2, ShieldCheck, Fingerprint } from 'lucide-react';

interface HeaderProps {
  hasGeminiKey: boolean;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenScriptAssistant: () => void;
  onOpenCloneModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasGeminiKey,
  historyCount,
  onOpenHistory,
  onOpenScriptAssistant,
  onOpenCloneModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-neutral-950">
            <Waves className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-neutral-100 tracking-tight">
                VoxCraft <span className="text-amber-400 font-mono text-sm">AI</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Gemini 3.8 TTS
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Neural Text-to-Speech Studio & Voice Director
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice Cloning trigger */}
          <button
            type="button"
            onClick={onOpenCloneModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm group"
          >
            <Fingerprint className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Clone Voice</span>
          </button>

          {/* AI Script Assistant trigger */}
          <button
            type="button"
            onClick={onOpenScriptAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 text-xs font-medium transition-all shadow-sm group"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Write Script</span>
          </button>

          {/* History drawer trigger */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 text-xs font-medium transition-all shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Library</span>
            {historyCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-neutral-950 font-bold text-[10px] flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </button>

          {/* Engine Status pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                hasGeminiKey ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-neutral-300 font-medium hidden md:inline">
              {hasGeminiKey ? 'Neural Engine Active' : 'Fallback Synthesis Ready'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
