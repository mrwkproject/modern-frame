# Camera device test matrix

Automated tests verify crop math, error classification, state transitions, stream cleanup, and application builds. They cannot prove camera quality or browser permission behavior. Run this matrix over HTTPS on physical devices before release; mark results only after actual testing.

The lifecycle implementation resets its mounted flag on every effect setup for React Strict Mode, invalidates in-flight permission requests when the page becomes hidden, and returns requesting, ready, or countdown states to idle. Capture failures release every active track before showing recovery UI.

| Device        | OS  | Browser | Permission allow | Permission deny | Rear/front switch | Capture    | Retake     | Rotate     | Camera stops on leave | Result  | Notes                                                                 |
| ------------- | --- | ------- | ---------------- | --------------- | ----------------- | ---------- | ---------- | ---------- | --------------------- | ------- | --------------------------------------------------------------------- |
| iPhone        | TBD | Safari  | Not tested       | Not tested      | Not tested        | Not tested | Not tested | Not tested | Not tested            | Pending | Verify `playsInline`, safe areas, and memory across repeated retakes. |
| Android phone | TBD | Chrome  | Not tested       | Not tested      | Not tested        | Not tested | Not tested | Not tested | Not tested            | Pending | Verify camera selection and back-navigation cleanup.                  |
| Desktop       | TBD | Chrome  | Not tested       | Not tested      | If available      | Not tested | Not tested | Not tested | Not tested            | Pending | Test integrated and USB webcams.                                      |
| Mac           | TBD | Safari  | Not tested       | Not tested      | If available      | Not tested | Not tested | Not tested | Not tested            | Pending | Confirm HTTPS/localhost secure-context behavior.                      |

For every device, also verify unsupported/no-camera and camera-busy recovery where practical. Confirm the captured JPEG matches the visible 3:4 crop, no microphone permission appears, no image leaves the device, rapid control taps do not open concurrent streams, and the OS camera indicator turns off after navigation.
