# Netlify production deployment — WOD Stream Studio 2.0

Production URL: `https://wod-studio-1415661536.netlify.app/`.

## GitHub secrets required

- `NETLIFY_TOKEN`: authorization for GitHub Actions to deploy to a site controlled by the user. Never expose in public URLs or frontend.
- `OVERLAY_CONTROL_KEY`: a distinct randomly generated password (minimum 12 characters). GitHub Actions generates a random-salted `scrypt` verifier into `netlify/control-verifier.generated.mjs` which is imported by **server-side Functions only**. The source file is gitignored and never contains plaintext. If the key is absent, deployment fails before publishing.

The workflow discovers the existing site by its full `wod-studio-1415661536.netlify.app` domain, avoiding duplicate-site API errors. A push to `main` triggers the CI workflow and deploys static files from `public/` and Functions from `netlify/functions/`. `--skip-functions-cache` forces regeneration of the verifier-bundled function.

## Critical deployment tests

1. Run Node tests and syntax checks.
2. Deploy UI and Functions.
3. Check health (`controllerConfigured:true`), homepage, logo, dashboard, overlay and remote pages.
4. Send a real POST `/api/auth` with the secret; ensure an invalid control key is rejected.
5. Create a separate authenticated `X-Wod-QA-Run` storage namespace (never the customer `current` state). Save a French-language scene and PNG logo, export/import a v2 backup, start/pause/reset the timer.
6. Redeploy the same release to the existing Netlify site, then verify the isolated saved state and scene persist, load/delete the scene, and remove the isolated QA object. This adds a second Netlify deployment per CI run; check usage limits.

Inspect the **actual latest GitHub Actions run**. Do not claim verification if these steps fail; static homepage success alone is insufficient.

## Data model and limits

Site-wide `@netlify/blobs` is used for storage so scenes persist across deploys. Blob reads are strongly consistent; simultaneous writers to the same key use last-write-wins, not transactions. Use one authoritative show operator. On Netlify, the overlay and remote receive snapshots approximately every 2.4 seconds; local Node SSE is near-live. The timer calculates elapsed time from timestamp anchors between snapshots, so displayed seconds remain fluid.

All saved content on a broadcast is publicly visible through `/api/state`. Do not store private personal details in WOD titles, logos or notes. Control keys must not be placed in URL parameters.

Backups: current export `crossfit-overlay-v2` deduplicates repeated PNG/JPEG/WebP data URLs across scenes; import accepts legacy `crossfit-overlay-v1` too. The hosted import enforces **5.4 MB JSON request**; Netlify buffered Function limit is **6 MB**. Oversized imports should use the local Node server (60 MB limit) or reduce embedded image sizes. Automatic QA uses one small sample logo and is not proof that every maximum-size user upload succeeds.

## Costs and self-hosting

Local `npm start`: no mandatory paid cloud service. Netlify Functions, Blobs, bandwidth and deployments follow the account's pricing and free-tier limits; no fixed zero-cost guarantee for hosting. Direct npm dependencies are `@netlify/blobs@11.1.4` (MIT runtime in Netlify) and `netlify-cli@27.12.0` (MIT deployment tool).

Physical OBS → Zoom and microphone/beep routing remain a separate workstation-based acceptance gate. See `docs/RELEASE-ACCEPTANCE-V2.md`, `docs/STREAMING-ACCEPTANCE-DE.md`.
