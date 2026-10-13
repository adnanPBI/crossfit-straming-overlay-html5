# Acceptance checklist and handover record

## Completed during development (code-level / offline)

- [x] Node test suite for time grammar, nested repeats, phase transitions, caps, countdown, stopwatch, sanitization.
- [x] Real HTTP tests for auth rejection/acceptance, settings, timer start/pause/reset, scenes, export/import, persisted state across server restart.
- [x] Real Server-Sent Events event delivery test.
- [x] Transparent output body and geometrical 1920×1080 overlay checked in headless Chromium using inline source (local URL navigation unavailable due to managed sandbox policy).
- [x] Desktop and 390px phone HTML/CSS layouts checked for horizontal overflow.
- [x] Offline browser UI interaction with actual frontend JavaScript: access key, live text editing, French locale, timer start/pause/reset, width changes, mobile form.
- [x] Full readable project files, dependencies manifest, rights/handover draft, German/English OBS+Zoom documentation and French start guide.

## Must be performed on the customer's streaming workstation **before final acceptance**

| ID | Action / evidence | Acceptance criterion | Status |
| --- | --- | --- | --- |
| H01 | Run `npm start`, open `/control` with key | Control opens and shows complete editable forms | Not yet verified on client hardware |
| H02 | Open `/overlay` independently | Transparent background; 3 zones present; screen 1920×1080 | Not yet verified on client hardware |
| H03 | Upload, change, remove PNG/JPEG logo | Change visible immediately; survives restart | Not yet verified on client hardware |
| H04 | Edit 3-zone texts, colors, font, visibility | Overlay updates without reloading | Not yet verified on client hardware |
| H05 | Countdown, stopwatch, rounds work/rest, time cap | Correct timing, no premature phase and correct finish | Not yet verified on client hardware |
| H06 | Formula `2m+30+1:00`, `4*(1m+30)` | Exact sequence / repeat counts | Not yet verified on client hardware |
| H07 | Start/pause/resume/reset/skip; keyboard | All controls act on same canonical timer | Not yet verified on client hardware |
| H08 | Load/save/delete scene; restart Node | Saved layout recovered, default reset works | Not yet verified on client hardware |
| H09 | Export/import backup | Scene/config restored without needing original host account | Not yet verified on client hardware |
| H10 | Phone/tablet on private Wi-Fi | Control key works, edits update OBS live | Not yet verified on client hardware |
| H11 | OBS Browser Source URL 1920×1080 over camera | Alpha composition works; stream/recording shows camera under graphics | Not yet verified on client hardware |
| H12 | Start OBS Virtual Camera, Zoom selected camera | 2nd Zoom participant sees live composite/updates | Not yet verified on client hardware |
| H13 | Signal tones in OBS; if agreed, audio into Zoom | Audible as expected, no echo/duplicate sound | Not yet verified on client hardware |
| H14 | Streamlabs (if client uses it) | Alpha + edits work in installed Streamlabs version | Not yet verified on client hardware |
| H15 | Offline/restart recovery | Clear reconnect and persisted settings; no unplanned fees | Not yet verified on client hardware |
| H16 | Full ZIP transferred & source editable | Another developer can run/change files | Code package prepared; recipient confirmation pending |

**Sign-off recommendation:** record OS, Node version, OBS/Zoom version, test date, evidence screen/video, result PASS/FAIL per item, severity and agreed fix. Make milestone payments only after the agreed acceptance criteria are met.

## Known acceptance dependencies

- Zoom Virtual Camera sends the OBS **video composite**. Browser beep **audio** requires separate routing if it must enter Zoom.
- Actual streaming/audio/device testing cannot be certified from unit/API tests or screenshot previews alone.
- Streamlabs browser source compatibility depends on its installed version; no proprietary Streamlabs API integration is required.
- The fixed €200 software budget excludes hardware, paid streaming subscriptions, domain and externally managed hosting.


## Release 2.0 acceptance addendum

The final commissioning ledger is `docs/RELEASE-ACCEPTANCE-V2.md`, with German device test instructions `docs/STREAMING-ACCEPTANCE-DE.md`. GitHub Actions now has an isolated QA namespace to verify hosted backup, scene and cross-redeploy persistence **without changing any customer show state**. The actual outcome depends on the latest workflow run. Physical OBS recording, Zoom with a second participant, real smartphone, audio routing and legally signed rights must still be documented separately. No automated build silently changes their checkbox state to PASS.
