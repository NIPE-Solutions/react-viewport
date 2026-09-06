import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { BrowserCssLab } from '../../../components/BrowserCssLab'

export const metadata: Metadata = {
  title: 'Browser + CSS baseline',
  description: 'Compare browser-managed keyboard resizing with the measured Device Lab fallback.',
  alternates: { canonical: '/lab/css' },
}

export default function BrowserCssPage() {
  const source = (file: string) =>
    readFileSync(path.join(process.cwd(), 'website/components', file), 'utf8')
  return (
    <main id="main-content" tabIndex={-1} className="browser-css-main">
      <BrowserCssLab code={source('BrowserCssLab.tsx')} css={source('BrowserCssLab.css')} />
    </main>
  )
}
