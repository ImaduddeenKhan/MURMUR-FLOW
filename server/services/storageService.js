import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'whisperflow_store.json');

const DEFAULT_STATE = {
  settings: {
    sttProvider: process.env.DEFAULT_STT_PROVIDER || 'groq',
    llmProvider: process.env.DEFAULT_LLM_PROVIDER || 'groq',
    groqModelSTT: 'whisper-large-v3-turbo',
    groqModelLLM: 'openai/gpt-oss-20b',
    geminiModel: 'gemini-3.6-flash',
    defaultTone: 'casual',
    autoCopy: true,
    pushToTalkKey: 'Space',
    cancelKey: 'Escape',
    soundEffects: true,
    vadEnabled: true,
    webhookUrl: '',
    apiKeyGroq: '',
    apiKeyGemini: ''
  },
  dictionary: [
    { id: '1', word: 'Murmur Flow', category: 'product', hint: 'murmur flow' },
    { id: '2', word: 'Supabase', category: 'code', hint: 'soopa base' },
    { id: '3', word: 'Vercel', category: 'code', hint: 'ver sell' },
    { id: '4', word: 'PostgreSQL', category: 'code', hint: 'postgres' },
    { id: '5', word: 'TypeScript', category: 'code', hint: 'type script' }
  ],
  snippets: [
    {
      id: '1',
      trigger: 'insert calendly',
      content: 'Feel free to grab a convenient time for us to chat on my calendar: https://calendly.com/your-username/30min',
      description: 'Quick meeting scheduler link'
    },
    {
      id: '2',
      trigger: 'standard signature',
      content: "Best regards,\nAlex Rivera\nPrincipal Architect | OpenSource Lead\nGitHub: @whisperflow-dev",
      description: 'Professional sign-off'
    },
    {
      id: '3',
      trigger: 'bug report template',
      content: "**Bug Description:**\n**Steps to Reproduce:**\n1. \n2. \n**Expected Behavior:**\n**Actual Behavior:**\n**Environment Logs:**",
      description: 'GitHub issue template'
    }
  ],
  history: [],
  meetings: []
};

class StorageService {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return { ...DEFAULT_STATE, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('⚠️ Could not load storage file, initializing default:', err.message);
    }
    this.save(DEFAULT_STATE);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  save(data = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('❌ Failed to save storage file:', err.message);
    }
  }

  // --- Settings ---
  getSettings() {
    return {
      ...this.data.settings,
      hasGroqKey: Boolean(process.env.GROQ_API_KEY || this.data.settings.apiKeyGroq),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || this.data.settings.apiKeyGemini)
    };
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.getSettings();
  }

  // --- Dictionary ---
  getDictionary() {
    return this.data.dictionary || [];
  }

  addDictionaryItem(item) {
    const word = item.word.trim();
    if (!word) throw new Error('Word is required');
    const existing = this.data.dictionary.find(d => d.word.toLowerCase() === word.toLowerCase());
    if (existing) {
      existing.category = item.category || existing.category;
      existing.hint = item.hint || existing.hint;
    } else {
      this.data.dictionary.unshift({
        id: Date.now().toString(),
        word,
        category: item.category || 'general',
        hint: item.hint || ''
      });
    }
    this.save();
    return this.data.dictionary;
  }

  deleteDictionaryItem(id) {
    this.data.dictionary = this.data.dictionary.filter(d => d.id !== id);
    this.save();
    return this.data.dictionary;
  }

  // --- Snippets ---
  getSnippets() {
    return this.data.snippets || [];
  }

  addSnippet(snippet) {
    const trigger = snippet.trigger.trim().toLowerCase();
    const content = snippet.content.trim();
    if (!trigger || !content) throw new Error('Trigger and Content are required');
    this.data.snippets.unshift({
      id: Date.now().toString(),
      trigger,
      content,
      description: snippet.description || ''
    });
    this.save();
    return this.data.snippets;
  }

  deleteSnippet(id) {
    this.data.snippets = this.data.snippets.filter(s => s.id !== id);
    this.save();
    return this.data.snippets;
  }

  // --- History ---
  addHistory(entry) {
    this.data.history.unshift({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...entry
    });
    if (this.data.history.length > 100) {
      this.data.history = this.data.history.slice(0, 100);
    }
    this.save();
    return this.data.history[0];
  }

  getHistory(limit = 20) {
    return (this.data.history || []).slice(0, limit);
  }

  clearHistory() {
    this.data.history = [];
    this.save();
    return [];
  }

  // --- Meetings (Notetaker) ---
  addMeeting(meeting) {
    const entry = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...meeting
    };
    this.data.meetings.unshift(entry);
    this.save();
    return entry;
  }

  getMeetings() {
    return this.data.meetings || [];
  }

  getMeetingById(id) {
    return this.data.meetings.find(m => m.id === id);
  }
}

export const storage = new StorageService();
