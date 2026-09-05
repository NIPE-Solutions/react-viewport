# Changelog

All notable changes to this project are documented in this file.

## 0.1.0-alpha.0

Initial alpha release. The package provides:

- `useViewport` for layout and visual viewport state, keyboard occlusion,
  safe-area insets, orientation, and support flags.
- `ViewportProvider` for selecting an alternate window context.
- `useViewportCssVariables` for opt-in CSS custom properties.
- Server-safe snapshots, deterministic unit tests, browser fixtures, and package
  consumer verification.

The complete automated quality gate passed for this revision: 89 unit tests, 10
package checks and four packed consumers, 39 cross-engine library browser tests,
39 cross-engine documentation-site browser tests, and six verified static
documentation routes. See the
[`0.1.0-alpha.0` readiness report](docs/releases/0.1.0-alpha.0-readiness.md) for
the measured bundle, browser, documentation, and deployment evidence.

This is an alpha release. Physical-device validation remains pending and is
tracked in [`docs/REAL_DEVICE_QA.md`](docs/REAL_DEVICE_QA.md).
