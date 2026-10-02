/**
 * WhisperFlow API Client & Web Speech Fallback Driver
 */

export class ZeroEditClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Send audio blob to /api/dictate
   */
  async sendAudioDictation(audioBlob, mimeType, options = {}) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('sttProvider', options.sttProvider || 'groq');
    formData.append('llmProvider', options.llmProvider || 'groq');
    formData.append('tone', options.tone || 'casual');
    formData.append('appName', options.appName || 'General');
    formData.append('language', options.language || 'auto');

    if (options.apiKeyGroq) formData.append('apiKeyGroq', options.apiKeyGroq);
    if (options.apiKeyGemini) formData.append('apiKeyGemini', options.apiKeyGemini);

    const response = await fetch(`${this.baseUrl}/api/dictate`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Dictation API failed');
    }
    return data;
  }

  /**
   * Process raw text through Zero-Edit Engine
   */
  async processText(text, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/process-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        tone: options.tone || 'casual',
        appName: options.appName || 'General',
        llmProvider: options.llmProvider || 'groq',
        apiKeyGroq: options.apiKeyGroq,
        apiKeyGemini: options.apiKeyGemini
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Text processing failed');
    }
    return data;
  }

  /**
   * Execute voice command on highlighted text
   */
  async executeCommand(instruction, selectedText, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction,
        selectedText,
        llmProvider: options.llmProvider || 'groq',
        apiKeyGroq: options.apiKeyGroq,
        apiKeyGemini: options.apiKeyGemini
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Command execution failed');
    }
    return data;
  }

  /**
   * Summarize meeting
   */
  async summarizeMeeting(transcript, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/notetaker/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        title: options.title || 'Meeting Notes',
        participants: options.participants || ['Stephen', 'Nathalie', 'Mikel'],
        llmProvider: options.llmProvider || 'groq',
        apiKeyGroq: options.apiKeyGroq,
        apiKeyGemini: options.apiKeyGemini
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Meeting summarization failed');
    }
    return data;
  }

  /**
   * Native Browser Web Speech API Driver
   * Zero API key required, runs instantly in Chrome/Edge/Safari
   */
  startWebSpeechRecognition(onResult, onError) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Web Speech API is not supported in this browser. Please use Groq or Gemini audio recording.');
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event) => {
      if (onError) onError(event.error);
    };

    recognition.start();
    return recognition;
  }
}

export const zeroEditClient = new ZeroEditClient();
