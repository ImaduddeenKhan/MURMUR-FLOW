// Load .env before service imports. storageService reads provider defaults at import time.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { groqService } from './services/groqService.js';
import { geminiService } from './services/geminiService.js';
import { zeroEditEngine } from './services/zeroEditEngine.js';
import { notetakerService } from './services/notetakerService.js';
import { storage } from './services/storageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage for incoming audio recordings
const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3050;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
const CLIENT_DIR = path.join(__dirname, '..', 'client');
app.use(express.static(CLIENT_DIR));

// ==========================================
// 1. DICTATION PIPELINE: Audio -> ASR -> Zero-Edit
// ==========================================
app.post('/api/dictate', upload.single('audio'), async (req, res) => {
  const startTime = Date.now();
  let tempFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided in request.' });
    }

    tempFilePath = req.file.path;
    const {
      sttProvider = storage.getSettings().sttProvider || 'groq',
      llmProvider = storage.getSettings().llmProvider || 'groq',
      tone = storage.getSettings().defaultTone || 'casual',
      language = 'auto',
      appName = 'General',
      apiKeyGroq,
      apiKeyGemini
    } = req.body;

    const options = {
      apiKey: sttProvider === 'gemini' ? (apiKeyGemini || storage.getSettings().apiKeyGemini) : (apiKeyGroq || storage.getSettings().apiKeyGroq),
      language,
      appName,
      tone,
      sttProvider,
      llmProvider
    };

    // Step 1: ASR Transcription
    let asrResult;
    try {
      if (sttProvider === 'gemini') {
        const mimeType = req.file.mimetype || 'audio/webm';
        asrResult = await geminiService.transcribeAudio(tempFilePath, mimeType, options);
      } else {
        asrResult = await groqService.transcribeAudio(tempFilePath, options);
      }
    } catch (asrErr) {
      console.error('❌ ASR Error:', asrErr.message);
      return res.status(500).json({
        error: `Transcription error (${sttProvider}): ${asrErr.message}`,
        suggestion: 'Please verify your API key in Settings or try another provider.'
      });
    }

    const rawTranscript = asrResult.text || '';

    // Step 2: Zero-Edit LLM Processing
    const zeroEditOptions = {
      ...options,
      apiKey: llmProvider === 'gemini' ? (apiKeyGemini || storage.getSettings().apiKeyGemini) : (apiKeyGroq || storage.getSettings().apiKeyGroq),
      tone,
      appName
    };

    const zeroEditResult = await zeroEditEngine.process(rawTranscript, zeroEditOptions);
    const totalLatency = Date.now() - startTime;

    // Step 3: Record to local history
    const historyEntry = storage.addHistory({
      rawTranscript,
      processedText: zeroEditResult.processedText,
      durationMs: Math.round((asrResult.duration || 0) * 1000),
      appName,
      tone,
      language: asrResult.language || language,
      latencyAsrMs: asrResult.latencyMs,
      latencyLlmMs: zeroEditResult.latencyMs,
      totalLatencyMs: totalLatency,
      isSnippet: zeroEditResult.isSnippet || false,
      sttProvider,
      llmProvider
    });

    res.json({
      success: true,
      rawTranscript,
      processedText: zeroEditResult.processedText,
      isSnippet: zeroEditResult.isSnippet || false,
      snippetTrigger: zeroEditResult.snippetTrigger || null,
      latency: {
        asrMs: asrResult.latencyMs,
        llmMs: zeroEditResult.latencyMs,
        totalMs: totalLatency
      },
      provider: {
        stt: asrResult.provider,
        sttModel: asrResult.model,
        llm: zeroEditResult.provider,
        llmModel: zeroEditResult.model
      },
      historyId: historyEntry.id
    });
  } catch (err) {
    console.error('❌ Dictation Pipeline Failed:', err);
    res.status(500).json({ error: err.message || 'Internal processing error' });
  } finally {
    // Clean up temporary audio file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupErr) {
        console.warn('Could not remove temp audio file:', cleanupErr.message);
      }
    }
  }
});

