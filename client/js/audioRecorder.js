/**
 * WhisperFlow Audio Recorder & Live Analyser
 * Captures 16kHz microphone audio with real-time waveform visualization
 */

export class AudioRecorder {
  constructor(onWaveformUpdate, onSilenceDetected) {
    this.onWaveformUpdate = onWaveformUpdate;
    this.onSilenceDetected = onSilenceDetected;
    this.mediaRecorder = null;
    this.audioStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.animFrameId = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.startTime = 0;
    
    // Voice Activity Detection (VAD) Settings
    this.vadEnabled = false;
    this.vadSilenceMs = 1800; // 1.8 seconds of silence to auto-finish
    this.lastSpokenTime = 0;
    this.hasSpoken = false;
    this.silenceThreshold = 6;
  }

  setVadEnabled(enabled, silenceMs = 1800) {
    this.vadEnabled = Boolean(enabled);
    this.vadSilenceMs = silenceMs;
  }

  async start() {
    if (this.isRecording) return;
    this.audioChunks = [];

    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Initialize Web Audio API for Live Waveform Analysis
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Determine supported mime type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      let selectedMime = 'audio/webm';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      this.mediaRecorder = new MediaRecorder(this.audioStream, { mimeType: selectedMime });
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // 100ms time slice
      this.isRecording = true;
      this.startTime = Date.now();
      this.lastSpokenTime = Date.now();
      this.hasSpoken = false;

      this.startWaveformLoop();
    } catch (err) {
      console.error('Microphone access failed:', err);
      throw new Error(`Microphone access error: ${err.message}. You can still use Sample Audio triggers or Web Speech.`);
    }
  }

  startWaveformLoop() {
    const loop = () => {
      if (!this.isRecording) return;
      this.analyser.getByteFrequencyData(this.dataArray);

      // Calculate root mean square (volume)
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const avg = sum / this.dataArray.length;

      // Voice Activity Detection (VAD) Logic
      const now = Date.now();
      if (avg > this.silenceThreshold) {
        this.hasSpoken = true;
        this.lastSpokenTime = now;
      } else if (this.vadEnabled && this.hasSpoken && (now - this.lastSpokenTime > this.vadSilenceMs)) {
        // User spoke and then was silent for vadSilenceMs
        if (this.onSilenceDetected) {
          this.onSilenceDetected();
          return; // Stop animation loop
        }
      }

      if (this.onWaveformUpdate) {
        this.onWaveformUpdate(this.dataArray, avg);
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.isRecording || !this.mediaRecorder) {
        this.cleanup();
        return resolve(null);
      }

      const durationMs = Date.now() - this.startTime;

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.cleanup();
        resolve({ blob: audioBlob, mimeType, durationMs });
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  cancel() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  cleanup() {
    this.isRecording = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.audioChunks = [];
  }
}
