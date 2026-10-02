/**
 * WhisperFlow Personal Dictionary Controller
 */

export class DictionaryManager {
  constructor() {
    this.listContainer = document.getElementById('dictionaryList');
    this.wordInput = document.getElementById('dictWordInput');
    this.categorySelect = document.getElementById('dictCategorySelect');
    this.hintInput = document.getElementById('dictHintInput');
    this.addBtn = document.getElementById('dictAddBtn');

    this.init();
  }

  init() {
    if (this.addBtn) {
      this.addBtn.addEventListener('click', () => this.handleAdd());
    }
    if (this.wordInput) {
      this.wordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleAdd();
      });
    }
    this.load();
  }

  async load() {
    try {
      const res = await fetch('/api/dictionary');
      const items = await res.json();
      this.render(items);
    } catch (err) {
      console.warn('Could not load dictionary:', err.message);
    }
  }

  render(items) {
    if (!this.listContainer) return;
    if (items.length === 0) {
      this.listContainer.innerHTML = `<p class="empty-state">No words yet. Add a name or term you want spelled correctly.</p>`;
      return;
    }

    this.listContainer.innerHTML = items.map(item => `
      <article class="list-row">
        <div>
          <p class="list-word">${this.escape(item.word)}</p>
          <p class="hint">${this.escape(item.category || 'general')}${item.hint ? ` · ${this.escape(item.hint)}` : ''}</p>
        </div>
        <button type="button" class="btn-quiet" data-delete-id="${item.id}">Remove</button>
      </article>
    `).join('');

    // Attach delete listeners
    this.listContainer.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-delete-id');
        this.delete(id);
      });
    });
  }

  async handleAdd() {
    const word = this.wordInput.value.trim();
    if (!word) return;

    const category = this.categorySelect.value;
    const hint = this.hintInput.value.trim();

    try {
      const res = await fetch('/api/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, category, hint })
      });
      const data = await res.json();
      if (data.dictionary) {
        this.render(data.dictionary);
        this.wordInput.value = '';
        this.hintInput.value = '';
        this.wordInput.focus();
      }
    } catch (err) {
      alert('Failed to add word: ' + err.message);
    }
  }

  async delete(id) {
    try {
      const res = await fetch(`/api/dictionary/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.dictionary) {
        this.render(data.dictionary);
      }
    } catch (err) {
      alert('Failed to delete word: ' + err.message);
    }
  }

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
