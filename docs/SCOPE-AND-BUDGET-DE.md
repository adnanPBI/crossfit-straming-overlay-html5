# Leistungsumfang und Festpreis — deutsches Angebot / Vertragsentwurf

**Projekt:** Individuelles CrossFit-Streaming-Overlay (HTML5 / OBS / Zoom)  
**Pauschale für Softwareentwicklung: 200,00 €** (Obergrenze; exklusive ausdrücklich gesondert vereinbarter externer Dienste).  
**Liefergegenstand:** lauffähiger ZIP-Quellcode mit HTML, CSS, JavaScript, Node-Server, Assets, Tests, Dokumentation, OBS-/Zoom-Anleitung.  
**Geplanter Ablauf bei vertraglichem Auftrag:** fünf Arbeitstage nach Startfreigabe und Zugang zu einem Kundentestgerät; jeder Meilenstein wird erst nach Prüfung freigegeben.  
**Statusbegriffe:** **enthalten**, **eingeschränkt enthalten**, **spätere Erweiterung**. „Eingeschränkt“ bedeutet, dass eine ausdrücklich genannte Grenze gilt oder die Abnahme am tatsächlichen Streaminggerät noch aussteht.

## Funktionsliste, jede Position ausdrücklich gekennzeichnet

| Nr. | Funktion | Umfang für 200 € | Hinweis / konkrete Grenze |
|---:|---|---|---|
| 01 | Drei Zonen links / Mitte / rechts | **enthalten** | Drei sichtbare HTML-Zonen; Arena, Glas und Minimal |
| 02 | Getrennte Bedienoberfläche und Overlay-Seite | **enthalten** | `/control`, `/overlay` |
| 03 | Transparenter Overlay-Hintergrund | **enthalten** | Transparentes `body` für OBS-Browserquelle |
| 04 | Full HD 1920×1080 | **enthalten** | Standardausgabe 1920×1080; OBS-Quelle entsprechend einstellen |
| 05 | Responsives Layout | **enthalten** | Desktop, Tablet, Smartphone; Browserquelle bei 1920×1080 |
| 06 | Logo hochladen | **enthalten** | PNG/JPEG/WebP, bis 2 MB |
| 07 | Logo austauschen / entfernen | **enthalten** | Wechsel und Löschung über Bedienteil |
| 08 | Markenname / Trainingstitel / Veranstaltungstitel | **enthalten** | Links editierbar |
| 09 | Untertitel / zusätzliche freie Texte | **enthalten** | Texte mit Zeilenumbrüchen |
| 10 | Schriftart links | **enthalten** | Vier systemeigene Schriftfamilien; keine Schriftlizenz |
| 11 | Textgröße und Farbe links | **enthalten** | GUI-Regler/Eingabe und Farbwahl |
| 12 | Ausrichtung links | **enthalten** | Links, mittig, rechts |
| 13 | Elemente links ein-/ausblenden | **enthalten** | Logo, Marke, Titel, Untertitel, Freitext |
| 14 | Countdown und Stoppuhr | **enthalten** | Exakte servergestützte Zeitberechnung |
| 15 | Start / Pause / Fortsetzen / Reset | **enthalten** | Per Bedienoberfläche und Tastatur |
| 16 | Timerdauer / Vorlaufzeit | **enthalten** | Vorlauf 0–600 Sek. |
| 17 | Runden/Intervalle | **enthalten** | 1–99 Runden, Arbeit/Pause |
| 18 | Arbeits-/Pausenzeiten | **enthalten** | 1–86400 / 0–86400 Sek. |
| 19 | Automatischer Wechsel Arbeit/Pause | **enthalten** | Konfigurierbare letzte Pause |
| 20 | Aktuelle Runde / aktuelles Intervall | **enthalten** | Mit Status-/Fortschrittsanzeige |
| 21 | Time Cap | **enthalten** | Kappe für Dauer der aktiven Phase(n) |
| 22 | Mehrere aufeinanderfolgende Intervalle | **enthalten** | Formel `2m+30+1:00` |
| 23 | Wiederholte Zeitfolgen / Klammern | **enthalten** | z. B. `4*(1m+30)`; max. 240 Abschnitte / 24 Std. |
| 24 | Timergröße und Timerfarben | **enthalten** | Konfigurierbare Farben und Textgröße |
| 25 | Grün–Gelb–Rot-Farbwechsel | **enthalten** | Per optionalem Ampelmodus; Restphase cyan |
| 26 | Signaltöne | **eingeschränkt enthalten** | WebAudio im Overlay; OBS-Audio und Zoom-Tonleitung nur nach Gerätetest |
| 27 | Tastaturkürzel | **enthalten** | Leertaste Start/Pause, R Reset, N nächster Abschnitt |
| 28 | WOD / Workout-Infos rechts | **enthalten** | Mehrzeiliger Freitext und Titel |
| 29 | Trainername / Hinweise rechts | **enthalten** | Direkt live bearbeitbar |
| 30 | Live-Uhr rechts | **enthalten** | Lokale Uhr des Anzeigecomputers, sprachabhängiges Format |
| 31 | Schriftart, Textgröße, Farbe, Ausrichtung rechts | **enthalten** | Vier Schriften, Größen, Farben, Ausrichtung |
| 32 | Rechts ein-/ausblenden | **enthalten** | WOD, Trainer, Hinweise, Uhr |
| 33 | Mittlere Elemente ein-/ausblenden | **enthalten** | Timer, Phasenname, Runden, Fortschritt, Caption, Time Cap |
| 34 | Zonenbreite anpassen | **enthalten** | Linke/rechte Breite per Regler; Mitte automatisch; Mindestbreite |
| 35 | Hintergrund-Deckkraft / vollständig transparente Panels | **enthalten** | Separate Transparenzoption für Zonenflächen |
| 36 | Ein-/Ausblendanimationen | **enthalten** | CSS-Fade-/Reveal; global abschaltbar |
| 37 | Smartphone-/Tablet-Fernsteuerung | **enthalten** | LAN mit SSE oder Netlify per HTTPS/Polling (~2,4 s), Steuerschlüssel notwendig |
| 38 | Layouts/Szenen speichern, laden, löschen | **enthalten** | Eingebaute Vorlagen + max. 20 Szenen, dauerhaft auf dem Server |
| 39 | Szenen-Backup exportieren/importieren | **eingeschränkt enthalten** | JSON v2 mit Logo-Deduplizierung; lokal 60 MB, Netlify max. 5,4 MB (zusätzlich Provider-6-MB-Limit) |
| 40 | Standardlayout wiederherstellen | **enthalten** | Erhält selbst gespeicherte Szenen |
| 41 | Oberfläche Deutsch/Englisch/Französisch | **enthalten** | UI und Timerphasen übersetzt |
| 42 | Oberfläche Spanisch/Italienisch/Portugiesisch | **enthalten** | Zusätzliche auswählbare Sprachpakete; Eigennamen/WOD werden nicht maschinell übersetzt |
| 43 | Lokal installieren / auf eigenem Server betreiben | **enthalten** | Lokal Node.js 20+ ohne Entwicklerkonto; Hosting auf kundeneigener Netlify-Instanz möglich, Nutzungskosten separat |
| 44 | Vollständiger editierbarer Quellcode / Assets | **enthalten** | Ohne Minifizierung oder Codeverschleierung |
| 45 | Automatisierte Tests | **enthalten** | Unit-/API-/Auth-/Backup-/UI-Tests plus isolierte Netlify-Blobs-Persistenz bei erfolgreichem CI-Run |
| 46 | Testbarer Prototyp | **enthalten** | Start per `npm start`, nicht von fremdem Hosting abhängig |
| 47 | OBS Browser Source | **eingeschränkt enthalten** | URL-/Auflösungs-/Alpha-Konfiguration dokumentiert; echter Kundengerätetest ist Teil der Abnahme |
| 48 | Streamlabs Browser Source | **eingeschränkt enthalten** | Standardbrowserquelle voraussichtlich kompatibel; versionsabhängiger Test beim Kunden |
| 49 | Zoom via OBS Virtual Camera (Video) | **eingeschränkt enthalten** | Standardweg dokumentiert; reale Zoom-Probe vor Endabnahme nötig |
| 50 | Timer-Audio in Zoom | **spätere Erweiterung** | Zusätzliche Audiotreiber-/Routing-Konfiguration je Betriebssystem und vorhandener Technik |
| 51 | Teilnehmernamen / Rangliste | **spätere Erweiterung** | Architektur lässt neue Datenfelder zu |
| 52 | Sponsor-Karussell / mehrere Sponsorlogos | **spätere Erweiterung** | Separate Daten-/Animationskomponente |
| 53 | Live-Chat / externe Datenfeeds | **spätere Erweiterung** | Zusätzliche API-/Providerintegration erforderlich |
| 54 | Internetbasierte Fernsteuerung / Cloud-Sync | **eingeschränkt enthalten** | Netlify über HTTPS und gemeinsamen Steuerschlüssel; komplexe Benutzerrollen sind spätere Erweiterung |
| 55 | Eigene Drag-and-Drop-Freiform-Positionierung | **spätere Erweiterung** | Zonenregler sind enthalten; freies Pixel-Dragging nicht |
| 56 | Marken-/Lizenz-/Rechteübergabe | **enthalten** | Verfahrensbeschreibung und Vertragsvorlage; tatsächliche Übertragung per schriftlicher Zahlungs-/Rechtevereinbarung |

