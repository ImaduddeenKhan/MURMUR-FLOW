/**
 * WhisperFlow Voice Snippets Controller
 */

export class SnippetsManager {
  constructor({ onSnippetTriggered }) {
    this.onSnippetTriggered = onSnippetTriggered;
    this.listContainer = document.getElementById('snippetsList');
    this.triggerInput = document.getElementById('snipTriggerInput');
    this.contentInput = document.getElementById('snipContentInput');
    this.descInput = document.getElementById('snipDescInput');
    this.addBtn = document.getElementById('snipAddBtn');

    this.init();
  }

  init() {
    if (this.addBtn) {
      this.addBtn.addEventListener('click', () => this.handleAdd());
    }
    this.load();
  }

  async load() {
    try {
      const res = await fetch('/api/snippets');
      const items = await res.json();
      this.render(items);
    } catch (err) {
      console.warn('Could not load snippets:', err.message);
    }
  }

  render(items) {
    if (!this.listContainer) return;
    if (items.length === 0) {
      this.listContainer.innerHTML = `<p class="empty-state">No snippets yet. Save a phrase you paste often.</p>`;
      return;
    }

    this.listContainer.innerHTML = items.map(item => `
      <article class="list-row">
        <div class="list-row-top">
          <div>
            <p class="list-kicker">${this.escape(item.trigger)}</p>
            <p class="hint">${this.escape(item.description || 'Snippet')}</p>
          </div>
          <div class="list-row-actions">
            <button type="button" class="btn-quiet" data-test-trigger="${this.escape(item.trigger)}">Try</button>
            <button type="button" class="btn-quiet" data-delete-snip="${item.id}">Remove</button>
          </div>
        </div>
        <pre class="snippet-body">${this.escape(item.content)}</pre>
      </article>
    `).join('');

    // Attach test & delete listeners
    this.listContainer.querySelectorAll('[data-test-trigger]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const trigger = e.currentTarget.getAttribute('data-test-trigger');
        if (this.onSnippetTriggered) this.onSnippetTriggered(trigger);
      });
    });

    this.listContainer.querySelectorAll('[data-delete-snip]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-delete-snip');
        this.delete(id);
      });
    });
  }

  async handleAdd() {
    const trigger = this.triggerInput.value.trim();
    const content = this.contentInput.value.trim();
    const description = this.descInput.value.trim();

    if (!trigger || !content) {
      alert('Trigger phrase and Expansion content are required.');
      return;
    }

    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger, content, description })
      });
      const data = await res.json();
      if (data.snippets) {
        this.render(data.snippets);
        this.triggerInput.value = '';
        this.contentInput.value = '';
        this.descInput.value = '';
      }
    } catch (err) {
      alert('Failed to add snippet: ' + err.message);
    }
  }

  async delete(id) {
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.snippets) {
        this.render(data.snippets);
      }
    } catch (err) {
      alert('Failed to delete snippet: ' + err.message);
    }
  }

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
