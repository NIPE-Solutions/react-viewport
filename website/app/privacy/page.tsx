import type { Metadata } from 'next'

import { legalSources } from '../../content/docs'

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Verified privacy-information source for this NIPE open-source project.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <main id="main-content" tabIndex={-1} className="legal-main">
      <article className="site-frame legal-document">
        <h1>Privacy</h1>
        <p className="legal-introduction">
          The authoritative privacy notice is maintained on the official NIPE Open Source site. This
          documentation build installs no analytics dependency.
        </p>
        <p>
          <a className="primary-action" href={legalSources.privacy} rel="noreferrer">
            Read the official privacy notice
          </a>
        </p>
        <aside className="source-annotation">
          <strong>Legal source annotation</strong>
          <p>
            Verified against <a href={legalSources.privacy}>{legalSources.privacy}</a> on{' '}
            {legalSources.verifiedOn}. No legal terms are paraphrased here.
          </p>
        </aside>
      </article>
    </main>
  )
}