## Festpreis und Zahlungsmeilensteine

| Meilenstein | Ziel-/Fertigstellungsfrist ab Startfreigabe | Abnahme/Lieferung | Zahlung nach Freigabe |
|---|---|---|---:|
| 1. Konzept | Arbeitstag 1 | Architektur, Funktionsmatrix, Termin- und Rechteentwurf | **20 €** |
| 2. Prototyp | Arbeitstag 2 | Drei Zonen, Countdown, Start/Pause/Reset, Logo, Texte, transparentes Overlay, Teststart | **70 €** |
| 3. Erweiterungen | Arbeitstage 3–4 | Intervalle/Formelparser, Mobilsteuerung, Szenen, sechs Sprachen, Farben/Animationen | **70 €** |
| 4. Tests & Übergabe | Arbeitstag 5* | Defektbehebung, Testprotokoll, Anleitungen, ZIP/Quellcode, OBS-/Zoom-Kundentest | **40 €** |
| | | **Gesamt** | **200 €** |

\* OBS/Zoom-Abnahme setzt Zugang zu einem geeigneten Test-PC mit installierten Anwendungen und einen Testtermin voraus. Eine im Voraus fehlende Testgelegenheit verlängert diesen Abnahmetermin, nicht automatisch die Entwicklungskosten. Keine Zahlungsfreigabe vor Prüfung der jeweiligen Lieferung.

