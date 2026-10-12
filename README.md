# WOD Stream Studio — multilingual CrossFit/workout broadcast overlay

Version 1.1.0 — ready-to-run source project. No build step, package installation, cloud account, paid library, or license server is required.

## What you get

- Independent pages: **`/control`** (secure dashboard) and **`/overlay`** (transparent output).
- **Three live zones:** left branding/logo/free text, center interval/clock, right WOD/coach/notes/live clock.
- Responsive 1920×1080 OBS-ready composition with configurable widths, opacity, colors, fonts, visibility, fade animations.
- Countdown, stopwatch, intervals, **AMRAP, EMOM, Tabata, For Time**, 0–10-minute preparation countdown, time cap, previous/next phase, optional rest after final round, adjustable beep volume and warning thresholds.
- Extended sequence formula parser: `2m + 30 + 1:00`, `4*(1m+30)`, `20/10*8`, `(arbeit 40 + pause 20)*8`, `1h2m3s`, `2m30`; 24 hours / 240 phases maximum.
- Control from computer, phone or tablet on the **same trusted Wi-Fi/LAN**; server-synchronized state via Server-Sent Events. Changing branding/layout never resets a live workout; changing timer settings deliberately resets it.
- User scenes and **Competition, Minimal, Timer-only** presets, JSON backup/import/export, persistent active scene, restore default.
- Broadcast polish from the Grok-workspace review: **athlete/heat overlay, sponsor image, scrolling ticker, zone scrims, drop shadows, configurable 12/24-hour clock**, quick mode chips, and **black/chroma-green background URLs** for Zoom.
- Separate compact **`/remote`** control deck optimized for phones/tablets, with secure scene switching and previous/next interval buttons.
- UI and timer labels in **German, English, French, Spanish, Italian and Portuguese**; user-entered WOD/branding stays in the original language.
- Source code: native HTML5, CSS3, ECMAScript modules, Node.js standard library. Zero `npm` dependencies.

## Run now

1. Install [Node.js 20 or later](https://nodejs.org/) on your Windows, macOS or Linux computer.
2. Unzip the project anywhere you can save files.
3. Open a terminal **in this folder** and run:

   ```bash
   npm start
   ```

4. The terminal displays the access URLs and a long, random **control key**. Use `http://localhost:4173/control`, enter the key, and open `http://localhost:4173/overlay` in another tab.
5. Use the OBS instructions in `docs/OBS-ZOOM-EN.md` (English) or `docs/OBS-ZOOM-DE.md` (Deutsch).
6. For phone control, open the `http://192.168.x.x:4173/remote` link shown in the terminal on a device on the same Wi-Fi. Enter the **same key**. Your workstation firewall must permit **TCP 4173** on the trusted private network.

Windows: you can double-click `start-windows.bat` after installing Node. macOS/Linux: `sh start-macos-linux.sh`.

**Do not open `.html` files directly with `file://`.** The small web server is necessary for synchronized timers, secure phone control and durable scenes. It is local-first and does not send information to an outside service.

## Quick access

| View | Address | Purpose |
| --- | --- | --- |
| Control | `http://localhost:4173/control` | Edit everything and run the workout |
| Overlay | `http://localhost:4173/overlay` | Transparent output for OBS Browser Source |
| Mobile remote | `http://localhost:4173/remote` | Compact key-protected control deck for phones/tablets |
| Black Zoom overlay | `http://localhost:4173/overlay?bg=black` | Solid black background when a transparent source is unavailable |
| Green Zoom overlay | `http://localhost:4173/overlay?bg=green` | Green-screen alternative for chroma-key workflows |
| Health | `http://localhost:4173/api/health` | Verify server is running |

## Streaming essentials

- OBS: create **Browser Source**, URL `http://localhost:4173/overlay`, width **1920**, height **1080**; move that source above your camera/video; select OBS canvas 1920×1080.
- Zoom video: in OBS, press **Start Virtual Camera**; in Zoom camera settings choose **OBS Virtual Camera**. The composite video includes the overlay.
- Zoom **audio**: OBS Virtual Camera is a **video path, not an audio transmitter**. Test the beeps in OBS separately. Sending beeps into Zoom needs additional audio-routing configuration or screen-share-with-sound. See guides.
- The server must remain running during streaming. On restart, saved settings/scenes and paused timer data remain stored; running timers use the saved server timestamp to resume and may complete during an outage.

## Local data and backup

Files in `data/` are created at startup and should be **kept private**:

- `data/control-key.txt`: persistent secret for remote changes.
- `data/state.json`: all current settings, timer data, logo image and scenes. It contains no passwords.

Use the **Export backup** button in Scenes for a portable JSON file. The backup deliberately excludes the control key. Copy the full project and the exported backup to another machine/server; import in the controller. The server can also use another directory via `OVERLAY_DATA_DIR`.

## Commands and extensions

```bash
npm test       # Node unit and HTTP/SSE tests (no dependencies)
npm run check  # JavaScript syntax checks
npm start      # run application
```

Optional visual checks require **Python + Playwright + Chromium** (`tests/ui-offline.py`, `tests/visual-qa.py`). These are for developers, not required for operation.

Grok feature/architecture selection and regression evidence: `docs/CHERRY-PICK-AUDIT.md`.

Details: `docs/ARCHITECTURE-AND-EXTENSION.md`, `docs/SECURITY.md`, `docs/SELF-HOSTING.md`, `docs/ACCEPTANCE.md`, `docs/SCOPE-AND-BUDGET-DE.md`, and `LICENSE-AND-RIGHTS.md`.

## Known limitations / acceptance boundary

- Phone control is **LAN-only**, not an Internet cloud account service. It requires the host machine online and reachable.
- The overlay supports standard OBS Browser Source and is architected for Streamlabs Browser Source. Hardware/OS-specific OBS, Streamlabs and Zoom testing must be completed on the client's setup; **this repository does not claim a successful physical Zoom call**.
- Browser autoplay/audio permissions differ. Video via OBS Virtual Camera and audio into Zoom require separate acceptance.
- Full participant rosters, rotating sponsor logos, external live chat, WebRTC camera/mic streaming, and public cloud rooms remain **future extensions**. A single heat/athlete label, a single sponsor logo and event ticker **are included**.
- No bundled OBS or Zoom installers, commercial fonts, or licenses.
