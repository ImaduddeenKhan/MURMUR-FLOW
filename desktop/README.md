# Desktop companion

The companion types cleaned text into the app that is open on your computer: a browser, Word, Slack, a terminal, or an editor.

Run it on the computer with the microphone. Do not run it on the server.

## Python (recommended)

The Murmur Flow server must already be running (`npm start`).

```bash
pip install keyboard sounddevice scipy numpy
python desktop/whisperflow_companion.py
```

Click the window you want to type into. Press **F8**, speak, press **F8** again.

Point it at a server on another machine:

```bash
python desktop/whisperflow_companion.py --server http://YOUR_SERVER:3050
```

| Argument | Default | Meaning |
| --- | --- | --- |
| `--server` | `http://localhost:3050` | Murmur Flow server |
| `--hotkey` | `f8` | Start and stop recording |
| `--tone` | `casual` | casual, formal, executive, code, bullet, standup, social |
| `--groq-key` | empty | Optional key for this run only |
| `--gemini-key` | empty | Optional key for this run only |

On Windows, if F8 does nothing, close the terminal, right-click it, choose **Run as administrator**, and start the companion again.

## Node

This version does not use the microphone. You type or paste a rough transcript and it prints the cleaned line.

```bash
node desktop/whisperflow_companion.js --server http://localhost:3050 --tone formal
```
