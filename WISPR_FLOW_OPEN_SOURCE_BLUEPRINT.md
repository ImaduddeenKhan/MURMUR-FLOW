# WhisperFlow: Open-Source Wispr Flow Architecture & Implementation Blueprint

> **A 100% Self-Hostable, Privacy-First, Open-Source Alternative to Wispr Flow**  
> *Universal voice dictation with 90%+ zero-edit accuracy, context-aware AI formatting, push-to-talk cross-app typing, and meeting notetaker.*

---

## Table of Contents
1. [Executive Summary & Motivation](#1-executive-summary--motivation)
2. [Comprehensive Reverse-Engineered Analysis of Wispr Flow](#2-comprehensive-reverse-engineered-analysis-of-wispr-flow)
   - [2.1 Core Products & Feature Set](#21-core-products--feature-set)
   - [2.2 Current Channels & Target Platforms](#22-current-channels--target-platforms)
   - [2.3 Performance Metrics & Benchmarks](#23-performance-metrics--benchmarks)
   - [2.4 Pricing & Commercial Tiers](#24-pricing--commercial-tiers)
3. [System Architecture & Open-Source Stack Selection](#3-system-architecture--open-source-stack-selection)
   - [3.1 Technology Evaluation & Selection Matrix](#31-technology-evaluation--selection-matrix)
   - [3.2 High-Level System Architecture Diagram](#32-high-level-system-architecture-diagram)
   - [3.3 Execution Modes: Local vs Hybrid vs Cloud](#33-execution-modes-local-vs-hybrid-vs-cloud)
4. [Deep Technical Breakdown of Core Subsystems](#4-deep-technical-breakdown-of-core-subsystems)
   - [4.1 Global Hotkey & Audio Capture Subsystem (Push-to-Talk)](#41-global-hotkey--audio-capture-subsystem-push-to-talk)
   - [4.2 Voice Activity Detection (VAD) & Streaming Pipeline](#42-voice-activity-detection-vad--streaming-pipeline)
   - [4.3 Speech-to-Text (ASR) Engine](#43-speech-to-text-asr-engine)
   - [4.4 The 90% Zero-Edit Intelligence Layer (LLM Post-Processing)](#44-the-90-zero-edit-intelligence-layer-llm-post-processing)
   - [4.5 Active App & Screen Context Detection](#45-active-app--screen-context-detection)
   - [4.6 Universal Text Injection Engine (Safe Clipboard Simulation)](#46-universal-text-injection-engine-safe-clipboard-simulation)
   - [4.7 Floating Pill / Dynamic Island Overlay UI](#47-floating-pill--dynamic-island-overlay-ui)
   - [4.8 Personal Dictionary & Snippets Engine](#48-personal-dictionary--snippets-engine)
   - [4.9 Command Mode (Voice-to-Action Editing)](#49-command-mode-voice-to-action-editing)
   - [4.10 Wispr Flow Notetaker (Meeting Recorder & Diarization)](#410-wispr-flow-notetaker-meeting-recorder--diarization)
5. [Database Schema & Data Models](#5-database-schema--data-models)
6. [API & WebSocket Streaming Protocol Specifications](#6-api--websocket-streaming-protocol-specifications)
7. [Docker Compose & Self-Hosting Deployment Guide](#7-docker-compose--self-hosting-deployment-guide)
8. [Phased Implementation Roadmap](#8-phased-implementation-roadmap)
9. [Edge Cases, Latency Budgets & Failure Modes](#9-edge-cases-latency-budgets--failure-modes)

---

## 1. Executive Summary & Motivation

Wispr Flow has set a new benchmark in voice-first productivity by achieving what standard operating system dictation (Siri, Windows Voice Typing) fails to deliver:
- **Zero-edit output**: Eliminating filler words, self-corrections ("let's meet at 5... actually 6"), and false restarts.
- **Universal compatibility**: Working seamlessly in any active application window (Slack, Claude, Cursor, Gmail, WhatsApp, Terminal).
- **Context sensitivity**: Adapting tone, capitalization, and formatting based on active application and user vocabulary.
- **Integrated Meeting Notetaker**: Capturing both microphone and system audio without requiring third-party bot invites.

However, Wispr Flow is proprietary, cloud-dependent, and requires sending raw audio and context to external cloud servers. For engineers, privacy-conscious professionals, healthcare workers (HIPAA), enterprise teams, and open-source advocates, there is a strong demand for a **100% open-source, self-hostable clone** that can run either fully offline on consumer hardware (M-series Mac, NVIDIA RTX GPUs) or via a private self-hosted server on a local network.

This specification document details the exact technical blueprint to build **WhisperFlow** (the open-source alternative), replicating every feature, interaction pattern, and channel found in Wispr Flow.

---

## 2. Comprehensive Reverse-Engineered Analysis of Wispr Flow

Based on detailed scraping and technical inspection of `https://wisprflow.ai/`, `https://wisprflow.ai/why-flow`, `https://wisprflow.ai/notetaker`, and `https://wisprflow.ai/pricing`:

### 2.1 Core Products & Feature Set

Wispr Flow consists of **two flagship products bundled into one ecosystem**:

#### Product 1: Wispr Flow Dictation
1. **Push-to-Talk & Hands-Free Toggling**:
   - Hold hotkey (e.g. `Fn` or customizable shortcut) to dictate, release to insert.
   - Double-tap hotkey for hands-free continuous dictation mode.
   - Custom mouse button support (e.g. thumb buttons).
   - `Escape` key cancels dictation instantly without pasting.
   - Optional "Auto-Send" (automatically sends `Enter` key after paste).
2. **AI Post-Processing & Zero-Edit Cleanup**:
   - Strips filler sounds: "um", "uh", "er", "you know", "like".
   - Handles mid-sentence self-corrections: *"I think to like not Friday the following Monday"* $\rightarrow$ *"Monday"*.
   - Removes repeated words caused by stammering: *"by by end of week"* $\rightarrow$ *"by end of week"*.
   - Auto-structures output: formats bullet lists, numbered steps, email greetings, sign-offs, and paragraphs.
3. **App & Screen Context Awareness**:
   - Detects the frontmost application.
   - Tone modulation: casual in Slack/Discord; formal and structured in Gmail/Outlook; code-literate in Cursor/VS Code.
   - Recognizes code conventions: `camelCase`, `snake_case`, file tags (e.g. `@app.py`), CLI flags (`--verbose`), and technical libraries (Supabase, Vercel, Docker).
4. **Personal Dictionary & Snippets**:
   - Learns uncommon names (colleagues, clients), medical/legal terminology, and tech acronyms.
   - Snippet expansion: Say *"insert calendar link"* $\rightarrow$ expands into `https://cal.com/username`.
5. **Command Mode (Voice-to-Action)**:
   - User highlights existing text, presses hotkey, and speaks an instruction: *"make this concise"*, *"translate to German"*, *"fix grammar"*.
   - The selected text is replaced with the LLM-transformed version.
6. **Whisper Mode & Audio Adaptability**:
   - High-gain acoustic sensitivity allowing users to whisper in public libraries or open offices without losing accuracy.
7. **Multi-Language Support**:
   - Supports 100+ languages with dynamic language switching and mixed-language (code-switching) handling (e.g., Hinglish, Spanglish).

#### Product 2: Wispr Flow Notetaker
1. **Zero-Bot Meeting Recording**:
   - Captures meetings natively from the OS without sending a noisy meeting bot into Zoom, Google Meet, Microsoft Teams, or Slack Huddles.
   - Captures both local microphone (input) and computer audio loopback (output).
2. **Speaker Diarization**:
   - Automatically attributes speech turns to distinct participants (e.g. "Stephen", "Nathalie", "Mikel").
3. **Automated Structured Synthesis**:
   - Generates topic-by-topic summaries, key takeaways, and action items with designated owners.
4. **AI Export & Integrations**:
   - Direct export to Claude, ChatGPT, Notion, Asana, Linear, Slack, and Markdown.
5. **Searchable Historical Archive**:
   - Search across previous meetings, transcripts, and action items.

---

### 2.2 Current Channels & Target Platforms

Wispr Flow targets four primary client channels and two service channels:

| Channel | Platform | Architecture / Technology | Distribution Form |
| :--- | :--- | :--- | :--- |
| **Desktop Client** | **macOS** (Apple Silicon + Intel) | Native Swift/AppKit or Electron/Tauri | `.dmg` installer, Menu Bar, Accessibility API |
| **Desktop Client** | **Windows 10/11** (x64, ARM64) | Native C#/WPF or Electron/Tauri | `.exe` / `.msi`, System Tray, UI Automation |
| **Mobile Client** | **iOS** (iPhone & iPad) | Swift + iOS Custom Keyboard Extension | App Store `.ipa`, Custom IME keyboard |
| **Mobile Client** | **Android** | Kotlin + Android IME + Accessibility Overlay | Google Play Store `.apk`, IME keyboard |
| **Web Channel** | **Browser Web Demo & Dashboard** | Webflow frontend + React SPA | `wisprflow.ai/demo`, `app.wisprflow.ai` |
| **Admin Portal** | **Team & Enterprise Workspace** | React SPA | `admin.wisprflow.ai` (SSO, SCIM, Audit Logs) |

---

### 2.3 Performance Metrics & Benchmarks

Wispr Flow benchmarks itself against industry tools on two primary dimensions:
1. **Zero-Edit Rate Benchmark**:
   - **Wispr Flow: 90%** (user speaks and sends with zero manual editing).
   - OpenAI Whisper Raw: 71%
   - ElevenLabs Scribe: 63%
   - Apple Siri Dictation: 52%
2. **Speed & Throughput**:
   - Average keyboard typing: **45 WPM**.
   - Wispr Flow Voice dictation: **220 WPM** (approx. 4x-5x faster).
   - End-to-end latency: **< 500ms** from key release to text insertion.

---

### 2.4 Pricing & Commercial Tiers

- **Free Tier**: $0/mo, 2,000 words/week, speech-to-text in 100+ languages, basic dictionary/snippets, limited Notetaker.
- **Pro Tier**: $15/user/mo ($12/user/mo billed annually), unlimited dictation, longer Notetaker history, shared team dictionary/snippets, centralized billing.
- **Growth Tier**: $23/user/mo (dictation only) or $33/user/mo (with unlimited Notetaker), SAML SSO, HIPAA enforcement with signed BAA, admin model controls.
- **Enterprise Tier**: Custom pricing, SCIM user provisioning, audit logs, MDM deployment, domain capture, SLA support.

---

## 3. System Architecture & Open-Source Stack Selection

To build a truly accessible open-source equivalent, the system must satisfy three tenets:
1. **Minimal Resource Footprint**: The desktop client must be lightweight (< 50MB RAM when idle) so it does not interfere with heavy IDEs or games.
2. **Sub-second Latency**: Push-to-Talk must paste within 300ms–600ms of key release.
3. **Pluggable AI Backends**: Users must be able to run 100% locally (Zero Cloud, Zero Cost, 100% Privacy) or connect cloud API keys (Groq, OpenAI, Anthropic, DeepSeek) for maximum speed.

### 3.1 Technology Evaluation & Selection Matrix

| Component | Wispr Flow (Proprietary) | WhisperFlow Recommended Stack | Rationale |
| :--- | :--- | :--- | :--- |
| **Desktop Framework** | Electron / Native Swift+C# | **Tauri v2 (Rust + React/TypeScript)** | 25MB RAM vs 300MB+ in Electron. Direct low-level OS API access in Rust (`rdev`, `enigo`, `cpal`, `windows-rs`, `cocoa`). |
| **Audio Capture** | Native CoreAudio / WASAPI | **Rust `cpal` + `webrtc-vad` / `hound`** | Ultra-low latency, cross-platform PCM capture (16kHz, 16-bit mono). |
| **VAD (Voice Activity)** | Proprietary VAD | **Silero VAD v5 (ONNX Runtime)** | Fast (<2ms inference), robust against background noise and breathing. |
| **Local ASR Engine** | Proprietary cloud speech model | **`faster-whisper` (CTranslate2) / `whisper.cpp`** | 4x faster than vanilla Whisper, supports GPU acceleration (Metal, CUDA, Vulkan). |
| **Cloud ASR Engine** | Proprietary Cloud | **Groq Cloud API (`whisper-large-v3-turbo`)** | Transcribes 10 seconds of speech in ~180ms. The fastest cloud Whisper API available. |
| **Local LLM Engine** | Proprietary fine-tune | **Ollama / `llama.cpp`** (`Llama-3.2-3B-Instruct` or `Qwen2.5-7B`) | Runs locally on Apple Silicon (M1/M2/M3/M4) or NVIDIA GPUs with 4-bit quant in <200ms. |
| **Cloud LLM Engine** | Proprietary | **Groq / DeepSeek / Claude 3.5 Haiku / GPT-4o-mini** | Groq chat model `openai/gpt-oss-20b`. |
| **System Loopback** | Custom Kernel Driver / SCK | **WASAPI Loopback (Win) / ScreenCaptureKit (Mac) / PipeWire (Linux)** | Native zero-driver audio loopback capture for meeting recording. |
| **Diarization Engine** | Proprietary | **Pyannote.audio v3.1 / Sherpa-ONNX** | State-of-the-art open speaker diarization and embedding extraction. |
| **Storage / DB** | Cloud DynamoDB / Postgres | **SQLite + `sqlite-vec` (Local) / PostgreSQL (Server)** | Embedded zero-setup local database with vector similarity for meeting memories. |

---

### 3.2 High-Level System Architecture Diagram

```
+----------------------------------------------------------------------------------------------------+
|                                    WHISPERFLOW DESKTOP CLIENT                                      |
|                                                                                                    |
|  +--------------------+   +-----------------------+   +-------------------+   +------------------+ |
|  | Global Hotkey Hook |   | Audio Pipeline        |   | Active Window     |   | Floating Pill UI | |
|  | - Push-To-Talk     |   | - 16kHz Mono Recorder |   | Inspector         |   | - Audio waveform | |
|  | - Hands-Free Toggle|   | - Silero VAD (ONNX)   |   | - Process Name    |   | - Language selector|
|  | - Cancel (Esc)     |   | - Loopback (Meeting)  |   | - Window Title    |   | - Status badges  | |
|  +---------+----------+   +-----------+-----------+   +---------+---------+   +--------+---------+ |
|            |                          |                         |                      |           |
|            +--------------------------+------------+------------+----------------------+           |
|                                                    |                                               |
|                                     +--------------v---------------+                               |
|                                     | Client Core Orchestrator     |                               |
|                                     | (Rust Tauri Engine)          |                               |
|                                     +--------------+---------------+                               |
+----------------------------------------------------|-----------------------------------------------+
                                                     |
               +-------------------------------------+-------------------------------------+
               |                                                                           |
               v (Local Mode: In-Process / Local IPC)                                      v (Server/Cloud Mode: WebSocket)
+---------------------------------------------+             +----------------------------------------------+
| LOCAL PROCESSING PIPELINE                   |             | WHISPERFLOW SERVER (FastAPI / Go)            |
|                                             |             |                                              |
| +-----------------------------------------+ |             | +------------------------------------------+ |
| | Local ASR:                              | |             | | Cloud ASR Gateway:                       | |
| | faster-whisper / whisper.cpp            | |             | | - Groq Whisper-large-v3-turbo (180ms)    | |
| | (CUDA / Metal / Vulkan Acceleration)    | |             | | - Deepgram Nova-2 / OpenAI Whisper       | |
| +--------------------+--------------------+ |             | +--------------------+---------------------+ |
|                      | Raw Transcript       |             |                      | Raw Transcript        |
| +--------------------v--------------------+ |             | +--------------------v---------------------+ |
| | Local Intelligence Engine:              | |             | | Cloud Intelligence Gateway:              | |
| | llama.cpp / Ollama                      | |             | | - Groq openai/gpt-oss-20b                | |
| | (Llama-3.2-3B / Qwen2.5-7B)             | |             | | - Claude 3.5 Haiku / GPT-4o-mini         | |
| +--------------------+--------------------+ |             | +--------------------+---------------------+ |
|                      | Cleaned Text         |             |                      | Cleaned Text          |
+----------------------|----------------------+             +----------------------|-----------------------+
                       |                                                           |
                       +-----------------------------+-----------------------------+
                                                     |
                                     +---------------v---------------+
                                     | Universal Text Injector       |
                                     | 1. Backup system clipboard    |
                                     | 2. Write cleaned text to clip |
                                     | 3. Synthesize Ctrl+V / Cmd+V  |
                                     | 4. Restore original clipboard |
                                     +---------------+---------------+
                                                     |
                                        +------------v------------+
                                        | Active Input Field      |
                                        | (Slack, VSCode, Gmail)  |
                                        +-------------------------+
```

---

### 3.3 Execution Modes: Local vs Hybrid vs Cloud

WhisperFlow supports three switchable operating profiles:

1. **Profile A: 100% Air-Gapped / Local (Maximum Privacy)**
   - ASR: `faster-whisper` (medium.en or large-v3 quantized `int8` on GPU/NPU).
   - Post-Processing: Ollama running `llama3.2:3b-instruct-q4_K_M`.
   - VAD: Local Silero ONNX.
   - Requirements: 8GB+ RAM, Apple Silicon M-series or 4GB+ VRAM NVIDIA GPU.
   - Zero outbound internet requests. SOC2/HIPAA self-compliant.

2. **Profile B: Turbo Hybrid (Speed & Lightweight Desktop)**
   - Desktop Client only captures audio and handles clipboard injection.
   - ASR: Groq Cloud API (`whisper-large-v3-turbo`) $\rightarrow$ ~150-220ms.
   - Post-Processing: Groq Cloud API (`openai/gpt-oss-20b`).
   - Total latency: **300ms–450ms end-to-end**.
   - Requires user's own free/paid Groq API key (or self-hosted vLLM server).

3. **Profile C: Self-Hosted Team Server (Enterprise / HomeLab)**
   - Central server runs in Docker on an internal GPU server.
   - Thin desktop clients connect via authenticated WebSocket (`wss://whisperflow.lan/ws`).
   - Centralized dictionary, team snippets, shared meeting transcripts, and RBAC admin portal.

---

## 4. Deep Technical Breakdown of Core Subsystems

### 4.1 Global Hotkey & Audio Capture Subsystem (Push-to-Talk)

The push-to-talk mechanism must register low-level OS keyboard events without capturing focus from the active window.

#### State Machine

```
     [ IDLE ] 
        |
        | KeyDown(TriggerKey)
        v
  [ RECORDING ]  <--------- Stream audio frames to 16kHz buffer & VAD
        |
        +-----> KeyDown(Escape) -------------> [ CANCELLED ] (Flush buffer, return to IDLE)
        |
        | KeyUp(TriggerKey) (If Push-to-Talk)
        | OR KeyDown(TriggerKey) (If Hands-Free Mode)
        v
  [ PROCESSING ] <--------- Send audio to ASR -> Send transcript + Context to LLM
        |
        | Processed Text Ready
        v
   [ INJECTING ] <--------- Backup Clip -> Set Clip -> Simulate Paste -> Restore Clip
        |
        v
     [ IDLE ]
```

#### Low-Level OS Implementation Strategy
- **Windows**: Use `SetWindowsHookExW` with `WH_KEYBOARD_LL` or modern `RegisterHotKey` in Rust via `windows-rs`.
- **macOS**: Use `CGEventTapCreate` (`kCGHIDEventTap`, `kCGEventKeyDown` & `kCGEventKeyUp`) requiring Accessibility permissions.
- **Linux (X11 / Wayland)**: `libinput` or X11 `XGrabKey` with Portal GlobalShortcuts fallback.

---

### 4.2 Voice Activity Detection (VAD) & Streaming Pipeline

Audio capture is fixed at **16,000 Hz sample rate, 16-bit signed integer PCM, Mono**.
- Audio is sliced into **30ms chunks** (480 samples).
- Chunks pass into **Silero VAD v5** via ONNX Runtime.
- **Speech Threshold**: If probability $> 0.5$, flag speech start.
- **Silence Padding**: Maintain a circular pre-speech buffer of 200ms so the initial syllable is never clipped.
- **Whisper Mode Support**: Include an optional software gain preamp ($+6\text{dB}$ to $+12\text{dB}$) activated via hotkey or auto-detected noise floor.

---

### 4.3 Speech-to-Text (ASR) Engine

The system supports two unified transcription drivers through a single trait:

```rust
#[async_trait]
pub trait SpeechToTextEngine: Send + Sync {
    async fn transcribe(&self, audio_pcm: Vec<i16>, language: Option<String>, prompt: Option<String>) -> Result<String, EngineError>;
}
```

#### Local Engine (`faster-whisper` / `whisper.cpp`)
- Implements `faster-whisper` using CTranslate2 Python sidecar or direct Rust bindings to `whisper.cpp`.
- Model sizes: `tiny.en` (testing), `base.en`, `small` (balance), `large-v3-turbo` (maximum accuracy).
- Includes initial prompt boosting: Injects user's personal dictionary into Whisper's `initial_prompt` parameter to bias beam search toward uncommon names and technical terms.

#### Turbo Cloud Engine (Groq / Deepgram)
- Groq `whisper-large-v3-turbo` with `temperature=0.0`, response format `json`.
- Latency: ~180ms for 5 seconds of audio.

---

### 4.4 The 90% Zero-Edit Intelligence Layer (LLM Post-Processing)

Raw Whisper output contains verbal artifacts: *"Um so I wanted to see if uh let's meet at five no sorry six pm"*.  
The Zero-Edit Engine transforms raw transcript into ready-to-send text using a specialized system prompt.

#### Zero-Edit Transformation Rules:
1. **Filler Word Elimination**: Erase `um`, `uh`, `like` (as filler), `you know`, `er`, `ah`, `so yeah`.
2. **Mid-Sentence Self-Correction Resolution**: When a speaker changes their mind, keep only the final intent.
   - *"Tuesday... actually Wednesday afternoon"* $\rightarrow$ *"Wednesday afternoon"*
   - *"Send it to Tom no wait send it to Sarah"* $\rightarrow$ *"Send it to Sarah"*
3. **False Starts & Stammering Removal**:
   - *"The the the launch is"* $\rightarrow$ *"The launch is"*
4. **Structural Intelligence**:
   - Auto-format numbered lists when sequential steps are spoken (*"first install node then run dev"* $\rightarrow$ `1. Install Node\n2. Run dev`).
   - Format currency, dates, percentages, and code identifiers properly.
5. **Contextual Tone Adaptation**:
   - Matches target application conventions (casual, professional, or technical).

#### Master Zero-Edit System Prompt

```text
You are WhisperFlow Zero-Edit Engine, an ultra-fast text restructuring AI.
Your job is to transform raw speech-to-text transcripts into polished, ready-to-send writing.

INPUT CONTEXT:
- Active Application: {APP_NAME} (e.g. Slack, VS Code, Gmail)
- Window Title: {WINDOW_TITLE}
- Selected Text / Surrounding Context: {SURROUNDING_CONTEXT}
- User Personal Dictionary: {USER_DICTIONARY}

TRANSFORMATION DIRECTIVES:
1. PRESERVE MEANING: Never invent facts. Keep the speaker's voice, intent, and tone.
2. DELETE FILLERS: Eliminate words like "um", "uh", "er", "ah", "you know", filler "like", "so yeah".
3. RESOLVE CORRECTIONS: If the speaker restarts a sentence or corrects a fact, keep ONLY the corrected statement.
   Example: "Let's do 3pm... wait no, 4pm works better" -> "Let's do 4pm."
   Example: "Delete the old one... I mean archive it" -> "Archive the old one."
4. STRUCTURE NATURALLY:
   - For emails or long thoughts, insert clean paragraph breaks.
   - For sequential instructions or lists, format as Markdown bullet points or numbered lists.
5. APPLICATION ADAPTATION:
   - If APP_NAME is a coding IDE (Cursor, VS Code, Windsurf, Terminal):
     Preserve programming terms, camelCase, snake_case, CLI flags (--flag), backticks for code symbols.
   - If APP_NAME is Slack, WhatsApp, or Discord:
     Keep tone natural, concise, and conversational. Do not make it overly formal.
   - If APP_NAME is Gmail, Outlook, or Word:
     Ensure proper capitalization, polished grammar, and standard professional formatting.
6. DICTIONARY PRIORITY:
   Always prioritize correct spelling of names, acronyms, and terms from USER_DICTIONARY.

OUTPUT RESTRICTION:
Output ONLY the final transformed text. Never add explanations, conversational remarks, or metadata quotes.
```

---

### 4.5 Active App & Screen Context Detection

To adapt style and spelling dynamically, WhisperFlow inspects the operating system's foreground process before text injection:

#### Platform APIs
- **Windows**:
  - `GetForegroundWindow()` $\rightarrow$ HWND
  - `GetWindowThreadProcessId(hwnd, &pid)` $\rightarrow$ PID
  - `QueryFullProcessImageNameW()` $\rightarrow$ `slack.exe`, `code.exe`, `chrome.exe`
  - `GetWindowTextW()` $\rightarrow$ e.g. `PR #102 - GitHub - Google Chrome`
- **macOS**:
  - `NSWorkspace.shared.frontmostApplication` $\rightarrow$ `bundleIdentifier` (e.g. `com.tinyspeck.slackmacgap`, `com.microsoft.VSCode`)
  - `localizedName` $\rightarrow$ `Slack`, `Visual Studio Code`
  - Accessibility API `AXUIElementCopyAttributeValue` for window title.
- **Linux**:
  - X11: `_NET_ACTIVE_WINDOW` atom via `XGetWindowProperty`.
  - Wayland: Ext-foreign-toplevel-list or compositor desktop environment IPC.

---

### 4.6 Universal Text Injection Engine (Safe Clipboard Simulation)

Direct simulated keystrokes (`SendInput`) are too slow for multi-paragraph text and often drop characters. Simulated clipboard paste (`Ctrl+V` / `Cmd+V`) is instantaneous and universal, but must **preserve the user's existing clipboard contents** without corruption.

#### Atomic Clipboard Swap Algorithm

```
Step 1: Capture current focused window handle (ensure focus is retained).
Step 2: Read & serialize current clipboard content:
        - Plain text (CF_UNICODETEXT / NSPasteboardTypeString)
        - Rich text / HTML
        - Image / File payloads (if present)
Step 3: Put transformed text into OS clipboard.
Step 4: Synthesize native keyboard paste event:
        - Windows: SendInput([VK_CONTROL DOWN, 'V' DOWN, 'V' UP, VK_CONTROL UP])
        - macOS: CGEventPost(kCGHIDEventTap, Cmd+V down/up)
        - Linux: xdotool / wtype or libei paste
Step 5: Sleep 40ms - 80ms (allows target application event loop to process paste).
Step 6: Restore previous clipboard content captured in Step 2.
Step 7: If "Auto-Send" enabled and app is a chat app (Slack/Discord), synthesize Enter key.
```

#### Direct Keystroke Fallback
For secure fields (password fields) or terminals where clipboard paste might be restricted or display a confirmation dialog, WhisperFlow provides a configurable fallback to simulate sequential UTF-16 character inputs.

---

### 4.7 Floating Pill / Dynamic Island Overlay UI

Wispr Flow uses a non-intrusive floating pill near the cursor or anchored to the bottom/top of the display.

#### Technical Specifications for the UI
- **Framework**: Tauri v2 Transparent Webview Window.
- **Window Properties**:
  - `decorations: false`
  - `transparent: true`
  - `always_on_top: true`
  - `skip_taskbar: true`
  - `shadow: true`
- **Interactive States**:
  1. **Idle**: Compact pill showing mic icon or hidden in tray.
  2. **Listening (Hotkeyed)**: Expands horizontally, showing animated green audio waveforms reacting to live microphone RMS volume.
  3. **Thinking / Processing**: Waveform transforms into a smooth animated gradient shimmer with latency counter.
  4. **Success**: Subtle green checkmark flash before hiding or auto-retracting.
  5. **Language Pill**: Clickable badge displaying current language (e.g., `EN`, `ES`, `DE`, `AUTO`).
  6. **Style Selector**: Dropdown to force `Casual`, `Professional`, `Code`, or `Raw`.

---

### 4.8 Personal Dictionary & Snippets Engine

#### Personal Dictionary
- **Phonetic & Name Boosting**: Stores user contacts, project codenames, technical libraries, and medical/legal jargon.
- Injected both into ASR (`initial_prompt` in Whisper) and into the LLM formatting prompt.
- **Auto-Correction Learner**: If a user immediately backspaces and retypes a word after WhisperFlow pastes, the client detects this diff and prompts: *"Add '[CorrectedWord]' to your dictionary?"*

#### Voice Snippets
Users define trigger phrases that expand into multi-line snippets:
- Trigger: `"insert meeting link"` $\rightarrow$ Expansion: `"Here is my Zoom link: https://zoom.us/j/123456789"`
- Trigger: `"standard signature"` $\rightarrow$ Expansion: `"Best regards,\nAlex Rivera\nPrincipal Architect"`

---

### 4.9 Command Mode (Voice-to-Action Editing)

Wispr Flow allows selecting text and giving voice commands. WhisperFlow implements this via:
1. **Trigger**: Secondary hotkey (e.g. `Alt + Shift + Space`).
2. **Capture**: Client synthesizes `Ctrl+C` / `Cmd+C` to copy currently highlighted text into memory.
3. **Audio Record**: User speaks instruction: *"Translate to French"*, *"Make this more diplomatic"*, *"Condense into 3 bullets"*.
4. **LLM Transformation**: Instruction + Highlighted Text sent to LLM.
5. **Replacement**: Result written to clipboard and `Ctrl+V` / `Cmd+V` replaces the highlighted selection.

---

### 4.10 Wispr Flow Notetaker (Meeting Recorder & Diarization)

The Notetaker runs continuously during scheduled or detected meetings (Zoom, Meet, Teams).

#### Audio Loopback Capture Architecture
- **Windows**: CoreAudio WASAPI in loopback mode captures output from the default playback device (voices of participants) concurrently with microphone input (your voice).
- **macOS**: Utilizes Apple's `ScreenCaptureKit` audio capture API (macOS 13+) or a CoreAudio audio tap to record system audio without installing virtual sound drivers (like BlackHole).
- **Dual-Channel Recording**:
  - Channel 0: Local Microphone (You).
  - Channel 1: System Audio Loopback (All remote speakers).

#### Processing Pipeline
1. Audio segmented into 15-second overlapping chunks.
2. VAD splits chunks into speech turns.
3. Local/Remote channel separation automatically labels "You" vs "Remote Participants".
4. Remote audio passes through **Pyannote Audio** to cluster and distinguish multiple remote speakers (Speaker A, Speaker B).
5. Live rolling transcript displayed in the Notetaker dashboard.
6. On meeting end: LLM generates topic breakdown, decisions, and action items with owners.

---

## 5. Database Schema & Data Models

Local client storage uses SQLite (with optional SQLite-Vec for semantic search). Centralized server uses PostgreSQL.

```sql
-- 1. Transcriptions History
CREATE TABLE transcriptions (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER NOT NULL,
    raw_transcript TEXT NOT NULL,
    processed_text TEXT NOT NULL,
    app_name TEXT,
    window_title TEXT,
    language TEXT DEFAULT 'en',
    latency_asr_ms INTEGER,
    latency_llm_ms INTEGER,
    mode TEXT CHECK(mode IN ('dictation', 'command', 'snippet')),
    was_edited BOOLEAN DEFAULT FALSE
);

-- 2. Personal Dictionary
CREATE TABLE dictionary_items (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    pronunciation_hint TEXT,
    category TEXT DEFAULT 'general', -- 'name', 'acronym', 'code', 'jargon'
    frequency_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Voice Snippets
CREATE TABLE snippets (
    id TEXT PRIMARY KEY,
    trigger_phrase TEXT NOT NULL UNIQUE,
    expansion_content TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Application Style Profiles
CREATE TABLE app_profiles (
    id TEXT PRIMARY KEY,
    app_process_name TEXT NOT NULL UNIQUE, -- e.g. 'slack.exe', 'code.exe'
    display_name TEXT NOT NULL,
    custom_system_prompt TEXT,
    tone_override TEXT, -- 'casual', 'formal', 'code', 'raw'
    auto_send_enabled BOOLEAN DEFAULT FALSE
);

-- 5. Meetings (Notetaker)
CREATE TABLE meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    platform TEXT, -- 'zoom', 'google_meet', 'teams', 'in_person'
    summary_markdown TEXT,
    action_items_json TEXT,
    full_transcript_text TEXT
);

-- 6. Meeting Segments (Speaker Diarized)
CREATE TABLE meeting_segments (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    speaker_id TEXT NOT NULL, -- 'user' or 'speaker_1', 'speaker_2'
    speaker_name TEXT,
    start_time_ms INTEGER NOT NULL,
    end_time_ms INTEGER NOT NULL,
    text TEXT NOT NULL
);

-- 7. User Settings
CREATE TABLE user_settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL
);
```

---

## 6. API & WebSocket Streaming Protocol Specifications

For clients connecting to a remote self-hosted server, real-time bidirectional streaming is conducted over WebSocket (`/api/v1/stream`).

### 6.1 WebSocket Client-to-Server Messages

#### Audio Chunk Streaming
```json
{
  "type": "audio_chunk",
  "sequence": 42,
  "format": "pcm_16000_16bit_mono",
  "data": "base64_encoded_pcm_bytes..."
}
```

#### End of Speech Event (Key Released)
```json
{
  "type": "end_of_speech",
  "context": {
    "app_name": "slack",
    "window_title": "#engineering - Slack",
    "language": "en",
    "mode": "dictation",
    "surrounding_text": "Hey team, just following up on"
  }
}
```

### 6.2 WebSocket Server-to-Client Messages

#### Interim Partial Transcript (Optional live feedback)
```json
{
  "type": "partial_transcript",
  "text": "Hey team, launch is slipping to"
}
```

#### Final Processed Text (Inject ready)
```json
{
  "type": "final_result",
  "raw_transcript": "um hey team launch is slipping to like Monday",
  "processed_text": "Hey team, launch is slipping to Monday.",
  "latency": {
    "asr_ms": 172,
    "llm_ms": 118,
    "total_ms": 290
  }
}
```

---

## 7. Docker Compose & Self-Hosting Deployment Guide

For users wanting to run a self-hosted central server with optional GPU acceleration:

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  whisperflow-server:
    image: ghcr.io/whisperflow/server:latest
    container_name: whisperflow-server
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - ASR_BACKEND=groq # 'groq' | 'local_whisper'
      - GROQ_API_KEY=${GROQ_API_KEY}
      - LLM_BACKEND=groq # 'groq' | 'ollama' | 'openai'
      - OLLAMA_HOST=http://ollama:11434
      - DATABASE_URL=sqlite:///data/whisperflow.db
    volumes:
      - ./data:/data
    networks:
      - whisperflow-net

  # Optional local LLM runner (uncomment if running 100% offline with GPU)
  ollama:
    image: ollama/ollama:latest
    container_name: whisperflow-ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ./ollama_models:/root/.ollama
    networks:
      - whisperflow-net
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: all
    #           capabilities: [gpu]

networks:
  whisperflow-net:
    driver: bridge
```

---

## 8. Phased Implementation Roadmap

### Phase 1: Core Engine & Fast Dictation MVP
- [ ] Initialize Tauri v2 repository with Rust backend and React/TypeScript frontend.
- [ ] Implement cross-platform global hotkey listener (`rdev` / `global-hotkey`).
- [ ] Build 16kHz audio capture with circular pre-roll buffer (`cpal`).
- [ ] Integrate Silero VAD v5 ONNX model for start/end speech boundary detection.
- [ ] Implement dual ASR drivers:
  - Driver 1: Groq Whisper-large-v3-turbo (cloud ultra-fast).
  - Driver 2: `faster-whisper` / `whisper.cpp` (local).
- [ ] Implement Zero-Edit Prompt with structured LLM pipeline.
- [ ] Implement Atomic Clipboard Swap text injection for Windows and macOS.
- [ ] **Deliverable**: Working push-to-talk voice typing into any text field.

### Phase 2: Desktop Client & Floating Dynamic Island UI
- [ ] Build frameless, draggable, transparent floating pill window.
- [ ] Real-time audio waveform visualizer (canvas/SVG reacting to mic volume).
- [ ] Dynamic Island status animations (Idle, Recording, Thinking, Injected).
- [ ] Language selection dropdown (100+ languages supported).
- [ ] System Tray menu with Settings, History, and Model configurations.
- [ ] User Settings GUI: Hotkey customizer, backend selector, API key manager.

### Phase 3: Context Awareness, Personal Dictionary & Snippets
- [ ] Active foreground window and process inspector (`GetForegroundWindow` / `NSWorkspace`).
- [ ] Tone adaptation engine (Slack casual vs Outlook formal vs IDE developer).
- [ ] Developer mode: camelCase/snake_case formatting and file referencing.
- [ ] Personal Dictionary management with SQLite persistence.
- [ ] Dynamic ASR prompt biasing using custom dictionary words.
- [ ] Snippet voice triggers and expansion engine.
- [ ] Command Mode: selection capture via simulated `Ctrl+C` $\rightarrow$ LLM instruction $\rightarrow$ replace selection.

### Phase 4: Meeting Notetaker & System Audio Capture
- [ ] Native system audio loopback capture (WASAPI on Windows, ScreenCaptureKit on macOS).
- [ ] Dual-stream audio mixer (Channel 0: Mic, Channel 1: System Audio).
- [ ] Speaker Diarization pipeline using Pyannote.audio.
- [ ] Notetaker live dashboard UI with streaming conversation turns.
- [ ] Automated meeting summarizer (topic breakdown, key decisions, action items).
- [ ] Full-text search and export to Markdown, Notion, Claude, and ChatGPT.

### Phase 5: Mobile Clients & Enterprise Cloud
- [ ] iOS Custom Keyboard Extension (Swift) with integrated audio streaming.
- [ ] Android Custom Input Method Editor (IME) with floating trigger button.
- [ ] Dockerized multi-tenant self-hosted server with SAML SSO and team dictionary sync.
- [ ] End-to-end encrypted backup of transcripts and memories.

---

## 9. Edge Cases, Latency Budgets & Failure Modes

### Latency Budget (Target: < 450ms)
- Audio capture flush & VAD debounce: **40ms**
- Network transit (TLS WebSocket to Groq/Cloud): **30ms**
- ASR processing (Groq Whisper-large-v3-turbo): **180ms**
- LLM Zero-Edit processing (Groq `openai/gpt-oss-20b`): **80ms**
- Clipboard swap and paste injection: **50ms**
- **Total Estimated Latency**: **~380ms** (Instantaneous feel).

### Critical Edge Cases & Mitigations
1. **Clipboard Race Conditions**:
   - *Problem*: User copies something else exactly when the paste is triggering.
   - *Solution*: Acquire a mutex lock on clipboard operations; restore previous clipboard in a separate thread after 60ms delay.
2. **Applications Blocking Simulated Keystrokes (e.g. elevated Administrator apps / UAC)**:
   - *Problem*: Windows prevents standard processes from sending `SendInput` to elevated windows.
   - *Solution*: Run desktop client with `uiAccess=true` in manifest or prompt user to run WhisperFlow with equivalent permissions.
3. **Bluetooth Earbuds & Mic Compression (AirPods)**:
   - *Problem*: Bluetooth hands-free profile (HFP) switches audio to 8kHz low-fidelity telephone quality.
   - *Solution*: Detect Bluetooth mic profiles and alert user in UI to use built-in laptop mic or standalone USB mic for higher transcription accuracy.
4. **Code-Switching (Multilingual Mid-Sentence)**:
   - *Problem*: Whisper defaults to single-language mode if language is explicitly forced.
   - *Solution*: Use automatic language detection or multilingual prompting with fine-tuned code-switching instructions in the LLM stage.

---

*Authored for the WhisperFlow Open Source Community.*  
*Let's build voice-first computing for everyone.*
