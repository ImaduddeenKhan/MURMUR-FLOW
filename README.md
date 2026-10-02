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

Or run the setup script. It checks Node.js, installs, tests, and starts the app:

```bash
# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1

# macOS and Linux
bash scripts/setup.sh
```

Click-by-click steps for Windows, Mac, and Linux are in **[docs/setup.md](docs/setup.md)**.

## Host it on a server

**[docs/deploy/README.md](docs/deploy/README.md)** explains which kind of hosting to buy, what it costs, and which will not work. There is one guide per platform: any Linux VPS, Hostinger, AWS, Azure, Google Cloud, DigitalOcean, Oracle Cloud (free), Hetzner, Render, Railway, Fly.io, Docker, Coolify, and a home server.

On a fresh Ubuntu server, one command installs the app with HTTPS and a password:

```bash
curl -fsSL https://raw.githubusercontent.com/ImaduddeenKhan/MURMUR-FLOW/main/scripts/install-vps.sh | sudo bash
```

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

Clone the repo, open it in Cursor, Claude Code, GitHub Copilot, Gemini CLI, Windsurf, or Codex, and say **"set this up"**. Those agents read **[AGENTS.md](AGENTS.md)** on their own. It tells them how to install, test, and host Murmur Flow without committing your keys. In Claude Code, `/setup` runs the same steps.

Other agents: paste the prompt in **[docs/agent-prompt.md](docs/agent-prompt.md)**.

## Project layout

| Path | What it is |
| --- | --- |
| `client/` | The web app |
| `server/` | API, speech, and rewrite |
| `desktop/` | Types into the app you are using |
| `docs/setup.md` | Install on your computer |
| `docs/deploy/` | One hosting guide per platform |
| `scripts/` | Setup scripts for Windows, Mac, Linux, and Ubuntu servers |
| `AGENTS.md` | Instructions coding agents read on their own |
| `.env.example` | Empty key file. Copy this. Never commit `.env` |
| `data/` | Created on your machine. History and saved keys stay here |

## Security

The app has no login. Keys typed into Settings are stored in plain text in `data/whisperflow_store.json`. Do not put the app on the public internet without a password in front of it. Every hosting guide has a "Put a password in front" section. Details are in [SECURITY.md](SECURITY.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). `npm test` is the check that must pass.

## License

[MIT](LICENSE) © 2026 Imad Khan
