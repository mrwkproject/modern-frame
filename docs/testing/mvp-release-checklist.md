# MVP release checklist

Status: **Pending manual execution**. Record device, browser, production/staging URL, tester, timestamp, and evidence. Automated CI does not complete this checklist.

## Host setup

- [ ] Register and verify authentication.
- [ ] Log in, create a workspace, and confirm tenant navigation.
- [ ] Create an event, review settings, and activate it.
- [ ] Open/download the QR and confirm it encodes the production HTTPS join URL.

## Guest A — single photo

- [ ] Scan QR, join, and reach the capture hub.
- [ ] Open Single Photo, allow camera, capture, and retake once.
- [ ] Select a frame and verify preview.
- [ ] Download locally.
- [ ] Save to event; observe Preparing → Uploading → Finishing → Saved.
- [ ] Open gallery and verify the framed photo appears.

## Guest B — three-shot booth

- [ ] Join from a separate browser/device/session.
- [ ] Capture three ordered photos and retake one.
- [ ] Retake all once and complete a new sequence.
- [ ] Choose a strip layout and download locally.
- [ ] Save to event and verify the strip appears.

## Shared event gallery regression

- [ ] Guest A gallery shows both Guest A's framed photo and Guest B's strip.
- [ ] Guest B gallery shows both Guest A's framed photo and Guest B's strip.
- [ ] A valid guest from another event sees none of Event A's media.

## Host moderation

- [ ] Host gallery shows both ready outputs with short-lived previews.
- [ ] Hide one; both guest galleries stop showing it.
- [ ] Show it; both guest galleries show it again.
- [ ] Remove it; both guest galleries stop showing it permanently.
- [ ] Normal host gallery does not render failed, archived, or deleted objects.

## Ended event

- [ ] While active, capture works.
- [ ] End the event from the host workspace.
- [ ] Existing unexpired guest session can still open the gallery.
- [ ] Capture is blocked after ending.
- [ ] A new guest cannot create an ended-event session.

## Network recovery

- [ ] Save over a slow connection; progress remains understandable and download stays available.
- [ ] Interrupt during upload; retry gives a safe recovery path.
- [ ] Interrupt after upload/during finalize; retry finishes the same media ID.
- [ ] Confirm finalize retry does not create a duplicate gallery entry.

## Release evidence

- [ ] `pnpm format:check`, lint, typecheck, unit tests, Next.js build, and vinext build pass.
- [ ] Supabase reset/migrations and every pgTAP test pass in CI or a local container runtime.
- [ ] Production environment validation passes.
- [ ] `/api/health` returns only safe availability status.
- [ ] Physical-device matrix results are recorded without inferring PASS from automation.
