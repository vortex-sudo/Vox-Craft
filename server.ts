import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client utility on the server with required User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Curated voice profiles for Gemini TTS
const PRESET_VOICES = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    tone: 'Warm, articulate, empathetic',
    accent: 'Neutral American',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Narrator', 'Warm', 'Audiobook', 'Empathetic'],
    description: 'A comforting, rich, and clear voice perfect for storytelling, audiobooks, and guided meditation.',
    previewSample: 'Welcome to this peaceful meditation. Close your eyes, take a deep breath, and let your body relax.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male',
    tone: 'Youthful, energetic, curious',
    accent: 'Neutral American',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Podcast', 'Energetic', 'Tech', 'Casual'],
    description: 'Bright and spirited with a contemporary tone. Great for tech commentary, explainers, and podcasts.',
    previewSample: 'Hey everyone, welcome back! Today we are exploring the latest breakthroughs in artificial intelligence.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male',
    tone: 'Deep, resonant, authoritative',
    accent: 'Transatlantic / Classic',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Documentary', 'Deep', 'Authoritative', 'Cinematic'],
    description: 'Commanding low register with profound depth. Ideal for historical documentaries, dramatic trailers, and solemn narrations.',
    previewSample: 'Deep beneath the ancient ocean trenches, mysterious creatures roam in perpetual silence.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Female',
    tone: 'Bright, cheerful, conversational',
    accent: 'Neutral American',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Assistant', 'Friendly', 'Commercial', 'Vibrant'],
    description: 'Upbeat, friendly, and lively. Superb for virtual assistants, upbeat brand advertisements, and e-learning.',
    previewSample: 'Good morning! Your schedule is clear this morning, and the weather looks fantastic for a walk.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    tone: 'Robust, commanding, narrative',
    accent: 'Nordic / Resonant',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Action', 'Epic', 'Bold', 'Storyteller'],
    description: 'Strong, cinematic presence with a gritty, heroic resonance. Built for fantasy epics and gaming trailers.',
    previewSample: 'The kingdom stood upon the precipice of ruin, awaiting the guardian prophesied to break the curse.',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Female',
    tone: 'Melodic, poetic, serene',
    accent: 'Sophisticated / Polished',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Poetic', 'Artistic', 'Serene', 'Audiobook'],
    description: 'Harmonious and poetic with musical cadence. Fantastic for literature, luxury ads, and poetry readings.',
    previewSample: 'The stars mirrored on the tranquil lake, whispering secrets carried across celestial winds.',
  },
  {
    id: 'Orus',
    name: 'Orus',
    gender: 'Male',
    tone: 'Grounded, sincere, trustworthy',
    accent: 'Midwestern American',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Corporate', 'Trustworthy', 'Educator', 'Explainer'],
    description: 'Grounded and authentic. Excellent for corporate presentations, medical explainers, and educational masterclasses.',
    previewSample: 'Here are the three foundational principles that will help optimize your team workflow this quarter.',
  },
];

// Health and capability check
app.get('/api/status', (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  res.json({
    status: 'online',
    hasGeminiKey: hasKey,
    voicesCount: PRESET_VOICES.length,
    models: ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'],
  });
});

// Get voice catalog
app.get('/api/voices', (_req: Request, res: Response) => {
  res.json({
    voices: PRESET_VOICES,
  });
});

