# Staging QA report

Complete this report only with observations from the actual staging deployment and physical devices. Leave unexecuted checks as **Pending**; CI or desktop emulation is not evidence of mobile camera behavior.

## Test record

- Staging URL: Pending
- Commit: Pending
- Date: Pending
- Tester: Pending

## iPhone

- Model: Pending
- iOS: Pending
- Safari: Pending
- Result: **Pending**

### iPhone checklist

- [ ] QR scan
- [ ] Camera permission allowed
- [ ] Camera permission denied, then retried
- [ ] Rear camera preview
- [ ] Front camera preview and camera switching
- [ ] Single capture
- [ ] Retake
- [ ] Frame selection and preview
- [ ] Local download
- [ ] Save to Event
- [ ] Gallery displays the saved single photo
- [ ] Three-shot sequence
- [ ] Retake photo 2
- [ ] Retake all
- [ ] Layout selection
- [ ] Strip download
- [ ] Save strip to Event
- [ ] Shared gallery displays both outputs
- [ ] Rotation/orientation remains usable
- [ ] Camera indicator stops after leaving capture

### iPhone Video Booth

- [ ] `MediaRecorder` availability detected
- [ ] Start camera without a microphone prompt
- [ ] Rear/front switching before recording
- [ ] Automatic stop at 8 seconds
- [ ] Manual stop
- [ ] Preview playback
- [ ] Retake
- [ ] Download with the actual container extension
- [ ] Leave while recording
- [ ] Camera indicator stops after leaving Video Booth
- Observed Blob MIME/container: Pending

## Android

- Model: Pending
- Android version: Pending
- Chrome: Pending
- Result: **Pending**

### Android checklist

- [ ] QR scan
- [ ] Camera permission allowed
- [ ] Camera permission denied, then retried
- [ ] Rear camera preview
- [ ] Front camera preview and camera switching
- [ ] Single capture
- [ ] Retake
- [ ] Frame selection and preview
- [ ] Local download
- [ ] Save to Event
- [ ] Gallery displays the saved single photo
- [ ] Three-shot sequence
- [ ] Retake photo 2
- [ ] Retake all
- [ ] Layout selection
- [ ] Strip download
- [ ] Save strip to Event
- [ ] Shared gallery displays both outputs
- [ ] Rotation/orientation remains usable
- [ ] Camera indicator stops after leaving capture

### Android Video Booth

- [ ] `MediaRecorder` availability detected
- [ ] Start camera without a microphone prompt
- [ ] Rear/front switching before recording
- [ ] Automatic stop at 8 seconds
- [ ] Manual stop
- [ ] Preview playback
- [ ] Retake
- [ ] Download with the actual container extension
- [ ] Leave while recording
- [ ] Camera indicator stops after leaving Video Booth
- Observed Blob MIME/container: Pending

## Two-device shared gallery

- Result: **Pending**
- [ ] Device A joins Event X and saves a Single Photo.
- [ ] Device B joins Event X in a separate session and saves a three-shot strip.
- [ ] Device A gallery displays both outputs.
- [ ] Device B gallery displays both outputs.

## Host moderation

- Result: **Pending**
- [ ] Host gallery displays both ready outputs.
- [ ] Hiding Device A's photo removes it from both guest galleries.
- [ ] Showing Device A's photo restores it to both guest galleries.
- [ ] Removing Device A's photo permanently removes it from both guest galleries.

## Ended event

- Result: **Pending**
- [ ] Capture works while the event is active.
- [ ] Existing unexpired guest session can view the gallery after the host ends the event.
- [ ] Existing guest capture is blocked after the event ends.
- [ ] A fresh browser cannot create a new session for the ended event.

## Network recovery

- Result: **Pending**
- [ ] Interrupt Save to Event during upload, retry, and confirm safe recovery.
- [ ] Interrupt after upload during finalize, then retry.
- [ ] Finalize retry uses the same pending media ID.
- [ ] No duplicate gallery entry appears.

## Evidence

Record screenshots, screen recordings, browser versions, timestamps, and concise notes without including guest cookies, tokens, IP addresses, keys, or other secrets.

- Evidence links/paths: Pending
- Notes: Pending
