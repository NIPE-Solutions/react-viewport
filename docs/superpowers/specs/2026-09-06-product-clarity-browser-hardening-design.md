# Product Clarity and Browser Hardening Design

## Purpose

React Viewport will explain its practical value before teaching browser terminology, correct every documented keyboard and safe-area composition recipe, and align native VirtualKeyboard handling with the package's bottom-occlusion contract. This is a focused alpha hardening pass, not a redesign or public API expansion.

## Product boundary

React Viewport measures and exposes browser geometry. Applications choose layout policy. The package remains independent of breakpoints, device detection, focus management, keyboard dismissal, scroll locking, modal behavior, and overlay frameworks.

No public export is added or removed. Raw `safeArea` measurements remain the values exposed by CSS environment variables. The package never changes `navigator.virtualKeyboard.overlaysContent`.

## Product story and page flow

The homepage will lead with “Know what part of the screen is actually usable.” Its first proof is a chat composer whose position and readout come from the real `useViewport()` snapshot. On desktop, any keyboard demonstration is explicitly labelled “Simulated keyboard” and kept separate from live browser measurements.

The homepage order is:

1. concrete composer problem, current library values, and minimal hook code;
2. an early “Do I need React Viewport?” decision section;
3. representative application examples;
4. the plain-language geometry mental model;
5. “Viewport geometry you can reason about” and the existing simulator;
6. browser evidence and links to reference material.

CSS-first guidance is prominent. `100dvh`, `env(safe-area-inset-bottom)`, media queries, and container queries are recommended when JavaScript geometry is unnecessary.

The existing visual identity remains: Barlow and IBM Plex Mono, cool paper, coordinate blue, safe-area cyan, keyboard coral, left-aligned reading rail, and nested coordinate planes. The memorable visual changes from an abstract hero plane to the concrete composer interaction. The simulator retains its current design and moves lower in the information hierarchy.

## Documentation information architecture

Primary navigation becomes:

- Overview
- Examples
- Concepts
- API
- Browser behavior
- Project

The `/guides` page is deleted without a redirect, per project-owner direction. Its useful content moves to focused sections under Concepts, Browser behavior, API, and Project.

Examples contains:

- chat composer;
- modal action bar;
- visible-area calculation;
- CSS-variable bridge;
- safe-area-only CSS alternative.

Concepts contains:

- plain-language layout, visual, keyboard-occlusion, and safe-area definitions;
- Keyboard and safe area;
- Viewport geometry and the simulator;
- SSR and hydration;
- performance and shared-store behavior;
- “What not to do.”

The API page documents meaning, coordinate system, readiness, source/fallback, and non-meaning for each field. Browser behavior separates API availability, fallback behavior, automated evidence, and physical-device status.

## Hero data model

The hero uses `useViewport()` for live values. The real snapshot supplies visual height, keyboard state, keyboard occlusion, and safe-area bottom. A compact desktop-only or user-triggered simulated-keyboard presentation may illustrate the use case, but it has its own labelled state and never overwrites or masquerades as live geometry.

The hero code connects problem to API directly:

```tsx
const { visual, keyboard, safeArea } = useViewport()
```

The visual includes a concise accessible summary rather than exposing decorative geometry labels to assistive technology. Interaction remains keyboard accessible and respects reduced motion.

## Raw geometry and layout policy

`safeArea.bottom` is the raw measured CSS environment inset. `keyboard.height` is reported or inferred bottom keyboard occlusion. Neither value is rewritten to compensate for a browser bug.

For bottom UI, documentation uses:

```ts
const bottomInset = Math.max(keyboard.height, safeArea.bottom)
```

and the equivalent CSS:

```css
--bottom-inset: max(
  var(--react-viewport-keyboard-height, 0px),
  var(--react-viewport-safe-area-bottom, 0px)
);
```

Keyboard and safe area are overlapping bottom constraints, not values to add blindly. With the keyboard closed, the safe area wins. With a bottom-occluding keyboard open, keyboard occlusion wins. This remains correct both when WebKit keeps a stale non-zero inset and when a browser reports zero while the keyboard is open.

WebKit bug 217754 is recorded as upstream evidence. The project documents the browser behavior and composition policy without browser sniffing or corrupting raw safe-area state.

## Keyboard semantics

`keyboard.open` means the library has sufficient evidence that a software keyboard is visible. It is not equivalent to focus, viewport shrinkage, or positive bottom occlusion alone.

