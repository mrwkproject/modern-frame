# Camera device test matrix

Status: **Pending**. Prompt 07 does not claim physical-device execution.

Automated tests verify crop math, error classification, state transitions, stream cleanup, and application builds. They cannot prove camera quality or browser permission behavior. Run this matrix over HTTPS on physical devices before release; mark results only after actual testing.

The lifecycle implementation resets its mounted flag on every effect setup for React Strict Mode, invalidates in-flight permission requests when the page becomes hidden, and returns requesting, ready, or countdown states to idle. Capture failures release every active track before showing recovery UI.

| Device        | OS  | Browser | Permission allow | Permission deny | Rear/front switch | Capture    | Retake     | Rotate     | Camera stops on leave | Result  | Notes                                                                 |
| ------------- | --- | ------- | ---------------- | --------------- | ----------------- | ---------- | ---------- | ---------- | --------------------- | ------- | --------------------------------------------------------------------- |
| iPhone        | TBD | Safari  | Not tested       | Not tested      | Not tested        | Not tested | Not tested | Not tested | Not tested            | Pending | Verify `playsInline`, safe areas, and memory across repeated retakes. |
| Android phone | TBD | Chrome  | Not tested       | Not tested      | Not tested        | Not tested | Not tested | Not tested | Not tested            | Pending | Verify camera selection and back-navigation cleanup.                  |
| Desktop       | TBD | Chrome  | Not tested       | Not tested      | If available      | Not tested | Not tested | Not tested | Not tested            | Pending | Test integrated and USB webcams.                                      |
| Mac           | TBD | Safari  | Not tested       | Not tested      | If available      | Not tested | Not tested | Not tested | Not tested            | Pending | Confirm HTTPS/localhost secure-context behavior.                      |

For every device, also verify unsupported/no-camera and camera-busy recovery where practical. Confirm the captured JPEG matches the visible 3:4 crop, no microphone permission appears, raw captures never leave the device, only explicit final saves upload, rapid control taps do not open concurrent streams, and the OS camera indicator turns off after navigation.

## Three-shot photobooth scenarios

The following scenarios remain pending on every physical device listed above: automatic three-shot timing, front/rear switching before the sequence, shot ordering, single-shot retake, retake-all, renderer-generated layout preview, local strip download, leaving mid-countdown, leaving between shots, and confirmation that the OS camera indicator turns off. Also verify that the normal sequence requests permission once and keeps one stream active through all three shots. Automated CI does not mark any of these physical checks complete.

## Prompt 08 release additions

For iPhone Safari, Android Chrome, Desktop Chrome, and macOS Safari where available, also verify frame preview, local single-photo download, Save to Event, strip layout/download, shared gallery display, screen rotation, navigation cleanup, and that the camera indicator stops. Record permission allow and deny separately.

Repeat Save to Event on a slow network, interrupt once during upload, and interrupt once during finalize. Retry must remain understandable, keep local download available, and avoid duplicate gallery entries after an ambiguous finalize response. All of these cases remain **Pending** until executed on physical hardware.

## Video Booth Foundation scenarios

Video Booth is local-only, requests no microphone, limits one recording to eight seconds, and negotiates the recording container at runtime. Container and codec availability can vary by browser and OS version; never infer support from a user-agent string or rename WebM as MP4.

Run the following separately on physical iPhone Safari and Android Chrome. Every item remains **Pending**:

- [ ] `MediaRecorder` availability is detected without crashing.
- [ ] Start camera from an explicit tap and confirm no microphone prompt appears.
- [ ] Rear preview and front/rear switching work before recording.
- [ ] Record automatically stops at eight seconds.
- [ ] Manual Stop produces a playable preview.
- [ ] Preview playback uses the actual recorded container.
- [ ] Retake discards the previous clip and does not retain its object URL.
- [ ] Download filename extension matches the actual Blob MIME type.
- [ ] Leaving while recording safely discards the incomplete recording.
- [ ] Hiding the page while recording safely cancels it.
- [ ] OS camera indicator stops after leaving Video Booth.

Record exact device, OS, browser version, observed MIME/container, and evidence in `docs/testing/staging-qa-report.md`. Video upload and gallery persistence are outside this foundation and must not be tested as implemented features.
