# OBS / Streamlabs / Zoom practical setup (English)

## Prerequisites

- A computer running Windows, macOS or Linux, current browser, **Node.js >= 20**.
- [OBS Studio](https://obsproject.com/) (no OBS plugin required). If you use Streamlabs Desktop instead, look for the equivalent **Browser Source** and test separately.
- [Zoom Desktop client](https://zoom.us/download) for Zoom delivery (if you need Zoom).
- Webcam or camera source and sufficient hardware for the desired video resolution.
- Workstation and phone on the same trusted local Wi-Fi/LAN for phone control.

## 1. Start the web application

```bash
cd crossfit-stream-overlay
npm start
```

Do not close the terminal. If the default TCP port 4173 is busy, choose another, for example:

- macOS/Linux: `PORT=4174 npm start`
- Windows PowerShell: `$env:PORT=4174; npm start`

Open `/control` and enter the control key printed on startup. Separately open `/overlay` to see the transparent output.

## 2. OBS Browser Source — verified integration specification

1. Start OBS Studio. In **Settings → Video**, choose canvas/base resolution **1920×1080** and output resolution **1920×1080** (or scale your video as appropriate).
2. Create a scene such as `WORKOUT LIVE`. Add the webcam/video capture source first.
3. Under **Sources**, press **+ → Browser**, name it `WOD Stream Overlay`, and configure:
   - **Local file: unchecked**. Use URL mode, not an `.html` disk path.
   - **URL:** `http://localhost:4173/overlay` (use your chosen port if different).
   - **Width:** 1920, **Height:** 1080, **FPS:** normally same as your OBS canvas, e.g. 30.
   - Keep browser source **above** camera/video in the source ordering.
   - Disable **Shutdown source when not visible** if you want the browser to remain loaded through scene switches.
   - Leave default transparent background CSS or add `body { background: rgba(0,0,0,0); margin:0; overflow:hidden; }`.
4. Use the Control Room (on PC or mobile) to confirm logo, countdown, intervals and text change while OBS Preview stays visible.
5. For audible timer beeps in the OBS stream, enable **Control audio via OBS** in Browser Source properties if available; check that the Browser Source appears in the OBS Audio Mixer and is not muted. Turn on monitoring where required by the audio setup. The app suppresses beeps in the dashboard's embedded preview to avoid doubling.
6. Do a local OBS recording, review alpha layering, readability, beep timing, and source refresh/reconnect behavior.

OBS documentation: [Browser Source](https://obsproject.com/kb/browser-source), [Virtual Camera](https://obsproject.com/kb/virtual-camera-guide).

## 3. Zoom over OBS Virtual Camera

1. Keep the OBS scene visible and working. In **OBS Controls**, click **Start Virtual Camera**. Use the Program source (default) if you want the active composited scene.
2. Open Zoom → Settings → Video → Camera and choose **OBS Virtual Camera**. Alternatively change the camera from the arrow beside **Start/Stop Video** during a meeting.
3. Start a private test meeting with a second device/observer. Confirm the camera picture contains all three zones, the text does not mirror incorrectly, and timer updates appear.
4. **Important audio separation:** Virtual Camera carries **video**, not the OBS Audio Mixer. Zoom continues to use its own microphone selection. If the remote Zoom participants must hear timer beeps, configure a deliberate audio path (for example, a compatible virtual audio cable or screen sharing with computer audio) and test it. A virtual audio driver can be an optional extra tool; the **core app itself needs none**.
5. Verify microphone, echo cancellation, camera permissions, frame rate, CPU use, networking, and source order on the actual broadcasting workstation.

Zoom documentation: [Select a different camera](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0068908).

## 4. Smartphone / tablet control

1. Keep the server running on the streaming computer.
2. Find the `Phone (same Wi-Fi)` address in the server terminal, e.g. `http://192.168.1.30:4173/control`.
3. Connect both devices to the **same trusted LAN**, allow incoming TCP 4173 in the host firewall on **Private Networks only**, and disable guest-network/client isolation if the devices cannot see one another.
4. Type the control key. Avoid sharing the key or the `data` directory.
5. Test Start → Pause → Resume → Reset, changing text and switching scenes while OBS Preview is open.

## 5. Streamlabs Browser Source

Use the URL `http://localhost:4173/overlay`, viewport 1920×1080, and put it above video. Transparency follows the web page background. The app doesn't call private OBS APIs. However, Streamlabs versions and their browser/audio handling vary; separate client-machine validation is required.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Blank browser source | Server running? Correct port, URL, and width/height? Click Refresh cache. |
| Solid black scene | OBS source order; browser source background should be transparent; webcam must be underneath. |
| Phone cannot connect | Same Wi-Fi? Correct LAN IP/port? Host firewall? Guest network isolation? |
| 'Control key incorrect' | Read `data/control-key.txt` on the server computer; refresh/re-enter key. |
| Beeps not audible in OBS | Browser audio setting, OBS mixer, monitoring settings, CEF/autoplay policy; use Test beep, then test during a running round. |
| Beeps not heard in Zoom | Virtual Camera is video-only; route audio separately. |
| OBS Virtual Camera missing in Zoom | Start Virtual Camera, reopen Zoom, grant camera permissions; see OBS troubleshooting guide. |
| Layout doesn't update | Verify server and EventSource reconnect in browser; hard reload control/overlay; avoid using `file://`. |
| Timer seems to jump after PC sleep | Server wall clock advanced. Reset and restart for a new session. Keep the machine awake when broadcasting. |

## Actual acceptance evidence to capture

Attach screenshots or a short recording from the client's PC showing: camera under transparent overlay; 1920×1080 source properties; multiple phase changes; phone controls; Zoom settings showing OBS Virtual Camera; second Zoom participant receiving updated video; audio route if audio-in-Zoom is in the agreed scope. This is a **manual real-machine test**, not something proven by the bundled Node tests.


### Additional v1.1 streaming paths

- Transparent OBS source: `http://localhost:4173/overlay`.
- Black Zoom-friendly background: `http://localhost:4173/overlay?bg=black`.
- Chroma green background: `http://localhost:4173/overlay?bg=green` (configure chroma key only if your workflow needs it).
- Separate compact phone control: `http://YOUR-LAN-IP:4173/remote` — use the existing control key.
- Time formulas accept `20/10*8` and `(work 40 + rest 20)*8`. Workout protocols include AMRAP, EMOM, Tabata and For Time.
- Beep volume/threshold settings affect overlay audio/visual timing but OBS Virtual Camera **still transports video only**. Test audio routing in a real Zoom meeting.
