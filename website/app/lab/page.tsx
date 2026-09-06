import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DeviceLab } from '../../components/DeviceLab'

export const metadata: Metadata = {
  title: 'Live Geometry Lab',
  description:
    'Observe live visual viewport, offsets, scale, keyboard occlusion and safe areas as React application data.',
  alternates: { canonical: '/lab' },
}
export default function LabPage() {
  return (
    <main id="main-content" tabIndex={-1} className="lab-main">
      <DeviceLab
        sources={[
          'DeviceLab.tsx',
          'LiveGeometry.tsx',
          'ResultBudget.tsx',
          'CoordinateVisibility.tsx',
          'geometry-logic.ts',
          'ZoomLogic.tsx',
        ].map((file) => ({
          label: `${file} · actual source`,
          code: readFileSync(path.join(process.cwd(), 'website/components', file), 'utf8'),
        }))}
        build={process.env.NEXT_PUBLIC_BUILD_SHA ?? 'local'}
      />
    </main>
  )
}
