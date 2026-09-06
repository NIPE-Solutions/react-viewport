'use client'

import { useId, useState } from 'react'

interface CodeBlockProps {
  readonly code: string
  readonly label: string
  readonly collapsible?: boolean
}

export function CodeBlock({ code, label, collapsible = false }: CodeBlockProps) {
  const id = useId()
  const [open, setOpen] = useState(!collapsible)
  const [status, setStatus] = useState('')

  return (
    <figure className="code-block">
      <figcaption>
        <span>{label}</span>
        {collapsible && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen(!open)}
          >
            {open ? 'Hide code' : 'Show code'}
          </button>
        )}
      </figcaption>
      <div id={id} hidden={!open}>
        <button
          type="button"
          className="copy-code"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code)
              setStatus('Code copied')
            } catch {
              setStatus('Clipboard unavailable. Select and copy the code below.')
            }
          }}
        >
          Copy code
        </button>
        <span role="status">{status}</span>
        <pre tabIndex={0}>
          <code>{code}</code>
        </pre>
      </div>
    </figure>
  )
}
