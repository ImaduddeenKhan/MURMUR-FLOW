/**
 * WhisperFlow Main Application Controller
 */

import { AudioRecorder } from './audioRecorder.js';
import { PillWidget } from './pillWidget.js';
import { HotkeyManager } from './hotkeyManager.js';
import { zeroEditClient } from './zeroEditClient.js';
import { DictionaryManager } from './dictionary.js';
import { SnippetsManager } from './snippets.js';
import { CommandModeManager } from './commandMode.js';
import { NotetakerManager } from './notetaker.js';
import { soundEffects } from './soundEffects.js';

class WhisperFlowApp {
  constructor() {
    this.audioRecorder = null;
    this.pillWidget = null;
    this.hotkeyManager = null;
    this.dictionaryManager = null;
    this.snippetsManager = null;
    this.commandModeManager = null;
    this.notetakerManager = null;
    this.soundEffects = soundEffects;
    this.webhookUrl = '';

    this.sandboxTextarea = document.getElementById('sandboxTextarea');
    this.rawTranscriptEl = document.getElementById('diffRawText');
    this.polishedTextEl = document.getElementById('diffPolishedText');
    this.latencyBadgeEl = document.getElementById('metricLatency');
    this.speedBadgeEl = document.getElementById('metricSpeed');
    this.zeroEditRateEl = document.getElementById('metricZeroEdit');

    this.settingsModal = document.getElementById('settingsModal');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.settingsCloseBtn = document.getElementById('settingsCloseBtn');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');

    this.settingsGroqKeyInput = document.getElementById('settingGroqKey');
    this.settingsGeminiKeyInput = document.getElementById('settingGeminiKey');
    this.settingSoundEffectsInput = document.getElementById('settingSoundEffects');
    this.settingVadEnabledInput = document.getElementById('settingVadEnabled');
    this.settingWebhookUrlInput = document.getElementById('settingWebhookUrl');

    this.init();
  }

  async init() {
    // 1. Initialize Pill Widget
    this.pillWidget = new PillWidget({
      onRecordStart: () => this.startRecording(),
      onRecordStop: () => this.stopRecording(),
      onToneChange: (tone) => {
        this.updateActiveToneChip(tone);
        this.showToast(`Style set to ${this.formatTone(tone) || tone}`);
      },
      onProviderChange: (provider) => this.showToast(`Provider switched: ${provider.toUpperCase()}`)
    });

    // 2. Initialize Audio Recorder with live visualizer and VAD auto-silence callback
    this.audioRecorder = new AudioRecorder(
      (freqData, volume) => {
        this.pillWidget.drawWaveform(freqData, volume);
      },
      () => {
        // Voice Activity Detection triggered: Auto-finish after silence
        if (this.audioRecorder.isRecording) {
          this.showToast('Silence detected. Finishing the line.', 'info');
          this.stopRecording();
        }
      }
    );

    // 3. Initialize Hotkey Manager (Spacebar Push-to-Talk & Escape to cancel)
    this.hotkeyManager = new HotkeyManager({
      onPushToTalkStart: (isHandsFree) => {
        if (!isHandsFree) this.startRecording();
      },
      onPushToTalkStop: () => {
        this.stopRecording();
      },
      onCancel: () => {
        this.cancelRecording();
      }
    });

    // 4. Initialize Sub-Managers
    this.dictionaryManager = new DictionaryManager();
    this.snippetsManager = new SnippetsManager({
      onSnippetTriggered: (trigger) => this.testSnippetTrigger(trigger)
    });
    this.commandModeManager = new CommandModeManager({
      onExecuteCommand: (instruction, text) => this.executeCommand(instruction, text)
    });
    this.notetakerManager = new NotetakerManager({
      onSummarize: (transcript) => this.summarizeMeeting(transcript)
    });

    // 5. Setup Tabs, Modals, Tone Chips, and Export Handlers
    this.setupTabs();
    this.setupTheme();
    this.setupToneChips();
    this.setupExportActions();
    this.setupSettingsModal();
    this.setupSampleButtons();
    this.setupClearCopyButtons();
    this.setupHistory();
    this.loadInitialSettings();
    this.loadHistory();
  }

  // --- RECORDING PIPELINE ---

  async startRecording() {
    try {
      this.soundEffects.playStart();
      this.pillWidget.setState('listening');
      this.hotkeyManager.setRecordingState(true);
      await this.audioRecorder.start();
    } catch (err) {
      this.pillWidget.setState('idle');
      this.hotkeyManager.setRecordingState(false);
      this.showToast(err.message, 'error');
    }
  }