`keyboard.height` means bottom viewport occlusion attributed to that software keyboard. It is not the physical keyboard's arbitrary rectangle height. `open: true, height: 0` is valid when authoritative native geometry reports a visible keyboard that intersects the viewport but does not occlude its bottom edge, such as a floating keyboard.

The fallback remains conservative. It requires an editable focus, approximately unit scale, keyboard-sized reduction from a closed baseline, and sufficient current bottom occlusion. Browser chrome, zoom, and hardware-keyboard-like focus remain closed. False negatives are preferable to false-positive layout movement.

The canonical visual bottom-occlusion formula remains:

```ts
Math.max(0, layoutHeight - (visualOffsetTop + visualHeight))
```

No implementation or example may substitute `layoutHeight - visualHeight` where bottom occlusion is intended.

## Native VirtualKeyboard geometry

The VirtualKeyboard specification defines `boundingRect` as the intersection between the on-screen keyboard and the document viewport in client coordinates. API object presence only means the capability exists; documentation does not claim that native overlay geometry is active or universally reliable.

Native state is derived in two stages:

1. A finite, positive-area rectangle intersecting the layout viewport establishes `open: true`.
2. Bottom occlusion is the height of the intersection only when that intersection reaches the layout viewport's bottom edge; otherwise height is zero.

Horizontal width does not determine the inset magnitude. A bottom-attached partial-width rectangle can still create bottom occlusion for the package's scalar contract; documentation notes that the scalar cannot describe segmented or arbitrary-shape avoidance. A non-intersecting or empty rectangle reports closed.

`overlaysContent` is read only if useful for documentation or diagnostics; it is never assigned by import, hook, provider, or store activation. No v1 opt-in setter is added.

## Simulator

The existing coherent scenarios remain: Normal, Browser chrome, Soft keyboard, Shifted keyboard, Zoom, and Custom. The simulator moves under Concepts and receives short explanations answering what changed, why, and whether the keyboard is considered open.

Preset scenarios retain one source of truth and cannot create contradictory geometry. Custom mode remains permissive with explicit inconsistency warnings. Live browser state and simulated state remain visually and semantically separate.

## Testing strategy

Implementation follows test-driven development. Regression coverage includes:

- bottom occlusion includes `offsetTop` and clamps to zero;
- fallback normal, browser chrome, soft keyboard, shifted viewport, zoom, small reduction, and hardware-keyboard-like focus;
- native hidden, bottom-attached, floating, partial-width, invalid, and non-intersecting rectangles;
- no implicit `overlaysContent` mutation;
- current-WebKit-like `max(326, 34) = 326`;
- future-fixed-browser `max(326, 0) = 326`;
- closed keyboard `max(0, 34) = 34`;
- CSS-variable composer positioning without double counting;
- modal action-area positioning;
- hero live/simulated labels and API values;
- all public routes, responsive overflow, keyboard navigation, reduced motion, and accessibility;
- shared listener lifecycle, event batching, safe-area probe ownership, alternate-window ownership, SSR, and hydration.

Deterministic Playwright suites run in Chromium, Firefox, and WebKit. They establish implementation behavior, not physical mobile compatibility.

## Documentation and evidence

The README first screen mirrors the homepage story and links early to CSS alternatives, Keyboard and safe area, and Browser behavior. Browser notes add WebKit 217754 with observed behavior, impact, application guidance, evidence, and removal condition. Real-device QA adds explicit WebKit stale-inset reproduction and composer/modal checks.

SEO title becomes “React Viewport — Visual viewport, keyboard and safe-area geometry for React.” The description avoids universal-detection claims. OpenGraph artwork uses the established visual language and connects layout viewport, visual viewport, bottom occlusion, and composer.

The footer retains GitHub, Changelog, Security, License, NIPE Open Source, Imprint, and Privacy.

## Error handling and compatibility

Absent optional browser APIs continue to degrade to documented fallbacks without warnings. Invalid native rectangles degrade to a closed zero-height keyboard. SSR continues to expose the stable unready snapshot with null layout/visual geometry. Cross-origin windows remain unsupported because their documents cannot be measured.

The package stays at zero runtime dependencies beyond React peers. No user-agent detection or browser-specific runtime branch is introduced.

## Release recommendation

Passing deterministic unit, type, package, build, accessibility, Chromium, Firefox, and WebKit checks supports **ALPHA READY**. Beta remains blocked until meaningful iPhone Safari and Android Chrome manual keyboard, chrome, orientation, modal, composer, scroll, and safe-area evidence is recorded. iPad floating/split and hardware-keyboard evidence remains an important additional validation target.
