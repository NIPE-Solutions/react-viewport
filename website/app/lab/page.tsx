import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { DeviceLab } from '../../components/DeviceLab'

export const metadata: Metadata = {
  title: 'Live Device Lab',
  description:
    'Test React Viewport against your actual browser, software keyboard and screen geometry.',
  alternates: { canonical: '/lab' },
}

export default function LabPage() {
  const source = (file: string) =>
    readFileSync(path.join(process.cwd(), 'website/components', file), 'utf8')
  return (
    <main id="main-content" tabIndex={-1} className="lab-main">
      <DeviceLab
        code={source('DeviceLab.tsx')}
        composerCode={source('Composer.tsx')}
        build={process.env.NEXT_PUBLIC_BUILD_SHA ?? 'local'}
      />
    </main>
  )
}
