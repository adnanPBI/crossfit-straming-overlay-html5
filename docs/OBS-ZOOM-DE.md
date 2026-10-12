# Anleitung: OBS, Streamlabs, Zoom und Smartphone-Fernsteuerung

## Voraussetzungen

- PC/Mac mit **Node.js 20+** und [OBS Studio](https://obsproject.com/) (kostenfrei), aktuellem Browser sowie optional Zoom Desktop.
- Für Smartphone-Steuerung: PC und Telefon im **gleichen privaten WLAN/LAN**.
- Keine Cloud, kein Firebase-Konto, keine kostenpflichtige Lizenz für das Kernprojekt.

## 1. Anwendung starten

Im Projektordner Terminal öffnen und `npm start` ausführen (Windows alternativ `start-windows.bat`). Im Terminal werden die Adressen und ein neu erzeugter **Steuerschlüssel** angezeigt.

- Bedienoberfläche: `http://localhost:4173/control`
- Transparenter Ausgang: `http://localhost:4173/overlay`

Der Server muss beim Streamen geöffnet bleiben. **Nicht** HTML-Dateien per Doppelklick (`file://`) aufrufen: Dann funktionieren Synchronisation, Speicherung und Fernsteuerung nicht.

## 2. OBS einrichten

1. OBS → **Einstellungen → Video** → Basisleinwand 1920×1080 wählen.
2. Szene hinzufügen, z. B. **CrossFit Live**, und Kamera/Videoquelle einrichten.
3. Unter **Quellen → + → Browser** eine neue Quelle anlegen: Name `WOD Overlay`.
4. **Lokale Datei deaktivieren**; URL `http://localhost:4173/overlay`, **Breite 1920**, **Höhe 1080**, z. B. 30 FPS.
5. Overlayquelle **über die Kameraquelle** ziehen. Transparenter Seitenhintergrund ist bereits eingebaut.
6. Start/Pause/Reset und Texte/Logo/Szenen in `/control` bedienen und Änderungen direkt in OBS prüfen.
7. Signaltöne: In den Browsereigenschaften ggf. **Audio über OBS steuern** aktivieren und OBS-Audiomixer prüfen. Die Vorschau im Bedienpanel spielt selbst keine Signaltöne ab.

Offizielle Anleitung: https://obsproject.com/kb/browser-source

## 3. Zoom mit OBS Virtual Camera

1. OBS-Szene öffnen und **Virtuelle Kamera starten** klicken.
2. In Zoom → Einstellungen → Video → Kamera **OBS Virtual Camera** auswählen.
3. Privates Testmeeting mit zweitem Gerät durchführen: Video, drei Zonen, Live-Timer, Schriften, Logos und Updates überprüfen.
4. **Wichtig:** OBS Virtual Camera überträgt **Video, nicht automatisch Ton**. Für Ton/Signaltöne in Zoom muss eine zusätzliche Audioverbindung eingerichtet und getestet werden (z. B. virtuelle Audioleitung oder Bildschirmfreigabe mit Computerton). Normales Zoom-Mikrofon bleibt eigenständig.
5. Bei fehlender Kamera: Zoom neu öffnen, Kamera-Freigabe überprüfen, OBS Virtual Camera-Fehlerbehebung lesen.

Offizielle Anleitung: https://obsproject.com/kb/virtual-camera-guide

## 4. Fernsteuerung mit Smartphone/Tablet

1. PC und Mobilgerät mit demselben vertrauenswürdigen Netzwerk verbinden.
2. Im Server-Terminal den Eintrag `Phone (same Wi-Fi)` notieren, z. B. `http://192.168.1.30:4173/control`.
3. Im Telefonbrowser öffnen und den Terminal-Schlüssel eingeben.
4. Gegebenenfalls PC-Firewall für TCP 4173 **nur im privaten Netzwerk** freigeben; Gast-WLAN/Client-Isolation deaktivieren.
5. Im Stream Start/Pause/Weiter/Reset testen. Layouts und WOD-Text können parallel geändert werden.

## 5. Streamlabs

Browser-Quelle mit derselben URL, 1920×1080 und transparentem Seitenhintergrund einrichten. Da Streamlabs-Versionen Audio-/Browserdetails unterschiedlich umsetzen, ist ein eigener Streamlabs-Test nötig. Eine echte Streamlabs-Sitzung wurde in dieser Entwicklungsumgebung nicht überprüft.

## 6. Fehlersuche und Abnahme

- Leere Anzeige: Läuft Node? Richtiger Port? OBS Browserquelle aktualisieren.
- Schwarzer Hintergrund: Position der Kamera **unter** der Quelle und OBS-Szenenhintergrund prüfen.
- Keine Handyverbindung: LAN-IP, Firewall, Port, WLAN und Netzwerkisolation überprüfen.
- Kein Signalton: OBS-Audiomixer, Browserquelle und Autoplay-Regeln prüfen. **Ton in Zoom ist ein separater Übertragungsweg.**
- Keine Echtzeit-Updates: Server neu starten, Seite neu laden, SSE-Verbindung prüfen.
- Änderungen am Timerprofil setzen den Timer zurück; das ist bewusst so implementiert. Texte/Logo/Layouts ändern den laufenden Timer nicht.

**Physischer Abnahmetest erforderlich:** OBS-Aufnahme sowie Zoom-Testcall auf Kundengerät, einschließlich beobachteter Smartphone-Änderung. Automated Code/API tests ersetzen diesen Test nicht. Prüfliste in `ACCEPTANCE.md`.


### Zusätzliche Streaming-Wege (v1.1)

- Transparente OBS-Browserquelle: `http://localhost:4173/overlay`.
- Schwarzer Zoom-Hintergrund: `http://localhost:4173/overlay?bg=black`.
- Greenscreen-Variante: `http://localhost:4173/overlay?bg=green` (Chroma-Key nur nach Bedarf konfigurieren).
- Kompakte Handy-Steuerung: `http://DEINE-LAN-IP:4173/remote` – mit vorhandenem Steuerschlüssel.
- Zeitformeln: `20/10*8` und `(arbeit 40 + pause 20)*8`. Trainingsarten: AMRAP, EMOM, Tabata und For Time.
- Signallautstärke und Schwellenwerte sind einstellbar. Die virtuelle OBS-Kamera überträgt **nur Video**; Audio-Routing in einem echten Zoom-Test prüfen.