// Text-to-Speech generation endpoint using Gemini TTS
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName, style, model, voiceDesignPrompt } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text prompt is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Falling back to browser speech synthesis.',
        fallbackRequired: true,
      });
    }

    // When a custom cloned voice design prompt is provided, prefer the flagship expressive voice model
    const selectedModel = voiceDesignPrompt || model === 'gemini-3.8-flash-tts'
      ? 'gemini-3.8-flash-tts'
      : 'gemini-3.8-flash-lite-tts';

    const selectedVoice = voiceName || 'Kore';

    // Combine voice design directive with delivery style for authentic cloning
    let combinedStyle = '';
    if (voiceDesignPrompt && typeof voiceDesignPrompt === 'string') {
      combinedStyle = `Voice Persona & Acoustic Signature: ${voiceDesignPrompt.trim()}.`;
    }
    if (style && typeof style === 'string' && style.trim().length > 0) {
      combinedStyle = combinedStyle
        ? `${combinedStyle} Performance Directive: ${style.trim()}`
        : style.trim();
    }

    // Prepare speech parts
    const parts: any[] = [
      {
        text: text.trim(),
      },
    ];

    if (combinedStyle.length > 0) {
      parts[0].speechMetadata = {
        style: combinedStyle,
      };
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);

    if (!audioPart || !audioPart.inlineData?.data) {
      const textPart = candidate?.content?.parts?.find((p: any) => p.text);
      const refusal = textPart?.text || 'No audio data received from Gemini TTS model.';
      return res.status(500).json({
        error: refusal,
        fallbackRequired: true,
      });
    }

    const base64Audio = audioPart.inlineData.data;
    const mimeType = audioPart.inlineData.mimeType || 'audio/wav';

    return res.json({
      success: true,
      audioData: base64Audio,
      mimeType,
      voice: selectedVoice,
      model: selectedModel,
      style: style || 'Default',
    });
  } catch (error: any) {
    console.error('Gemini TTS generation error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to synthesize speech via Gemini TTS.',
      fallbackRequired: true,
    });
  }
});

