# Design system

Modern Frame uses a warm neutral canvas, ink primary actions, and a restrained ochre accent. The visual direction is editorial and photography-led: generous whitespace, solid surfaces, modest radii, sparse shadows, and serif display type paired with a practical system sans. It avoids generic purple gradients, excessive glass, glow, and ornamental animation.

Tokens live in `src/app/globals.css`: background/surface, foreground/muted, border, primary, accent, semantic success/warning/destructive colors, and three radii. Components consume semantic variables rather than raw colors where practical.

Guest views use dark, immersive, one-handed layouts with 44px-plus controls and safe-area padding. Host views emphasize hierarchy, navigation, and scan-friendly data. Both require semantic HTML, visible labels/focus, keyboard operation, 4.5:1 text contrast, responsive layouts at 375/390/430 and 768/1024/1440 widths, and reduced-motion support.

Motion is optional and must communicate state—countdown, shutter, progress, or layout change. Never delay capture. Reuse internal primitives before adapting outside patterns from 21st.dev; all adopted work must use these tokens and accessibility rules.
