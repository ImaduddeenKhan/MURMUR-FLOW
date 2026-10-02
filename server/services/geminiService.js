import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { storage } from './storageService.js';

export class GeminiService {
  getClient(overrideKey) {
    const key = overrideKey || process.env.GEMINI_API_KEY || storage.getSettings().apiKeyGemini;
    if (!key) {
      throw new Error('Gemini API Key is not configured. Please add it in Settings or .env');
    }
    return new GoogleGenerativeAI(key);
  }

  /**
   * Transcribe audio using Google Gemini multimodal audio capabilities.
   * Model: gemini-3.6-flash
   */
  async transcribeAudio(filePath, mimeType = 'audio/webm', options = {}) {
    const startTime = Date.now();
    const ai = this.getClient(options.apiKey);
    const modelName = options.model || storage.getSettings().geminiModel || 'gemini-3.6-flash';
    const model = ai.getGenerativeModel({ model: modelName });

    const audioBuffer = fs.readFileSync(filePath);
    const base64Audio = audioBuffer.toString('base64');

    const dictWords = storage.getDictionary().map(d => d.word).join(', ');
    const prompt = `You are an accurate speech-to-text transcriber. 
Transcribe the speech in this audio verbatim into text. 
Do not add timestamps, commentary, or speaker tags unless requested.
${dictWords ? `Special vocabulary to recognize accurately: ${dictWords}` : ''}
Output ONLY the transcription text.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: base64Audio
        }
      }
    ]);

    const response = await result.response;
    const text = response.text().trim();
    const elapsed = Date.now() - startTime;

    return {
      text,
      language: options.language || 'auto',
      latencyMs: elapsed,
      provider: 'gemini',
      model: modelName
    };
  }

  /**
   * Run Zero-Edit post-processing with gemini-3.6-flash.
   */
  async processZeroEdit(systemPrompt, userText, options = {}) {
    const startTime = Date.now();
    const ai = this.getClient(options.apiKey);
    const modelName = options.model || storage.getSettings().geminiModel || 'gemini-3.6-flash';

    const model = ai.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1500
      }
    });

    const result = await model.generateContent(userText);
    const response = await result.response;
    const output = response.text().trim() || userText;
    const elapsed = Date.now() - startTime;

    return {
      text: output,
      latencyMs: elapsed,
      provider: 'gemini',
      model: modelName
    };
  }
}

export const geminiService = new GeminiService();