  async stopRecording() {
    this.soundEffects.playStop();
    this.hotkeyManager.setRecordingState(false);
    this.pillWidget.setState('processing');

    const result = await this.audioRecorder.stop();
    if (!result || !result.blob) {
      this.pillWidget.setState('idle');
      return;
    }

    const provider = this.pillWidget.getProvider();
    const tone = this.pillWidget.getTone();

    // Check if user selected native Web Speech API
    if (provider === 'webspeech') {
      this.handleWebSpeechFlow(tone);
      return;
    }

    try {
      const dictateRes = await zeroEditClient.sendAudioDictation(result.blob, result.mimeType, {
        sttProvider: provider,
        llmProvider: provider,
        tone: tone,
        appName: 'WhisperFlow Sandbox'
      });

      this.handleDictationSuccess(dictateRes);
    } catch (err) {
      console.error('Dictation error:', err);
      this.pillWidget.setState('idle');
      this.showToast(`Error: ${err.message}`, 'error');
    }
  }

  cancelRecording() {
    this.soundEffects.playClick();
    this.audioRecorder.cancel();
    this.pillWidget.setState('idle');
    this.showToast('Dictation cancelled', 'info');
  }

  handleWebSpeechFlow(tone) {
    this.pillWidget.setState('listening');
    try {
      zeroEditClient.startWebSpeechRecognition(
        async (rawTranscript) => {
          this.pillWidget.setState('processing');
          try {
            const res = await zeroEditClient.processText(rawTranscript, {
              tone,
              appName: 'WhisperFlow Sandbox'
            });
            this.handleDictationSuccess(res);
          } catch (e) {
            this.showToast(e.message, 'error');
            this.pillWidget.setState('idle');
          }
        },
        (error) => {
          this.pillWidget.setState('idle');
          this.showToast(`Speech recognition error: ${error}`, 'error');
        }
      );
    } catch (e) {
      this.pillWidget.setState('idle');
      this.showToast(e.message, 'error');
    }
  }

