# Moving the project to another machine or server

## Another Windows/Mac/Linux computer — no cloud

1. Install Node.js 20+ on the destination.
2. Copy the complete ZIP and extract it, preserving the `public/`, `docs/`, and `data/` folders.
3. If you have custom scenes, use **Scenes → Export backup** on the old host and **Scenes → Import backup** on the new host, or securely copy the old private `data/state.json` while the servers are stopped.
4. Run `npm start` in the new project folder. Record the new control key printed on startup.
5. Update OBS Browser Source to `http://localhost:4173/overlay` on the new host. If OBS runs on a different PC, use the new host's private LAN IP instead of `localhost`.
6. Verify logo assets, saved layouts, timing, phone connection, and OBS output.

## Private Linux host with persistent data

```bash
# example: from extracted project directory
sudo mkdir -p /var/lib/wod-studio
sudo chown "$USER":"$USER" /var/lib/wod-studio
HOST=127.0.0.1 PORT=4173 OVERLAY_DATA_DIR=/var/lib/wod-studio node server.mjs
```

To keep the service running automatically, create a `systemd` unit (replace `USER_NAME` and folder paths):

```ini
[Unit]
Description=WOD Stream Studio
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=USER_NAME
WorkingDirectory=/opt/wod-stream-studio
Environment=HOST=127.0.0.1
Environment=PORT=4173
Environment=OVERLAY_DATA_DIR=/var/lib/wod-studio
ExecStart=/usr/bin/node /opt/wod-stream-studio/server.mjs
Restart=on-failure
RestartSec=3
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Enable with `sudo systemctl daemon-reload && sudo systemctl enable --now wod-studio` and follow logs with `sudo journalctl -u wod-studio -f`. Keep file ownership and firewall locked down to the intended operator.

## Optional public hostname — security work required

**Never forward the bare Node application port to the public Internet.** A public setup needs HTTPS and access controls in front of the controller, preferably VPN/SSO. A basic Caddy reverse proxy *structure* (not a complete production security configuration) is:

```caddy
wod.example.com {
    encode gzip
    reverse_proxy 127.0.0.1:4173 {
        flush_interval -1
    }
}
```

Before exposing any endpoint, restrict authentication/access as described in `SECURITY.md`. The display (`/overlay`) can be exposed separately if intended, but it also exposes the workout's on-air data and logo. HTTPS certificate setup may require a DNS/domain/service provider. Optional VPS/domain costs are **not part of the local 200 € software scope**.

## Backup, updates, portability

- Prefer to stop the server before copying `data/state.json`; otherwise use GUI Export backup for a consistent saved snapshot.
- Back up `data/control-key.txt` in a password-safe place, or rotate it by deleting this file *only while stopped* (all controllers must then reauthenticate). Do not place the key in Git.
- To upgrade, unpack new source and leave your private `data/` directory intact; test with a backup first because future schema migrations may be necessary.
- This app uses relative paths and only local assets. Nothing needs access to a developer's cloud account or proprietary build tooling.