// Voice Cloning Endpoint: Analyzes uploaded audio or mic recording
app.post('/api/clone-voice', async (req: Request, res: Response) => {
  try {
    const { audioData, mimeType, voiceName } = req.body;

    if (!audioData || typeof audioData !== 'string') {
      return res.status(400).json({ error: 'Audio data is required for voice cloning.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const rawMime = mimeType || 'audio/webm';
    // Clean mime type (remove codecs=...)
    const cleanMime = rawMime.split(';')[0].trim();

    const audioPart = {
      inlineData: {
        mimeType: cleanMime,
        data: audioData,
      },
    };

    const analysisPrompt = `You are a world-class biometric acoustic engineer and voice cloning expert.
Analyze this audio recording of a human speaker to extract their unique vocal DNA and acoustic signature.
The goal is to configure Gemini 3.8 Flash TTS Voice Design to emulate this speaker with the highest possible authenticity and realism.

Analyze:
1. Gender and vocal pitch range (Baritone, Tenor, Alto, Soprano).
2. Recommend the closest base neural anchor voice from this exact list: 'Kore', 'Puck', 'Charon', 'Zephyr', 'Fenrir', 'Aoede', 'Orus'.
   - 'Kore': Warm, empathetic, clear female voice
   - 'Puck': Youthful, energetic, curious male voice
   - 'Charon': Deep, resonant, authoritative male voice
   - 'Zephyr': Bright, upbeat, conversational female voice
   - 'Fenrir': Heavy, commanding, gritty cinematic male voice
   - 'Aoede': Melodic, poetic, gentle female voice
   - 'Orus': Grounded, sincere, authentic mid-range male voice
3. Acoustic Timbre (e.g. vocal fry, breathiness, gravel, resonance, warmth, raspy, velvet).
4. Accent & Regional Inflection (e.g. General American, British RP, Australian, Southern American, etc.).
5. Cadence & Rhythm (e.g. rapid and punchy, measured and deliberate, conversational with micro-pauses).
6. Emotional Baseline & Energy.
7. Craft a detailed "voiceDesignPrompt" (speechMetadata style directive) that instructs the Gemini 3.8 Flash TTS model on how to emulate this speaker's pitch, timbre, accent, cadence, and breath placement with uncanny authenticity.

Return ONLY a valid JSON object matching this structure:
{
  "voiceName": "${voiceName?.trim() || 'My Cloned Voice'}",
  "gender": "Female" or "Male",
  "recommendedBaseVoice": "Kore" | "Puck" | "Charon" | "Zephyr" | "Fenrir" | "Aoede" | "Orus",
  "timbre": "description of timbre",
  "accent": "detected accent",
  "cadence": "speaking rhythm description",
  "emotionalBaseline": "emotional warmth and energy",
  "voiceDesignPrompt": "comprehensive voice emulation prompt for Gemini 3.8 Flash TTS",
  "previewSample": "A natural 15-word introduction demonstrating this voice"
}`;

    const analysisResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            audioPart,
            { text: analysisPrompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const analysisText = analysisResponse.text?.trim() || '{}';
    let profileData: any;
    try {
      profileData = JSON.parse(analysisText);
    } catch {
      // Fallback regex extraction if needed
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      profileData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    }

    const assignedName = voiceName?.trim() || profileData.voiceName || 'Cloned Voice';
    const baseVoice = ['Kore', 'Puck', 'Charon', 'Zephyr', 'Fenrir', 'Aoede', 'Orus'].includes(profileData.recommendedBaseVoice)
      ? profileData.recommendedBaseVoice
      : (profileData.gender === 'Female' ? 'Kore' : 'Puck');

    const voiceDesignPrompt = profileData.voiceDesignPrompt || `${profileData.timbre || 'Warm and natural'}, ${profileData.accent || 'Clear accent'}, ${profileData.cadence || 'natural conversational cadence'}`;
    const previewSample = profileData.previewSample || `Hello, this is my newly cloned voice profile generated with VoxCraft AI.`;

    // Synthesize an immediate test sample of the cloned voice using gemini-3.8-flash-tts
    let previewAudioData = '';
    try {
      const sampleResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: previewSample,
                speechMetadata: {
                  style: `Voice Persona & Acoustic Signature: ${voiceDesignPrompt}`,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: baseVoice },
            },
          },
        },
      });

      const audioPart = sampleResponse.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
      if (audioPart?.inlineData?.data) {
        previewAudioData = audioPart.inlineData.data;
      }
    } catch (sampleErr) {
      console.warn('Preview synthesis error during voice cloning:', sampleErr);
    }

    return res.json({
      success: true,
      clonedVoice: {
        id: 'clone-' + Date.now(),
        name: assignedName,
        gender: profileData.gender || 'Male',
        baseVoice,
        tone: profileData.timbre || 'Custom Cloned Timbre',
        accent: profileData.accent || 'Custom Accent',
        avatar: profileData.gender === 'Female'
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
        tags: ['Cloned', profileData.accent || 'Natural', profileData.gender || 'Voice'],
        description: `Cloned voice featuring ${profileData.timbre || 'unique vocal resonance'} with ${profileData.cadence || 'conversational cadence'}.`,
        previewSample,
        previewAudioData,
        voiceDesignPrompt,
        acousticTraits: {
          timbre: profileData.timbre,
          cadence: profileData.cadence,
          accent: profileData.accent,
          emotionalBaseline: profileData.emotionalBaseline,
        },
        createdAt: Date.now(),
        isCloned: true,
      },
    });
  } catch (error: any) {
    console.error('Voice cloning error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to clone voice from audio sample.' });
  }
});

