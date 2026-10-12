# Architecture and developer handover

## Topology

```
         Phone / Tablet             Desktop controller
         /control  ───── HTTPS? ─── /control
                  \              /
                    local Node HTTP server (:4173)
                     |      |      |
            /api/state  SSE /api/events  mutation REST (control key)
                     |      |      |
               central workout state + timer anchors
                     |      |      |
                atomic JSON persistence (data/state.json)
                     |
        OBS Browser Source  /overlay (transparent 1920×1080)
                     |
        OBS composition: camera + graphic overlay
                     |
        OBS Virtual Camera → Zoom (video only)
```

**Tech stack:** HTML5, CSS3, ES modules, WebAudio, EventSource (SSE), Node.js built-in `http`, `fs`, `path`, `crypto`, and `os`. No Webpack, React, subscriptions, database, CDNs or runtime npm packages.

### Source map

| File | Responsibility |
| --- | --- |
| `server.mjs` | Static HTTP server, authentication, REST APIs, SSE broadcast, scene persistence, timer commands |
| `public/control.html` | Accessible independent control screen and all form fields |
| `public/overlay.html` | OBS output's three independent zones |
| `public/css/control.css` | Desktop/tablet/phone controller layout and dark theme |
| `public/css/overlay.css` | Transparent Full-HD layout and responsive panel transitions |
| `public/js/defaults.js` | Defaults, built-in scenes, field sanitizers and schema whitelist |
| `public/js/timer-engine.js` | Deterministic timeline, nested sequence formula parser, time calculation, formatting; shared by server and browsers |
| `public/js/i18n.js` | UI strings for de/en/fr/es/it/pt and phase translations |
| `public/js/api.js` | Authorized REST wrapper and WebAudio beeps |
| `public/js/control.js` | UI bindings, form autosave, scenes, keyboard shortcuts, key login, SSE state |
| `public/js/overlay.js` | Live on-air elements, phase/progress colors, clock and sound; no control permissions |
| `public/sample-logo.png` | Project-created generic demonstration logo; replace via controller |
| `tests/` | Unit, HTTP/SSE integration, optional UI and visual tests |
| `docs/` | Handover, acceptance, scope/price, OBS/Zoom and security |

## State schema / stability

```json
{
  "settings": {
    "language": "de",
    "appearance": {"leftWidth":25,"rightWidth":30,"panelOpacity":77,"animations":true,"hidePanelBackground":false,"accentColor":"#7cfaab"},
    "left": {"logoDataUrl":"/sample-logo.png","title":"THE DAILY GRIND","font":"condensed"},
    "middle": {"showTimer":true,"showPhase":true,"showRound":true},
    "right": {"wodTitle":"TODAY’S WOD","wodText":"5 ROUNDS...","coach":"COACH ALEX"},
    "timerSettings": {"mode":"intervals","rounds":5,"workSec":60,"restSec":20,"leadSec":5,"timeCapSec":0,"sound":true}
  },
  "timer": {"status":"idle","elapsedMs":0,"anchorMs":null},
  "scenes": [{"id":"preset-competition","name":"Competition","settings":"..."}]
}
```

The actual schema includes all text, visibility, size/color and output fields; inspect `public/js/defaults.js`. Imported settings pass strict normalization (unknown fields are dropped). JSON backup format: `crossfit-overlay-v1`. Data is saved atomically to `data/state.json`. Current timer running time is computed from `elapsedMs` + `(now - anchorMs)`; no continuous 10 Hz database writes. Every controller and the output calculate the same phase locally between server messages. SSE provides state changes and timing anchors rather than high-frequency tick spam.

## API reference

