/**
 * The website's visual plan is kept beside its content so future copy and UI
 * changes can be reviewed against the same constraints.
 *
 * Token rationale:
 * - cool paper #F4F7F8 keeps long technical passages bright without stark white;
 * - ink #15232D gives diagrams and prose one quiet, high-contrast foundation;
 * - coordinate blue #2257D6 identifies the layout and visual coordinate systems;
 * - safe-area cyan #18A6B7 makes protected insets legible without implying danger;
 * - keyboard coral #E2634D marks occlusion as a distinct, consequential region;
 * - muted grid #CAD6DC supplies scale and alignment without becoming decoration.
 *
 * Barlow gives headings and prose an engineered, spatial voice. IBM Plex Mono
 * is reserved for measurements and code. Both are self-hosted through
 * `next/font`, so reading the site makes no font request to a third party.
 *
 * The layout uses a left-aligned reading rail and a nested-coordinate-plane
 * hero. The plane is the only high-emphasis visual device. Generic phone
 * mockups, gradient blobs, repeated card grids, all-caps eyebrow labels, and
 * decorative motion were rejected because they do not explain geometry.
 */
export const designPlan = {
  colors: {
    paper: '#F4F7F8',
    ink: '#15232D',
    coordinate: '#2257D6',
    safeArea: '#18A6B7',
    keyboard: '#E2634D',
    grid: '#CAD6DC',
  },
  fonts: {
    text: 'Barlow',
    data: 'IBM Plex Mono',
  },
  alignment: 'left',
  emphasis: 'nested-coordinate-plane',
} as const

export const site = {
  name: '@nipe-solutions/react-viewport',
  title: 'React Viewport',
  description:
    'Reactive React geometry for layout viewports, visual viewports, soft keyboards, and safe areas.',
  origin: 'https://react-viewport.nipesolutions.com',
  repository: 'https://github.com/NIPE-Solutions/react-viewport',
  openSource: 'https://opensource.nipesolutions.com',
} as const

export const quickStart = `import { useViewport } from '@nipe-solutions/react-viewport'

export function ViewportReadout() {
  const viewport = useViewport()

  if (!viewport.ready || viewport.visual === null) {
    return <p>Measuring viewport…</p>
  }

  return (
    <p>
      Visible: {viewport.visual.width} × {viewport.visual.height}
    </p>
  )
}`

export const cssComposer = `.composer {
  position: fixed;
  right: max(1rem, var(--react-viewport-safe-area-right, 0px));
  --bottom-inset: max(
    var(--react-viewport-keyboard-height, 0px),
    var(--react-viewport-safe-area-bottom, 0px)
  );
  bottom: calc(var(--bottom-inset) + 1rem);
  left: max(1rem, var(--react-viewport-safe-area-left, 0px));
}`

export const modalActionBar = `import { useViewport } from '@nipe-solutions/react-viewport'

function ModalActions() {
  const { keyboard, safeArea } = useViewport()
  const bottomInset = Math.max(keyboard.height, safeArea.bottom)

  return <footer style={{ bottom: bottomInset }}>…</footer>
}`

export const visibleArea = `const { visual } = useViewport()
const visibleHeight = visual?.height ?? null`

export const cssSafeAreaFooter = `.footer {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}`

export const apiReference = [
  {
    name: 'useViewport()',
    signature: 'export declare function useViewport(): ViewportState;',
    description:
      'Subscribes to the current window, or to the window supplied by the nearest ViewportProvider.',
  },
  {
    name: 'useViewportCssVariables()',
    signature:
      'export declare function useViewportCssVariables(options?: ViewportCssVariablesOptions): void;',
    description:
      'Writes current geometry to options.target, or to the document root when target is omitted. The target can be an HTMLElement, a React ref, or null.',
  },
  {
    name: '<ViewportProvider>',
    signature: `export declare function ViewportProvider({ children, targetWindow, }: ViewportProviderProps): React.ReactNode;`,
    description:
      'Renders children and scopes descendants to targetWindow. Omitting targetWindow uses the global window; passing null intentionally selects the server snapshot.',
  },
] as const

export const typeReference = [
  {
    name: 'LayoutViewport',
    signature: `export interface LayoutViewport {
  readonly width: number;
  readonly height: number;
}`,
  },
  {
    name: 'VisualViewportState',
    signature: `export interface VisualViewportState {
  readonly width: number;
  readonly height: number;
  readonly offsetTop: number;
  readonly offsetLeft: number;
  readonly pageTop: number;
  readonly pageLeft: number;
  readonly scale: number;
}`,
  },
  {
    name: 'KeyboardState',
    signature: `export interface KeyboardState {
  readonly open: boolean;
  readonly height: number;
}`,
  },
  {
    name: 'SafeAreaInsets',
    signature: `export interface SafeAreaInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}`,
  },
  {
    name: 'ViewportOrientation',
    signature: `export type ViewportOrientation = 'portrait' | 'landscape';`,
  },
  {
    name: 'ViewportSupport',
    signature: `export interface ViewportSupport {
  readonly visualViewport: boolean;
  readonly virtualKeyboard: boolean;
}`,
  },
  {
    name: 'ViewportState',
    signature: `export interface ViewportState {
  readonly ready: boolean;
  readonly layout: LayoutViewport | null;
  readonly visual: VisualViewportState | null;
  readonly keyboard: KeyboardState;
  readonly safeArea: SafeAreaInsets;
  readonly orientation: ViewportOrientation | null;
  readonly supported: ViewportSupport;
}`,
  },
  {
    name: 'ViewportProviderProps',
    signature: `export interface ViewportProviderProps {
  readonly children: React.ReactNode;
  readonly targetWindow?: Window | null;
}`,
  },
  {
    name: 'ViewportCssVariablesOptions',
    signature: `export interface ViewportCssVariablesOptions {
  readonly target?: HTMLElement | React.RefObject<HTMLElement | null> | null;
}`,
  },
] as const

export const cssVariables = [
  '--react-viewport-layout-width',
  '--react-viewport-layout-height',
  '--react-viewport-visual-width',
  '--react-viewport-visual-height',
  '--react-viewport-visual-offset-top',
  '--react-viewport-visual-offset-left',
  '--react-viewport-visual-page-top',
  '--react-viewport-visual-page-left',
  '--react-viewport-scale',
  '--react-viewport-keyboard-height',
  '--react-viewport-safe-area-top',
  '--react-viewport-safe-area-right',
  '--react-viewport-safe-area-bottom',
  '--react-viewport-safe-area-left',
] as const

export const browserNotes = [
  {
    name: 'iOS Safari',
    detail:
      'VisualViewport measurements are used when the API exists. Soft-keyboard inference remains conservative and needs physical-device verification.',
  },
  {
    name: 'Android Chrome',
    detail:
      'VisualViewport and Virtual Keyboard capabilities are detected independently. Capability detection is not a universal support claim.',
  },
  {
    name: 'Installed PWA',
    detail:
      'Display mode and browser chrome can change the available geometry. Test the installed experience on the devices you support.',
  },
  {
    name: 'Embedded WebViews',
    detail:
      'Host applications can expose different viewport behavior. Treat host-level testing as required evidence.',
  },
] as const

export const legalSources = {
  verifiedOn: '2026-09-05',
  imprint: 'https://opensource.nipesolutions.com/impressum',
  privacy: 'https://opensource.nipesolutions.com/privacy',
} as const
