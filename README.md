# Murmur Flow

Self-hosted voice dictation. You speak the way you actually talk. Murmur Flow hands back a sentence you can send.

It is an open-source alternative to [Wispr Flow](https://wisprflow.ai/). The app runs on your computer, or on a server you control. Speech and cleanup go through [Groq](https://console.groq.com/) and [Google Gemini](https://aistudio.google.com/). Both offer a free key. With no key at all, typed cleanup, snippets, and the dictionary still work.

[![Test](https://github.com/ImaduddeenKhan/MURMUR-FLOW/actions/workflows/test.yml/badge.svg)](https://github.com/ImaduddeenKhan/MURMUR-FLOW/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Install on your computer

You need [Node.js 20 LTS](https://nodejs.org/) or newer.

```bash
git clone https://github.com/ImaduddeenKhan/MURMUR-FLOW.git
cd MURMUR-FLOW
npm install
npm start
```

Open http://localhost:3050.

Windows, Mac, and Linux click-by-click steps, plus Hostinger, AWS, Azure, and Google Cloud, are in **[docs/setup.md](docs/setup.md)**.

A shared hosting plan that only runs PHP cannot run this app.

## Add a free key

Microphone dictation and command mode need a key. Typed cleanup does not.

1. Create a Groq key at https://console.groq.com/keys
2. Optional: create a Gemini key at https://aistudio.google.com/app/apikey
3. In the app, open **Settings**, paste the key, and click **Save**

Or copy `.env.example` to `.env`, paste the key there, and start the app again. `.env` is gitignored. Do not commit it.

These model names are already set. Leave them unless you know the exact replacement:

| Job | Model |
| --- | --- |
| Speech to text | `whisper-large-v3-turbo` |
| Rewrite | `openai/gpt-oss-20b` |
| Gemini | `gemini-3.6-flash` |

## What you can do

- Hold **Space** and speak. The pill shows Listening, then Cleaning up.
- Pick a tone: casual, formal, executive, code, bullets, standup, social, prompt, support, or a translation.
- Keep a dictionary of names and a list of voice snippets.
- Switch **Light**, **Dark**, and **Contrast** in the top bar.
- Turn meeting notes into a summary when a key is set.
- Type the result into any desktop app with the [desktop companion](desktop/README.md). Press **F8**, speak, press **F8** again.

## Give this to a coding agent

If you use Cursor, Copilot, Claude, or another coding agent, paste the prompt in **[docs/agent-prompt.md](docs/agent-prompt.md)**. It tells the agent how to install Murmur Flow without committing your keys.

People changing the code should also read **[AGENTS.md](AGENTS.md)**.

## Project layout

| Path | What it is |
| --- | --- |
| `client/` | The web app |
| `server/` | API, speech, and rewrite |
| `desktop/` | Types into the app you are using |
| `docs/setup.md` | Install and hosting |
| `.env.example` | Empty key file. Copy this. Never commit `.env` |
| `data/` | Created on your machine. History and saved keys stay here |

## Security

The app has no login. Keys typed into Settings are stored in plain text in `data/whisperflow_store.json`. Do not put the app on the public internet without a password in front of it. Details are in [SECURITY.md](SECURITY.md) and [docs/setup.md](docs/setup.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). `npm test` is the check that must pass.

## License

[MIT](LICENSE) © 2026 Imaduddeen Khan
