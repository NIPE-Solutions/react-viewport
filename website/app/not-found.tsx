import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="docs-main site-frame">
      <h1>Page not found</h1>
      <p>This route does not exist.</p>
      <p>
        <Link href="/">Return to the overview</Link>
      </p>
      <p>
        <Link href="/lab">Open the Device Lab</Link>
      </p>
    </main>
  )
}
