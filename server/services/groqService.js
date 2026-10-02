import Groq from 'groq-sdk';
import fs from 'fs';
import { storage } from './storageService.js';

export class GroqService {
  getClient(overrideKey) {
    const key = overrideKey || process.env.GROQ_API_KEY || storage.getSettings().apiKeyGroq;
    if (!key) {
      throw new Error('Groq API Key is not configured. Please add it in Settings or .env');
    }
    return new Groq({ apiKey: key });
  }

  /**
   * Transcribe an audio file using Groq Whisper.
   * Model options: whisper-large-v3-turbo (default, fast ~180ms), whisper-large-v3
   */
  async transcribeAudio(filePath, options = {}) {
    const startTime = Date.now();
    const groq = this.getClient(options.apiKey);
    const model = options.model || storage.getSettings().groqModelSTT || 'whisper-large-v3-turbo';

    // Build initial prompt from dictionary for bias boosting
    const dictWords = storage.getDictionary().map(d => d.word).join(', ');
    const initialPrompt = options.prompt || dictWords ? `Vocabulary: ${dictWords}` : undefined;

    const fileStream = fs.createReadStream(filePath);

    const transcription = await groq.audio.transcriptions.create({
      file: fileStream,
      model: model,
      language: options.language && options.language !== 'auto' ? options.language : undefined,
      prompt: initialPrompt,
      response_format: 'verbose_json',
      temperature: 0.0
    });

    const elapsed = Date.now() - startTime;
    return {
      text: transcription.text.trim(),
      language: transcription.language || options.language || 'en',
      duration: transcription.duration,
      latencyMs: elapsed,
      provider: 'groq',
      model
    };
  }

  /**
   * Run LLM inference using Groq chat.
   * Default: openai/gpt-oss-20b. Secondary option: openai/gpt-oss-120b.
   */
  async processZeroEdit(systemPrompt, userText, options = {}) {
    const startTime = Date.now();
    const groq = this.getClient(options.apiKey);
    const model = options.model || storage.getSettings().groqModelLLM || 'openai/gpt-oss-20b';

    const completion = await groq.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ],
      temperature: 0.1, // Low temperature for high precision editing without hallucination
      max_completion_tokens: 1500,
      reasoning_effort: 'low'
    });

    const elapsed = Date.now() - startTime;
    const output = completion.choices[0]?.message?.content?.trim() || userText;

    return {
      text: output,
      latencyMs: elapsed,
      provider: 'groq',
      model,
      usage: completion.usage
    };
  }
}

export const groqService = new GroqService();
