# Security and deployment boundaries

## Default threat model

This is a **single-stream local LAN controller**, not an Internet-facing multi-user SaaS platform.

- The read-only overlay page and `/api/state`/`/api/events` expose current on-air text/logo/timer data, so **everyone who can connect to the server can see on-air content**.
- **All mutation APIs require an `X-Overlay-Key` header.** The server creates a random 36-hex-character key on first startup in `data/control-key.txt`, or uses a configured `OVERLAY_CONTROL_KEY` (12+ characters).
- Browser controls store the key in **sessionStorage**, never in the URL or export backup. API compares SHA-256 digests in constant time.
- Incoming settings are normalized using only known keys; invalid SVG/non-image logo data URLs, unknown timer modes and oversized formula expansions are rejected.
- Static file serving is restricted to `public/` and known file extensions. `.env`, data files and server code are not exposed by the HTTP server.
- No external CDN fonts, analytics, tracking pixels, databases, npm runtime dependencies, or developer-managed cloud endpoint.

## Important limitations

1. **Do not port-forward TCP 4173 directly to the Internet.** Default `HOST=0.0.0.0` allows devices on the LAN to connect. Use only trusted Private Network firewall rules.
2. **HTTP on LAN is not encrypted.** A malicious person on that network could intercept the control key. For public or untrusted networks, use HTTPS, a reverse proxy and additional real authentication (VPN/SSO, etc.).
3. The display page is public read-only to nearby network clients. Do not put confidential personal data in on-air fields. Future chat/participant profiles need additional privacy work.
4. Saved `data/state.json` includes logo image and workout text. Protect file permissions, backups and the `data/control-key.txt` secret. Exclude `data` from public Git repos (already in `.gitignore`).
5. Multiple controller devices may edit the same field at once; last committed edit wins. For a competition, nominate one lead operator.
6. The runtime does not implement accounts, per-user roles, brute-force rate limiting, CSRF cookies, TLS or cloud identity. The shared high-entropy key is intentionally limited to trusted LAN use.

## If a remote Internet deployment is needed later

1. Configure `HOST=127.0.0.1`, a persistent `OVERLAY_DATA_DIR`, and a strong `OVERLAY_CONTROL_KEY`.
2. Put it behind an HTTPS reverse proxy such as Caddy or Nginx with user authentication. Restrict control routes and ideally view routes by VPN/IP.
3. Back up the data directory and monitor logs; configure OS updates, rate limiting and firewall rules.
4. Verify reverse-proxy support for long-lived SSE `GET /api/events` (disable buffering and allow keep-alive).
5. Never publish the control-key file, .env or JSON exports containing private on-air information.

Sample **proxy architecture** (not bundled or automatically configured):

```
HTTPS + VPN/SSO (optional)
       |
Caddy / Nginx reverse proxy
       |
127.0.0.1:4173 -> WOD Stream Studio (Node.js)
       |
private data directory
```

## Image restrictions

- PNG, JPEG and WebP only; max 2,000,000 decoded bytes each.
- SVG uploads are blocked to reduce active-content/script risks.
- Images are stored as data URLs in JSON; exported scene backups may become large if many scenes include large logos.