// ==========================================
// 2. TEXT PROCESSING: Raw Text -> Zero-Edit (Web Speech fallback & testing)
// ==========================================
app.post('/api/process-text', async (req, res) => {
  try {
    const {
      text,
      tone = storage.getSettings().defaultTone || 'casual',
      appName = 'General',
      llmProvider = storage.getSettings().llmProvider || 'groq',
      apiKeyGroq,
      apiKeyGemini
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required.' });
    }

    const options = {
      tone,
      appName,
      llmProvider,
      apiKey: llmProvider === 'gemini' ? (apiKeyGemini || storage.getSettings().apiKeyGemini) : (apiKeyGroq || storage.getSettings().apiKeyGroq)
    };

    const result = await zeroEditEngine.process(text, options);

    // Save to history
    storage.addHistory({
      rawTranscript: text,
      processedText: result.processedText,
      durationMs: 0,
      appName,
      tone,
      language: 'en',
      latencyAsrMs: 0,
      latencyLlmMs: result.latencyMs,
      totalLatencyMs: result.latencyMs,
      isSnippet: result.isSnippet || false,
      sttProvider: 'client-webspeech',
      llmProvider
    });

    res.json({
      success: true,
      rawTranscript: text,
      processedText: result.processedText,
      isSnippet: result.isSnippet || false,
      snippetTrigger: result.snippetTrigger || null,
      latencyMs: result.latencyMs,
      provider: result.provider,
      model: result.model
    });
  } catch (err) {
    console.error('❌ Process Text Failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. COMMAND MODE: Voice-to-Action Editing
// ==========================================
app.post('/api/command', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      instruction,
      selectedText,
      llmProvider = storage.getSettings().llmProvider || 'groq',
      apiKeyGroq,
      apiKeyGemini
    } = req.body;

    if (!instruction || !selectedText) {
      return res.status(400).json({ error: 'Both instruction and selectedText are required.' });
    }

    const systemPrompt = `You are WhisperFlow Command Mode.
Your task: Execute the user's voice command on the provided target text.
Examples: "make this concise", "translate to Spanish", "turn into bullet points", "fix grammar".

Output ONLY the transformed text. Do not add explanations, conversational remarks, or markdown wrapping unless requested.`;

    const promptText = `USER COMMAND: ${instruction}\n\nTARGET TEXT:\n${selectedText}`;
    const options = {
      apiKey: llmProvider === 'gemini' ? (apiKeyGemini || storage.getSettings().apiKeyGemini) : (apiKeyGroq || storage.getSettings().apiKeyGroq)
    };

    let result;
    if (llmProvider === 'gemini') {
      result = await geminiService.processZeroEdit(systemPrompt, promptText, options);
    } else {
      result = await groqService.processZeroEdit(systemPrompt, promptText, options);
    }

    res.json({
      success: true,
      transformedText: result.text,
      latencyMs: Date.now() - startTime,
      provider: result.provider,
      model: result.model
    });
  } catch (err) {
    console.error('❌ Command Mode Failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. NOTETAKER: Meeting Notes & Action Items
// ==========================================
app.post('/api/notetaker/summarize', async (req, res) => {
  try {
    const {
      transcript,
      title = 'Team Discussion',
      participants = ['Stephen', 'Nathalie', 'Mikel'],
      durationSeconds = 180,
      llmProvider = storage.getSettings().llmProvider || 'groq',
      apiKeyGroq,
      apiKeyGemini
    } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript is required.' });
    }

    const options = {
      title,
      participants,
      durationSeconds,
      llmProvider,
      apiKey: llmProvider === 'gemini' ? (apiKeyGemini || storage.getSettings().apiKeyGemini) : (apiKeyGroq || storage.getSettings().apiKeyGroq)
    };

    const result = await notetakerService.summarizeMeeting(transcript, options);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('❌ Notetaker Failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. SETTINGS, DICTIONARY, SNIPPETS, HISTORY
// ==========================================

// Settings
app.get('/api/settings', (req, res) => {
  res.json(storage.getSettings());
});

app.post('/api/settings', (req, res) => {
  try {
    const updated = storage.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dictionary
app.get('/api/dictionary', (req, res) => {
  res.json(storage.getDictionary());
});

app.post('/api/dictionary', (req, res) => {
  try {
    const updated = storage.addDictionaryItem(req.body);
    res.json({ success: true, dictionary: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/dictionary/:id', (req, res) => {
  try {
    const updated = storage.deleteDictionaryItem(req.params.id);
    res.json({ success: true, dictionary: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Snippets
app.get('/api/snippets', (req, res) => {
  res.json(storage.getSnippets());
});

app.post('/api/snippets', (req, res) => {
  try {
    const updated = storage.addSnippet(req.body);
    res.json({ success: true, snippets: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/snippets/:id', (req, res) => {
  try {
    const updated = storage.deleteSnippet(req.params.id);
    res.json({ success: true, snippets: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// History
app.get('/api/history', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  res.json(storage.getHistory(limit));
});

app.delete('/api/history', (req, res) => {
  storage.clearHistory();
  res.json({ success: true, history: [] });
});

// Meetings
app.get('/api/meetings', (req, res) => {
  res.json(storage.getMeetings());
});

app.get('/api/meetings/:id', (req, res) => {
  const meeting = storage.getMeetingById(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
  res.json(meeting);
});

// Health Checks for Cloud Deployment (Docker, Render, Railway, Fly.io)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// Status & Available Models
app.get('/api/status', (req, res) => {
  const settings = storage.getSettings();
  res.json({
    status: 'online',
    version: '1.0.0',
    uptime: process.uptime(),
    providers: {
      // Defaults: whisper-large-v3-turbo, openai/gpt-oss-20b, gemini-3.6-flash.
      groq: {
        configured: Boolean(process.env.GROQ_API_KEY || settings.apiKeyGroq),
        modelsSTT: ['whisper-large-v3-turbo', 'whisper-large-v3'],
        modelsLLM: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b']
      },
      gemini: {
        configured: Boolean(process.env.GEMINI_API_KEY || settings.apiKeyGemini),
        modelsSTT: ['gemini-3.6-flash'],
        modelsLLM: ['gemini-3.6-flash']
      },
      webspeech: {
        configured: true,
        description: 'Native browser speech recognition (zero API key needed)'
      }
    }
  });
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`🎙️  WhisperFlow Server running at: http://localhost:${port}`);
    console.log(`⚡  Wispr Flow Open Source Clone ready for Dictation & Notetaker`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(DEFAULT_PORT);
