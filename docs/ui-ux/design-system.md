# Design system

Modern Frame uses a warm neutral canvas, ink primary actions, and a restrained ochre accent. The visual direction is editorial and photography-led: generous whitespace, solid surfaces, modest radii, sparse shadows, and serif display type paired with a practical system sans. It avoids generic purple gradients, excessive glass, glow, and ornamental animation.

Tokens live in `src/app/globals.css`: background/surface, foreground/muted, border, primary, accent, semantic success/warning/destructive colors, and three radii. Components consume semantic variables rather than raw colors where practical.

Guest views use dark, immersive, one-handed layouts with 44px-plus controls and safe-area padding. Host views emphasize hierarchy, navigation, and scan-friendly data. Both require semantic HTML, visible labels/focus, keyboard operation, 4.5:1 text contrast, responsive layouts at 375/390/430 and 768/1024/1440 widths, and reduced-motion support.

Motion for React is installed and available, but it must communicate state—countdown, shutter, progress, or layout change. Prefer `useReducedMotion` and a complete non-animated state; never delay capture or make correctness depend on animation completion. No current screen is animated merely because the dependency exists.

UI UX Pro Max is installed at `.agents/skills/ui-ux-pro-max/` from `nextlevelbuilder/ui-ux-pro-max-skill`. Use its searchable guidance as a review aid after project requirements, security, accessibility, usability, performance, and this design system. Reuse internal primitives before adapting outside patterns from 21st.dev; all adopted work must use these tokens and accessibility rules.

QR presentation uses an unanimated, high-contrast SVG with a full quiet zone. Copy/download controls retain 44px minimum targets, at least 8px separation, visible keyboard focus, and text feedback. Guest joining remains a server redirect with no form or technical session UI, minimizing delay after a mobile scan.

The guest camera uses the immersive dark guest surface, a portrait 3:4 preview, explicit permission education, one-handed bottom controls, and product-safe error recovery. Countdown timing is deterministic rather than animation-driven. Captured and error headings receive focus, while live announcements remain sparse. Physical device verification follows `docs/testing/camera-device-matrix.md`.

Frame selection keeps the photo dominant in a stable 3:4 region. System templates use restrained warm/editorial treatments, horizontally scrollable semantic radio choices, explicit Selected text, visible focus, and 44px-plus actions. Preview and final output share renderer coordinates; completion receives focus and is announced without requiring motion. Frame generation itself is never animated.
