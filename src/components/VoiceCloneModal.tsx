import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Upload,
  Sparkles,
  X,
  Play,
  Pause,
  RotateCcw,
  Check,
  Loader2,
  Volume2,
  Fingerprint,
  Wand2,
  FileAudio,
  Radio,
} from 'lucide-react';
import { VoiceProfile } from '../types';

interface VoiceCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClonedVoice: (voice: VoiceProfile) => void;
}

export const VoiceCloneModal: React.FC<VoiceCloneModalProps> = ({
  isOpen,
  onClose,
  onSaveClonedVoice,
}) => {
  const [activeTab, setActiveTab] = useState<'record' | 'upload' | 'prompt'>('record');
  const [customVoiceName, setCustomVoiceName] = useState('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);

  // Prompt / Persona Lab state
  const [personaPrompt, setPersonaPrompt] = useState('');

  // Processing state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgressMsg, setAnalysisProgressMsg] = useState('Extracting vocal frequencies...');
  const [clonedResult, setClonedResult] = useState<VoiceProfile | null>(null);
  const [previewAudioData, setPreviewAudioData] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanupRecording();
      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);
      setUploadedFile(null);
      setUploadedAudioUrl(null);
      setClonedResult(null);
      setPreviewAudioData(null);
      setError(null);
      setIsAnalyzing(false);
    }
  }, [isOpen]);

  const cleanupRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Start mic recording
  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err: any) {
      setError('Microphone access denied or unavailable: ' + (err.message || 'Check browser permissions'));
    }
  };

  // Stop mic recording
  const stopRecording = () => {
    cleanupRecording();
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setUploadedAudioUrl(url);
    }
  };

  // Convert Blob or File to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Trigger cloning via audio sample (mic or upload)
  const handleCloneFromAudio = async (blob: Blob, mimeType: string) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgressMsg('Analyzing acoustic resonance, pitch profile, and timbre...');

    try {
      const base64 = await blobToBase64(blob);

      setAnalysisProgressMsg('Extracting voice DNA & mapping anchor frequencies with Gemini...');

      const res = await fetch('/api/clone-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64,
          mimeType,
          voiceName: customVoiceName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to clone voice.');
      }

      setClonedResult(data.clonedVoice);
      if (data.clonedVoice.previewAudioData) {
        setPreviewAudioData(data.clonedVoice.previewAudioData);
      }
    } catch (err: any) {
      setError(err.message || 'Voice cloning failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger voice design from text persona prompt
  const handleDesignFromPrompt = async () => {
    if (!personaPrompt.trim()) {
      setError('Please provide a voice persona description.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgressMsg('Synthesizing vocal persona architecture with Gemini 3.8 Flash...');

    try {
      const res = await fetch('/api/design-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaPrompt: personaPrompt.trim(),
          voiceName: customVoiceName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to design voice.');
      }

      setClonedResult(data.clonedVoice);
      if (data.clonedVoice.previewAudioData) {
        setPreviewAudioData(data.clonedVoice.previewAudioData);
      }
    } catch (err: any) {
      setError(err.message || 'Voice design failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const togglePreviewAudio = () => {
    if (!previewAudioRef.current || !previewAudioData) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current.play().then(() => setIsPlayingPreview(true));
    }
  };

  const handleSave = () => {
    if (!clonedResult) return;
    const finalProfile: VoiceProfile = {
      ...clonedResult,
      name: customVoiceName.trim() || clonedResult.name,
    };
    onSaveClonedVoice(finalProfile);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 text-amber-400 border border-amber-500/30 shadow-inner">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-100">
                  Voice Cloning & Design Lab
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Neural Cloning
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Clone any voice from audio recordings or craft custom personas with Gemini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* If Result is Ready: Display Cloned Voice Card */}
          {clonedResult ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                    <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                      Vocal DNA Successfully Extracted
                    </span>
                  </div>
                  <span className="text-xs font-mono text-amber-400">
                    Anchor: {clonedResult.baseVoice}
                  </span>
                </div>

                {/* Voice Name field */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Cloned Voice Name:
                  </label>
                  <input
                    type="text"
                    value={customVoiceName || clonedResult.name}
                    onChange={(e) => setCustomVoiceName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 font-semibold focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                {/* Acoustic DNA traits */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                      Timbre & Texture
                    </span>
                    <span className="text-neutral-200 font-medium line-clamp-1">
                      {clonedResult.acousticTraits?.timbre || clonedResult.tone}
                    </span>
                  </div>
                  <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                      Accent & Inflection
                    </span>
                    <span className="text-neutral-200 font-medium line-clamp-1">
                      {clonedResult.acousticTraits?.accent || clonedResult.accent}
                    </span>
                  </div>
                  <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                      Cadence
                    </span>
                    <span className="text-neutral-200 font-medium line-clamp-1">
                      {clonedResult.acousticTraits?.cadence || 'Conversational'}
                    </span>
                  </div>
                  <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                      Gender / Presence
                    </span>
                    <span className="text-neutral-200 font-medium">
                      {clonedResult.gender} ({clonedResult.acousticTraits?.emotionalBaseline || 'Natural'})
                    </span>
                  </div>
                </div>

                {/* Preview synthesized audio */}
                {previewAudioData && (
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-3">
                    <audio
                      ref={previewAudioRef}
                      src={`data:audio/wav;base64,${previewAudioData}`}
                      onEnded={() => setIsPlayingPreview(false)}
                    />
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={togglePreviewAudio}
                        className="w-9 h-9 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow-md hover:scale-105 transition-all"
                      >
                        {isPlayingPreview ? (
                          <Pause className="w-4 h-4 fill-neutral-950" />
                        ) : (
                          <Play className="w-4 h-4 fill-neutral-950 translate-x-0.5" />
                        )}
                      </button>
                      <div>
                        <span className="text-xs font-semibold text-neutral-200 block">
                          Cloned Voice Test Audio
                        </span>
                        <span className="text-[11px] text-neutral-400 italic line-clamp-1">
                          "{clonedResult.previewSample}"
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setClonedResult(null);
                    setPreviewAudioData(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
                >
                  Clone Another Voice
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save to Voice Studio</span>
                </button>
              </div>
            </div>
          ) : isAnalyzing ? (
            /* Analysis Loading Screen */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
                <Fingerprint className="w-7 h-7 text-amber-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-200">
                  Analyzing Acoustic Architecture
                </h4>
                <p className="text-xs text-amber-400/90 mt-1 font-mono">
                  {analysisProgressMsg}
                </p>
                <p className="text-[11px] text-neutral-500 mt-2 max-w-sm">
                  Gemini is analyzing pitch harmonics, vocal weight, breath cadence, and generating synthetic voice parameters...
                </p>
              </div>
            </div>
          ) : (
            /* Method Tabs */
            <div className="space-y-4">
              {/* Optional Voice Name Input */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Voice Name (Optional):
                </label>
                <input
                  type="text"
                  value={customVoiceName}
                  onChange={(e) => setCustomVoiceName(e.target.value)}
                  placeholder="e.g. My Voice, Professor Higgins, Friendly Narrator"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Navigation Tabs */}
              <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('record')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                    activeTab === 'record'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Record Mic</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                    activeTab === 'upload'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Audio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('prompt')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                    activeTab === 'prompt'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Persona Lab</span>
                </button>
              </div>

              {/* Tab 1: Record Microphone */}
              {activeTab === 'record' && (
                <div className="space-y-4">
                  {/* Sample Reading Text Prompt */}
                  <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-1">
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Recommended Reading Script (5-10 seconds):
                    </span>
                    <p className="text-xs text-neutral-200 italic leading-relaxed">
                      "The quick brown fox jumps over the lazy dog near the riverbank. The early morning mist drifts quietly across the pine trees."
                    </p>
                  </div>

                  {/* Recorder Visual Area */}
                  <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3">
                    {isRecording ? (
                      <div className="flex flex-col items-center space-y-3">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-rose-500/20 animate-ping absolute inset-0" />
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="relative w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                          >
                            <div className="w-5 h-5 bg-white rounded-sm" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-sm font-mono text-rose-400 font-semibold">
                            Recording: 00:{recordSeconds < 10 ? '0' : ''}{recordSeconds}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">
                          Click to stop when finished speaking
                        </p>
                      </div>
                    ) : recordedAudioBlob ? (
                      <div className="w-full flex flex-col items-center space-y-3">
                        <audio src={recordedAudioUrl || undefined} controls className="w-full h-10" />
                        <div className="flex items-center gap-2 w-full">
                          <button
                            type="button"
                            onClick={startRecording}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Re-record</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleCloneFromAudio(
                                recordedAudioBlob,
                                recordedAudioBlob.type || 'audio/webm'
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold shadow-md"
                          >
                            <Fingerprint className="w-3.5 h-3.5" />
                            <span>Clone This Voice</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <button
                          type="button"
                          onClick={startRecording}
                          className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 flex items-center justify-center shadow-xl shadow-amber-500/25 transition-transform hover:scale-105 active:scale-95"
                        >
                          <Mic className="w-7 h-7 stroke-[2.5]" />
                        </button>
                        <span className="text-xs font-semibold text-neutral-300">
                          Click to Start Recording
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          Speak naturally for 5 to 15 seconds
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Upload Audio File */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-neutral-800 hover:border-amber-500/50 rounded-2xl p-6 text-center bg-neutral-950/50 transition-colors">
                    <input
                      type="file"
                      id="voice-file-upload"
                      accept="audio/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="voice-file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <div className="p-3 rounded-full bg-neutral-900 text-amber-400 border border-neutral-800">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold text-neutral-200">
                        {uploadedFile ? uploadedFile.name : 'Click or Drag & Drop audio file'}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Supports MP3, WAV, M4A, WEBM, OGG (Max 25MB)
                      </span>
                    </label>
                  </div>

                  {uploadedFile && (
                    <div className="space-y-3">
                      <audio src={uploadedAudioUrl || undefined} controls className="w-full h-10" />
                      <button
                        type="button"
                        onClick={() =>
                          handleCloneFromAudio(
                            uploadedFile,
                            uploadedFile.type || 'audio/wav'
                          )
                        }
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold shadow-md"
                      >
                        <Fingerprint className="w-4 h-4" />
                        <span>Extract Vocal DNA & Clone</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Persona Lab (Text Prompt) */}
              {activeTab === 'prompt' && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-neutral-300">
                    Describe the voice persona you want to generate:
                  </label>
                  <textarea
                    value={personaPrompt}
                    onChange={(e) => setPersonaPrompt(e.target.value)}
                    rows={4}
                    placeholder="e.g. A warm Scottish grandfather in his 60s with a smoky voice, gentle chuckle, and melodic highland lilt..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60 leading-relaxed"
                  />

                  {/* Suggestion Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-neutral-500 font-medium">Quick Persona Ideas:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Gravelly noir detective with cynical pauses',
                        'Gentle meditation guide with breathy soothing cadence',
                        'Enthusiastic British wildlife documentary host',
                        'Silicon Valley tech visionary keynote speaker',
                      ].map((idea) => (
                        <button
                          key={idea}
                          type="button"
                          onClick={() => setPersonaPrompt(idea)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700 transition-colors"
                        >
                          {idea}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDesignFromPrompt}
                    disabled={!personaPrompt.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Synthesize Voice Persona</span>
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