## Kosten / rechtliche und technische Abgrenzung

- **Lokales Hosting:** **0 € laufende Softwarekosten**; eigener PC, Strom, Netzwerk und ggf. bereits vorhandene Internetverbindung sind kundenseitig.
- **Verwendete Laufzeit:** Node.js (frei); Browser, OBS Studio (frei); Zoom-Basiskonto je nach Nutzungsbedingungen/Meetinggrenzen. Kein Firebase-/Entwicklerkonto.
- **Optionaler externer Server:** Kosten variieren je Provider; typisch grob 5–15 €/Monat plus optionale Domain, HTTPS-/Sicherheitskonfiguration; **nicht erforderlich** für lokales Studio.
- **Ggf. getrennte Kosten:** Hardware, Kamera, Mikrofon, Virtual-Audio-Software/-Einrichtung, Hosting/domain, externe Sponsor-/Chat-APIs und nachträgliche Erweiterungen. Nichts davon wird stillschweigend in Rechnung gestellt.
- **Quellcode & Rechte:** siehe `LICENSE-AND-RIGHTS.md`. Bereits bestehende Komponenten und Node/OBS/Zoom-Rechte bleiben bei ihren Eigentümern. Ausschließliche Rechte an rechtlich übertragbarem individuell geschaffenem Code erfordern eine entsprechende schriftliche Vereinbarung, Zahlung und Rechtsprüfung. Ohne Entwicklerkonto-/Wartungsbindung.

## Antworten auf die Bewerberfragen

1. **Welche Umsetzung für 200 €?** Positionen 01–49 und 56 gemäß Tabelle (bei „eingeschränkt enthalten“ mit transparenter Grenze). Kernfunktionen haben Vorrang.
2. **Später selbst erweitern?** Ja: editierbare HTML/CSS/JS-Module, dokumentiertes API/State-Schema und Tests. Kein proprietärer Baukasten.
3. **OBS/Zoom-Erfahrung und Test?** Integration gemäß offiziellen Browser-Source-/Virtual-Camera-Schnittstellen aufgebaut; automatisierte App-Tests durchgeführt; eine physische OBS-/Zoom-Verifikation ist auf dem Kundengerät noch offen und muss dokumentiert werden. Keine unbelegte Live-Zoom-Erfolgsmeldung.
4. **Smartphone-Steuerung?** Ja, im selben lokalen Netzwerk mit zufällig erzeugtem Steuerschlüssel und SSE-Synchronisation.
5. **Rechteübergabe?** Lesbarer Code und Handover-Vorlage enthalten, vertragliche Rechteübertragung nach Zahlung schriftlich festzuhalten.
6. **Hostingkosten?** Lokal keine wiederkehrenden Gebühren für die Kernsoftware; Server-/Domainkosten nur optional.
7. **Zeitplan?** Fünf Arbeitstage als angebotener Meilensteinplan ab Startfreigabe, mit Prüfung/Freigabe nach jedem Teil.


