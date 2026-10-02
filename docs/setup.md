# Set up Murmur Flow

Use this page to run Murmur Flow on your own computer, then on a server if you want to.

A coding agent can do these steps for you. Paste [agent-prompt.md](agent-prompt.md) into that agent.

## 1. What the app does

Murmur Flow turns speech, or text you type, into a cleaned-up sentence. You can dictate in the browser, clean a paragraph, expand snippets, keep a personal dictionary, and generate meeting notes. A desktop companion can type the result into whatever window is open on your computer.

## 2. What works with no API key

These work with no Groq or Gemini key:

1. Typed cleanup (paste or type text and clean it).
2. Snippets.
3. Dictionary.
4. Meeting notes use a built-in summary when no key is set.

Microphone dictation and command mode call Groq or Gemini. They need a free key. Until a key is saved, those two requests fail.

## 3. Get a free key

You need one key for dictation. A second key is optional.

1. Groq: open https://console.groq.com/keys, sign in, create a key, and copy it.
2. Gemini: open https://aistudio.google.com/app/apikey, sign in, create a key, and copy it.

The app already uses these model names:

- Speech-to-text: `whisper-large-v3-turbo` (secondary option `whisper-large-v3`)
- Groq chat: `openai/gpt-oss-20b` (secondary option `openai/gpt-oss-120b`)
- Gemini: `gemini-3.6-flash`

Do not change the model names unless you know these exact IDs. Older IDs are shut down and will fail.

## 4. Try it on your own computer first

Install Node.js 20 LTS from https://nodejs.org. Choose the LTS download. `npm test` is optional. It checks snippets, cleanup, and meeting notes. It does not need a key.

### Windows

1. Install Node.js 20 LTS. If the installer asks, leave "Add to PATH" checked.
2. Open PowerShell.
3. Paste these lines, one at a time:

```powershell
git clone https://github.com/ImaduddeenKhan/MURMUR-FLOW.git
cd MURMUR-FLOW
npm install
npm start
```

4. Open http://localhost:3050 in your browser.
5. Click **Settings** in the top bar.
6. Paste your Groq key into **Groq key**. Paste a Gemini key into **Gemini key** if you have one.
7. Click **Save**.

Optional: in a second terminal, `cd` into the same folder and paste `npm test`.

### macOS

1. Install Node.js 20 LTS from https://nodejs.org. Install Git if `git` is not found (Xcode Command Line Tools: `xcode-select --install`).
2. Open Terminal and paste:

```bash
git clone https://github.com/ImaduddeenKhan/MURMUR-FLOW.git
cd MURMUR-FLOW
npm install
npm start
```

3. Open http://localhost:3050.
4. Click **Settings**, paste your keys, and click **Save**.

### Linux

1. Install Node.js 20 LTS and Git. On Ubuntu:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

2. Paste:

```bash
git clone https://github.com/ImaduddeenKhan/MURMUR-FLOW.git
cd MURMUR-FLOW
npm install
npm start
```

3. Open http://localhost:3050.
4. Click **Settings**, paste your keys, and click **Save**.

## 5. Desktop companion

The companion listens to the microphone and types into the active window. It only works on the same computer as the microphone. Do not run it on the server.

1. Install Python 3 from https://www.python.org/downloads/ if you do not have it. On Windows, check "Add python.exe to PATH".
2. Open a terminal in the project folder.
3. Paste:

```bash
pip install keyboard sounddevice scipy numpy
```

4. Start the server first (`npm start`), if it is not already running.
5. Paste:

```bash
python desktop/whisperflow_companion.py
```

6. Click the window you want to type into. Press **F8** to start. Speak. Press **F8** again to stop. The cleaned text is pasted at the cursor.

If the server is on another machine, still run this program on your own computer:

```bash
python desktop/whisperflow_companion.py --server http://YOUR_SERVER:3050
```

On Windows, if F8 does nothing, close the terminal, right-click it, choose **Run as administrator**, and start the companion again.

More detail is in [desktop/README.md](../desktop/README.md).

## 6. Hosting

A shared hosting plan that only runs PHP will not run this app. You need a host that runs Node.js.

