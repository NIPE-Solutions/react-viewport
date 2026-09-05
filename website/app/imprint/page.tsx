import type { Metadata } from 'next'

import { legalSources } from '../../content/docs'

export const metadata: Metadata = {
  title: 'Imprint',
  description: 'Verified provider-information source for this NIPE open-source project.',
  alternates: { canonical: '/imprint' },
}

export default function ImprintPage() {
  return (
    <main id="main-content" tabIndex={-1} className="legal-main">
      <article className="site-frame legal-document">
        <h1>Imprint</h1>
        <p className="legal-introduction">
          Provider, media-owner, and publisher information is maintained on the official NIPE Open
          Source legal page.
        </p>
        <p>
          <a className="primary-action" href={legalSources.imprint} rel="noreferrer">
            Read the official NIPE Impressum
          </a>
        </p>
        <aside className="source-annotation">
          <strong>Legal source annotation</strong>
          <p>
            Verified against <a href={legalSources.imprint}>{legalSources.imprint}</a> on{' '}
            {legalSources.verifiedOn}. No provider details are duplicated here.
          </p>
        </aside>
      </article>
    </main>
  )
}
