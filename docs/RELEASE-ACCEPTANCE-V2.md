# WOD Stream Studio 2.0 — release acceptance ledger (DE / EN)

**Status:** Software tests passed locally; physical OBS/Zoom and signed legal sign-off **open** until evidence is supplied. Never mark device checks as passed based only on CI or screenshots.

## Operational acceptance matrix

| ID | Test / evidence | Owner | Status | Evidence file / date |
|---|---|---|---|---|
| T01 | 1920 × 1080 OBS Browser Source capture over a real camera, alpha respected | Client streaming workstation | PENDING | |
| T02 | OBS Virtual Camera into Zoom, second attendee confirms live composited video | Client + invited witness | PENDING | |
| T03 | Work/rest/finish beeps in OBS recording and Zoom audio routing decision | Client streaming workstation | PENDING | |
| T04 | Smartphone/tablet control across device/network (start, pause, reset, text, scenes) | Client's physical device | PENDING | |
| T05 | Netlify isolated QA scene save, restore, redeploy survival, cleanup | GitHub Actions | AUTO: check latest run | |
| T06 | Real logo-containing backup v2 export/import, legacy v1 compatibility, request bounds | Automated + client representative data | AUTO + CLIENT PENDING | |
| T07 | GPLv3 copyright provenance clarified and contractual owner/signatures recorded | Rights holders + client | PENDING | |
| T08 | 200 EUR milestone acceptance and final delivery receipt | Contracting parties | PENDING | |
| T09 | Streamlabs browser source (if client uses Streamlabs) | Client workstation | PENDING | |

## Streaming demonstration procedure

1. In OBS set **Base Canvas and Output: 1920 × 1080**, then add a camera/video source as the bottom layer.
2. Add a **Browser Source** pointing to `https://wod-studio-1415661536.netlify.app/overlay` at 1920 × 1080, over the camera. Confirm alpha by showing a live camera behind panels; use an unedited OBS screenshot and a short MP4 capture.
3. Open `/control` and enter the existing controller key. Without showing the key to viewers, change logo, title, WOD and timer while recording OBS.
4. Start a 45-sec interval with a 15-sec rest, pause, resume and reset. Check warning colors and round numbers. Confirm the phase beeps in OBS recording when **Control audio via OBS** is enabled.
5. Start OBS Virtual Camera and select **OBS Virtual Camera** in Zoom. Have a second invited participant confirm the combined picture and live updates. Note any mirroring/cropping. Virtual Camera carries video, **not** OBS audio; choose an explicit virtual-audio route or Zoom screen-share-with-sound for beeps and test independently.
6. Open `/remote` on a physical phone/tablet and repeat start/pause/next/scene switching. On Netlify, state updates normally appear within ~2.4 seconds, not instant SSE.
7. Save the test evidence with device OS/OBS/Zoom versions, local timestamp, participant consent, PASS/FAIL and failure description. Do not record or publish another participant without authorization.

## Backup round-trip

1. Upload real PNG/JPEG/WebP logos no larger than 2 MB each.
2. Save 2+ custom scenes with the same logo; export v2 JSON. Verify that repeated assets are deduplicated in `assets`.
3. Change current title, import the backup, restore a saved scene and confirm WOD, logo, timer settings, language and layout are restored.
4. Repeat on another browser. Confirm persistence after full reload and a Netlify redeploy. Export data before modifying real show settings.
5. For Netlify, payload must be no larger than **5.4 MB** and must also satisfy Netlify's **6 MB buffered function payload** cap. Larger multi-logo archives should be restored on the local Node server (up to 60 MB). Test actual logo size before promising a hosted restore.

## Post-deployment automated checks

- `npm test` and `npm run check` must pass; offline Chromium screenshot is illustrative, **not a camera capture**.
- GitHub Actions checks homepage/remote/overlay/logo, legitimate and illegitimate control-key authentication.
- Its isolated `X-Wod-QA-Run` namespace tests scene save/load, timer, portable backup with a real PNG, redeploy persistence and cleanup **without mutating the customer's active broadcast state**.
- Check that QA cleanup succeeded; no persistent staging database is used. The service uses a Netlify Blobs site-wide key store; concurrent writes to one key remain last-write-wins, so only one show operator should perform authoritative scene edits at a time.

## Approval / Abnahmeprotokoll (to be signed after evidence review)

Project / Projekt: WOD Stream Studio 2.0

Developer / Entwickler: ____________________   Client / Auftraggeber: ____________________

Streaming workstation / Betriebssystem: ____________________

OBS version: __________ Zoom version: __________ Smartphone: __________

Test date / Datum: __________ Test witness / Prüfer: __________

Criteria passed / Abnahmepunkte: __________ Exceptions / Mängel: __________

Remedy deadline / Nachbesserungsfrist: __________

Milestone payments / Zahlungen: 20 EUR + 70 EUR + 70 EUR + 40 EUR = **200 EUR** (release **only after acceptance** of each milestone; this page does not prove payment).

Client signature / Unterschrift Auftraggeber: ____________________ Date: __________

Developer signature / Unterschrift Entwickler: ____________________ Date: __________

**No signature is inserted or assumed by the software builder.**