## Erweiterte UI-Funktionen aus dem Vergleichsprojekt (Release 1.1.0)

Diese im Code bereits implementierten Zusatzfunktionen werden ohne neue Drittanbieter-Lizenzen bereitgestellt: AMRAP, EMOM, Tabata, For Time, Zeitformeln mit Work/Rest-Paaren und Wiederholungen, Intervall-zurück, Heat-/Teilnehmerlabel, ein Sponsorenlogo, Lauftext, Hintergrund-Verläufe und Textschatten, 12-/24-Stunden-Uhr, Schwarz-/Greenscreen-Overlay, Warnschwellen und Tonlautstärke, Quick-Mode-Schaltflächen, Timer-only-Szene sowie separate Smartphone-Fernbedienung. In der ursprünglichen Kalkulation gelten sie als **kostenneutral zusätzlich im Quellcode enthalten**. Der vereinbarte Festpreis von 200 € erhöht sich nicht.

**Nicht enthalten / spätere Erweiterung:** WebRTC mit Kamera/Mikrofon, öffentliche Cloud-Räume, Datenbank-/Login-Infrastruktur, Zuschauer-Live-Video, Sponsorenkarussell, komplette Teilnehmerliste und Drittanbieter-Chat. Die tatsächliche Zoom-Übertragung auf Kundenhardware bleibt Abnahmevoraussetzung.


## Release 2.0 — nachgetragene Leistungsabgrenzung

- **Enthalten:** Drei visuelle Stile (Arena/Wettkampf, Glas/Studio, Minimal), Kreis-Timer mit nächster Phase, sechs Sprachen, Netlify-Fernsteuerung per HTTPS und Schutzschlüssel, Backup v2 mit Logo-Deduplizierung, automatisierte isolierte QA-Persistenzprüfungen und lesbarer Quellcode.
- **Eingeschränkt enthalten:** Netlify-Backupimport als JSON mit **5,4 MB HTTP-Limit** und zusätzlichem Netlify-6-MB-Payload-Limit; Einrichten von Audio in OBS nur dokumentiert; Internet-Fernsteuerung aktualisiert ca. alle 2,4 Sekunden, gespeicherte Änderungen letzter-Schreibvorgang-gewinnt.
- **Spätere Erweiterung:** Mehrere gleichzeitige redaktionelle Benutzer mit Konfliktsperren, ausfallsicherer Multi-Operator-Workflow, umfangreiche dynamische Sponsorverwaltung oder externer Chat, direkte Zoom-Audio-Mischung.
- **Vor Abnahme zwingend:** Reale OBS-Aufnahme, Zoom-Anruf mit zweitem Prüfer, Audio-/Mobilgerätetest, Rechtsprüfung und beidseitige Unterschriften. Quellcode kann keine tatsächliche Kamera-/Zoomprüfung oder rechtsgültige Unterzeichnung vortäuschen.
- **Hostingkosten:** Lokal ohne Pflichtabonnement; Netlify ist optional und unterliegt Paket-/Nutzungslimits (Funktionen, Blob-Speicher, Übertragung). Die Anwendung verlangt keine zusätzlichen bezahlten Bibliotheken; externer Dienstbetrieb kann Kosten verursachen.
- **Rechte:** vorhandene GNU-GPLv3-Lizenz und historische Nutzungsrechte müssen vor exklusiver Abtretung geklärt werden. Separate Dokumentation `LICENSE-RECONCILIATION.md`, `RIGHTS-HANDOVER-TEMPLATE-DE-EN.md`.
- **Budget/Milestones unverändert:** 20 € / 70 € / 70 € / 40 € = 200 €; Freigabe nur nach jeweiliger Prüfung und dokumentierter Vereinbarung.
