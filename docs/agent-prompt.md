# Prompt for your coding agent

Paste everything inside the block below into Cursor, GitHub Copilot, Claude, ChatGPT, or another coding agent. Use it when you want help installing or hosting Murmur Flow. You do not need to explain the project yourself.

```text
You are helping me install and run Murmur Flow, an open-source voice dictation app.

Repository: https://github.com/ImaduddeenKhan/MURMUR-FLOW
Read README.md, docs/setup.md, and AGENTS.md before you change anything.

Do this:

1. Check that Node.js 20 or newer is installed (`node -v`). If it is not, tell me to install the LTS build from https://nodejs.org and stop until I say it is installed. On Windows, "Add to PATH" must stay checked.
2. If this folder is not already the project, clone https://github.com/ImaduddeenKhan/MURMUR-FLOW.git and enter that folder.
3. Run `npm install`, then `npm start`.
4. Tell me to open http://localhost:3050.
5. Typed cleanup, snippets, and the dictionary work with no key. Microphone dictation and command mode need a key.
6. If I want dictation, send me to https://console.groq.com/keys to create a free Groq key. Optional second key: https://aistudio.google.com/app/apikey. Tell me to paste the key in Settings and click Save, or to copy `.env.example` to `.env` and paste it there.
7. Never invent an API key. Never print a full key back to me in a commit, a log, or a chat summary.
8. Never commit `.env`, `data/whisperflow_store.json`, `node_modules`, or files in `uploads/`. `.env` is already in `.gitignore`. Keep it that way.
9. Do not change the model IDs unless I ask. The working defaults are whisper-large-v3-turbo, openai/gpt-oss-20b, and gemini-3.6-flash.
10. The desktop companion types into other apps on this computer only. It is `python desktop/whisperflow_companion.py` after `pip install keyboard sounddevice scipy numpy`. The server must already be running. Hotkey is F8.
11. If I want Hostinger, AWS, Azure, Google Cloud, Docker, Render, Railway, or Fly, follow docs/setup.md exactly. A PHP-only hosting plan cannot run this app.
12. The app has no login. Do not expose it to the public internet without the password step in docs/setup.md.
13. If something fails, read the "If something breaks" section in docs/setup.md before you rewrite the app.
```
