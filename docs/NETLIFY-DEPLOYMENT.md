# Netlify deployment – WOD Stream Studio 1.2

GitHub Actions deploys this repository to a dedicated site using the `NETLIFY_TOKEN` GitHub repository secret. The workflow creates the site on first run and reuses it for subsequent `main` branch deployments. Its production URL is included in the Actions run summary.

## Required secrets

1. `NETLIFY_TOKEN` (already supplied by the repository owner): Netlify personal access token, used exclusively in CI and not exposed to the browser.
2. `OVERLAY_CONTROL_KEY`: **a separate randomly generated password at least 12 characters long**. Add it in GitHub Settings → Secrets and variables → Actions → New repository secret. Example generation: `openssl rand -hex 24`. Never use the Netlify access token for this purpose. The workflow securely sets this as a Netlify **production Functions secret** during deployment.

If `OVERLAY_CONTROL_KEY` is absent, the public display and preview work but modifications, timers and remote controls are intentionally disabled (503); no insecure default password is created. Configure the key, rerun `Deploy WOD Stream Studio to Netlify` under GitHub Actions, and paste the key into the login box at `/control` and `/remote`. Do not put the key in a public URL or OBS browser source URL.

## Pages

- `/control`: editor, timer transport, layouts and saved scenes; requires control key for mutations.
- `/overlay`: OBS-compatible transparent broadcast layer (1920x1080 Browser Source).
- `/remote`: mobile/tablet controller.
- `/api/health`: public mode and configuration status (never returns secrets).

## Architecture and trade-offs

Local `npm start` retains the existing Node.js server and streaming SSE. On Netlify, static HTML/CSS/JS is hosted as-is; API calls are routed to a Netlify Function. Netlify Blobs stores site-wide JSON state using strongly consistent reads; timer anchors are server-time-based, so countdowns advance without continuously running a background server. Pages poll state approximately every 2.4s and render timer updates locally at high frame rate.

* Avoid simultaneous edits from multiple controllers: Netlify Blobs uses last-write-wins and is not transactional.
* Netlify function invocations, Blob storage and bandwidth count against your Netlify subscription limits. Check Netlify billing/usage before prolonged broadcasting. No new paid library is needed for the core application, but hosted usage may incur costs.
* The live overlay endpoint is intentionally publicly readable (so OBS can access it). Do not put confidential information in broadcast fields.
* Remote beeps are generated in the viewing browser and do not automatically transmit into Zoom audio.
* A production OBS→Zoom Virtual Camera acceptance test still requires the streaming PC.

## Re-deploy

Push to `main` or choose Actions → Deploy WOD Stream Studio to Netlify → Run workflow. Review its run log and summary for the URL. No server credentials or Netlify account ownership are stored in source control.