The app listens on port 3050 unless the host sets `PORT`. It reads `process.env.PORT`.

History, snippets, dictionary, and keys typed into Settings are stored in `data/whisperflow_store.json`. That folder must survive restarts, or those saves disappear. On a server, put keys in environment variables so a redeploy does not erase them.

### Docker

`docker-compose.yml` builds the `Dockerfile` and stores `data/` in a Docker volume named `whisperflow_data`. This is the setup that keeps history across restarts.

1. Install Docker.
2. In the project folder, copy `.env.example` to a file named `.env`.
3. Open `.env`. Paste your keys after `GROQ_API_KEY=` and `GEMINI_API_KEY=`. Save.
4. Paste:

```bash
docker compose up -d --build
```

5. Open http://localhost:3050, or http://YOUR_SERVER_IP:3050.

The Dockerfile uses Node 22, sets `PORT=3050`, and starts with `node server/index.js`. A health check calls `GET /health`.

### Hostinger

Use a VPS, or Hostinger's Node.js app hosting if your plan has it. A normal website plan will not work.

VPS path (Ubuntu):

1. In hPanel, open your VPS and copy its IP address.
2. On your computer, open a terminal and connect. Replace the IP:

```bash
ssh root@YOUR_VPS_IP
```

3. Install Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

4. Clone the project into a folder you will keep:

```bash
git clone https://github.com/ImaduddeenKhan/MURMUR-FLOW.git
cd MURMUR-FLOW
npm install
```

5. Create the env file and paste your keys:

```bash
cp .env.example .env
nano .env
```

Set `PORT=3050`, `GROQ_API_KEY=`, and `GEMINI_API_KEY=`. Save and exit (`Ctrl+O`, Enter, `Ctrl+X` in nano).

6. Install a process manager and start the app:

```bash
sudo npm install -g pm2
pm2 start npm --name murmur-flow -- start
pm2 save
pm2 startup
```

Run the command that `pm2 startup` prints.

7. Open port 3050 in the VPS firewall (hPanel firewall, or `sudo ufw allow 3050` if ufw is on). Visit http://YOUR_VPS_IP:3050.

To serve it on port 80 with a password, install Nginx:

```bash
sudo apt-get install -y nginx apache2-utils
sudo htpasswd -c /etc/nginx/.murmur-flow YOUR_USERNAME
```