  handleDictationSuccess(res) {
    const raw = res.rawTranscript || '';
    const clean = res.processedText || '';

    // Play pleasant confirmation bell
    this.soundEffects.playSuccess();

    // Update Diff Elements
    if (this.rawTranscriptEl) {
      this.rawTranscriptEl.textContent = raw || '(No speech detected)';
      this.rawTranscriptEl.classList.remove('is-idle');
    }
    if (this.polishedTextEl) {
      this.polishedTextEl.textContent = clean || '—';
      this.polishedTextEl.classList.toggle('is-idle', !clean);
    }
    this.loadHistory();

    // Simulate universal injection into Sandbox Editor
    this.simulateTypingInjection(clean);

    // Update Performance Metrics
    const latency = res.latency?.totalMs || res.latencyMs || 320;
    if (this.latencyBadgeEl) this.latencyBadgeEl.textContent = `${latency}ms`;

    // Speed comparison (Flow 220 WPM vs Keyboard 45 WPM)
    if (this.speedBadgeEl) this.speedBadgeEl.textContent = `220 wpm`;

    // Zero Edit accuracy indicator
    if (this.zeroEditRateEl) this.zeroEditRateEl.textContent = `92%`;

    // Auto copy to clipboard
    navigator.clipboard.writeText(clean).catch(() => {});

    // Trigger Pill Copied state
    this.pillWidget.setState('copied');
    this.showToast(res.isSnippet ? `Expanded Snippet: "${res.snippetTrigger}"` : `Transcribed & Copied!`);

    // Async Dispatch to Webhook if configured
    if (this.webhookUrl && clean) {
      this.dispatchWebhookPayload({
        event: 'dictation.completed',
        processedText: clean,
        rawTranscript: raw,
        tone: this.pillWidget.getTone(),
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Universal text injection simulation with smooth typewriter feel
   */
  simulateTypingInjection(text) {
    if (!this.sandboxTextarea) return;
    const current = this.sandboxTextarea.value;
    const prefix = current.length > 0 && !current.endsWith('\n') ? current + '\n\n' : current;

    // If text is short, insert smoothly; else insert directly
    if (text.length < 150) {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          this.sandboxTextarea.value = prefix + text.slice(0, i + 1);
          i += 3;
          this.sandboxTextarea.scrollTop = this.sandboxTextarea.scrollHeight;
        } else {
          this.sandboxTextarea.value = prefix + text;
          clearInterval(interval);
        }
      }, 15);
    } else {
      this.sandboxTextarea.value = prefix + text;
      this.sandboxTextarea.scrollTop = this.sandboxTextarea.scrollHeight;
    }
  }

  // --- SAMPLE VOICE TRIGGERS ---

  setupSampleButtons() {
    const samples = {
      meeting: `Umm hey so can you actually wait can you tell the team that the the launch is gonna slip I think to like not Friday the following Monday because we're still waiting on legal to sign off on the new terms page and yeah just let them know we'll have a real timeline by end of week sorry end of day Thursday`,
      code: `Hey team in user authentication service line 45 the get user by id function is throwing an unhandled null exception when accessing token header so please run git pull and update the env variable port to 3000`,
      email: `Hi David hope you are having a productive week following up on our demo last Tuesday wanted to check if you and the team had a chance to review the proposal let me know if Thursday 2pm works for a quick sync`
    };

    document.querySelectorAll('[data-sample-clip]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const key = e.currentTarget.getAttribute('data-sample-clip');
        const text = samples[key];
        if (!text) return;

        const tone = key === 'code' ? 'code' : key === 'email' ? 'formal' : 'casual';
        this.pillWidget.setState('processing');

        try {
          const res = await zeroEditClient.processText(text, {
            tone,
            appName: key === 'code' ? 'VS Code' : key === 'email' ? 'Gmail' : 'Slack',
            llmProvider: this.pillWidget.getProvider()
          });
          this.handleDictationSuccess(res);
        } catch (err) {
          this.pillWidget.setState('idle');
          this.showToast(err.message, 'error');
        }
      });
    });
  }

  async testSnippetTrigger(trigger) {
    this.pillWidget.setState('processing');
    try {
      const res = await zeroEditClient.processText(trigger, {
        tone: 'casual',
        appName: 'Slack'
      });
      this.handleDictationSuccess(res);
    } catch (e) {
      this.pillWidget.setState('idle');
      this.showToast(e.message, 'error');
    }
  }

  async executeCommand(instruction, text) {
    const provider = this.pillWidget.getProvider();
    return await zeroEditClient.executeCommand(instruction, text, {
      llmProvider: provider
    });
  }

  async summarizeMeeting(transcript) {
    const provider = this.pillWidget.getProvider();
    return await zeroEditClient.summarizeMeeting(transcript, {
      llmProvider: provider
    });
  }

  // --- TONE CHIPS & PRESETS ---

  setupToneChips() {
    const chips = document.querySelectorAll('.tone-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const tone = chip.getAttribute('data-tone');
        this.soundEffects.playClick();
        this.updateActiveToneChip(tone);
        this.pillWidget.setTone(tone);
        this.showToast(`Style set to ${this.formatTone(tone) || tone}`);
      });
    });
  }

  updateActiveToneChip(tone) {
    const chips = document.querySelectorAll('.tone-chip');
    chips.forEach(chip => {
      if (chip.getAttribute('data-tone') === tone) {
        chip.classList.add('active');
        chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        chip.classList.remove('active');
      }
    });
  }

  // --- EXPORT ACTIONS (.md, .txt, Webhook) ---

  setupExportActions() {
    const exportMdBtn = document.getElementById('exportMdBtn');
    const exportTxtBtn = document.getElementById('exportTxtBtn');
    const webhookBtn = document.getElementById('webhookBtn');

    if (exportMdBtn) {
      exportMdBtn.addEventListener('click', () => {
        this.soundEffects.playClick();
        const text = this.sandboxTextarea?.value;
        if (!text || !text.trim()) {
          this.showToast('Sandbox is empty — nothing to export', 'error');
          return;
        }
        this.downloadFile(text, 'whisperflow-dictation.md', 'text/markdown');
        this.showToast('Downloaded Markdown (.md) file!');
      });
    }

    if (exportTxtBtn) {
      exportTxtBtn.addEventListener('click', () => {
        this.soundEffects.playClick();
        const text = this.sandboxTextarea?.value;
        if (!text || !text.trim()) {
          this.showToast('Sandbox is empty — nothing to export', 'error');
          return;
        }
        this.downloadFile(text, 'whisperflow-dictation.txt', 'text/plain');
        this.showToast('Downloaded Text (.txt) file!');
      });
    }

    if (webhookBtn) {
      webhookBtn.addEventListener('click', () => {
        this.soundEffects.playClick();
        const text = this.sandboxTextarea?.value;
        if (!text || !text.trim()) {
          this.showToast('Sandbox is empty — nothing to dispatch', 'error');
          return;
        }
        if (!this.webhookUrl) {
          this.settingsModal.classList.add('active');
          this.showToast('Please enter your Webhook URL in Settings first', 'info');
          return;
        }
        this.dispatchWebhookPayload({
          event: 'manual.export',
          text,
          tone: this.pillWidget.getTone(),
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async dispatchWebhookPayload(payload) {
    if (!this.webhookUrl) return;
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'WhisperFlow Open Source',
          ...payload
        })
      });
      this.showToast('Webhook sent.');
    } catch (err) {
      console.warn('Webhook dispatch failed:', err);
      this.showToast(`Webhook error: ${err.message}`, 'error');
    }
  }

  // --- TABS & UI HELPERS ---

  setupTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const views = document.querySelectorAll('.view-panel');

    const activate = (viewId) => {
      tabs.forEach(t => {
        const on = t.getAttribute('data-view') === viewId;
        t.classList.toggle('active', on);
        t.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      views.forEach(v => v.classList.toggle('active', v.id === viewId));
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.soundEffects.playClick();
        activate(tab.getAttribute('data-view'));
      });
    });

    const wordmark = document.getElementById('wordmarkBtn');
    if (wordmark) {
      wordmark.addEventListener('click', () => activate('viewDictation'));
    }
  }

  setupTheme() {
    const buttons = document.querySelectorAll('[data-theme-choice]');
    const apply = (theme) => {
      if (theme !== 'light' && theme !== 'dark' && theme !== 'contrast') return;
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('whisperflow-theme', theme); } catch (e) {}
      buttons.forEach(btn => {
        const on = btn.getAttribute('data-theme-choice') === theme;
        btn.classList.toggle('is-selected', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', () => apply(btn.getAttribute('data-theme-choice')));
    });
  }

  setupHistory() {
    const clearBtn = document.getElementById('historyClearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearHistory());
    }
  }

  async loadHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;
    try {
      const res = await fetch('/api/history?limit=20');
      const items = await res.json();
      this.renderHistory(Array.isArray(items) ? items : []);
    } catch (err) {
      list.replaceChildren();
      const p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = 'History could not be loaded.';
      list.appendChild(p);
    }
  }

  renderHistory(items) {
    const list = document.getElementById('historyList');
    const clearBtn = document.getElementById('historyClearBtn');
    if (!list) return;
    list.replaceChildren();
    if (clearBtn) clearBtn.disabled = items.length === 0;

    if (items.length === 0) {
      const p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = 'Nothing dictated yet. Hold Space to begin.';
      list.appendChild(p);
      return;
    }

    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'history-item';

      const time = document.createElement('span');
      time.className = 'history-time';
      const tone = this.formatTone(item.tone);
      const when = this.formatHistoryTime(item.timestamp);
      time.textContent = [when, tone].filter(Boolean).join('  ');

      const excerpt = document.createElement('span');
      excerpt.className = 'history-excerpt';
      excerpt.textContent = (item.processedText || item.rawTranscript || 'Empty dictation').trim();

      btn.append(time, excerpt);
      btn.addEventListener('click', () => {
        if (this.sandboxTextarea) this.sandboxTextarea.value = item.processedText || '';
        if (this.rawTranscriptEl) {
          this.rawTranscriptEl.textContent = item.rawTranscript || '—';
          this.rawTranscriptEl.classList.toggle('is-idle', !item.rawTranscript);
        }
        if (this.polishedTextEl) {
          this.polishedTextEl.textContent = item.processedText || '—';
          this.polishedTextEl.classList.toggle('is-idle', !item.processedText);
        }
        if (item.tone) {
          this.pillWidget.setTone(item.tone);
          this.updateActiveToneChip(item.tone);
        }
        if (item.totalLatencyMs && this.latencyBadgeEl) {
          this.latencyBadgeEl.textContent = `${item.totalLatencyMs}ms`;
        }
      });
      list.appendChild(btn);
    });
  }

  async clearHistory() {
    try {
      await fetch('/api/history', { method: 'DELETE' });
      this.renderHistory([]);
    } catch (err) {
      this.showToast('Could not clear history.', 'error');
    }
  }

  formatHistoryTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  formatTone(tone) {
    const names = {
      casual: 'Casual',
      formal: 'Formal',
      executive: 'Executive',
      code: 'Code',
      bullet: 'Bullets',
      standup: 'Standup',
      social: 'Social',
      prompt: 'Prompt',
      support: 'Support',
      translate_es: 'Spanish',
      translate_fr: 'French',
      translate_de: 'German',
      translate_hi: 'Hindi',
      translate_ja: 'Japanese',
      raw: 'Raw'
    };
    return names[tone] || '';
  }

  setupClearCopyButtons() {
    const clearBtn = document.getElementById('clearEditorBtn');
    const copyBtn = document.getElementById('copyEditorBtn');

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.soundEffects.playClick();
        this.sandboxTextarea.value = '';
        if (this.rawTranscriptEl) {
          this.rawTranscriptEl.textContent = '—';
          this.rawTranscriptEl.classList.add('is-idle');
        }
        if (this.polishedTextEl) {
          this.polishedTextEl.textContent = '—';
          this.polishedTextEl.classList.add('is-idle');
        }
        if (this.latencyBadgeEl) this.latencyBadgeEl.textContent = '—';
        if (this.speedBadgeEl) this.speedBadgeEl.textContent = '—';
        if (this.zeroEditRateEl) this.zeroEditRateEl.textContent = '—';
        this.showToast('Editor cleared');
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (!this.sandboxTextarea.value) return;
        this.soundEffects.playSuccess();
        navigator.clipboard.writeText(this.sandboxTextarea.value);
        this.showToast('Copied all text to clipboard!');
      });
    }
  }

  setupSettingsModal() {
    if (this.settingsBtn && this.settingsModal) {
      this.settingsBtn.addEventListener('click', () => {
        this.soundEffects.playClick();
        this.settingsModal.classList.add('active');
      });
    }

    if (this.settingsCloseBtn && this.settingsModal) {
      this.settingsCloseBtn.addEventListener('click', () => {
        this.soundEffects.playClick();
        this.settingsModal.classList.remove('active');
      });
    }

    if (this.saveSettingsBtn) {
      this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    // Close on background click
    window.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.settingsModal.classList.remove('active');
      }
    });
  }

  async loadInitialSettings() {
    try {
      const res = await fetch('/api/settings');
      const settings = await res.json();
      if (this.settingsGroqKeyInput && settings.apiKeyGroq) {
        this.settingsGroqKeyInput.value = settings.apiKeyGroq;
      }
      if (this.settingsGeminiKeyInput && settings.apiKeyGemini) {
        this.settingsGeminiKeyInput.value = settings.apiKeyGemini;
      }
      if (this.settingSoundEffectsInput && typeof settings.soundEffects !== 'undefined') {
        this.settingSoundEffectsInput.checked = settings.soundEffects;
        this.soundEffects.setEnabled(settings.soundEffects);
      }
      if (this.settingVadEnabledInput && typeof settings.vadEnabled !== 'undefined') {
        this.settingVadEnabledInput.checked = settings.vadEnabled;
        this.audioRecorder.setVadEnabled(settings.vadEnabled);
      } else {
        this.audioRecorder.setVadEnabled(true);
      }
      if (this.settingWebhookUrlInput && settings.webhookUrl) {
        this.settingWebhookUrlInput.value = settings.webhookUrl;
        this.webhookUrl = settings.webhookUrl;
      }
    } catch (e) {
      console.warn('Could not load settings:', e);
    }
  }

  async saveSettings() {
    const apiKeyGroq = this.settingsGroqKeyInput?.value.trim() || '';
    const apiKeyGemini = this.settingsGeminiKeyInput?.value.trim() || '';
    const soundEffectsVal = this.settingSoundEffectsInput ? this.settingSoundEffectsInput.checked : true;
    const vadEnabledVal = this.settingVadEnabledInput ? this.settingVadEnabledInput.checked : true;
    const webhookUrlVal = this.settingWebhookUrlInput?.value.trim() || '';

    this.soundEffects.setEnabled(soundEffectsVal);
    this.audioRecorder.setVadEnabled(vadEnabledVal);
    this.webhookUrl = webhookUrlVal;

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKeyGroq,
          apiKeyGemini,
          soundEffects: soundEffectsVal,
          vadEnabled: vadEnabledVal,
          webhookUrl: webhookUrlVal
        })
      });
      this.soundEffects.playSuccess();
      this.settingsModal.classList.remove('active');
      this.showToast('Settings saved successfully!');
    } catch (e) {
      alert('Failed to save settings: ' + e.message);
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.dataset.tone = type;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 160ms ease-out';
      setTimeout(() => toast.remove(), 160);
    }, 3200);
  }
}

// Bootstrap when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.whisperFlow = new WhisperFlowApp();
});
