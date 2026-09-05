interface CodeBlockProps {
  readonly code: string
  readonly label: string
}

export function CodeBlock({ code, label }: CodeBlockProps) {
  return (
    <figure className="code-block">
      <figcaption>{label}</figcaption>
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
    </figure>
  )
}