Type a password when asked. Then create `/etc/nginx/sites-available/murmur-flow` with:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    auth_basic "Murmur Flow";
    auth_basic_user_file /etc/nginx/.murmur-flow;

    location / {
        proxy_pass http://127.0.0.1:3050;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 50m;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/murmur-flow /etc/nginx/sites-enabled/murmur-flow
sudo nginx -t
sudo systemctl reload nginx
```

The `data/` directory is inside the project folder. Do not delete that folder when you restart. `pm2 restart murmur-flow` keeps it.

If hPanel has Node.js web app hosting, set the Node version to 20, the start command to `npm start`, and the same environment variables. Confirm in their panel that the app directory, including `data/`, is kept across restarts.

### AWS

Elastic Beanstalk is the simpler path. A single EC2 machine is the same idea as the Hostinger VPS above.

1. Sign in at https://console.aws.amazon.com/elasticbeanstalk.
2. Click **Create application**.
3. Platform: **Node.js**. Pick a Node.js 20 platform branch if one is listed.
4. Upload your code. Zip the project without the `node_modules` folder and without `.env`. Elastic Beanstalk runs `npm install` and `npm start`.
5. After it is created, open **Configuration**, then **Updates, monitoring, and logging** or **Software** (the label varies), then **Environment properties**.
6. Add:

- `GROQ_API_KEY` = your Groq key
- `GEMINI_API_KEY` = your Gemini key

Do not set `PORT`. Elastic Beanstalk sets `PORT` itself. The app already reads it.

7. Click **Apply**.

The `data/` folder is wiped on redeploy unless you add a volume and mount it over that folder. This app does not do that for you. For a first personal install, history may reset on redeploy. Put keys in the environment properties above, not only in Settings.

### Azure

1. Sign in at https://portal.azure.com.
2. Create a **Web App**.
3. Publish: **Code**. Runtime stack: **Node 20 LTS**. Operating system: **Linux**.
4. Deploy the project (Deployment Center from this GitHub repo, or a zip deploy). Do not upload `node_modules` or `.env`.
5. Open the app, then **Configuration** (or **Environment variables**), then **Application settings**. Add `GROQ_API_KEY` and `GEMINI_API_KEY`.
6. Do not add `PORT`. Azure sets `PORT`. The app already reads `process.env.PORT`.
7. Open **Configuration**, then **General settings**. Set **Startup Command** to `npm start`. Save.

A new deploy can replace files under the app folder, including `data/whisperflow_store.json`. Put keys in Application settings so they survive.

### Google Cloud Run

This folder already has a Dockerfile. Cloud Run can build from it.

Cloud Run has no persistent disk in this setup. History and keys saved in `data/` disappear when the instance stops. Set keys as environment variables, not only in the Settings screen.

1. Install the Google Cloud SDK, or use Cloud Shell from https://console.cloud.google.com.
2. In the project folder, paste:

```bash
gcloud run deploy murmur-flow --source . --region us-central1 --no-allow-unauthenticated
```

`--source .` uses the Dockerfile. Cloud Run sets `PORT` at runtime (usually 8080). Leave `PORT` unset in the service so that value is used. The app reads `process.env.PORT`.

3. When the command asks for the service name and region, accept `murmur-flow` and `us-central1`, or type your own region.
4. In the Cloud Run console, open the service, click **Edit and deploy new revision**, then **Variables and secrets**. Add `GROQ_API_KEY` and `GEMINI_API_KEY`. Deploy.

`--no-allow-unauthenticated` means the URL is not public. Callers need Google Cloud access. Do not switch on public access unless you put a login in front.

### Render, Railway, and Fly

These files are already in the repo:

- `render.yaml` is a Render web service. Build is `npm install`, start is `npm start`, health check is `/health`. In the Render dashboard, set `GROQ_API_KEY` and `GEMINI_API_KEY`. Render's filesystem is temporary. History and Settings keys in `data/` will not last. The free service also sleeps after idle time.
- `railway.json` uses Nixpacks and `npm start`, with a health check on `/health`. Set the two keys in the Railway **Variables** tab. Add a volume mounted on `/app/data` if you need history to last.
- `fly.toml` builds the Dockerfile and uses internal port 3050. It can stop the machine when it is idle. It does not mount a volume. History and Settings keys disappear when the machine stops. Set keys with `fly secrets set GROQ_API_KEY=... GEMINI_API_KEY=...`.

## 7. Environment variables

| Name | Purpose |
| --- | --- |
| `PORT` | Port the app listens on. Default is 3050 if this is unset. |
| `GROQ_API_KEY` | Groq key for dictation and command mode. |
| `GEMINI_API_KEY` | Gemini key. Used when Gemini is selected. |
| `DEFAULT_STT_PROVIDER` | `groq` or `gemini`. Default `groq`. |
| `DEFAULT_LLM_PROVIDER` | `groq` or `gemini`. Default `groq`. |

You can put them in a `.env` file in the project folder, or in the host's environment settings. Start from `.env.example`.

Keys typed into **Settings** are stored in plaintext in `data/whisperflow_store.json`. The app has no login. Do not put it on the public internet without a firewall or a login in front. Use Nginx basic auth (shown in the Hostinger steps) or the host's access control (Cloud Run authentication, a security group, or an IP allow list).

## 8. If something breaks

**The server will not start.** In the project folder, run `node -v`. You want version 20 or newer. Then run `npm install` again. Start with `npm start` from the project folder, not from a parent folder.

**The port is in use.** The terminal says the app moved to the next port. Use the URL it prints, or stop the other program that is using 3050. You can set `PORT=3052` in `.env` and start again.

**Dictation returns "API Key is not configured".** Paste a key in **Settings** and click **Save**, or put it in `.env` and restart the server. Microphone dictation does not work with an empty key.

**The companion says a package is missing.** Paste `pip install keyboard sounddevice scipy numpy` and run the companion again. If F8 does nothing on Windows, run the terminal as administrator.
