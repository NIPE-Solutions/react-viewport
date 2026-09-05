import { ViewportContext } from './context.js'
import type { ViewportProviderProps } from './types.js'

export function ViewportProvider({
  children,
  targetWindow,
}: ViewportProviderProps): React.ReactNode {
  return <ViewportContext value={targetWindow}>{children}</ViewportContext>
}
