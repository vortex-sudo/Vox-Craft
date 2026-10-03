import React, { useState } from 'react';
import { GeneratedClip } from '../types';
import { Play, Pause, Download, Trash2, X, Clock, FileAudio, ArrowUpRight } from 'lucide-react';
import { base64ToBlob, downloadAudioBlob } from '../utils/audio';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clips: GeneratedClip[];
  onSelectClip: (clip: GeneratedClip) => void;
  onDeleteClip: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  clips,
  onSelectClip,
  onDeleteClip,
  onClearAll,
}) => {
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handlePlayClip = (clip: GeneratedClip) => {
    if (playingClipId === clip.id && audioElement) {
      audioElement.pause();
      setPlayingClipId(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audio = new Audio(`data:${clip.mimeType};base64,${clip.audioData}`);
    audio.onended = () => setPlayingClipId(null);
    audio.play().then(() => {
      setAudioElement(audio);
      setPlayingClipId(clip.id);
    });
  };

  const handleDownload = (clip: GeneratedClip) => {
    const blob = base64ToBlob(clip.audioData, clip.mimeType);
    downloadAudioBlob(blob, `voxcraft-${clip.voice.toLowerCase()}-${clip.createdAt}.wav`);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border-l border-neutral-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                Generated Audio Clips
              </h3>
              <p className="text-xs text-neutral-400">
                {clips.length} session recording{clips.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {clips.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-[11px] text-neutral-500 hover:text-rose-400 px-2 py-1 rounded transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => {
                if (audioElement) audioElement.pause();
                onClose();
              }}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clip list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {clips.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500 space-y-2">
              <FileAudio className="w-10 h-10 stroke-1 text-neutral-600" />
              <p className="text-sm font-medium text-neutral-400">No clips yet</p>
              <p className="text-xs text-neutral-500 max-w-xs">
                Your synthesized audio clips will be saved here automatically for replay and download.
              </p>
            </div>
          ) : (
            clips.map((clip) => {
              const isPlaying = playingClipId === clip.id;
              const dateStr = new Date(clip.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={clip.id}
                  className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 hover:border-neutral-700 transition-all space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlayClip(clip)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isPlaying
                            ? 'bg-amber-500 text-neutral-950 shadow-md animate-pulse'
                            : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white'
                        }`}
                      >
                        {isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-neutral-200">
                            {clip.voice}
                          </span>
                          <span className="text-[10px] text-neutral-500">•</span>
                          <span className="text-[10px] text-neutral-400 truncate max-w-[120px]">
                            {clip.style || 'Default'}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {dateStr}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Download WAV"
                        onClick={() => handleDownload(clip)}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Load into Editor"
                        onClick={() => {
                          onSelectClip(clip);
                          onClose();
                        }}
                        className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete clip"
                        onClick={() => onDeleteClip(clip.id)}
                        className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 line-clamp-2 italic bg-neutral-900/50 p-2 rounded-lg border border-neutral-800/60">
                    "{clip.text}"
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
