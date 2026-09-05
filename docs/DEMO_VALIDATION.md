# Geometry demo validation

This checklist verifies simulator semantics. It does not replace physical-device
QA or prove mobile browser behavior.

- **Normal:** visual geometry equals layout geometry and keyboard occlusion is
  `0`.
- **Browser chrome:** visual geometry differs and keyboard occlusion remains
  `0`.
- **Soft keyboard:** layout height `800`, visual offset top `0`, and visual
  height `500` produce `300` pixels of bottom and keyboard occlusion.
- **Shifted keyboard:** layout height `800`, visual offset top `28`, and visual
  height `472` produce `300` pixels of bottom and keyboard occlusion, never
  `328`.
- **Zoom:** scale differs from `1`, the visual viewport is smaller, and keyboard
  occlusion remains `0`.
- **Custom:** contradictory keyboard and visual geometry remains editable and
  produces a visible warning.

The canonical derived value is:

```ts
Math.max(0, layoutHeight - (visualOffsetTop + visualHeight))
```

Automated equivalents live in `test/unit/geometry-simulation.test.ts` and
`e2e/website.spec.ts`.
