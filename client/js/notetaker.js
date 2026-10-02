/**
 * WhisperFlow Notetaker Controller
 */

export class NotetakerManager {
  constructor({ onSummarize }) {
    this.onSummarize = onSummarize;
    this.streamContainer = document.getElementById('notetakerStream');
    this.summaryContainer = document.getElementById('notetakerSummary');
    this.summarizeBtn = document.getElementById('notetakerSummarizeBtn');
    this.sampleMeetingBtn = document.getElementById('notetakerSampleBtn');
    this.copyMdBtn = document.getElementById('notetakerCopyMdBtn');
    this.exportClaudeBtn = document.getElementById('notetakerClaudeBtn');
    this.exportGptBtn = document.getElementById('notetakerGptBtn');

    this.currentTranscript = '';
    this.init();
  }

  init() {
    if (this.sampleMeetingBtn) {
      this.sampleMeetingBtn.addEventListener('click', () => this.loadSampleMeeting());
    }

    if (this.summarizeBtn) {
      this.summarizeBtn.addEventListener('click', () => this.generateSummary());
    }

    if (this.copyMdBtn) {
      this.copyMdBtn.addEventListener('click', () => {
        const text = this.summaryContainer.innerText;
        navigator.clipboard.writeText(text);
        this.copyMdBtn.textContent = 'Copied';
        setTimeout(() => (this.copyMdBtn.textContent = 'Copy Markdown'), 2000);
      });
    }

    if (this.exportClaudeBtn) {
      this.exportClaudeBtn.addEventListener('click', () => {
        const prompt = `Here are the meeting notes from Wispr Flow Notetaker:\n\n${this.summaryContainer.innerText}\n\nPlease draft follow-up emails to the owners with their respective action items.`;
        navigator.clipboard.writeText(prompt);
        this.exportClaudeBtn.textContent = 'Copied';
        setTimeout(() => (this.exportClaudeBtn.textContent = 'Claude prompt'), 2000);
      });
    }

    if (this.exportGptBtn) {
      this.exportGptBtn.addEventListener('click', () => {
        const prompt = `Context from our meeting notes:\n\n${this.summaryContainer.innerText}\n\nPlease convert these action items into Jira / Linear ticket descriptions.`;
        navigator.clipboard.writeText(prompt);
        this.exportGptBtn.textContent = 'Copied';
        setTimeout(() => (this.exportGptBtn.textContent = 'ChatGPT prompt'), 2000);
      });
    }

    // Default sample meeting on first load
    this.loadSampleMeeting();
  }

  loadSampleMeeting() {
    const sampleConversation = [
      {
        speaker: 'Nathalie',
        role: 'nathalie',
        time: '00:15',
        text: 'Stephen, how is the process review going? What is slowing us down most right now?'
      },
      {
        speaker: 'Stephen',
        role: 'stephen',
        time: '00:32',
        text: "Too many approvals along the way. Especially with design handoffs. I'd give <em>Raphael</em> carte blanche on the frontend components."
      },
      {
        speaker: 'Mikel',
        role: 'mikel',
        time: '00:54',
        text: "That's always been an issue. What about all the daily status check-in meetings?"
      },
      {
        speaker: 'Stephen',
        role: 'stephen',
        time: '01:10',
        text: 'I think we can lose half of them. Most ad-hoc updates can go straight into <em>Asana</em>.'
      },
      {
        speaker: 'Nathalie',
        role: 'nathalie',
        time: '01:25',
        text: "That's music to my ears. Can you present the <em>Miro board</em> on Monday?"
      },
      {
        speaker: 'Stephen',
        role: 'stephen',
        time: '01:40',
        text: 'Tuesday is better. I want to run it by <em>Siobhan</em> first to verify timeline.'
      },
      {
        speaker: 'Mikel',
        role: 'mikel',
        time: '01:55',
        text: 'Great, I will add it to the team calendar. Nathalie, make sure the <em>Tableau</em> metrics dashboard is ready.'
      },
      {
        speaker: 'Nathalie',
        role: 'nathalie',
        time: '02:08',
        text: "I'm on it! I'll ping legal for the terms page signoff too."
      }
    ];

    this.renderTranscriptStream(sampleConversation);
    this.currentTranscript = sampleConversation.map(c => `${c.speaker}: ${c.text.replace(/<[^>]*>/g, '')}`).join('\n');
  }

  renderTranscriptStream(conversation) {
    if (!this.streamContainer) return;
    this.streamContainer.innerHTML = conversation.map(turn => `
      <div class="speaker-turn">
        <div class="speaker-meta">
          <span class="speaker-tag ${turn.role}">${turn.speaker}</span>
          <span class="speaker-timestamp">${turn.time}</span>
        </div>
        <div class="speaker-text">${turn.text}</div>
      </div>
    `).join('');
  }

  async generateSummary() {
    if (!this.currentTranscript) return;
    this.summarizeBtn.disabled = true;
    this.summarizeBtn.textContent = 'Writing notes…';

    try {
      if (this.onSummarize) {
        const result = await this.onSummarize(this.currentTranscript);
        this.renderMarkdownSummary(result.summary);
      }
    } catch (err) {
      alert('Failed to summarize: ' + err.message);
    } finally {
      this.summarizeBtn.disabled = false;
      this.summarizeBtn.textContent = 'Generate notes';
    }
  }

  renderMarkdownSummary(markdown) {
    if (!this.summaryContainer) return;
    // Simple fast markdown to HTML formatter for the preview
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^- \[ \] (.*$)/gim, '<li style="list-style: none;"><input type="checkbox" style="margin-right: 8px;"> $1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/gim, '<br/><br/>');

    this.summaryContainer.innerHTML = html;
  }
}
