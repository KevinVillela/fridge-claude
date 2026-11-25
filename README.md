# Fridge Claude

A hands-free kitchen inventory for the fridge tablet. Say the wake word, wait for the chime, then say what changed. For example: *"we're out of blueberries and low on eggs."* Claude updates the list (Have / Low / Out) and says what it did.

**How it works**
- **Wake word:** openWakeWord runs inside the browser on the tablet. No audio leaves the tablet while it's waiting for the wake word.
- **After the chime:** Chrome's speech recognizer turns your sentence into text. Then Claude (Haiku) works out which items changed.
- **Sync (optional):** a Google Sheet holds the inventory. Claude can read and edit it from chat when planning meals or building the Instacart order, and the tablet picks up those edits.

```
index.html                                  the whole app
melspectrogram.onnx, embedding_model.onnx   shared openWakeWord models
hey_jarvis_v0.1.onnx                        prebuilt wake word, works now
apps-script.gs                              optional Google Sheet sync
```

## 1. Host it (GitHub Pages, about 5 min)
The microphone only works on an HTTPS page, and GitHub Pages provides that for free.
1. Create a new GitHub repo (it can be private if you have Pro; otherwise public is fine, since the code holds no secrets).
2. Upload `index.html` and the three `.onnx` files, all at the top level.
3. Go to **Settings → Pages**, set the source to "Deploy from a branch" and choose `main` / root. After about a minute you'll get a URL like `https://<you>.github.io/fridge-claude/`.

## 2. Get a Claude API key
1. Create a key at console.anthropic.com. Set a low monthly spend limit, since the key lives on the tablet.
2. Each command is one short Haiku call, which costs a tiny fraction of a cent. A busy kitchen should come to well under $1 a month.

## 3. Set up the tablet
1. Open the URL in **Chrome** and tap **Start listening**. When asked, allow the microphone.
2. Tap **⚙︎** and paste the API key.
3. In Chrome's menu, choose **Add to Home screen** so it opens full screen.
4. Keep the screen on. The page asks Android to stay awake, but also set **Settings → Display → Screen timeout** to its longest value and turn the brightness down. If the screen turns off, the page stops listening.
5. Keep **Settings → Battery → Protect battery** on, since the tablet stays plugged in.

Optional: Fully Kiosk Browser (a few dollars for a lifetime license) is more robust for a wall-mounted tablet. It can auto-start the page after a reboot, keep the screen on, and dim it on a schedule.

**Try it:** say "Hey Jarvis", wait for the chime, then say "we're out of blueberries."
- To skip the wake word, tap 🎤, or type in the box at the bottom.
- Tap an item to cycle it Have → Low → Out. Tap ✕ to remove it.

## 4. Train your own "Hey Claude" (about 1 hour, mostly waiting)
The app ships with "Hey Jarvis" because it's a ready-made model. To get "Hey Claude":
1. Open openWakeWord's training notebook in Google Colab. It's linked from the README at github.com/dscripka/openWakeWord under "Training New Models"; use the "automatic model training" notebook.
2. Set the target phrase to `hey claude`. It builds training data from synthetic voices, so you don't record anything. Let it run.
3. Download the `.onnx` file it produces, rename it `hey_claude.onnx`, and upload it to the repo next to `index.html`.
4. On the tablet, open **⚙︎** and set the wake word model file to `hey_claude.onnx`.

**Tuning:**
- If it misses you, lower the threshold (try 0.35).
- If it triggers on TV or conversation, raise it (try 0.6).

## 5. Optional: Google Sheet sync
1. Create a Google Sheet (e.g. "Kitchen Inventory") and open **Extensions → Apps Script**.
2. Replace the code with `apps-script.gs` and save.
3. Choose **Deploy → New deployment → Web app**, with *Execute as: Me* and *Who has access: Anyone*. Copy the `/exec` URL.
4. Paste the URL into **⚙︎ → Google Sheet sync URL** on the tablet.

Once it's set up, every change on the tablet is written to the sheet. The tablet re-reads the sheet every 5 minutes and whenever the screen wakes. Edits made in the sheet, including Claude's when you plan meals in chat, show up on the fridge.

## Things to know
- **Pause after the wake word.** Say the wake word, wait for the chime, then speak. Words spoken in the same breath as the wake word are lost.
- **Android may beep** when Chrome's recognizer starts. That's the system, not the app.
- **Where the key is stored:** the API key and settings are kept in the tablet browser's storage and are never put in the repo.
- **Power:** the screen has to stay on while listening, which works out to roughly $3–4 a year in electricity with the screen dimmed.
