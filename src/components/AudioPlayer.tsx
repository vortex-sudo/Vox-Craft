import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Download, Volume2, VolumeX, Repeat, Sparkles } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import { downloadAudioBlob, formatTime } from '../utils/audio';

interface AudioPlayerProps {
  audioBlob: Blob | null;
  audioUrl: string | null;
  voiceName: string;
  styleName: string;
  modelName: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBlob,
  audioUrl,
  voiceName,
  styleName,
  modelName,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);

  // When audioUrl changes, reset and autoplay if user just generated
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.playbackRate = playbackRate;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const changeRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleDownload = () => {
    if (audioBlob) {
      const cleanVoice = voiceName.toLowerCase();
      downloadAudioBlob(audioBlob, `voxcraft-${cleanVoice}-${Date.now()}.wav`);
    }
  };

  if (!audioUrl) {
    return (
      <div className="bg-neutral-900/30 border border-neutral-800/60 rounded-2xl p-6 text-center backdrop-blur-sm">
        <AudioVisualizer isPlaying={false} />
        <p className="mt-3 text-xs text-neutral-400">
          Click <span className="text-amber-400 font-semibold">"Generate & Speak"</span> above to synthesize your text and listen to high-fidelity audio here.
        </p>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden ring-1 ring-amber-500/20">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        loop={isLooping}
      />

      {/* Visualizer */}
      <div className="mb-4">
        <AudioVisualizer isPlaying={isPlaying} audioRef={audioRef} colorScheme="amber" />
      </div>

      {/* Audio metadata strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Voice: <span className="text-amber-300">{voiceName}</span>
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-400 truncate max-w-xs">{styleName}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
            {modelName}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            24kHz WAV
          </span>
        </div>
      </div>

      {/* Scrub timeline */}
      <div className="space-y-1 mb-4">
        <div className="relative flex items-center group">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
            style={{
              background: `linear-gradient(to right, #f59e0b ${progressPercent}%, #262626 ${progressPercent}%)`,
            }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-neutral-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Player Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Playback rate & Loop */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs font-mono">
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                onClick={() => changeRate(rate)}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  playbackRate === rate
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <button
            type="button"
            title={isLooping ? 'Disable Loop' : 'Enable Loop'}
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isLooping
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center Main Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Replay from start"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
                audioRef.current.play().then(() => setIsPlaying(true));
              }
            }}
            className="p-2.5 rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold flex items-center justify-center shadow-lg shadow-amber-500/25 transition-transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-neutral-950" />
            ) : (
              <Play className="w-5 h-5 fill-neutral-950 translate-x-0.5" />
            )}
          </button>
        </div>

        {/* Volume & Download */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white p-1"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 accent-amber-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download WAV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
