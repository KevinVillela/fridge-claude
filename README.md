# Kitchen Stock

The family's kitchen inventory (Have / Low / Out), now running on its own page so it can listen hands-free. Say **"Hey Jarvis"**, wait for the chime, then say what changed: *"we're out of blueberries and low on eggs."*

Everything from the Claude version is still here:
- categories, and how many days perishables have been in the kitchen
- dinner ideas, bulk add, photos, undo, and household notes

**Add receipt** now reads a photo of the paper Instacart receipt instead of searching Gmail.

**Where things live**
- **Inventory:** the Google Sheet "Kitchen Stock" in Kevin's Drive. Tabs: Inventory, Notes. Edit it directly if you like; the app picks changes up within 30 seconds.
- **Claude:** the Claude API, using the key saved in Settings on each device.
- **Wake word:** openWakeWord, running on the device. The `.onnx` files sit next to `index.html`.

## One-time setup

### 1. Connect the Google Sheet (about 5 minutes)
1. Open the **Kitchen Stock** sheet in Google Drive, then go to **Extensions → Apps Script**.
2. Delete what's in `Code.gs`, paste in all of `apps-script.gs` from this repo, and save.
3. Choose **Deploy → New deployment**, click the gear, and pick **Web app**. Set *Execute as:* **Me** and *Who has access:* **Anyone**, then click **Deploy**.
4. Approve access. Google warns that the app isn't verified, because it's your own script: choose **Advanced → Go to … (unsafe)** and then **Allow**.
5. Copy the **Web app URL**, which ends in `/exec`.

### 2. On each device
1. Open the site and tap **Settings** (the sliders button, top right).
2. Paste the Claude API key and the Web app URL. Leave "Listen for Hey Jarvis" on for the fridge tablet.
3. Tap **Save**, then tap anywhere once to start listening. Allow the microphone when asked.

### Fridge tablet tips
- Keep the screen on and dimmed. The app stops listening when the screen turns off.
- Turn on **Protect battery**, since the tablet stays plugged in.

## Notes
- Hands-free listening needs the page open and the screen on. Taps, typing and the 🎤 button work everywhere.
- Spoken replies can be turned off in Settings.
- If you later redeploy the Apps Script as a *new* deployment, the URL changes. Use **Manage deployments → Edit → New version** to keep the same URL.
