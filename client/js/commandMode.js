/**
 * WhisperFlow Command Mode (Voice-to-Action Text Editing)
 */

export class CommandModeManager {
  constructor({ onExecuteCommand }) {
    this.onExecuteCommand = onExecuteCommand;
    this.sourceText = document.getElementById('cmdSourceText');
    this.instructionInput = document.getElementById('cmdInstructionInput');
    this.runBtn = document.getElementById('cmdRunBtn');
    this.resultContainer = document.getElementById('cmdResultContainer');
    this.resultText = document.getElementById('cmdResultText');
    this.copyBtn = document.getElementById('cmdCopyBtn');

    this.init();
  }

  init() {
    if (this.runBtn) {
      this.runBtn.addEventListener('click', () => this.handleRun());
    }

    if (this.copyBtn) {
      this.copyBtn.addEventListener('click', () => {
        const text = this.resultText.textContent;
        if (text) {
          navigator.clipboard.writeText(text);
          this.copyBtn.textContent = 'Copied';
          setTimeout(() => (this.copyBtn.textContent = 'Copy'), 2000);
        }
      });
    }

    // Attach preset command quick-buttons
    document.querySelectorAll('[data-cmd-preset]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cmd = e.currentTarget.getAttribute('data-cmd-preset');
        if (this.instructionInput) {
          this.instructionInput.value = cmd;
          this.handleRun();
        }
      });
    });
  }

  async handleRun() {
    const text = this.sourceText.value.trim();
    const instruction = this.instructionInput.value.trim();

    if (!text) {
      alert('Please provide some source text to transform.');
      return;
    }
    if (!instruction) {
      alert('Please enter or speak a voice command instruction.');
      return;
    }

    this.runBtn.disabled = true;
    this.runBtn.textContent = 'Running…';

    try {
      if (this.onExecuteCommand) {
        const result = await this.onExecuteCommand(instruction, text);
        if (this.resultContainer && this.resultText) {
          this.resultContainer.style.display = 'block';
          this.resultText.textContent = result.transformedText;
        }
      }
    } catch (err) {
      alert('Command failed: ' + err.message);
    } finally {
      this.runBtn.disabled = false;
      this.runBtn.textContent = 'Run';
    }
  }
}
