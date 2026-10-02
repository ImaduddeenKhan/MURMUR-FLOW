/**
 * WhisperFlow Floating Pill / Dynamic Island Controller
 */

export class PillWidget {
  constructor({ onRecordStart, onRecordStop, onToneChange, onProviderChange }) {
    this.onRecordStart = onRecordStart;
    this.onRecordStop = onRecordStop;
    this.onToneChange = onToneChange;
    this.onProviderChange = onProviderChange;

    this.container = document.getElementById('floatingPill');
    this.pill = document.getElementById('flowPill');
    this.micBtn = document.getElementById('pillMicBtn');
    this.statusText = document.getElementById('pillStatusText');
    this.canvas = document.getElementById('pillWaveform');
    this.spinner = document.getElementById('pillSpinner');
    this.toneSelect = document.getElementById('pillToneSelect');
    this.providerSelect = document.getElementById('pillProviderSelect');
    this.handsFreeBtn = document.getElementById('pillHandsFreeBtn');

    this.state = 'idle'; // 'idle' | 'listening' | 'processing' | 'copied'
    this.isHandsFree = false;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.initEventListeners();
  }

  initEventListeners() {
    // Mic Button Click
    this.micBtn.addEventListener('click', () => {
      if (this.state === 'idle') {
        this.onRecordStart();
      } else if (this.state === 'listening') {
        this.onRecordStop();
      }
    });

    // Tone Select Change
    if (this.toneSelect) {
      this.toneSelect.addEventListener('change', (e) => {
        if (this.onToneChange) this.onToneChange(e.target.value);
      });
    }

    // Provider Select Change
    if (this.providerSelect) {
      this.providerSelect.addEventListener('change', (e) => {
        if (this.onProviderChange) this.onProviderChange(e.target.value);
      });
    }

    // Hands-Free Mode Toggle
    if (this.handsFreeBtn) {
      this.handsFreeBtn.addEventListener('click', () => {
        this.isHandsFree = !this.isHandsFree;
        this.handsFreeBtn.classList.toggle('is-active', this.isHandsFree);
        this.handsFreeBtn.setAttribute('aria-pressed', this.isHandsFree ? 'true' : 'false');
        this.updateStatusText();
      });
    }
  }

  setState(state, customMessage) {
    this.state = state;
    this.pill.classList.remove('is-listening', 'is-processing', 'is-copied');

    switch (state) {
      case 'listening':
        this.pill.classList.add('is-listening');
        this.statusText.textContent = customMessage || 'Listening';
        break;

      case 'processing':
        this.pill.classList.add('is-processing');
        this.statusText.textContent = customMessage || 'Cleaning up';
        break;

      case 'copied':
        this.pill.classList.add('is-copied');
        this.statusText.textContent = 'Copied';
        setTimeout(() => {
          if (this.state === 'copied') {
            this.setState('idle');
          }
        }, 2200);
        break;

      case 'idle':
      default:
        this.updateStatusText();
        this.clearWaveform();
        break;
    }
  }

  updateStatusText() {
    this.statusText.textContent = this.isHandsFree ? 'Hands-free' : 'Hold Space';
  }

  drawWaveform(frequencyData, volume) {
    if (!this.ctx || this.state !== 'listening') return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    this.ctx.clearRect(0, 0, width, height);

    const barCount = 9;
    const barWidth = 2;
    const gap = 4;
    const startX = (width - (barCount * (barWidth + gap) - gap)) / 2;
    const color = getComputedStyle(this.canvas).color || '#f4f1ec';

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor(i * (frequencyData.length / barCount));
      const value = frequencyData[dataIndex] || 0;
      const barHeight = Math.max(2, (value / 255) * height);
      const x = startX + i * (barWidth + gap);
      const y = (height - barHeight) / 2;

      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  clearWaveform() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  getTone() {
    return this.toneSelect ? this.toneSelect.value : 'casual';
  }

  setTone(tone) {
    if (this.toneSelect) {
      this.toneSelect.value = tone;
    }
  }

  getProvider() {
    return this.providerSelect ? this.providerSelect.value : 'groq';
  }

  setProvider(provider) {
    if (this.providerSelect) {
      this.providerSelect.value = provider;
    }
  }
}

