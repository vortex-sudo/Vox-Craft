import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  colorScheme?: 'amber' | 'cyan' | 'purple';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  audioRef,
  colorScheme = 'amber',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Set up Web Audio API if possible
  useEffect(() => {
    if (!audioRef?.current) return;
    const audioEl = audioRef.current;

    const setupAudioGraph = () => {
      try {
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) return;
          audioContextRef.current = new AudioContextClass();
        }

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        if (!analyserRef.current) {
          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 128;
          analyserRef.current.smoothingTimeConstant = 0.8;
        }

        // Only create source once per audio element
        if (!sourceNodeRef.current && audioEl) {
          try {
            sourceNodeRef.current = ctx.createMediaElementSource(audioEl);
            sourceNodeRef.current.connect(analyserRef.current);
            analyserRef.current.connect(ctx.destination);
          } catch (e) {
            // Already connected or cross-origin restrictions
            console.warn('Audio node connection skipped:', e);
          }
        }
      } catch (err) {
        console.warn('Web Audio API analyzer setup error:', err);
      }
    };

    if (isPlaying) {
      setupAudioGraph();
    }
  }, [isPlaying, audioRef]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const analyser = analyserRef.current;
      const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray!);
      }

      const barCount = 42;
      const barWidth = Math.max(3, (width / barCount) - 3);
      const centerX = width / 2;

      // Color gradients
      const primaryColor = colorScheme === 'amber'
        ? '#f59e0b'
        : colorScheme === 'cyan'
        ? '#06b6d4'
        : '#a855f7';
      const secondaryColor = colorScheme === 'amber'
        ? '#ea580c'
        : colorScheme === 'cyan'
        ? '#3b82f6'
        : '#ec4899';

      phase += 0.08;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 3);
        let barHeight = 4;

        if (isPlaying) {
          if (dataArray && dataArray.length > 0) {
            const index = Math.floor((i / barCount) * (dataArray.length * 0.7));
            const val = dataArray[index] || 0;
            barHeight = Math.max(4, (val / 255) * (height - 8));
          } else {
            // Simulated rhythmic fallback waves
            const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
            const wave = Math.sin(phase + i * 0.3) * 0.5 + 0.5;
            barHeight = Math.max(6, (wave * (1 - distFromCenter * 0.4)) * (height * 0.75));
          }
        } else {
          // Idle ambient pulse
          const ambientWave = Math.sin(phase * 0.3 + i * 0.15) * 2;
          barHeight = Math.max(3, 4 + ambientWave);
        }

        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, primaryColor);
        grad.addColorStop(1, secondaryColor);

        ctx.fillStyle = grad;
        ctx.beginPath();
        // Rounded bar caps
        const radius = barWidth / 2;
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();

        // Glow effect for active high energy bars
        if (isPlaying && barHeight > height * 0.5) {
          ctx.shadowColor = primaryColor;
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowBlur = 0;
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, colorScheme]);

  return (
    <div className="relative w-full h-16 bg-neutral-950/60 rounded-xl overflow-hidden border border-neutral-800/80 shadow-inner flex items-center justify-center p-2 backdrop-blur-sm">
      <canvas
        ref={canvasRef}
        width={600}
        height={64}
        className="w-full h-full object-contain"
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[11px] font-medium tracking-wider uppercase text-neutral-500 bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-800">
            Acoustic Visualizer Ready
          </span>
        </div>
      )}
    </div>
  );
};
