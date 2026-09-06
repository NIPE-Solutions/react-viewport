'use client'

import { useId } from 'react'

// Browser-native CSS baseline. No viewport subscription or geometry positioning.
export function Composer({ testId }: { readonly testId?: string }) {
  const id = useId()
  return (
    <form
      className="viewport-composer"
      style={{ position: 'static' }}
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