// Voice Persona Design Lab Endpoint: Prompt custom voice persona from text
app.post('/api/design-voice', async (req: Request, res: Response) => {
  try {
    const { personaPrompt, voiceName } = req.body;

    if (!personaPrompt || typeof personaPrompt !== 'string') {
      return res.status(400).json({ error: 'Persona description prompt is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const designMetaPrompt = `You are a voice designer for neural speech synthesis.
Convert this user's voice persona concept into an authentic acoustic configuration for Gemini 3.8 Flash TTS:

User Concept: "${personaPrompt.trim()}"

Map this concept to one of the 7 base anchor voices: 'Kore', 'Puck', 'Charon', 'Zephyr', 'Fenrir', 'Aoede', 'Orus'.
Extract the acoustic timbre, accent, cadence, and generate a comprehensive speechMetadata style directive.

Return ONLY a valid JSON object:
{
  "voiceName": "${voiceName?.trim() || 'Custom Persona'}",
  "gender": "Female" or "Male",
  "recommendedBaseVoice": "Kore" | "Puck" | "Charon" | "Zephyr" | "Fenrir" | "Aoede" | "Orus",
  "timbre": "description of timbre",
  "accent": "description of accent",
  "cadence": "pacing description",
  "emotionalBaseline": "emotional presence",
  "voiceDesignPrompt": "comprehensive speechMetadata style directive",
  "previewSample": "a 15-word introduction suited to this persona"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: designMetaPrompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const baseVoice = ['Kore', 'Puck', 'Charon', 'Zephyr', 'Fenrir', 'Aoede', 'Orus'].includes(parsed.recommendedBaseVoice)
      ? parsed.recommendedBaseVoice
      : 'Kore';

    const previewSample = parsed.previewSample || `Greetings, this is a custom designed voice crafted with neural synthesis.`;
    const voiceDesignPrompt = parsed.voiceDesignPrompt || personaPrompt;

    let previewAudioData = '';
    try {
      const sampleResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: previewSample,
                speechMetadata: {
                  style: `Voice Persona & Acoustic Signature: ${voiceDesignPrompt}`,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: baseVoice },
            },
          },
        },
      });

      const audioPart = sampleResponse.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
      if (audioPart?.inlineData?.data) {
        previewAudioData = audioPart.inlineData.data;
      }
    } catch (e) {
      console.warn('Sample generation error in voice design:', e);
    }

    return res.json({
      success: true,
      clonedVoice: {
        id: 'designed-' + Date.now(),
        name: voiceName?.trim() || parsed.voiceName || 'Designed Persona',
        gender: parsed.gender || 'Female',
        baseVoice,
        tone: parsed.timbre || 'Custom Persona Timbre',
        accent: parsed.accent || 'Natural',
        avatar: parsed.gender === 'Female'
          ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80'
          : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80',
        tags: ['Designed', parsed.accent || 'Unique', parsed.gender || 'Persona'],
        description: `Custom designed persona: ${parsed.timbre || personaPrompt}`,
        previewSample,
        previewAudioData,
        voiceDesignPrompt,
        acousticTraits: {
          timbre: parsed.timbre,
          cadence: parsed.cadence,
          accent: parsed.accent,
          emotionalBaseline: parsed.emotionalBaseline,
        },
        createdAt: Date.now(),
        isCloned: true,
      },
    });
  } catch (error: any) {
    console.error('Voice design error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to design voice persona.' });
  }
});

// AI Script Assistant using gemini-3.8-flash
app.post('/api/generate-script', async (req: Request, res: Response) => {
  try {
    const { topic, genre, tone, targetDurationSeconds } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured.' });
    }

    const prompt = `You are an expert voiceover copywriter and script doctor.
Generate a concise, highly engaging voiceover script optimized for text-to-speech audio performance.

Topic / Purpose: ${topic || 'Welcome message'}
Genre / Format: ${genre || 'Podcast intro'}
Desired Tone: ${tone || 'Engaging and conversational'}
Approximate Target Duration: ${targetDurationSeconds || 20} seconds (approx ${Math.round((targetDurationSeconds || 20) * 2.5)} words)

Guidelines:
1. Write natural, flowing spoken English with punctuation suited for speech cadence (ellipses, commas).
2. You may optionally include natural vocal tags if suitable like <laugh>, <sigh>, <gasp>, <breath>, |mhm|, |yeah|.
3. Do not include speaker labels (e.g. "Speaker:") or stage directions in brackets unless they are the recognized speech tags above.
4. Output ONLY the clean script text ready to be read aloud.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const script = response.text?.trim() || '';

    return res.json({ script });
  } catch (error: any) {
    console.error('Script generation error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate script.' });
  }
});

// Server configuration & Vite middleware
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoxCraft TTS Studio running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
