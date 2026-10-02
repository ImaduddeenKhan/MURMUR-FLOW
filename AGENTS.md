# AGENTS.md

Instructions for coding agents working in this repository. Humans should start at [README.md](README.md). Someone installing the app, who is not changing the code, should paste [docs/agent-prompt.md](docs/agent-prompt.md) into their agent.

## What this is

Murmur Flow is a Node.js app. Express serves `client/` and the API in `server/`. The public name is Murmur Flow. Some filenames still say `whisperflow`. Do not rename those unless the task is a rename.

## Setup

```bash
npm install
npm start
```

The app listens on port 3050, or on `PORT` from the environment. Open http://localhost:3050.

Copy `.env.example` to `.env` for local keys. Never commit `.env` or `data/whisperflow_store.json`.

## Tests

```bash
npm test
```

`npm test` runs `node tests/test_services.js`. It does not need an API key. It may write a row into the local store. Do not commit that file.

## Where to change things

- Speech and rewrite calls: `server/services/groqService.js`, `server/services/geminiService.js`
- Cleanup when no key is set: `server/services/zeroEditEngine.js`
- Routes: `server/index.js`
- Saved settings, dictionary, snippets: `server/services/storageService.js`
- Screens: `client/index.html`, `client/styles/`, `client/js/`
- Desktop hotkey: `desktop/whisperflow_companion.py`

`import 'dotenv/config'` must stay the first import in `server/index.js`.

## Models

Do not swap model IDs unless the task is to update them. Current defaults that work on a free key:

- Groq speech: `whisper-large-v3-turbo`
- Groq chat: `openai/gpt-oss-20b`
- Gemini: `gemini-3.6-flash`

The Groq chat call uses `max_completion_tokens` and `reasoning_effort: "low"`.

## Do not

- Commit `.env`, API keys, or `data/*.json`
- Add a login system unless the task asks for one
- Claim a path works if you did not run it
- Put secrets in docs, issues, or prompts

## Before you finish

Run `npm test`. If you changed install or hosting steps, update `docs/setup.md` and the README links in the same change.