| Method / route | Key required? | Behavior |
| --- | --- | --- |
| `GET /api/health` | No | `ok`, version, uptime |
| `GET /api/state` | No | Settings, timer, scene names, revision and `serverNow` |
| `GET /api/events` | No | SSE `snapshot` events; long-lived connection |
| `POST /api/auth` | Yes | Verify the shared control key |
| `PATCH /api/settings` | Yes | `{ "patch": { "left": { "title": "New text" } } }`; field-safe live update; any timer config change resets timer |
| `POST /api/timer` | Yes | `{ "action": "start" | "pause" | "reset" | "next" }` |
| `GET /api/scenes` | Yes | Scene IDs and names |
| `POST /api/scenes` | Yes | `{ "name":"Competition evening" }` snapshot current settings |
| `POST /api/scenes/load` | Yes | `{ "id":"..." }`; resets timer |
| `DELETE /api/scenes/:id` | Yes | Delete user scene; built-in presets protected |
| `POST /api/defaults` | Yes | Restore initial settings (preserve scenes) |
| `GET /api/export` | Yes | Portable JSON settings/scenes without control key |
| `POST /api/import` | Yes | Import valid `crossfit-overlay-v1` backup; resets timer |

**Control header:** `X-Overlay-Key: <your control key>` for mutating/backup endpoints. No cookies required. Use only on the trusted LAN until HTTPS/auth is deployed.

## How to extend

1. **Add a new on-air text field:** add a default key and field sanitizer in `defaults.js`; add an input with `data-path="right.newField"` in `control.html`; add a display node to `overlay.html`, render with `.textContent` in `overlay.js`; add CSS and corresponding translations.
2. **Add a new language:** insert a dictionary in `i18n.js`, add a `<option>` in `control.html`, update supported `LANGUAGES` in `defaults.js` and `localeTag` in `i18n.js`, then test UI/clock/phase strings.
3. **Add a timer mode:** update `normalizeTimerSettings`, `buildTimeline`, corresponding control UI fields and `updateMode`; preserve command idempotence, and add unit tests.
4. **Add sponsor or athlete records:** use a new settings collection with validation/size limits, a new zone renderer, scene import schema handling and suitable client privacy rules. Do not accept arbitrary HTML from participants/chat; use `.textContent` or safe DOM construction.
5. **Add Internet phone control:** put the app behind HTTPS + authenticated reverse proxy/VPN, move to multiuser permissions before opening publicly. A shared LAN key alone is not sufficient for public use.
6. **Style changes:** edit `public/css/control.css` or `public/css/overlay.css` directly. The running web server serves changes upon page refresh; no bundler needed.

## Time sequence grammar

```
formula    := term ("+" term)*
term       := positive_integer "*" (duration | "(" formula ")")
            | "(" formula ")" | duration
duration   := 30 | 2m | 1.5m | 15s | 1h | 01:30 | 1:02:03
```

Spaces ignored. Max repetitions 99, total 240 phases / 24 hours. Time cap applies to combined workout duration and preserves preparation before the workout. In stopwatch mode, time cap sets maximum stopwatch time; with 0, stopwatch is unbounded.

## Test and release

```
npm run check
npm test
```

`tests/ui-offline.py` tests actual control JS with a simulated API in a Chromium environment where URL navigation is blocked. `tests/visual-qa.py` checks the HTML/CSS/overlay JS against real viewport sizes. To run end-to-end on a normal computer, use `tests/browser-smoke.py` against a **disposable** running instance and the optional Playwright dependencies; then complete actual OBS/Zoom steps in `docs/ACCEPTANCE.md`. Tests are not an executed client hardware certification.


## Release 1.1.0 selective cherry-pick architecture

The CHALKLINE/Grok workspace was assessed as a feature reference, not copied as a React application. Its concepts were re-implemented as dependency-free ES modules preserving the original Node server, key-gated control APIs and read-only OBS browser source. New files: `public/js/formula-v2.js`, `public/js/remote.js`, `public/css/remote.css`, `public/remote.html`, `tests/enhancements.test.mjs`, `tests/remote-ui.py`, and `docs/CHERRY-PICK-AUDIT.md`. The `timer-engine.js` remains shared between browser, remote and server so the timer cannot drift between screens. Backups continue to use `crossfit-overlay-v1`; the read path fills new schema defaults automatically and existing saved scenes remain valid.

The public overlay page can also use `?bg=black` or `?bg=green` for Zoom/chroma-key use; this parameter never grants remote-control access. The phone deck uses the existing random control key and SSE subscriber connection; no anonymous room-code mutation is introduced.
