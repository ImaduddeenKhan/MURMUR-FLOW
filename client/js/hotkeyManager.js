/**
 * WhisperFlow Hotkey & Push-to-Talk Manager
 */

export class HotkeyManager {
  constructor({ onPushToTalkStart, onPushToTalkStop, onCancel }) {
    this.onPushToTalkStart = onPushToTalkStart;
    this.onPushToTalkStop = onPushToTalkStop;
    this.onCancel = onCancel;

    this.isKeyDown = false;
    this.lastKeyPressTime = 0;
    this.doubleTapThreshold = 300; // ms
    this.isRecording = false;

    this.init();
  }

  init() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  isInputFocused() {
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || active.isContentEditable;
  }

  handleKeyDown(e) {
    // 1. Escape cancels recording anytime
    if (e.key === 'Escape') {
      if (this.isRecording) {
        e.preventDefault();
        this.isRecording = false;
        this.isKeyDown = false;
        if (this.onCancel) this.onCancel();
      }
      return;
    }

    // 2. Spacebar Push-To-Talk (when not focused on a text box)
    if (e.code === 'Space' && !this.isInputFocused()) {
      e.preventDefault();

      if (this.isKeyDown) return; // Prevent auto-repeat events
      this.isKeyDown = true;

      const now = Date.now();
      const timeSinceLast = now - this.lastKeyPressTime;
      this.lastKeyPressTime = now;

      // Double tap detected -> Hands-free toggle
      if (timeSinceLast < this.doubleTapThreshold) {
        if (this.isRecording) {
          this.isRecording = false;
          if (this.onPushToTalkStop) this.onPushToTalkStop();
        } else {
          this.isRecording = true;
          if (this.onPushToTalkStart) this.onPushToTalkStart(true);
        }
        return;
      }

      // Normal Push-to-Talk Start
      if (!this.isRecording) {
        this.isRecording = true;
        if (this.onPushToTalkStart) this.onPushToTalkStart(false);
      }
    }
  }

  handleKeyUp(e) {
    if (e.code === 'Space' && this.isKeyDown) {
      this.isKeyDown = false;

      // If in normal push-to-talk (not locked hands-free), key up stops recording
      if (this.isRecording) {
        this.isRecording = false;
        if (this.onPushToTalkStop) this.onPushToTalkStop();
      }
    }
  }

  setRecordingState(isRec) {
    this.isRecording = isRec;
  }
}
