# OBS / Zoom / Ton / Mobil — echte Geräteabnahme (Deutsch)

**Status: OFFEN.** Diese Seite ist eine Anleitung für die reale Prüfung und kein Protokoll bereits durchgeführter Tests.

1. **OBS 1920×1080:** Leinwand und Ausgabe auf 1920×1080 einstellen. Eine echte Kamera als unterste Quelle hinzufügen. Browserquelle `https://wod-studio-1415661536.netlify.app/overlay` auf 1920×1080 konfigurieren und über die Kamera legen. Die Transparenz muss sichtbar sein. Eine 20–30 Sekunden lange OBS-Aufnahme speichern.
2. **Live-Steuerung:** In `/control` anmelden. Logo, WOD, Trainer, Schriftfarbe und Trainername ändern. Countdown starten, pausieren, fortsetzen, zurücksetzen und Rundenwechsel prüfen. Aufnahme kontrollieren.
3. **OBS Virtual Camera / Zoom:** Virtuelle Kamera in OBS starten; in Zoom `OBS Virtual Camera` wählen. Einen eingeladenen zweiten Teilnehmer um eine Sichtbestätigung bitten. Live-Änderungen beobachten und das Ergebnis dokumentieren. Ein echter Zoom-Testanruf kann nicht allein durch automatisierte Webtests ersetzt werden.
4. **Ton:** Browserquelle in OBS über den Mixer steuern, Signaltöne aktivieren. Eine OBS-Aufnahme mit Ton prüfen. OBS Virtual Camera transportiert kein Mikrofonsignal und keinen OBS-Mix zu Zoom. Zoom benötigt eigene Audio-Routing-Konfiguration, z. B. virtuelle Audioleitung oder Bildschirmfreigabe mit Computerton; separat abnehmen.
5. **Smartphone:** Auf einem realen Mobilgerät `/remote` öffnen. Schlüssel eingeben; Timer, Runden und Szenen schalten. Netlify nutzt kurze Abfragen (~2,4 Sekunden), nicht die lokale SSE-Direktverbindung.
6. **Szenen und Backup:** Zwei Szenen inklusive Logo speichern, nach Neuladen wieder öffnen, JSON exportieren/importieren und vor/nach Netlify-Neuveröffentlichung prüfen. Bei gehosteten Backups maximal 5,4 MB HTTP-JSON (zusätzlich Netlify-Limit 6 MB) beachten; auf lokalem Node-Server bis 60 MB.
7. **Abnahmeprotokoll:** Betriebssystem, OBS-/Zoom-Versionen, Prüfer, Zeit, Aufnahme, PASS/FAIL und Abweichungen in `RELEASE-ACCEPTANCE-V2.md` dokumentieren. Unterschriften und Zahlungsfreigaben separat einholen.
