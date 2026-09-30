# Changelog

## 1.0.0

First stable release of the existing geometry API, with React 18.3 and 19 support.

- Protect safe-area measurements from conflicting global CSS.
- Reacquire inactive window stores after document replacement.
- Detect editable focus inside nested open shadow roots.
- Verify the retained package in installed consumers before staged publication.

Active-scope navigation and closed shadow-root focus remain unsupported.
Physical-device QA remains pending.

## 0.1.0-alpha.0

Initial release of `useViewport`, `ViewportProvider`, and `useViewportCssVariables`.
See the [readiness report](docs/releases/0.1.0-alpha.0-readiness.md).

Physical-device validation is tracked in [`docs/REAL_DEVICE_QA.md`](docs/REAL_DEVICE_QA.md).
