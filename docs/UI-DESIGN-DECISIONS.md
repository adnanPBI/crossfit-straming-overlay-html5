# Arena UI design rationale

The submitted contest screenshots show an effective information hierarchy: compact branding left, a prominent circular timer, workouts/coaches right, and a controller separate from the output. WOD Stream Studio 2.0 reimplements that **general approach with original CSS/HTML**, not copied contestant source, trademarks or graphics.

1. **Arena (default):** circle countdown/progress gradient in the middle, separate next-phase strip, restrained floating upper-frame identity and WOD panels, leaving the lower ~40% of a 1920×1080 video transparent for a live camera.
2. **Glass:** retains the original full-height glass/studio layout for backward compatibility.
3. **Minimal:** lightweight scene with simplified chrome. Existing Timer-only preset remains available.
4. Accessibility: every theme uses semantic zones, accessible labels and state-driven text rather than transferring control actions to the overlay; the OBS source itself is read-only.
5. The client can edit theme, zone widths, colors, font, opacity, WOD, event labels and optional sponsor via the six-language control page.

The 1920×1080 result was rendered in offline headless Chromium with transparent HTML background and inspected visually. That is **not** a capture of a real OBS stream or proof of Zoom compatibility.
