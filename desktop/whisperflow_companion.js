/**
 * WhisperFlow Node.js Desktop Companion
 * Provides CLI & terminal-based injection or webhook trigger for cross-platform workflows.
 * Usage:
 *   node desktop/whisperflow_companion.js --server http://localhost:3050 --tone formal
 */

import readline from 'readline';

const args = process.argv.slice(2);
function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const SERVER_URL = getArg('--server', 'http://localhost:3050').replace(/\/$/, '');
const TONE = getArg('--tone', 'casual');

console.log(`
============================================================
🎙️  WhisperFlow Node.js Universal Companion
⚡  Wispr Flow Command & Injection Pipeline
============================================================
Connecting to: ${SERVER_URL}
Default Tone:  ${TONE}
`);

// Check health
try {
  const res = await fetch(`${SERVER_URL}/health`);
  const data = await res.json();
  console.log(`✅ Server Status: ${data.status} (Uptime: ${Math.round(data.uptime)}s)\n`);
} catch (e) {
  console.warn(`⚠️ Warning: Could not connect to ${SERVER_URL}. Ensure server is running.\n`);
}

console.log(`Type or paste any messy spoken draft below, press ENTER, and WhisperFlow will polish it:`);
console.log(`(Type 'exit' to quit)\n`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '🎙️ Speech > '
});

rl.prompt();

rl.on('line', async (line) => {
  const text = line.trim();
  if (text.toLowerCase() === 'exit') {
    process.exit(0);
  }

  if (!text) {
    rl.prompt();
    return;
  }

  const startTime = Date.now();
  process.stdout.write('⏳ Polishing with WhisperFlow Zero-Edit Engine...');

  try {
    const res = await fetch(`${SERVER_URL}/api/process-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        tone: TONE,
        appName: 'Terminal Companion'
      })
    });

    const data = await res.json();
    const elapsed = Date.now() - startTime;
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);

    console.log(`\n✨ Polished [${data.provider || 'engine'}] (${elapsed}ms):`);
    console.log(`----------------------------------------`);
    console.log(data.processedText);
    console.log(`----------------------------------------\n`);
  } catch (err) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    console.error(`\n❌ Error: ${err.message}\n`);
  }

  rl.prompt();
});
