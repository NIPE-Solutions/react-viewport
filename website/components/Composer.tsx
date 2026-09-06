'use client'

import { useId, type CSSProperties } from 'react'

interface ComposerProps {
  readonly keyboardHeight: number
  readonly safeAreaBottom: number
  readonly aware?: boolean
  readonly position?: 'fixed' | 'absolute'
  readonly testId?: string
}

// Simulation and Live Device Lab render this same form and positioning policy.
export function Composer({
  keyboardHeight,
  safeAreaBottom,
  aware = true,
  position = 'fixed',
  testId,
}: ComposerProps) {
  const id = useId()
  const bottomInset = aware ? Math.max(keyboardHeight, safeAreaBottom) : 0
  const style: CSSProperties = { position, bottom: `calc(${bottomInset}px + 1rem)` }

  return (
    <form
      className="viewport-composer"
      style={style}
      data-testid={testId}
      onSubmit={(event) => {
        event.preventDefault()
        event.currentTarget.reset()
      }}
    >
      <label htmlFor={id}>Message</label>
      <div>
        <input id={id} placeholder="Type a message…" autoComplete="off" />
        <button type="submit">Send</button>
      </div>
    </form>
  )
}
