/**
 * Picks a tone from the app the user is dictating into.
 *
 * The desktop companion sends the foreground process name (for example
 * "slack.exe" or "Code") and the window title. Browser apps such as Gmail only
 * show up in the title, so title rules are checked before process rules.
 */

export const DEFAULT_APP_TONE_RULES = [
  // Web apps inside a browser. Matched on the window title.
  { label: 'Gmail', tone: 'formal', titleIncludes: ['gmail'] },
  { label: 'Outlook', tone: 'formal', titleIncludes: ['outlook'] },
  { label: 'Proton Mail', tone: 'formal', titleIncludes: ['proton mail'] },
  { label: 'Google Docs', tone: 'formal', titleIncludes: ['google docs'] },
  { label: 'Slack', tone: 'casual', titleIncludes: ['slack'] },
  { label: 'Discord', tone: 'casual', titleIncludes: ['discord'] },
  { label: 'WhatsApp', tone: 'casual', titleIncludes: ['whatsapp'] },
  { label: 'Telegram', tone: 'casual', titleIncludes: ['telegram'] },
  { label: 'GitHub', tone: 'code', titleIncludes: ['github'] },

  // Desktop apps. Matched on the process or app name.
  { label: 'VS Code', tone: 'code', process: ['code', 'code - insiders', 'visual studio code'] },
  { label: 'Cursor', tone: 'code', process: ['cursor'] },
  { label: 'Windsurf', tone: 'code', process: ['windsurf'] },
  { label: 'JetBrains IDE', tone: 'code', process: ['idea', 'idea64', 'pycharm', 'pycharm64', 'webstorm', 'webstorm64', 'goland', 'goland64', 'rider', 'rider64', 'clion', 'clion64', 'phpstorm', 'phpstorm64', 'android studio', 'studio64'] },
  { label: 'Visual Studio', tone: 'code', process: ['devenv'] },
  { label: 'Sublime Text', tone: 'code', process: ['sublime_text', 'sublime text'] },
  { label: 'Zed', tone: 'code', process: ['zed'] },
  { label: 'Xcode', tone: 'code', process: ['xcode'] },
  { label: 'Terminal', tone: 'code', process: ['windowsterminal', 'powershell', 'pwsh', 'cmd', 'terminal', 'iterm2', 'warp', 'alacritty', 'wezterm', 'wezterm-gui', 'kitty', 'gnome-terminal-server', 'konsole'] },
  { label: 'Slack', tone: 'casual', process: ['slack'] },
  { label: 'Discord', tone: 'casual', process: ['discord'] },
  { label: 'WhatsApp', tone: 'casual', process: ['whatsapp'] },
  { label: 'Telegram', tone: 'casual', process: ['telegram'] },
  { label: 'Signal', tone: 'casual', process: ['signal'] },
  { label: 'Microsoft Teams', tone: 'casual', process: ['ms-teams', 'teams', 'microsoft teams'] },
  { label: 'Outlook', tone: 'formal', process: ['outlook', 'olk', 'microsoft outlook'] },
  { label: 'Mail', tone: 'formal', process: ['mail', 'thunderbird'] },
  { label: 'Word', tone: 'formal', process: ['winword', 'microsoft word'] }
];

function normalizeProcess(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\.(exe|app)$/, '');
}

/**
 * Returns the first rule that matches the window, or null.
 * Title rules win over process rules because a browser window is one process
 * that can show Gmail in one tab and Slack in another.
 */
export function matchAppRule({ processName, windowTitle } = {}, rules = DEFAULT_APP_TONE_RULES) {
  const title = String(windowTitle || '').toLowerCase();
  const proc = normalizeProcess(processName);

  if (title) {
    const byTitle = rules.find(rule =>
      Array.isArray(rule.titleIncludes) &&
      rule.titleIncludes.some(fragment => title.includes(String(fragment).toLowerCase()))
    );
    if (byTitle) return byTitle;
  }

  if (proc) {
    const byProcess = rules.find(rule =>
      Array.isArray(rule.process) &&
      rule.process.some(name => normalizeProcess(name) === proc)
    );
    if (byProcess) return byProcess;
  }

  return null;
}

/**
 * Resolves the tone for a request. Only `tone: "auto"` is resolved; any
 * explicit tone the user picked is kept.
 */
export function resolveTone({ tone, processName, windowTitle, appName } = {}, { rules, fallbackTone = 'casual' } = {}) {
  if (tone && tone !== 'auto') {
    return { tone, appLabel: appName || 'General', source: 'manual' };
  }

  const activeRules = Array.isArray(rules) && rules.length > 0 ? rules : DEFAULT_APP_TONE_RULES;
  const rule = matchAppRule({ processName, windowTitle }, activeRules);

  if (rule) {
    return { tone: rule.tone, appLabel: rule.label, source: 'app-rule' };
  }

  const fallback = fallbackTone === 'auto' ? 'casual' : fallbackTone;
  return { tone: fallback, appLabel: appName || 'General', source: 'default' };
}
