# Desktop companion

The companion types cleaned text into the app you are using: Slack, Cursor, VS Code, Word, Notion, a browser, or a terminal. Press **F8**, speak, press **F8** again.

It is a separate program from the web app.

| | Web app | Desktop companion |
| --- | --- | --- |
| Where you speak | The Murmur Flow browser tab | Any app on your computer |
| Start talking | Hold **Space** in the tab | Press **F8** anywhere |
| Text goes to | The page and your clipboard | Your cursor, in the app you were using |
| Install | `npm start` | Python 3 and four packages |
| Runs on a server | Yes | No. Only on the computer with the microphone |

The companion needs the web app's server running. It uses the keys and dictionary saved in the web app's Settings.

## Before you start

1. The web app is running (`npm start`), and http://localhost:3050 opens.
2. A speech key is saved in the web app's **Settings**. Without it, every recording fails.
3. Python 3 is installed. On Windows, get it from https://www.python.org/downloads/ and tick **Add python.exe to PATH**.

## Windows

1. Click **Start**, type `PowerShell`, right-click **Windows PowerShell**, and choose **Run as administrator**.
2. Run:

   ```powershell
   cd C:\path\to\MURMUR-FLOW
   pip install keyboard sounddevice scipy numpy
   python desktop/whisperflow_companion.py
   ```

3. Leave the window open. Click into any text box, press **F8**, speak, press **F8** again.

Windows does not let a normal program see key presses inside apps that run as administrator. That is why F8 can work in Notepad but not in an app started as administrator. A PowerShell started as administrator avoids that. You can try a normal PowerShell first.

## macOS

```bash
pip3 install keyboard sounddevice scipy numpy
sudo python3 desktop/whisperflow_companion.py
```

The `keyboard` package needs `sudo` to see key presses. When macOS asks, allow **Terminal** under **System Settings → Privacy & Security → Accessibility** and **Microphone**, then start the companion again.

## Linux

The `keyboard` package reads the keyboard device directly and needs root. Pasting uses `xclip` and `xdotool`, which work in X11 sessions, not Wayland. Linux is the least tested platform.

```bash
sudo apt-get install -y python3-venv libportaudio2 xclip xdotool
python3 -m venv .venv
.venv/bin/pip install keyboard sounddevice scipy numpy
sudo .venv/bin/python desktop/whisperflow_companion.py
```

## Options

| Argument | Default | Meaning |
| --- | --- | --- |
| `--server` | `http://localhost:3050` | Murmur Flow server |
| `--hotkey` | `f8` | Start and stop recording |
| `--tone` | `casual` | casual, formal, executive, code, bullet, standup, social |
| `--groq-key` | empty | Key for this run only, instead of the one in Settings |
| `--gemini-key` | empty | Key for this run only, instead of the one in Settings |

Use a hosted Murmur Flow:

```bash
python desktop/whisperflow_companion.py --server https://your-domain
```

A server behind a password (Caddy basic auth) refuses the companion, because it has no password support. Use a Tailscale address, or run the server on the same computer.

## If something goes wrong

| What you see | Fix |
| --- | --- |
| `Tip: For instantaneous mic capture, run: pip install ...` | The packages are missing. The companion is in a fallback mode that does not record. Install them and start again. |
| F8 does nothing | On Windows, start PowerShell as administrator. On macOS, grant Accessibility. On Linux, run with `sudo`. |
| `Could not reach http://localhost:3050` | The web app is not running. Run `npm start` in another window. |
| `Dictation request error` with HTTP 500 | No speech key. Paste one in the web app's Settings and click Save. |
| `No audio captured` | The microphone is blocked or not the default input. Check your system's microphone settings. |
| Text does not appear | Click inside a text box before pressing F8. The text is pasted where the cursor is. |
| My clipboard changed | Expected. The companion pastes through the clipboard. |

## Node version

`desktop/whisperflow_companion.js` does not use the microphone or a hotkey. You type or paste a rough transcript, and it prints the cleaned text:

```bash
node desktop/whisperflow_companion.js --server http://localhost:3050 --tone formal
```
